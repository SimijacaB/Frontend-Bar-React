import apiClient from '../../../lib/axios'
import { API_ENDPOINTS } from '../../../config/api'
import type {
  OrderDto,
  OrderDetailDto,
  CreateOrderDto,
  UpdateOrderDto,
  CreateOrderItemDto,
} from '../../../types'
import type { OrderStatus } from '../../../types'

// Interface for customer order creation
interface CustomerOrderData {
  tableNumber: number
  customerName: string
  products: Array<{
    productId: number
    quantity: number
  }>
}

export const orderService = {
  // Get all orders
  getAllOrders: async (): Promise<OrderDto[]> => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.ALL)
    return response.data
  },

  // Alias for backwards compatibility
  getAll: async (): Promise<OrderDto[]> => {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.ALL)
    return response.data
  },

  // Get order by ID
  async getById(id: number): Promise<OrderDetailDto> {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_ID(id))
    return response.data
  },

  // Get orders by client name
  async getByClientName(name: string): Promise<OrderDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_CLIENT(name))
    return response.data
  },

  // Get orders by table number
  async getByTableNumber(tableNumber: number): Promise<OrderDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_TABLE(tableNumber))
    return response.data
  },

  // Get orders by waiter ID
  async getByWaiterId(waiterId: string): Promise<OrderDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_WAITER(waiterId))
    return response.data
  },

  // Get orders by date
  async getByDate(date: string): Promise<OrderDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.ORDERS.BY_DATE(date))
    return response.data
  },

  // Create new order (admin/staff)
  async create(order: CreateOrderDto): Promise<OrderDetailDto> {
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.SAVE, order)
    return response.data
  },

  // Create order from customer (via QR menu)
  createOrder: async (orderData: CustomerOrderData): Promise<OrderDetailDto> => {
    // Transform to backend format
    const payload: CreateOrderDto = {
      tableNumber: orderData.tableNumber,
      clientName: orderData.customerName,
      products: orderData.products.map(p => ({
        idProduct: p.productId,
        quantity: p.quantity
      }))
    }
    const response = await apiClient.post(API_ENDPOINTS.ORDERS.SAVE, payload)
    return response.data
  },

  // Update order
  async update(order: UpdateOrderDto): Promise<OrderDetailDto> {
    const response = await apiClient.put(API_ENDPOINTS.ORDERS.UPDATE, order)
    return response.data
  },

  // Add item to order
  async addItem(orderId: number, item: CreateOrderItemDto): Promise<OrderDetailDto> {
    const response = await apiClient.put(API_ENDPOINTS.ORDERS.ADD_ITEM(orderId), item)
    return response.data
  },

  // Remove item from order
  async removeItem(orderId: number, itemId: number, quantity: number): Promise<OrderDetailDto> {
    const response = await apiClient.put(API_ENDPOINTS.ORDERS.REMOVE_ITEM(orderId, itemId, quantity))
    return response.data
  },

  // Change order status
  async changeStatus(orderId: number, status: OrderStatus | string): Promise<OrderDetailDto> {
    const response = await apiClient.put(API_ENDPOINTS.ORDERS.CHANGE_STATUS(orderId, status))
    return response.data
  },

  // Update order status (alias for WaiterPanel)
  updateOrderStatus: async (orderId: number, status: string): Promise<OrderDetailDto> => {
    const response = await apiClient.put(API_ENDPOINTS.ORDERS.CHANGE_STATUS(orderId, status))
    return response.data
  },

  // Delete order
  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.ORDERS.DELETE(id))
  },
}
