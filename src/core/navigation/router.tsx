import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from './routes'
import RootLayout from './RootLayout'
import PrivateRoute from './PrivateRoute'
import LoginPage from '@/pages/LoginPage'
import SignupPage from '@/pages/SignupPage'
import DashboardPage from '@/pages/DashboardPage'
import BatteryPage from '@/pages/BatteryPage'
import BatteryDetailPage from '@/pages/BatteryDetailPage'
import IndividualReportPage from '@/pages/IndividualReportPage'
import IndividualReportDetailPage from '@/pages/IndividualReportDetailPage'
import DailyReportPage from '@/pages/DailyReportPage'
import DailyReportDetailPage from '@/pages/DailyReportDetailPage'
import NoticePage from '@/pages/NoticePage'

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={ROUTES.DASHBOARD} replace /> },
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
        ],
      },
    ],
  },
])
