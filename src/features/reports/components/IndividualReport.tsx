import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ListBackNav } from '@/shared/ui/ListBackNav'
import { ROUTES } from '@/core/navigation/routes'
import { IndividualReportHeader } from './IndividualReportHeader'
import { IndividualReportCellView } from './IndividualReportCellView'
import { IndividualReportMetrics } from './IndividualReportMetrics'
import { IndividualReportImages } from './IndividualReportImages'
import { IndividualReportInsight } from './IndividualReportInsight'
import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import { ReportGenerationState } from './ReportGenerationState'
import './IndividualReport.css'

interface IndividualReportProps {
  reportId: number
}

/** 개별 리포트 페이지 전체 — 최상단에 목록 버튼, 그 아래 헤더/본문1/본문2가
   세로로 정렬된다 (1400×100 / 1400×400 / 1400×340, 사이 갭 2rem) */
function IndividualReport({ reportId }: IndividualReportProps) {
  const navigate = useNavigate()
  const detail = useIndividualReportDetailStore((s) => s.detail)
  const error = useIndividualReportDetailStore((s) => s.error)
  const { fetchDetail, create, reset } = useIndividualReportDetailStore((s) => s.actions)
  const [pollVersion, setPollVersion] = useState(0)
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

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
      const nextReportId = await create({
        batteryCellId: detail.batteryCellId,
        forceRegenerate: true,
      })
      reset()
      navigate(ROUTES.REPORT_INDIVIDUAL_DETAIL(nextReportId), { replace: true })
    } catch {
      setRetryError('리포트 재생성 요청에 실패했습니다.')
    } finally {
      setRetrying(false)
    }
  }

  const refresh = () => setPollVersion((version) => version + 1)

  return (
    <div className="individual-report">
      <ListBackNav to={ROUTES.REPORT_INDIVIDUAL} label="개별 리포트 목록" />
      <IndividualReportHeader />
      {detail?.status === 'COMPLETED' && !error ? (
        <>
          <div className="individual-report__body-1">
            <IndividualReportCellView />
            <IndividualReportMetrics />
          </div>
          <div className="individual-report__body-2">
            <IndividualReportImages />
            <IndividualReportInsight />
          </div>
        </>
      ) : (
        <ReportGenerationState
          status={detail?.status ?? null}
          error={error}
          actionError={retryError}
          retrying={retrying}
          onRetry={detail?.status === 'FAILED' ? retry : undefined}
          onRefresh={error ? refresh : undefined}
        />
      )}
    </div>
  )
}

export { IndividualReport }
