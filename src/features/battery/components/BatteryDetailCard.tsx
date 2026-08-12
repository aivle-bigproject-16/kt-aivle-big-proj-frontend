import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
// 1200 기준 구 CSS는 history/BatteryDetailCard.css로 이동됨 — 1400 기준으로 새로 만드는 중
import './BatteryDetailCard.css'
import { useBatteryDetailStore } from '../store/useBatteryDetailStore'
import { ImageSection } from './InspectionImageSection'
import { ROUTES } from '@/core/navigation/routes'
import { BatteryInfoHeader } from '@/shared/ui/BatteryInfoHeader'
import type { BatteryDetail, Inspection, BatteryDetailReport } from '../types'

interface Props {
  batteryCellId: number
}

function formatDate(value: string | null): string {
  if (!value) return '-'
  return value.split('T')[0]
}

function formatDateTime(value: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildBatteryBadges(detail: BatteryDetail): { text: string; tone: 'accent' | 'plain' }[] {
  const badges: { text: string; tone: 'accent' | 'plain' }[] = []
  if (detail.cellType) badges.push({ text: detail.cellType, tone: 'accent' })
  if (detail.modelName) badges.push({ text: detail.modelName, tone: 'plain' })
  if (detail.productId) badges.push({ text: detail.productId, tone: 'plain' })
  return badges
}

function BatteryDetailCard({ batteryCellId }: Props) {
  const detail = useBatteryDetailStore((s) => s.detail)
  const isLoading = useBatteryDetailStore((s) => s.isLoading)
  const error = useBatteryDetailStore((s) => s.error)
  const { fetchDetail, reset } = useBatteryDetailStore((s) => s.actions)

  const [selectedInspectionId, setSelectedInspectionId] = useState<number | null>(null)

  useEffect(() => {
    fetchDetail(batteryCellId)
    return () => reset()
  }, [fetchDetail, reset, batteryCellId])

  useEffect(() => {
    if (detail?.inspections.length && selectedInspectionId === null) {
      setSelectedInspectionId(detail.inspections[0].inspectionId)
    }
  }, [detail, selectedInspectionId])

  const selectedInspection =
    detail?.inspections.find((i) => i.inspectionId === selectedInspectionId) ?? null

  return (
    <section className="battery-detail">
      {isLoading && <p className="battery-detail__notice">불러오는 중...</p>}
      {error && <p className="battery-detail__notice battery-detail__notice--error">{error}</p>}

      {detail && (
        <>
          <BatteryInfoHeader
            title={detail.cellSerialNo}
            idLabel={`ID ${detail.batteryCellId}`}
            badges={buildBatteryBadges(detail)}
            metaItems={[
              { label: '생산처', value: detail.purchaseId ?? '-' },
              { label: '제조일', value: formatDate(detail.manufacturedDate) },
              { label: '등록일', value: formatDateTime(detail.createdAt) },
              { label: '최종 수정', value: formatDateTime(detail.updatedAt) },
            ]}
          />

          <div className="battery-detail__body">
            <div className="battery-detail__body-left">
              <InspectionList
                inspections={detail.inspections}
                reports={detail.reports}
                selectedId={selectedInspectionId}
                onSelect={setSelectedInspectionId}
              />
            </div>
            <div className="battery-detail__body-right">
              <InspectionDetailPanel inspection={selectedInspection} reports={detail.reports} />
            </div>
          </div>
        </>
      )}
    </section>
  )
}

// ── Inspection List (left panel) ──────────────────────────────────────────────

function InspectionList({
  inspections,
  reports,
  selectedId,
  onSelect,
}: {
  inspections: Inspection[]
  reports: BatteryDetailReport[]
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  return (
    <div className="battery-detail__insp-list">
      <p className="battery-detail__panel-label">검사 이력 ({inspections.length})</p>
      {inspections.length === 0 ? (
        <p className="battery-detail__empty">검사 기록이 없습니다.</p>
      ) : (
        <ul className="battery-detail__insp-items">
          {inspections.map((insp) => {
            const reportCount = reports.filter((r) => r.inspectionId === insp.inspectionId).length
            return (
              <li key={insp.inspectionId}>
                <button
                  type="button"
                  className={
                    insp.inspectionId === selectedId
                      ? 'battery-detail__insp-item battery-detail__insp-item--active'
                      : 'battery-detail__insp-item'
                  }
                  onClick={() => onSelect(insp.inspectionId)}
                >
                  {insp.inspectionId === selectedId && (
                    <span className="battery-detail__insp-item-accent" />
                  )}
                  <InspectionStatusMark label={insp.finalLabel} />
                  <span className="battery-detail__insp-info">
                    <span
                      className={`battery-detail__insp-id${insp.inspectionId === selectedId ? ' battery-detail__insp-id--active' : ''}`}
                    >
                      검사 #{insp.inspectionId}
                    </span>
                    <span className="battery-detail__insp-time">
                      {formatDateTime(insp.analyzedAt)}
                    </span>
                  </span>
                  <span className="battery-detail__insp-right">
                    <LabelBadge label={insp.finalLabel} />
                    <ReportCountChip count={reportCount} />
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

/* PASS/REJECT는 원, FAIL은 삼각형 — 결과에 따라 모양 자체가 다르다 */
function InspectionStatusMark({ label }: { label: string }) {
  if (label === 'FAIL') {
    return (
      <svg
        className="battery-detail__insp-mark battery-detail__insp-mark--fail"
        viewBox="0 0 10 8"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M5 0L10 8H0L5 0Z" fill="#DC2626" />
      </svg>
    )
  }
  return (
    <span
      className={`battery-detail__insp-mark battery-detail__insp-mark--dot battery-detail__insp-mark--${label.toLowerCase()}`}
    />
  )
}

function ReportCountChip({ count }: { count: number }) {
  return (
    <span className={`battery-detail__report-chip${count === 0 ? ' battery-detail__report-chip--empty' : ''}`}>
      <svg
        className="battery-detail__report-chip-icon"
        viewBox="0 0 9 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="0.55" y="0.55" width="7.9" height="10.9" rx="0.9" />
      </svg>
      리포트 {count > 0 ? count : '—'}
    </span>
  )
}

// ── Inspection Detail Panel (right panel) ─────────────────────────────────────

function InspectionDetailPanel({
  inspection,
  reports,
}: {
  inspection: Inspection | null
  reports: BatteryDetailReport[]
}) {
  const [activeImageId, setActiveImageId] = useState<number | null>(null)

  useEffect(() => {
    setActiveImageId(inspection?.image[0]?.imageId ?? null)
  }, [inspection])

  if (!inspection) {
    return (
      <div className="battery-detail__insp-panel battery-detail__insp-panel--placeholder">
        <p className="battery-detail__empty">검사를 선택하세요.</p>
      </div>
    )
  }

  const isPass = inspection.finalLabel === 'PASS'
  const activeImage =
    inspection.image.find((i) => i.imageId === activeImageId) ?? inspection.image[0] ?? null

  return (
    <div className="battery-detail__insp-panel">
      <div className="battery-detail__insp-panel-header">
        <div className="battery-detail__insp-panel-title">
          <span className="battery-detail__insp-panel-id">검사 #{inspection.inspectionId}</span>
          <LabelBadge label={inspection.finalLabel} />
        </div>
        <span className="battery-detail__insp-panel-meta">
          분석 완료 {formatDateTime(inspection.analyzedAt)}
        </span>
      </div>

      <span className="battery-detail__insp-panel-divider" />

      {isPass ? (
        <div className="battery-detail__pass-state">
          <span className="battery-detail__pass-icon">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M6 10.5L8.5 13L14 7"
                stroke="#1E7E34"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <p className="battery-detail__pass-text">이상 없음</p>
          <p className="battery-detail__pass-sub">검사 결과 정상으로 판단되었습니다.</p>
        </div>
      ) : (
        <div className="battery-detail__insp-content">
          <ImageSection
            images={inspection.image}
            defects={inspection.defectResults}
            activeImageId={activeImageId}
            onSelectImage={setActiveImageId}
          />

          <div className="battery-detail__insp-side">
            <DefectSection
              defects={inspection.defectResults}
              activeType={activeImage?.imageType}
              activeImageId={activeImageId}
              onSelectDefectImage={setActiveImageId}
            />

            <span className="battery-detail__insp-side-divider" />

            <InspectionReportSection inspectionId={inspection.inspectionId} reports={reports} />
          </div>
        </div>
      )}
    </div>
  )
}

// ── Defect Section ────────────────────────────────────────────────────────────

function DefectSection({
  defects,
  activeType,
  activeImageId,
  onSelectDefectImage,
}: {
  defects: Inspection['defectResults']
  /** CT 탭이면 CT 결함만, RGB 탭이면 RGB 결함만 보여준다 */
  activeType?: string
  activeImageId: number | null
  onSelectDefectImage: (imageId: number) => void
}) {
  const numbered = defects.map((d, i) => ({ ...d, orderNo: i + 1 }))
  const shown = activeType ? numbered.filter((d) => d.imageType === activeType) : numbered

  return (
    <div className="battery-detail__defect-section">
      <p className="battery-detail__sub-label">결함 탐지 결과 ({shown.length})</p>
      {shown.length === 0 ? (
        <p className="battery-detail__empty">탐지된 결함이 없습니다.</p>
      ) : (
        <ul className="battery-detail__defect-list">
          {shown.map((d) => {
            const isOnActiveImage = d.imageId === activeImageId
            const tone = d.label.toLowerCase()
            return (
              <li key={d.defectResultId}>
                <button
                  type="button"
                  className={`battery-detail__defect-card${isOnActiveImage ? '' : ' battery-detail__defect-card--dim'}`}
                  onClick={() => onSelectDefectImage(d.imageId)}
                >
                  <div className="battery-detail__defect-header">
                    <span className={`battery-detail__defect-num battery-detail__defect-num--${tone}`}>
                      {d.orderNo}
                    </span>
                    <span className={`battery-detail__defect-dot battery-detail__defect-dot--${tone}`} />
                    <span className="battery-detail__defect-type">{d.defectType}</span>
                    <span className="battery-detail__image-type-tag">{d.imageType}</span>
                  </div>
                  <div className="battery-detail__conf-row">
                    <div className="battery-detail__conf-bar-bg">
                      <div
                        className={`battery-detail__conf-bar battery-detail__conf-bar--${tone}`}
                        style={{ width: `${Math.round(d.confidence * 100)}%` }}
                      />
                    </div>
                    <span className="battery-detail__conf-val">
                      {Math.round(d.confidence * 100)}%
                    </span>
                  </div>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ── Inspection Report Section (per-inspection, right panel bottom) ────────────

function InspectionReportSection({
  inspectionId,
  reports,
}: {
  inspectionId: number
  reports: BatteryDetailReport[]
}) {
  const navigate = useNavigate()
  const inspectionReports = reports.filter((r) => r.inspectionId === inspectionId)

  return (
    <div className="battery-detail__insp-report-section">
      <div className="battery-detail__insp-report-header">
        <span className="battery-detail__sub-label">리포트</span>
      </div>

      {inspectionReports.length === 0 ? (
        <p className="battery-detail__empty">리포트가 없습니다.</p>
      ) : (
        <ul className="battery-detail__insp-report-list">
          {inspectionReports.map((r) => (
            <li key={r.reportId}>
              <button
                type="button"
                className="battery-detail__insp-report-row"
                onClick={() => navigate(ROUTES.REPORT_INDIVIDUAL_DETAIL(r.reportId))}
              >
                <span className="battery-detail__insp-report-info">
                  <span className="battery-detail__insp-report-title">{r.title}</span>
                  <span className="battery-detail__insp-report-meta">
                    RPT-{r.reportId} · {formatDateTime(r.createdAt)}
                  </span>
                </span>
                <span className="battery-detail__insp-report-status">{r.status}</span>
                <svg
                  className="battery-detail__insp-report-arrow"
                  viewBox="0 0 9 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M1 1L7.24 8L1 15"
                    stroke="#0C5795"
                    strokeWidth="1.63"
                    strokeLinecap="round"
                    fill="none"
                  />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────

function LabelBadge({ label }: { label: string }) {
  return (
    <span className={`battery-detail__badge battery-detail__badge--${label.toLowerCase()}`}>
      {label === 'FAIL' && (
        <svg viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M5 0L10 8H0L5 0Z" fill="#DC2626" />
        </svg>
      )}
      {label}
    </span>
  )
}

export default BatteryDetailCard
