import type { FC, ReactNode } from 'react'
import Header from './Header'
import Footer from './Footer'
import Sidebar from './Sidebar'
import { useAuth } from '../../features/auth/context/AuthContext'
import { LayoutDashboard, UtensilsCrossed, ClipboardList, Package, QrCode, Users, TableProperties, BarChart3, LogOut } from 'lucide-react'

interface LayoutProps {
  children: ReactNode
  showFooter?: boolean
  showHeader?: boolean
}

const ADMIN_SIDEBAR_LINKS = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Menú', href: '/menu', icon: UtensilsCrossed },
  { label: 'Pedidos', href: '/orders', icon: ClipboardList },
  { label: 'Inventario', href: '/admin/inventario', icon: Package },
  { label: 'Mesas', href: '/admin/mesas', icon: TableProperties },
  { label: 'Asignación', href: '/admin/asignacion', icon: Users },
  { label: 'QR', href: '/admin/qr', icon: QrCode },
  { label: 'Estadísticas', href: '/admin/estadisticas', icon: BarChart3 },
]

const Layout: FC<LayoutProps> = ({ 
  children, 
  showFooter = true,
  showHeader = true,
}) => {
  const { user, logout } = useAuth()
  const isAdmin = user?.roles?.includes('ADMIN') ?? false

  const handleLogout = () => {
    logout()
    window.location.href = '/login'
  }

  // If admin, always hide header (sidebar handles navigation)
  const shouldShowHeader = !isAdmin && showHeader

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {isAdmin && (
        <Sidebar 
          links={ADMIN_SIDEBAR_LINKS}
          title="Project Bar"
          onLogout={handleLogout}
        />
      )}
      <div className={`flex-1 flex flex-col ${isAdmin ? 'ml-64' : ''}`}>
        {shouldShowHeader && <Header />}
        <main className="flex-1">{children}</main>
        {showFooter && <Footer />}
      </div>
    </div>
  )
}

export default Layout
