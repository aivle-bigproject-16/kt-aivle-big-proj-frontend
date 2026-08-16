import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { individualReportService } from '../services/individualReportService'
import { useIndividualReportDetailStore } from './useIndividualReportDetailStore'
import type { IndividualReportDetail } from '../types'

const pending: IndividualReportDetail = {
  reportId: 21,
  batteryCellId: 41,
  cellSerialNo: 'SIM-0001',
  status: 'PENDING',
  title: null,
  content: null,
  rgbImages: [],
  ctImages: [],
  createdAt: '2026-08-17T00:00:00',
  updatedAt: null,
  imageMappings: [],
}

describe('useIndividualReportDetailStore terminal status', () => {
  beforeEach(() => useIndividualReportDetailStore.getState().actions.reset())
  afterEach(() => vi.restoreAllMocks())

  it('exposes PENDING to the polling loop', async () => {
    vi.spyOn(individualReportService, 'getIndividualReport').mockResolvedValue({ data: pending } as never)

    await expect(useIndividualReportDetailStore.getState().actions.fetchDetail(21)).resolves.toBe('PENDING')
    expect(useIndividualReportDetailStore.getState().detail).toEqual(pending)
  })

  it('returns null and a visible error when refresh fails', async () => {
    vi.spyOn(individualReportService, 'getIndividualReport').mockRejectedValue(new Error('network'))

    await expect(useIndividualReportDetailStore.getState().actions.fetchDetail(21)).resolves.toBeNull()
    expect(useIndividualReportDetailStore.getState().error).toBe('개별 리포트 조회에 실패했습니다.')
  })
})
