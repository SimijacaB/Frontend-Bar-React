import apiClient from '../../../lib/axios'
import { API_ENDPOINTS } from '../../../config/api'

export interface TableDto {
  id: number
  number: number
  capacity: number
  status: 'FREE' | 'OCCUPIED' | 'RESERVED'
  notes?: string
  activeOrdersCount?: number
}

export interface TableRequestDto {
  number: number
  capacity: number
  notes?: string
}

export interface UpdateTableStatusDto {
  status: 'FREE' | 'OCCUPIED' | 'RESERVED'
}

export const tableService = {
  /**
   * Obtiene todas las mesas
   */
  async getAll(): Promise<TableDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.TABLES.ALL)
    return response.data
  },

  /**
   * Obtiene una mesa por su ID
   */
  async getById(id: number): Promise<TableDto> {
    const response = await apiClient.get(API_ENDPOINTS.TABLES.BY_ID(id))
    return response.data
  },

  /**
   * Obtiene una mesa por su número
   */
  async getByNumber(number: number): Promise<TableDto> {
    const response = await apiClient.get(API_ENDPOINTS.TABLES.BY_NUMBER(number))
    return response.data
  },

  /**
   * Obtiene todas las mesas por estado
   */
  async getByStatus(status: 'FREE' | 'OCCUPIED' | 'RESERVED'): Promise<TableDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.TABLES.BY_STATUS(status))
    return response.data
  },

  /**
   * Crea una nueva mesa (solo Admin)
   */
  async create(tableRequest: TableRequestDto): Promise<TableDto> {
    const response = await apiClient.post(API_ENDPOINTS.TABLES.CREATE, tableRequest)
    return response.data
  },

  /**
   * Actualiza una mesa (solo Admin)
   */
  async update(id: number, tableRequest: TableRequestDto): Promise<TableDto> {
    const response = await apiClient.put(API_ENDPOINTS.TABLES.UPDATE(id), tableRequest)
    return response.data
  },

  /**
   * Actualiza el estado de una mesa (Admin y Waiter)
   */
  async updateStatus(id: number, status: 'FREE' | 'OCCUPIED' | 'RESERVED'): Promise<TableDto> {
    const response = await apiClient.patch(API_ENDPOINTS.TABLES.UPDATE_STATUS(id), { status })
    return response.data
  },

  /**
   * Elimina una mesa (solo Admin)
   */
  async delete(id: number): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.TABLES.DELETE(id))
  },
}
