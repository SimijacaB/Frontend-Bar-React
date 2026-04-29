import { useState, useEffect, type FC } from 'react'
import { BarChart3, TrendingUp, TrendingDown, Calendar, DollarSign, Utensils, Clock, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts'
import apiClient from '../../config/api'
import { API_ENDPOINTS } from '../../config/api'
import AdminLayout from './AdminLayout'

interface DailyStats {
  date: string
  totalOrders: number
  totalRevenue: number
  averageTicket: number
}

interface OrderItem {
  name: string
  quantity: number
  price: number
}

// Colores para gráficos
const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

const StatisticsPage: FC = () => {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today')
  const [stats, setStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [topProducts, setTopProducts] = useState<OrderItem[]>([])

  // Métricas calculadas
  const totalOrders = stats.reduce((acc, s) => acc + s.totalOrders, 0)
  const totalRevenue = stats.reduce((acc, s) => acc + s.totalRevenue, 0)
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Comparación con período anterior (simulado)
  const ordersChange = 12.5
  const revenueChange = 8.3

  useEffect(() => {
    fetchStats()
  }, [dateRange])

  const fetchStats = async () => {
    setLoading(true)
    try {
      let startDate: string
      let endDate: string
      const today = new Date()

      switch (dateRange) {
        case 'today':
          startDate = today.toISOString().split('T')[0]
          endDate = startDate
          break
        case 'week':
          const weekAgo = new Date(today)
          weekAgo.setDate(today.getDate() - 7)
          startDate = weekAgo.toISOString().split('T')[0]
          endDate = today.toISOString().split('T')[0]
          break
        case 'month':
          const monthAgo = new Date(today)
          monthAgo.setDate(today.getDate() - 30)
          startDate = monthAgo.toISOString().split('T')[0]
          endDate = today.toISOString().split('T')[0]
          break
      }

      const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_DATE_RANGE, {
        params: { startDate, endDate }
      })

      // Agrupar por fecha
      const grouped = response.data.reduce((acc: Record<string, DailyStats>, order: any) => {
        const date = order.createdAt?.split('T')[0] || today.toISOString().split('T')[0]
        if (!acc[date]) {
          acc[date] = { date, totalOrders: 0, totalRevenue: 0, averageTicket: 0 }
        }
        acc[date].totalOrders += 1
        acc[date].totalRevenue += order.totalAmount || 0
        return acc
      }, {})

      const statsArray = Object.values(grouped).map((s: any) => ({
        ...s,
        averageTicket: s.totalOrders > 0 ? s.totalRevenue / s.totalOrders : 0
      }))

      setStats(statsArray as DailyStats[])

      // Productos top (simulado - en producción vendría del backend)
      setTopProducts([
        { name: 'Cerveza Artesanal', quantity: 145, price: 8.50 },
        { name: 'Pizza Margherita', quantity: 89, price: 12.00 },
        { name: 'Empanadas', quantity: 234, price: 3.50 },
        { name: 'Hamburguesa Clásica', quantity: 67, price: 11.00 },
        { name: 'Gaseosa 500ml', quantity: 312, price: 2.50 },
      ])
    } catch (error) {
      console.error('Error fetching stats:', error)
      // Datos de ejemplo si falla
      const today = new Date().toISOString().split('T')[0]
      setStats([
        { date: today, totalOrders: 24, totalRevenue: 156.80, averageTicket: 6.53 }
      ])
      setTopProducts([
        { name: 'Cerveza Artesanal', quantity: 145, price: 8.50 },
        { name: 'Pizza Margherita', quantity: 89, price: 12.00 },
        { name: 'Empanadas', quantity: 234, price: 3.50 },
      ])
    } finally {
      setLoading(false)
    }
  }

  // Preparar datos para gráficos
  const chartData = stats.map(s => ({
    name: new Date(s.date).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric' }),
    pedidos: s.totalOrders,
    ingresos: Math.round(s.totalRevenue * 100) / 100,
    ticket: Math.round(s.averageTicket * 100) / 100
  })).reverse()

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-950 py-8">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 mb-4">
              <BarChart3 className="w-8 h-8 text-violet-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Estadísticas</h1>
            <p className="text-slate-400">
              Analiza el rendimiento de tu bar
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setDateRange('today')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  dateRange === 'today'
                    ? 'bg-violet-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Hoy
              </button>
              <button
                onClick={() => setDateRange('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  dateRange === 'week'
                    ? 'bg-violet-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Semana
              </button>
              <button
                onClick={() => setDateRange('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  dateRange === 'month'
                    ? 'bg-violet-500 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Mes
              </button>
            </div>
          </div>

          {/* Metrics Cards - Top Row */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Total Orders */}
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Pedidos</p>
                    <p className="text-3xl font-bold text-white">{totalOrders}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Utensils className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  ordersChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {ordersChange >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(ordersChange)}% vs períodos</span>
                </div>
              </CardContent>
            </Card>

            {/* Total Revenue */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Ingresos</p>
                    <p className="text-3xl font-bold text-white">${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <DollarSign className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  revenueChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {revenueChange >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  <span>{Math.abs(revenueChange)}% vs períodos</span>
                </div>
              </CardContent>
            </Card>

            {/* Average Ticket */}
            <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Ticket Promedio</p>
                    <p className="text-3xl font-bold text-white">${averageTicket.toFixed(2)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
                    <Activity className="w-6 h-6 text-amber-400" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-2">por pedido</p>
              </CardContent>
            </Card>

            {/* Peak Hour */}
            <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-400 text-sm">Hora Pico</p>
                    <p className="text-3xl font-bold text-white">13:00</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-rose-400" />
                  </div>
                </div>
                <p className="text-slate-500 text-sm mt-2">horario principal</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6 mb-6">
            {/* Bar Chart - Orders by Day */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-violet-400" />
                  Pedidos por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    Cargando...
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    No hay datos
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Bar dataKey="pedidos" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Area Chart - Revenue Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Ingresos por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    Cargando...
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    No hay datos
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#fff' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="ingresos"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Bottom Row */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Pie Chart - Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-amber-400" />
                  Productos Más Vendidos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="h-64 flex items-center justify-center text-slate-400">
                    Cargando...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={280}>
                      <PieChart>
                        <Pie
                          data={topProducts}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: $${(value as number).toFixed(2)}`}
                          labelLine={false}
                        >
                          {topProducts.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Table - Daily Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-violet-400" />
                  Detalle por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-slate-400">
                    Cargando estadísticas...
                  </div>
                ) : stats.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    No hay datos para el período seleccionado
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="text-left py-3 px-4 text-slate-400 font-medium">Fecha</th>
                          <th className="text-right py-3 px-4 text-slate-400 font-medium">Pedidos</th>
                          <th className="text-right py-3 px-4 text-slate-400 font-medium">Ingresos</th>
                          <th className="text-right py-3 px-4 text-slate-400 font-medium">Ticket</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...stats].reverse().map((day) => (
                          <tr
                            key={day.date}
                            className="border-b border-slate-800/50 hover:bg-slate-800/30"
                          >
                            <td className="py-3 px-4 text-white">
                              {new Date(day.date).toLocaleDateString('es-AR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short'
                              })}
                            </td>
                            <td className="py-3 px-4 text-right text-white">{day.totalOrders}</td>
                            <td className="py-3 px-4 text-right text-emerald-400">
                              ${day.totalRevenue.toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-300">
                              ${day.averageTicket.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default StatisticsPage