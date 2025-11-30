import { useState, useMemo, type FC } from 'react'
import { Search, Filter, Plus, Minus, ShoppingCart } from 'lucide-react'
import { useProducts } from '../../features/products/hooks/hooks'
import { useCart } from '../../features/products/context/CartContext'
import { Card, CardContent, Input, Badge, LoadingState } from '../../components/ui'
import { Category } from '../../types'
import toast from 'react-hot-toast'

// Fallback data for demo purposes
const fallbackProducts = [
  { id: 1, name: 'Mojito Clásico', code: 'MOJ001', description: 'Ron blanco, lima, hierbabuena, soda', category: Category.COCKTAILS, price: 8.50 },
  { id: 2, name: 'Negroni', code: 'NEG001', description: 'Ginebra, Campari, Vermut rojo', category: Category.COCKTAILS, price: 10.00 },
  { id: 3, name: 'Old Fashioned', code: 'OLD001', description: 'Bourbon, azúcar, angostura', category: Category.COCKTAILS, price: 11.00 },
  { id: 4, name: 'Margarita', code: 'MAR001', description: 'Tequila, triple sec, lima', category: Category.COCKTAILS, price: 9.50 },
  { id: 5, name: 'Piña Colada', code: 'PIN001', description: 'Ron, crema de coco, piña', category: Category.COCKTAILS, price: 9.00 },
  { id: 6, name: 'Cerveza Artesanal IPA', code: 'BER001', description: 'Cerveza artesanal local', category: Category.BEER, price: 6.00 },
  { id: 7, name: 'Cerveza Lager', code: 'BER002', description: 'Cerveza rubia refrescante', category: Category.BEER, price: 5.00 },
  { id: 8, name: 'Vino Tinto Reserva', code: 'WIN001', description: 'Vino tinto de la casa', category: Category.WINE, price: 8.00 },
  { id: 9, name: 'Vino Blanco', code: 'WIN002', description: 'Vino blanco seco', category: Category.WINE, price: 7.00 },
  { id: 10, name: 'Jugo Natural Naranja', code: 'JUG001', description: 'Naranja recién exprimida', category: Category.JUICES, price: 4.00 },
]

const categoryLabels: Record<string, string> = {
  [Category.COCKTAILS]: 'Cócteles',
  [Category.BEER]: 'Cervezas',
  [Category.WINE]: 'Vinos',
  [Category.JUICES]: 'Jugos',
}

const MenuPage: FC = () => {
  const { data, loading, error } = useProducts()
  const { addItem, cart } = useCart()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [quantities, setQuantities] = useState<Record<number, number>>({})

  // Use API data if available, otherwise fallback
  const products = useMemo(() => {
    if (data && data.length > 0) {
      return data.map(p => ({
        ...p,
        price: (p as any).price ?? 10.00, // Default price if not available
      }))
    }
    return fallbackProducts
  }, [data])

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = !selectedCategory || product.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [products, searchQuery, selectedCategory])

  // Group products by category
  const groupedProducts = useMemo(() => {
    const grouped: Record<string, typeof filteredProducts> = {}
    filteredProducts.forEach(product => {
      const cat = product.category || 'OTHER'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(product)
    })
    return grouped
  }, [filteredProducts])

  const handleQuantityChange = (productId: number, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(0, (prev[productId] || 0) + delta),
    }))
  }

  const handleAddToCart = (product: typeof products[0]) => {
    const quantity = quantities[product.id] || 1
    addItem(
      { id: product.id, name: product.name, code: product.code, category: product.category as Category, description: product.description },
      product.price,
      quantity
    )
    setQuantities(prev => ({ ...prev, [product.id]: 0 }))
    toast.success(`${product.name} agregado al carrito`)
  }

  const getItemInCart = (productId: number) => {
    return cart.items.find(item => item.product.id === productId)
  }

  const categories = Object.values(Category)

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header Section */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-12 sm:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Nuestra Carta
            </h1>
            <p className="text-slate-400 text-lg">
              Explora nuestra selección de bebidas y encuentra tu favorita
            </p>
          </div>

          {/* Search and Filter */}
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar bebidas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="w-5 h-5" />}
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  !selectedCategory
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Filter className="w-4 h-4" />
                Todos
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-8 sm:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {loading && <LoadingState message="Cargando menú..." />}
          
          {error && (
            <div className="text-center py-8">
              <p className="text-amber-400 mb-2">
                No se pudo conectar con el servidor. Mostrando menú de demostración.
              </p>
            </div>
          )}

          {!loading && Object.keys(groupedProducts).length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-400 text-lg">No se encontraron productos</p>
            </div>
          )}

          {/* Products by Category */}
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <div key={category} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {categoryLabels[category] || category}
                </h2>
                <Badge variant="info">{categoryProducts.length}</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {categoryProducts.map((product) => {
                  const itemInCart = getItemInCart(product.id)
                  const currentQuantity = quantities[product.id] || 0

                  return (
                    <Card key={product.id} hover className="flex flex-col">
                      <CardContent className="flex flex-col flex-1">
                        {/* Product Info */}
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="text-lg font-semibold text-white">
                              {product.name}
                            </h3>
                            {itemInCart && (
                              <Badge variant="success" className="flex-shrink-0">
                                {itemInCart.quantity} en carrito
                              </Badge>
                            )}
                          </div>
                          <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                            {product.description || 'Deliciosa bebida'}
                          </p>
                        </div>

                        {/* Price and Actions */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                              ${product.price.toFixed(2)}
                            </span>
                          </div>

                          {/* Quantity Selector */}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-slate-700 rounded-lg">
                              <button
                                onClick={() => handleQuantityChange(product.id, -1)}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                                disabled={currentQuantity === 0}
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center text-white font-medium">
                                {currentQuantity || 1}
                              </span>
                              <button
                                onClick={() => handleQuantityChange(product.id, 1)}
                                className="p-2 text-slate-400 hover:text-white transition-colors"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <button
                              onClick={() => handleAddToCart(product)}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                            >
                              <ShoppingCart className="w-4 h-4" />
                              Agregar
                            </button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default MenuPage
