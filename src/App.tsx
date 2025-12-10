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

// Pages - Auth
import { LoginPage } from './features/auth/components'

// Pages - Public (for customers via QR)
import { PublicMenu } from './pages/public'
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
            <Route path="/carta" element={<PublicMenu />} />
            <Route path="/pedido/:mesa" element={<CustomerMenu />} />
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
              path="/"
              element={
                <Layout>
                  <Landing />
                </Layout>
              }
            />
            <Route
              path="/menu"
              element={
                <Layout>
                  <MenuPage />
                </Layout>
              }
            />
            <Route
              path="/cart"
              element={
                <Layout>
                  <CartPage />
                </Layout>
              }
            />
            <Route
              path="/orders"
              element={
                <Layout showFooter={false}>
                  <OrdersPage />
                </Layout>
              }
            />
            <Route
              path="/admin/qr"
              element={
                <Layout>
                  <QRGenerator />
                </Layout>
              }
            />
            
            {/* Placeholder routes */}
            <Route
              path="/about"
              element={
                <Layout>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-3xl font-bold text-white mb-4">Sobre Nosotros</h1>
                      <p className="text-slate-400">Página en construcción</p>
                    </div>
                  </div>
                </Layout>
              }
            />
            <Route
              path="/reservations"
              element={
                <Layout>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-3xl font-bold text-white mb-4">Reservaciones</h1>
                      <p className="text-slate-400">Página en construcción</p>
                    </div>
                  </div>
                </Layout>
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
                <Layout>
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-6xl font-bold text-emerald-400 mb-4">404</h1>
                      <p className="text-xl text-white mb-2">Página no encontrada</p>
                      <p className="text-slate-400">La página que buscas no existe</p>
                    </div>
                  </div>
                </Layout>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
