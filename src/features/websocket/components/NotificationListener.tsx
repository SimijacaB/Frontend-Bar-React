import { useEffect } from 'react'
import toast, { Toaster } from 'react-hot-toast'
import { Bell, X, Utensils, UserCheck, Clock, AlertTriangle } from 'lucide-react'
import { useWebSocket, type OrderNotification } from '../context/WebSocketContext'
import { useAuth } from '../../auth/context/AuthContext'

// Función helper para obtener el ícono según el tipo de notificación
function getNotificationIcon(type: OrderNotification['type']) {
  switch (type) {
    case 'NEW_ORDER':
      return <Utensils className="w-5 h-5" />
    case 'ORDER_ASSIGNED':
      return <UserCheck className="w-5 h-5" />
    case 'ORDER_STATUS_CHANGED':
      return <Clock className="w-5 h-5" />
    case 'ORDER_CANCELLED':
      return <AlertTriangle className="w-5 h-5" />
    default:
      return <Bell className="w-5 h-5" />
  }
}

// Función helper para obtener el color según el tipo
function getNotificationStyle(type: OrderNotification['type']) {
  switch (type) {
    case 'NEW_ORDER':
      return 'bg-green-500'
    case 'ORDER_ASSIGNED':
      return 'bg-blue-500'
    case 'ORDER_STATUS_CHANGED':
      return 'bg-yellow-500'
    case 'ORDER_CANCELLED':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(price)
}

interface NotificationToastProps {
  notification: OrderNotification
  onDismiss: () => void
}

function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const iconStyle = getNotificationStyle(notification.type)
  const icon = getNotificationIcon(notification.type)

  return (
    <div className="flex items-start gap-3 p-4 bg-white rounded-lg shadow-lg border-l-4 min-w-[320px] max-w-md">
      <div className={`p-2 rounded-full text-white ${iconStyle}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-semibold text-gray-800">
          {notification.type === 'NEW_ORDER' && 'Nueva Orden'}
          {notification.type === 'ORDER_ASSIGNED' && 'Orden Asignada'}
          {notification.type === 'ORDER_STATUS_CHANGED' && 'Estado Actualizado'}
          {notification.type === 'ORDER_CANCELLED' && 'Orden Cancelada'}
        </p>
        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
          <span className="font-medium">Mesa: {notification.tableNumber}</span>
          {notification.clientName && (
            <span>Cliente: {notification.clientName}</span>
          )}
          {notification.waiterUserName && (
            <span>Mesero: {notification.waiterUserName}</span>
          )}
        </div>
        
        {/* Mostrar productos si existen */}
        {notification.items && notification.items.length > 0 && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-600">Productos:</p>
            <div className="mt-1 max-h-20 overflow-y-auto">
              {notification.items.slice(0, 3).map((item, idx) => (
                <div key={idx} className="text-xs text-gray-600 flex justify-between">
                  <span>{item.quantity}x {item.productName}</span>
                  <span className="text-gray-500">{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
              {notification.items.length > 3 && (
                <p className="text-xs text-gray-500">+{notification.items.length - 3} más...</p>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-2">
          <span className="text-emerald-600 font-bold text-sm">
            Total: {formatPrice(notification.valueToPay)}
          </span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

// Componente toast custom
function customToast(notification: OrderNotification) {
  const id = `notification-${notification.orderId}-${notification.type}-${Date.now()}`
  
  toast.custom(
    (t) => (
      <div className={t.visible ? 'animate-enter' : 'animate-leave'}>
        <NotificationToast 
          notification={notification} 
          onDismiss={() => toast.dismiss(id)} 
        />
      </div>
    ),
    {
      id,
      duration: 6000,
      position: 'top-right',
    }
  )
}

export function NotificationListener() {
  const { isConnected, subscribeToTopic } = useWebSocket()
  const { user } = useAuth()

  useEffect(() => {
    if (!isConnected || !user) return

    const role = user.roles?.[0] || 'ADMIN'
    const username = user.username

    // Determinar a qué topics suscribirse según el rol
    const topics: string[] = []

    // Todos reciben notificaciones de nuevas órdenes
    topics.push('/topic/admin/orders')
    
    // Meseros reciben notificaciones
    if (role === 'WAITER') {
      topics.push('/topic/waiter/orders')
      // Suscribirse a notificaciones específicas del mesero
      topics.push(`/topic/waiter/${username}/orders`)
    }

    // Bartender y Chef también reciben
    if (role === 'BARTENDER') {
      topics.push('/topic/bartender/orders')
    }
    if (role === 'CHEF') {
      topics.push('/topic/chef/orders')
    }

    // Crear unsubscribes
    const unsubscribes = topics.map(topic => 
      subscribeToTopic(topic, (notification) => {
        console.log('Notificación recibida:', notification)
        customToast(notification)
      })
    )

    return () => {
      unsubscribes.forEach(unsub => unsub())
    }
  }, [isConnected, user, subscribeToTopic])

  return null
}

// Componente Toaster para renderizar los toasts
export function NotificationToaster() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        // Default options for all toasts
        duration: 5000,
        style: {
          background: '#fff',
          color: '#fff',
        },
        // Custom default component
        iconTheme: {
          primary: '#10b981',
          secondary: '#fff',
        },
      }}
    />
  )
}

// Componente que muestra el estado de conexión
export function ConnectionStatus() {
  const { isConnected } = useWebSocket()

  return (
    <div className={`flex items-center gap-2 text-xs ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
      {isConnected ? 'Conectado' : 'Desconectado'}
    </div>
  )
}