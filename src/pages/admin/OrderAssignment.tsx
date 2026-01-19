import { useState, useEffect, type FC } from 'react'
import { 
  UserPlus,
  Clock,
  MapPin,
  User,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Users
} from 'lucide-react'
import toast from 'react-hot-toast'
import { orderService } from '../../features/orders/api/orderService'
import { waiterService, type WaiterWithOrdersDto } from '../../features/orders/api/waiterService'
import type { OrderDto } from '../../types'

const OrderAssignment: FC = () => {
  const [unassignedOrders, setUnassignedOrders] = useState<OrderDto[]>([])
  const [waiters, setWaiters] = useState<WaiterWithOrdersDto[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingWaiters, setLoadingWaiters] = useState(true)
  const [assigning, setAssigning] = useState<number | null>(null)
  const [selectedWaiter, setSelectedWaiter] = useState<Record<number, string>>({})

  // Fetch unassigned orders (CREATED status)
  const fetchUnassignedOrders = async () => {
    setLoading(true)
    try {
      const data = await orderService.getUnassignedOrders()
      // Sort by date, oldest first (FIFO)
      const sorted = data.sort((a, b) => 
        new Date(a.date || a.orderDate || 0).getTime() - new Date(b.date || b.orderDate || 0).getTime()
      )
      setUnassignedOrders(sorted)
    } catch (err) {
      console.error('Error fetching unassigned orders:', err)
      toast.error('Error al cargar órdenes sin asignar')
    } finally {
      setLoading(false)
    }
  }

  // Fetch waiters from backend
  const fetchWaiters = async () => {
    setLoadingWaiters(true)
    try {
      const data = await waiterService.getWaitersWithOrders()
      setWaiters(data)
    } catch (err) {
      console.error('Error fetching waiters:', err)
      toast.error('Error al cargar meseros')
    } finally {
      setLoadingWaiters(false)
    }
  }

  useEffect(() => {
    fetchUnassignedOrders()
    fetchWaiters()
  }, [])

  // Auto-refresh solo cuando hay órdenes sin asignar
  useEffect(() => {
    if (unassignedOrders.length > 0) {
      const interval = setInterval(fetchUnassignedOrders, 15000)
      return () => clearInterval(interval)
    }
  }, [unassignedOrders.length])

  // Assign waiter to order
  const handleAssignWaiter = async (orderId: number) => {
    const waiterUsername = selectedWaiter[orderId]
    if (!waiterUsername) {
      toast.error('Selecciona un mesero')
      return
    }

    setAssigning(orderId)
    try {
      await orderService.assignWaiter(orderId, waiterUsername)
      toast.success('Mesero asignado correctamente')
      // Remove from list
      setUnassignedOrders(prev => prev.filter(o => o.id !== orderId))
      // Clear selection
      setSelectedWaiter(prev => {
        const updated = { ...prev }
        delete updated[orderId]
        return updated
      })
    } catch (err) {
      console.error('Error assigning waiter:', err)
      toast.error('Error al asignar mesero')
    } finally {
      setAssigning(null)
    }
  }

  const formatTime = (date: string | undefined) => {
    if (!date) return '--:--'
    return new Date(date).toLocaleTimeString('es-CO', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatPrice = (price: number | undefined) => {
    if (!price) return '$0'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const getTimeSinceCreation = (date: string | undefined) => {
    if (!date) return ''
    const created = new Date(date)
    const now = new Date()
    const diffMs = now.getTime() - created.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`
    const diffHours = Math.floor(diffMins / 60)
    return `Hace ${diffHours}h ${diffMins % 60}m`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando órdenes...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Asignación de Pedidos</h1>
                <p className="text-sm text-slate-400">Pedidos de clientes QR sin mesero</p>
              </div>
            </div>
            <button
              onClick={fetchUnassignedOrders}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400"
              title="Actualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Stats */}
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-purple-400" />
                <div>
                  <p className="text-2xl font-bold text-purple-400">{unassignedOrders.length}</p>
                  <p className="text-xs text-purple-300">Pedidos sin asignar</p>
                </div>
              </div>
              {unassignedOrders.length > 0 && (
                <span className="px-3 py-1 bg-purple-500/30 rounded-full text-xs text-purple-300">
                  Requieren atención
                </span>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Orders List */}
      <main className="p-4">
        {unassignedOrders.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-emerald-500/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">¡Todo al día!</h3>
            <p className="text-slate-400">No hay pedidos pendientes de asignación</p>
          </div>
        ) : (
          <div className="space-y-4">
            {unassignedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4"
              >
                {/* Order Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg font-bold text-white">
                        Pedido #{order.id}
                      </span>
                      <span className="px-2 py-0.5 bg-purple-500/30 rounded-full text-xs text-purple-300">
                        QR Cliente
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Mesa {order.tableNumber || '?'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {order.clientName || order.customerName || 'Sin nombre'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatTime(order.date || order.orderDate)}
                      </span>
                    </div>
                  </div>
                  <span className="text-amber-400 text-xs font-medium">
                    {getTimeSinceCreation(order.date || order.orderDate)}
                  </span>
                </div>

                {/* Order Notes */}
                {order.notes && (
                  <div className="bg-slate-900/50 rounded-lg p-2 mb-3">
                    <p className="text-amber-400 text-sm">📝 {order.notes}</p>
                  </div>
                )}

                {/* Order Total */}
                <div className="flex items-center justify-between mb-4 py-2 border-t border-purple-500/20">
                  <span className="text-slate-400">Total del pedido</span>
                  <span className="text-emerald-400 font-bold text-lg">
                    {formatPrice(order.valueToPay || order.total)}
                  </span>
                </div>

                {/* Waiter Selection */}
                <div className="bg-slate-900/50 rounded-xl p-3">
                  <label className="flex items-center gap-2 text-sm text-slate-400 mb-2">
                    <Users className="w-4 h-4" />
                    Asignar mesero
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={selectedWaiter[order.id] || ''}
                      onChange={(e) => setSelectedWaiter(prev => ({
                        ...prev,
                        [order.id]: e.target.value
                      }))}
                      className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={loadingWaiters}
                    >
                      <option value="">
                        {loadingWaiters ? 'Cargando meseros...' : 'Seleccionar mesero...'}
                      </option>
                      {waiters
                        .filter(waiter => waiter.active) // Solo mostrar meseros activos
                        .map(waiter => (
                          <option key={waiter.username} value={waiter.username}>
                            {waiter.username} ({waiter.activeOrdersCount} órdenes activas)
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => handleAssignWaiter(order.id)}
                      disabled={assigning === order.id || !selectedWaiter[order.id]}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium flex items-center gap-2"
                    >
                      {assigning === order.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      Asignar
                    </button>
                  </div>
                  {waiters.filter(w => w.active).length === 0 && !loadingWaiters && (
                    <p className="text-amber-400 text-xs mt-2">
                      ⚠️ No hay meseros activos registrados
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default OrderAssignment
