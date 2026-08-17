import { useEffect, useRef, useState } from 'react'
import { useLoginStore } from '@/features/auth'
import { useLogout } from '@/core/navigation'
import { ChevronDownIcon } from './Icons'
import './UserChip.css'

/** 서버가 주는 role 값을 화면 표기로 옮긴다. 모르는 값이면 원문을 그대로 보여준다 */
const ROLE_LABEL: Record<string, string> = {
  supervisor: '관리자',
  user: '일반 사용자',
}

function toRoleLabel(role: string | null): string {
  if (!role) return '-'
  return ROLE_LABEL[role.toLowerCase()] ?? role
}

/** 우측 컬럼 상단의 사용자 칩 — 접힌 상태는 아바타+이름,
   클릭하면 아래로 역할과 로그아웃이 펼쳐진다 (DASHBOARD_REDESIGN.md §3.4) */
function UserChip() {
  const name = useLoginStore((s) => s.name)
  const role = useLoginStore((s) => s.role)
  const logout = useLogout()

  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 바깥을 클릭하거나 ESC를 누르면 닫는다
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  // 세션 복구 중에는 이름이 아직 없다. 빈 칩이 깜빡이지 않도록 그리지 않는다
  if (!name) return null

  return (
    <div className="user-chip" ref={containerRef}>
      <button
        type="button"
        className="user-chip__button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        <span className="user-chip__avatar" aria-hidden="true">
          {name.charAt(0)}
        </span>
        <span className="user-chip__name">{name}</span>
        <span className={isOpen ? 'user-chip__arrow user-chip__arrow--open' : 'user-chip__arrow'}>
          <ChevronDownIcon />
        </span>
      </button>

      {isOpen && (
        <div className="user-chip__dropdown" role="menu">
          <div className="user-chip__role">
            <span className="user-chip__role-label">역할</span>
            <span className="user-chip__role-value">{toRoleLabel(role)}</span>
          </div>
          <button type="button" className="user-chip__logout" onClick={logout} role="menuitem">
            로그아웃
          </button>
        </div>
      )}
    </div>
  )
}

export { UserChip }
