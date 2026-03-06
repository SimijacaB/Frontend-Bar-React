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
  /** Tamaño de página (por defecto 30) */
  pageSize?: number
}

export interface UseOrdersFilterReturn {
  /** Lista de órdenes filtradas (página actual) */
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
  /** Página actual (1-indexed para la UI) */
  currentPage: number
  /** Total de páginas */
  totalPages: number
  /** Total de elementos */
  totalElements: number
  /** Cambia la página actual */
  setPage: (page: number) => void
  /** Tamaño de página */
  pageSize: number
}

/**
 * Hook personalizado para gestionar el filtrado de órdenes según el rol del usuario
 *
 * Comportamiento:
 * - ADMIN: Ve todas las órdenes del día actual al iniciar, puede filtrar por fecha
 * - WAITER: Ve solo sus propias órdenes del día actual al iniciar
 */
export const useOrdersFilter = (options: UseOrdersFilterOptions): UseOrdersFilterReturn => {
  const { userRole, autoFetch = true, refreshInterval = 0, pageSize = 30 } = options

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

  // Estado de paginación (0-indexed internamente, 1-indexed en la UI)
  const [currentPageIndex, setCurrentPageIndex] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)

  // Calcular el estado del filtro de fecha
  const dateFilter = useMemo(() =>
    getDateFilterState(filterType, specificDate),
    [filterType, specificDate]
  )

  /**
   * Función principal para obtener las órdenes según el rol y filtros
   */
  const fetchOrders = useCallback(async (pageIndex: number = currentPageIndex) => {
    setIsLoading(true)
    setError(null)

    try {
      const isAllFilter = filterType === 'all'
      const startDateStr = isAllFilter ? null : formatDateForApi(dateFilter.dateRange.startDate)
      const endDateStr = isAllFilter ? null : formatDateForApi(dateFilter.dateRange.endDate)

      let pagedResult
      if (isAdmin) {
        pagedResult = await orderService.getByDateRangePaged(startDateStr, endDateStr, pageIndex, pageSize)
      } else if (isWaiter) {
        pagedResult = await orderService.getMyOrdersByDateRangePaged(startDateStr, endDateStr, pageIndex, pageSize)
      } else {
        pagedResult = await orderService.getByDateRangePaged(startDateStr, endDateStr, pageIndex, pageSize)
      }

      setOrders(pagedResult.content)
      setTotalPages(pagedResult.totalPages)
      setTotalElements(pagedResult.totalElements)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al cargar las órdenes'
      setError(message)
      console.error('Error fetching orders:', err)
    } finally {
      setIsLoading(false)
    }
  }, [filterType, dateFilter.dateRange, isAdmin, isWaiter, currentPageIndex, pageSize])

  /**
   * Cambiar el tipo de filtro de fecha (resetea a la primera página)
   */
  const setFilterType = useCallback((type: DateFilterType) => {
    setCurrentPageIndex(0)
    setFilterTypeState(type)
    if (type !== 'specific') {
      setSpecificDateState(undefined)
    }
  }, [])

  /**
   * Establecer una fecha específica (resetea a la primera página)
   */
  const setSpecificDate = useCallback((date: Date) => {
    setCurrentPageIndex(0)
    setFilterTypeState('specific')
    setSpecificDateState(date)
  }, [])

  /**
   * Cambiar la página (1-indexed para la UI)
   */
  const setPage = useCallback((page: number) => {
    const newIndex = page - 1
    setCurrentPageIndex(newIndex)
  }, [])

  /**
   * Función de refresco manual
   */
  const refresh = useCallback(async () => {
    await fetchOrders(currentPageIndex)
  }, [fetchOrders, currentPageIndex])

  // Efecto para cargar órdenes al montar o cuando cambian los filtros
  useEffect(() => {
    if (autoFetch) {
      fetchOrders(currentPageIndex)
    }
  }, [autoFetch, fetchOrders])

  // Efecto para actualización automática periódica
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        fetchOrders(currentPageIndex)
      }, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [refreshInterval, fetchOrders, currentPageIndex])

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
    currentPage: currentPageIndex + 1,
    totalPages,
    totalElements,
    setPage,
    pageSize,
  }
}

export default useOrdersFilter
