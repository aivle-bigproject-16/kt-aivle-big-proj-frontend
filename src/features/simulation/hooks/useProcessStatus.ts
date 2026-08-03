import { useSimulationStore } from '../store/useSimulationStore'

export type ProcessStatus = 'PENDING' | 'RUNNING' | 'COMPLETED'

export const PROCESS_STATUS_LABEL: Record<ProcessStatus, string> = {
  PENDING: '대기중',
  RUNNING: '진행 중',
  COMPLETED: '완료',
}

export const PROCESS_STATUS_DOT: Record<ProcessStatus, string> = {
  PENDING: '#5B5F63',
  RUNNING: '#E60012',
  COMPLETED: '#2ECC71',
}

/** 공정 상태 — WS event와 완료 셀 유무로 파생한다 */
export function useProcessStatus(): ProcessStatus {
  const event = useSimulationStore(s => s.event)
  const completedCount = useSimulationStore(s => s.completed.length)

  if (event === 'PROGRESS') return 'RUNNING'
  if (event === 'COMPLETED' && completedCount > 0) return 'COMPLETED'
  return 'PENDING'
}

/** 공정 상태의 한글 라벨 */
export function useProcessStatusLabel(): string {
  return PROCESS_STATUS_LABEL[useProcessStatus()]
}
