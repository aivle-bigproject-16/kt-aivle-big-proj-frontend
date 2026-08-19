import { httpClient } from '@/core/api/httpClient'
import type { ApiResponse, ListResponse } from '@/shared/types/api'
import type { BatteryListItem, BatteryDetail } from '../types'

const BASE_URL = '/battery'

interface GetBatteryListParams {
  page?: number
  size?: number
  keyword?: string
  finalLabel?: string
}

export const batteryService = {
  getBatteryList: (params: GetBatteryListParams) =>
    httpClient.get<ApiResponse<ListResponse<BatteryListItem>>>(BASE_URL, { params }),

  getBatteryDetail: (batteryCellId: number) =>
    httpClient.get<ApiResponse<BatteryDetail>>(`${BASE_URL}/${batteryCellId}`),
}
