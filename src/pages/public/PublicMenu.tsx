import { useState, useMemo, useEffect, type FC } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Wine, Beer, GlassWater, Grape, Search, Loader2, 
  ShoppingCart, Plus, Minus, Send, X, User,
  Trash2, ArrowLeft, Home
} from 'lucide-react'
import toast from 'react-hot-toast'
import { productService } from '../../features/products/api/productService'
import { orderService } from '../../features/orders/api/orderService'
import type { ProductDto } from '../../types'
import { Category } from '../../types'
import { formatPrice } from '../../lib/formatPrice'

// Iconos por categoría
const categoryIcons: Record<string, React.ReactNode> = {
  [Category.COCKTAILS]: <Wine className="w-5 h-5" />,
  [Category.BEER]: <Beer className="w-5 h-5" />,
  [Category.WINE]: <Grape className="w-5 h-5" />,
  [Category.JUICES]: <GlassWater className="w-5 h-5" />,
}

const categoryLabels: Record<string, string> = {
  [Category.COCKTAILS]: 'Cócteles',
  [Category.BEER]: 'Cervezas',
  [Category.WINE]: 'Vinos',
  [Category.JUICES]: 'Jugos',
}

const categoryColors: Record<string, string> = {
  [Category.COCKTAILS]: 'from-pink-500 to-rose-500',
  [Category.BEER]: 'from-amber-500 to-yellow-500',
  [Category.WINE]: 'from-purple-500 to-violet-500',
  [Category.JUICES]: 'from-green-500 to-emerald-500',
}

interface CartItem {
  product: ProductDto
  quantity: number
}

const PublicMenuPage: FC = () => {
  const { mesa } = useParams<{ mesa: string }>()
  const navigate = useNavigate()
  
  // Parse table number from URL (QR) - can be null if accessed directly via /carta
  const tableFromUrl = mesa ? parseInt(mesa, 10) : null

  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [selectedTable, setSelectedTable] = useState<number | null>(tableFromUrl)
  const [submitting, setSubmitting] = useState(false)

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productService.getAll()
        setProducts(data.filter(p => p.available !== false))
      } catch (err) {
        setError('load_error')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadProducts()
  }, [])

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = !selectedCategory || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  // Agrupar por categoría
  const groupedProducts = useMemo(() => {
    const grouped: Record<string, ProductDto[]> = {}
    const order = [Category.COCKTAILS, Category.BEER, Category.WINE, Category.JUICES]
    
    order.forEach(cat => {
      grouped[cat] = []
    })
    
    filteredProducts.forEach(product => {
      const cat = product.category || 'OTHER'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(product)
    })
    
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) delete grouped[key]
    })
    
    return grouped
  }, [filteredProducts])

  const categories = [...new Set(products.map(p => p.category))]

  // Cart functions
  const addToCart = (product: ProductDto) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id)
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { product, quantity: 1 }]
    })
    toast.success(`${product.name} agregado`)
  }

  const updateQuantity = (productId: number, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta
          return newQty > 0 ? { ...item, quantity: newQty } : item
        }
        return item
      }).filter(item => item.quantity > 0)
    })
  }

  const removeFromCart = (productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId))
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.product.price || 0) * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Handle checkout click
  const handleCheckoutClick = () => {
    setIsCartOpen(false)
    setIsCheckoutOpen(true)
  }

  // Submit order
  const handleSubmitOrder = async () => {
    if (!customerName.trim()) {
      toast.error('Por favor ingresa tu nombre')
      return
    }
    if (customerName.trim().length < 4) {
      toast.error('El nombre debe tener al menos 4 caracteres')
      return
    }
    if (cart.length === 0) {
      toast.error('Tu carrito está vacío')
      return
    }
    if (!selectedTable || selectedTable <= 0) {
      toast.error('Por favor selecciona tu mesa')
      return
    }

    setSubmitting(true)
    try {
      const orderData = {
        tableNumber: selectedTable,
        customerName: customerName.trim(),
        products: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      }

      await orderService.createOrder(orderData)
      
      toast.success('¡Pedido enviado!')
      setCart([])
      setCustomerName('')
      setIsCheckoutOpen(false)
      navigate(`/pedido-confirmado/${selectedTable}`)
    } catch (err: unknown) {
      console.error('Error creating order:', err)
      toast.error('Error al enviar el pedido')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando menú...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-400 mb-4">No se pudo cargar el menú</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate('/')} className="p-2 hover:bg-slate-800 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-white">Project Bar</h1>
                {tableFromUrl ? (
                  <p className="text-emerald-400 text-sm font-medium">Mesa {tableFromUrl}</p>
                ) : (
                  <p className="text-slate-400 text-sm">Nuestra Carta</p>
                )}
              </div>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-emerald-500 rounded-full text-white shadow-lg"
            >
              <ShoppingCart className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar bebida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
        
        {/* Category Pills */}
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                !selectedCategory
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === cat
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {categoryIcons[cat]}
                {categoryLabels[cat] || cat}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Menu Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
          <section key={category} className="mb-8">
            {/* Category Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${categoryColors[category] || 'from-slate-500 to-slate-600'} flex items-center justify-center text-white shadow-lg`}>
                {categoryIcons[category] || <Wine className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {categoryLabels[category] || category}
                </h2>
                <p className="text-slate-500 text-xs">
                  {categoryProducts.length} {categoryProducts.length === 1 ? 'opción' : 'opciones'}
                </p>
              </div>
            </div>

            {/* Products */}
            <div className="space-y-3">
              {categoryProducts.map((product) => {
                const cartItem = cart.find(item => item.product.id === product.id)
                
                return (
                  <article 
                    key={product.id}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg truncate">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent mt-2 inline-block">
                          {formatPrice(product.price || 0)}
                        </span>
                      </div>
                      
                      {/* Add to cart controls */}
                      <div className="flex-shrink-0">
                        {cartItem ? (
                          <div className="flex items-center gap-2 bg-slate-700/50 rounded-lg p-1">
                            <button
                              onClick={() => updateQuantity(product.id, -1)}
                              className="p-2 text-white hover:bg-slate-600 rounded-lg"
                            >
                              <Minus className="w-4 h-4" />
                            </button>
                            <span className="text-white font-medium w-6 text-center">{cartItem.quantity}</span>
                            <button
                              onClick={() => updateQuantity(product.id, 1)}
                              className="p-2 text-white hover:bg-slate-600 rounded-lg"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(product)}
                            className="p-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Wine className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No se encontraron bebidas</p>
          </div>
        )}
      </main>

      {/* Floating Cart Button */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-30 max-w-2xl mx-auto">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-medium flex items-center justify-center gap-3 shadow-xl"
          >
            <ShoppingCart className="w-5 h-5" />
            Ver carrito ({cartCount}) - {formatPrice(cartTotal)}
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Tu Pedido</h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-slate-800 rounded-lg">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl">
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{item.product.name}</h4>
                        <p className="text-emerald-400 text-sm">{formatPrice(item.product.price || 0)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.product.id, -1)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product.id, 1)} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg">
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                        <button onClick={() => removeFromCart(item.product.id)} className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg ml-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-700 space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-slate-300">Total</span>
                  <span className="text-white font-bold">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  onClick={handleCheckoutClick}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Continuar con el pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setIsCheckoutOpen(false)} />
          <div className="relative bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-700 max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg">
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Confirmar Pedido</h3>
              <p className="text-slate-400 mt-1">Completa los datos para enviar</p>
            </div>

            <div className="space-y-4">
              {/* Table selector */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  📍 Número de mesa
                </label>
                {tableFromUrl ? (
                  <div className="w-full px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-medium">
                    Mesa {tableFromUrl}
                  </div>
                ) : (
                  <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <button
                        key={num}
                        onClick={() => setSelectedTable(num)}
                        className={`p-3 rounded-xl font-bold transition-all ${
                          selectedTable === num
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer name */}
              <div>
                <label className="block text-sm text-slate-400 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  Tu nombre
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Carlos"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                />
              </div>

              {/* Order summary */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Mesa</span>
                  <span className="font-medium text-white">{selectedTable || '-'}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Productos</span>
                  <span className="text-white font-medium">{cartCount} items</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-700">
                  <span className="text-slate-300">Total</span>
                  <span className="text-emerald-400 font-bold">{formatPrice(cartTotal)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmitOrder}
                disabled={submitting || !customerName.trim() || !selectedTable}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Pedido
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default PublicMenuPage
