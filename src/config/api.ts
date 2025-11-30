// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090'

export const API_ENDPOINTS = {
  // Products
  PRODUCTS: {
    ALL: `${API_BASE_URL}/api/product/all`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/product/${id}`,
    BY_CODE: (code: string) => `${API_BASE_URL}/api/product/find-by-code/${code}`,
    BY_NAME: (name: string) => `${API_BASE_URL}/api/product/find-by-name/${name}`,
    BY_CATEGORY: (category: string) => `${API_BASE_URL}/api/product/find-by-category/${category}`,
    SAVE: `${API_BASE_URL}/api/product/save`,
    UPDATE: `${API_BASE_URL}/api/product/update`,
    DELETE: (code: string) => `${API_BASE_URL}/api/product/delete/${code}`,
  },

  // Orders
  ORDERS: {
    ALL: `${API_BASE_URL}/api/order/all`,
    BY_ID: (id: number) => `${API_BASE_URL}/api/order/find-by-id/${id}`,
    BY_CLIENT: (name: string) => `${API_BASE_URL}/api/order/find-by-client-name/${name}`,
    BY_TABLE: (tableNumber: number) => `${API_BASE_URL}/api/order/find-by-table-number/${tableNumber}`,
    BY_WAITER: (id: string) => `${API_BASE_URL}/api/order/find-by-waiter-id/${id}`,
    BY_DATE: (date: string) => `${API_BASE_URL}/api/order/find-by-date/${date}`,
    SAVE: `${API_BASE_URL}/api/order/save`,
    UPDATE: `${API_BASE_URL}/api/order/update`,
    ADD_ITEM: (orderId: number) => `${API_BASE_URL}/api/order/add-order-item/${orderId}`,
    REMOVE_ITEM: (orderId: number, itemId: number, qty: number) =>
      `${API_BASE_URL}/api/order/remove-order-item/${orderId}/${itemId}/${qty}`,
    CHANGE_STATUS: (orderId: number, status: string) =>
      `${API_BASE_URL}/api/order/change-status/${orderId}/${status}`,
    DELETE: (id: number) => `${API_BASE_URL}/api/order/delete/${id}`,
  },

  // Bills
  BILLS: {
    ALL: `${API_BASE_URL}/api/bill/all`,
    BY_TABLE: (tableNumber: number, clientName: string) =>
      `${API_BASE_URL}/api/bill/save/by-table/${tableNumber}/${clientName}`,
    BY_CLIENT: (clientName: string) => `${API_BASE_URL}/api/bill/save/by-client/${clientName}`,
    BY_SELECTION: `${API_BASE_URL}/api/bill/save/by-selection`,
    DOWNLOAD_PDF: (billId: number) => `${API_BASE_URL}/api/bill/download-pdf/${billId}`,
  },

  // Inventory
  INVENTORY: {
    ALL: `${API_BASE_URL}/api/inventory/all`,
  },

  // Ingredients
  INGREDIENTS: {
    ALL: `${API_BASE_URL}/api/ingredient/all`,
  },
} as const

export default API_BASE_URL
