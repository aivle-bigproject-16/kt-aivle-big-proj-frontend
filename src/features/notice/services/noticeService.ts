import { httpClient } from '@/core/api/httpClient'
import type { ApiResponse, ListResponse } from '@/shared/types/api'
import type {
  NoticeListItem,
  NoticeDetail,
  NoticeSavePayload,
} from '../types'

const BASE_URL = '/notices'

interface GetNoticeListParams {
  page?: number
  size?: number
  keyword?: string
}

export function buildNoticeFormData({ request, file }: NoticeSavePayload) {
  const formData = new FormData()
  formData.append('title', request.title)
  formData.append('content', request.content)
  if (request.deleteFile !== undefined) {
    formData.append('deleteFile', String(request.deleteFile))
  }
  if (file) formData.append('file', file)
  return formData
}

export const noticeService = {
  getNoticeList: (params: GetNoticeListParams) =>
    httpClient.get<ApiResponse<ListResponse<NoticeListItem>>>(BASE_URL, { params }),

  getNotice: (id: number) => httpClient.get<ApiResponse<NoticeDetail>>(`${BASE_URL}/${id}`),

  createNotice: (payload: NoticeSavePayload) =>
    httpClient.post<ApiResponse<NoticeDetail>>(BASE_URL, buildNoticeFormData(payload)),

  updateNotice: (id: number, payload: NoticeSavePayload) =>
    httpClient.put<ApiResponse<NoticeDetail>>(`${BASE_URL}/${id}`, buildNoticeFormData(payload)),

  deleteNotice: (id: number) => httpClient.delete<ApiResponse<null>>(`${BASE_URL}/${id}`),
}
