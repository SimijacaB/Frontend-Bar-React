import type { FC, ReactNode } from 'react'

interface AdminLayoutProps {
  children: ReactNode
}

const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  return <>{children}</>
}

export default AdminLayout
