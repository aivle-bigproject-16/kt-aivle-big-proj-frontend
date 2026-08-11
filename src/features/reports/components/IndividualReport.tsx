import { useEffect } from 'react'
import { IndividualReportListNav } from './IndividualReportListNav'
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

/** 개별 리포트 페이지 전체 — 최상단에 IndividualReportListNav, 그 아래 헤더/본문1/본문2가
   세로로 정렬된다 (1400×100 / 1400×400 / 1400×340, 사이 갭 2rem) */
function IndividualReport({ reportId }: IndividualReportProps) {
  const { fetchDetail } = useIndividualReportDetailStore((s) => s.actions)

  useEffect(() => {
    fetchDetail(reportId)
  }, [fetchDetail, reportId])

  return (
    <div className="individual-report">
      <IndividualReportListNav />
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
