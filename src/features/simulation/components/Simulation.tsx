import { useState, type ReactNode } from 'react'
import './Simulation.css'
import { InputIcon, CaptureIcon, AnalysisIcon, CheckIcon, AlertIcon } from './Icons'
import SimulationCard from './SimulationCard'
import AnalysisCard from './AnalysisCard'
import CompactCard from './CompactCard'
import { SimulationCardModal } from './SimulationCardModal'
import { useSimulationStore } from '../store/useSimulationStore'

const ACCENT_COLOR = '#E60012'
const TEXT_SECONDARY = '#5B5F63'

function VariantLabel({ children }: { children: ReactNode }) {
  return <p className="simulation__variant-label">{children}</p>
}

function Simulation() {
  type ModalCard = 'pending' | 'capture' | 'analyze' | 'pass' | 'reject' | 'fail' | null
  const [modalCard, setModalCard] = useState<ModalCard>(null)

  const batteryCellCount = useSimulationStore((s) => s.batteryCellCount)
  const registered = useSimulationStore((s) => s.registered)
  const capture = useSimulationStore((s) => s.capture)
  const analyze = useSimulationStore((s) => s.analyze)
  const completed = useSimulationStore((s) => s.completed)
  const captureSpeed = useSimulationStore((s) => s.captureSpeed)

  // 셀 단위 집계
  const registeredCellCount = registered.length
  const capturingCellCount = capture.length

  // 촬영은 배치 단위로 표시 — CAPTURING 상태 셀의 batchId를 진행 키로 사용
  const activeBatchId = capture.find((c) => c.status === 'CAPTURING')?.batchId

  const passCount = completed.filter((c) => c.finalLabel === 'PASS').length
  const rejectCount = completed.filter((c) => c.finalLabel === 'REJECT').length
  const failCount = completed.filter((c) => c.finalLabel === 'FAIL').length
  const completedCount = completed.length

  return (
    <section className="simulation">
      <div className="simulation__header">
        <h3 className="simulation__title">Live Monitoring Flow</h3>
      </div>

      <div className="simulation__body">
        <div className="simulation__cards">
          <SimulationCard
            label="대기 (PENDING)"
            icon={<InputIcon />}
            iconColor={TEXT_SECONDARY}
            current={registeredCellCount}
            total={batteryCellCount}
            unit="units"
            onClick={() => setModalCard('pending')}
          />
          <div className="simulation__connector" aria-hidden="true" />
          <SimulationCard
            label="촬영 (CAPTURING)"
            icon={<CaptureIcon />}
            iconColor={ACCENT_COLOR}
            current={capturingCellCount}
            total={batteryCellCount}
            unit="active"
            progressDurationSec={activeBatchId !== undefined ? (captureSpeed ?? undefined) : undefined}
            progressKey={activeBatchId}
            batchId={activeBatchId}
            onClick={() => setModalCard('capture')}
          />
          <div className="simulation__connector" aria-hidden="true" />
          <AnalysisCard
            label="분석 (ANALYSIS)"
            icon={<AnalysisIcon />}
            iconColor={ACCENT_COLOR}
            current={analyze ? 1 : 0}
            unit="queued"
            active={analyze !== null}
            batchId={analyze?.batchId}
            onClick={() => setModalCard('analyze')}
          />
          <div className="simulation__connector simulation__connector--branch" aria-hidden="true">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M0 50 H50 M50 25 V75 M50 25 H100 M50 75 H100"
                stroke="#191C1D"
                strokeWidth="1"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
          <div className="simulation__cards-side">
            <CompactCard
              label="정상 (PASS)"
              icon={<CheckIcon />}
              iconColor={TEXT_SECONDARY}
              current={passCount}
              total={completedCount}
              unit="units"
              onClick={() => setModalCard('pass')}
            />
            <div className="simulation__cards-side-row">
              <CompactCard
                label="불량 (REJECT)"
                icon={<AlertIcon />}
                iconColor={ACCENT_COLOR}
                current={rejectCount}
                total={completedCount}
                unit="units"
                onClick={() => setModalCard('reject')}
              />
              <div className="simulation__cards-side-link" aria-hidden="true" />
              <CompactCard
                label="검사 실패 (FAIL)"
                icon={<AlertIcon />}
                iconColor={ACCENT_COLOR}
                current={failCount}
                total={completedCount}
                unit="units"
                onClick={() => setModalCard('fail')}
              />
            </div>
          </div>
        </div>
      </div>

      <SimulationCardModal
        open={modalCard === 'pending'}
        onClose={() => setModalCard(null)}
        label="대기 (PENDING)"
        cells={registered}
      />
      <SimulationCardModal
        open={modalCard === 'capture'}
        onClose={() => setModalCard(null)}
        label="촬영 (CAPTURING)"
        cells={[...capture].sort((a, b) =>
          a.status === 'CAPTURING' && b.status !== 'CAPTURING' ? -1
          : a.status !== 'CAPTURING' && b.status === 'CAPTURING' ? 1
          : 0
        )}
      />
      <SimulationCardModal
        open={modalCard === 'analyze'}
        onClose={() => setModalCard(null)}
        label="분석 (ANALYSIS)"
        cells={analyze ? [analyze] : []}
      />
      <SimulationCardModal
        open={modalCard === 'pass'}
        onClose={() => setModalCard(null)}
        label="정상 (PASS)"
        cells={completed}
        statusSource="finalLabel"
        finalLabelFilter="PASS"
        emptyMessage="현재 정상(PASS) 셀이 없습니다."
      />
      <SimulationCardModal
        open={modalCard === 'reject'}
        onClose={() => setModalCard(null)}
        label="불량 (REJECT)"
        cells={completed}
        statusSource="finalLabel"
        finalLabelFilter="REJECT"
        emptyMessage="현재 불량(REJECT) 셀이 없습니다."
      />
      <SimulationCardModal
        open={modalCard === 'fail'}
        onClose={() => setModalCard(null)}
        label="검사 실패 (FAIL)"
        cells={completed}
        statusSource="finalLabel"
        finalLabelFilter="FAIL"
        emptyMessage="현재 검사 실패(FAIL) 셀이 없습니다."
      />
    </section>
  )
}

export { Simulation }
