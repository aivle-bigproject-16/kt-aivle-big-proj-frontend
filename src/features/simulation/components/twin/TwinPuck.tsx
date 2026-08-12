import { PUCK, analyzeSlot, binSlot, captureSlot, sourceSlot, type Point } from './twinLayout'
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

/** 셀 오브젝트 — 배터리 셀 모양의 퍽. 원점 기준 중앙 정렬로 그려 좌표 이동만으로 배치된다 */
function TwinPuck({ agent }: { agent: TwinAgent }) {
  const { x, y } = slotPoint(agent)
  const halfW = PUCK.w / 2
  const halfH = PUCK.h / 2

  return (
    <g className="twin-puck" style={{ transform: `translate(${x}px, ${y}px)` }}>
      <g className={`twin-puck__body twin-puck__body--${toneOf(agent)}`}>
        <rect
          className="twin-puck__shell"
          x={-halfW}
          y={-halfH}
          width={PUCK.w}
          height={PUCK.h}
          rx={3}
        />
        <rect className="twin-puck__terminal" x={halfW - 1} y={-3} width={4} height={6} rx={1.5} />
        <rect className="twin-puck__rib" x={-halfW + 5} y={-halfH + 4} width={12} height={2} rx={1} />
      </g>
    </g>
  )
}

export { TwinPuck }
