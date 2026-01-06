/**
 * Utilidades para manejo de fechas en el sistema de órdenes
 * Todas las fechas consideran la zona horaria local del sistema
 */

export type DateFilterType = 'all' | 'today' | 'week' | 'specific'

export interface DateRange {
  startDate: Date
  endDate: Date
}

export interface DateFilterState {
  filterType: DateFilterType
  specificDate?: Date
  dateRange: DateRange
  label: string
}

/**
 * Obtiene el inicio del día (00:00:00) para una fecha dada
 */
export const startOfDay = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

/**
 * Obtiene el fin del día (23:59:59.999) para una fecha dada
 */
export const endOfDay = (date: Date): Date => {
  const result = new Date(date)
  result.setHours(23, 59, 59, 999)
  return result
}

/**
 * Obtiene el rango de fechas para "Hoy"
 */
export const getTodayRange = (): DateRange => {
  const today = new Date()
  return {
    startDate: startOfDay(today),
    endDate: endOfDay(today)
  }
}

/**
 * Obtiene el inicio de la semana actual (Lunes)
 */
export const getStartOfWeek = (date: Date = new Date()): Date => {
  const result = new Date(date)
  const day = result.getDay()
  // Si es domingo (0), retrocedemos 6 días; si no, retrocedemos (día - 1) días
  const diff = day === 0 ? 6 : day - 1
  result.setDate(result.getDate() - diff)
  return startOfDay(result)
}

/**
 * Obtiene el fin de la semana actual (Domingo)
 */
export const getEndOfWeek = (date: Date = new Date()): Date => {
  const startOfWeek = getStartOfWeek(date)
  const result = new Date(startOfWeek)
  result.setDate(result.getDate() + 6)
  return endOfDay(result)
}

/**
 * Obtiene el rango de fechas para la semana actual (Lunes a Domingo)
 */
export const getCurrentWeekRange = (): DateRange => {
  return {
    startDate: getStartOfWeek(),
    endDate: getEndOfWeek()
  }
}

/**
 * Obtiene el rango de fechas para un día específico
 */
export const getSpecificDateRange = (date: Date): DateRange => {
  return {
    startDate: startOfDay(date),
    endDate: endOfDay(date)
  }
}

/**
 * Formatea una fecha a string ISO (YYYY-MM-DD) para enviar al backend
 */
export const formatDateForApi = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Formatea una fecha para mostrar al usuario
 */
export const formatDateForDisplay = (date: Date): string => {
  return date.toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Formatea un rango de fechas para mostrar al usuario
 */
export const formatDateRangeForDisplay = (range: DateRange): string => {
  const start = formatDateForDisplay(range.startDate)
  const end = formatDateForDisplay(range.endDate)
  
  if (start === end) {
    return start
  }
  
  return `${start} - ${end}`
}

/**
 * Obtiene la etiqueta para mostrar el filtro activo
 */
export const getFilterLabel = (filterType: DateFilterType, specificDate?: Date): string => {
  switch (filterType) {
    case 'all':
      return 'Todas'
    case 'today':
      return 'Hoy'
    case 'week':
      return 'Esta semana'
    case 'specific':
      return specificDate ? formatDateForDisplay(specificDate) : 'Día específico'
    default:
      return 'Hoy'
  }
}

/**
 * Obtiene el estado completo del filtro de fecha
 */
export const getDateFilterState = (
  filterType: DateFilterType,
  specificDate?: Date
): DateFilterState => {
  let dateRange: DateRange

  switch (filterType) {
    case 'all':
      // Para 'all', usamos un rango muy amplio (no se usa realmente)
      dateRange = {
        startDate: new Date(2000, 0, 1),
        endDate: new Date(2100, 11, 31)
      }
      break
    case 'today':
      dateRange = getTodayRange()
      break
    case 'week':
      dateRange = getCurrentWeekRange()
      break
    case 'specific':
      dateRange = specificDate 
        ? getSpecificDateRange(specificDate) 
        : getTodayRange()
      break
    default:
      dateRange = getTodayRange()
  }

  return {
    filterType,
    specificDate,
    dateRange,
    label: getFilterLabel(filterType, specificDate)
  }
}

/**
 * Verifica si una fecha está dentro de un rango
 */
export const isDateInRange = (date: Date | string, range: DateRange): boolean => {
  const dateToCheck = typeof date === 'string' ? new Date(date) : date
  return dateToCheck >= range.startDate && dateToCheck <= range.endDate
}

/**
 * Genera un array de fechas entre startDate y endDate (inclusive)
 */
export const getDatesBetween = (startDate: Date, endDate: Date): Date[] => {
  const dates: Date[] = []
  const currentDate = new Date(startDate)

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  return dates
}

/**
 * Verifica si dos fechas son el mismo día
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Verifica si una fecha es hoy
 */
export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date())
}

/**
 * Parsea una fecha string del backend (ISO) a Date
 */
export const parseBackendDate = (dateString: string): Date => {
  return new Date(dateString)
}
