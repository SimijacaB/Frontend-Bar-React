import type { FC } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Layout
import { Layout } from './components/layout'

// Contexts
import { CartProvider } from './features/products/context/CartContext'
import { AuthProvider } from './features/auth/context/AuthContext'

// Pages - Admin/Internal
import Landing from './pages/landing/Landing'
import MenuPage from './pages/menu/Menu'
import OrdersPage from './pages/orders/Orders'
import CartPage from './pages/cart/Cart'
import { QRGenerator } from './pages/admin'
import OrderAssignment from './pages/admin/OrderAssignment'

// Pages - Auth
import { LoginPage, ProtectedRoute } from './features/auth/components'

// Pages - Public (for customers via QR)
import { PublicMenu, PublicLanding } from './pages/public'
import CustomerMenu from './pages/public/CustomerMenu'
import OrderConfirmationPage from './pages/public/OrderConfirmation'

// Pages - Waiter Panel
import WaiterPanel from './pages/waiter/WaiterPanel'

// Styles
import './index.css'

const App: FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#1e293b',
                color: '#f1f5f9',
                border: '1px solid #334155',
                borderRadius: '12px',
                padding: '12px 16px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f1f5f9',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f1f5f9',
                },
              },
            }}
          />
          
          <Routes>
            {/* ============================================ */}
            {/* PUBLIC ROUTES - For customers via QR        */}
            {/* ============================================ */}
            <Route path="/" element={<PublicLanding />} />
            <Route path="/carta" element={<PublicMenu />} />
            <Route path="/mesa/:mesa" element={<PublicMenu />} />
            <Route path="/pedido-confirmado/:mesa" element={<OrderConfirmationPage />} />
            
            {/* ============================================ */}
            {/* WAITER/STAFF ROUTES                         */}
            {/* ============================================ */}
            <Route path="/meseros" element={<WaiterPanel />} />
            <Route path="/tomar-pedido" element={<CustomerMenu />} />
            
            {/* ============================================ */}
            {/* INTERNAL/ADMIN ROUTES                       */}
            {/* ============================================ */}
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
              path="/admin/asignacion"
              element={
                <ProtectedRoute>
                  <Layout showFooter={false}>
                    <OrderAssignment />
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
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
