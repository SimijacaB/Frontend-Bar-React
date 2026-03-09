// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090'

export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: `${API_BASE_URL}/api/auth/login`,
    ME: `${API_BASE_URL}/api/auth/me`,
    CHECK: `${API_BASE_URL}/api/auth/check`,
  },

  // Products
  PRODUCTS: {
    ALL: `${API_BASE_URL}/api/products`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/products/${id}`,
    BY_CODE: (code: string) => `${API_BASE_URL}/api/products/code/${code}`,
    BY_NAME: (name: string) => `${API_BASE_URL}/api/products/name/${name}`,
    BY_CATEGORY: (category: string) => `${API_BASE_URL}/api/products/category/${category}`,
    SEARCH: (name: string) => `${API_BASE_URL}/api/products/search/${name}`,
    SAVE: `${API_BASE_URL}/api/products`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/products/${id}`,
    DELETE: (code: string) => `${API_BASE_URL}/api/products/code/${code}`,
    TOGGLE_ACTIVE: (id: number) => `${API_BASE_URL}/api/products/${id}/active`,
  },

  // Orders
  ORDERS: {
    ALL: `${API_BASE_URL}/api/orders`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/orders/${id}`,
    BY_CLIENT: (name: string) => `${API_BASE_URL}/api/orders/client/${name}`,
    BY_TABLE: (tableNumber: number) => `${API_BASE_URL}/api/orders/table/${tableNumber}`,
    BY_WAITER: (id: string) => `${API_BASE_URL}/api/orders/waiter/${id}`,
    BY_DATE: (date: string) => `${API_BASE_URL}/api/orders/date/${date}`,
    BY_DATE_RANGE: `${API_BASE_URL}/api/orders/date-range`,
    MY_ORDERS: `${API_BASE_URL}/api/orders/mine`,
    MY_ORDERS_DATE_RANGE: `${API_BASE_URL}/api/orders/mine/date-range`,
    MY_ASSIGNED: `${API_BASE_URL}/api/orders/mine/assigned`,
    UNASSIGNED: `${API_BASE_URL}/api/orders/unassigned`,
    ASSIGN_WAITER: (orderId: number, waiterUsername: string) =>
      `${API_BASE_URL}/api/orders/${orderId}/waiter/${waiterUsername}`,
    SAVE: `${API_BASE_URL}/api/orders`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/orders/${id}`,
    ADD_ITEM: (orderId: number) => `${API_BASE_URL}/api/orders/${orderId}/items`,
    REMOVE_ITEM: (orderId: number, itemId: number, qty: number) =>
      `${API_BASE_URL}/api/orders/${orderId}/items/${itemId}?quantity=${qty}`,
    CHANGE_STATUS: (orderId: number) => `${API_BASE_URL}/api/orders/${orderId}/status`,
    GROUPED_BY_CLIENT: (tableNumber: number) =>
      `${API_BASE_URL}/api/orders/table/${tableNumber}/grouped-by-client`,
    DELETE: (id: number) => `${API_BASE_URL}/api/orders/${id}`,
  },

  // Bills
  BILLS: {
    ALL: `${API_BASE_URL}/api/bills`,
    BY_TABLE: (tableNumber: number, clientName: string) =>
      `${API_BASE_URL}/api/bills/table/${tableNumber}/${clientName}`,
    BY_CLIENT: (clientName: string) => `${API_BASE_URL}/api/bills/client/${clientName}`,
    BY_SELECTION: `${API_BASE_URL}/api/bills/selection`,
    DOWNLOAD_PDF: (billId: number) => `${API_BASE_URL}/api/bills/${billId}/pdf`,
  },

  // Inventory (Stock)
  INVENTORY: {
    ALL: `${API_BASE_URL}/api/inventory`,
    BY_CODE: (code: string) => `${API_BASE_URL}/api/inventory/${code}`,
    SAVE: `${API_BASE_URL}/api/inventory`,
    ADD_STOCK: (code: string, quantity: number) => `${API_BASE_URL}/api/inventory/${code}/add-stock?quantity=${quantity}`,
    DEDUCT_STOCK: (code: string, quantity: number) => `${API_BASE_URL}/api/inventory/${code}/deduct-stock?quantity=${quantity}`,
    DELETE: (code: string) => `${API_BASE_URL}/api/inventory/${code}`,
  },

  // Ingredients
  INGREDIENTS: {
    ALL: `${API_BASE_URL}/api/ingredients`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/ingredients/${id}`,
    BY_CODE: (code: string) => `${API_BASE_URL}/api/ingredients/code/${code}`,
    SAVE: `${API_BASE_URL}/api/ingredients`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/ingredients/${id}`,
    DELETE: (code: string) => `${API_BASE_URL}/api/ingredients/code/${code}`,
  },

  // Order Tables (Mesas)
  TABLES: {
    ALL: `${API_BASE_URL}/api/tables`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/tables/${id}`,
    BY_NUMBER: (number: number) => `${API_BASE_URL}/api/tables/number/${number}`,
    BY_STATUS: (status: string) => `${API_BASE_URL}/api/tables/status/${status}`,
    CREATE: `${API_BASE_URL}/api/tables`,
    UPDATE: (id: number) => `${API_BASE_URL}/api/tables/${id}`,
    UPDATE_STATUS: (id: number) => `${API_BASE_URL}/api/tables/${id}/status`,
    DELETE: (id: number) => `${API_BASE_URL}/api/tables/${id}`,
  },

  // Waiters (Meseros)
  WAITERS: {
    ALL: `${API_BASE_URL}/api/waiters`,
    WITH_ORDERS: `${API_BASE_URL}/api/waiters`,
  },
} as const

export default API_BASE_URL
