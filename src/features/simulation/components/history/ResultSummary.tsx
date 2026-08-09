import { useNavigate } from 'react-router-dom'
// 1200 기준 구 CSS는 history/ResultSummary.css로 이동됨 — 1400 기준으로 새로 만들 것
import { useSimulationStore } from '../store/useSimulationStore'
import { ROUTES } from '@/core/navigation/routes'

/* ── 색상 팔레트 ── */
const LABEL_COLORS: Record<string, string> = {
  PASS:   '#2A78D6',
  REJECT: '#EB6834',
  FAIL:   '#E34948',
}
const LABEL_NAMES: Record<string, string> = {
  PASS:   'PASS',
  REJECT: 'REJECT',
  FAIL:   'FAIL',
}

/* ── SVG 파이차트 헬퍼 ── */
function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function describeSlice(cx: number, cy: number, r: number, start: number, end: number) {
  const s = polarToCartesian(cx, cy, r, start)
  const e = polarToCartesian(cx, cy, r, end)
  const large = end - start > 180 ? 1 : 0
  return `M ${cx} ${cy} L ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} Z`
}

/* ── 파이차트 컴포넌트 ── */
function DefectPie({ slices }: { slices: { label: string; value: number; percent: number; color: string; path: string; labelPos: { x: number; y: number } }[] }) {
  return (
    <svg className="result-pie__svg" viewBox="0 0 200 200" aria-label="결과 분포 파이 차트">
      {slices.map(s => (
        <path key={s.label} d={s.path} fill={s.color} stroke="#fff" strokeWidth={2} style={{ transition: 'd 0.5s ease-in-out' }}>
          <title>{`${s.label}: ${s.value}건 (${s.percent}%)`}</title>
        </path>
      ))}
      {slices.map(s =>
        s.percent >= 8 ? (
          <text
            key={`${s.label}-lbl`}
            x={s.labelPos.x} y={s.labelPos.y}
            textAnchor="middle" dominantBaseline="middle"
            className="result-pie__slice-label"
          >
            {s.percent}%
          </text>
        ) : null
      )}
    </svg>
  )
}

/* ── ResultSummary ── */
function ResultSummary() {
  const navigate = useNavigate()
  const completed = useSimulationStore(s => s.completed)

  /* 파이차트 데이터 집계 */
  const counts: Record<string, number> = { PASS: 0, REJECT: 0, FAIL: 0 }
  for (const c of completed) {
    if (c.finalLabel && c.finalLabel in counts) counts[c.finalLabel]++
  }
  const total = completed.length

  let cursor = 0
  const cx = 100, cy = 100, r = 96
  const slices = Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([label, value]) => {
      const ratio = value / (total || 1)
      const start = cursor
      const end = cursor + ratio * 360
      cursor = end
      const mid = (start + end) / 2
      return {
        label,
        value,
        percent: Math.round(ratio * 1000) / 10,
        color: LABEL_COLORS[label] ?? '#ccc',
        path: describeSlice(cx, cy, r, start, end),
        labelPos: polarToCartesian(cx, cy, r * 0.68, mid),
      }
    })

  return (
    <div className="result-summary">

      {/* ── 좌측: 불량 상태 확인 ── */}
      <div className="result-summary__card result-summary__card--left">
        <h4 className="result-summary__card-title">불량 상태 확인</h4>
        <div className="result-summary__chart-body">
          {total === 0 ? (
            <p className="result-summary__empty">완료된 검사가 없습니다.</p>
          ) : (
            <>
              <DefectPie slices={slices} />
              <ul className="result-summary__legend">
                {slices.map(s => (
                  <li key={s.label} className="result-summary__legend-item">
                    <span className="result-summary__legend-dot" style={{ background: s.color }} />
                    <span className="result-summary__legend-name">{LABEL_NAMES[s.label]}</span>
                    <span className="result-summary__legend-value">{s.value}건 ({s.percent}%)</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* ── 우측: 검사 결과 테이블 ── */}
      <div className="result-summary__card result-summary__card--right">
        <div className="result-summary__table-wrapper">
          <table className="result-summary__table">
            <colgroup>
              <col style={{ width: '34%' }} />
              <col style={{ width: '33%' }} />
              <col style={{ width: '33%' }} />
            </colgroup>
            <thead>
              <tr>
                <th>Cell ID</th>
                <th>Result</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {completed.length === 0 ? (
                <tr>
                  <td colSpan={3} className="result-summary__empty-row">완료된 셀이 없습니다.</td>
                </tr>
              ) : (
                completed.map(cell => (
                  <tr
                    key={cell.batteryCellId}
                    className="result-summary__row"
                    onClick={() => navigate(ROUTES.BATTERY_DETAIL(cell.batteryCellId))}
                  >
                    <td>CELL-{cell.batteryCellId}</td>
                    <td className="result-summary__result-cell">
                      <span
                        className="result-summary__dot"
                        style={{ background: LABEL_COLORS[cell.finalLabel ?? ''] ?? '#5B5F63' }}
                      />
                      {cell.finalLabel ?? '-'}
                    </td>
                    <td>-</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

export { ResultSummary }
