import { useNavigate } from 'react-router-dom'
import { ROUTES } from './routes'
import { useLoginStore } from '@/features/auth'
import { disconnectSimulationSocket } from '@/features/simulation'

export function useLogout() {
  const navigate = useNavigate()
  const { logout } = useLoginStore((s) => s.actions)

  return async () => {
    disconnectSimulationSocket()
    await logout()
    navigate(ROUTES.AUTH_LOGIN, { replace: true })
  }
}
