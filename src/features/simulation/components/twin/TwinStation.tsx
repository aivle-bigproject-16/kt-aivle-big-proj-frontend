import type { ReactNode } from 'react'
import { STATION_PAD, rem, type Box } from './twinLayout'

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
  /** 스테이션 바닥 위에 얹는 장치 그래픽 (스캐너 프레임 등) — 좌표는 이 스테이션의
     좌상단(box.x, box.y)을 원점으로 하는 상대 좌표로 넘겨야 한다 */
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
  return (
    <div
      className={`twin-station twin-station--${tone}${active ? ' twin-station--active' : ''}`}
      style={{ left: rem(box.x), top: rem(box.y), width: rem(box.w), height: rem(box.h), padding: `0 ${rem(STATION_PAD)}` }}
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
      <div className="twin-station__header">
        <span className="twin-station__dot" />
        <span className="twin-station__label">{label}</span>
        <span className="twin-station__code">{code}</span>
        <span className="twin-station__count">
          {count}
          <span className="twin-station__unit"> {unit}</span>
        </span>
      </div>

      <div className="twin-station__body">{children}</div>

      <div className="twin-station__footer">
        <span className="twin-station__footer-left">{footerLeft}</span>
        <span className="twin-station__footer-right">{footerRight}</span>
      </div>
    </div>
  )
}

export { TwinStation }
