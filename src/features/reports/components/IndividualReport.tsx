import { useEffect } from 'react'
import { ListBackNav } from '@/shared/ui/ListBackNav'
import { ROUTES } from '@/core/navigation/routes'
import { IndividualReportHeader } from './IndividualReportHeader'
import { IndividualReportCellView } from './IndividualReportCellView'
import { IndividualReportMetrics } from './IndividualReportMetrics'
import { IndividualReportImages } from './IndividualReportImages'
import { IndividualReportInsight } from './IndividualReportInsight'
import { useIndividualReportDetailStore } from '../store/useIndividualReportDetailStore'
import './IndividualReport.css'

interface IndividualReportProps {
  reportId: number
}

/** 개별 리포트 페이지 전체 — 최상단에 목록 버튼, 그 아래 헤더/본문1/본문2가
   세로로 정렬된다 (1400×100 / 1400×400 / 1400×340, 사이 갭 2rem) */
function IndividualReport({ reportId }: IndividualReportProps) {
  const { fetchDetail, fetchCellView } = useIndividualReportDetailStore((s) => s.actions)

  useEffect(() => {
    fetchDetail(reportId)
    fetchCellView(reportId)
  }, [fetchDetail, fetchCellView, reportId])

  return (
    <div className="individual-report">
      <ListBackNav to={ROUTES.REPORT_INDIVIDUAL} label="개별 리포트 목록" />
      <IndividualReportHeader />
      <div className="individual-report__body-1">
        <IndividualReportCellView />
        <IndividualReportMetrics />
      </div>
      <div className="individual-report__body-2">
        <IndividualReportImages />
        <IndividualReportInsight />
      </div>
    </div>
  )
}

export { IndividualReport }
