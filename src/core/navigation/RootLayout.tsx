import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { SideBar } from '@/features/header'
import { initializeCsrfProtection } from '@/core/api/csrf'
import { LegalFooter } from '@/shared/ui/LegalFooter'
import './RootLayout.css'

function RootLayout() {
  useEffect(() => {
    void initializeCsrfProtection()
  }, [])

  return (
    <div className="root-layout">
      <aside className="root-layout__left">
        <SideBar />
      </aside>
      <div className="root-layout__center">
        <div className="root-layout__content">
          <Outlet />
        </div>
        <LegalFooter />
      </div>
      <aside className="root-layout__right" />
    </div>
  )
}

export default RootLayout
