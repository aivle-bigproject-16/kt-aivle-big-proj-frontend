import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import { useSimulationStore } from '../store/useSimulationStore'
import type { CellProgress } from '../types'
import { BatteryCellIcon } from './BatteryCellIcon'
import { useCountUp } from '../hooks/useCountUp'
import { useProcessStatusLabel } from '../hooks/useProcessStatus'
import { useLingeringActive } from '../hooks/useLingeringActive'
import { useMeasuredWidth } from '../hooks/useMeasuredWidth'
// 1200 기준 구 CSS는 history/CapturePanel.css로 이동됨 — 1400 기준으로 새로 만들 것

interface BatchGroup {
  batchId: number
  cells: CellProgress[]
  isCaptured: boolean
}

const CLOSE_DURATION = 350
/* CompletePanel의 셀 등장 애니메이션과 같은 길이 */
const CELL_EXIT_DURATION = 350

/* 스캐너 SVG — 배터리 y 오프셋 목록. 값을 추가하면 상하로 맞닿게 쌓인다 */
const SCANNER_BATTERY_Y = [140]
const SCANNER_BATTERY_X = 150
const SCANNER_BATTERY_W = 480
/* BatteryCellIcon 뷰박스(83×41) 비율 유지 */
const SCANNER_BATTERY_H = Math.round((SCANNER_BATTERY_W * 41) / 83)

/* 아이콘 내부 몸체(뷰박스 기준 x 8.9~77.8, y 4.4~36.9)를 스캐너 크기로 환산 */
const ICON_SCALE = SCANNER_BATTERY_W / 83
const CELLS_X = Math.round(8.918 * ICON_SCALE)
const CELLS_Y = Math.round(4.442 * ICON_SCALE)
const CELLS_W = Math.round((77.826 - 8.918) * ICON_SCALE)
const CELLS_H = Math.round((36.869 - 4.442) * ICON_SCALE)
const CELL_TILE_W = CELLS_W / 9

/* 카메라 렌즈 = 사각뿔 꼭짓점 */
const LENS_X = 400
const LENS_Y = 440

/* 사각뿔 밑면 = 배터리 내부 몸체를 좌우로 훑는 스캔 창.
   세로는 내부 높이에 꽉 맞추고, 좌우 스윕 양 끝은 내부 좌·우 끝과 정확히 일치시킨다 */
const SCAN_W = 80
const SCAN_Y1 = SCANNER_BATTERY_Y[0] + CELLS_Y
const SCAN_Y2 = SCANNER_BATTERY_Y[SCANNER_BATTERY_Y.length - 1] + CELLS_Y + CELLS_H
const SCAN_X_FROM = SCANNER_BATTERY_X + CELLS_X
const SCAN_X_TO = SCAN_X_FROM + CELLS_W - SCAN_W

/* 옆면 3개 — 렌즈를 공유하는 삼각형. 밑면 아래에 렌즈가 있어 하단면은 가려진다 */
const faceLeftAt = (x: number) =>
  `${LENS_X},${LENS_Y} ${x},${SCAN_Y1} ${x},${SCAN_Y2}`
const faceTopAt = (x: number) =>
  `${LENS_X},${LENS_Y} ${x},${SCAN_Y1} ${x + SCAN_W},${SCAN_Y1}`
const faceRightAt = (x: number) =>
  `${LENS_X},${LENS_Y} ${x + SCAN_W},${SCAN_Y1} ${x + SCAN_W},${SCAN_Y2}`
/* 좌상 → 렌즈 → 우상 (면 경계 모서리) */
const edgesAt = (x: number) =>
  `${x},${SCAN_Y1} ${LENS_X},${LENS_Y} ${x + SCAN_W},${SCAN_Y1}`
const sweep = (at: (x: number) => string) => `${at(SCAN_X_FROM)}; ${at(SCAN_X_TO)}; ${at(SCAN_X_FROM)}`

const BEAM_FACE_LEFT_SWEEP = sweep(faceLeftAt)
const BEAM_FACE_TOP_SWEEP = sweep(faceTopAt)
const BEAM_FACE_RIGHT_SWEEP = sweep(faceRightAt)
const BEAM_EDGES_SWEEP = sweep(edgesAt)
const SCAN_SWEEP = `${SCAN_X_FROM};${SCAN_X_TO};${SCAN_X_FROM}`
/* 레이저는 스캔 창의 중앙선 */
const LASER_SWEEP = sweep(x => `${x + SCAN_W / 2}`)

function CaptureBatchCard({ batchId, cells, isCaptured }: BatchGroup) {
  const [open, setOpen] = useState(!isCaptured)
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({ maxHeight: 0, overflow: 'hidden', opacity: 0, marginBottom: '-1.8857rem' })
  const cardRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  /* 목록에서 빠진 셀을 퇴장 애니메이션 동안 DOM에 유지한다 */
  const [exitingCells, setExitingCells] = useState<CellProgress[]>([])
  const prevCellsRef = useRef(cells)
  const exitTimersRef = useRef<number[]>([])

  useEffect(() => {
    const liveIds = new Set(cells.map(c => c.batteryCellId))
    const removed = prevCellsRef.current.filter(c => !liveIds.has(c.batteryCellId))
    prevCellsRef.current = cells
    if (removed.length === 0) return

    setExitingCells(prev => [...prev, ...removed])
    const removedIds = new Set(removed.map(c => c.batteryCellId))
    /* cleanup으로 지우면 다음 WS 메세지가 이 타이머를 취소해 셀이 영구히 남는다.
       언마운트 때만 정리한다 */
    exitTimersRef.current.push(
      window.setTimeout(
        () => setExitingCells(prev => prev.filter(c => !removedIds.has(c.batteryCellId))),
        CELL_EXIT_DURATION,
      ),
    )
  }, [cells])

  useEffect(() => () => exitTimersRef.current.forEach(clearTimeout), [])

  /* 셀은 뒤에서부터 빠져나가므로 ID 역순으로 정렬해 사라지는 셀이 앞에 오게 한다.
     퇴장 중인 셀도 같은 기준으로 병합해 그리드에서 원래 자리를 지킨다 */
  const renderedCells = useMemo(() => {
    const liveIds = new Set(cells.map(c => c.batteryCellId))
    return [
      ...cells.map(cell => ({ cell, exiting: false })),
      ...exitingCells
        .filter(c => !liveIds.has(c.batteryCellId))
        .map(cell => ({ cell, exiting: true })),
    ].sort((a, b) => b.cell.batteryCellId - a.cell.batteryCellId)
  }, [cells, exitingCells])

  useEffect(() => {
    const t = setTimeout(() => {
      const h = cardRef.current?.scrollHeight ?? 300
      setAnimStyle({ maxHeight: h, overflow: 'hidden', opacity: 1, marginBottom: 0, transition: 'max-height 0.6s ease-out, opacity 0.3s ease-out, margin-bottom 0.6s ease-out' })
      setTimeout(() => setAnimStyle({ opacity: 1 }), 650)
    }, CLOSE_DURATION)
    return () => clearTimeout(t)
  }, [])

  return (
    <div
      ref={cardRef}
      style={animStyle}
      className={`capture-batch${open ? ' capture-batch--open' : ''}${isCaptured ? ' capture-batch--slim' : ''}`}
    >
      <button className="capture-batch__header" onClick={() => setOpen(v => !v)}>
        <span className="capture-batch__title">BATCH {batchId}</span>
        <span className={`capture-batch__status${isCaptured ? '' : ' capture-batch__status--capturing'}`}>{isCaptured ? 'CAPTURED' : 'CAPTURING'}</span>
        <span className="capture-batch__chevron">{open ? '▲' : '▼'}</span>
      </button>
      <div className={`capture-batch__cells${open ? ' capture-batch__cells--open' : ''}`}>
        {renderedCells.map(({ cell, exiting }) => (
          <div
            key={cell.batteryCellId}
            className={`capture-cell capture-cell--clickable${exiting ? ' capture-cell--exit' : ''}`}
            onClick={() => navigate(ROUTES.BATTERY_DETAIL(cell.batteryCellId))}
          >
            <BatteryCellIcon width="100%" height="100%" />
            <span className="capture-cell__id">{cell.batteryCellId}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** active=false 면 스캐너 SVG(SMIL + 블러 필터)를 내려 비활성 탭의 렌더링 부하를 없앤다 */
export function CapturePanel({ active = true }: { active?: boolean }) {
  const capture = useSimulationStore(s => s.capture)
  const today = new Date().toISOString().slice(0, 10)
  const capturingCount = capture.filter(c => c.status === 'CAPTURING').length
  const capturedCount = capture.filter(c => c.status === 'CAPTURED').length

  /* 촬영 중인 셀이 없으면 스캐너도 멈춘다 */
  const runScanner = useLingeringActive(active) && capturingCount > 0
  const scannerRef = useRef<SVGSVGElement>(null)

  /* 스캐너는 언마운트하지 않고 SMIL 타임라인만 멈춘다.
     동적으로 삽입된 SVG는 SMIL이 곧바로 시작하지 않아 탭 진입 시 지연이 보인다.
     멈춰 있는 동안에는 속성이 변하지 않아 리페인트도 발생하지 않는다 */
  useEffect(() => {
    const svg = scannerRef.current
    if (!svg) return
    if (runScanner) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [runScanner])
  const statusLabel = useProcessStatusLabel()
  const capturingDisplay = useCountUp(capturingCount)
  const capturedDisplay = useCountUp(capturedCount)

  /* 바를 각 카운터 폭에 맞춘다 */
  const [capturingRef, capturingBarWidth] = useMeasuredWidth<HTMLDivElement>()
  const [capturedRef, capturedBarWidth] = useMeasuredWidth<HTMLDivElement>()

  const batches = useMemo<BatchGroup[]>(() => {
    const map = new Map<number, CellProgress[]>()
    for (const cell of capture) {
      if (!map.has(cell.batchId)) map.set(cell.batchId, [])
      map.get(cell.batchId)!.push(cell)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b - a)
      .map(([batchId, cells]) => ({
        batchId,
        cells,
        isCaptured: cells.every(c => c.status === 'CAPTURED'),
      }))
  }, [capture])

  return (
    <div className="capture-panel">
      <div className="capture-card">
        <div className="capture-info">
          <div className="capture-scanner">
            <svg ref={scannerRef} viewBox="0 0 800 600" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <filter id="capture-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {/* 사각뿔 면별 색 — userSpaceOnUse 로 세 면이 같은 페이드(렌즈 → 배터리 상단)를 공유 */}
                {[
                  { id: 'capture-beamFaceLeft', color: '#1b9c56', peak: 0.5 },
                  { id: 'capture-beamFaceTop', color: '#2ecc71', peak: 0.34 },
                  { id: 'capture-beamFaceRight', color: '#6bfe9c', peak: 0.42 },
                ].map(({ id, color, peak }) => (
                  <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1="0" y1={LENS_Y} x2="0" y2={SCAN_Y1}>
                    <stop offset="0%" stopColor={color} stopOpacity={peak} />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                  </linearGradient>
                ))}
                {/* 내부 셀 — 아이콘 몸체가 불투명 녹색이라 어두운 색이어야 대비가 산다.
                    x/y 오프셋을 몸체 시작점에 맞춰 타일이 잘리지 않게 한다 */}
                <pattern id="capture-cells" patternUnits="userSpaceOnUse" x={CELLS_X} y={CELLS_Y} width={CELL_TILE_W} height={CELLS_H}>
                  <rect x="4" y="8" width={CELL_TILE_W - 8} height={CELLS_H - 16} rx="4" stroke="#f4f4f4" strokeWidth="4" fill="none" opacity="0.75" />
                  <circle cx={CELL_TILE_W / 2} cy="22" r="3.5" fill="#f4f4f4" opacity="0.6" />
                  <circle cx={CELL_TILE_W / 2} cy={CELLS_H - 22} r="3.5" fill="#f4f4f4" opacity="0.6" />
                  <line x1={CELL_TILE_W / 2} y1="34" x2={CELL_TILE_W / 2} y2={CELLS_H - 34} stroke="#f4f4f4" strokeWidth="4" strokeDasharray="4 4" opacity="0.4" />
                </pattern>
                <clipPath id="capture-scanClip">
                  <rect width={SCAN_W} height={SCAN_Y2 - SCAN_Y1} y={SCAN_Y1}>
                    <animate attributeName="x" values={SCAN_SWEEP} dur="4s" repeatCount="indefinite" />
                  </rect>
                </clipPath>
              </defs>

              {/* 배터리 외관 — 셀 아이콘과 동일한 형상 재사용 */}
              {SCANNER_BATTERY_Y.map(y => (
                <g key={y} transform={`translate(${SCANNER_BATTERY_X}, ${y})`}>
                  <BatteryCellIcon width={SCANNER_BATTERY_W} height={SCANNER_BATTERY_H} />
                </g>
              ))}

              {/* X-ray 내부 셀 패턴 */}
              <g clipPath="url(#capture-scanClip)">
                {SCANNER_BATTERY_Y.map(y => (
                  <g key={y} transform={`translate(${SCANNER_BATTERY_X}, ${y})`}>
                    <rect x={CELLS_X} y={CELLS_Y} width={CELLS_W} height={CELLS_H} fill="url(#capture-cells)" />
                  </g>
                ))}
              </g>

              {/* 스캔 빔 — 카메라 화각(사각뿔). 밑면 = 움직이는 스캔 창, 꼭짓점 = 렌즈 */}
              <g>
                <polygon fill="url(#capture-beamFaceLeft)">
                  <animate attributeName="points" values={BEAM_FACE_LEFT_SWEEP} dur="4s" repeatCount="indefinite" />
                </polygon>
                <polygon fill="url(#capture-beamFaceTop)">
                  <animate attributeName="points" values={BEAM_FACE_TOP_SWEEP} dur="4s" repeatCount="indefinite" />
                </polygon>
                <polygon fill="url(#capture-beamFaceRight)">
                  <animate attributeName="points" values={BEAM_FACE_RIGHT_SWEEP} dur="4s" repeatCount="indefinite" />
                </polygon>
                <polyline fill="none" stroke="#2ecc71" strokeWidth="1" opacity="0.25">
                  <animate attributeName="points" values={BEAM_EDGES_SWEEP} dur="4s" repeatCount="indefinite" />
                </polyline>
              </g>

              {/* 레이저 라인 */}
              <line y1={SCAN_Y1} y2={SCAN_Y2} stroke="#2ecc71" strokeWidth="3" filter="url(#capture-glow)">
                <animate attributeName="x1" values={LASER_SWEEP} dur="4s" repeatCount="indefinite" />
                <animate attributeName="x2" values={LASER_SWEEP} dur="4s" repeatCount="indefinite" />
              </line>

              {/* 카메라 모듈 */}
              <g transform={`translate(${LENS_X - 40}, ${LENS_Y})`}>
                <path d="M 0 30 L 80 30 L 60 0 L 20 0 Z" fill="#0f172a" stroke="#475569" strokeWidth="2" />
                <circle cx="40" cy="15" r="10" fill="#2ecc71" opacity="0.8" filter="url(#capture-glow)" />
                <circle cx="40" cy="15" r="4" fill="#ffffff" opacity="0.9" />
              </g>
            </svg>
          </div>

          <div className="capture-info__header">
            <p className="capture-info__title">CAPTURE Section</p>
            <p className="capture-info__date">셀 촬영 영역 {today}</p>
          </div>
          <div className="capture-info__bottom">
            <div className="capture-info__group">
              <div ref={capturingRef} className="capture-info__counter">
                <span className="capture-info__unit">capturing</span>
                <span className="capture-info__number capture-info__number--red">{capturingDisplay}</span>
              </div>
              <div className="capture-info__bar" style={capturingBarWidth ? { width: capturingBarWidth } : undefined} />
            </div>
            <div className="capture-info__group">
              <div ref={capturedRef} className="capture-info__counter">
                <span className="capture-info__unit">captured</span>
                <span className="capture-info__number">{capturedDisplay}</span>
              </div>
              <div className="capture-info__bar" style={capturedBarWidth ? { width: capturedBarWidth } : undefined} />
            </div>
          </div>
        </div>

        <div className="capture-batches">
          {batches.length === 0 ? (
            <div className="capture-batch capture-batch--empty">
              <div className="capture-batch__header">
                <span className="capture-batch__title">BATCH 0</span>
              </div>
              <p className="capture-batch__empty-text">{statusLabel}</p>
            </div>
          ) : (
            batches.map(({ batchId, cells, isCaptured }) => (
              <CaptureBatchCard key={batchId} batchId={batchId} cells={cells} isCaptured={isCaptured} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
