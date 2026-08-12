import './NoticeStateMessage.css'

interface NoticeStateMessageProps {
  /** 조회 실패처럼 문제가 생긴 상황이면 true */
  isError?: boolean
  children: React.ReactNode
}

/** 로딩·에러 안내 — 아직 보여줄 내용이 없을 때 카드 자리를 대신 채운다 */
function NoticeStateMessage({ isError = false, children }: NoticeStateMessageProps) {
  return (
    <div
      className={
        isError ? 'notice-state-message notice-state-message--error' : 'notice-state-message'
      }
    >
      {children}
    </div>
  )
}

export { NoticeStateMessage }
