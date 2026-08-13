import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from './routes'
import RootLayout from './RootLayout'
import PrivateRoute from './PrivateRoute'
import RoleRoute from './RoleRoute'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import PrivacyPolicyPage from '@/pages/PrivacyPolicyPage'
import ForbiddenPage from '@/pages/ForbiddenPage'
import DashboardPage from '@/pages/DashboardPage'
import BatteryPage from '@/pages/BatteryPage'
import BatteryDetailPage from '@/pages/BatteryDetailPage'
import IndividualReportPage from '@/pages/IndividualReportPage'
import IndividualReportDetailPage from '@/pages/IndividualReportDetailPage'
import DailyReportPage from '@/pages/DailyReportPage'
import DailyReportDetailPage from '@/pages/DailyReportDetailPage'
import NoticePage from '@/pages/NoticePage'
import NoticeCreatePage from '@/pages/NoticeCreatePage'
import NoticeDetailPage from '@/pages/NoticeDetailPage'
import NoticeEditPage from '@/pages/NoticeEditPage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
  { path: ROUTES.PRIVACY, Component: PrivacyPolicyPage },
  {
    path: '/auth',
    children: [
      { path: 'login', Component: LoginPage },
      { path: 'signup', Component: SignupPage },
    ],
  },
  {
    element: <RootLayout />,
    children: [
      {
        element: <PrivateRoute />,
        children: [
          { path: 'dashboard', Component: DashboardPage },
          { path: 'battery', Component: BatteryPage },
          { path: 'battery/:batteryCellId', Component: BatteryDetailPage },
          {
            path: 'reports',
            children: [
              { path: 'individual', Component: IndividualReportPage },
              { path: 'individual/:reportId', Component: IndividualReportDetailPage },
              { path: 'daily', Component: DailyReportPage },
              { path: 'daily/:reportId', Component: DailyReportDetailPage },
            ],
          },
          { path: 'notices', Component: NoticePage },
          { path: 'notices/:id', Component: NoticeDetailPage },
          { path: 'forbidden', Component: ForbiddenPage },
          {
            element: <RoleRoute role="ADMIN" />,
            children: [
              // 'new'가 :id보다 먼저 와야 /notices/new가 상세로 잘못 잡히지 않는다
              { path: 'notices/new', Component: NoticeCreatePage },
              { path: 'notices/:id/edit', Component: NoticeEditPage },
            ],
          },
        ],
      },
    ],
  },
])
