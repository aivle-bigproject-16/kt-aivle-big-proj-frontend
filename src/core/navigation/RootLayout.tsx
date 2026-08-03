import { Outlet } from 'react-router-dom'
import { SideBar } from '@/features/header'
import './RootLayout.css'

function RootLayout() {
  return (
    <div className="root-layout">
      <aside className="root-layout__left">
        <SideBar />
      </aside>
      <div className="root-layout__center">
        <div className="root-layout__content">
          <Outlet />
        </div>
      </div>
      <aside className="root-layout__right" />
    </div>
  )
}

export default RootLayout
