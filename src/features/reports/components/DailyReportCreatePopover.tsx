import { useEffect, useState } from 'react'
import './DailyReportCreatePopover.css'

interface DailyReportCreatePopoverProps {
  onClose: () => void
  onSubmit: (reportDate: string) => void
  submitting: boolean
}

/** 일일 리포트 생성 모달 — 버튼 옆 드롭다운이 아니라 화면 중앙에 뜬다.
   폭은 daily-report-summary와 동일한 140rem */
function DailyReportCreatePopover({ onClose, onSubmit, submitting }: DailyReportCreatePopoverProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="daily-report-create-popover-overlay" onClick={onClose}>
      <div
        className="daily-report-create-popover"
        role="dialog"
        aria-label="일일 리포트 생성"
        onClick={(e) => e.stopPropagation()}
      >
        <label className="daily-report-create-popover__label" htmlFor="daily-report-create-date">
          기준일
        </label>
        <input
          id="daily-report-create-date"
          type="date"
          className="daily-report-create-popover__input"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <div className="daily-report-create-popover__actions">
          <button type="button" className="daily-report-create-popover__cancel" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="daily-report-create-popover__submit"
            disabled={!date || submitting}
            onClick={() => onSubmit(date)}
          >
            {submitting ? '생성 중...' : '생성'}
          </button>
        </div>
      </div>
    </div>
  )
}

export { DailyReportCreatePopover }
