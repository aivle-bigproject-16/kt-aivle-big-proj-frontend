import {
  ANALYZE_PUCK,
  BIN_PUCK,
  STATION_PUCK,
  analyzeSlot,
  binSlot,
  captureSlot,
  rem,
  sourceSlot,
  type Point,
  type PuckSize,
} from './twinLayout'
import type { TwinAgent } from '../../hooks/useTwinAgents'

/** 오브젝트 하나의 목표 좌표. 구역·슬롯이 바뀌면 이 값이 바뀌고, 이동은 CSS transition 이 만든다 */
function slotPoint(agent: TwinAgent): Point {
  switch (agent.zone) {
    case 'source':
      return sourceSlot(agent.slot)
    case 'capture':
      return captureSlot(agent.slot)
    case 'analyze':
      return analyzeSlot()
    default:
      return binSlot(agent.zone, agent.slot)
  }
}

/** 컨테이너별 퍽 크기 — 대기/촬영은 같은 스테이션 격자를 쓰므로 같은 크기,
   분석은 슬롯이 하나뿐이라 따로, 배출함 3종(정상/불량/실패)은 서로 동일하다 */
function puckSizeOf(agent: TwinAgent): PuckSize {
  switch (agent.zone) {
    case 'source':
    case 'capture':
      return STATION_PUCK
    case 'analyze':
      return ANALYZE_PUCK
    default:
      return BIN_PUCK
  }
}

/** 상태별 톤. 촬영 중/촬영 완료는 명도만 다르다(§6.1 파생색) */
function toneOf(agent: TwinAgent): string {
  /* 배출함에 들어간 셀은 판정색으로 칠한다. status 를 보지 않는 이유는
     API_SPEC Example 의 completed[] 원소 status 가 COMPLETED 가 아니라
     CAPTURING/CAPTURED 로 적혀 있어서다 — 그대로 내려오면 완료된 셀이 청록으로
     보인다. 구역은 finalLabel 에서 파생되므로 판정과 어긋날 수 없다 */
  if (agent.zone === 'PASS' || agent.zone === 'REJECT' || agent.zone === 'FAIL') {
    return agent.zone.toLowerCase()
  }

  switch (agent.status) {
    case 'CAPTURING':
      return 'capturing'
    case 'CAPTURED':
      return 'captured'
    case 'ANALYZING':
      return 'analyzing'
    default:
      return 'pending'
  }
}

/** 셀 오브젝트 — battery-icon-original.svg와 같은 배터리 셀 모양(셀 몸통+오른쪽 단자+
   왼쪽 위 리브)을 퍽 크기(puckSizeOf가 구역별로 정한다) 안에 그대로 채운다. 이 아이콘은
   이미 가로가 긴 모양이라 회전이 필요 없다 */
function TwinPuck({ agent }: { agent: TwinAgent }) {
  const { x, y } = slotPoint(agent)
  const puck = puckSizeOf(agent)

  return (
    <div
      className="twin-puck"
      style={{
        width: rem(puck.w),
        height: rem(puck.h),
        transform: `translate(${rem(x)}, ${rem(y)}) translate(-50%, -50%)`,
      }}
    >
      <div className={`twin-puck__body twin-puck__body--${toneOf(agent)}`}>
        <svg
          width={rem(puck.w)}
          height={rem(puck.h)}
          viewBox="-13 -7.5 29 15"
          preserveAspectRatio="none"
        >
          <rect className="twin-puck__shell" x="-13" y="-7.5" width="26" height="15" rx="3" />
          <rect className="twin-puck__terminal" x="12" y="-3" width="4" height="6" rx="1.5" />
          <rect className="twin-puck__rib" x="-8" y="-3.5" width="12" height="2" rx="1" />
        </svg>
      </div>
    </div>
  )
}

export { TwinPuck }
