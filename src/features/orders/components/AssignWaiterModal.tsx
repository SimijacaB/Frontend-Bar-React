import { useState, useEffect, type FC } from 'react'
import { X, User, Package, AlertCircle } from 'lucide-react'
import { waiterService, type WaiterWithOrdersDto } from '../api/waiterService'
import { orderService } from '../api/orderService'
import type { OrderDto } from '../../../types'
import toast from 'react-hot-toast'

interface AssignWaiterModalProps {
  isOpen: boolean
  onClose: () => void
  order: OrderDto | null
  onAssigned: () => void
}

export const AssignWaiterModal: FC<AssignWaiterModalProps> = ({
  isOpen,
  onClose,
  order,
  onAssigned
}) => {
  const [waiters, setWaiters] = useState<WaiterWithOrdersDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [selectedWaiter, setSelectedWaiter] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadWaiters()
      setSelectedWaiter(null)
    }
  }, [isOpen])

  const loadWaiters = async () => {
    setIsLoading(true)
    try {
      const data = await waiterService.getWaitersWithOrders()
      setWaiters(data)
    } catch (error) {
      console.error('Error loading waiters:', error)
      toast.error('Error al cargar meseros')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!selectedWaiter || !order) return

    setIsAssigning(true)
    try {
      await orderService.assignWaiter(order.id, selectedWaiter)
      toast.success(`Orden asignada a ${selectedWaiter}`)
      onAssigned()
      onClose()
    } catch (error) {
      console.error('Error assigning waiter:', error)
      toast.error('Error al asignar mesero')
    } finally {
      setIsAssigning(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-2xl w-full max-w-md border border-slate-700 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-bold text-white">Asignar Mesero</h2>
            {order && (
              <p className="text-slate-400 text-sm mt-1">
                Orden #{order.id} - Mesa {order.tableNumber}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
            </div>
          ) : waiters.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
              <p className="text-slate-300">No hay meseros registrados</p>
              <p className="text-slate-500 text-sm mt-1">
                Registra meseros en el sistema para poder asignarles órdenes
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-400 mb-4">
                Selecciona un mesero ({waiters.length} disponible{waiters.length !== 1 ? 's' : ''}):
              </p>
              {waiters.map((waiter, index) => {
                const isFirstActive = index === 0 && waiter.active
                const isInactive = !waiter.active
                
                return (
                  <button
                    key={waiter.username}
                    onClick={() => !isInactive && setSelectedWaiter(waiter.username)}
                    disabled={isInactive}
                    className={`w-full p-4 rounded-xl border transition-all ${
                      isInactive
                        ? 'border-slate-700 bg-slate-800/50 opacity-50 cursor-not-allowed'
                        : selectedWaiter === waiter.username
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-slate-600 hover:border-slate-500 bg-slate-700/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isInactive 
                            ? 'bg-slate-700' 
                            : isFirstActive 
                              ? 'bg-emerald-500/20' 
                              : 'bg-slate-600'
                        }`}>
                          <User className={`w-5 h-5 ${
                            isInactive 
                              ? 'text-slate-500' 
                              : isFirstActive 
                                ? 'text-emerald-400' 
                                : 'text-slate-400'
                          }`} />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${isInactive ? 'text-slate-500' : 'text-white'}`}>
                              {waiter.username}
                            </p>
                            {isInactive && (
                              <span className="text-xs px-2 py-0.5 rounded bg-red-500/20 text-red-400">
                                Inactivo
                              </span>
                            )}
                          </div>
                          {waiter.email && (
                            <p className={`text-xs ${isInactive ? 'text-slate-600' : 'text-slate-400'}`}>
                              {waiter.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Package className={`w-4 h-4 ${isInactive ? 'text-slate-600' : 'text-slate-400'}`} />
                        <span className={`text-sm font-medium ${
                          isInactive
                            ? 'text-slate-600'
                            : waiter.activeOrdersCount === 0 
                              ? 'text-emerald-400' 
                              : waiter.activeOrdersCount <= 3 
                                ? 'text-amber-400' 
                                : 'text-red-400'
                        }`}>
                          {waiter.activeOrdersCount} orden{waiter.activeOrdersCount !== 1 ? 'es' : ''}
                        </span>
                      </div>
                    </div>
                    {isFirstActive && (
                      <div className="mt-2 text-xs text-emerald-400 text-left">
                        ⭐ Recomendado - Menos órdenes activas
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedWaiter || isAssigning}
            className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAssigning ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AssignWaiterModal
