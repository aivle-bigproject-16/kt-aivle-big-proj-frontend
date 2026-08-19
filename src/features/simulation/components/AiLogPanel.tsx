import { useEffect, useRef } from 'react'
import { useAiLogStore } from '../store/useAiLogStore'
import './AiLogPanel.css'

interface AiLogPanelProps {
  jobId: string | null
}

/** AI 추론 로그 패널 — jobId가 있는 동안 SSE로 로그를 스트리밍해 터미널처럼 보여준다.
   jobId가 null이 되면 연결을 끊는다 */
function AiLogPanel({ jobId }: AiLogPanelProps) {
  const status = useAiLogStore((s) => s.status)
  const entries = useAiLogStore((s) => s.entries)
  const { connect, disconnect } = useAiLogStore((s) => s.actions)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!jobId) return
    connect(jobId)
    return () => disconnect()
  }, [jobId, connect, disconnect])

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [entries])

  return (
    <div className="ai-log-panel">
      <div className="ai-log-panel__header">
        <span className="ai-log-panel__title">AI 추론 로그</span>
        <span className={`ai-log-panel__status ai-log-panel__status--${status}`}>{status}</span>
      </div>

      <div className="ai-log-panel__body" ref={scrollRef}>
        {entries.length === 0 ? (
          <>
            <span className="ai-log-panel__empty">대기 중</span>
          </>
        ) : (
          entries.map((entry, i) => (
            <div key={i} className="ai-log-panel__line">
              <span className="ai-log-panel__line-time">{entry.timestamp}</span>
              <span className="ai-log-panel__line-message">{entry.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export { AiLogPanel }
