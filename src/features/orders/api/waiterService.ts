import apiClient from '../../../lib/axios'
import { API_ENDPOINTS } from '../../../config/api'

export interface WaiterWithOrdersDto {
  username: string
  email: string
  activeOrdersCount: number
}

export const waiterService = {
  /**
   * Obtiene todos los meseros activos con su cantidad de órdenes activas.
   * Ordenados por cantidad de órdenes (menor primero).
   * Solo accesible por ADMIN.
   */
  async getWaitersWithOrders(): Promise<WaiterWithOrdersDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.WAITERS.WITH_ORDERS)
    return response.data
  },
}
