import { useMemo, useState } from 'react'
import { ImageBboxModal } from '@/shared/ui/ImageBboxModal'
import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import type { ImageMapping, ImageType } from '../types'
import './IndividualReportImages.css'

/* ImageMapping에 아직 실제 이미지 URL이 없어(스토어 필요) bbox가 온전히 보이는
   크기의 단색 플레이스홀더 이미지를 만들어 모달에 넘긴다 */
function placeholderImageUrl(bbox: { x: number; y: number; width: number; height: number }): string {
  const w = Math.max(bbox.x + bbox.width + 40, 400)
  const h = Math.max(bbox.y + bbox.height + 40, 400)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#8b96a1"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/** 검사 이미지 카드 — 869×345. CT/RGB 토글 + 썸네일 그리드.
   ImageMapping에 아직 실제 이미지 URL이 없어(스토어 필요) 색상 플레이스홀더로 대체한다 */
function IndividualReportImages() {
  const imageMappings = useIndividualReportDetailStore((s) => s.detail?.imageMappings ?? [])
  const [tab, setTab] = useState<ImageType>('CT')
  const [openId, setOpenId] = useState<number | null>(null)

  const ctCount = useMemo(() => imageMappings.filter((m) => m.imageType === 'CT').length, [imageMappings])
  const rgbCount = useMemo(() => imageMappings.filter((m) => m.imageType === 'RGB').length, [imageMappings])
  const shown = useMemo(() => imageMappings.filter((m) => m.imageType === tab), [imageMappings, tab])
  const openMapping = shown.find((m) => m.imageId === openId) ?? null

  return (
    <div className="individual-report-images">
      <div className="individual-report-images__header">
        <span className="individual-report-images__title">검사 이미지</span>
        <span className="individual-report-images__subtitle">INSPECTION IMAGES (스토어 필요)</span>
      </div>

      <div className="individual-report-images__toggle">
        <button
          type="button"
          className={`individual-report-images__tab${tab === 'CT' ? ' individual-report-images__tab--active' : ''}`}
          onClick={() => setTab('CT')}
        >
          CT ({ctCount})
        </button>
        <button
          type="button"
          className={`individual-report-images__tab${tab === 'RGB' ? ' individual-report-images__tab--active' : ''}`}
          onClick={() => setTab('RGB')}
        >
          RGB ({rgbCount})
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="individual-report-images__empty">{tab} 이미지가 없습니다.</p>
      ) : (
        <div className="individual-report-images__grid">
          {shown.map((mapping) => (
            <ImageThumbnail
              key={mapping.imageId}
              mapping={mapping}
              onClick={() => setOpenId(mapping.imageId)}
            />
          ))}
        </div>
      )}

      {openMapping && (
        <ImageBboxModal
          title={`${openMapping.imageType} · imageId ${openMapping.imageId}`}
          imageUrl={placeholderImageUrl(openMapping.bbox)}
          regions={[{ id: openMapping.imageId, bbox: openMapping.bbox, tone: 'neutral' }]}
          infoItems={[
            {
              id: openMapping.imageId,
              primaryText: `imageId ${openMapping.imageId}`,
              secondaryText: `bbox (${openMapping.bbox.x}, ${openMapping.bbox.y}) ${openMapping.bbox.width}×${openMapping.bbox.height}`,
            },
          ]}
          open={openId !== null}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}

function ImageThumbnail({ mapping, onClick }: { mapping: ImageMapping; onClick: () => void }) {
  return (
    <div className="individual-report-images__item">
      <button type="button" className="individual-report-images__thumb" onClick={onClick}>
        <span className="individual-report-images__thumb-badge">{mapping.imageType}</span>
      </button>
      <span className="individual-report-images__caption">imageId {mapping.imageId}</span>
    </div>
  )
}

export { IndividualReportImages }
