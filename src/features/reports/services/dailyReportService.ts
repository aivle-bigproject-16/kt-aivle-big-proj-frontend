import { httpClient } from '@/core/api/httpClient'
import type { ApiResponse, ListResponse } from '@/shared/types/api'
import type {
  DailyReportCreateRequest,
  DailyReportCreateResponse,
  DailyReportDetail,
  DailyReportListItem,
} from '../types'

const BASE_URL = '/reports/daily'

interface GetDailyReportListParams {
  page?: number
  size?: number
  sort?: string
}

export const dailyReportService = {
  createDailyReport: (body: DailyReportCreateRequest) =>
    httpClient.post<ApiResponse<DailyReportCreateResponse>>(BASE_URL, body),

  getDailyReport: (reportId: number) =>
    httpClient.get<ApiResponse<DailyReportDetail>>(`${BASE_URL}/${reportId}`),

  getDailyReportList: (params: GetDailyReportListParams) =>
    httpClient.get<ApiResponse<ListResponse<DailyReportListItem>>>(BASE_URL, { params }),

  deleteDailyReport: (reportId: number) =>
    httpClient.delete<ApiResponse<void>>(`${BASE_URL}/${reportId}`),
}
