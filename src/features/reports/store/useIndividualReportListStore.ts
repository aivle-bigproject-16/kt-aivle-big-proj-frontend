import { create } from 'zustand'
import { individualReportService } from '../services/individualReportService'
import type { IndividualReportListItem } from '../types'
import type { Pageable } from '@/shared/types/api'
import { normalizeListResponse } from '@/shared/types/api'
import type { AsyncState } from '@/shared/types/store'

interface IndividualReportListState extends AsyncState {
  list: IndividualReportListItem[]
  pageable: Pageable | null
}

interface IndividualReportListActions {
  actions: {
    fetchList: (page: number, size: number, sort?: string) => Promise<void>
    reset: () => void
  }
}

const initialState: IndividualReportListState = {
  list: [],
  pageable: null,
  isLoading: false,
  error: null,
}

export const useIndividualReportListStore = create<
  IndividualReportListState & IndividualReportListActions
>((set) => ({
  ...initialState,
  actions: {
    fetchList: async (page, size, sort) => {
      set({ isLoading: true, error: null })
      try {
        const res = await individualReportService.getIndividualReportList({ page, size, sort })
        const { content, pageable } = normalizeListResponse(res.data)
        set({ list: content, pageable, isLoading: false })
      } catch {
        set({ error: '개별 리포트 목록 조회에 실패했습니다.', isLoading: false })
      }
    },

    reset: () => set(initialState),
  },
}))
