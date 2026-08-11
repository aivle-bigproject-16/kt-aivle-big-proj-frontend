import { httpClient } from '@/core/api/httpClient'
import type { ApiResponse, ListResponse } from '@/shared/types/api'
import type {
  NoticeListItem,
  NoticeDetail,
  NoticeCreateRequest,
  NoticeUpdateRequest,
} from '../types'

const BASE_URL = '/notices'

interface GetNoticeListParams {
  page?: number
  size?: number
}

export const noticeService = {
  getNoticeList: (params: GetNoticeListParams) =>
    httpClient.get<ApiResponse<ListResponse<NoticeListItem>>>(BASE_URL, { params }),

  getNotice: (id: number) => httpClient.get<ApiResponse<NoticeDetail>>(`${BASE_URL}/${id}`),

  createNotice: (body: NoticeCreateRequest) =>
    httpClient.post<ApiResponse<NoticeDetail>>(BASE_URL, body),

  // 수정·삭제는 data를 돌려주지 않는다 (API 명세서 기준 data: null)
  updateNotice: (id: number, body: NoticeUpdateRequest) =>
    httpClient.put<ApiResponse<null>>(`${BASE_URL}/${id}`, body),

  deleteNotice: (id: number) => httpClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`),
}
