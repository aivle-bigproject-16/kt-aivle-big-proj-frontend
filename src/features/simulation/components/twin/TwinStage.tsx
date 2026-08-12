import type { CSSProperties } from 'react'
import { useSimulationStore } from '../../store/useSimulationStore'
import { useTwinAgents } from '../../hooks/useTwinAgents'
import { TwinStation } from './TwinStation'
import { TwinBin } from './TwinBin'
import { TwinPuck } from './TwinPuck'
import { TwinBatchTimeline } from './TwinBatchTimeline'
import {
  BELTS,
  BELT_THICKNESS,
  type BinKey,
  LINE_Y,
  SORTER,
  STAGE,
  STATIONS,
  STATION_HEADER_H,
  STATION_PAD,
  analyzeScanFrame,
  chutePath,
  rem,
  stationFloor,
} from './twinLayout'
import './Twin.css'

const BIN_KEYS: BinKey[] = ['PASS', 'REJECT', 'FAIL']

/** 스테이션 사이 벨트 한 구간. 스트라이프는 시뮬레이션이 도는 동안에만 흐른다 */
function TwinBelt({ x1, x2, running }: { x1: number; x2: number; running: boolean }) {
  return (
    <div
      className={`twin-belt${running ? ' twin-belt--running' : ''}`}
      style={{
        left: rem(x1),
        top: rem(LINE_Y - BELT_THICKNESS / 2),
        width: rem(x2 - x1),
        height: rem(BELT_THICKNESS),
      }}
    >
      <svg className="twin-belt__stripes" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
        <line x1="0" y1="50%" x2="100%" y2="50%" />
      </svg>
    </div>
  )
}

/** 분기점에서 배출함까지 이어지는 슈트 곡선 — HTML/CSS로는 베지어 곡선을 그릴 수 없어
   이 부분만 예외로 SVG로 남는다. 장식용이며 클릭/이벤트는 없다(pointer-events: none) */
function TwinChutes({ running }: { running: boolean }) {
  return (
    <svg
      className="twin-chutes"
      viewBox={`0 0 ${STAGE.width} ${STAGE.height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {BIN_KEYS.map((key) => (
        <path
          key={key}
          className={`twin-chute twin-chute--${key.toLowerCase()}${running ? ' twin-chute--running' : ''}`}
          d={chutePath(key)}
        />
      ))}
    </svg>
  )
}

/**
 * 디지털 트윈 스테이지 — 대기 → 촬영 → 분석 대기 → 분석 → 판정별 배출함까지의
 * 공정 라인을 위에서 내려다본 뷰. 셀 오브젝트가 구역 사이를 실제로 이동한다.
 *
 * 좌표는 전부 `twinLayout.ts` 가 소유한다. 이 파일에는 좌표 리터럴을 두지 않는다.
 * 슈트 곡선만 SVG이고 나머지는 전부 HTML/CSS(div 절대 위치)다.
 */
function TwinStage({ onNavigate }: { onNavigate?: (index: number) => void }) {
  const { agents, overflow } = useTwinAgents()

  const running = useSimulationStore((s) => s.simulationStatus === 'running')
  const totalCount = useSimulationStore((s) => s.batteryCellCount)
  const captureSpeed = useSimulationStore((s) => s.captureSpeed)

  const pendingCount = useSimulationStore((s) => s.registered.length)
  const nextBatchId = useSimulationStore((s) => s.registered[0]?.batchId)

  const captureCount = useSimulationStore((s) => s.capture.length)
  const capturingCount = useSimulationStore((s) => s.capture.filter((c) => c.status === 'CAPTURING').length)
  const capturedCount = useSimulationStore((s) => s.capture.filter((c) => c.status === 'CAPTURED').length)
  const capturingBatchId = useSimulationStore((s) => s.capture.find((c) => c.status === 'CAPTURING')?.batchId)

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

  /* 스위프/게이트는 스테이션 본문(body) 안에 담기는 장치 그래픽이다. 본문의 좌상단은
     항상 (스테이션.x + STATION_PAD, 스테이션.y + STATION_HEADER_H)이므로, 그 원점을
     빼면 stationFloor/analyzeScanFrame의 스테이지 절대좌표가 본문 기준 상대좌표가 된다 */
  const captureBodyOrigin = { x: STATIONS.capture.x + STATION_PAD, y: STATIONS.capture.y + STATION_HEADER_H }
  const analyzeBodyOrigin = { x: STATIONS.analyze.x + STATION_PAD, y: STATIONS.analyze.y + STATION_HEADER_H }
  const gateRel = {
    x: scanFrame.x - analyzeBodyOrigin.x,
    y: scanFrame.y - analyzeBodyOrigin.y,
    w: scanFrame.w,
    h: scanFrame.h,
  }
  const gateCaptionRel = { x: gateRel.x + gateRel.w / 2, y: gateRel.y + gateRel.h + 20 }

  return (
    <div
      className="twin-stage"
      style={{ width: rem(STAGE.width), height: rem(STAGE.height) }}
      role="img"
      aria-label={`배터리 셀 검사 공정 실시간 라인. 대기 ${pendingCount}, 촬영 중 ${capturingCount}, 분석 대기 ${capturedCount}, 완료 ${completedCount} / ${totalCount}`}
    >
      {/* 바닥 — 라인 전체가 놓인 판 */}
      <div className="twin-ground" />

      {/* 벨트 — 스테이션 사이를 잇는 본선 */}
      {BELTS.map((belt) => (
        <TwinBelt key={belt.id} x1={belt.x1} x2={belt.x2} running={running} />
      ))}

      {/* 분기점 — 판정에 따라 3방향 슈트로 갈린다 */}
      <div
        className={`twin-sorter${running ? ' twin-sorter--running' : ''}`}
        style={{ left: rem(SORTER.x), top: rem(SORTER.y) }}
      >
        <span className="twin-sorter__hub" />
        <span className="twin-sorter__core" />
      </div>

      {/* 슈트 — 유일하게 SVG로 남은 부분. 벨트보다 위, 오브젝트보다 아래 */}
      <TwinChutes running={running} />

      {/* 배출함 */}
      <TwinBin
        binKey="PASS"
        label="정상"
        count={passCount}
        pct={pct(passCount)}
        onClick={() => onNavigate?.(4)}
      />
      <TwinBin
        binKey="REJECT"
        label="불량"
        count={rejectCount}
        pct={pct(rejectCount)}
        onClick={() => onNavigate?.(4)}
      />
      <TwinBin
        binKey="FAIL"
        label="실패"
        count={failCount}
        pct={pct(failCount)}
        onClick={() => onNavigate?.(4)}
      />

      {/* 스테이션 3종 — 껍데기는 같고 채워지는 값만 다르다 */}
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

      {/* 촬영 챔버 — 촬영 중과 분석 대기가 한 칸에 함께 놓인다.
          대표 수치는 이 칸이 붙들고 있는 셀 전체이고, 그중 몇 개가 지금 찍히는지는
          보조 수치로 붙인다. 진한 청록이 늘지 않고 흐린 청록만 쌓이면 분석이 병목이다 */}
      <TwinStation
        box={STATIONS.capture}
        label="촬영"
        code="CAPTURING"
        count={captureCount}
        unit="cells"
        tone="process"
        active={capturingCount > 0}
        footerLeft={
          overflow.capture > 0
            ? `촬영 중 ${capturingCount} · 분석 대기 ${capturedCount} · +${overflow.capture} 미표시`
            : `촬영 중 ${capturingCount} · 분석 대기 ${capturedCount}`
        }
        footerRight={
          capturingBatchId !== undefined
            ? `Batch #${capturingBatchId} · ${captureSpeed?.toFixed(1) ?? '-'}s`
            : '촬영 중 없음'
        }
        onClick={() => onNavigate?.(2)}
      >
        {/* 촬영 스위프 — 촬영 중일 때만 챔버를 훑는다 */}
        <div
          className={`twin-sweep${capturingCount > 0 ? ' twin-sweep--running' : ''}`}
          style={
            {
              left: 0,
              top: 0,
              width: rem(SWEEP_W),
              height: rem(captureFloor.h),
              '--twin-sweep-distance': rem(captureFloor.w - SWEEP_W),
            } as CSSProperties
          }
        />
      </TwinStation>

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
        <div
          className={`twin-gate${analyzing ? ' twin-gate--running' : ''}`}
          style={{ left: rem(gateRel.x), top: rem(gateRel.y), width: rem(gateRel.w), height: rem(gateRel.h) }}
        >
          <span
            className={`twin-gate__beam${analyzing ? ' twin-gate__beam--running' : ''}`}
            style={{ '--twin-beam-distance': rem(gateRel.h) } as CSSProperties}
          />
        </div>
        <span
          className="twin-gate__caption"
          style={{ left: rem(gateCaptionRel.x), top: rem(gateCaptionRel.y) }}
        >
          {analyzing ? 'AI 추론 진행 중' : '분석 대기 중'}
        </span>
      </TwinStation>

      {/* 배치 진척 — 스테이션 줄 아래. 셀 단위와 결과 단위 사이의 배치 축을 채운다 */}
      <TwinBatchTimeline />

      {/* 오브젝트 레이어 — 셀 퍽. 항상 최상단에서 구역 사이를 이동한다 */}
      <div className="twin-agents">
        {agents.map((agent) => (
          <TwinPuck key={agent.id} agent={agent} />
        ))}
      </div>
    </div>
  )
}

export { TwinStage }
