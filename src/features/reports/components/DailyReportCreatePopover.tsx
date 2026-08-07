import { useEffect, useRef, useState } from 'react'
import './DailyReportCreatePopover.css'

interface DailyReportCreatePopoverProps {
  onClose: () => void
  onSubmit: (reportDate: string) => void
  submitting: boolean
}

function DailyReportCreatePopover({ onClose, onSubmit, submitting }: DailyReportCreatePopoverProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  return (
    <div ref={ref} className="daily-report-create-popover" role="dialog" aria-label="일일 리포트 생성">
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
  )
}

export { DailyReportCreatePopover }
