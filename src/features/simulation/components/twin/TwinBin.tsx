import { BINS, BIN_ACCENT_W, BIN_PAD, chutePath, type BinKey } from './twinLayout'

interface TwinBinProps {
  binKey: BinKey
  /** 한글 판정명 */
  label: string
  count: number
  pct: number
  /** 방금 이 함으로 셀이 떨어졌는지 — 슈트를 잠깐 밝힌다 */
  running: boolean
  onClick?: () => void
}

/**
 * 배출함 — 판정별로 완료 셀이 쌓이는 곳.
 * 구 `OverviewResult` 의 누적 바와 범례가 여기로 흡수된다. 같은 정보를 두 번 그리지 않는다
 * (DASHBOARD_REDESIGN.md §2.4). 클릭하면 완료 탭이 해당 필터로 열린다.
 */
function TwinBin({ binKey, label, count, pct, running, onClick }: TwinBinProps) {
  const box = BINS[binKey]
  const tone = binKey.toLowerCase()
  const headerBaseline = box.y + 23

  return (
    <g className={`twin-bin twin-bin--${tone}`}>
      <path
        className={`twin-chute twin-chute--${tone}${running ? ' twin-chute--running' : ''}`}
        d={chutePath(binKey)}
      />

      <g
        className="twin-bin__card"
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={(e) => {
          if (onClick && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            onClick()
          }
        }}
      >
        <rect className="twin-bin__shell" x={box.x} y={box.y} width={box.w} height={box.h} rx={12} />
        <rect
          className="twin-bin__accent"
          x={box.x}
          y={box.y + 10}
          width={BIN_ACCENT_W}
          height={box.h - 20}
          rx={2.5}
        />

        <text className="twin-bin__label" x={box.x + BIN_PAD + BIN_ACCENT_W} y={headerBaseline}>
          {label}
        </text>
        <text
          className="twin-bin__code"
          x={box.x + BIN_PAD + BIN_ACCENT_W + label.length * 13 + 8}
          y={headerBaseline}
        >
          {binKey}
        </text>

        <text className="twin-bin__count" x={box.x + box.w - BIN_PAD} y={headerBaseline}>
          {count}
          <tspan className="twin-bin__pct"> {pct.toFixed(1)}%</tspan>
        </text>
      </g>
    </g>
  )
}

export { TwinBin }
