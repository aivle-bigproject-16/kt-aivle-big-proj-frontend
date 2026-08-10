import type { FinalLabel } from '@/features/battery/types'

// POST /sim — Request
export interface SimStartRequest {
  batchSize: number
  batteryCellCount: number
  captureSpeed: number
}

// PUT /sim — Request (미구현)
export interface SimPauseResumeRequest {
  running: boolean
}

// WS 연결 lifecycle (프론트 전용)
export type WsStatus = 'idle' | 'connecting' | 'reconnecting' | 'open' | 'closed'

// 시뮬레이션 실행 lifecycle (프론트 전용)
export type SimulationRunStatus = 'idle' | 'running' | 'completed'

// 셀 단위 상태
export type CellStatus = 'REGISTERED' | 'CAPTURING' | 'CAPTURED' | 'ANALYZING' | 'COMPLETED'

// 검사 타입
export type InspectionType = 'CT' | 'RGB'

// 셀 단위 진행 정보 (registered / capture / analyze / completed 공통)
export interface CellProgress {
  batteryCellId: number
  inspectionId: number
  inspectionType: InspectionType
  finalLabel: FinalLabel | null
  batchId: number
  status: CellStatus
  /** 재분석 횟수. WS 모델에 추가 예정이라 아직 내려오지 않을 수 있다 */
  retryCount?: number
}

// WS event: PROGRESS
export interface SimulationProgressPayload {
  event: 'PROGRESS'
  batchCount: number
  batteryCellCount: number
  captureSpeed: number
  registered: CellProgress[]      // 대기 중 셀
  capture: CellProgress[]         // 촬영 중/완료 셀 (CAPTURING + CAPTURED, 배치 단위 묶음)
  analyze: CellProgress | null    // 분석 중인 단일 셀
  completed: CellProgress[]       // 공정 완료 셀
}

// WS event: COMPLETED
export interface SimulationCompletedPayload {
  event: 'COMPLETED'
}

export type SimulationSocketMessage = SimulationProgressPayload | SimulationCompletedPayload
export type SimStatusPayload = SimulationSocketMessage
