import type { WsStatus } from '../types'

export interface AiLogEntry {
  timestamp: string
  message: string
}

interface AiLogCallbacks {
  onMessage: (entry: AiLogEntry) => void
  onStatusChange: (status: WsStatus) => void
}

let source: EventSource | null = null

/* SSE는 커스텀 헤더(Authorization 등)를 못 붙이는 브라우저 API라, 인증이 필요하면
   토큰을 쿼리 파라미터로 넘겨야 한다 — 지금은 jobId만 넘기고 있다 */
export function startAiLogStream(jobId: string, cb: AiLogCallbacks) {
  if (source) return

  cb.onStatusChange('connecting')
  source = new EventSource(`/ai/logs/stream?jobId=${encodeURIComponent(jobId)}`)

  source.onopen = () => cb.onStatusChange('open')

  source.onmessage = (e) => {
    try {
      cb.onMessage(JSON.parse(e.data) as AiLogEntry)
    } catch {
      cb.onMessage({ timestamp: new Date().toISOString(), message: String(e.data) })
    }
  }

  /* EventSource는 끊기면 브라우저가 알아서 재연결을 시도한다 — readyState가
     CLOSED일 때만 완전히 종료된 것으로 본다(그 전엔 재연결 중) */
  source.onerror = () => {
    cb.onStatusChange(source?.readyState === EventSource.CLOSED ? 'closed' : 'reconnecting')
  }
}

export function stopAiLogStream() {
  source?.close()
  source = null
}
