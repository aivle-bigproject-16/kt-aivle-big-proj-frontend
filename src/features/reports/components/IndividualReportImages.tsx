import { useMemo, useState } from 'react'
import { ImageBboxModal } from '@/shared/ui/ImageBboxModal'
import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import type { ImageMapping, ImageType } from '../types'
import './IndividualReportImages.css'

/* 셀렉터 안에서 `?? []`로 새 배열을 만들면 매 호출마다 참조가 달라져 getSnapshot
   무한 루프가 난다 — 셀렉터는 원본(undefined일 수 있음)만 반환하고, 폴백은 이
   모듈 스코프 상수로 컴포넌트 밖에서 처리한다 */
const EMPTY_MAPPINGS: ImageMapping[] = []

/* 슬라이스 하나 = 썸네일 하나. CT는 같은 imageId(볼륨) 안에서 axis(x/y/z)별로 여러
   슬라이스가 오므로, imageId만으로는 키가 충돌한다 — imageId+axis+index로 구분한다 */
function sliceKey(m: ImageMapping): string {
  return `${m.imageId}-${m.axis ?? 'flat'}-${m.index ?? ''}`
}

function sliceLabel(m: ImageMapping): string {
  if (!m.axis) return m.imageType
  const suffix = m.index !== undefined && m.volume !== undefined ? ` ${m.index}/${m.volume}` : ''
  return `${m.axis.toUpperCase()}${suffix}`
}

/** 검사 이미지 카드 — 869×345. CT/RGB 토글 + 썸네일 그리드 */
function IndividualReportImages() {
  const imageMappings = useIndividualReportDetailStore((s) => s.detail?.imageMappings) ?? EMPTY_MAPPINGS
  const [tab, setTab] = useState<ImageType>('CT')
  const [openKey, setOpenKey] = useState<string | null>(null)

  const ctMappings = useMemo(() => imageMappings.filter((m) => m.imageType === 'CT'), [imageMappings])
  const rgbMappings = useMemo(() => imageMappings.filter((m) => m.imageType === 'RGB'), [imageMappings])
  const shown = tab === 'CT' ? ctMappings : rgbMappings
  const openMapping = shown.find((m) => sliceKey(m) === openKey) ?? null

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
          CT ({ctMappings.length})
        </button>
        <button
          type="button"
          className={`individual-report-images__tab${tab === 'RGB' ? ' individual-report-images__tab--active' : ''}`}
          onClick={() => setTab('RGB')}
        >
          RGB ({rgbMappings.length})
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="individual-report-images__empty">{tab} 이미지가 없습니다.</p>
      ) : (
        <div className="individual-report-images__grid">
          {shown.map((mapping) => (
            <ImageThumbnail
              key={sliceKey(mapping)}
              mapping={mapping}
              onClick={() => setOpenKey(sliceKey(mapping))}
            />
          ))}
        </div>
      )}

      {openMapping && (
        <ImageBboxModal
          title={`${openMapping.imageType} · ${sliceLabel(openMapping)} · imageId ${openMapping.imageId}`}
          imageUrl={openMapping.imgUrl}
          regions={[{ id: openMapping.imageId, bbox: openMapping.bbox, tone: 'neutral' }]}
          infoItems={[
            {
              id: openMapping.imageId,
              primaryText: sliceLabel(openMapping),
              secondaryText: `bbox (${openMapping.bbox.x}, ${openMapping.bbox.y}) ${openMapping.bbox.width}×${openMapping.bbox.height}`,
            },
          ]}
          open={openKey !== null}
          onClose={() => setOpenKey(null)}
        />
      )}
    </div>
  )
}

function ImageThumbnail({ mapping, onClick }: { mapping: ImageMapping; onClick: () => void }) {
  return (
    <div className="individual-report-images__item">
      <button type="button" className="individual-report-images__thumb" onClick={onClick}>
        <img
          src={mapping.imgUrl}
          alt={`${mapping.imageType} ${mapping.imageId}`}
          className="individual-report-images__thumb-img"
        />
        <span className="individual-report-images__thumb-badge">{mapping.imageType}</span>
      </button>
      <span className="individual-report-images__caption">
        imageId {mapping.imageId} · {sliceLabel(mapping)}
      </span>
    </div>
  )
}

export { IndividualReportImages }
