import apiClient from '../../../lib/axios'
import { API_ENDPOINTS } from '../../../config/api'
import type { ProductDto, ProductDetailDto, CreateProductDto } from '../../../types'
import type { Category } from '../../../types'

export const productService = {
  // Get all products
  async getAll(): Promise<ProductDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.ALL)
    return response.data
  },

  // Alias for customer menu
  getAllProducts: async (): Promise<ProductDto[]> => {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.ALL)
    return response.data
  },

  // Get product by ID
  async getById(id: number): Promise<ProductDetailDto> {
    const response = await apiClient.get(API_ENDPOINTS.PRODUCTS.BY_ID(id))
    return response.data
  },

  // Get product by code
  async getByCode(code: string): Promise<ProductDetailDto> {
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

  // Create new product
  async create(product: CreateProductDto): Promise<ProductDetailDto> {
    const response = await apiClient.post(API_ENDPOINTS.PRODUCTS.SAVE, product)
    return response.data
  },

  // Update product
  async update(product: Partial<ProductDetailDto> & { id: number }): Promise<ProductDetailDto> {
    const response = await apiClient.put(API_ENDPOINTS.PRODUCTS.UPDATE, product)
    return response.data
  },

  // Delete product
  async delete(code: string): Promise<void> {
    await apiClient.delete(API_ENDPOINTS.PRODUCTS.DELETE(code))
  },
}
