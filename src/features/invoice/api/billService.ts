import apiClient from '../../../lib/axios'
import { API_ENDPOINTS } from '../../../config/api'
import type { BillDto, PagedResponse } from '../../../types'

export const billService = {
  // Get all bills (legacy - extrae content para compatibilidad)
  async getAll(): Promise<BillDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.BILLS.ALL, {
      params: { page: 0, size: 1000 }
    })
    // El backend ahora devuelve Page<BillDTO>, extraemos el content
    return response.data.content ?? response.data
  },

  // Get paginated bills with optional filters
  async getPaged(params?: {
    page?: number
    size?: number
    clientName?: string
    startDate?: string
    endDate?: string
  }): Promise<PagedResponse<BillDto>> {
    const response = await apiClient.get(API_ENDPOINTS.BILLS.ALL, {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 10,
        ...(params?.clientName ? { clientName: params.clientName } : {}),
        ...(params?.startDate ? { startDate: params.startDate } : {}),
        ...(params?.endDate ? { endDate: params.endDate } : {}),
      }
    })
    return response.data
  },

  // Generate bill by table number
  async generateByTable(tableNumber: number, clientName: string): Promise<BillDto> {
    const response = await apiClient.post(API_ENDPOINTS.BILLS.BY_TABLE(tableNumber, clientName))
    return response.data
  },

  // Generate bill by client name
  async generateByClient(clientName: string): Promise<BillDto> {
    const response = await apiClient.post(API_ENDPOINTS.BILLS.BY_CLIENT(clientName))
    return response.data
  },

  // Generate bill by order selection
  async generateBySelection(orderIds: number[]): Promise<BillDto> {
    const response = await apiClient.post(API_ENDPOINTS.BILLS.BY_SELECTION, { ordersId: orderIds })
    return response.data
  },

  // Download bill PDF
  async downloadPdf(billId: number): Promise<Blob> {
    const response = await apiClient.get(API_ENDPOINTS.BILLS.DOWNLOAD_PDF(billId), {
      responseType: 'blob',
    })
    return response.data
  },

  // Helper to trigger PDF download
  async downloadAndSavePdf(billId: number): Promise<void> {
    const blob = await this.downloadPdf(billId)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `factura_${billId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  },
}
