import { create } from 'zustand'
import { simulationService } from '../services/simulationService'
import type { CellProgress, SimStartRequest, SimulationRunStatus, SimulationSocketMessage, WsStatus } from '../types'

function isSimulationSocketMessage(data: unknown): data is SimulationSocketMessage {
  return typeof data === 'object' && data !== null && 'event' in data
}

interface SimulationState {
  batchCount: number
  batteryCellCount: number
  registered: CellProgress[]
  capture: CellProgress[]
  analyze: CellProgress | null
  completed: CellProgress[]
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
    applyMessage: (data) => {
      if (!isSimulationSocketMessage(data)) return

      if (data.event === 'PROGRESS') {
        /* 필드가 배열이 아니거나(malformed) 아예 빠진 메시지가 가끔 온다. 그럴 때
           즉시 빈 상태로 반영하면 "잠깐 비었다가 다시 채워지는" 것처럼 보여
           대기 배치 소멸 애니메이션 등이 실제 변화 없이 오탐 트리거된다.
           진짜 빈 배열([])은 그대로 반영하되, 형식이 안 맞을 때만 직전 값을 유지한다 */
        const prev = get()
        set({
          event: 'PROGRESS',
          batchCount: data.batchCount,
          batteryCellCount: data.batteryCellCount,
          captureSpeed: data.captureSpeed,
          registered: Array.isArray(data.registered) ? data.registered : prev.registered,
          capture: Array.isArray(data.capture) ? data.capture : prev.capture,
          analyze: data.analyze === undefined ? prev.analyze : Array.isArray(data.analyze) ? prev.analyze : data.analyze,
          completed: Array.isArray(data.completed) ? data.completed : prev.completed,
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
      // 나머지는 PROGRESS와 동일하게 malformed 데이터에 대비해 직전 값을 폴백으로 쓴다
      {
        const prev = get()
        set({
          event: 'COMPLETED',
          simulationStatus: 'completed',
          batchCount: data.batchCount,
          batteryCellCount: data.batteryCellCount,
          captureSpeed: data.captureSpeed,
          registered: Array.isArray(data.registered) ? data.registered : [],
          capture: Array.isArray(data.capture) ? data.capture : prev.capture,
          analyze: null,
          completed: Array.isArray(data.completed) ? data.completed : prev.completed,
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
      } catch {
        set({ isStarting: false, startError: '시뮬레이션 시작에 실패했습니다.' })
      }
    },

    reset: () => set(initialState),
  },
}))
