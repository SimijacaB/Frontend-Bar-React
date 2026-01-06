import { useState, useEffect, type FC } from 'react'
import { X, Plus, Minus, Search, ShoppingCart, Trash2 } from 'lucide-react'
import Button from '../../../components/ui/Button'
import { Input } from '../../../components/ui'
import { productService } from '../../products/api/productService'
import { orderService } from '../api/orderService'
import type { ProductDto } from '../../../types'
import toast from 'react-hot-toast'

interface CreateOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onOrderCreated: () => void
}

interface CartItem {
  product: ProductDto
  quantity: number
}

export const CreateOrderModal: FC<CreateOrderModalProps> = ({
  isOpen,
  onClose,
  onOrderCreated,
}) => {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [filteredProducts, setFilteredProducts] = useState<ProductDto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [clientName, setClientName] = useState('')
  const [tableNumber, setTableNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])

  // Load products on mount
  useEffect(() => {
    if (isOpen) {
      loadProducts()
    }
  }, [isOpen])

  // Filter products by search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredProducts(products)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredProducts(
        products.filter(
          (p) =>
            p.name.toLowerCase().includes(term) ||
            p.category?.toLowerCase().includes(term)
        )
      )
    }
  }, [searchTerm, products])

  const loadProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const data = await productService.getAll()
      setProducts(data)
      setFilteredProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
      toast.error('Error al cargar productos')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const addToCart = (product: ProductDto) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  const getTotal = () => {
    return cart.reduce(
      (sum, item) => sum + (item.product.price || 0) * item.quantity,
      0
    )
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const handleSubmit = async () => {
    // Validations
    if (!tableNumber || isNaN(Number(tableNumber))) {
      toast.error('Ingresa un número de mesa válido')
      return
    }

    if (cart.length === 0) {
      toast.error('Agrega al menos un producto a la orden')
      return
    }

    setIsCreating(true)
    try {
      // Usar createOrder que ya tiene el formato correcto para el backend
      await orderService.createOrder({
        customerName: clientName || '',
        tableNumber: Number(tableNumber),
        notes: notes || undefined,
        products: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
      })

      toast.success('Orden creada exitosamente')
      onOrderCreated()
      handleClose()
    } catch (error) {
      console.error('Error creating order:', error)
      toast.error('Error al crear la orden')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setClientName('')
    setTableNumber('')
    setNotes('')
    setCart([])
    setSearchTerm('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 rounded-2xl w-full max-w-4xl border border-slate-700 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-white">Nueva Orden</h3>
            <p className="text-slate-400 text-sm">Crea una nueva orden para una mesa</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left: Products */}
          <div className="flex-1 p-6 border-r border-slate-700 overflow-y-auto">
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
              </div>
            </div>

            {isLoadingProducts ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="text-slate-400 mt-2">Cargando productos...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="p-3 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{product.name}</p>
                        <p className="text-slate-400 text-xs mt-0.5">{product.category}</p>
                      </div>
                      <Plus className="w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <p className="text-emerald-400 font-semibold mt-2">
                      {formatPrice(product.price || 0)}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Cart & Form */}
          <div className="w-80 p-6 flex flex-col overflow-y-auto">
            {/* Order Info */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-slate-400 text-sm mb-1">
                  Número de Mesa *
                </label>
                <Input
                  type="number"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ej: 5"
                  min={1}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">
                  Nombre del Cliente
                </label>
                <Input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Notas</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Instrucciones especiales..."
                  className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Cart */}
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingCart className="w-4 h-4 text-emerald-400" />
                <span className="text-white font-medium">
                  Carrito ({cart.length})
                </span>
              </div>

              {cart.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-slate-500 text-sm text-center">
                    Haz clic en los productos para agregarlos
                  </p>
                </div>
              ) : (
                <div className="flex-1 space-y-2 overflow-y-auto">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-3 bg-slate-800/50 rounded-xl border border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white text-sm font-medium flex-1 min-w-0 truncate">
                          {item.product.name}
                        </p>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1 hover:bg-slate-700 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3 text-white" />
                          </button>
                          <span className="text-white text-sm w-6 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="w-6 h-6 flex items-center justify-center bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3 text-white" />
                          </button>
                        </div>
                        <span className="text-emerald-400 text-sm font-semibold">
                          {formatPrice((item.product.price || 0) * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-400">Total</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {formatPrice(getTotal())}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-700 flex gap-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={isCreating || cart.length === 0}
            className="flex-1"
          >
            {isCreating ? 'Creando...' : 'Crear Orden'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default CreateOrderModal
