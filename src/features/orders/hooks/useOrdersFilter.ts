import { useState, useCallback, useEffect, useMemo } from 'react'
import { orderService } from '../api/orderService'
import {
  getDateFilterState,
  formatDateForApi,
} from '../utils/dateUtils'
import type { DateFilterType, DateFilterState } from '../utils/dateUtils'
import type { OrderDto } from '../../../types'
import { UserRole } from '../../../types'

export interface UseOrdersFilterOptions {
  /** Rol del usuario actual */
  userRole: string | string[]
  /** Si el filtrado automático debe ejecutarse al montar */
  autoFetch?: boolean
  /** Intervalo de actualización automática en ms (0 para desactivar) */
  refreshInterval?: number
}

export interface UseOrdersFilterReturn {
  /** Lista de órdenes filtradas */
  orders: OrderDto[]
  /** Estado de carga */
  isLoading: boolean
  /** Error si ocurrió alguno */
  error: string | null
  /** Estado actual del filtro de fecha */
  dateFilter: DateFilterState
  /** Cambia el tipo de filtro de fecha */
  setFilterType: (type: DateFilterType) => void
  /** Establece una fecha específica */
  setSpecificDate: (date: Date) => void
  /** Recarga las órdenes con los filtros actuales */
  refresh: () => Promise<void>
  /** Indica si el usuario es administrador */
  isAdmin: boolean
  /** Indica si el usuario es mesero */
  isWaiter: boolean
}

/**
 * Hook personalizado para gestionar el filtrado de órdenes según el rol del usuario
 * 
 * Comportamiento:
 * - ADMIN: Ve todas las órdenes del día actual al iniciar, puede filtrar por fecha
 * - WAITER: Ve solo sus propias órdenes del día actual al iniciar
 */
export const useOrdersFilter = (options: UseOrdersFilterOptions): UseOrdersFilterReturn => {
  const { userRole, autoFetch = true, refreshInterval = 0 } = options

  // Determinar el rol del usuario
  const roles = useMemo(() => {
    return Array.isArray(userRole) ? userRole : [userRole]
  }, [userRole])

  const isAdmin = useMemo(() => 
    roles.some(role => role === UserRole.ADMIN || role === 'ADMIN'),
    [roles]
  )

  const isWaiter = useMemo(() => 
    roles.some(role => role === UserRole.WAITER || role === 'WAITER'),
    [roles]
  )

  // Estado del filtro de fecha (por defecto: hoy)
  const [filterType, setFilterTypeState] = useState<DateFilterType>('today')
  const [specificDate, setSpecificDateState] = useState<Date | undefined>(undefined)

  // Estado de las órdenes
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Calcular el estado del filtro de fecha
  const dateFilter = useMemo(() => 
    getDateFilterState(filterType, specificDate),
    [filterType, specificDate]
  )

  /**
   * Función principal para obtener las órdenes según el rol y filtros
   */
  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      let fetchedOrders: OrderDto[]
      
      // Determinar si hay filtro de fecha o se quieren todas
      const isAllFilter = filterType === 'all'
      const startDateStr = isAllFilter ? null : formatDateForApi(dateFilter.dateRange.startDate)
      const endDateStr = isAllFilter ? null : formatDateForApi(dateFilter.dateRange.endDate)

      if (isAdmin) {
        // Admin: obtener órdenes (todas o filtradas por fecha)
        fetchedOrders = await orderService.getByDateRange(startDateStr, endDateStr)
      } else if (isWaiter) {
        // Mesero: obtener solo sus órdenes (todas o filtradas por fecha)
        fetchedOrders = await orderService.getMyOrdersByDateRange(startDateStr, endDateStr)
      } else {
        // Otro rol: obtener todas (fallback)
        fetchedOrders = await orderService.getByDateRange(startDateStr, endDateStr)
      }

      setOrders(fetchedOrders)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar las órdenes'
      setError(message)
      console.error('Error fetching orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filterType, dateFilter.dateRange, isAdmin, isWaiter])

  /**
   * Cambiar el tipo de filtro de fecha
   */
  const setFilterType = useCallback((type: DateFilterType) => {
    setFilterTypeState(type)
    if (type !== 'specific') {
      setSpecificDateState(undefined)
    }
  }, [])

  /**
   * Establecer una fecha específica
   */
  const setSpecificDate = useCallback((date: Date) => {
    setFilterTypeState('specific')
    setSpecificDateState(date)
  }, [])

  /**
   * Función de refresco manual
   */
  const refresh = useCallback(async () => {
    await fetchOrders()
  }, [fetchOrders])

  // Efecto para cargar órdenes al montar o cuando cambian los filtros
  useEffect(() => {
    if (autoFetch) {
      fetchOrders()
    }
  }, [autoFetch, fetchOrders])

  // Efecto para actualización automática periódica
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchOrders()
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, fetchOrders])

  return {
    orders,
    isLoading,
    error,
    dateFilter,
    setFilterType,
    setSpecificDate,
    refresh,
    isAdmin,
    isWaiter,
  }
}

export default useOrdersFilter
