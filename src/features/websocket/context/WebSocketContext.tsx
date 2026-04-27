import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// Tipos de notificación que vienen del backend
export type NotificationType = 'NEW_ORDER' | 'ORDER_ASSIGNED' | 'ORDER_STATUS_CHANGED' | 'ORDER_CANCELLED'

// DTO para items de la orden
export interface OrderItemNotification {
  id: number
  productName: string
  quantity: number
  price: number
}

export interface OrderNotification {
  orderId: number
  clientName: string
  tableNumber: number
  valueToPay: number
  status: string
  waiterUserName: string | null
  notes: string | null
  date: string
  type: NotificationType
  message: string
  assignedTo: string | null
  items: OrderItemNotification[] // Lista de productos en la orden
}

interface WebSocketContextType {
  isConnected: boolean
  notifications: OrderNotification[]
  clearNotifications: () => void
  subscribeToTopic: (topic: string, callback: (notification: OrderNotification) => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

// URL del WebSocket - misma base que la API
const WS_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8090'}/ws`

// Generar sonido de notificación usando Web Audio API
const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    
    // Crear oscilador para el tono
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Configurar sonido (tono pleasant)
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
    oscillator.type = 'sine'
    
    // Volumen (fade out)
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    // Reproducir
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  } catch {
    console.log('Audio not supported')
  }
}

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [notifications, setNotifications] = useState<OrderNotification[]>([])

  // Inicializar cliente STOMP
  useEffect(() => {
    const token = localStorage.getItem('authToken')

    const stompClient = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      onConnect: () => {
        console.log('WebSocket conectado')
        setIsConnected(true)
      },
      onDisconnect: () => {
        console.log('WebSocket desconectado')
        setIsConnected(false)
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame.headers['message'])
      },
      onWebSocketError: (event) => {
        console.error('WebSocket error:', event)
      }
    })

    stompClient.activate()
    setClient(stompClient)

    return () => {
      if (stompClient.active) {
        stompClient.deactivate()
      }
    }
  }, [])

  // Agregar notificación a la lista
  const addNotification = useCallback((notification: OrderNotification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 50)) // Mantener máximo 50 notificaciones
    // Reproducir sonido cuando llega una notificación
    playNotificationSound()
  }, [])

  // Limpiar todas las notificaciones
  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  // Suscribirse a un topic
  const subscribeToTopic = useCallback((topic: string, callback: (notification: OrderNotification) => void) => {
    if (!client || !isConnected) {
      console.warn('WebSocket no conectado, no se puede suscribir al topic:', topic)
      return () => {}
    }

    const subscription = client.subscribe(topic, (message) => {
      try {
        const notification: OrderNotification = JSON.parse(message.body)
        callback(notification)
        addNotification(notification)
      } catch (error) {
        console.error('Error al parsear notificación:', error)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [client, isConnected, addNotification])

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      notifications,
      clearNotifications,
      subscribeToTopic
    }}>
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}