import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import './IndividualReportDetailCard.css'
import { ROUTES } from '@/core/navigation/routes'
import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import { BatteryInfoHeader } from '@/shared/ui/BatteryInfoHeader'
import { ImageBboxGrid } from '@/shared/ui/ImageBboxGrid'
import { Cell3DView } from './Cell3DView'
import type { ImageBboxGridItem } from '@/shared/ui/ImageBboxGrid'
import type { IndividualReportDetail, ImageMapping } from '../types'

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

interface IndividualReportDetailCardProps {
  reportId: number
}

function IndividualReportDetailCard({ reportId }: IndividualReportDetailCardProps) {
  const detail = useIndividualReportDetailStore((s) => s.detail)
  const isLoading = useIndividualReportDetailStore((s) => s.isLoading)
  const error = useIndividualReportDetailStore((s) => s.error)
  const { fetchDetail, fetchCellView } = useIndividualReportDetailStore((s) => s.actions)

  useEffect(() => {
    fetchDetail(reportId)
    fetchCellView(reportId)
  }, [fetchDetail, fetchCellView, reportId])

  return (
    <section className="individual-detail">
      <Link to={ROUTES.REPORT_INDIVIDUAL} className="individual-detail__back">
        ← 개별 리포트 목록으로
      </Link>

      {isLoading && <p className="individual-detail__notice">불러오는 중...</p>}
      {error && <p className="individual-detail__notice individual-detail__notice--error">{error}</p>}

      {detail && detail.status === 'PENDING' && (
        <p className="individual-detail__notice">리포트를 생성하는 중입니다.</p>
      )}

      {detail && detail.status === 'FAILED' && (
        <p className="individual-detail__notice individual-detail__notice--error">
          리포트 생성에 실패했습니다.
        </p>
      )}

      {detail && detail.status === 'COMPLETED' && <IndividualDetailBody detail={detail} />}
    </section>
  )
}

function IndividualDetailBody({ detail }: { detail: IndividualReportDetail }) {
  const cellView = useIndividualReportDetailStore((s) => s.cellView)
  const cellViewLoading = useIndividualReportDetailStore((s) => s.cellViewLoading)

  return (
    <>
      <BatteryInfoHeader
        title={detail.title ?? `개별 리포트 #${detail.reportId}`}
        idLabel={`RPT-${detail.reportId}`}
        badges={[{ text: detail.cellSerialNo, tone: 'neutral' }]}
        metaItems={[
          { label: '생성일시', value: formatDateTime(detail.createdAt) },
          { label: '수정일시', value: formatDateTime(detail.updatedAt) },
        ]}
      />

      <div className="individual-detail__layout">
        <div className="individual-detail__col individual-detail__col--images">
          <ImageBox
            title="CT 데이터 분석 (CT DATA ANALYSIS)"
            images={detail.ctImages}
            emptyText="CT 이미지가 없습니다."
            mappings={detail.imageMappings.filter((m) => m.imageType === 'CT')}
          />
          <ImageBox
            title="RGB 이미지 분석 (RGB IMAGE ANALYSIS)"
            images={detail.rgbImages}
            emptyText="RGB 이미지가 없습니다."
            mappings={detail.imageMappings.filter((m) => m.imageType === 'RGB')}
          />
        </div>

        <div className="individual-detail__col individual-detail__col--side">
          <div className="individual-detail__box">
            <h2 className="individual-detail__box-title">검사 요약 (INSPECTION SUMMARY)</h2>
            {detail.content ? (
              <p className="individual-detail__summary-body">{detail.content}</p>
            ) : (
              <p className="individual-detail__empty">본문이 없습니다.</p>
            )}
            {detail.imageMappings.length > 0 && (
              <ul className="individual-detail__coord-list">
                {detail.imageMappings.map((mapping, i) => (
                  <CoordItem key={`${mapping.imageType}-${mapping.imageId}-${i}`} mapping={mapping} />
                ))}
              </ul>
            )}
          </div>

          {cellViewLoading && (
            <p className="individual-detail__notice">3D 뷰 불러오는 중...</p>
          )}
          {cellView && <Cell3DView data={cellView} />}
        </div>
      </div>
    </>
  )
}

function CoordItem({ mapping }: { mapping: ImageMapping }) {
  const { bbox } = mapping
  return (
    <li className="individual-detail__coord-item">
      <span className="individual-detail__coord-type">{mapping.imageType}</span>
      <span className="individual-detail__coord-value">
        x: {bbox.x}, y: {bbox.y}, w: {bbox.width}, h: {bbox.height}
      </span>
    </li>
  )
}

function ImageBox({
  title,
  images,
  emptyText,
  mappings,
}: {
  title: string
  images: string[]
  emptyText: string
  mappings: ImageMapping[]
}) {
  const items: ImageBboxGridItem[] = images.map((src, i) => {
    const mapping = mappings[i]
    return {
      id: mapping ? mapping.imageId : i,
      imageUrl: src,
      title: mapping ? `${mapping.imageType} · ID ${mapping.imageId}` : `${title} ${i + 1}`,
      regions: mapping ? [{ id: mapping.imageId, bbox: mapping.bbox, tone: 'neutral' as const }] : [],
      infoItems: mapping
        ? [
            {
              id: mapping.imageId,
              primaryText: mapping.imageType,
              secondaryText: `bbox (${mapping.bbox.x}, ${mapping.bbox.y}) ${mapping.bbox.width}×${mapping.bbox.height}`,
            },
          ]
        : [],
    }
  })

  return (
    <div className="individual-detail__box">
      <h2 className="individual-detail__box-title">{title}</h2>
      <ImageBboxGrid items={items} emptyText={emptyText} />
    </div>
  )
}

export default IndividualReportDetailCard
