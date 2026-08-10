import { useMemo, useState } from 'react'
import { ImageBboxModal } from '@/shared/ui/ImageBboxModal'
import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import type { ImageMapping, ImageType } from '../types'
import './IndividualReportImages.css'

/* imageMappings에는 실제 이미지 URL이 없고 bbox 메타데이터만 있다. 실제 URL은
   detail.ctImages/rgbImages에 타입별로 같은 순서로 내려오므로 인덱스로 짝지어 쓴다.
   URL이 없는 경우에만(개수가 안 맞는 경우) bbox가 온전히 보이는 플레이스홀더로 대체한다 */
function placeholderImageUrl(bbox: { x: number; y: number; width: number; height: number }): string {
  const w = Math.max(bbox.x + bbox.width + 40, 400)
  const h = Math.max(bbox.y + bbox.height + 40, 400)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#8b96a1"/></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

interface ImageEntry {
  mapping: ImageMapping
  url: string | undefined
}

/** 검사 이미지 카드 — 869×345. CT/RGB 토글 + 썸네일 그리드 */
function IndividualReportImages() {
  const detail = useIndividualReportDetailStore((s) => s.detail)
  const imageMappings = detail?.imageMappings ?? []
  const ctImages = detail?.ctImages ?? []
  const rgbImages = detail?.rgbImages ?? []
  const [tab, setTab] = useState<ImageType>('CT')
  const [openId, setOpenId] = useState<number | null>(null)

  const ctEntries = useMemo<ImageEntry[]>(
    () => imageMappings.filter((m) => m.imageType === 'CT').map((mapping, i) => ({ mapping, url: ctImages[i] })),
    [imageMappings, ctImages],
  )
  const rgbEntries = useMemo<ImageEntry[]>(
    () => imageMappings.filter((m) => m.imageType === 'RGB').map((mapping, i) => ({ mapping, url: rgbImages[i] })),
    [imageMappings, rgbImages],
  )
  const shown = tab === 'CT' ? ctEntries : rgbEntries
  const openEntry = shown.find((e) => e.mapping.imageId === openId) ?? null

  return (
    <div className="individual-report-images">
      <div className="individual-report-images__header">
        <span className="individual-report-images__title">검사 이미지</span>
        <span className="individual-report-images__subtitle">INSPECTION IMAGES</span>
      </div>

      <div className="individual-report-images__toggle">
        <button
          type="button"
          className={`individual-report-images__tab${tab === 'CT' ? ' individual-report-images__tab--active' : ''}`}
          onClick={() => setTab('CT')}
        >
          CT ({ctEntries.length})
        </button>
        <button
          type="button"
          className={`individual-report-images__tab${tab === 'RGB' ? ' individual-report-images__tab--active' : ''}`}
          onClick={() => setTab('RGB')}
        >
          RGB ({rgbEntries.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="individual-report-images__empty">{tab} 이미지가 없습니다.</p>
      ) : (
        <div className="individual-report-images__grid">
          {shown.map((entry) => (
            <ImageThumbnail
              key={entry.mapping.imageId}
              entry={entry}
              onClick={() => setOpenId(entry.mapping.imageId)}
            />
          ))}
        </div>
      )}

      {openEntry && (
        <ImageBboxModal
          title={`${openEntry.mapping.imageType} · imageId ${openEntry.mapping.imageId}`}
          imageUrl={openEntry.url ?? placeholderImageUrl(openEntry.mapping.bbox)}
          regions={[{ id: openEntry.mapping.imageId, bbox: openEntry.mapping.bbox, tone: 'neutral' }]}
          infoItems={[
            {
              id: openEntry.mapping.imageId,
              primaryText: `imageId ${openEntry.mapping.imageId}`,
              secondaryText: `bbox (${openEntry.mapping.bbox.x}, ${openEntry.mapping.bbox.y}) ${openEntry.mapping.bbox.width}×${openEntry.mapping.bbox.height}`,
            },
          ]}
          open={openId !== null}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}

function ImageThumbnail({ entry, onClick }: { entry: ImageEntry; onClick: () => void }) {
  const { mapping, url } = entry
  return (
    <div className="individual-report-images__item">
      <button type="button" className="individual-report-images__thumb" onClick={onClick}>
        {url ? (
          <img src={url} alt={`${mapping.imageType} ${mapping.imageId}`} className="individual-report-images__thumb-img" />
        ) : (
          <span className="individual-report-images__thumb-placeholder" />
        )}
        <span className="individual-report-images__thumb-badge">{mapping.imageType}</span>
      </button>
      <span className="individual-report-images__caption">imageId {mapping.imageId}</span>
    </div>
  )
}

export { IndividualReportImages }
