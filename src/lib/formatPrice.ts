/**
 * Formatea un precio en Pesos Colombianos (COP)
 * @param price - El precio a formatear
 * @returns El precio formateado como string (ej: "$15.000")
 */
export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null || isNaN(price)) return '$0'
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Formatea un precio en COP con decimales si es necesario
 * @param price - El precio a formatear
 * @returns El precio formateado como string
 */
export const formatPriceWithDecimals = (price: number | undefined | null): string => {
  if (price === undefined || price === null || isNaN(price)) return '$0'
  
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}
