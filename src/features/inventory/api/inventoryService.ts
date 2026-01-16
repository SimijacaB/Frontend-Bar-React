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
   * @param quantity - Amount to add
   * @param code - Ingredient code
   */
  addStock: async (quantity: number, code: string): Promise<InventoryResponseDto> => {
    const response = await axios.put<InventoryResponseDto>(
      API_ENDPOINTS.INVENTORY.ADD_STOCK(quantity, code)
    )
    return response.data
  },

  /**
   * Deduct stock from an ingredient
   * @param quantity - Amount to deduct
   * @param code - Ingredient code
   */
  deductStock: async (quantity: number, code: string): Promise<InventoryResponseDto> => {
    const response = await axios.put<InventoryResponseDto>(
      API_ENDPOINTS.INVENTORY.DEDUCT_STOCK(quantity, code)
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
