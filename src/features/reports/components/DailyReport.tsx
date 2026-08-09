import { useEffect } from 'react'
import { DailyReportListNav } from './DailyReportListNav'
import { DailyReportPageHeader } from './DailyReportPageHeader'
import { DailyReportStatCards } from './DailyReportStatCards'
import { DailyReportDefectTypes } from './DailyReportDefectTypes'
import { DailyReportReference } from './DailyReportReference'
import { DailyReportSummary } from './DailyReportSummary'
import { useDailyReportDetailStore } from '../store/useDailyReportDetailStore'
import './DailyReport.css'

interface DailyReportProps {
  reportId: number
}

/** 일일 리포트 조회 페이지 전체 — 헤더 / 통계 카드 4개 / 결함 유형 분포+참조 이미지 / 일일 총평이
   세로로 정렬된다 */
function DailyReport({ reportId }: DailyReportProps) {
  const { fetchDetail } = useDailyReportDetailStore((s) => s.actions)

  useEffect(() => {
    fetchDetail(reportId)
  }, [fetchDetail, reportId])

  return (
    <div className="daily-report">
      <DailyReportListNav />
      <DailyReportPageHeader />
      <DailyReportStatCards />
      <div className="daily-report__row">
        <DailyReportDefectTypes />
        <DailyReportReference />
      </div>
      <DailyReportSummary />
    </div>
  )
}

export { DailyReport }
