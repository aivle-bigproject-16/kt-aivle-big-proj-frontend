import { describe, expect, it } from 'vitest'
import type { BatteryDetail } from '@/features/battery/types'
import { toDetectionCard } from './useDetectionStore'

function detail(): BatteryDetail {
  return {
    batteryCellId: 1,
    cellSerialNo: 'CELL-001',
    purchaseId: null,
    productId: null,
    modelName: null,
    cellType: 'POUCH',
    manufacturedDate: null,
    createdAt: '2026-08-14T00:00:00',
    updatedAt: null,
    reports: [],
    inspections: [
      {
        batchId: 10,
        inspectionIds: [1, 2],
        finalLabel: 'REJECT',
        analyzedAt: '2026-08-14T00:00:00',
        images: [
          {
            imageId: 1,
            inspectionId: 1,
            inspectionType: 'CT',
            imageType: 'CT',
            imageUrl: 'ct.jpg',
          },
          {
            imageId: 2,
            inspectionId: 2,
            inspectionType: 'RGB',
            imageType: 'RGB',
            imageUrl: 'rgb.jpg',
          },
        ],
        defectResults: [
          {
            defectResultId: 1,
            inspectionId: 1,
            attemptNo: 1,
            label: 'PASS',
            imageId: 1,
            imageType: 'CT',
            defectType: 'NONE',
            imageUrl: 'ct.jpg',
            confidence: 1,
            bbox: null,
          },
          {
            defectResultId: 2,
            inspectionId: 2,
            attemptNo: 1,
            label: 'REJECT',
            imageId: 2,
            imageType: 'RGB',
            defectType: 'SWELLING',
            imageUrl: 'rgb.jpg',
            confidence: 0.2965,
            bbox: null,
          },
        ],
      },
    ],
  }
}

describe('toDetectionCard', () => {
  it('PASS confidence가 더 높아도 배치 최종 판정과 같은 REJECT를 선택한다', () => {
    const card = toDetectionCard(detail(), 10)

    expect(card?.finalLabel).toBe('REJECT')
    expect(card?.defectType).toBe('SWELLING')
    expect(card?.confidence).toBe(0.2965)
  })

  it('완료된 batchId에 해당하는 검사 이력을 선택한다', () => {
    const value = detail()
    value.inspections.unshift({
      ...value.inspections[0],
      batchId: 11,
      inspectionIds: [3, 4],
      finalLabel: 'PASS',
      defectResults: [],
    })

    expect(toDetectionCard(value, 10)?.finalLabel).toBe('REJECT')
  })
})
