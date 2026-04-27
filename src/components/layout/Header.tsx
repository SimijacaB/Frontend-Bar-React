import { useState } from 'react'
import type { FC } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { Menu, X, ShoppingCart, User, LogOut, LayoutDashboard, UtensilsCrossed, ClipboardList, Package, QrCode, Users, TableProperties, Bell } from 'lucide-react'
import { useCart } from '../../features/products/context/CartContext'
import { useAuth } from '../../features/auth/context/AuthContext'
import NotificationPanel from '../../features/websocket/components/NotificationPanel'
import { useWebSocket } from '../../features/websocket/context/WebSocketContext'
import beerIcon from '../../assets/icons/Beer Icon 48.png'

const Header: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { itemCount } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const { notifications } = useWebSocket()

  // Check if user is admin (has ADMIN role)
  const isAdmin = user?.roles?.includes('ADMIN') ?? false
  // Check if user is only waiter (has WAITER role but not ADMIN)
  const isWaiterOnly = user?.roles?.includes('WAITER') && !isAdmin

  interface NavLink {
    href: string
    label: string
    icon?: LucideIcon
  }

  // Public navigation links
  const publicNavLinks: NavLink[] = [
    { href: '/', label: 'Inicio' },
    { href: '/carta', label: 'Carta' },
  ]

  // Waiter navigation links - only their orders panel
  const waiterNavLinks: NavLink[] = [
    { href: '/meseros', label: 'Mis Pedidos', icon: ClipboardList },
  ]

  // Admin navigation links - shown when authenticated as admin
  const adminNavLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/menu', label: 'Menú', icon: UtensilsCrossed },
    { href: '/orders', label: 'Pedidos', icon: ClipboardList },
    { href: '/admin/inventario', label: 'Inventario', icon: Package },
    { href: '/admin/mesas', label: 'Mesas', icon: TableProperties },
    { href: '/admin/asignacion', label: 'Asignación', icon: Users },
    { href: '/admin/qr', label: 'QR', icon: QrCode },
  ]

  // Determine which links to show based on authentication and role
  const getNavLinks = () => {
    if (!isAuthenticated) return publicNavLinks
    if (isWaiterOnly) return waiterNavLinks
    return adminNavLinks
  }

  const navLinks = getNavLinks()

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-shadow">
              <img src={beerIcon} alt="Project Bar" className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-white text-lg leading-tight">Project Bar</h1>
              <p className="text-xs text-slate-400">Bar & Cocktails</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Cart Button - Hide for waiters and admins */}
            {!isAuthenticated && (
              <Link
                to="/cart"
                className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <ShoppingCart className="w-5 h-5 md:w-6 md:h-6" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <button
                  onClick={() => setIsNotificationPanelOpen(true)}
                  className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {notifications.length > 9 ? '9+' : notifications.length}
                    </span>
                  )}
                </button>
                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-slate-300 text-sm">Hola, {user?.username}</span>
                  <button
                    onClick={() => {
                      logout()
                      navigate('/login')
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Salir</span>
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Ingresar</span>
              </Link>
            )}

            {/* Reserve Button - Only show when not authenticated */}
            {!isAuthenticated && (
              <Link
                to="/reservations"
                className="hidden lg:inline-flex px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium text-sm hover:from-emerald-600 hover:to-cyan-600 transition-all shadow-lg shadow-emerald-500/25"
              >
                Reservar
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="lg:hidden py-4 border-t border-slate-800">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive(link.href)
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {IconComponent && <IconComponent className="w-5 h-5" />}
                    {link.label}
                  </Link>
                )
              })}
              <hr className="my-2 border-slate-800" />
              {isAuthenticated ? (
                <div className="px-4 py-3">
                  <span className="text-slate-300 text-sm">Hola, {user?.username}</span>
                  <button
                    onClick={() => {
                      logout()
                      navigate('/login')
                      setIsMenuOpen(false)
                    }}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mt-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Salir
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <User className="w-4 h-4" />
                  Ingresar
                </Link>
              )}
              {!isAuthenticated && (
                <Link
                  to="/reservations"
                  onClick={() => setIsMenuOpen(false)}
                  className="mx-4 mt-2 px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-medium text-sm text-center"
                >
                  Reservar Mesa
                </Link>
              )}
            </div>
          </nav>
        )}
      </div>
      
      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={isNotificationPanelOpen} 
        onClose={() => setIsNotificationPanelOpen(false)} 
      />
    </header>
  )
}

export default Header
