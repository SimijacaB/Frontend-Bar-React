import type { FC, ReactNode } from 'react'
import { Layout } from '../../components/layout'

interface AdminLayoutProps {
  children: ReactNode
}

const ADMIN_SIDEBAR_LINKS = [
  { label: 'Dashboard', href: '/admin', icon: '📊' },
  { label: 'Menú', href: '/admin/menu', icon: '🍽️' },
  { label: 'Ingredientes', href: '/admin/ingredients', icon: '🧪' },
  { label: 'Productos', href: '/admin/products', icon: '📦' },
  { label: 'Inventario', href: '/admin/inventory', icon: '📦' },
  { label: 'Pedidos', href: '/admin/orders', icon: '🛒' },
  { label: 'Mesas', href: '/admin/tables', icon: '🪑' },
  { label: 'Asignación', href: '/admin/assignment', icon: '👨‍💼' },
  { label: 'QR', href: '/admin/qr', icon: '📱' },
]

const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  return (
    <Layout
      showFooter={false}
      showSidebar={true}
      sidebarLinks={ADMIN_SIDEBAR_LINKS}
    >
      {children}
    </Layout>
  )
}

export default AdminLayout
