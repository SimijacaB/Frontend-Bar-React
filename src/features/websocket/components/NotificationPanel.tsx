import { useState } from 'react'
import type { FC } from 'react'
import { Bell, X, Clock, MapPin, User, Utensils, AlertCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { useWebSocket, type OrderNotification } from '../context/WebSocketContext'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

interface NotificationPanelProps {
  isOpen: boolean
  onClose: () => void
}

const NotificationPanel: FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { notifications, clearNotifications } = useWebSocket()
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null)

  if (!isOpen) return null

  const getNotificationIcon = (type: OrderNotification['type']) => {
    switch (type) {
      case 'NEW_ORDER':
        return <Utensils className="w-4 h-4" />
      case 'ORDER_ASSIGNED':
        return <User className="w-4 h-4" />
      case 'ORDER_STATUS_CHANGED':
        return <Clock className="w-4 h-4" />
      case 'ORDER_CANCELLED':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  const getNotificationColor = (type: OrderNotification['type']) => {
    switch (type) {
      case 'NEW_ORDER':
        return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'ORDER_ASSIGNED':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'ORDER_STATUS_CHANGED':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      case 'ORDER_CANCELLED':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
    }
  }

  const getTypeLabel = (type: OrderNotification['type']) => {
    switch (type) {
      case 'NEW_ORDER':
        return 'Nueva orden'
      case 'ORDER_ASSIGNED':
        return 'Orden asignada'
      case 'ORDER_STATUS_CHANGED':
        return 'Estado actualizado'
      case 'ORDER_CANCELLED':
        return 'Orden cancelada'
      default:
        return 'Notificación'
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const toggleExpand = (orderId: number) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-start">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel - Left Side */}
      <div className="relative w-full max-w-sm bg-slate-900 border-r border-slate-700 shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="font-bold text-white">Notificaciones</h2>
              <p className="text-xs text-slate-400">{notifications.length} sin leer</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex gap-2 p-3 border-b border-slate-700">
            <button
              onClick={clearNotifications}
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Limpiar todo
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-4">
              <Bell className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-slate-400">No hay notificaciones</p>
              <p className="text-xs text-slate-500 mt-1">
                Las notificaciones de nuevas órdenes aparecerán aquí
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {notifications.map((notification, index) => (
                <div
                  key={`${notification.orderId}-${notification.type}-${index}`}
                  className={`p-4 hover:bg-slate-800/50 transition-colors ${
                    expandedOrder === notification.orderId ? 'bg-slate-800/30' : ''
                  }`}
                >
                  {/* Main notification content */}
                  <div 
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => toggleExpand(notification.orderId)}
                  >
                    <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${getNotificationColor(notification.type)}`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        <span className="text-xs text-slate-500">
                          {notification.date && formatDistanceToNow(new Date(notification.date), { addSuffix: true, locale: es })}
                        </span>
                      </div>
                      <p className="text-sm text-white mt-1 font-medium">{notification.message}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          Mesa {notification.tableNumber}
                        </span>
                        {notification.clientName && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {notification.clientName}
                          </span>
                        )}
                        <span className="text-emerald-400 font-medium">
                          {formatPrice(notification.valueToPay)}
                        </span>
                      </div>
                    </div>
                    <div className="text-slate-500">
                      {expandedOrder === notification.orderId ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>

                  {/* Expanded items */}
                  {expandedOrder === notification.orderId && notification.items && notification.items.length > 0 && (
                    <div className="mt-3 ml-11 p-3 bg-slate-800/50 rounded-lg">
                      <p className="text-xs font-medium text-slate-400 mb-2">Productos:</p>
                      <div className="space-y-1">
                        {notification.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-300">
                              {item.quantity}x {item.productName}
                            </span>
                            <span className="text-slate-400">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                      {notification.notes && (
                        <div className="mt-2 pt-2 border-t border-slate-700">
                          <p className="text-xs text-amber-400">📝 {notification.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default NotificationPanel