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

/** 셀 오브젝트 — pending-body__cell과 같은 배터리 아이콘(viewBox 17×31, 세로가 긴 모양)을
   퍽 크기(가로가 긴 모양, puckSizeOf가 구역별로 정한다) 안에 맞춰 넣는다. 그대로 넣으면
   세로 아이콘이 가로 박스 안에서 작게 쪼그라들며 양옆에 빈 공간이 크게 남아서, 아이콘을
   90도 돌려 눕혀 박스 비율에 맞춘다 — 회전 전 svg를 세로 모양(가로=puck.h, 세로=puck.w)으로
   준비해 박스 중심에 두고, 그 중심 기준으로 -90도 돌리면 화면에는 다시 가로로 긴 퍽
   비율로 보이면서 세로로 긴 아이콘이 꽉 채워진다.
   화면에 보이는(회전 후) 가로는 회전 전 svg의 height 속성이 결정한다 — 요청대로 이
   값에 1.1을 곱해 아이콘이 퍽 박스보다 살짝 더 가로로 넓게 보이도록 늘렸다(그만큼
   비율은 31:17에서 벗어나고, preserveAspectRatio="none"이라 실제로 늘어나 보인다).
   그 다음 배터리 아이콘 전체 크기를 0.95배 했다 — width/height 둘 다에 곱해서
   방금 만든 1.1배 가로 늘림 비율은 그대로 유지한 채 전체적으로만 작아진다 */
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
        {agent.zone === 'source' ? (
          /* 비교용 — 대기 구역만 최초 버전 아이콘(battery-icon-original.svg)을 쓴다.
             이미 가로가 긴 모양이라 회전 없이 박스에 그대로 채운다 */
          <svg
            className="twin-puck__icon-original"
            width={rem(puck.w)}
            height={rem(puck.h)}
            viewBox="-13 -7.5 29 15"
            preserveAspectRatio="none"
          >
            <rect className="twin-puck__shell" x="-13" y="-7.5" width="26" height="15" rx="6" />
            <rect className="twin-puck__terminal" x="12" y="-3" width="4" height="6" rx="2" />
            <rect className="twin-puck__rib" x="-8" y="-3.5" width="12" height="2" rx="1" />
          </svg>
        ) : (
          <svg
            width={rem(puck.h * 0.95)}
            height={rem(puck.w * 1.1 * 0.95)}
            viewBox="0 0 17 31"
            preserveAspectRatio="none"
          >
            <path
              className="twin-puck__nub"
              d="M10.0371 0L5.7514 0C5.35691 0 5.03711 0.319799 5.03711 0.714292L5.03711 1.42858C5.03711 1.82308 5.35691 2.14288 5.7514 2.14288L10.0371 2.14288C10.4316 2.14288 10.7514 1.82308 10.7514 1.42858V0.714292C10.7514 0.319799 10.4316 0 10.0371 0Z"
            />
            <path
              className="twin-puck__outline"
              d="M14.25 2L2.25 2C1.42157 2 0.75 2.64287 0.75 3.4359L0.75 28.5641C0.75 29.3571 1.42157 30 2.25 30H14.25C15.0784 30 15.75 29.3571 15.75 28.5641L15.75 3.4359C15.75 2.64287 15.0784 2 14.25 2Z"
              fill="none"
              strokeWidth="1.5"
            />
            <rect className="twin-puck__fill" x="2.75" y="4" width="11" height="24" />
          </svg>
        )}
      </div>
    </div>
  )
}

export { TwinPuck }
