import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@/core/navigation/routes'
import { useSimulationStore } from '../store/useSimulationStore'
import { useCountUp } from '../hooks/useCountUp'
import { useMeasuredWidth } from '../hooks/useMeasuredWidth'
import { useProcessStatusLabel } from '../hooks/useProcessStatus'
import { BatteryCellIcon } from './BatteryCellIcon'
import { GROUP_CONFIG, type FinalGroup } from './CompletePanel'
import type { CellProgress } from '../types'
import './OverviewPanel.css'

function groupBatches(cells: CellProgress[]) {
  const map = new Map<number, number>()
  for (const c of cells) map.set(c.batchId, (map.get(c.batchId) ?? 0) + 1)
  return [...map.entries()].sort(([a], [b]) => a - b)
}

function MiniCounter({ unit, value }: { unit: string; value: number }) {
  const display = useCountUp(value)
  const [ref, width] = useMeasuredWidth<HTMLDivElement>()
  return (
    <div className="overview-mini__bottom">
      <div ref={ref} className="overview-mini__counter">
        <span className="overview-mini__unit">{unit}</span>
        <span className="overview-mini__number">{display}</span>
      </div>
      <div className="overview-mini__bar" style={width ? { width } : undefined} />
    </div>
  )
}

const BADGE_SLIDE_DURATION = 350
/* 배치가 실제로 바뀐 뒤에도 배열 갱신 타이밍상 아주 잠깐(한두 틱) batch가
   null로 비었다가 다음 배치로 채워지는 구간이 생긴다. 이 찰나의 공백을 그대로
   반영하면 "직전 배치"가 아니라 그 공백(Process Status)이 교체 애니메이션의
   exit 값으로 캡처돼버린다. null은 이 시간만큼 유지될 때만 진짜로 반영한다 */
const NULL_DEBOUNCE = 400

/** 배치 정보가 바뀌면 배지 박스 전체가 위로 슬라이드 아웃되고, 새 박스가
   아래에서 슬라이드 인되며 교체된다 — 내부 숫자만이 아니라 카드 자체가 바뀐다.
   전환은 배치 단위(batchId)로만 일어나야 한다 — 같은 배치 안에서 셀 개수만
   바뀌는 것으로는 박스 전체가 슬라이드되면 안 된다 */
function BatchBadge({
  variant,
  label,
  batch,
  onClick,
}: {
  variant: 'next' | 'current'
  label: string
  batch: [number, number] | null
  onClick?: () => void
}) {
  const statusLabel = useProcessStatusLabel()

  /* 화면에 실제로 반영할 배치 — null만 디바운스하고, 실제 배치 값은 즉시 반영 */
  const [displayBatch, setDisplayBatch] = useState(batch)
  const nullTimerRef = useRef<number>()
  useEffect(() => {
    if (batch !== null) {
      clearTimeout(nullTimerRef.current)
      setDisplayBatch(batch)
      return
    }
    nullTimerRef.current = window.setTimeout(() => setDisplayBatch(null), NULL_DEBOUNCE)
    return () => clearTimeout(nullTimerRef.current)
  }, [batch])

  /* 셀 개수(batch[1])가 아니라 배치 id(batch[0])만 키로 써서, 같은 배치 내
     카운트 변화로는 슬라이드가 재생되지 않고 배치가 실제로 바뀔 때만 재생된다 */
  const currentKey = displayBatch ? `${displayBatch[0]}` : 'empty'
  const [prevEntry, setPrevEntry] = useState<{ key: string; batch: [number, number] | null } | null>(null)
  const currentKeyRef = useRef(currentKey)
  const currentBatchRef = useRef(displayBatch)
  const timerRef = useRef<number>()

  /* displayBatch는 실제 값이 같아도 상위 useMemo에서 매 틱 새 배열 참조로
     재계산되어 들어온다. 의존성에 displayBatch를 넣으면 currentKey가 그대로여도
     effect가 매번 재실행되면서 cleanup(clearTimeout)만 계속 걸려 "prevEntry 제거"
     타이머가 실제 전환 때마다 취소돼버린다 — 그래서 첫 전환 때 잡힌 값이 영원히
     안 지워짐. 반드시 currentKey(문자열)가 실제로 바뀔 때만 재실행되게 한다.
     enter/exit 박스는 같은 프레임에서 함께 나타나야 동시에 슬라이드된다 —
     useEffect(페인트 이후)로 하면 exit 박스가 한 틱 늦게 뒤따라와 어긋나 보인다 */
  useLayoutEffect(() => {
    if (currentKey === currentKeyRef.current) return
    setPrevEntry({ key: currentKeyRef.current, batch: currentBatchRef.current })
    currentKeyRef.current = currentKey
    currentBatchRef.current = displayBatch
    clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setPrevEntry(null), BADGE_SLIDE_DURATION)
    return () => clearTimeout(timerRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentKey])

  const renderContent = (b: [number, number] | null) =>
    b ? (
      <>
        <span className="overview-badge__status">{label}</span>
        <span className="overview-badge__title">BATCH {b[0]}</span>
        <span className="overview-badge__cell">CELL : {b[1]}</span>
      </>
    ) : (
      <span>{statusLabel}</span>
    )

  return (
    <div className={`overview-badge-slot overview-badge-slot--${variant}`}>
      <div
        key={currentKey}
        className={`overview-badge overview-badge--${variant} overview-mini--clickable overview-badge--enter${displayBatch ? '' : ' overview-badge--empty'}`}
        onClick={onClick}
      >
        {renderContent(displayBatch)}
      </div>
      {prevEntry && (
        <div
          key={prevEntry.key}
          className={`overview-badge overview-badge--exit${prevEntry.batch ? '' : ' overview-badge--empty'}`}
        >
          {renderContent(prevEntry.batch)}
        </div>
      )}
    </div>
  )
}

function CompleteRow({ group, cells }: { group: FinalGroup; cells: CellProgress[] }) {
  const { color } = GROUP_CONFIG[group]
  const navigate = useNavigate()

  /* 새 셀이 추가되면 컨테이너 맨 아래로 스크롤한다 */
  const cellsRef = useRef<HTMLDivElement>(null)
  const prevCountRef = useRef(cells.length)
  useEffect(() => {
    if (cells.length > prevCountRef.current) {
      const el = cellsRef.current
      if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
    prevCountRef.current = cells.length
  }, [cells.length])

  return (
    <div className="overview-complete__row">
      <div className="overview-complete__tab" style={{ backgroundColor: color }}>
        <span className="overview-complete__tab-label">{group}</span>
        <span className="overview-complete__tab-count">{cells.length} cell</span>
      </div>
      <div ref={cellsRef} className="overview-complete__cells">
        {cells.map(cell => (
          <div
            key={cell.batteryCellId}
            className="overview-cell overview-cell--clickable"
            onClick={(e) => {
              /* 부모(.overview-mini--complete)의 탭 이동 클릭과 겹치지 않도록 전파를 막는다 */
              e.stopPropagation()
              navigate(ROUTES.BATTERY_DETAIL(cell.batteryCellId))
            }}
          >
            <BatteryCellIcon width="100%" height="100%" color={color} />
            <span className="overview-cell__id">{cell.batteryCellId}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface OverviewPanelProps {
  /** 미니 카드를 클릭하면 그 섹션의 탭 인덱스로 이동한다 (1=대기 2=촬영 3=분석 4=완료) */
  onNavigate?: (index: number) => void
}

export function OverviewPanel({ onNavigate }: OverviewPanelProps) {
  const registered = useSimulationStore(s => s.registered)
  const capture = useSimulationStore(s => s.capture)
  const analyze = useSimulationStore(s => s.analyze)
  const completed = useSimulationStore(s => s.completed)
  const today = new Date().toISOString().slice(0, 10)

  const capturedCount = useMemo(() => capture.filter(c => c.status === 'CAPTURED').length, [capture])

  const nextBatch = useMemo(() => groupBatches(registered)[0] ?? null, [registered])
  /* CURRENT는 실제로 촬영 "중"인(CAPTURING) 셀 기준이다 — 이미 촬영이 끝난
     CAPTURED 셀은 포함하지 않는다. 셀 사이 찰나의 공백은 BatchBadge의
     null 디바운스(NULL_DEBOUNCE)와 배치 id 기준 키로 흡수한다 */
  const currentBatch = useMemo(() => {
    const capturing = capture.filter(c => c.status === 'CAPTURING')
    return groupBatches(capturing)[0] ?? null
  }, [capture])

  const cellIdDisplay = analyze?.batteryCellId ?? 0
  const retryDisplay = useCountUp(analyze?.retryCount ?? 0)

  /* 분석 중인 셀이 없으면 배터리 충전 애니메이션도 멈춘다 */
  const batteryRef = useRef<SVGSVGElement>(null)
  useEffect(() => {
    const svg = batteryRef.current
    if (!svg) return
    if (analyze) svg.unpauseAnimations()
    else svg.pauseAnimations()
  }, [analyze])

  const groups = useMemo(() => {
    const pass: CellProgress[] = []
    const reject: CellProgress[] = []
    const fail: CellProgress[] = []
    for (let i = completed.length - 1; i >= 0; i--) {
      const cell = completed[i]
      if (cell.finalLabel === 'PASS') pass.push(cell)
      else if (cell.finalLabel === 'REJECT') reject.push(cell)
      else if (cell.finalLabel === 'FAIL') fail.push(cell)
    }
    return { pass, reject, fail }
  }, [completed])

  return (
    <div className="overview-panel">
      <div className="overview-grid">
        {/* PENDING */}
        <div
          className="overview-mini overview-mini--pending overview-mini--clickable"
          onClick={() => onNavigate?.(1)}
        >
          <div className="overview-mini__header">
            <p className="overview-mini__title">PENDING Section</p>
            <p className="overview-mini__date">셀 대기 영역 {today}</p>
          </div>
          <MiniCounter unit="units" value={registered.length} />
        </div>

        {/* CAPTURE */}
        <div
          className="overview-mini overview-mini--capture overview-mini--clickable"
          onClick={() => onNavigate?.(2)}
        >
          <div className="overview-mini__header">
            <p className="overview-mini__title">CAPTURE Section</p>
            <p className="overview-mini__date">셀 촬영 영역 {today}</p>
          </div>
          <MiniCounter unit="captured" value={capturedCount} />
        </div>

        {/* PENDING/CAPTURE 위에 겹쳐 뜨는 배치 배지 */}
        <BatchBadge variant="next" label="NEXT" batch={nextBatch} onClick={() => onNavigate?.(1)} />
        <BatchBadge variant="current" label="CURRENT" batch={currentBatch} onClick={() => onNavigate?.(2)} />

        {/* ANALYZE */}
        <div className="overview-analyze overview-mini--clickable" onClick={() => onNavigate?.(3)}>
          <div className="overview-analyze__info">
            <div className="overview-analyze__header">
              <p className="overview-mini__title">ANALYZE Section</p>
              <p className="overview-mini__date">셀 분석 영역 {today}</p>
            </div>
            <div className="overview-analyze__metrics">
              <div className="overview-analyze__metric">
                <div className="overview-analyze__value-wrap">
                  <div className="overview-analyze__value-row">
                    <span className="overview-analyze__label">Retry Count</span>
                    <span className="overview-analyze__value">{retryDisplay}</span>
                  </div>
                  <div className="overview-analyze__bar" />
                </div>
              </div>
              <div className="overview-analyze__metric">
                <div className="overview-analyze__value-wrap">
                  <div className="overview-analyze__value-row">
                    <span className="overview-analyze__label">Cell ID</span>
                    <span key={cellIdDisplay} className="overview-analyze__value overview-analyze__value--pop">{cellIdDisplay}</span>
                  </div>
                  <div className="overview-analyze__bar" />
                </div>
              </div>
            </div>
          </div>
          <div className="overview-analyze__detail">
            <p className="overview-analyze__detail-title">
              {analyze ? `BATCH ${analyze.batchId} - Cell ID ${analyze.batteryCellId}` : '분석 대기 중'}
            </p>

            <div className="overview-analyze__battery">
              <svg ref={batteryRef} width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                {/* Battery Cap (Metallic Grey) */}
                <rect x="42" y="8" width="16" height="6" rx="2" fill="#94a3b8" />
                {/* Battery Body Outline (Emerald Green) */}
                <rect x="30" y="14" width="40" height="78" rx="4" fill="none" stroke="#2ecc71" strokeWidth="3" />
                {/* Battery Fill — 분석 중임을 나타내는 충전 애니메이션 */}
                <rect x="33" width="34" rx="2" fill="#2ecc71">
                  <animate attributeName="y" values="85;17;85" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="height" values="4;72;4" dur="2.4s" repeatCount="indefinite" />
                </rect>
              </svg>
            </div>
          </div>
        </div>

        {/* COMPLETE */}
        <div
          className="overview-mini overview-mini--complete overview-mini--clickable"
          onClick={() => onNavigate?.(4)}
        >
          <p className="overview-complete__title">COMPLETE Section</p>
          <div className="overview-complete__rows">
            <CompleteRow group="PASS" cells={groups.pass} />
            <CompleteRow group="REJECT" cells={groups.reject} />
            <CompleteRow group="FAIL" cells={groups.fail} />
          </div>
        </div>
      </div>
    </div>
  )
}
