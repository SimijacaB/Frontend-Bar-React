import axios from 'axios'
import API_BASE_URL from '../config/api'

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
})

// Request interceptor for adding auth token (Basic Auth)
apiClient.interceptors.request.use(
  (config) => {
    // Only add auth token if Authorization header is not already set
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('authToken')
      if (token) {
        // Token is already Base64 encoded credentials for Basic Auth
        config.headers.Authorization = `Basic ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - clear storage but don't redirect automatically
      // Let the component handle the redirect
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export default apiClient
