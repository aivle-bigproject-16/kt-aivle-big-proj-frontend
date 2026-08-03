import { useRef, useMemo, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import './Cell3DView.css'
import type { CellDefectView, Severity } from '../types'

// ─── 상수 ────────────────────────────────────────────────────────────────────

const SEVERITY_BORDER: Record<Severity, string> = {
  HIGH: '#e34948',
  MEDIUM: '#eda100',
  LOW: '#1baf7a',
}

const SEVERITY_LABEL: Record<Severity, string> = {
  HIGH: '높음',
  MEDIUM: '보통',
  LOW: '낮음',
}

const POINT_COLOR_HIGH = new THREE.Color('#e34948')
const POINT_COLOR_MID = new THREE.Color('#eda100')
const POINT_COLOR_LOW = new THREE.Color('#1baf7a')

// area(신뢰도) 임계값으로 색상 결정
function areaToColor(area: number): THREE.Color {
  if (area >= 0.8) return POINT_COLOR_HIGH
  if (area >= 0.5) return POINT_COLOR_MID
  return POINT_COLOR_LOW
}

// ─── 점군 메시 ───────────────────────────────────────────────────────────────

interface PointCloudProps {
  points: [number, number, number, number][]
  bounds: { a: number; b: number; c: number }
}

// bounds 비율을 유지하며 최장 축을 MAX_SIZE로 정규화하는 스케일 계산
const MAX_SIZE = 20

function computeScale(bounds: { a: number; b: number; c: number }) {
  const maxBound = Math.max(bounds.a, bounds.b, bounds.c)
  const k = MAX_SIZE / maxBound
  return { sa: bounds.a * k, sb: bounds.b * k, sc: bounds.c * k, k }
}

function PointCloud({ points, bounds }: PointCloudProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null)

  const { positions, colors } = useMemo(() => {
    const s = computeScale(bounds)
    const pos: number[] = []
    const col: number[] = []
    for (const [a, b, c, area] of points) {
      pos.push(
        (a / bounds.a - 0.5) * s.sa,
        (b / bounds.b - 0.5) * s.sb,
        (c / bounds.c - 0.5) * s.sc,
      )
      const color = areaToColor(area)
      col.push(color.r, color.g, color.b)
    }
    return { positions: pos, colors: col }
  }, [points, bounds])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh || positions.length === 0) return
    const dummy = new THREE.Object3D()
    for (let i = 0; i < positions.length / 3; i++) {
      dummy.position.set(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      mesh.setColorAt(i, new THREE.Color(colors[i * 3], colors[i * 3 + 1], colors[i * 3 + 2]))
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [positions, colors])

  if (positions.length === 0) return null

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length / 3]}>
      <sphereGeometry args={[0.12, 6, 6]} />
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  )
}

// ─── 셀 외곽 와이어프레임 ─────────────────────────────────────────────────────

function CellBounds({ bounds }: { bounds: { a: number; b: number; c: number } }) {
  const { sa, sb, sc } = computeScale(bounds)
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

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

interface Cell3DViewProps {
  data: CellDefectView
}

function Cell3DView({ data }: Cell3DViewProps) {
  const { cloud, annotation } = data
  const severity = annotation?.severity ?? null
  const borderColor = severity ? SEVERITY_BORDER[severity] : '#3a3f44'
  const azimuth = annotation?.recommendedView.azimuth ?? 45
  const elevation = annotation?.recommendedView.elevation ?? 20

  return (
    <div className="cell3d" style={{ '--cell3d-border': borderColor } as React.CSSProperties}>
      <div className="cell3d__header">
        <span className="cell3d__title">셀 3D 결함 뷰</span>
        {annotation && (
          <span
            className="cell3d__severity-badge"
            style={{ background: borderColor }}
          >
            위험도 {SEVERITY_LABEL[annotation.severity]}
          </span>
        )}
      </div>

      <div className="cell3d__canvas-wrap">
        {cloud.points.length === 0 ? (
          <div className="cell3d__empty">점군 데이터가 없습니다.</div>
        ) : (
          <Canvas camera={{ fov: 50, near: 0.1, far: 200 }}>
            <CameraSetup azimuth={azimuth} elevation={elevation} />
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 10]} intensity={0.8} />
            <CellBounds bounds={cloud.bounds} />
            <PointCloud points={cloud.points} bounds={cloud.bounds} />
            <OrbitControls enablePan={false} minDistance={8} maxDistance={40} />
          </Canvas>
        )}
      </div>

      <div className="cell3d__metrics">
        <span className="cell3d__metric">
          <span className="cell3d__metric-label">DVF</span>
          <span className="cell3d__metric-value">{cloud.metrics.dvfPpm.toLocaleString()} ppm</span>
        </span>
        <span className="cell3d__metric">
          <span className="cell3d__metric-label">결함 수</span>
          <span className="cell3d__metric-value">{cloud.metrics.defectCount}개</span>
        </span>
        <span className="cell3d__metric">
          <span className="cell3d__metric-label">양성 슬라이스율</span>
          <span className="cell3d__metric-value">{(cloud.metrics.posSliceRate * 100).toFixed(1)}%</span>
        </span>
      </div>

      {annotation && (
        <div className="cell3d__annotation">
          {annotation.highlights.map((h) => (
            <div key={h.zone} className="cell3d__highlight">
              <span className="cell3d__highlight-zone">{h.zone}</span>
              <span className="cell3d__highlight-note">{h.note}</span>
            </div>
          ))}
          <p className="cell3d__caption">{annotation.caption}</p>
        </div>
      )}
    </div>
  )
}

export { Cell3DView }
