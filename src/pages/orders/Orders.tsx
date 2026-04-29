import { useState, useEffect, useCallback, type FC } from 'react'
import {
  Users,
  Clock,
  DollarSign,
  Eye,
  Plus,
  RefreshCw,
  Filter,
  Receipt,
  TrendingUp,
  AlertCircle,
  Download,
  Link2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, OrderStatusBadge, LoadingState, Pagination } from '../../components/ui'
import Button from '../../components/ui/Button'
import { orderService } from '../../features/orders/api/orderService'
import { useAuth } from '../../features/auth/context/AuthContext'
import { useOrdersFilter } from '../../features/orders/hooks/useOrdersFilter'
import { DateFilter, CreateOrderModal, AssignWaiterModal } from '../../features/orders/components'
import type { OrderDto, OrderDetailDto, BillDto } from '../../types'
import { OrderStatus } from '../../types'
import toast from 'react-hot-toast'

import { tableService, type TableDto } from '../../features/tables/api/tableService'
import { billService } from '../../features/invoice/api/billService'

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
  const [, setLoadingTables] = useState(true)
  const [bills, setBills] = useState<BillDto[]>([])
  const [, setLoadingBills] = useState(false)

  // Billing sub-tab
  const [billingSubTab, setBillingSubTab] = useState<'pending' | 'history'>('pending')
  // Bill preview/confirmation modal
  const [billPreviewItems, setBillPreviewItems] = useState<OrderDetailDto[]>([])
  const [isBillPreviewOpen, setIsBillPreviewOpen] = useState(false)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [pendingBillType, setPendingBillType] = useState<'single' | 'unified'>('single')
  const [pendingUnifyTableNumber, setPendingUnifyTableNumber] = useState<number | null>(null)
  const [pendingUnifyOrderIds, setPendingUnifyOrderIds] = useState<number[]>([])
  // Bills history filters & pagination (server-side)
  const [billsClientFilter, setBillsClientFilter] = useState('')
  const [billsDateFrom, setBillsDateFrom] = useState('')
  const [billsDateTo, setBillsDateTo] = useState('')
  const [billsPage, setBillsPage] = useState(1)
  const [billsTotalPages, setBillsTotalPages] = useState(0)
  const [billsTotalElements, setBillsTotalElements] = useState(0)
  const BILLS_PER_PAGE = 10
  // PDF preview modal
  const [pdfPreviewBillId, setPdfPreviewBillId] = useState<number | null>(null)
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null)
  const [isLoadingPdfPreview, setIsLoadingPdfPreview] = useState(false)

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
    currentPage: ordersPage,
    totalPages: ordersTotalPages,
    totalElements: ordersTotalElements,
    setPage: setOrdersPage,
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

  // Función para cargar mesas (reusable)
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

  // Función para cargar facturas (server-side paginated)
  const loadBills = useCallback(async () => {
    try {
      setLoadingBills(true)
      const result = await billService.getPaged({
        page: billsPage - 1,
        size: BILLS_PER_PAGE,
        clientName: billsClientFilter || undefined,
        startDate: billsDateFrom || undefined,
        endDate: billsDateTo || undefined,
      })
      setBills(result.content)
      setBillsTotalPages(result.totalPages)
      setBillsTotalElements(result.totalElements)
    } catch (err) {
      console.error('Error loading bills:', err)
      toast.error('Error al cargar facturas')
    } finally {
      setLoadingBills(false)
    }
  }, [billsPage, billsClientFilter, billsDateFrom, billsDateTo])

  // Cargar mesas al inicio
  useEffect(() => {
    loadTables()
  }, [])

  // Cargar órdenes cuando se activa la pestaña de facturación
  useEffect(() => {
    if (activeTab === 'billing' && userIsAdmin) {
      fetchOrders()
    }
  }, [activeTab, userIsAdmin])

  // Cargar facturas cuando cambian filtros, página o sub-pestaña
  useEffect(() => {
    if (activeTab === 'billing' && billingSubTab === 'history' && userIsAdmin) {
      loadBills()
    }
  }, [loadBills, activeTab, billingSubTab, userIsAdmin])
  
  // Get table number from user if they're a customer (would come from localStorage or context)
  const customerTableNumber = !isStaff ? selectedTable : null

  // Filter orders - if customer, only show their table's orders
  // Excluir órdenes facturadas (BILLED) del panel de órdenes activas
  const filteredOrders = orders.filter(order => {
    // Excluir órdenes ya facturadas del panel principal de órdenes activas
    const isNotBilled = order.status !== OrderStatus.BILLED && order.status !== 'BILLED'
    
    // For customers: only show their table's orders
    if (!isStaff && customerTableNumber) {
      return order.tableNumber === customerTableNumber && isNotBilled
    }
    // For staff: apply table and status filters
    const matchesTable = !selectedTable || order.tableNumber === selectedTable
    const matchesStatus = !statusFilter || order.status === statusFilter
    return matchesTable && matchesStatus && isNotBilled
  })

  // Get orders count by status
  const ordersByStatus = {
    pending: orders.filter(o => o.status === OrderStatus.CREATED || o.status === 'CREATED').length,
    inProgress: orders.filter(o => o.status === OrderStatus.IN_PROGRESS).length,
    ready: orders.filter(o => o.status === OrderStatus.READY).length,
  }

  // Group delivered orders by table for unified billing
  const deliveredOrdersByTable = orders
    .filter(o => o.status === OrderStatus.DELIVERED || o.status === 'DELIVERED')
    .reduce<Record<number, OrderDto[]>>((acc, order) => {
      const tableNum = order.tableNumber ?? 0
      if (!acc[tableNum]) acc[tableNum] = []
      acc[tableNum].push(order)
      return acc
    }, {})

  // Change order status
  const handleStatusChange = async (orderId: number, newStatus: OrderStatus) => {
    try {
      console.log('Changing status:', orderId, 'to', newStatus)
      await orderService.changeStatus(orderId, newStatus)
      toast.success('Estado actualizado')
      fetchOrders()
      // Si el nuevo estado es DELIVERED, refrescamos mesas por si cambió algo
      if (newStatus === OrderStatus.DELIVERED) {
        loadTables()
      }
    } catch (err: any) {
      console.error('Error updating status:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al actualizar estado'
      toast.error(errorMessage)
    }
  }

  // Generate bill for an order
  const handleGenerateBill = async (order: OrderDto) => {
    try {
      const clientName = order.clientName || order.customerName || 'Cliente'
      
      // Usar facturación por selección de orden específica
      await billService.generateBySelection([order.id])
      
      toast.success(`Factura generada para ${clientName}`)
      
      // Refrescar órdenes, mesas y facturas después de facturar
      await fetchOrders()
      await loadTables()
      await loadBills()
    } catch (err: any) {
      console.error('Error generating bill:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al generar factura'
      toast.error(errorMessage)
    }
  }

  // Open PDF preview modal
  const handlePreviewPdf = async (billId: number) => {
    setPdfPreviewBillId(billId)
    setPdfPreviewUrl(null)
    setIsLoadingPdfPreview(true)
    try {
      const blob = await billService.downloadPdf(billId)
      const url = URL.createObjectURL(blob)
      setPdfPreviewUrl(url)
    } catch (err: any) {
      toast.error('Error al cargar la previsualización')
      setPdfPreviewBillId(null)
    } finally {
      setIsLoadingPdfPreview(false)
    }
  }

  // Close PDF preview and revoke object URL
  const handleClosePdfPreview = () => {
    if (pdfPreviewUrl) URL.revokeObjectURL(pdfPreviewUrl)
    setPdfPreviewUrl(null)
    setPdfPreviewBillId(null)
  }

  // Download directly from the already-loaded preview blob
  const handleDownloadFromPreview = () => {
    if (!pdfPreviewUrl || !pdfPreviewBillId) return
    const link = document.createElement('a')
    link.href = pdfPreviewUrl
    link.download = `factura_${pdfPreviewBillId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Unify all delivered orders of a table into a single bill
  const handleUnifyBillByTable = async (tableNumber: number, orderIds: number[]) => {
    try {
      await billService.generateBySelection(orderIds)
      toast.success(`Factura unificada generada para mesa ${tableNumber}`)
      await fetchOrders()
      await loadTables()
      await loadBills()
    } catch (err: any) {
      console.error('Error generating unified bill:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al unificar factura'
      toast.error(errorMessage)
    }
  }

  // Open preview modal for a single order before billing
  const handleOpenBillPreview = async (order: OrderDto) => {
    setIsBillPreviewOpen(true)
    setIsLoadingPreview(true)
    setPendingBillType('single')
    try {
      const detail = await orderService.getById(order.id)
      setBillPreviewItems([detail])
    } catch {
      setBillPreviewItems([{ ...order, orderItemList: [] }])
    } finally {
      setIsLoadingPreview(false)
    }
  }

  // Open preview modal for unified billing of a table
  const handleOpenUnifyPreview = async (tableNumber: number, orderIds: number[]) => {
    setIsBillPreviewOpen(true)
    setIsLoadingPreview(true)
    setPendingBillType('unified')
    setPendingUnifyTableNumber(tableNumber)
    setPendingUnifyOrderIds(orderIds)
    try {
      const details = await Promise.all(orderIds.map(id => orderService.getById(id)))
      setBillPreviewItems(details)
    } catch {
      setBillPreviewItems([])
    } finally {
      setIsLoadingPreview(false)
    }
  }

  // Confirm billing after preview
  const handleConfirmBill = async () => {
    setIsBillPreviewOpen(false)
    if (pendingBillType === 'single' && billPreviewItems.length === 1) {
      await handleGenerateBill(billPreviewItems[0] as OrderDto)
    } else if (pendingBillType === 'unified' && pendingUnifyTableNumber !== null) {
      await handleUnifyBillByTable(pendingUnifyTableNumber, pendingUnifyOrderIds)
    }
    setBillPreviewItems([])
    setPendingUnifyTableNumber(null)
    setPendingUnifyOrderIds([])
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

  // Parse billing date avoiding UTC timezone shifts
  const parseBillingDate = (dateStr: string): Date => {
    const [datePart] = dateStr.split('T')
    const parts = datePart.split('-').map(Number)
    return new Date(parts[0], parts[1] - 1, parts[2])
  }

  const formatBillDate = (dateStr: string): string => {
    try {
      return parseBillingDate(dateStr).toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Admin Navigation Tabs - Only show billing/reports for admin */}
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
              {userIsAdmin && (
                <>
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
                </>
              )}
            </div>
          </div>
        </section>
      )}
      
      {/* Header */}
      {/* Main Content */}
      <main className="pt-12 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[calc(100vh-4rem)]">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold text-emerald-400 tracking-tight">Pedidos</h1>
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
            <p className="text-slate-400 font-medium">
              {isWaiter && !userIsAdmin 
                ? 'Tus órdenes del día' 
                : 'Gestión de órdenes activas en tiempo real'
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3 flex-wrap">
            <DateFilter
              dateFilter={dateFilter}
              onFilterTypeChange={setFilterType}
              onSpecificDateChange={setSpecificDate}
              showWeekOption={userIsAdmin}
            />
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchOrders}
              disabled={isLoading}
              className="bg-slate-800 border-slate-700/50 hover:bg-slate-700"
            >
              Actualizar
            </Button>
            {(userIsAdmin || isWaiter) && (
              <Button
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateOrderModalOpen(true)}
                className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
              >
                Nueva Orden
              </Button>
            )}
          </div>
        </div>

        {/* Action Tabs for Orders filtering */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/5 w-fit overflow-x-auto">
            <button 
              onClick={() => setStatusFilter(null)}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${!statusFilter ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-300'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setStatusFilter(OrderStatus.CREATED)}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${statusFilter === OrderStatus.CREATED ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-300'}`}
            >
              Pendientes
            </button>
            <button 
              onClick={() => setStatusFilter(OrderStatus.IN_PROGRESS)}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${statusFilter === OrderStatus.IN_PROGRESS ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-300'}`}
            >
              En Preparación
            </button>
            <button 
              onClick={() => setStatusFilter(OrderStatus.READY)}
              className={`px-6 py-2 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${statusFilter === OrderStatus.READY ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-slate-300'}`}
            >
              Listos
            </button>
          </div>

          {/* Table filter if needed */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-sm">Mesa:</span>
            <select 
              value={selectedTable === null ? '' : selectedTable} 
              onChange={(e) => setSelectedTable(e.target.value === '' ? null : Number(e.target.value))}
              className="bg-slate-900/50 border border-white/10 text-white rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="">Todas</option>
              {tables.map(t => (
                <option key={t.id} value={t.number}>Mesa {t.number}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mostrar error si existe */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
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

        {/* Orders Tab Content */}
        {activeTab === 'orders' && (
          <>
            {isLoading ? (
              <LoadingState message="Cargando órdenes..." />
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-white/5">
                <Filter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400">No hay órdenes que coincidan con los filtros</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Summary Card (Bento Style) */}
                <div className="bg-slate-800 border border-emerald-500/20 rounded-xl p-6 flex flex-col justify-between">
                  <div>
                    <h4 className="text-2xl font-bold text-white tracking-tight">Estado de Cocina</h4>
                    <p className="text-sm text-slate-400 mb-6 font-medium">Rendimiento actual del turno</p>
                    <div className="space-y-4">
                      <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm text-slate-400 font-medium">Carga de Trabajo</span>
                          <span className="text-sm text-emerald-400 font-bold">{Math.min(100, Math.round((ordersByStatus.inProgress / (ordersByStatus.pending + ordersByStatus.inProgress || 1)) * 100))}%</span>
                        </div>
                        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="bg-emerald-400 h-full shadow-[0_0_8px_rgba(52,211,153,0.5)] transition-all duration-500" 
                            style={{ width: `${Math.min(100, Math.round((ordersByStatus.inProgress / (ordersByStatus.pending + ordersByStatus.inProgress || 1)) * 100))}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                          <span className="text-sm text-slate-500 block mb-1 font-medium">Órdenes</span>
                          <span className="text-2xl font-bold text-emerald-400" style={{ textShadow: '0 0 8px rgba(52,211,153,0.3)' }}>{ordersByStatus.pending + ordersByStatus.inProgress}</span>
                        </div>
                        <div className="bg-slate-900/50 p-4 rounded-lg border border-white/5">
                          <span className="text-sm text-slate-500 block mb-1 font-medium">Facturación</span>
                          <span className="text-lg font-bold text-purple-400">{formatPrice(orders.reduce((sum, o) => sum + (o.valueToPay || 0), 0))}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(userIsAdmin || isWaiter) && (
                    <button onClick={() => setIsCreateOrderModalOpen(true)} className="w-full mt-6 py-3 rounded-lg border border-emerald-500/30 text-emerald-400 font-semibold hover:bg-emerald-500/10 transition-colors">
                      + Nueva Orden
                    </button>
                  )}
                </div>

                {/* Active Order Cards */}
                {filteredOrders.map((order) => {
                  // Determine status styles and texts
                  let statusBg = 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                  let glowBg = 'bg-slate-500/5'
                  let btnVariant = 'bg-slate-500/20 hover:bg-slate-500/30 text-slate-400 focus:ring-slate-500/30'
                  let actionAction = () => handleViewOrder(order)
                  let actionText = 'Ver Detalles'

                  if (order.status === 'CREATED' || order.status === OrderStatus.CREATED) {
                    statusBg = 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                    glowBg = 'bg-amber-500/10'
                    if (userIsAdmin) {
                      actionText = 'Asignar'
                      actionAction = () => handleOpenAssignModal(order)
                      btnVariant = 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                    } else if (isWaiter) {
                      actionText = 'Preparar'
                      actionAction = () => handleStatusChange(order.id, OrderStatus.IN_PROGRESS)
                      btnVariant = 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)]'
                    }
                  } else if (order.status === 'IN_PROGRESS' || order.status === OrderStatus.IN_PROGRESS) {
                    statusBg = 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    glowBg = 'bg-cyan-500/10'
                    actionText = 'Marcar Listo'
                    actionAction = () => handleStatusChange(order.id, OrderStatus.READY)
                    btnVariant = 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                  } else if (order.status === 'READY' || order.status === OrderStatus.READY) {
                    statusBg = 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                    glowBg = 'bg-emerald-500/10'
                    actionText = 'Entregar'
                    actionAction = () => handleStatusChange(order.id, OrderStatus.DELIVERED)
                    btnVariant = 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.15)]'
                  }

                  const orderDate = new Date(order.date || order.orderDate || Date.now())
                  const elapsedMs = Date.now() - orderDate.getTime()
                  const mins = Math.max(0, Math.floor(elapsedMs / 60000))
                  const timeStr = `${mins.toString().padStart(2, '0')}m`

                  return (
                    <div key={order.id} className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-xl p-6 flex flex-col gap-5 relative overflow-hidden group hover:border-white/20 transition-all shadow-lg shadow-black/50">
                      <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 blur-3xl opacity-50 ${glowBg}`}></div>
                      
                      {/* Card Header */}
                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                            {order.tableNumber ? `Mesa ${order.tableNumber}` : 'Para LLevar'}
                          </span>
                          <h3 className="text-2xl font-bold text-white mt-1">#{order.id}</h3>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 border ${statusBg}`}>
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold">{timeStr}</span>
                        </div>
                      </div>

                      {/* Items Details preview or notes */}
                      <div className="space-y-2 mt-2 relative z-10 flex-1 min-h-[80px]">
                        {order.products && order.products.length > 0 ? (
                          order.products.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-slate-300 text-sm pb-2 border-b border-white/10 last:border-0 last:pb-0">
                              <span className="truncate pr-4">{item.productName || `Prod #${item.productId}`}</span>
                              <span className="text-white font-semibold">x{item.quantity}</span>
                            </div>
                          ))
                        ) : order.notes ? (
                          <div className="text-slate-400 text-sm italic line-clamp-3">"{order.notes}"</div>
                        ) : (
                          <div className="text-slate-500 text-sm flex items-center gap-1 h-full"><AlertCircle className="w-4 h-4"/> Detalles no cargados en resumen</div>
                        )}
                        {/* Indicador de más items */}
                        {order.products && order.products.length > 3 && (
                          <div className="text-xs text-slate-500 font-medium pt-1">
                            + {order.products.length - 3} ítems más...
                          </div>
                        )}
                      </div>

                      {/* User / Waiter Name */}
                      <div className="text-xs font-medium text-slate-500 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5" />
                        <span className="truncate">{order.clientName || 'Cliente'}</span>
                        <span className="opacity-50 mx-1">•</span>
                        <span className="truncate">{order.waiterUserName || 'Sin asignar'}</span>
                      </div>

                      {/* Card Footer */}
                      <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between gap-4 relative z-10">
                        <div className="text-emerald-400 font-bold text-2xl" style={{ textShadow: '0 0 8px rgba(52,211,153,0.3)' }}>
                          {formatPrice(order.valueToPay || 0)}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleViewOrder(order)} 
                            className="p-3 rounded-lg border border-white/10 text-slate-300 hover:bg-slate-800 transition-colors"
                            title="Ver detalles completos"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={actionAction} 
                            className={`font-semibold px-5 py-2.5 rounded-lg transition-all active:scale-95 ${btnVariant}`}
                          >
                            {actionText}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            {/* Orders pagination */}
            {ordersTotalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination
                  page={ordersPage}
                  totalPages={ordersTotalPages}
                  total={ordersTotalElements}
                  itemsPerPage={30}
                  label="órdenes"
                  onPageChange={setOrdersPage}
                />
              </div>
            )}
          </>
        )}

          {/* Billing Tab Content */}
          {activeTab === 'billing' && (
            <div className="space-y-6">
              {/* Billing Sub-Tabs */}
              <div className="flex gap-1 bg-slate-800/60 p-1 rounded-xl w-fit">
                <button
                  onClick={() => setBillingSubTab('pending')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    billingSubTab === 'pending'
                      ? 'bg-amber-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Pendientes
                  {Object.keys(deliveredOrdersByTable).length > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                      billingSubTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {Object.values(deliveredOrdersByTable).reduce((s, arr) => s + arr.length, 0)}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setBillingSubTab('history')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    billingSubTab === 'history'
                      ? 'bg-emerald-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Historial
                </button>
              </div>

              {/* Pending sub-tab */}
              {billingSubTab === 'pending' && (
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
                        {Object.keys(deliveredOrdersByTable).length === 0 ? (
                          <div className="text-center py-8">
                            <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                            <p className="text-slate-400">No hay órdenes entregadas pendientes de facturar</p>
                          </div>
                        ) : (
                          Object.entries(deliveredOrdersByTable).map(([tableNumStr, tableOrders]) => {
                            const tableNumber = Number(tableNumStr)
                            const tableTotal = tableOrders.reduce((sum, o) => sum + (o.valueToPay || 0), 0)
                            const orderIds = tableOrders.map(o => o.id)
                            return (
                              <div key={tableNumber} className="rounded-xl border border-slate-700/50 overflow-hidden">
                                {/* Table group header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-slate-800 border-b border-slate-700/50">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                      <span className="text-amber-400 font-bold text-sm">{tableNumber}</span>
                                    </div>
                                    <div>
                                      <p className="text-white font-semibold">Mesa {tableNumber}</p>
                                      <p className="text-slate-400 text-xs">
                                        {tableOrders.length} orden{tableOrders.length > 1 ? 'es' : ''} entregada{tableOrders.length > 1 ? 's' : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-amber-400 font-bold">{formatPrice(tableTotal)}</p>
                                    {tableOrders.length > 1 && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        leftIcon={<Link2 className="w-4 h-4" />}
                                        onClick={() => handleOpenUnifyPreview(tableNumber, orderIds)}
                                        className="!border-purple-500 !text-purple-400 hover:!bg-purple-500/10"
                                      >
                                        Unificar Factura
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {/* Individual orders */}
                                <div className="divide-y divide-slate-700/30">
                                  {tableOrders.map((order) => (
                                    <div key={order.id} className="flex items-center justify-between p-4 bg-slate-800/50">
                                      <div>
                                        <p className="text-white font-medium">{order.clientName || order.customerName || 'Cliente'}</p>
                                        <p className="text-slate-400 text-sm">Orden #{order.id}</p>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <p className="text-amber-400 font-bold">{formatPrice(order.valueToPay || 0)}</p>
                                        <Button
                                          size="sm"
                                          variant="primary"
                                          onClick={() => handleOpenBillPreview(order)}
                                        >
                                          Ver y Facturar
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )
                          })
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

              {/* History sub-tab */}
              {billingSubTab === 'history' && (
                <Card>
                  <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <CardTitle className="flex items-center gap-2">
                        <Receipt className="w-5 h-5 text-emerald-400" />
                        Historial de Facturas
                        {billsTotalElements > 0 && (
                          <span className="text-slate-400 text-sm font-normal ml-1">
                            ({billsTotalElements} {billsTotalElements === 1 ? 'factura' : 'facturas'})
                          </span>
                        )}
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<RefreshCw className={`w-4 h-4 ${loadingBills ? 'animate-spin' : ''}`} />}
                        onClick={loadBills}
                        disabled={loadingBills}
                      >
                        Actualizar
                      </Button>
                    </div>
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3 mt-4">
                      <input
                        type="text"
                        placeholder="Buscar por cliente..."
                        value={billsClientFilter}
                        onChange={e => { setBillsClientFilter(e.target.value); setBillsPage(1) }}
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="date"
                        value={billsDateFrom}
                        onChange={e => { setBillsDateFrom(e.target.value); setBillsPage(1) }}
                        className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:border-emerald-500"
                      />
                      <input
                        type="date"
                        value={billsDateTo}
                        onChange={e => { setBillsDateTo(e.target.value); setBillsPage(1) }}
                        className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-sm focus:outline-none focus:border-emerald-500"
                      />
                      {(billsClientFilter || billsDateFrom || billsDateTo) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setBillsClientFilter(''); setBillsDateFrom(''); setBillsDateTo(''); setBillsPage(1) }}
                        >
                          Limpiar
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingBills ? (
                      <div className="text-center py-8">
                        <LoadingState message="Cargando facturas..." />
                      </div>
                    ) : bills.length === 0 ? (
                      <div className="text-center py-8">
                        <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">
                          {!billsClientFilter && !billsDateFrom && !billsDateTo ? 'No hay facturas generadas' : 'No hay facturas que coincidan con los filtros'}
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3">
                          {bills.map((bill) => (
                            <div
                              key={bill.id}
                              className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-emerald-500/30 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <p className="text-white font-semibold">Factura #{bill.billNumber}</p>
                                    <Badge variant="success" className="!bg-emerald-500/20 !text-emerald-400 !border-emerald-500/30">
                                      Pagada
                                    </Badge>
                                    {bill.items?.length > 1 && (
                                      <Badge variant="info" className="!bg-purple-500/20 !text-purple-400 !border-purple-500/30">
                                        Unificada
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-slate-300 mb-1">Cliente: {bill.clientName}</p>
                                  <p className="text-slate-400 text-sm">Fecha: {formatBillDate(bill.billingDate)}</p>
                                  <p className="text-slate-400 text-sm mt-1">
                                    {bill.items?.length ?? 0} {(bill.items?.length ?? 0) === 1 ? 'producto' : 'productos'}
                                  </p>
                                  {bill.createdBy && (
                                    <p className="text-slate-400 text-sm">Creada por: {bill.createdBy}</p>
                                  )}
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="text-2xl font-bold text-emerald-400 mb-3">
                                    {formatPrice(bill.totalAmount)}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handlePreviewPdf(bill.id)}
                                  >
                                    <Eye className="w-4 h-4 mr-1.5" />
                                    Ver Factura
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pagination */}
                        {billsTotalPages > 1 && (
                          <Pagination
                            page={billsPage}
                            totalPages={billsTotalPages}
                            total={billsTotalElements}
                            itemsPerPage={BILLS_PER_PAGE}
                            label="facturas"
                            onPageChange={setBillsPage}
                          />
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              )}
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
      </main>

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

      {/* Bill Preview / Confirmation Modal */}
      {isBillPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div>
                <h3 className="text-xl font-bold text-white">
                  {pendingBillType === 'unified' ? 'Factura Unificada — Mesa ' + pendingUnifyTableNumber : 'Confirmar Factura'}
                </h3>
                <p className="text-slate-400 text-sm mt-1">
                  {pendingBillType === 'unified'
                    ? `${pendingUnifyOrderIds.length} pedidos · Total combinado`
                    : 'Revisa los detalles antes de facturar'}
                </p>
              </div>
              <button
                onClick={() => { setIsBillPreviewOpen(false); setBillPreviewItems([]) }}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Plus className="w-5 h-5 text-slate-400 rotate-45" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <LoadingState />
                  <p className="text-slate-400 text-sm">Cargando detalles del pedido...</p>
                </div>
              ) : billPreviewItems.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No se pudieron cargar los detalles</p>
              ) : (
                <div className="space-y-6">
                  {billPreviewItems.map((item, idx) => (
                    <div key={item.id} className="space-y-3">
                      {pendingBillType === 'unified' && (
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 text-xs flex items-center justify-center font-bold">{idx + 1}</span>
                          <p className="text-white font-semibold">{item.clientName || item.customerName || 'Cliente'}</p>
                          <span className="text-slate-500 text-sm">· Orden #{item.id}</span>
                        </div>
                      )}
                      {pendingBillType === 'single' && (
                        <div className="grid grid-cols-2 gap-3 mb-2">
                          <div className="bg-slate-800/50 rounded-xl p-3">
                            <p className="text-slate-400 text-xs mb-1">Cliente</p>
                            <p className="text-white font-medium">{item.clientName || item.customerName}</p>
                          </div>
                          <div className="bg-slate-800/50 rounded-xl p-3">
                            <p className="text-slate-400 text-xs mb-1">Mesa · Orden</p>
                            <p className="text-white font-medium">Mesa {item.tableNumber} · #{item.id}</p>
                          </div>
                        </div>
                      )}
                      {item.orderItemList && item.orderItemList.length > 0 ? (
                        <div className="space-y-2">
                          {item.orderItemList.map((product, pIdx) => (
                            <div
                              key={`${item.id}-${product.id}-${pIdx}`}
                              className="flex items-center justify-between bg-slate-800/50 rounded-xl px-4 py-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center text-white text-sm font-bold">
                                  {product.quantity}
                                </span>
                                <div>
                                  <p className="text-white text-sm font-medium">{product.productName}</p>
                                  <p className="text-slate-400 text-xs">{formatPrice(product.unitPrice)} c/u</p>
                                </div>
                              </div>
                              <p className="text-emerald-400 font-semibold text-sm">{formatPrice(product.totalPrice)}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-slate-500 text-sm text-center py-2">Sin detalle de productos cargado</p>
                      )}
                      {pendingBillType === 'unified' && idx < billPreviewItems.length - 1 && (
                        <div className="border-t border-slate-700/50" />
                      )}
                    </div>
                  ))}

                  {/* Combined total */}
                  <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">
                        {pendingBillType === 'unified' ? 'Total Unificado' : 'Total a Pagar'}
                      </span>
                      <span className="text-2xl font-bold text-emerald-400">
                        {formatPrice(billPreviewItems.reduce((s, o) => s + (o.valueToPay || o.total || 0), 0))}
                      </span>
                    </div>
                    {pendingBillType === 'unified' && (
                      <p className="text-slate-400 text-xs mt-1">
                        {pendingUnifyOrderIds.length} pedidos · {billPreviewItems.reduce((s, o) => s + (o.orderItemList?.length ?? 0), 0)} productos en total
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-700 flex gap-3">
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleConfirmBill}
                disabled={isLoadingPreview}
              >
                <Receipt className="w-4 h-4 mr-2" />
                {pendingBillType === 'unified' ? 'Confirmar Factura Unificada' : 'Confirmar y Facturar'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setIsBillPreviewOpen(false); setBillPreviewItems([]) }}
              >
                Cancelar
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

      {/* PDF Bill Preview Modal */}
      {pdfPreviewBillId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl w-full max-w-4xl border border-slate-700 flex flex-col" style={{ height: '90vh' }}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">Factura #{pdfPreviewBillId}</h3>
                  <p className="text-slate-400 text-xs">Previsualización del documento</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Download className="w-4 h-4" />}
                  onClick={handleDownloadFromPreview}
                  disabled={!pdfPreviewUrl}
                >
                  Descargar PDF
                </Button>
                <button
                  onClick={handleClosePdfPreview}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors ml-1"
                  aria-label="Cerrar"
                >
                  <Plus className="w-5 h-5 text-slate-400 rotate-45" />
                </button>
              </div>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-hidden p-4">
              {isLoadingPdfPreview ? (
                <div className="flex items-center justify-center h-full">
                  <LoadingState message="Cargando factura..." />
                </div>
              ) : pdfPreviewUrl ? (
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full rounded-xl border border-slate-700/50"
                  title={`Factura ${pdfPreviewBillId}`}
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-slate-400">No se pudo cargar la previsualización</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default OrdersPage
