import { BINS, BIN_PAD, rem, type BinKey } from './twinLayout'

interface TwinBinProps {
  binKey: BinKey
  /** 한글 판정명 */
  label: string
  count: number
  pct: number
  onClick?: () => void
}

/**
 * 배출함 카드 — 판정별로 완료 셀이 쌓이는 곳.
 * 구 `OverviewResult` 의 누적 바와 범례가 여기로 흡수된다. 같은 정보를 두 번 그리지 않는다
 * (DASHBOARD_REDESIGN.md §2.4). 클릭하면 완료 탭이 해당 필터로 열린다.
 *
 * 분기점에서 이 함까지 이어지는 슈트 곡선은 `TwinStage`의 별도 SVG 오버레이가 그린다 —
 * HTML/CSS로는 베지어 곡선을 그릴 수 없어 그 부분만 SVG로 남았다.
 */
function TwinBin({ binKey, label, count, pct, onClick }: TwinBinProps) {
  const box = BINS[binKey]
  const tone = binKey.toLowerCase()

  return (
    <button
      type="button"
      className={`twin-bin twin-bin--${tone}`}
      style={{ left: rem(box.x), top: rem(box.y), width: rem(box.w), height: rem(box.h), padding: `0 ${rem(BIN_PAD)}` }}
      onClick={onClick}
    >
      <span className="twin-bin__accent" />

      <span className="twin-bin__header">
        <span className="twin-bin__label">{label}</span>
        <span className="twin-bin__code">{binKey}</span>
        <span className="twin-bin__count">
          {count}
          <span className="twin-bin__pct"> {pct.toFixed(1)}%</span>
        </span>
      </span>
    </button>
  )
}

export { TwinBin }
