import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { dailyReportService } from '../services/dailyReportService'
import { useDailyReportDetailStore } from './useDailyReportDetailStore'
import type { DailyReportDetail } from '../types'

const detail = (status: DailyReportDetail['status']): DailyReportDetail => ({
  reportId: 19,
  reportDate: '2026-08-17',
  status,
  title: status === 'COMPLETED' ? '완료 리포트' : null,
  content: status === 'COMPLETED' ? '본문' : null,
  failureReason: status === 'FAILED' ? 'AI_SERVER_TIMEOUT' : null,
  rgbImageUrl: null,
  ctImageUrl: null,
  createdAt: '2026-08-17T00:00:00',
  updatedAt: null,
  summary: { totalCount: 20, passCount: 5, rejectCount: 15, failedCount: 0, defects: [] },
})

describe('useDailyReportDetailStore terminal status', () => {
  beforeEach(() => useDailyReportDetailStore.getState().actions.reset())
  afterEach(() => vi.restoreAllMocks())

  it('returns PENDING so the detail page can continue polling', async () => {
    vi.spyOn(dailyReportService, 'getDailyReport').mockResolvedValue({ data: detail('PENDING') } as never)

    await expect(useDailyReportDetailStore.getState().actions.fetchDetail(19)).resolves.toBe('PENDING')
    expect(useDailyReportDetailStore.getState().detail?.status).toBe('PENDING')
  })

  it('returns COMPLETED so polling stops at the terminal state', async () => {
    vi.spyOn(dailyReportService, 'getDailyReport').mockResolvedValue({ data: detail('COMPLETED') } as never)

    await expect(useDailyReportDetailStore.getState().actions.fetchDetail(19)).resolves.toBe('COMPLETED')
    expect(useDailyReportDetailStore.getState().error).toBeNull()
  })
})
