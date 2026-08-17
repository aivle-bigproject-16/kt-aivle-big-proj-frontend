import { useEffect, useMemo } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './Cell3DView.css'
import type { ImageMapping } from '../types'

// ─── 상수 ────────────────────────────────────────────────────────────────────

const DEFECT_COLOR = new THREE.Color('#e34948')
const DEFAULT_AZIMUTH = 45
const DEFAULT_ELEVATION = 20
const DEFAULT_BORDER = '#3a3f44'

/* 셀 자체의 물리적 크기는 항상 고정이다 — bbox도 이 좌표계 기준(절대 좌표, 픽셀 아님)의
   값으로 내려온다 */
const CELL_BOUNDS = { a: 100, b: 254, c: 871 }

// bounds 비율을 유지하며 최장 축을 MAX_SIZE로 정규화하는 스케일 계산
const MAX_SIZE = 20

function computeScale(bounds: { a: number; b: number; c: number }) {
  const maxBound = Math.max(bounds.a, bounds.b, bounds.c)
  const k = MAX_SIZE / maxBound
  return { sa: bounds.a * k, sb: bounds.b * k, sc: bounds.c * k, k }
}

// ─── imageMappings → 3D 결함 박스 계산 ───────────────────────────────────────
//
// CT 슬라이스(imageMapping) 하나마다 그 자체로 직육면체 하나를 만든다 — 슬라이스의
// axis 방향으로는 index/volume(1-based)로 정해지는 얇은 두께, 나머지 두 축
// 방향으로는 bbox(CELL_BOUNDS와 같은 절대 좌표계)의 폭/높이 그대로. 여러 슬라이스가
// 있으면 각각 독립된 박스로 만들어 겹쳐서 보여준다(합집합 — 서로 교차시키지 않음)

type Range = [number, number]

interface Box3 {
  x: Range
  y: Range
  z: Range
}

function clampRange([lo, hi]: Range, bound: number): Range {
  const clampedLo = Math.max(0, Math.min(bound, lo))
  const clampedHi = Math.max(0, Math.min(bound, hi))
  const minSize = bound * 0.02
  if (clampedHi - clampedLo < minSize) {
    const center = (clampedLo + clampedHi) / 2
    return [Math.max(0, center - minSize / 2), Math.min(bound, center + minSize / 2)]
  }
  return [clampedLo, clampedHi]
}

/** 슬라이스 하나(axis + index/volume + bbox) → 3D 박스 하나. axis/index/volume이
   없으면(RGB, 또는 데이터 누락) null */
function boxFromMapping(m: ImageMapping): Box3 | null {
  if (!m.axis || m.index === undefined || m.volume === undefined || m.volume === 0) return null
  const { a, b, c } = CELL_BOUNDS
  const bound = m.axis === 'x' ? a : m.axis === 'y' ? b : c
  // 1-based index — index=1이면 스택의 첫 슬라이스
  const band: Range = [((m.index - 1) / m.volume) * bound, (m.index / m.volume) * bound]
  if (!m.imageWidth || !m.imageHeight) return null
  const planeH: Range = [
    (m.bbox.x / m.imageWidth),
    ((m.bbox.x + m.bbox.width) / m.imageWidth),
  ]
  const planeV: Range = [
    (m.bbox.y / m.imageHeight),
    ((m.bbox.y + m.bbox.height) / m.imageHeight),
  ]

  if (m.axis === 'x') return {
    x: clampRange(band, a),
    y: clampRange([planeH[0] * b, planeH[1] * b], b),
    z: clampRange([planeV[0] * c, planeV[1] * c], c),
  }
  if (m.axis === 'y') return {
    x: clampRange([planeH[0] * a, planeH[1] * a], a),
    y: clampRange(band, b),
    z: clampRange([planeV[0] * c, planeV[1] * c], c),
  }
  return {
    x: clampRange([planeH[0] * a, planeH[1] * a], a),
    y: clampRange([planeV[0] * b, planeV[1] * b], b),
    z: clampRange(band, c),
  }
}

// ─── 결함 박스 메시 ──────────────────────────────────────────────────────────

function DefectBox({ box }: { box: Box3 }) {
  const { a, b, c } = CELL_BOUNDS
  const { sa, sb, sc } = computeScale(CELL_BOUNDS)
  const size = useMemo<[number, number, number]>(
    () => [
      ((box.x[1] - box.x[0]) / a) * sa,
      ((box.y[1] - box.y[0]) / b) * sb,
      ((box.z[1] - box.z[0]) / c) * sc,
    ],
    [box, sa, sb, sc],
  )
  const center = useMemo<[number, number, number]>(
    () => [
      ((box.x[0] + box.x[1]) / 2 / a - 0.5) * sa,
      ((box.y[0] + box.y[1]) / 2 / b - 0.5) * sb,
      ((box.z[0] + box.z[1]) / 2 / c - 0.5) * sc,
    ],
    [box, sa, sb, sc],
  )
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), [size])

  return (
    <group position={center}>
      <mesh>
        <boxGeometry args={size} />
        {/* 면(mesh)과 테두리(lineSegments)가 정확히 같은 표면에 겹쳐 있으면 depth
           버퍼 정밀도 때문에 z-fighting이 나서 면이 깜빡이며 뒤가 비치는 것처럼
           보인다 — polygonOffset으로 면을 살짝 뒤로 밀어 테두리에 절대 안 가려지게 한다 */}
        <meshBasicMaterial
          color={DEFECT_COLOR}
          transparent={false}
          opacity={1}
          side={THREE.FrontSide}
          depthTest
          depthWrite
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color={DEFECT_COLOR} />
      </lineSegments>
    </group>
  )
}

// ─── 셀 외곽 와이어프레임 ─────────────────────────────────────────────────────

function CellBounds() {
  const { sa, sb, sc } = computeScale(CELL_BOUNDS)
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(sa, sb, sc)), [sa, sb, sc])
  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color="#7a8490" />
    </lineSegments>
  )
}

// ─── 카메라 초기 위치 설정 ────────────────────────────────────────────────────

interface CameraSetupProps {
  azimuth: number
  elevation: number
}

function CameraSetup({ azimuth, elevation }: CameraSetupProps) {
  const { camera } = useThree()
  useEffect(() => {
    const az = (azimuth * Math.PI) / 180
    const el = (elevation * Math.PI) / 180
    const r = 22
    camera.position.set(r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az))
    camera.lookAt(0, 0, 0)
  }, [camera, azimuth, elevation])
  return null
}

// ─── 3D 캔버스 — 검은 3D 영역에 들어가는 시각화 전용 부분 ─────────────────────

interface Cell3DCanvasProps {
  mappings: ImageMapping[]
}

/* 3D 렌더링 전용 — 내부에 어떤 텍스트도 넣지 않는다 */
function Cell3DCanvas({ mappings }: Cell3DCanvasProps) {
  const boxes = useMemo(
    () =>
      mappings
        .filter((m) => m.imageType === 'CT')
        .map(boxFromMapping)
        .filter((b): b is Box3 => b !== null),
    [mappings],
  )

  return (
    <div className="cell3d" style={{ '--cell3d-border': DEFAULT_BORDER } as React.CSSProperties}>
      <div className="cell3d__canvas-wrap">
        <Canvas camera={{ fov: 50, near: 0.1, far: 200 }}>
          <CameraSetup azimuth={DEFAULT_AZIMUTH} elevation={DEFAULT_ELEVATION} />
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 10]} intensity={0.8} />
          <CellBounds />
          {boxes.map((box, i) => (
            <DefectBox key={i} box={box} />
          ))}
          <OrbitControls enablePan={false} minDistance={8} maxDistance={40} />
        </Canvas>
      </div>
    </div>
  )
}

export { Cell3DCanvas }
