import { useState } from 'react'
import type { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Menu, X } from 'lucide-react'
import './sidebar.css'

interface NavLink {
  label: string
  href: string
  icon?: LucideIcon
}

interface SidebarProps {
  links: NavLink[]
  title?: string
  onLogout?: () => void
}

const Sidebar: FC<SidebarProps> = ({ links, title = 'Project Bar', onLogout }) => {
  const [isOpen, setIsOpen] = useState(true)
  const location = useLocation()

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

  const isActive = (path: string) => location.pathname === path

  return (
    <>
      {/* Botón toggle para mobile */}
      <button 
        className="sidebar-toggle" 
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay para mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar} />}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h2>{title}</h2>
          <button 
            className="sidebar-close-btn"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <ul>
            {links.map((link) => {
              const Icon = link.icon
              const active = isActive(link.href)
              return (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={`nav-link ${active ? 'active' : ''}`}
                  >
                    {Icon && <span className="nav-icon"><Icon className="w-5 h-5" /></span>}
                    <span className="nav-label">{link.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {onLogout && (
          <div className="sidebar-footer">
            <button onClick={onLogout} className="logout-btn">
              <span className="nav-icon"><X className="w-5 h-5" /></span>
              <span className="nav-label">Logout</span>
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

export default Sidebar
