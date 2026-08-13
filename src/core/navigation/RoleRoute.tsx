import { Navigate, Outlet } from 'react-router-dom'
import { useLoginStore } from '@/features/auth'
import { hasRole } from '@/shared/security/access'
import { ROUTES } from './routes'

interface RoleRouteProps {
  role: string
}

function RoleRoute({ role }: RoleRouteProps) {
  const currentRole = useLoginStore((state) => state.role)
  return hasRole(currentRole, role) ? <Outlet /> : <Navigate to={ROUTES.FORBIDDEN} replace />
}

export default RoleRoute
