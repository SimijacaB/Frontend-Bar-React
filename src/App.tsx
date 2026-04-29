import type { FC } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Layout
import { Layout } from './components/layout'

// Contexts
import { CartProvider } from './features/products/context/CartContext'
import { AuthProvider, useAuth } from './features/auth/context/AuthContext'
import { WebSocketProvider } from './features/websocket/context/WebSocketContext'
import { NotificationListener, NotificationToaster } from './features/websocket/components/NotificationListener'

// Pages - Admin/Internal
import Landing from './pages/landing/Landing'
import MenuPage from './pages/menu/Menu'
import OrdersPage from './pages/orders/Orders'
import CartPage from './pages/cart/Cart'
import { QRGenerator, TableManagement, StatisticsPage, AdminDashboard } from './pages/admin'
import OrderAssignment from './pages/admin/OrderAssignment'
import InventoryPanel from './pages/admin/InventoryPanel'

// Pages - Auth
import { LoginPage, ProtectedRoute } from './features/auth/components'

// Pages - Public (for customers via QR)
import { PublicMenu, PublicLanding } from './pages/public'
import CustomerMenu from './pages/public/CustomerMenu'
import OrderConfirmationPage from './pages/public/OrderConfirmation'

// Styles
import './index.css'

// Home route handler - redirects authenticated users to their appropriate dashboard
const HomeRoute: FC = () => {
  const { isAuthenticated, user, isLoading } = useAuth()
  
  // Show nothing while loading auth state
  if (isLoading) {
    return null
  }
  
  // If authenticated, redirect to appropriate dashboard
  if (isAuthenticated) {
    const isAdmin = user?.roles?.includes('ADMIN')
    const isWaiter = user?.roles?.includes('WAITER')
    
    if (isAdmin) {
      return <Navigate to="/dashboard" replace />
    } else if (isWaiter) {
      return <Navigate to="/meseros" replace />
    }
    // Default to dashboard for other roles
    return <Navigate to="/dashboard" replace />
  }
  
  // Not authenticated - show public landing
  return <PublicLanding />
}

const App: FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <WebSocketProvider>
          <CartProvider>
            {/* Toast Notifications */}
            <NotificationToaster />
            <NotificationListener />
            
            <Routes>
            {/* ============================================ */}
            {/* PUBLIC ROUTES - For customers via QR        */}
            {/* ============================================ */}
            <Route path="/" element={<HomeRoute />} />
            <Route path="/carta" element={<PublicMenu />} />
            <Route path="/mesa/:mesa" element={<PublicMenu />} />
            <Route path="/pedido-confirmado/:mesa" element={<OrderConfirmationPage />} />
            
            {/* ============================================ */}
            {/* WAITER/STAFF ROUTES                         */}
            {/* ============================================ */}
            <Route
              path="/meseros"
              element={
                <ProtectedRoute>
                  <Layout showFooter={false}>
                    <OrdersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tomar-pedido"
              element={
                <ProtectedRoute>
                  <Layout showFooter={false}>
                    <CustomerMenu />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* ============================================ */}
            {/* INTERNAL/ADMIN ROUTES                       */}
            {/* ============================================ */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Layout showHeader={false} showFooter={false}>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Landing />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/menu"
              element={
                <ProtectedRoute>
                  <Layout>
                    <MenuPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CartPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Layout showFooter={false}>
                    <OrdersPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/qr"
              element={
                <ProtectedRoute>
                  <Layout>
                    <QRGenerator />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/estadisticas"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StatisticsPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/asignacion"
              element={
                <ProtectedRoute>
                  <Layout showFooter={false}>
                    <OrderAssignment />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/mesas"
              element={
                <ProtectedRoute>
                  <Layout showFooter={false}>
                    <TableManagement />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/inventario"
              element={
                <ProtectedRoute>
                  <Layout showFooter={false}>
                    <InventoryPanel />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Placeholder routes */}
            <Route
              path="/about"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-4">Sobre Nosotros</h1>
                        <p className="text-slate-400">Página en construcción</p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-3xl font-bold text-white mb-4">Reservaciones</h1>
                        <p className="text-slate-400">Página en construcción</p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/login"
              element={<LoginPage />}
            />
            
            {/* 404 Route */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <div className="min-h-screen flex items-center justify-center">
                      <div className="text-center">
                        <h1 className="text-6xl font-bold text-emerald-400 mb-4">404</h1>
                        <p className="text-xl text-white mb-2">Página no encontrada</p>
                        <p className="text-slate-400">La página que buscas no existe</p>
                      </div>
                    </div>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </CartProvider>
        </WebSocketProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
