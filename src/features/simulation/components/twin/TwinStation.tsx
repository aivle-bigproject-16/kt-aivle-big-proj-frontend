import type { ReactNode } from 'react'
import { STATION_FOOTER_OFFSET, STATION_HEADER_H, STATION_PAD, type Box } from './twinLayout'

interface TwinStationProps {
  box: Box
  /** 단계명(한글) */
  label: string
  /** 영문 코드 */
  code: string
  /** 대표 수치와 단위 */
  count: number
  unit: string
  footerLeft: string
  footerRight: string
  /** 지금 이 단계가 실제로 돌고 있는지 — 상태 점 펄스와 헤더 강조를 켠다 */
  active: boolean
  tone: 'pending' | 'process'
  onClick?: () => void
  /** 스테이션 바닥 위에 얹는 장치 그래픽 (스캐너 프레임 등) */
  children?: ReactNode
}

/**
 * 스테이션 껍데기 — 3개 스테이션이 이 컴포넌트 하나를 공유한다.
 * 슬롯 위치·높이·정렬은 고정이고 채워지는 값만 다르다 (DASHBOARD_REDESIGN.md §2.2).
 */
function TwinStation({
  box,
  label,
  code,
  count,
  unit,
  footerLeft,
  footerRight,
  active,
  tone,
  onClick,
  children,
}: TwinStationProps) {
  const headerBaseline = box.y + 24
  const floorY = box.y + STATION_HEADER_H
  const floorH = box.h - STATION_HEADER_H

  return (
    <g
      className={`twin-station twin-station--${tone}${active ? ' twin-station--active' : ''}`}
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
      <rect className="twin-station__shell" x={box.x} y={box.y} width={box.w} height={box.h} rx={12} />
      <rect
        className="twin-station__floor"
        x={box.x + 1}
        y={floorY}
        width={box.w - 2}
        height={floorH - 1}
        rx={11}
      />

      <circle className="twin-station__dot" cx={box.x + STATION_PAD + 4} cy={headerBaseline - 5} r={4} />
      <text className="twin-station__label" x={box.x + STATION_PAD + 16} y={headerBaseline}>
        {label}
      </text>
      <text className="twin-station__code" x={box.x + STATION_PAD + 16 + labelWidth(label)} y={headerBaseline}>
        {code}
      </text>

      <text className="twin-station__count" x={box.x + box.w - STATION_PAD} y={headerBaseline}>
        {count}
        <tspan className="twin-station__unit"> {unit}</tspan>
      </text>

      {children}

      <text className="twin-station__footer-left" x={box.x + STATION_PAD} y={box.y + box.h - STATION_FOOTER_OFFSET}>
        {footerLeft}
      </text>
      <text
        className="twin-station__footer-right"
        x={box.x + box.w - STATION_PAD}
        y={box.y + box.h - STATION_FOOTER_OFFSET}
      >
        {footerRight}
      </text>
    </g>
  )
}

/* 한글 라벨 뒤에 영문 코드를 붙이려면 라벨 폭이 필요한데, SVG 텍스트는 렌더 전에는
   폭을 모른다. 라벨은 한글과 공백뿐이라 글자당 고정폭으로 근사한다 —
   15px 한글은 거의 정확히 정사각(15)이고 공백은 그 1/3쯤이다 */
const HANGUL = /[가-힣]/

function labelWidth(label: string): number {
  return [...label].reduce((w, ch) => w + (HANGUL.test(ch) ? 15 : 5), 0) + 8
}

export { TwinStation }
