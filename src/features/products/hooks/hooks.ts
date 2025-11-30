import { useEffect, useState, useCallback } from 'react'
import type { ProductDto } from '../../../types'
import { productService } from '../api/productService'

export function useProducts(category?: string) {
  const [data, setData] = useState<ProductDto[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const result = category
        ? await productService.getByCategory(category)
        : await productService.getAll()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar productos')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [category])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const refetch = useCallback(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

export function useProduct(id: number) {
  const [data, setData] = useState<ProductDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const fetchProduct = async () => {
      setLoading(true)
      try {
        const result = await productService.getById(id)
        if (mounted) {
          setData(result as unknown as ProductDto)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Error al cargar producto')
          setData(null)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchProduct()

    return () => {
      mounted = false
    }
  }, [id])

  return { data, loading, error }
}
