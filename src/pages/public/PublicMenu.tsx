import { useState, useMemo, useEffect, type FC } from 'react'
import { Wine, Beer, GlassWater, Grape, Search, Loader2 } from 'lucide-react'
import { productService } from '../../features/products/api/productService'
import type { ProductDto } from '../../types'
import { Category } from '../../types'

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

// Formatear precio en pesos colombianos
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

const PublicMenuPage: FC = () => {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Cargar productos
  useEffect(() => {
    const loadProducts = async () => {
      try {
        const data = await productService.getAll()
        setProducts(data)
      } catch (err) {
        setError('No se pudo cargar el menú')
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
    
    // Inicializar en orden
    order.forEach(cat => {
      grouped[cat] = []
    })
    
    filteredProducts.forEach(product => {
      const cat = product.category || 'OTHER'
      if (!grouped[cat]) grouped[cat] = []
      grouped[cat].push(product)
    })
    
    // Eliminar categorías vacías
    Object.keys(grouped).forEach(key => {
      if (grouped[key].length === 0) delete grouped[key]
    })
    
    return grouped
  }, [filteredProducts])

  const categories = [...new Set(products.map(p => p.category))]

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
          <p className="text-red-400 mb-4">{error}</p>
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
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 text-white font-bold text-xl mb-2 shadow-lg shadow-emerald-500/30">
              PB
            </div>
            <h1 className="text-2xl font-bold text-white">Project Bar</h1>
            <p className="text-slate-400 text-sm">Nuestra Carta</p>
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
      <main className="max-w-2xl mx-auto px-4 py-6 pb-24">
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
              {categoryProducts.map((product) => (
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
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                        {formatPrice(product.price || 0)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
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

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md border-t border-slate-700/50 py-3">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-xs">
            📍 Project Bar • Síguenos en @projectbar
          </p>
        </div>
      </footer>
    </div>
  )
}

export default PublicMenuPage
