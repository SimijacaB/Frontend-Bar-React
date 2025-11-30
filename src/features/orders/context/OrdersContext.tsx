import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { OrderDto, OrderDetailDto } from '../../../types'
import type { OrderStatus } from '../../../types'
import { orderService } from '../api/orderService'

interface OrdersContextType {
  orders: OrderDto[]
  selectedOrder: OrderDetailDto | null
  isLoading: boolean
  error: string | null
  fetchOrders: () => Promise<void>
  fetchOrderById: (id: number) => Promise<void>
  fetchOrdersByTable: (tableNumber: number) => Promise<void>
  changeOrderStatus: (orderId: number, status: OrderStatus) => Promise<void>
  clearSelectedOrder: () => void
}

const OrdersContext = createContext<OrdersContextType | null>(null)

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<OrderDto[]>([])
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailDto | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await orderService.getAll()
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchOrderById = useCallback(async (id: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await orderService.getById(id)
      setSelectedOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la orden')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchOrdersByTable = useCallback(async (tableNumber: number) => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await orderService.getByTableNumber(tableNumber)
      setOrders(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes de la mesa')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const changeOrderStatus = useCallback(async (orderId: number, status: OrderStatus) => {
    setIsLoading(true)
    setError(null)
    try {
      await orderService.changeStatus(orderId, status)
      // Refresh orders list
      await fetchOrders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar estado de la orden')
    } finally {
      setIsLoading(false)
    }
  }, [fetchOrders])

  const clearSelectedOrder = useCallback(() => {
    setSelectedOrder(null)
  }, [])

  return (
    <OrdersContext.Provider
      value={{
        orders,
        selectedOrder,
        isLoading,
        error,
        fetchOrders,
        fetchOrderById,
        fetchOrdersByTable,
        changeOrderStatus,
        clearSelectedOrder,
      }}
    >
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (!context) {
    throw new Error('useOrders must be used within an OrdersProvider')
  }
  return context
}
