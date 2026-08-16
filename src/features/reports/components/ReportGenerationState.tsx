import type { ReportStatus } from '../types'
import './ReportGenerationState.css'

const FAILURE_MESSAGES: Record<string, string> = {
  INCOMPLETE_SET: '검사 결과가 모두 준비되지 않았습니다.',
  AI_SERVER_ERROR: 'AI 리포트 서버 호출에 실패했습니다.',
  AI_SERVER_TIMEOUT: 'AI 리포트 생성 시간이 초과됐습니다.',
  TIMEOUT: '리포트 생성 시간이 초과됐습니다.',
  MALFORMED_RESPONSE: 'AI 응답 형식을 처리하지 못했습니다.',
  PARTIAL_ANALYSIS_FAILURE: '일부 검사 결과 분석에 실패했습니다.',
  WORKER_ERROR: '리포트 생성 작업 중 오류가 발생했습니다.',
}

interface Props {
  status: ReportStatus | null
  error?: string | null
  failureReason?: string | null
  actionError?: string | null
  retrying?: boolean
  onRetry?: () => void
  onRefresh?: () => void
}

function failureMessage(reason?: string | null) {
  if (!reason) return '리포트 생성에 실패했습니다.'
  const code = reason.split(':', 1)[0]
  return FAILURE_MESSAGES[code] ?? `리포트 생성에 실패했습니다. (${reason})`
}

function ReportGenerationState({
  status,
  error,
  failureReason,
  actionError,
  retrying = false,
  onRetry,
  onRefresh,
}: Props) {
  if (error) {
    return (
      <section className="report-generation-state report-generation-state--failed" role="alert">
        <strong>리포트 상태를 불러오지 못했습니다.</strong>
        <p>{error}</p>
        {onRefresh && <button type="button" onClick={onRefresh}>다시 조회</button>}
      </section>
    )
  }

  if (status === 'FAILED') {
    return (
      <section className="report-generation-state report-generation-state--failed" role="alert">
        <strong>리포트 생성 실패</strong>
        <p>{failureMessage(failureReason)}</p>
        {actionError && <p>{actionError}</p>}
        {onRetry && (
          <button type="button" onClick={onRetry} disabled={retrying}>
            {retrying ? '재시도 요청 중...' : '다시 생성'}
          </button>
        )}
      </section>
    )
  }

  return (
    <section className="report-generation-state" role="status" aria-live="polite">
      <strong>리포트를 생성하고 있습니다.</strong>
      <p>완료 또는 실패할 때까지 이 화면이 자동으로 갱신됩니다.</p>
    </section>
  )
}

export { ReportGenerationState }
