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
import './PendingPanel.css'

const EXIT_DURATION = 450

interface BatchGroup {
  batchId: number
  cells: CellProgress[]
}

function BatchCard({ batch, exiting = false, isTop = false }: { batch: BatchGroup; exiting?: boolean; isTop?: boolean }) {
  const [open, setOpen] = useState(isTop)
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const [exitStyle, setExitStyle] = useState<Record<string, string | number>>({})

  useEffect(() => {
    if (!isTop) return
    const t = setTimeout(() => setOpen(true), EXIT_DURATION + 50)
    return () => clearTimeout(t)
  }, [isTop])

  useEffect(() => {
    if (!exiting || !ref.current) return
    const h = ref.current.getBoundingClientRect().height
    setExitStyle({ height: h, overflow: 'hidden', opacity: 1, marginBottom: 0 })
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setExitStyle({
          height: 0,
          overflow: 'hidden',
          opacity: 0,
          marginBottom: '-1.8857rem',
          transition: `height ${EXIT_DURATION}ms ease-out, opacity 150ms ease-out ${EXIT_DURATION - 150}ms, margin-bottom ${EXIT_DURATION}ms ease-out`,
        })
      })
    })
  }, [exiting])

  return (
    <div
      ref={ref}
      className={`pending-batch${open ? ' pending-batch--open' : ''}`}
      style={exiting ? exitStyle : undefined}
    >
      <button className="pending-batch__header" onClick={() => !exiting && setOpen(v => !v)}>
        <span className="pending-batch__title">BATCH {batch.batchId}</span>
        {!open && (
          <span className="pending-batch__count">CELL count : {batch.cells.length}</span>
        )}
        <span className="pending-batch__chevron">{open ? '▲' : '▼'}</span>
      </button>
      <div className={`pending-batch__cells${open ? ' pending-batch__cells--open' : ''}`}>
        {batch.cells.map(cell => (
          <div
            key={cell.batteryCellId}
            className="pending-cell pending-cell--clickable"
            onClick={() => navigate(ROUTES.BATTERY_DETAIL(cell.batteryCellId))}
          >
            <BatteryCellIcon width="100%" height="100%" />
            <span className="pending-cell__id">{cell.batteryCellId}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** active=false 면 컨베이어 애니메이션을 내려 비활성 탭의 렌더링 부하를 없앤다 */
export function PendingPanel({ active = true }: { active?: boolean }) {
  const registered = useSimulationStore(s => s.registered)
  const today = new Date().toISOString().slice(0, 10)
  const registeredDisplay = useCountUp(registered.length)
  const statusLabel = useProcessStatusLabel()
  /* 대기 중인 셀이 없으면 컨베이어도 멈춘다 */
  const showConveyor = useLingeringActive(active) && registered.length > 0

  /* 바를 카운터 폭에 맞춘다. 숫자가 tabular-nums라 폭은 자릿수가 바뀔 때만 변한다 */
  const [counterRef, barWidth] = useMeasuredWidth<HTMLDivElement>()

  const batches = useMemo<BatchGroup[]>(() => {
    const map = new Map<number, CellProgress[]>()
    for (const cell of registered) {
      if (!map.has(cell.batchId)) map.set(cell.batchId, [])
      map.get(cell.batchId)!.push(cell)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([batchId, cells]) => ({ batchId, cells }))
  }, [registered])

  const [exitingBatches, setExitingBatches] = useState<Map<number, BatchGroup>>(new Map())
  const prevBatchesRef = useRef<BatchGroup[]>([])

  useEffect(() => {
    const prevIds = new Set(prevBatchesRef.current.map(b => b.batchId))
    const nextIds = new Set(batches.map(b => b.batchId))

    const removed = prevBatchesRef.current.filter(b => !nextIds.has(b.batchId))
    if (removed.length > 0) {
      setExitingBatches(prev => {
        const next = new Map(prev)
        for (const b of removed) next.set(b.batchId, b)
        return next
      })

      const ids = removed.map(b => b.batchId)
      setTimeout(() => {
        setExitingBatches(prev => {
          const next = new Map(prev)
          for (const id of ids) next.delete(id)
          return next
        })
      }, EXIT_DURATION)
    }

    // remove from exiting if it re-appears
    const reappeared = [...exitingBatches.keys()].filter(id => nextIds.has(id) && !prevIds.has(id))
    if (reappeared.length > 0) {
      setExitingBatches(prev => {
        const next = new Map(prev)
        for (const id of reappeared) next.delete(id)
        return next
      })
    }

    prevBatchesRef.current = batches
  }, [batches]) // eslint-disable-line react-hooks/exhaustive-deps

  const allBatches = useMemo(() => {
    const merged = new Map<number, { batch: BatchGroup; exiting: boolean }>()
    for (const batch of batches) merged.set(batch.batchId, { batch, exiting: false })
    for (const [id, batch] of exitingBatches) {
      if (!merged.has(id)) merged.set(id, { batch, exiting: true })
    }
    return Array.from(merged.entries())
      .sort(([a], [b]) => a - b)
      .map(([, v], index) => ({ ...v, index }))
  }, [batches, exitingBatches])

  return (
    <div className="pending-panel">
      <div className="pending-card">
        <div className="pending-info">
          {showConveyor && (
          <div className="pending-conveyor">
            <svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="belt-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
                <clipPath id="belt-clip">
                  <path d="M 70 185 L 540 102 L 580 117 L 110 200 Z" />
                </clipPath>
              </defs>
              {/* 왼쪽 끝면: 깊이방향 (40, 15) */}
              <path d="M 70 185 L 70 205 L 110 220 L 110 200 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="0.5" />
              {/* 앞면: 10° 길이 방향 (470px→83px) */}
              <path d="M 110 200 L 110 220 L 580 137 L 580 117 Z" fill="#1e293b" stroke="#334155" strokeWidth="0.5" />
              {/* 벨트 표면 */}
              <path d="M 70 185 L 540 102 L 580 117 L 110 200 Z" fill="url(#belt-grad)" stroke="#334155" strokeWidth="0.5" />
              {[0, -0.96, -1.92, -2.88, -3.84, -4.8, -5.76, -6.72, -7.68, -8.64].map((delay, i) => (
                <g key={i} className={`conveyor-groove conveyor-groove-${i + 1}`} style={{ animationDelay: `${delay}s` }}>
                  <line stroke="#0f172a" strokeWidth="2" x1="540" x2="580" y1="102" y2="117" />
                  <line stroke="#64748b" strokeWidth="1" x1="542.7" x2="582.7" y1="100.7" y2="115.7" />
                </g>
              ))}
              {[0, -2, -4, -6, -8, -10].map((delay, i) => (
                <g key={i} className={`conveyor-cell conveyor-cell-${i + 1}`} style={{ animationDelay: `${delay}s` }}>
                  {/* 후면(back 방향): origin→(-15,-5.6) 위쪽-왼쪽 */}
                  <path d="M 0 0 L -14 -5.2 L -14 -22.2 L 0 -17 Z" fill="#2ecc71" />
                  {/* 입구 방향 면: origin→(+14,-2.4) 위쪽-오른쪽 */}
                  <path d="M 0 0 L 14 -2.4 L 14 -19.4 L 0 -17 Z" fill="#27ae60" />
                  {/* 윗면: 4개 상단 꼭짓점 */}
                  <path d="M 0 -17 L -14 -22.2 L 0 -24.6 L 14 -19.4 Z" fill="#6bfe9c" />
                </g>
              ))}
            </svg>
          </div>
          )}

          <div className="pending-info__header">
            <p className="pending-info__title">PENDING Section</p>
            <p className="pending-info__date">셀 대기 영역 {today}</p>
          </div>
          <div className="pending-info__bottom">
            <div ref={counterRef} className="pending-info__counter">
              <span className="pending-info__unit">units</span>
              <span className="pending-info__number">{registeredDisplay}</span>
            </div>
            <div className="pending-info__bar" style={barWidth ? { width: barWidth } : undefined} />
          </div>
        </div>

        <div className="pending-batches">
          {allBatches.length === 0 ? (
            <div className="pending-batch pending-batch--empty">
              <div className="pending-batch__header">
                <span className="pending-batch__title">BATCH 0</span>
              </div>
              <p className="pending-batch__empty-text">{statusLabel}</p>
            </div>
          ) : (
            allBatches.map(({ batch, exiting, index }) => (
              <BatchCard key={batch.batchId} batch={batch} exiting={exiting} isTop={index === 0} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
