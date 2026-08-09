import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
// 1200 기준 구 CSS는 history/BatteryDetailCard.css로 이동됨 — 1400 기준으로 새로 만들 것
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
      <Link to={ROUTES.BATTERY} className="battery-detail__back">
        ← 배터리 목록으로
      </Link>

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
            <InspectionList
              inspections={detail.inspections}
              selectedId={selectedInspectionId}
              onSelect={setSelectedInspectionId}
            />
            <InspectionDetailPanel inspection={selectedInspection} />
          </div>

          {detail.reports.length > 0 && <ReportSection reports={detail.reports} />}
        </>
      )}
    </section>
  )
}

// ── Inspection List (left panel) ──────────────────────────────────────────────

function InspectionList({
  inspections,
  selectedId,
  onSelect,
}: {
  inspections: Inspection[]
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  return (
    <div className="battery-detail__insp-list">
      <p className="battery-detail__panel-label">검사 이력 ({inspections.length}건)</p>
      {inspections.length === 0 ? (
        <p className="battery-detail__empty">검사 기록이 없습니다.</p>
      ) : (
        <ul className="battery-detail__insp-items">
          {inspections.map((insp) => (
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
                <span
                  className={`battery-detail__dot battery-detail__dot--${insp.finalLabel.toLowerCase()}`}
                />
                <span className="battery-detail__insp-info">
                  <span className="battery-detail__insp-id">#{insp.inspectionId}</span>
                  <span className="battery-detail__insp-time">
                    {formatDateTime(insp.analyzedAt)}
                  </span>
                </span>
                <LabelBadge label={insp.finalLabel} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Inspection Detail Panel (right panel) ─────────────────────────────────────

function InspectionDetailPanel({ inspection }: { inspection: Inspection | null }) {
  if (!inspection) {
    return (
      <div className="battery-detail__insp-panel battery-detail__insp-panel--placeholder">
        <p className="battery-detail__empty">검사를 선택하세요.</p>
      </div>
    )
  }

  const isPass = inspection.finalLabel === 'PASS'

  return (
    <div className="battery-detail__insp-panel">
      <div className="battery-detail__insp-panel-header">
        <div className="battery-detail__insp-panel-title">
          <span className="battery-detail__insp-panel-id">검사 #{inspection.inspectionId}</span>
          <LabelBadge label={inspection.finalLabel} />
        </div>
        <span className="battery-detail__insp-time">{formatDateTime(inspection.analyzedAt)}</span>
      </div>

      {isPass ? (
        <div className="battery-detail__pass-state">
          <p className="battery-detail__pass-text">이상 없음 (PASS)</p>
          <p className="battery-detail__pass-sub">이미지 및 결함 데이터 없음</p>
        </div>
      ) : (
        <div className="battery-detail__insp-content">
          <ImageSection images={inspection.image} defects={inspection.defectResults} />
          <DefectSection defects={inspection.defectResults} />
        </div>
      )}
    </div>
  )
}

// ── Defect Section ────────────────────────────────────────────────────────────

function DefectSection({ defects }: { defects: Inspection['defectResults'] }) {
  return (
    <div className="battery-detail__defect-section">
      <p className="battery-detail__sub-label">결함 탐지 결과 ({defects.length})</p>
      {defects.length === 0 ? (
        <p className="battery-detail__empty">탐지된 결함이 없습니다.</p>
      ) : (
        <ul className="battery-detail__defect-list">
          {defects.map((d) => (
            <li key={d.defectResultId} className="battery-detail__defect-card">
              <div className="battery-detail__defect-header">
                <LabelBadge label={d.label} />
                <span className="battery-detail__defect-type">{d.defectType}</span>
                <span className="battery-detail__image-type-tag">{d.imageType}</span>
              </div>
              <div className="battery-detail__conf-row">
                <span className="battery-detail__conf-label">신뢰도</span>
                <div className="battery-detail__conf-bar-bg">
                  <div
                    className={`battery-detail__conf-bar battery-detail__conf-bar--${d.label.toLowerCase()}`}
                    style={{ width: `${Math.round(d.confidence * 100)}%` }}
                  />
                </div>
                <span className="battery-detail__conf-val">
                  {Math.round(d.confidence * 100)}%
                </span>
              </div>
              {d.bbox && (
                <p className="battery-detail__bbox">
                  bbox ({d.bbox.x}, {d.bbox.y}) · {d.bbox.width}×{d.bbox.height}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Report Section ────────────────────────────────────────────────────────────

function ReportSection({ reports }: { reports: BatteryDetailReport[] }) {
  const navigate = useNavigate()

  return (
    <div className="battery-detail__reports-card">
      <p className="battery-detail__panel-label">리포트 ({reports.length}건)</p>
      <ul className="battery-detail__report-list">
        {reports.map((r) => (
          <li key={r.reportId}>
            <button
              type="button"
              className="battery-detail__report-row"
              onClick={() => navigate(ROUTES.REPORT_INDIVIDUAL_DETAIL(r.reportId))}
            >
              <span className="battery-detail__report-info">
                <span className="battery-detail__report-title">{r.title}</span>
                <span className="battery-detail__report-meta">
                  검사 #{r.inspectionId} · {formatDateTime(r.createdAt)}
                </span>
              </span>
              <ReportStatusBadge status={r.status} />
              <span className="battery-detail__report-arrow" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// ── Badges ────────────────────────────────────────────────────────────────────

function LabelBadge({ label }: { label: string }) {
  return (
    <span className={`battery-detail__badge battery-detail__badge--${label.toLowerCase()}`}>
      {label}
    </span>
  )
}

function ReportStatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`battery-detail__badge battery-detail__badge--status-${status.toLowerCase()}`}
    >
      {status}
    </span>
  )
}

export default BatteryDetailCard
