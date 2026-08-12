import {
  ANALYZE_PUCK,
  BIN_PUCK,
  STATION_PUCK,
  analyzeSlot,
  binSlot,
  captureSlot,
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
   90도 돌려 눕혀 박스 비율에 맞춘다 — 회전 전 박스를 가로/세로를 바꿔 준비한 뒤 그
   중심(원점) 기준으로 -90도(왼쪽) 돌리면 화면에는 다시 원래 비율로 보이면서 세로로 긴
   아이콘이 꽉 채워진다. 원점 기준으로 그려 좌표 이동만으로 배치된다 */
function TwinPuck({ agent }: { agent: TwinAgent }) {
  const { x, y } = slotPoint(agent)
  const puck = puckSizeOf(agent)
  const halfW = puck.w / 2
  const halfH = puck.h / 2

  return (
    <g className="twin-puck" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <g className={`twin-puck__body twin-puck__body--${toneOf(agent)}`}>
        <svg
          x={-halfH}
          y={-halfW}
          width={puck.h}
          height={puck.w}
          viewBox="0 0 17 31"
          preserveAspectRatio="xMidYMid meet"
          transform="rotate(-90)"
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
      </g>
    </g>
  )
}

export { TwinPuck }
