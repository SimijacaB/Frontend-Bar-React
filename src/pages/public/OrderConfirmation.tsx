import { useState, useEffect, type FC } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle, Clock, ArrowLeft, ChefHat, Package, RefreshCw, X } from 'lucide-react'
import { orderService } from '../../features/orders/api/orderService'
import type { OrderDto } from '../../types'
import { OrderStatus } from '../../types'

const OrderConfirmationPage: FC = () => {
  const { mesa } = useParams<{ mesa: string }>()
  const tableNumber = mesa ? parseInt(mesa, 10) : 0
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch orders for this table
  const fetchOrders = async () => {
    if (!tableNumber) return
    setLoading(true)
    try {
      const data = await orderService.getByTableNumber(tableNumber)
      // Sort by date (most recent first) and filter active orders
      const sortedOrders = data
        .filter(o => 
          o.status !== OrderStatus.DELIVERED && 
          o.status !== OrderStatus.CANCELLED
        )
        .sort((a, b) => {
          const dateA = new Date(a.date || a.orderDate || 0).getTime()
          const dateB = new Date(b.date || b.orderDate || 0).getTime()
          return dateB - dateA
        })
      setOrders(sortedOrders)
    } catch (err) {
      console.error('Error loading orders:', err)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchOrders, 30000)
    return () => clearInterval(interval)
  }, [tableNumber])

  const getStatusInfo = (status: string) => {
    switch (status) {
      case OrderStatus.PENDING:
        return { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', Icon: Clock }
      case OrderStatus.IN_PROGRESS:
        return { label: 'Preparando', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', Icon: ChefHat }
      case OrderStatus.READY:
        return { label: '¡Listo!', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', Icon: CheckCircle }
      default:
        return { label: 'Pendiente', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', Icon: Clock }
    }
  }

  const formatPrice = (price: number | undefined) => {
    if (!price) return '$0'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '--:--'
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-md mx-auto pt-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ¡Pedido Confirmado!
          </h1>
          <p className="text-slate-400">
            Tu pedido ha sido recibido
          </p>
          <div className="inline-block bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-full mt-3">
            Mesa {tableNumber}
          </div>
        </div>

        {/* Orders Status */}
        <div className="bg-slate-800/50 rounded-2xl p-4 mb-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-400" />
              Mis Pedidos
            </h2>
            <button 
              onClick={fetchOrders}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-6">
              <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-slate-400 text-sm">Cargando...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No hay pedidos activos</p>
              <p className="text-slate-500 text-sm mt-1">Haz un nuevo pedido desde el menú</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => {
                const { label, color, bg, border, Icon } = getStatusInfo(order.status as string)
                const orderTotal = order.valueToPay || order.total || 0
                const orderProducts = order.products || []
                
                return (
                  <div key={order.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
                    {/* Order Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-white font-semibold">{order.clientName || order.customerName}</p>
                        <p className="text-slate-500 text-xs">
                          Orden #{order.id} • {formatTime(order.date || order.orderDate)}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg} border ${border}`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                        <span className={`text-xs font-medium ${color}`}>{label}</span>
                      </div>
                    </div>

                    {/* Notes if any */}
                    {order.notes && (
                      <div className="bg-amber-500/10 rounded-lg px-3 py-2 mb-3 border border-amber-500/20">
                        <p className="text-amber-400 text-xs">
                          <span className="font-medium">Nota:</span> {order.notes}
                        </p>
                      </div>
                    )}

                    {/* Products List */}
                    {orderProducts.length > 0 && (
                      <div className="mb-3 space-y-2">
                        {orderProducts.map((item, idx) => (
                          <div 
                            key={`${order.id}-${item.productId}-${idx}`}
                            className="flex items-center justify-between bg-slate-800/50 rounded-lg px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 text-sm font-medium">
                                {item.quantity}x
                              </span>
                              <span className="text-white text-sm">
                                {item.productName || `Producto #${item.productId}`}
                              </span>
                            </div>
                            {item.price && (
                              <span className="text-slate-400 text-sm">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Order Total */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                      <span className="text-slate-400 font-medium">Total</span>
                      <span className="text-emerald-400 font-bold text-lg">
                        {formatPrice(orderTotal)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* What's Next */}
        <div className="bg-emerald-500/10 rounded-2xl p-4 mb-6 border border-emerald-500/20">
          <h3 className="text-emerald-400 font-medium mb-3">¿Qué sigue?</h3>
          <ul className="text-slate-300 text-sm space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">1.</span>
              Nuestro bartender preparará tu pedido
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">2.</span>
              Un mesero te lo llevará a tu mesa
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">3.</span>
              Pagas directamente con el mesero
            </li>
          </ul>
        </div>

        {/* Back to Menu */}
        <div className="text-center">
          <Link
            to={`/pedido/${tableNumber}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Hacer otro pedido
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OrderConfirmationPage
