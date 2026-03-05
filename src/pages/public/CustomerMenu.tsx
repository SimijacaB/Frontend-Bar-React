import { useState, useEffect, type FC } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Send,
  Search,
  Wine,
  Beer,
  GlassWater,
  Martini,
  X,
  User,
  Clock,
  CheckCircle,
  ChefHat,
  Package,
  QrCode,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react'
import toast from 'react-hot-toast'
import { productService } from '../../features/products/api/productService'
import { orderService } from '../../features/orders/api/orderService'
import { inventoryService } from '../../features/inventory/api/inventoryService'
import type { ProductDto, OrderDto, InventoryResponseDto, ProductResponseDto } from '../../types'
import { OrderStatus } from '../../types'
import { formatPrice } from '../../lib/formatPrice'
import { useAuth } from '../../features/auth/context/AuthContext'

// Category icons
const categoryIcons: Record<string, typeof Wine> = {
  WINE: Wine,
  BEER: Beer,
  JUICES: GlassWater,
  COCKTAILS: Martini,
}

const categoryLabels: Record<string, string> = {
  ALL: 'Todos',
  BEER: 'Cervezas',
  WINE: 'Vinos',
  COCKTAILS: 'Cócteles',
  JUICES: 'Jugos',
}

interface CartItem {
  product: ProductDto
  quantity: number
}

// Product with stock info
interface ProductWithStock extends ProductDto {
  hasStock: boolean
  stockWarning?: string
}

const CustomerMenu: FC = () => {
  const { mesa } = useParams<{ mesa: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  
  // Check if user is staff (waiter/admin) - they can see stock info
  const isStaff = isAuthenticated && (user?.roles?.includes('WAITER') || user?.roles?.includes('ADMIN'))
  
  // Only works if coming from QR (mesa param exists)
  const hasTableFromQR = !!mesa
  const tableNumber = mesa ? parseInt(mesa, 10) : 0

  // State
  const [products, setProducts] = useState<ProductWithStock[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [myOrders, setMyOrders] = useState<OrderDto[]>([])
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [inventory, setInventory] = useState<InventoryResponseDto[]>([])

  // Load products and inventory
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products
        const productsData = await productService.getAllProducts()
        
        // If staff, also fetch inventory to check stock
        let inventoryData: InventoryResponseDto[] = []
        let productDetails: ProductResponseDto[] = []
        
        if (isStaff) {
          try {
            inventoryData = await inventoryService.getAll()
            setInventory(inventoryData)
            
            // Fetch details for prepared products to get ingredients
            const detailsPromises = productsData.map(p => 
              productService.getById(p.id).catch(() => null)
            )
            productDetails = (await Promise.all(detailsPromises)).filter(Boolean) as ProductResponseDto[]
          } catch (err) {
            console.error('Error loading inventory:', err)
          }
        }
        
        // Map products with stock info
        const productsWithStock: ProductWithStock[] = productsData
          .filter(p => p.available !== false)
          .map(product => {
            // Default: has stock
            let hasStock = true
            let stockWarning: string | undefined
            
            if (isStaff && inventoryData.length > 0) {
              // Find product details (if prepared)
              const detail = productDetails.find(d => d?.id === product.id)
              
              if (detail?.isPrepared && detail.ingredients?.length > 0) {
                // Check if all ingredients have stock
                const missingIngredients: string[] = []
                
                for (const ing of detail.ingredients) {
                  const invItem = inventoryData.find(inv => 
                    inv.ingredientName?.toLowerCase() === ing.ingredientName?.toLowerCase() ||
                    inv.ingredientCode === product.code
                  )
                  
                  if (!invItem || invItem.quantity < ing.quantity) {
                    missingIngredients.push(ing.ingredientName)
                    hasStock = false
                  }
                }
                
                if (missingIngredients.length > 0) {
                  stockWarning = `Sin stock: ${missingIngredients.join(', ')}`
                }
              } else {
                // Non-prepared product - check direct inventory by product code
                const invItem = inventoryData.find(inv => inv.ingredientCode === product.code)
                if (invItem && invItem.quantity <= 0) {
                  hasStock = false
                  stockWarning = 'Sin stock disponible'
                }
              }
            }
            
            return { ...product, hasStock, stockWarning }
          })
        
        setProducts(productsWithStock)
      } catch (err) {
        console.error('Error loading products:', err)
        toast.error('Error al cargar el menú')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [isStaff])

  // Load orders for this table - only if coming from QR
  const fetchMyOrders = async () => {
    if (!hasTableFromQR || !tableNumber) {
      setMyOrders([])
      return
    }
    setLoadingOrders(true)
    try {
      // Use the specific endpoint: GET /api/orders/table/{tableNumber}
      const data = await orderService.getByTableNumber(tableNumber)
      console.log(`Fetched orders for table ${tableNumber}:`, data)
      setMyOrders(data)
    } catch (err) {
      console.error(`Error loading orders for table ${tableNumber}:`, err)
      setMyOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  // Load orders when opening the panel - only if has table from QR
  useEffect(() => {
    if (isOrdersOpen && hasTableFromQR) {
      fetchMyOrders()
    }
  }, [isOrdersOpen, tableNumber, hasTableFromQR])

  // Get unique categories
  const categories = ['ALL', ...new Set(products.map(p => p.category))]

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'ALL' || product.category === selectedCategory
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

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

    setSubmitting(true)
    try {
      // Create order with products
      const orderData = {
        tableNumber,
        customerName: customerName.trim(),
        products: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      }

      await orderService.createOrder(orderData)
      
      toast.success('¡Pedido enviado! Un mesero te atenderá pronto')
      setCart([])
      setCustomerName('')
      setIsCheckoutOpen(false)
      
      // Navigate to confirmation page for THIS table only
      const confirmationUrl = `/pedido-confirmado/${tableNumber}`
      console.log('Navigating to:', confirmationUrl)
      navigate(confirmationUrl)
    } catch (err: unknown) {
      console.error('Error creating order:', err)
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar el pedido'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Cargando menú...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Show QR prompt if no table from QR */}
      {!hasTableFromQR ? (
        <div className="min-h-screen flex flex-col">
          {/* Header */}
          <header className="bg-slate-900/95 border-b border-slate-700/50 px-4 py-4">
            <div className="flex items-center gap-3">
              <Link to="/bienvenido" className="p-2 hover:bg-slate-800 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-slate-400" />
              </Link>
              <div>
                <h1 className="text-lg font-bold text-white">Mi Pedido</h1>
                <p className="text-slate-500 text-xs">Consulta tus órdenes</p>
              </div>
            </div>
          </header>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="text-center max-w-sm">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <QrCode className="w-12 h-12 text-emerald-400" />
              </div>
              <h1 className="text-2xl font-bold text-white mb-3">Escanea el código QR</h1>
              <p className="text-slate-400 mb-6">
                Para hacer tu pedido, escanea el código QR que se encuentra en tu mesa.
              </p>
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-6">
                <p className="text-slate-500 text-sm">
                  El código QR contiene el número de tu mesa y te permitirá ver el menú y hacer pedidos.
                </p>
              </div>
              
              {/* Quick actions */}
              <div className="space-y-3">
                <Link
                  to="/carta"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium"
                >
                  <Wine className="w-5 h-5" />
                  Ver Carta Completa
                </Link>
                <Link
                  to="/bienvenido"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Volver al Inicio
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
      <>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-700/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-white">🍹 Bar Menu</h1>
              <p className="text-sm text-emerald-400">Mesa {tableNumber}</p>
            </div>
            <div className="flex items-center gap-2">
              {/* My Orders Button */}
              <button
                onClick={() => setIsOrdersOpen(true)}
                className="relative p-3 bg-amber-500 rounded-full text-white shadow-lg"
              >
                <Clock className="w-6 h-6" />
                {myOrders.filter(o => 
                  o.status !== OrderStatus.DELIVERED && 
                  o.status !== OrderStatus.CANCELLED &&
                  o.status !== 'BILLED'
                ).length > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                    {myOrders.filter(o => 
                      o.status !== OrderStatus.DELIVERED && 
                      o.status !== OrderStatus.CANCELLED &&
                      o.status !== 'BILLED'
                    ).length}
                  </span>
                )}
              </button>
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
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar bebida..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((cat) => {
              const Icon = categoryIcons[cat] || Wine
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat !== 'ALL' && <Icon className="w-4 h-4" />}
                  {categoryLabels[cat] || cat}
                </button>
              )
            })}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="p-4 pb-24">
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-400">No se encontraron productos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredProducts.map((product) => {
              const cartItem = cart.find(item => item.product.id === product.id)
              const productWithStock = product as ProductWithStock
              const hasStock = productWithStock.hasStock !== false
              
              return (
                <div
                  key={product.id}
                  className={`bg-slate-800/50 rounded-2xl p-3 border border-slate-700/50 relative ${
                    !hasStock && isStaff ? 'opacity-60' : ''
                  }`}
                >
                  {/* Out of Stock Badge - Only for staff */}
                  {!hasStock && isStaff && (
                    <div className="absolute top-2 right-2 z-10">
                      <div className="bg-red-500/90 text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Sin Stock
                      </div>
                    </div>
                  )}
                  
                  {/* Product Image Placeholder */}
                  <div className={`aspect-square bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl mb-3 flex items-center justify-center ${
                    !hasStock && isStaff ? 'grayscale' : ''
                  }`}>
                    {(() => {
                      const Icon = categoryIcons[product.category] || Wine
                      return <Icon className="w-12 h-12 text-slate-500" />
                    })()}
                  </div>

                  <h3 className="font-medium text-white text-sm mb-1 truncate">
                    {product.name}
                  </h3>
                  <p className="text-emerald-400 font-bold mb-2">
                    {formatPrice(product.price)}
                  </p>
                  
                  {/* Stock Warning - Only for staff */}
                  {!hasStock && isStaff && productWithStock.stockWarning && (
                    <p className="text-red-400 text-xs mb-2 line-clamp-2">
                      {productWithStock.stockWarning}
                    </p>
                  )}

                  {cartItem ? (
                    <div className="flex items-center justify-between bg-slate-700/50 rounded-lg p-1">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="p-2 text-white hover:bg-slate-600 rounded-lg"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-white font-medium">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="p-2 text-white hover:bg-slate-600 rounded-lg"
                        disabled={!hasStock && isStaff}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  ) : !hasStock && isStaff ? (
                    <button
                      disabled
                      className="w-full py-2 bg-slate-600 text-slate-400 rounded-lg text-sm font-medium flex items-center justify-center gap-2 cursor-not-allowed"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      No Disponible
                    </button>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Agregar
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Cart Floating Button (when cart has items and drawer is closed) */}
      {cartCount > 0 && !isCartOpen && (
        <div className="fixed bottom-4 left-4 right-4 z-30">
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
            {/* Cart Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <h2 className="text-lg font-bold text-white">Tu Pedido</h2>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl"
                    >
                      <div className="flex-1">
                        <h4 className="text-white font-medium">{item.product.name}</h4>
                        <p className="text-emerald-400 text-sm">
                          {formatPrice(item.product.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg"
                        >
                          <Minus className="w-4 h-4 text-white" />
                        </button>
                        <span className="w-8 text-center text-white font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg"
                        >
                          <Plus className="w-4 h-4 text-white" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-red-400 hover:bg-red-500/20 rounded-lg ml-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-700 space-y-4">
                <div className="flex justify-between text-lg">
                  <span className="text-slate-300">Total</span>
                  <span className="text-white font-bold">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false)
                    setIsCheckoutOpen(true)
                  }}
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

      {/* My Orders Modal */}
      {isOrdersOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOrdersOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div>
                <h2 className="text-lg font-bold text-white">Mis Pedidos</h2>
                <p className="text-sm text-slate-400">Mesa {tableNumber}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchMyOrders}
                  className="p-2 hover:bg-slate-800 rounded-lg text-amber-400"
                >
                  <Clock className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setIsOrdersOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Orders List */}
            <div className="flex-1 overflow-y-auto p-4">
              {loadingOrders ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-slate-400">Cargando pedidos...</p>
                </div>
              ) : myOrders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400">No tienes pedidos aún</p>
                  <p className="text-slate-500 text-sm mt-1">¡Agrega productos al carrito!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map((order) => {
                    let statusBg = 'bg-purple-500/20 border-purple-500/30'
                    let statusText = 'text-purple-400'
                    let statusLabel = 'Recibido'
                    let StatusIcon = Clock

                    // CREATED = Pedido recibido, esperando asignación
                    if (order.status === 'CREATED' || order.status === OrderStatus.CREATED) {
                      statusBg = 'bg-purple-500/20 border-purple-500/30'
                      statusText = 'text-purple-400'
                      statusLabel = 'Recibido'
                      StatusIcon = Clock
                    } else if (order.status === 'ASSIGNED') {
                      statusBg = 'bg-amber-500/20 border-amber-500/30'
                      statusText = 'text-amber-400'
                      statusLabel = 'Asignado'
                      StatusIcon = Clock
                    } else if (order.status === OrderStatus.IN_PROGRESS) {
                      statusBg = 'bg-cyan-500/20 border-cyan-500/30'
                      statusText = 'text-cyan-400'
                      statusLabel = 'Preparando'
                      StatusIcon = ChefHat
                    } else if (order.status === OrderStatus.READY) {
                      statusBg = 'bg-emerald-500/20 border-emerald-500/30'
                      statusText = 'text-emerald-400'
                      statusLabel = '¡Listo!'
                      StatusIcon = CheckCircle
                    } else if (order.status === OrderStatus.DELIVERED) {
                      statusBg = 'bg-slate-500/20 border-slate-500/30'
                      statusText = 'text-slate-400'
                      statusLabel = 'Entregado'
                      StatusIcon = CheckCircle
                    } else if (order.status === OrderStatus.CANCELLED) {
                      statusBg = 'bg-red-500/20 border-red-500/30'
                      statusText = 'text-red-400'
                      statusLabel = 'Cancelado'
                      StatusIcon = X
                    }

                    return (
                      <div
                        key={order.id}
                        className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-white font-semibold">{order.clientName}</p>
                            <p className="text-slate-500 text-xs">
                              Orden #{order.id} • {order.date ? new Date(order.date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                            </p>
                          </div>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusBg} border`}>
                            <StatusIcon className={`w-4 h-4 ${statusText}`} />
                            <span className={`text-xs font-medium ${statusText}`}>{statusLabel}</span>
                          </div>
                        </div>
                        
                        {order.notes && (
                          <p className="text-amber-400 text-xs mb-2 bg-amber-500/10 px-2 py-1 rounded">
                            Nota: {order.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                          <span className="text-slate-400 text-sm">Total</span>
                          <span className="text-emerald-400 font-bold">{formatPrice(order.valueToPay || 0)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setIsCheckoutOpen(false)}
          />
          <div className="relative bg-slate-900 rounded-2xl w-full max-w-sm p-6 border border-slate-700">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-lg"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>

            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-white">¡Casi listo!</h3>
              <p className="text-slate-400 mt-1">
                Ingresa tu nombre para enviar el pedido
              </p>
            </div>

            <div className="space-y-4">
              {/* Customer Name Input */}
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

              {/* Order Summary */}
              <div className="bg-slate-800/50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Mesa</span>
                  <span className="font-medium text-white">{tableNumber}</span>
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
                disabled={submitting || !customerName.trim()}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-medium flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Pedido
                  </>
                )}
              </button>

              <p className="text-xs text-slate-500 text-center">
                Un mesero te atenderá en tu mesa para el pago
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
      </>
      )}
    </div>
  )
}

export default CustomerMenu
