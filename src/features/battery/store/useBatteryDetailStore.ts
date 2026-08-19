import { create } from 'zustand'
import { batteryService } from '../services/batteryService'
import type { BatteryDetail } from '../types'
import type { AsyncState } from '@/shared/types/store'

interface BatteryDetailState extends AsyncState {
  detail: BatteryDetail | null
}

interface BatteryDetailActions {
  actions: {
    fetchDetail: (batteryCellId: number) => Promise<void>
    reset: () => void
  }
}

const initialState: BatteryDetailState = {
  detail: null,
  isLoading: false,
  error: null,
}

export const useBatteryDetailStore = create<BatteryDetailState & BatteryDetailActions>((set) => ({
  ...initialState,
  actions: {
    fetchDetail: async (batteryCellId) => {
      set({ isLoading: true, error: null })
      try {
        const res = await batteryService.getBatteryDetail(batteryCellId)
        set({ detail: res.data, isLoading: false })
      } catch {
        set({ detail: null, error: '배터리 상세 조회에 실패했습니다.', isLoading: false })
      }
    },

    reset: () => set(initialState),
  },
}))
