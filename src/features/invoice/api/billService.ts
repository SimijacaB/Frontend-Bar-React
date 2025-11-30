import apiClient from '../../../lib/axios'
import { API_ENDPOINTS } from '../../../config/api'
import type { BillDto } from '../../../types'

export const billService = {
  // Get all bills
  async getAll(): Promise<BillDto[]> {
    const response = await apiClient.get(API_ENDPOINTS.BILLS.ALL)
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
