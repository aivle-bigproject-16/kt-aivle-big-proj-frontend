import { create } from 'zustand'
import { simulationService } from '../services/simulationService'
import { observeCompletions, orderNewestFirst, resetCompletionOrder } from './completionOrder'
import type { CellProgress, SimStartRequest, SimulationRunStatus, SimulationSocketMessage, WsStatus } from '../types'

function hasEvent(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && 'event' in value
}

/* BE가 WS 프레임을 공통 응답 봉투({ success, message, data })로 감싸 보낼 수 있다.
   API_SPEC「검사 진행 상황 수신」의 Example은 봉투가 있는 형태인데 현재 mock 은 없는
   형태로 보낸다. 봉투가 씌워진 채로 오면 event 검사가 실패해 메시지가 통째로,
   그것도 조용히 버려지므로(에러도 로그도 남지 않는다) 양쪽을 모두 받아들인다.
   HTTP(POST/GET /sim) 응답은 인터셉터가 이미 한 겹 벗겨 주지만 WS 는 그 경로를
   타지 않아서 여기서 처리해야 한다 */
function unwrapEnvelope(data: unknown): unknown {
  if (hasEvent(data)) return data
  if (typeof data === 'object' && data !== null) {
    const inner = (data as { data?: unknown }).data
    if (hasEvent(inner)) return inner
  }
  return data
}

function isSimulationSocketMessage(data: unknown): data is SimulationSocketMessage {
  return hasEvent(data)
}

function simulationStartErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return '시뮬레이션 시작에 실패했습니다.'
}

/* API_SPEC Example 의 status 값에 `"CAPTURING "` 처럼 뒤쪽 공백이 붙어 있다. 오타로
   보이지만 실제로 그렇게 내려오면 화면 전체가 조용히 어긋난다 — 상태 비교가 전부
   정확 일치라서 촬영/분석 구분이 사라지고 셀 색도 결정되지 않는다. 컴포넌트마다
   trim 을 뿌리는 대신 스토어 경계에서 한 번만 정리해 모든 소비자를 함께 보호한다 */
function normalizeCell(cell: CellProgress): CellProgress {
  const status = typeof cell.status === 'string' ? (cell.status.trim() as CellProgress['status']) : cell.status
  const finalLabel =
    typeof cell.finalLabel === 'string'
      ? (cell.finalLabel.trim() as CellProgress['finalLabel'])
      : cell.finalLabel

  /* 고칠 게 없으면 원본 참조를 그대로 돌려준다 — 매 스냅샷 새 객체를 만들 이유가 없다 */
  if (status === cell.status && finalLabel === cell.finalLabel) return cell
  return { ...cell, status, finalLabel }
}

function normalizeCells(value: unknown): CellProgress[] | null {
  return Array.isArray(value) ? value.map(normalizeCell) : null
}

interface SimulationState {
  batchCount: number
  batteryCellCount: number
  registered: CellProgress[]
  capture: CellProgress[]
  analyze: CellProgress | null
  /** 서버가 준 순서 그대로. 정렬 방향이 계약에 없으므로 화면에서 직접 쓰지 않는다 */
  completed: CellProgress[]
  /** 최근 완료가 앞. `completed` 의 정렬 방향과 무관하게 항상 같은 의미를 갖는다 */
  completedOrdered: CellProgress[]
  captureSpeed: number | null
  wsStatus: WsStatus
  simulationStatus: SimulationRunStatus
  event: 'PROGRESS' | 'COMPLETED' | null
  lastMessage: unknown
  lastMessageAt: number | null
  isStarting: boolean
  startError: string | null
}

interface SimulationActions {
  actions: {
    applyMessage: (data: unknown) => void
    setWsStatus: (status: WsStatus) => void
    start: (body: SimStartRequest) => Promise<void>
    reset: () => void
  }
}

const initialState: SimulationState = {
  batchCount: 0,
  batteryCellCount: 0,
  registered: [],
  capture: [],
  analyze: null,
  completed: [],
  completedOrdered: [],
  captureSpeed: null,
  wsStatus: 'idle',
  simulationStatus: 'idle',
  event: null,
  lastMessage: null,
  lastMessageAt: null,
  isStarting: false,
  startError: null,
}

export const useSimulationStore = create<SimulationState & SimulationActions>((set, get) => ({
  ...initialState,
  actions: {
    applyMessage: (raw) => {
      const data = unwrapEnvelope(raw)
      if (!isSimulationSocketMessage(data)) return

      if (data.event === 'PROGRESS') {
        /* 필드가 배열이 아니거나(malformed) 아예 빠진 메시지가 가끔 온다. 그럴 때
           즉시 빈 상태로 반영하면 "잠깐 비었다가 다시 채워지는" 것처럼 보여
           대기 배치 소멸 애니메이션 등이 실제 변화 없이 오탐 트리거된다.
           진짜 빈 배열([])은 그대로 반영하되, 형식이 안 맞을 때만 직전 값을 유지한다 */
        const prev = get()
        const completed = normalizeCells(data.completed) ?? prev.completed
        observeCompletions(completed)

        set({
          event: 'PROGRESS',
          batchCount: data.batchCount ?? prev.batchCount,
          batteryCellCount: data.batteryCellCount ?? prev.batteryCellCount,
          captureSpeed: data.captureSpeed ?? prev.captureSpeed,
          registered: normalizeCells(data.registered) ?? prev.registered,
          capture: normalizeCells(data.capture) ?? prev.capture,
          analyze:
            data.analyze === undefined
              ? prev.analyze
              : Array.isArray(data.analyze)
                ? prev.analyze
                : data.analyze === null
                  ? null
                  : normalizeCell(data.analyze),
          completed,
          completedOrdered: orderNewestFirst(completed),
          simulationStatus: 'running',
          lastMessage: data,
          lastMessageAt: Date.now(),
        })
        return
      }

      // event === 'COMPLETED'
      // 마지막 PROGRESS 이후 완료된 셀(예: 30번째)이 COMPLETED 메시지에만 실려 온다 —
      // registered/capture/completed를 무조건 비우면 이 마지막 셀들이 화면에서 사라진다.
      // registered는 남아있으면 안 되므로(더 이상 대기 중일 수 없음) 빈 배열로 확정하고,
      // 나머지는 PROGRESS와 동일하게 malformed 데이터에 대비해 직전 값을 폴백으로 쓴다.
      //
      // 집계 3종에도 폴백을 둔다 — API_SPEC「검사 진행 상황 수신」은 COMPLETED 페이로드를
      // { "event": "COMPLETED" } 하나로만 규정하고 있어, 계약대로 오면 이 값들이
      // undefined 로 덮여 "완료 58 / undefined" 처럼 화면이 깨진다
      {
        const prev = get()
        const completed = normalizeCells(data.completed) ?? prev.completed
        observeCompletions(completed)

        set({
          event: 'COMPLETED',
          simulationStatus: 'completed',
          batchCount: data.batchCount ?? prev.batchCount,
          batteryCellCount: data.batteryCellCount ?? prev.batteryCellCount,
          captureSpeed: data.captureSpeed ?? prev.captureSpeed,
          registered: normalizeCells(data.registered) ?? [],
          capture: normalizeCells(data.capture) ?? prev.capture,
          analyze: null,
          completed,
          completedOrdered: orderNewestFirst(completed),
          lastMessage: data,
          lastMessageAt: Date.now(),
        })
      }
    },

    setWsStatus: (status) => set({ wsStatus: status }),

    start: async (body) => {
      set({ isStarting: true, startError: null })
      try {
        const res = await simulationService.startSimulation(body)
        get().actions.applyMessage(res.data)
        set({ isStarting: false })
      } catch (error) {
        set({ isStarting: false, startError: simulationStartErrorMessage(error) })
      }
    },

    reset: () => {
      resetCompletionOrder()
      set(initialState)
    },
  },
}))
