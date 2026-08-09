import { useCountUp } from '../hooks/useCountUp'
// 1200 기준 구 CSS는 history/KpiCards.css로 이동됨 — 1400 기준으로 새로 만들 것

interface KpiCardProps {
  title: string
  subtitle: string
  /** 숫자를 주면 점진적으로 세어 올리고, 문자열(공정 상태 등)은 그대로 표시한다 */
  value: string | number
  /** value가 숫자일 때의 표시 형식 */
  format?: (n: number) => string
  /** 값 뒤에 고정으로 붙는 기호(%, 단위 등). 숫자와 분리돼 자릿수가 바뀌어도 움직이지 않는다 */
  suffix?: string
  decimals?: number
  unit?: string
  accent?: boolean
  dotColor?: string
  yieldLayout?: boolean
}

function KpiCard({ title, subtitle, value, format, suffix, decimals, unit, accent, dotColor, yieldLayout }: KpiCardProps) {
  const isNumeric = typeof value === 'number'
  const counted = useCountUp(isNumeric ? value : 0, { decimals })
  const display = isNumeric ? (format ? format(counted) : String(counted)) : value

  return (
    <div className="kpi-card">
      <div className="kpi-card__header">
        <span className="kpi-card__title">{title}</span>
        <span className="kpi-card__subtitle">{subtitle}</span>
      </div>

      <div className="kpi-card__value-row">
        {dotColor && (
          <span className="kpi-card__dot" style={{ background: dotColor }} />
        )}

        {unit && (
          <span className="kpi-card__unit">{unit}</span>
        )}

        <span
          key={isNumeric ? undefined : value}
          className={[
            'kpi-card__value',
            isNumeric ? '' : 'kpi-card__value--animate',
            accent ? 'kpi-card__value--accent' : '',
            dotColor ? 'kpi-card__value--status' : '',
          ].filter(Boolean).join(' ')}
        >
          <span className="kpi-card__value-num">{display}</span>
          {suffix && <span className="kpi-card__value-suffix">{suffix}</span>}
        </span>

      </div>
    </div>
  )
}

export { KpiCard }
