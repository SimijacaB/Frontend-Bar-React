import { useState, useEffect, type FC } from 'react'
import { 
  Bell,
  Clock,
  CheckCircle,
  XCircle,
  ChefHat,
  Truck,
  User,
  MapPin,
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react'
import toast from 'react-hot-toast'
import { orderService } from '../../features/orders/api/orderService'
import type { OrderDto } from '../../types'

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock; bgColor: string }> = {
  PENDING: { 
    label: 'Pendiente', 
    color: 'text-amber-400', 
    icon: Clock,
    bgColor: 'bg-amber-500/20 border-amber-500/30'
  },
  IN_PROGRESS: { 
    label: 'En Preparación', 
    color: 'text-blue-400', 
    icon: ChefHat,
    bgColor: 'bg-blue-500/20 border-blue-500/30'
  },
  READY: { 
    label: 'Listo', 
    color: 'text-emerald-400', 
    icon: CheckCircle,
    bgColor: 'bg-emerald-500/20 border-emerald-500/30'
  },
  DELIVERED: { 
    label: 'Entregado', 
    color: 'text-slate-400', 
    icon: Truck,
    bgColor: 'bg-slate-500/20 border-slate-500/30'
  },
  CANCELLED: { 
    label: 'Cancelado', 
    color: 'text-red-400', 
    icon: XCircle,
    bgColor: 'bg-red-500/20 border-red-500/30'
  },
}

const WaiterPanel: FC = () => {
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL')
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [lastOrderCount, setLastOrderCount] = useState(0)

  // Fetch orders
  const fetchOrders = async () => {
    try {
      const data = await orderService.getAllOrders()
      // Sort by date, newest first
      const sorted = data.sort((a, b) => 
        new Date(b.orderDate || 0).getTime() - new Date(a.orderDate || 0).getTime()
      )
      
      // Check for new orders and play sound
      const pendingCount = sorted.filter(o => o.status === 'PENDING').length
      if (pendingCount > lastOrderCount && lastOrderCount > 0 && soundEnabled) {
        playNotificationSound()
        toast('🔔 ¡Nuevo pedido!', {
          icon: '🆕',
          duration: 5000,
        })
      }
      setLastOrderCount(pendingCount)
      
      setOrders(sorted)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3
      
      oscillator.start()
      setTimeout(() => {
        oscillator.frequency.value = 1000
        setTimeout(() => oscillator.stop(), 150)
      }, 150)
    } catch (e) {
      console.log('Could not play sound:', e)
    }
  }

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchOrders()
    const interval = setInterval(fetchOrders, 10000)
    return () => clearInterval(interval)
  }, [soundEnabled])

  // Update order status
  const updateStatus = async (orderId: number, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(orderId, newStatus)
      toast.success(`Pedido actualizado a ${statusConfig[newStatus]?.label}`)
      fetchOrders()
    } catch (err) {
      console.error('Error updating order:', err)
      toast.error('Error al actualizar el pedido')
    }
  }

  // Filter orders
  const filteredOrders = orders.filter(order => {
    if (selectedStatus === 'ALL') return true
    if (selectedStatus === 'ACTIVE') return ['PENDING', 'IN_PROGRESS', 'READY'].includes(order.status)
    return order.status === selectedStatus
  })

  // Count by status
  const pendingCount = orders.filter(o => o.status === 'PENDING').length
  const inProgressCount = orders.filter(o => o.status === 'IN_PROGRESS').length
  const readyCount = orders.filter(o => o.status === 'READY').length

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
    }).format(price)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando pedidos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Panel de Pedidos</h1>
                <p className="text-sm text-slate-400">Meseros & Admin</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg ${soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}
                title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              <button
                onClick={fetchOrders}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400"
                title="Actualizar"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-amber-500/20 border border-amber-500/30 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-amber-400">{pendingCount}</p>
              <p className="text-xs text-amber-300">Pendientes</p>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-blue-400">{inProgressCount}</p>
              <p className="text-xs text-blue-300">En Preparación</p>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-emerald-400">{readyCount}</p>
              <p className="text-xs text-emerald-300">Listos</p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { key: 'ALL', label: 'Todos' },
              { key: 'ACTIVE', label: 'Activos' },
              { key: 'PENDING', label: 'Pendientes' },
              { key: 'READY', label: 'Listos' },
              { key: 'DELIVERED', label: 'Entregados' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setSelectedStatus(tab.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedStatus === tab.key
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Orders List */}
      <main className="p-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay pedidos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.PENDING
              const StatusIcon = status.icon

              return (
                <div
                  key={order.id}
                  className={`rounded-2xl border p-4 ${status.bgColor}`}
                >
                  {/* Order Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-white">
                          Pedido #{order.id}
                        </span>
                        <span className={`flex items-center gap-1 text-sm ${status.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          Mesa {order.tableNumber || '?'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {order.customerName || 'Sin nombre'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(order.orderDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div className="bg-slate-900/50 rounded-xl p-3 mb-3">
                    {order.products && order.products.length > 0 ? (
                      <ul className="space-y-2">
                        {order.products.map((item, idx) => (
                          <li key={idx} className="flex justify-between text-sm">
                            <span className="text-slate-300">
                              {item.quantity}x {item.productName || `Producto ${item.productId}`}
                            </span>
                            <span className="text-slate-400">
                              {formatPrice((item.price || 0) * item.quantity)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-slate-500 text-sm">Sin productos</p>
                    )}
                    <div className="flex justify-between mt-3 pt-3 border-t border-slate-700">
                      <span className="text-slate-300 font-medium">Total</span>
                      <span className="text-emerald-400 font-bold">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateStatus(order.id, 'IN_PROGRESS')}
                          className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                        >
                          <ChefHat className="w-4 h-4" />
                          Preparar
                        </button>
                        <button
                          onClick={() => updateStatus(order.id, 'CANCELLED')}
                          className="py-2 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    {order.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => updateStatus(order.id, 'READY')}
                        className="flex-1 py-2 px-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Marcar Listo
                      </button>
                    )}
                    {order.status === 'READY' && (
                      <button
                        onClick={() => updateStatus(order.id, 'DELIVERED')}
                        className="flex-1 py-2 px-4 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Truck className="w-4 h-4" />
                        Marcar Entregado
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

export default WaiterPanel
