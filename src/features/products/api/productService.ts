import apiClient from '../../../lib/axios'
import { API_ENDPOINTS } from '../../../config/api'
import type { 
  ProductDto, 
  ProductResponseDto, 
  ProductRequestDto, 
  UpdateProductDto 
} from '../../../types'
import type { Category } from '../../../types'

export interface ProductForListDto {
  id: number
  name: string
  code: string
  price: number
  category: string
  isPrepared: boolean
  active: boolean
}

export const productService = {
  // Get all products
  async getAll(): Promise<ProductForListDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.ALL)
    return response.data
  },

  // Alias for customer menu
  getAllProducts: async (): Promise<ProductDto[]> => {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.ALL)
    return response.data
  },

  // Get product by ID (with full details including ingredients)
  async getById(id: number): Promise<ProductResponseDto> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_ID(id))
    return response.data
  },

  // Get product by code
  async getByCode(code: string): Promise<ProductResponseDto> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_CODE(code))
    return response.data
  },

  // Get products by name
  async getByName(name: string): Promise<ProductDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_NAME(name))
    return response.data
  },

  // Get products by category
  async getByCategory(category: Category | string): Promise<ProductDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_CATEGORY(category.toUpperCase()))
    return response.data
  },

  /**
   * Create new product
   * @param product - Product data including ingredients if isPrepared
   * 
   * Example product with ingredients:
   * {
   *   name: "Daiquiri",
   *   code: "D01-ML-0008P",
   *   description: "Coctel clasico de ron con limon y azucar",
   *   price: 4.50,
   *   photoId: 17,
   *   isPrepared: true,
   *   category: "COCKTAILS",
   *   ingredients: [
   *     { ingredientId: 7, amount: 50 },
   *     { ingredientId: 6, amount: 20 },
   *     { ingredientId: 39, amount: 10 }
   *   ]
   * }
   * 
   * Product without ingredients: ingredients: []
   */
  async create(product: ProductRequestDto): Promise<ProductResponseDto> {
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.SAVE, product)
    return response.data
  },

  // Update product
  async update(product: UpdateProductDto): Promise<ProductResponseDto> {
    const response = await apiClient.put(API_ENDPOINTS.PRODUCTS.UPDATE(product.id), product)
    return response.data
  },

  // Delete product
  async delete(code: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(code))
  },

  // Toggle product active/inactive
  async toggleActive(id: number): Promise<ProductResponseDto> {
    const response = await apiClient.patch(API_ENDPOINTS.PRODUCTS.TOGGLE_ACTIVE(id))
    return response.data
  },
}
