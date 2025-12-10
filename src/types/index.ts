// Types based on backend DTOs

// Enums as const objects (compatible with isolatedModules)
export const Category = {
  BEER: 'BEER',
  WINE: 'WINE',
  COCKTAILS: 'COCKTAILS',
  JUICES: 'JUICES',
} as const

export type Category = typeof Category[keyof typeof Category]

export const OrderStatus = {
  PENDING: 'PENDING',
  READY: 'READY',
  IN_PROGRESS: 'IN_PROGRESS',
  CANCELLED: 'CANCELLED',
  DELIVERED: 'DELIVERED',
} as const

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus]

export const UserRole = {
  ADMIN: 'ADMIN',
  WAITER: 'WAITER',
  BARTENDER: 'BARTENDER',
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

// Product Types
export interface ProductDto {
  id: number
  name: string
  code?: string
  description?: string
  category: Category | string
  price?: number
  available?: boolean
}

export interface ProductDetailDto {
  id: number
  name: string
  code: string
  description?: string
  price: number
  photoId?: number
  isPrepared: boolean
  category: string
  ingredients: ProductIngredientDto[]
}

export interface ProductIngredientDto {
  id: number
  ingredientName: string
  quantity: number
  unitOfMeasure: string
}

export interface CreateProductDto {
  name: string
  code: string
  description?: string
  price: number
  isPrepared: boolean
  category: Category
}

// Order Types
export interface OrderDto {
  id: number
  clientName?: string
  customerName?: string  // Alias for API compatibility
  tableNumber?: number
  waiterUserName?: string
  notes?: string
  status: OrderStatus | string
  date?: string
  orderDate?: string  // Alias for API compatibility
  valueToPay?: number
  total?: number  // Alias for API compatibility
  products?: OrderProductDto[]  // Products in the order
}

export interface OrderProductDto {
  productId: number
  productName?: string
  quantity: number
  price?: number
}

export interface OrderDetailDto {
  id: number
  clientName?: string
  customerName?: string
  tableNumber?: number
  waiterUserName?: string
  notes?: string
  status: OrderStatus | string
  date?: string
  orderDate?: string
  valueToPay?: number
  total?: number
  orderItems?: OrderItemDto[]
  products?: OrderProductDto[]
}

export interface OrderItemDto {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface CreateOrderDto {
  clientName?: string
  tableNumber: number
  waiterId?: string
  notes?: string
  orderItems?: CreateOrderItemDto[]
  // For customer QR orders
  products?: Array<{
    idProduct: number
    quantity: number
  }>
}

export interface CreateOrderItemDto {
  productCode: string
  quantity: number
}

export interface UpdateOrderDto {
  id: number
  clientName?: string
  tableNumber?: number
  notes?: string
}

// Bill Types
export interface BillDto {
  id: number
  totalAmount: number
  date: string
  clientName: string
  orders: OrderDto[]
}

// Auth Types
export interface UserDto {
  username: string
  email: string
  roles: string[]  // Array of role names: "ADMIN", "WAITER", "BARTENDER", "CHEF"
}

export interface LoginRequest {
  username: string
  password: string
}

export interface AuthResponse {
  token: string
  user: UserDto
}

// Cart Types (Frontend only)
export interface CartItem {
  product: ProductDto
  quantity: number
  price: number
}

export interface Cart {
  items: CartItem[]
  tableNumber?: number
  clientName?: string
  total: number
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}
