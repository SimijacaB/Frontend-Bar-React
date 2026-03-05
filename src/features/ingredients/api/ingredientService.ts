import apiClient from '../../../lib/axios'
import { API_ENDPOINTS } from '../../../config/api'
import type { IngredientDto, CreateIngredientDto, UpdateIngredientDto } from '../../../types'

export const ingredientService = {
  /**
   * Obtiene todos los ingredientes
   */
  async getAll(): Promise<IngredientDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.INGREDIENTS.ALL)
    return response.data
  },

  /**
   * Obtiene un ingrediente por su ID
   */
  async getById(id: number): Promise<IngredientDto> {
    const response = await apiClient.get(API_ENDPOINTS.INGREDIENTS.BY_ID(id))
    return response.data
  },

  /**
   * Obtiene un ingrediente por su código
   */
  async getByCode(code: string): Promise<IngredientDto> {
    const response = await apiClient.get(API_ENDPOINTS.INGREDIENTS.BY_CODE(code))
    return response.data
  },

  /**
   * Crea un nuevo ingrediente
   */
  async create(ingredient: CreateIngredientDto): Promise<IngredientDto> {
    const response = await apiClient.post(API_ENDPOINTS.INGREDIENTS.SAVE, ingredient)
    return response.data
  },

  /**
   * Actualiza un ingrediente existente
   */
  async update(ingredient: UpdateIngredientDto): Promise<IngredientDto> {
    const response = await apiClient.put(API_ENDPOINTS.INGREDIENTS.UPDATE(ingredient.id), ingredient)
    return response.data
  },

  /**
   * Elimina un ingrediente por su código
   */
  async delete(code: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.INGREDIENTS.DELETE(code))
  },
}
