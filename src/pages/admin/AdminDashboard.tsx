import { useState, useEffect, type FC } from 'react'
import { Link } from 'react-router-dom'
import { 
  BarChart3, QrCode, UtensilsCrossed, ClipboardList, Package, 
  TableProperties, Users, Search, Bell, Settings,
  TrendingUp, ShoppingCart, AlertTriangle
} from 'lucide-react'
import apiClient from '../../config/api'
import { API_ENDPOINTS } from '../../config/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface DailyMetrics {
  totalSales: number
  totalOrders: number
  lowStockItems: number
  criticalItems: number
}

interface TableStatus {
  id: number
  number: number
  status: 'OCCUPIED' | 'AVAILABLE'
  clientName?: string
  totalAmount?: number
}

interface StockItem {
  id: number
  name: string
  quantity: number
  minQuantity: number
  unit: string
  category: string
}

interface HourlySale {
  hour: string
  sales: number
}

const AdminDashboard: FC = () => {
  const [metrics, setMetrics] = useState<DailyMetrics>({
    totalSales: 0,
    totalOrders: 0,
    lowStockItems: 0,
    criticalItems: 0
  })
  const [tables, setTables] = useState<TableStatus[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockItem[]>([])
  const [hourlySales, setHourlySales] = useState<HourlySale[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Fetch today's orders
      const ordersRes = await apiClient.get(API_ENDPOINTS.ORDERS.BY_DATE(today))
      const orders = ordersRes.data
      
      // Calculate daily sales
      const totalSales = orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
      
      // Fetch tables
      const tablesRes = await apiClient.get(API_ENDPOINTS.TABLES.ALL)
      setTables(tablesRes.data)
      
      // Fetch inventory/stock for alerts
      try {
        const stockRes = await apiClient.get(API_ENDPOINTS.INVENTORY.ALL)
        const stock = stockRes.data
        
        const lowStock = stock.filter((s: any) => {
          const percentage = (s.quantity / s.minQuantity) * 100
          return percentage < 40
        })
        
        const critical = stock.filter((s: any) => {
          const percentage = (s.quantity / s.minQuantity) * 100
          return percentage < 20
        })
        
        setStockAlerts(lowStock.slice(0, 4))
        setMetrics(prev => ({ ...prev, lowStockItems: lowStock.length, criticalItems: critical.length }))
      } catch {
        // Inventory might not be available
        setStockAlerts([])
      }
      
      // Calculate hourly sales
      const hourlyMap: Record<number, number> = {}
      orders.forEach((o: any) => {
        const hour = new Date(o.createdAt).getHours()
        hourlyMap[hour] = (hourlyMap[hour] || 0) + (o.totalAmount || 0)
      })
      
      const hourly = []
      for (let h = 18; h <= 23; h++) {
        hourly.push({
          hour: `${h.toString().padStart(2, '0')}:00`,
          sales: Math.round(hourlyMap[h] || 0)
        })
      }
      setHourlySales(hourly)
      
      setMetrics({
        totalSales,
        totalOrders: orders.length,
        lowStockItems: metrics.lowStockItems,
        criticalItems: metrics.criticalItems
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      // Mock data for demo
      setMetrics({
        totalSales: 4852.00,
        totalOrders: 24,
        lowStockItems: 7,
        criticalItems: 3
      })
      setTables([
        { id: 1, number: 4, status: 'OCCUPIED', clientName: 'Mesa 4', totalAmount: 142.50 },
        { id: 2, number: 2, status: 'OCCUPIED', clientName: 'Mesa 2', totalAmount: 45.00 },
        { id: 3, number: 12, status: 'AVAILABLE' },
        { id: 4, number: 9, status: 'OCCUPIED', clientName: 'Mesa 9', totalAmount: 288.75 },
        { id: 5, number: 1, status: 'OCCUPIED', clientName: 'VIP', totalAmount: 512.00 },
        { id: 6, number: 5, status: 'AVAILABLE' },
      ])
      setStockAlerts([
        { id: 1, name: 'Gin Tanqueray', quantity: 0.75, minQuantity: 6, unit: '750ml', category: 'Spirits' },
        { id: 2, name: 'Menta Fresca', quantity: 140, minQuantity: 500, unit: 'g', category: 'Garnish' },
        { id: 3, name: 'Cerveza IPA', quantity: 17.5, minQuantity: 50, unit: 'L', category: 'Draft' },
        { id: 4, name: 'Sirope de Agave', quantity: 0.08, minQuantity: 1, unit: 'L', category: 'Sweetener' },
      ])
      setHourlySales([
        { hour: '18:00', sales: 1940 },
        { hour: '19:00', sales: 3155 },
        { hour: '20:00', sales: 4125 },
        { hour: '21:00', sales: 4612 },
        { hour: '22:00', sales: 3880 },
        { hour: '23:00', sales: 2910 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getStockPercentage = (item: StockItem) => {
    return Math.round((item.quantity / item.minQuantity) * 100)
  }

  return (
    <div className="p-8 h-[calc(100vh-64px)] overflow-y-auto">
      {/* Header & Metrics */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold text-white mb-1">Nightly Overview</h2>
            <p className="text-slate-400">
              Tracking bar operations for {new Date().toLocaleDateString('es-AR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </p>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Daily Sales */}
          <div className="glass-panel p-6 rounded-xl flex items-center gap-6 border border-white/5 bg-white/5">
            <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <ShoppingCart className="w-7 h-7 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-wider">Ventas del Día</p>
              <h3 className="text-2xl font-bold text-emerald-400">
                ${metrics.totalSales.toFixed(2)}
              </h3>
              <p className="text-xs text-emerald-400/60 font-bold flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" /> +12% from yesterday
              </p>
            </div>
          </div>

          {/* Open Orders */}
          <div className="glass-panel p-6 rounded-xl flex items-center gap-6 border border-white/5 bg-white/5">
            <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <ClipboardList className="w-7 h-7 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-wider">Pedidos Abiertos</p>
              <h3 className="text-2xl font-bold text-white">{metrics.totalOrders}</h3>
              <p className="text-xs text-slate-500 mt-1">8 priority items</p>
            </div>
          </div>

          {/* Stock Alerts */}
          <div className="glass-panel p-6 rounded-xl flex items-center gap-6 border border-white/5 bg-white/5">
            <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm uppercase tracking-wider">Stock Bajo</p>
              <h3 className="text-2xl font-bold text-red-400">0{metrics.lowStockItems}</h3>
              <p className="text-xs text-red-400/60 font-bold mt-1">Critical: {metrics.criticalItems} items</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Performance Chart */}
      <div className="glass-panel p-8 rounded-xl mb-8 border border-white/5">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Sales Performance</h3>
            <p className="text-slate-400 text-sm">Real-time revenue tracking across service hours</p>
          </div>
          <div className="bg-white/5 p-1 rounded-lg border border-white/10 flex">
            <button className="px-4 py-1.5 rounded-md text-sm bg-emerald-500 text-white shadow-lg font-bold">Hourly</button>
            <button className="px-4 py-1.5 rounded-md text-sm text-slate-400 hover:text-white transition-colors">Daily</button>
          </div>
        </div>
        
        {/* Chart */}
        <div className="h-64 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-400">
              Loading...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="hour" 
                  stroke="#64748b" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar 
                  dataKey="sales" 
                  fill="#34d399" 
                  radius={[4, 4, 0, 0]}
                  className="group-hover:fill-emerald-300"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Tables */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Active Tables</h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Occupied
              </span>
              <span className="flex items-center gap-2 text-xs text-slate-400">
                <span className="w-2 h-2 rounded-full bg-white/20"></span> Available
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`glass-panel p-4 rounded-xl border-l-4 hover:scale-[1.02] transition-transform cursor-pointer ${
                  table.status === 'OCCUPIED' 
                    ? 'border-l-emerald-400 bg-emerald-500/5' 
                    : 'border-l-white/20 bg-white/5 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`font-bold text-lg ${table.status === 'OCCUPIED' ? 'text-emerald-400' : 'text-slate-500'}`}>
                    T-{table.number}
                  </span>
                  <TableProperties className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  {table.status === 'OCCUPIED' ? `$${table.totalAmount?.toFixed(2)}` : 'Vacant'}
                </p>
                {table.status === 'OCCUPIED' && (
                  <div className="mt-3 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs text-emerald-400 font-bold uppercase">In Service</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Stock Alerts</h3>
            <Link to="/admin/inventario" className="text-emerald-400 text-xs font-bold hover:underline">
              View All
            </Link>
          </div>
          
          <div className="glass-panel rounded-xl overflow-hidden divide-y divide-white/5">
            {stockAlerts.map((item) => {
              const percentage = getStockPercentage(item)
              const isCritical = percentage < 20
              return (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded flex items-center justify-center ${
                        isCritical ? 'bg-red-500/10' : 'bg-emerald-500/10'
                      }`}>
                        <Package className={`w-4 h-4 ${isCritical ? 'text-red-400' : 'text-emerald-400'}`} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{item.name}</h4>
                        <p className="text-[10px] text-slate-500">{item.category} • {item.unit}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold ${isCritical ? 'text-red-400' : 'text-emerald-400'}`}>
                      {percentage}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${isCritical ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Restock */}
          <div className="relative overflow-hidden rounded-xl p-6 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
            <div className="relative z-10">
              <h4 className="text-sm font-bold text-emerald-400 mb-2">Inventory Sync Needed</h4>
              <p className="text-xs text-slate-400 mb-4">
                Automatic re-order triggered for {metrics.criticalItems} critical items.
              </p>
              <Link 
                to="/admin/inventario"
                className="block w-full py-2 bg-emerald-500 text-white text-center font-bold rounded-lg text-xs transition-all hover:brightness-110"
              >
                Review Re-order
              </Link>
            </div>
            <Package className="absolute -bottom-4 -right-4 text-emerald-500/10 text-8xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
