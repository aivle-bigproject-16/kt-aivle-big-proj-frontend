import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListBackNav } from '@/shared/ui/ListBackNav'
import { ROUTES } from '@/core/navigation/routes'
import { DailyReportPageHeader } from './DailyReportPageHeader'
import { DailyReportStatCards } from './DailyReportStatCards'
import { DailyReportDefectTypes } from './DailyReportDefectTypes'
import { DailyReportReference } from './DailyReportReference'
import { DailyReportSummary } from './DailyReportSummary'
import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import { ReportGenerationState } from './ReportGenerationState'
import { dailyReportService } from '../services/dailyReportService'
import './DailyReport.css'

interface DailyReportProps {
  reportId: number
}

/** 일일 리포트 조회 페이지 전체 — 헤더 / 통계 카드 4개 / 결함 유형 분포+참조 이미지 / 일일 총평이
   세로로 정렬된다 */
function DailyReport({ reportId }: DailyReportProps) {
  const navigate = useNavigate()
  const detail = useDailyReportDetailStore((s) => s.detail)
  const error = useDailyReportDetailStore((s) => s.error)
  const { fetchDetail, create, reset } = useDailyReportDetailStore((s) => s.actions)
  const [pollVersion, setPollVersion] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let active = true
    let timer: number | undefined

    const poll = async () => {
      const status = await fetchDetail(reportId)
      if (active && status === 'PENDING') {
        timer = window.setTimeout(poll, 3000)
      }
    }

    void poll()
    return () => {
      active = false
      if (timer !== undefined) window.clearTimeout(timer)
      reset()
    }
  }, [fetchDetail, pollVersion, reportId, reset])

  const retry = async () => {
    if (!detail || retrying) return
    setRetrying(true)
    setRetryError(null)
    try {
      const nextReportId = await create({ reportDate: detail.reportDate, forceRegenerate: true })
      reset()
      if (nextReportId !== reportId) {
        navigate(ROUTES.REPORT_DAILY_DETAIL(nextReportId), { replace: true })
      } else {
        setPollVersion((version) => version + 1)
      }
    } catch {
      setRetryError('리포트 재생성 요청에 실패했습니다.')
    } finally {
      setRetrying(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('정말 이 리포트를 삭제하시겠습니까?')) return
    setDeleting(true)
    try {
      await dailyReportService.deleteDailyReport(reportId)
      navigate(ROUTES.REPORT_DAILY, { replace: true })
    } catch (err: any) {
      alert(err?.message || '리포트 삭제에 실패했습니다.')
      setDeleting(false)
    }
  }

  const refresh = () => setPollVersion((version) => version + 1)

  return (
    <div className="daily-report">
      <ListBackNav to={ROUTES.REPORT_DAILY} label="일일 리포트 목록" />
      <DailyReportPageHeader />
      {detail?.status === 'COMPLETED' && !error ? (
        <>
          <DailyReportStatCards />
          <div className="daily-report__row">
            <DailyReportDefectTypes />
            <DailyReportReference />
          </div>
          <DailyReportSummary />
          <div className="daily-report__footer">
            <button
              type="button"
              className="daily-report__delete-btn"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? '삭제 중...' : '리포트 삭제'}
            </button>
          </div>
        </>
      ) : (
        <ReportGenerationState
          status={detail?.status ?? null}
          error={error}
          failureReason={detail?.failureReason}
          actionError={retryError}
          retrying={retrying}
          deleting={deleting}
          onRetry={detail?.status === 'FAILED' ? retry : undefined}
          onRefresh={error ? refresh : undefined}
          onDelete={detail?.status === 'FAILED' || error ? handleDelete : undefined}
        />
      )}
    </div>
  )
}

export { DailyReport }
