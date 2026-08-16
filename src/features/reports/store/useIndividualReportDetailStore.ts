import { create } from 'zustand'
import { individualReportService } from '../services/individualReportService'
import type { IndividualReportDetail, IndividualReportCreateRequest } from '../types'
import type { ReportStatus } from '../types'
import type { AsyncState } from '@/shared/types/store'

interface IndividualReportDetailState extends AsyncState {
  detail: IndividualReportDetail | null
}

interface IndividualReportDetailActions {
  actions: {
    fetchDetail: (reportId: number) => Promise<ReportStatus | null>
    create: (body: IndividualReportCreateRequest) => Promise<number>
    reset: () => void
  }
}

const initialState: IndividualReportDetailState = {
  detail: null,
  isLoading: false,
  error: null,
}

export const useIndividualReportDetailStore = create<
  IndividualReportDetailState & IndividualReportDetailActions
>((set, get) => ({
  ...initialState,
  actions: {
    fetchDetail: async (reportId) => {
      if (get().detail?.reportId !== reportId) {
        set({ isLoading: true, error: null })
      }
      try {
        const res = await individualReportService.getIndividualReport(reportId)
        set({ detail: res.data, isLoading: false, error: null })
        return res.data.status
      } catch {
        set({ error: '개별 리포트 조회에 실패했습니다.', isLoading: false })
        return null
      }
    },

    create: async (body) => {
      const res = await individualReportService.createIndividualReport(body)
      return res.data.reportId
    },

    reset: () => set(initialState),
  },
}))
