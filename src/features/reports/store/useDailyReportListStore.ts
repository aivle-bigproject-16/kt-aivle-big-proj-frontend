import { create } from 'zustand'
import { dailyReportService } from '../services/dailyReportService'
import type { DailyReportListItem } from '../types'
import type { Pageable } from '@/shared/types/api'
import { normalizeListResponse } from '@/shared/types/api'
import type { AsyncState } from '@/shared/types/store'

interface DailyReportListState extends AsyncState {
  list: DailyReportListItem[]
  pageable: Pageable | null
}

interface DailyReportListActions {
  actions: {
    fetchList: (page: number, size: number, sort?: string) => Promise<void>
    reset: () => void
  }
}

const initialState: DailyReportListState = {
  list: [],
  pageable: null,
  isLoading: false,
  error: null,
}

export const useDailyReportListStore = create<DailyReportListState & DailyReportListActions>(
  (set) => ({
    ...initialState,
    actions: {
      fetchList: async (page, size, sort) => {
        set({ isLoading: true, error: null })
        try {
          const res = await dailyReportService.getDailyReportList({ page, size, sort })
          const { content, pageable } = normalizeListResponse(res.data)
          set({ list: content, pageable, isLoading: false })
        } catch {
          set({ error: '일일 리포트 목록 조회에 실패했습니다.', isLoading: false })
        }
      },

      reset: () => set(initialState),
    },
  }),
)
