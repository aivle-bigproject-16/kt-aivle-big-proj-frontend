import type { FinalLabel } from '@/features/battery/types'

// POST /sim — Request
export interface SimStartRequest {
  batchSize: number
  batteryCellCount: number
  captureSpeed: number
  resetBeforeStart: boolean
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

/* 셀 단위 진행 정보 (registered / capture / analyze / completed 공통).
   필드 구성은 API_SPEC「검사 진행 상황 수신」의 셀 스키마와 1:1이다.
   `inspectionType`(CT/RGB)은 여기 선언돼 있었으나 계약에도 mock 응답에도 없고
   참조하는 곳도 없어 제거했다 — 검사 타입은 배터리 상세(GET /battery/:id)에서 온다 */
export interface CellProgress {
  batteryCellId: number
  inspectionId: number
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
  batchCount: number
  batteryCellCount: number
  captureSpeed: number
  registered: CellProgress[]
  capture: CellProgress[]      // 마지막 배치까지 촬영 완료된 셀 — 비우면 안 됨
  analyze: CellProgress | null
  completed: CellProgress[]    // 최종 완료 셀 전체 (마지막 PROGRESS 이후 셀 포함)
}

export type SimulationSocketMessage = SimulationProgressPayload | SimulationCompletedPayload
export type SimStatusPayload = SimulationSocketMessage
