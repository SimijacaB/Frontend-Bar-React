import type { FC } from 'react'
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const Badge: FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const variantClasses = {
    default: 'bg-slate-700 text-slate-300',
    success: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  }

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  )
}

// Order Status Badge
interface OrderStatusBadgeProps {
  status: string
  className?: string
}

const OrderStatusBadge: FC<OrderStatusBadgeProps> = ({ status, className = '' }) => {
  const statusConfig: Record<string, { variant: BadgeProps['variant']; label: string; icon: React.ReactNode }> = {
    PENDING: { variant: 'warning', label: 'Pendiente', icon: <AlertCircle className="w-3 h-3 mr-1" /> },
    IN_PROGRESS: { variant: 'info', label: 'En preparación', icon: <Info className="w-3 h-3 mr-1" /> },
    READY: { variant: 'success', label: 'Listo', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    DELIVERED: { variant: 'default', label: 'Entregado', icon: <CheckCircle className="w-3 h-3 mr-1" /> },
    CANCELLED: { variant: 'danger', label: 'Cancelado', icon: <XCircle className="w-3 h-3 mr-1" /> },
  }

  const config = statusConfig[status] || { variant: 'default', label: status, icon: null }

  return (
    <Badge variant={config.variant} className={`${className}`}>
      {config.icon}
      {config.label}
    </Badge>
  )
}

export { Badge, OrderStatusBadge }
