import { useState } from 'react'
import type { FC } from 'react'
import './sidebar.css'
import { Menu, X } from 'lucide-react'

interface NavLink {
  label: string
  href: string
  icon?: string
}

interface SidebarProps {
  links: NavLink[]
  title?: string
}

const Sidebar: FC<SidebarProps> = ({ links, title = 'Project Bar' }) => {
  const [isOpen, setIsOpen] = useState(true)

  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }

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
            {links.map((link, index) => (
              <li key={index}>
                <a href={link.href} className="nav-link">
                  {link.icon && <span className="nav-icon">{link.icon}</span>}
                  <span className="nav-label">{link.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
