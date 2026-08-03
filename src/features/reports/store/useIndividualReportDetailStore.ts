import { create } from 'zustand'
import { individualReportService } from '../services/individualReportService'
import type { IndividualReportDetail, IndividualReportCreateRequest, CellDefectView } from '../types'
import type { AsyncState } from '@/shared/types/store'

interface IndividualReportDetailState extends AsyncState {
  detail: IndividualReportDetail | null
  cellView: CellDefectView | null
  cellViewLoading: boolean
  cellViewError: string | null
}

interface IndividualReportDetailActions {
  actions: {
    fetchDetail: (reportId: number) => Promise<void>
    fetchCellView: (reportId: number) => Promise<void>
    create: (body: IndividualReportCreateRequest) => Promise<number>
    reset: () => void
  }
}

const initialState: IndividualReportDetailState = {
  detail: null,
  cellView: null,
  cellViewLoading: false,
  cellViewError: null,
  isLoading: false,
  error: null,
}

export const useIndividualReportDetailStore = create<
  IndividualReportDetailState & IndividualReportDetailActions
>((set) => ({
  ...initialState,
  actions: {
    fetchDetail: async (reportId) => {
      set({ isLoading: true, error: null })
      try {
        const res = await individualReportService.getIndividualReport(reportId)
        set({ detail: res.data, isLoading: false })
      } catch {
        set({ error: '개별 리포트 조회에 실패했습니다.', isLoading: false })
      }
    },

    fetchCellView: async (reportId) => {
      set({ cellViewLoading: true, cellViewError: null })
      try {
        const res = await individualReportService.getCellDefectView(reportId)
        set({ cellView: res.data, cellViewLoading: false })
      } catch {
        set({ cellViewError: '셀 결함 뷰 조회에 실패했습니다.', cellViewLoading: false })
      }
    },

    create: async (body) => {
      const res = await individualReportService.createIndividualReport(body)
      return res.data.reportId
    },

    reset: () => set(initialState),
  },
}))
