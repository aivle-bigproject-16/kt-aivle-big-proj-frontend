import { Navigate, Outlet } from 'react-router-dom'
import { ROUTES } from './routes'
import { useLoginStore } from '@/features/auth'

function PrivateRoute() {
  const isAuthenticated = useLoginStore((s) => s.isAuthenticated)
  const isInitialized = useLoginStore((s) => s.isInitialized)

  if (!isInitialized) return null
  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.AUTH_LOGIN} replace />
}

export default PrivateRoute
