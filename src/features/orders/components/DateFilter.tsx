import { useState, useRef, useEffect, type FC } from 'react'
import { Calendar, ChevronDown, Check, List } from 'lucide-react'
import type { DateFilterType, DateFilterState } from '../utils/dateUtils'
import { formatDateForDisplay } from '../utils/dateUtils'

interface DateFilterProps {
  /** Estado actual del filtro */
  dateFilter: DateFilterState
  /** Callback cuando cambia el tipo de filtro */
  onFilterTypeChange: (type: DateFilterType) => void
  /** Callback cuando se selecciona una fecha específica */
  onSpecificDateChange: (date: Date) => void
  /** Si el usuario puede ver la opción de semana (solo admin) */
  showWeekOption?: boolean
  /** Clases adicionales para el contenedor */
  className?: string
}

interface FilterOption {
  type: DateFilterType
  label: string
  icon?: typeof Calendar
}

const filterOptions: FilterOption[] = [
  { type: 'all', label: 'Todas', icon: List },
  { type: 'today', label: 'Hoy' },
  { type: 'week', label: 'Esta semana' },
  { type: 'specific', label: 'Día específico', icon: Calendar },
]

/**
 * Componente de filtro de fecha para la vista de órdenes
 * Permite seleccionar: Hoy, Esta semana, o un día específico
 */
export const DateFilter: FC<DateFilterProps> = ({
  dateFilter,
  onFilterTypeChange,
  onSpecificDateChange,
  showWeekOption = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const dateInputRef = useRef<HTMLInputElement>(null)

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Opciones filtradas según el rol
  const availableOptions = filterOptions.filter(option => {
    if (option.type === 'week' && !showWeekOption) return false
    return true
  })

  const handleOptionClick = (option: FilterOption) => {
    if (option.type === 'specific') {
      // Abrir el date picker nativo
      setTimeout(() => dateInputRef.current?.showPicker?.(), 100)
    } else {
      onFilterTypeChange(option.type)
      setIsOpen(false)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value
    if (dateValue) {
      // Crear fecha en zona horaria local
      const [year, month, day] = dateValue.split('-').map(Number)
      const selectedDate = new Date(year, month - 1, day)
      onSpecificDateChange(selectedDate)
      setIsOpen(false)
    }
  }

  // Formatear fecha para el input (YYYY-MM-DD)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Botón principal del filtro */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 
                   border border-slate-600 rounded-xl text-white font-medium transition-all
                   focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
      >
        <Calendar className="w-4 h-4 text-emerald-400" />
        <span className="text-sm">{dateFilter.label}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Badge mostrando el rango de fechas */}
      {dateFilter.filterType !== 'today' && dateFilter.filterType !== 'all' && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 rounded-full">
          <span className="text-xs text-white font-medium">
            {dateFilter.filterType === 'week' ? 'Sem.' : formatDateForDisplay(dateFilter.dateRange.startDate)}
          </span>
        </div>
      )}

      {/* Dropdown de opciones */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-slate-800 border border-slate-700 
                        rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-2">
            {availableOptions.map((option) => (
              <button
                key={option.type}
                onClick={() => handleOptionClick(option)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg 
                           text-left transition-all ${
                  dateFilter.filterType === option.type
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.icon && <option.icon className="w-4 h-4" />}
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
                {dateFilter.filterType === option.type && (
                  <Check className="w-4 h-4 text-emerald-400" />
                )}
              </button>
            ))}
          </div>

          {/* Date picker oculto */}
          <input
            ref={dateInputRef}
            type="date"
            className="sr-only"
            value={dateFilter.specificDate ? formatDateForInput(dateFilter.specificDate) : ''}
            onChange={handleDateChange}
            max={formatDateForInput(new Date())} // No permitir fechas futuras
          />

          {/* Mostrar fecha seleccionada si es específica */}
          {dateFilter.filterType === 'specific' && dateFilter.specificDate && (
            <div className="px-4 py-3 border-t border-slate-700 bg-slate-900/50">
              <p className="text-xs text-slate-400 mb-1">Fecha seleccionada:</p>
              <p className="text-sm text-white font-medium">
                {formatDateForDisplay(dateFilter.specificDate)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default DateFilter
