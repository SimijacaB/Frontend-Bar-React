import { useState, useEffect, type FC } from 'react'
import { 
  Users, 
  Clock, 
  ChefHat, 
  DollarSign, 
  Eye,
  Plus,
  RefreshCw,
  Filter,
  Receipt,
  TrendingUp,
  AlertCircle,
  UserPlus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, OrderStatusBadge, LoadingState } from '../../components/ui'
import Button from '../../components/ui/Button'
import { orderService } from '../../features/orders/api/orderService'
import { useAuth } from '../../features/auth/context/AuthContext'
import { useOrdersFilter } from '../../features/orders/hooks/useOrdersFilter'
import { DateFilter, CreateOrderModal, AssignWaiterModal } from '../../features/orders/components'
import type { OrderDto, OrderDetailDto } from '../../types'
import { OrderStatus } from '../../types'
import toast from 'react-hot-toast'

import { tableService, type TableDto } from '../../features/tables/api/tableService'

const tableStatusConfig = {
  FREE: { label: 'Disponible', color: 'bg-emerald-500' },
  OCCUPIED: { label: 'Ocupada', color: 'bg-amber-500' },
  RESERVED: { label: 'Reservada', color: 'bg-cyan-500' },
}

// Fallback orders for demo

const OrdersPage: FC = () => {
  const { user } = useAuth()
  const [selectedTable, setSelectedTable] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | null>(null)
  const [activeTab, setActiveTab] = useState<'orders' | 'billing' | 'reports'>('orders')
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailDto | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isLoadingOrderDetails, setIsLoadingOrderDetails] = useState(false)
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false)
  const [isAssignWaiterModalOpen, setIsAssignWaiterModalOpen] = useState(false)
  const [orderToAssign, setOrderToAssign] = useState<OrderDto | null>(null)
  const [tables, setTables] = useState<TableDto[]>([])
  const [loadingTables, setLoadingTables] = useState(true)

  // Check if user is admin/staff (not a regular customer)
  const isStaff = user?.roles?.some(role => ['ADMIN', 'WAITER', 'BARTENDER', 'CHEF'].includes(role)) ?? false
  const userIsAdmin = user?.roles?.includes('ADMIN') ?? false
  
  // Hook para filtrado de órdenes basado en rol y fecha
  const {
    orders,
    isLoading,
    error,
    dateFilter,
    setFilterType,
    setSpecificDate,
    refresh: fetchOrders,
    isWaiter,
  } = useOrdersFilter({
    userRole: user?.roles || [],
    autoFetch: true,
    refreshInterval: 0, // Se maneja manualmente abajo
  })

  // Estados activos que requieren monitoreo
  const ACTIVE_STATUSES = ['CREATED', 'ASSIGNED', 'IN_PROGRESS', 'READY']
  
  // Auto-refresh solo cuando hay órdenes activas
  useEffect(() => {
    const hasActiveOrders = orders.some(order => 
      ACTIVE_STATUSES.includes(order.status as string)
    )
    
    if (hasActiveOrders) {
      const interval = setInterval(() => {
        fetchOrders()
      }, 15000) // Refresh cada 15 segundos solo si hay órdenes activas
      return () => clearInterval(interval)
    }
  }, [orders, fetchOrders])

  // Cargar mesas
  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoadingTables(true)
        const data = await tableService.getAll()
        setTables(data)
      } catch (err) {
        console.error('Error loading tables:', err)
        toast.error('Error al cargar mesas')
      } finally {
        setLoadingTables(false)
      }
    }
    loadTables()
  }, [])
  
  // Get table number from user if they're a customer (would come from localStorage or context)
  const customerTableNumber = !isStaff ? selectedTable : null

  // Filter orders - if customer, only show their table's orders
  const filteredOrders = orders.filter(order => {
    // For customers: only show their table's orders
    if (!isStaff && customerTableNumber) {
      return order.tableNumber === customerTableNumber
    }
    // For staff: apply table and status filters
    const matchesTable = !selectedTable || order.tableNumber === selectedTable
    const matchesStatus = !statusFilter || order.status === statusFilter
    return matchesTable && matchesStatus
  })

  // Get orders count by status
  const ordersByStatus = {
    pending: orders.filter(o => o.status === OrderStatus.CREATED || o.status === 'CREATED').length,
    inProgress: orders.filter(o => o.status === OrderStatus.IN_PROGRESS).length,
    ready: orders.filter(o => o.status === OrderStatus.READY).length,
  }

  // Change order status
  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      console.log('Changing status:', orderId, 'to', newStatus)
      await orderService.changeStatus(orderId, newStatus)
      toast.success('Estado actualizado')
      fetchOrders()
    } catch (err: any) {
      console.error('Error updating status:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al actualizar estado'
      toast.error(errorMessage)
    }
  }

  // Open assign waiter modal (Admin only)
  const handleOpenAssignModal = (order: OrderDto) => {
    setOrderToAssign(order)
    setIsAssignWaiterModalOpen(true)
  }

  // Open order details modal
  const handleViewOrder = async (order: OrderDto) => {
    setIsDetailModalOpen(true)
    setIsLoadingOrderDetails(true)
    try {
      const fullOrder = await orderService.getById(order.id)
      setSelectedOrder(fullOrder)
    } catch (error) {
      console.error('Error fetching order details:', error)
      // Fallback to basic order info
      setSelectedOrder({
        ...order,
        orderItems: [],
        products: []
      })
      toast.error('Error cargando detalles de la orden')
    } finally {
      setIsLoadingOrderDetails(false)
    }
  }

  // Format price
  const formatPrice = (price: number | undefined) => {
    if (!price) return '$0'
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Admin Navigation Tabs */}
      {isStaff && (
        <section className="bg-slate-900 border-b border-slate-700">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-0">
              <button
                onClick={() => setActiveTab('orders')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all border-b-2 ${
                  activeTab === 'orders'
                    ? 'text-emerald-400 border-emerald-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                <Clock className="w-5 h-5" />
                Órdenes
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all border-b-2 ${
                  activeTab === 'billing'
                    ? 'text-emerald-400 border-emerald-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                <Receipt className="w-5 h-5" />
                Facturación
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all border-b-2 ${
                  activeTab === 'reports'
                    ? 'text-emerald-400 border-emerald-400'
                    : 'text-slate-400 border-transparent hover:text-slate-300'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                Reportes
              </button>
            </div>
          </div>
        </section>
      )}
      
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">
                  Panel de Pedidos
                </h1>
                {/* Badge de rol */}
                {userIsAdmin && (
                  <Badge variant="info" className="!bg-purple-500/20 !text-purple-400 !border-purple-500/30">
                    Administrador
                  </Badge>
                )}
                {isWaiter && !userIsAdmin && (
                  <Badge variant="info" className="!bg-cyan-500/20 !text-cyan-400 !border-cyan-500/30">
                    Mesero
                  </Badge>
                )}
              </div>
              <p className="text-slate-400">
                {isWaiter && !userIsAdmin 
                  ? 'Tus órdenes del día' 
                  : 'Gestiona las órdenes y mesas del bar'
                }
              </p>
              {/* Mostrar filtro activo */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-500 text-sm">Mostrando:</span>
                <span className="text-emerald-400 text-sm font-medium">{dateFilter.label}</span>
                <span className="text-slate-500 text-sm">•</span>
                <span className="text-slate-400 text-sm">{orders.length} órdenes</span>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {/* Filtro de fecha */}
              <DateFilter
                dateFilter={dateFilter}
                onFilterTypeChange={setFilterType}
                onSpecificDateChange={setSpecificDate}
                showWeekOption={userIsAdmin} // Solo admin puede ver opción de semana
              />
              <Button
                variant="secondary"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                onClick={fetchOrders}
                disabled={isLoading}
              >
                Actualizar
              </Button>
              {(userIsAdmin || isWaiter) && (
                <Button
                  variant="primary"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setIsCreateOrderModalOpen(true)}
                >
                  Nueva Orden
                </Button>
              )}
            </div>
          </div>

          {/* Mostrar error si existe */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400 text-sm">{error}</p>
              <Button
                size="sm"
                variant="ghost"
                onClick={fetchOrders}
                className="ml-auto"
              >
                Reintentar
              </Button>
            </div>
          )}

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
                    {formatPrice(orders.reduce((sum, o) => sum + (o.valueToPay || 0), 0))}
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
          {/* Orders Tab Content */}
          {activeTab === 'orders' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tables Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    Mesas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3">
                    {loadingTables ? (
                      <div className="text-center py-4 text-slate-400">Cargando mesas...</div>
                    ) : tables.length === 0 ? (
                      <div className="text-center py-4 text-slate-400">No hay mesas registradas</div>
                    ) : (
                      tables.map((table) => {
                        const statusConfig = tableStatusConfig[table.status] || tableStatusConfig.FREE
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
                              <span className={`w-2 h-2 rounded-full ${statusConfig.color}`} />
                            </div>
                            <p className="text-slate-400 text-sm">{table.capacity} asientos</p>
                            <p className="text-xs text-slate-500 mt-1">{statusConfig.label}</p>
                            {tableOrders.length > 0 && (
                              <Badge variant="info" className="mt-2">
                                {tableOrders.length} orden{tableOrders.length > 1 ? 'es' : ''}
                              </Badge>
                            )}
                            {table.activeOrdersCount !== undefined && table.activeOrdersCount > 0 && (
                              <p className="text-xs text-amber-400 mt-1">
                                {table.activeOrdersCount} activa{table.activeOrdersCount > 1 ? 's' : ''}
                              </p>
                            )}
                          </button>
                        )
                      })
                    )}
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
                      {[OrderStatus.CREATED, OrderStatus.IN_PROGRESS, OrderStatus.READY].map((status) => (
                        <button
                          key={status}
                          onClick={() => setStatusFilter(status)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            statusFilter === status
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {status === OrderStatus.CREATED && 'Pendiente'}
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
                                  {formatPrice(order.valueToPay || 0)}
                                </p>
                                <p className="text-slate-500 text-xs">
                                  {order.date ? new Date(order.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                </p>
                              </div>
                              <div className="flex flex-col gap-1">
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  leftIcon={<Eye className="w-4 h-4" />}
                                  onClick={() => handleViewOrder(order)}
                                >
                                  Ver
                                </Button>
                                {(order.status === OrderStatus.CREATED || order.status === 'CREATED') && userIsAdmin && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    leftIcon={<UserPlus className="w-4 h-4" />}
                                    onClick={() => handleOpenAssignModal(order)}
                                    className="!border-amber-500 !text-amber-400 hover:!bg-amber-500/10"
                                  >
                                    Asignar
                                  </Button>
                                )}
                                {(order.status === OrderStatus.ASSIGNED || order.status === 'ASSIGNED') && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleStatusChange(order.id, OrderStatus.IN_PROGRESS)}
                                  >
                                    Preparar
                                  </Button>
                                )}
                                {(order.status === OrderStatus.IN_PROGRESS || order.status === 'IN_PROGRESS') && (
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleStatusChange(order.id, OrderStatus.READY)}
                                  >
                                    Listo
                                  </Button>
                                )}
                                {(order.status === OrderStatus.READY || order.status === 'READY') && (
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
          )}

          {/* Billing Tab Content */}
          {activeTab === 'billing' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-400" />
                    Facturas Pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.READY).length === 0 ? (
                      <div className="text-center py-8">
                        <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No hay facturas pendientes</p>
                      </div>
                    ) : (
                      orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.READY).map((order) => (
                        <div key={order.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white font-semibold">Mesa {order.tableNumber} - {order.clientName}</p>
                              <p className="text-slate-400 text-sm">Orden #{order.id}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-amber-400">{formatPrice(order.valueToPay || 0)}</p>
                              <Button size="sm" variant="primary" className="mt-2">
                                Generar Factura
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    Resumen del Día
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <p className="text-slate-400 text-sm">Total Ventas Hoy</p>
                      <p className="text-3xl font-bold text-emerald-400">
                        {formatPrice(orders.reduce((sum, o) => sum + (o.valueToPay || 0), 0))}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-800/50">
                        <p className="text-slate-400 text-sm">Órdenes Completadas</p>
                        <p className="text-2xl font-bold text-white">
                          {orders.filter(o => o.status === OrderStatus.DELIVERED).length}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-800/50">
                        <p className="text-slate-400 text-sm">Ticket Promedio</p>
                        <p className="text-2xl font-bold text-white">
                          {formatPrice(orders.length > 0 ? orders.reduce((sum, o) => sum + (o.valueToPay || 0), 0) / orders.length : 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Reports Tab Content */}
          {activeTab === 'reports' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    Reporte del Día - {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                      <p className="text-slate-400 text-sm">Total Órdenes</p>
                      <p className="text-2xl font-bold text-amber-400">{orders.length}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                      <p className="text-slate-400 text-sm">Ingresos</p>
                      <p className="text-2xl font-bold text-emerald-400">
                        {formatPrice(orders.reduce((sum, o) => sum + (o.valueToPay || 0), 0))}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
                      <p className="text-slate-400 text-sm">Mesas Atendidas</p>
                      <p className="text-2xl font-bold text-cyan-400">
                        {new Set(orders.map(o => o.tableNumber)).size}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30">
                      <p className="text-slate-400 text-sm">Clientes</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {new Set(orders.map(o => o.clientName)).size}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="text-white font-semibold">Últimas Órdenes</h4>
                    {orders.slice(0, 5).map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white text-sm font-bold">
                            {order.tableNumber}
                          </span>
                          <div>
                            <p className="text-white text-sm font-medium">{order.clientName}</p>
                            <p className="text-slate-500 text-xs">
                              {order.date ? new Date(order.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </p>
                          </div>
                        </div>
                        <span className="text-amber-400 font-semibold">{formatPrice(order.valueToPay || 0)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    Rendimiento Meseros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.from(new Set(orders.map(o => o.waiterUserName))).map((waiter) => {
                      const waiterOrders = orders.filter(o => o.waiterUserName === waiter)
                      const waiterTotal = waiterOrders.reduce((sum, o) => sum + (o.valueToPay || 0), 0)
                      return (
                        <div key={waiter} className="p-3 rounded-xl bg-slate-800/50">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-white font-medium">{waiter}</p>
                            <span className="text-emerald-400 font-semibold">{formatPrice(waiterTotal)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <span>{waiterOrders.length} órdenes</span>
                            <span>•</span>
                            <span>Promedio: {formatPrice(waiterTotal / waiterOrders.length)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      {/* Order Details Modal */}
      {isDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h3 className="text-xl font-bold text-white">Detalles de la Orden</h3>
                <p className="text-slate-400 text-sm">Orden #{selectedOrder.id}</p>
              </div>
              <button
                onClick={() => {
                  setIsDetailModalOpen(false)
                  setSelectedOrder(null)
                  setIsLoadingOrderDetails(false)
                }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-slate-400 rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Cliente</p>
                  <p className="text-white font-semibold">{selectedOrder.clientName || selectedOrder.customerName}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Mesa</p>
                  <p className="text-white font-semibold">Mesa {selectedOrder.tableNumber}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Mesero</p>
                  <p className="text-white font-semibold">{selectedOrder.waiterUserName || 'N/A'}</p>
                </div>
                <div className="bg-slate-800/50 rounded-xl p-4">
                  <p className="text-slate-400 text-sm mb-1">Hora</p>
                  <p className="text-white font-semibold">
                    {selectedOrder.date || selectedOrder.orderDate
                      ? new Date(selectedOrder.date || selectedOrder.orderDate!).toLocaleString('es-CO', {
                          hour: '2-digit',
                          minute: '2-digit',
                          day: '2-digit',
                          month: 'short'
                        })
                      : '--:--'}
                  </p>
                </div>
              </div>

              {/* Status */}
              <div className="mb-6">
                <p className="text-slate-400 text-sm mb-2">Estado</p>
                <OrderStatusBadge status={selectedOrder.status} />
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="mb-6">
                  <p className="text-slate-400 text-sm mb-2">Notas</p>
                  <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                    <p className="text-amber-400">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}

              {/* Products */}
              <div className="mb-6">
                <p className="text-slate-400 text-sm mb-3">Productos</p>
                {isLoadingOrderDetails ? (
                  <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                    <LoadingState />
                    <p className="text-slate-500 mt-2">Cargando productos...</p>
                  </div>
                ) : selectedOrder && (selectedOrder.orderItemList && selectedOrder.orderItemList.length > 0) ? (
                  <div className="space-y-2">
                    {selectedOrder.orderItemList.map((item, idx) => (
                      <div
                        key={`${selectedOrder.id}-${item.id}-${idx}`}
                        className="flex items-center justify-between bg-slate-800/50 rounded-xl p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                            <span className="text-white font-bold">{item.quantity}</span>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {item.productName}
                            </p>
                            <p className="text-slate-400 text-sm">
                              {formatPrice(item.unitPrice)} c/u
                            </p>
                          </div>
                        </div>
                        <p className="text-emerald-400 font-semibold">
                          {formatPrice(item.totalPrice)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-800/50 rounded-xl p-8 text-center">
                    <p className="text-slate-500">No hay productos en esta orden</p>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300 font-medium">Total a Pagar</span>
                  <span className="text-2xl font-bold text-emerald-400">
                    {formatPrice(selectedOrder.valueToPay || selectedOrder.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-700 flex gap-3">
              {selectedOrder.status === OrderStatus.CREATED && (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    handleStatusChange(selectedOrder.id, OrderStatus.IN_PROGRESS)
                    setIsDetailModalOpen(false)
                  }}
                >
                  Marcar en Preparación
                </Button>
              )}
              {selectedOrder.status === OrderStatus.IN_PROGRESS && (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    handleStatusChange(selectedOrder.id, OrderStatus.READY)
                    setIsDetailModalOpen(false)
                  }}
                >
                  Marcar como Listo
                </Button>
              )}
              {selectedOrder.status === OrderStatus.READY && (
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    handleStatusChange(selectedOrder.id, OrderStatus.DELIVERED)
                    setIsDetailModalOpen(false)
                  }}
                >
                  Marcar como Entregado
                </Button>
              )}
              <Button
                variant="secondary"
                onClick={() => setIsDetailModalOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      <CreateOrderModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        onOrderCreated={() => {
          fetchOrders()
        }}
      />

      {/* Assign Waiter Modal */}
      <AssignWaiterModal
        isOpen={isAssignWaiterModalOpen}
        onClose={() => {
          setIsAssignWaiterModalOpen(false)
          setOrderToAssign(null)
        }}
        order={orderToAssign}
        onAssigned={() => {
          fetchOrders()
        }}
      />
    </div>
  )
}

export default OrdersPage
