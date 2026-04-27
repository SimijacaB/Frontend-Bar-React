import type { FC, ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: ReactNode
  showFooter?: boolean
  showSidebar?: boolean
  sidebarLinks?: Array<{ label: string; href: string; icon?: string }>
}

const Layout: FC<LayoutProps> = ({ 
  children, 
  showFooter = true,
  showSidebar = false,
  sidebarLinks = []
}) => {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <div className="flex flex-1">
        {showSidebar && (
          <Sidebar 
            links={sidebarLinks}
            title="Project Bar"
          />
        )}
        <main className="flex-1">{children}</main>
      </div>
      {showFooter && <Footer />}
    </div>
  )
}

export default Layout
