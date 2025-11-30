import { useState, useEffect, type FC } from 'react'
import { 
  Users, 
  Clock, 
  ChefHat, 
  DollarSign, 
  Eye,
  Plus,
  RefreshCw,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, OrderStatusBadge, LoadingState } from '../../components/ui'
import Button from '../../components/ui/Button'
import { orderService } from '../../features/orders/api/orderService'
import type { OrderDto } from '../../types'
import { OrderStatus } from '../../types'
import toast from 'react-hot-toast'

// Mock tables data - would come from backend
const tables = [
  { id: 1, number: 1, seats: 4, status: 'available' },
  { id: 2, number: 2, seats: 2, status: 'occupied' },
  { id: 3, number: 3, seats: 6, status: 'occupied' },
  { id: 4, number: 4, seats: 4, status: 'reserved' },
  { id: 5, number: 5, seats: 8, status: 'available' },
  { id: 6, number: 6, seats: 4, status: 'occupied' },
]

const tableStatusConfig = {
  available: { label: 'Disponible', color: 'bg-emerald-500' },
  occupied: { label: 'Ocupada', color: 'bg-amber-500' },
  reserved: { label: 'Reservada', color: 'bg-cyan-500' },
}

// Fallback orders for demo
const fallbackOrders: OrderDto[] = [
  { id: 1, clientName: 'Juan García', tableNumber: 2, waiterUserName: 'Mario', notes: '', status: OrderStatus.IN_PROGRESS, date: new Date().toISOString(), valueToPay: 32.50 },
  { id: 2, clientName: 'Ana Martínez', tableNumber: 3, waiterUserName: 'Mario', notes: 'Sin hielo', status: OrderStatus.READY, date: new Date().toISOString(), valueToPay: 18.00 },
  { id: 3, clientName: 'Pedro López', tableNumber: 6, waiterUserName: 'Carlos', notes: '', status: OrderStatus.PENDING, date: new Date().toISOString(), valueToPay: 45.00 },
]

const OrdersPage: FC = () => {
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null)

  // Fetch orders
  const fetchOrders = async () => {
    setIsLoading(true)
    try {
      const data = await orderService.getAll()
      setOrders(data)
    } catch (error) {
      console.error('Error fetching orders:', error)
      // Use fallback data
      setOrders(fallbackOrders)
      toast.error('Usando datos de demostración')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesTable = !selectedTable || order.tableNumber === selectedTable
    const matchesStatus = !statusFilter || order.status === statusFilter
    return matchesTable && matchesStatus
  })

  // Get orders count by status
  const ordersByStatus = {
    pending: orders.filter(o => o.status === OrderStatus.PENDING).length,
    inProgress: orders.filter(o => o.status === OrderStatus.IN_PROGRESS).length,
    ready: orders.filter(o => o.status === OrderStatus.READY).length,
  }

  // Change order status
  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      await orderService.changeStatus(orderId, newStatus)
      toast.success('Estado actualizado')
      fetchOrders()
    } catch (error) {
      // Demo mode - update locally
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
      toast.success('Estado actualizado (demo)')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Panel de Pedidos
              </h1>
              <p className="text-slate-400">Gestiona las órdenes y mesas del bar</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                leftIcon={<RefreshCw className="w-4 h-4" />}
                onClick={fetchOrders}
              >
                Actualizar
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Nueva Orden
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Pendientes</p>
                  <p className="text-2xl font-bold text-white">{ordersByStatus.pending}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">En Preparación</p>
                  <p className="text-2xl font-bold text-white">{ordersByStatus.inProgress}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Listos</p>
                  <p className="text-2xl font-bold text-white">{ordersByStatus.ready}</p>
                </div>
              </div>
            </Card>
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Ventas</p>
                  <p className="text-2xl font-bold text-white">
                    ${orders.reduce((sum, o) => sum + (o.valueToPay || 0), 0).toFixed(2)}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tables Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Mesas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                    {tables.map((table) => {
                      const config = tableStatusConfig[table.status as keyof typeof tableStatusConfig]
                      const isSelected = selectedTable === table.number
                      const tableOrders = orders.filter(o => o.tableNumber === table.number)

                      return (
                        <button
                          key={table.id}
                          onClick={() => setSelectedTable(isSelected ? null : table.number)}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            isSelected
                              ? 'border-emerald-500 bg-emerald-500/10'
                              : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-bold text-white">Mesa {table.number}</span>
                            <span className={`w-2 h-2 rounded-full ${config.color}`} />
                          </div>
                          <p className="text-slate-400 text-sm">{table.seats} asientos</p>
                          <p className="text-xs text-slate-500 mt-1">{config.label}</p>
                          {tableOrders.length > 0 && (
                            <Badge variant="info" className="mt-2">
                              {tableOrders.length} orden{tableOrders.length > 1 ? 'es' : ''}
                            </Badge>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Orders Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-emerald-400" />
                      Órdenes Activas
                      {selectedTable && (
                        <Badge variant="info">Mesa {selectedTable}</Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => setStatusFilter(null)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          !statusFilter
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-400 hover:text-white'
                        }`}
                      >
                        Todos
                      </button>
                      {[OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.READY].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            statusFilter === status
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {status === OrderStatus.PENDING && 'Pendiente'}
                          {status === OrderStatus.IN_PROGRESS && 'En Prep.'}
                          {status === OrderStatus.READY && 'Listo'}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <LoadingState message="Cargando órdenes..." />
                  ) : filteredOrders.length === 0 ? (
                    <div className="text-center py-12">
                      <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                      <p className="text-slate-400">No hay órdenes que mostrar</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order) => (
                        <div
                          key={order.id}
                          className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-4">
                              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center text-white font-bold">
                                {order.tableNumber}
                              </div>
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="text-white font-semibold">{order.clientName}</h4>
                                  <OrderStatusBadge status={order.status} />
                                </div>
                                <p className="text-slate-400 text-sm">
                                  Mesero: {order.waiterUserName} • Orden #{order.id}
                                </p>
                                {order.notes && (
                                  <p className="text-amber-400 text-xs mt-1">Nota: {order.notes}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-xl font-bold text-emerald-400">
                                  ${(order.valueToPay || 0).toFixed(2)}
                                </p>
                                <p className="text-slate-500 text-xs">
                                  {order.date ? new Date(order.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button size="sm" variant="ghost" leftIcon={<Eye className="w-4 h-4" />}>
                                  Ver
                                </Button>
                                {order.status === OrderStatus.PENDING && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(order.id, OrderStatus.IN_PROGRESS)}
                                  >
                                    Preparar
                                  </Button>
                                )}
                                {order.status === OrderStatus.IN_PROGRESS && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleStatusChange(order.id, OrderStatus.READY)}
                                  >
                                    Listo
                                  </Button>
                                )}
                                {order.status === OrderStatus.READY && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => handleStatusChange(order.id, OrderStatus.DELIVERED)}
                                  >
                                    Entregar
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default OrdersPage
