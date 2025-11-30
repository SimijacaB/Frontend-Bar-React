const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export type ProductDto = {
  id: number | string
  name: string
  price: number
  description?: string
  category?: string
}

export async function fetchProducts(): Promise<ProductDto[]> {
  const res = await fetch(`${API_BASE}/api/product/all`)
  if (!res.ok) throw new Error(`Error fetching products: ${res.status}`)
  return res.json()
}

export async function fetchProductsByCategory(category: string): Promise<ProductDto[]> {
  const res = await fetch(`${API_BASE}/api/product/find-by-category/${encodeURIComponent(category)}`)
  if (!res.ok) throw new Error(`Error fetching products by category: ${res.status}`)
  return res.json()
}
