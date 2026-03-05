import axios from '../../../lib/axios'
import { API_ENDPOINTS } from '../../../config/api'
import type { InventoryDto, InventoryResponseDto } from '../../../types'

/**
 * Inventory Service - Manages stock levels for ingredients
 */
export const inventoryService = {
  /**
   * Get all inventory items
   */
  getAll: async (): Promise<InventoryResponseDto[]> => {
    const response = await axios.get<InventoryResponseDto[]>(API_ENDPOINTS.INVENTORY.ALL)
    return response.data
  },

  /**
   * Get inventory by ingredient code
   */
  getByCode: async (code: string): Promise<InventoryResponseDto> => {
    const response = await axios.get<InventoryResponseDto>(API_ENDPOINTS.INVENTORY.BY_CODE(code))
    return response.data
  },

  /**
   * Create new inventory entry for an ingredient
   * @param data - { code: ingredient code, quantity: initial stock }
   */
  create: async (data: InventoryDto): Promise<InventoryResponseDto> => {
    const response = await axios.post<InventoryResponseDto>(API_ENDPOINTS.INVENTORY.SAVE, data)
    return response.data
  },

  /**
   * Add stock to an ingredient
   * @param code - Ingredient code
   * @param quantity - Amount to add
   */
  addStock: async (code: string, quantity: number): Promise<InventoryResponseDto> => {
    const response = await axios.patch<InventoryResponseDto>(
      API_ENDPOINTS.INVENTORY.ADD_STOCK(code, quantity)
    )
    return response.data
  },

  /**
   * Deduct stock from an ingredient
   * @param code - Ingredient code
   * @param quantity - Amount to deduct
   */
  deductStock: async (code: string, quantity: number): Promise<InventoryResponseDto> => {
    const response = await axios.patch<InventoryResponseDto>(
      API_ENDPOINTS.INVENTORY.DEDUCT_STOCK(code, quantity)
    )
    return response.data
  },

  /**
   * Delete inventory entry
   */
  delete: async (code: string): Promise<void> => {
    await axios.delete(API_ENDPOINTS.INVENTORY.DELETE(code))
  },
}
