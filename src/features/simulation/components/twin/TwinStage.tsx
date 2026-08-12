import type { CSSProperties } from 'react'
import { useSimulationStore } from '../../store/useSimulationStore'
import { useTwinAgents } from '../../hooks/useTwinAgents'
import { TwinStation } from './TwinStation'
import { TwinBin } from './TwinBin'
import { TwinPuck } from './TwinPuck'
import {
  BELTS,
  BELT_THICKNESS,
  LINE_Y,
  SORTER,
  STAGE,
  STATIONS,
  analyzeScanFrame,
  stationFloor,
} from './twinLayout'
import './Twin.css'

/** 스테이션 사이 벨트 한 구간. 스트라이프는 시뮬레이션이 도는 동안에만 흐른다 */
function TwinBelt({ x1, x2, running }: { x1: number; x2: number; running: boolean }) {
  return (
    <g className={`twin-belt${running ? ' twin-belt--running' : ''}`}>
      <rect
        className="twin-belt__deck"
        x={x1}
        y={LINE_Y - BELT_THICKNESS / 2}
        width={x2 - x1}
        height={BELT_THICKNESS}
        rx={4}
      />
      <line className="twin-belt__stripes" x1={x1} y1={LINE_Y} x2={x2} y2={LINE_Y} />
    </g>
  )
}

/**
 * 디지털 트윈 스테이지 — 대기 → 촬영 → 분석 대기 → 분석 → 판정별 배출함까지의
 * 공정 라인을 위에서 내려다본 뷰. 셀 오브젝트가 구역 사이를 실제로 이동한다.
 *
 * 좌표는 전부 `twinLayout.ts` 가 소유한다. 이 파일에는 좌표 리터럴을 두지 않는다.
 */
function TwinStage({ onNavigate }: { onNavigate?: (index: number) => void }) {
  const { agents, overflow } = useTwinAgents()

  const running = useSimulationStore((s) => s.simulationStatus === 'running')
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  const captureSpeed = useSimulationStore((s) => s.captureSpeed)

  const pendingCount = useSimulationStore((s) => s.registered.length)
  const nextBatchId = useSimulationStore((s) => s.registered[0]?.batchId)

  const capturingCount = useSimulationStore((s) => s.capture.filter((c) => c.status === 'CAPTURING').length)
  const capturedCount = useSimulationStore((s) => s.capture.filter((c) => c.status === 'CAPTURED').length)
  const capturingBatchId = useSimulationStore((s) => s.capture.find((c) => c.status === 'CAPTURING')?.batchId)
  const headBatchId = useSimulationStore((s) => s.capture.find((c) => c.status === 'CAPTURED')?.batchId)

  const analyzeCellId = useSimulationStore((s) => s.analyze?.batteryCellId)
  const analyzeBatchId = useSimulationStore((s) => s.analyze?.batchId)
  const analyzing = analyzeCellId !== undefined

  const completedCount = useSimulationStore((s) => s.completed.length)
  const passCount = useSimulationStore((s) => s.completed.filter((c) => c.finalLabel === 'PASS').length)
  const rejectCount = useSimulationStore((s) => s.completed.filter((c) => c.finalLabel === 'REJECT').length)
  const failCount = useSimulationStore((s) => s.completed.filter((c) => c.finalLabel === 'FAIL').length)
  const pct = (n: number) => (completedCount > 0 ? (n / completedCount) * 100 : 0)

  const captureFloor = stationFloor('capture')
  const scanFrame = analyzeScanFrame()
  const SWEEP_W = 30

  return (
    <svg
      className="twin-stage"
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      role="img"
      aria-label={`배터리 셀 검사 공정 실시간 라인. 대기 ${pendingCount}, 촬영 ${capturingCount}, 분석 대기 ${capturedCount}, 완료 ${completedCount} / ${totalCount}`}
    >
      <defs>
        <pattern id="twin-floor-grid" width="16" height="16" patternUnits="userSpaceOnUse">
          <path className="twin-floor-grid__line" d="M 16 0 L 0 0 0 16" />
        </pattern>
      </defs>

      {/* 바닥 — 라인 전체가 놓인 판 */}
      <rect className="twin-ground" x={0} y={0} width={STAGE.width} height={STAGE.height} rx={15} />
      <rect className="twin-ground__grid" x={0} y={0} width={STAGE.width} height={STAGE.height} rx={15} />

      {/* 벨트 — 스테이션 사이를 잇는 본선 */}
      {BELTS.map((belt) => (
        <TwinBelt key={belt.id} x1={belt.x1} x2={belt.x2} running={running} />
      ))}

      {/* 분기점 — 판정에 따라 3방향 슈트로 갈린다 */}
      <g className={`twin-sorter${running ? ' twin-sorter--running' : ''}`}>
        <circle className="twin-sorter__hub" cx={SORTER.x} cy={SORTER.y} r={11} />
        <circle className="twin-sorter__core" cx={SORTER.x} cy={SORTER.y} r={4} />
      </g>

      {/* 배출함 — 슈트를 함께 그린다. 벨트보다 위, 오브젝트보다 아래 */}
      <TwinBin
        binKey="PASS"
        label="정상"
        count={passCount}
        pct={pct(passCount)}
        running={running}
        onClick={() => onNavigate?.(4)}
      />
      <TwinBin
        binKey="REJECT"
        label="불량"
        count={rejectCount}
        pct={pct(rejectCount)}
        running={running}
        onClick={() => onNavigate?.(4)}
      />
      <TwinBin
        binKey="FAIL"
        label="실패"
        count={failCount}
        pct={pct(failCount)}
        running={running}
        onClick={() => onNavigate?.(4)}
      />

      {/* 스테이션 4종 — 껍데기는 같고 채워지는 값만 다르다 */}
      <TwinStation
        box={STATIONS.source}
        label="대기"
        code="PENDING"
        count={pendingCount}
        unit="units"
        tone="pending"
        active={running && pendingCount > 0}
        footerLeft={overflow.source > 0 ? `+${overflow.source} 미표시` : `/ ${totalCount} total`}
        footerRight={nextBatchId !== undefined ? `Batch #${nextBatchId}` : '대기 배치 없음'}
        onClick={() => onNavigate?.(1)}
      />

      <TwinStation
        box={STATIONS.capture}
        label="촬영"
        code="CAPTURING"
        count={capturingCount}
        unit="active"
        tone="process"
        active={capturingCount > 0}
        footerLeft={`${captureSpeed?.toFixed(1) ?? '-'}s / 배치`}
        footerRight={capturingBatchId !== undefined ? `Batch #${capturingBatchId}` : '촬영 중 없음'}
        onClick={() => onNavigate?.(2)}
      >
        {/* 촬영 스위프 — 촬영 중일 때만 챔버를 훑는다 */}
        <rect
          className={`twin-sweep${capturingCount > 0 ? ' twin-sweep--running' : ''}`}
          x={captureFloor.x}
          y={captureFloor.y}
          width={SWEEP_W}
          height={captureFloor.h}
          rx={4}
          style={{ '--twin-sweep-distance': `${captureFloor.w - SWEEP_W}px` } as CSSProperties}
        />
      </TwinStation>

      {/* 분석 대기 큐 — 여기가 길어지면 분석이 병목이라는 뜻이다 */}
      <TwinStation
        box={STATIONS.buffer}
        label="분석 대기"
        code="QUEUE"
        count={capturedCount}
        unit="queued"
        tone="process"
        active={capturedCount > 0}
        footerLeft={overflow.buffer > 0 ? `+${overflow.buffer} 미표시` : '촬영 완료 · 분석 대기'}
        footerRight={headBatchId !== undefined ? `선두 Batch #${headBatchId}` : '큐 비어 있음'}
        onClick={() => onNavigate?.(3)}
      />

      <TwinStation
        box={STATIONS.analyze}
        label="분석"
        code="ANALYSIS"
        count={analyzing ? 1 : 0}
        unit="inference"
        tone="process"
        active={analyzing}
        footerLeft="YOLOv11-seg"
        footerRight={analyzeCellId !== undefined ? `#${analyzeCellId} · B#${analyzeBatchId}` : '분석 중 없음'}
        onClick={() => onNavigate?.(3)}
      >
        {/* 추론 게이트 — 분석 슬롯을 감싸는 검사 프레임 */}
        <rect
          className={`twin-gate${analyzing ? ' twin-gate--running' : ''}`}
          x={scanFrame.x}
          y={scanFrame.y}
          width={scanFrame.w}
          height={scanFrame.h}
          rx={8}
        />
        <line
          className={`twin-gate__beam${analyzing ? ' twin-gate__beam--running' : ''}`}
          x1={scanFrame.x}
          y1={scanFrame.y}
          x2={scanFrame.x + scanFrame.w}
          y2={scanFrame.y}
          style={{ '--twin-beam-distance': `${scanFrame.h}px` } as CSSProperties}
        />
        <text className="twin-gate__caption" x={scanFrame.x + scanFrame.w / 2} y={scanFrame.y + scanFrame.h + 20}>
          {analyzing ? 'AI 추론 진행 중' : '분석 대기 중'}
        </text>
      </TwinStation>

      {/* 오브젝트 레이어 — 셀 퍽. 항상 최상단에서 구역 사이를 이동한다 */}
      <g className="twin-agents">
        {agents.map((agent) => (
          <TwinPuck key={agent.id} agent={agent} />
        ))}
      </g>
    </svg>
  )
}

export { TwinStage }
