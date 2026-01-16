import { useState, useEffect, type FC } from 'react'
import {
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Package,
  X,
  Save,
  Beaker,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Boxes
} from 'lucide-react'
import { Card, CardContent, Badge, LoadingState } from '../../components/ui'
import Button from '../../components/ui/Button'
import { ingredientService } from '../../features/ingredients/api/ingredientService'
import { productService } from '../../features/products/api/productService'
import { inventoryService } from '../../features/inventory/api/inventoryService'
import { formatPrice } from '../../lib/formatPrice'
import type { 
  IngredientDto, 
  CreateIngredientDto, 
  UpdateIngredientDto,
  ProductResponseDto,
  ProductRequestDto,
  UpdateProductDto,
  InventoryResponseDto
} from '../../types'
import toast from 'react-hot-toast'

// ========================
// CONSTANTS
// ========================
const unitOfMeasureLabels: Record<string, string> = {
  ML: 'Mililitros (ML)',
  ONZ: 'Onzas (ONZ)',
  GR: 'Gramos (GR)',
  UN: 'Unidades (UN)',
}

const categoryLabels: Record<string, string> = {
  BEER: 'Cervezas',
  WINE: 'Vinos',
  COCKTAILS: 'Cocteles',
  JUICES: 'Jugos',
}

const categoryColors: Record<string, string> = {
  BEER: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  WINE: 'bg-red-500/20 text-red-400 border-red-500/30',
  COCKTAILS: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  JUICES: 'bg-green-500/20 text-green-400 border-green-500/30',
}

// ========================
// INGREDIENTS TAB
// ========================
interface IngredientsTabProps {
  ingredients: IngredientDto[]
  isLoading: boolean
  onRefresh: () => void
  onSave: (ingredient: CreateIngredientDto | UpdateIngredientDto, isEdit: boolean, id?: number) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

const IngredientsTab: FC<IngredientsTabProps> = ({ 
  ingredients, 
  isLoading, 
  onRefresh, 
  onSave, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<IngredientDto | null>(null)
  const [formData, setFormData] = useState<CreateIngredientDto>({
    name: '',
    unitOfMeasure: 'UN',
  })
  const [isSaving, setIsSaving] = useState(false)

  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ing.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOpenModal = (ingredient?: IngredientDto) => {
    if (ingredient) {
      setEditingIngredient(ingredient)
      setFormData({
        code: ingredient.code,
        name: ingredient.name,
        unitOfMeasure: ingredient.unitOfMeasure,
      })
    } else {
      setEditingIngredient(null)
      setFormData({ name: '', unitOfMeasure: 'UN' })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingIngredient(null)
    setFormData({ name: '', unitOfMeasure: 'UN' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido')
      return
    }

    setIsSaving(true)
    try {
      await onSave(formData, !!editingIngredient, editingIngredient?.id)
      handleCloseModal()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este ingrediente?')) return
    await onDelete(id)
  }

  // Stats by unit
  const statsByUnit = ingredients.reduce((acc, ing) => {
    acc[ing.unitOfMeasure] = (acc[ing.unitOfMeasure] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (isLoading) {
    return <LoadingState message="Cargando ingredientes..." />
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Object.entries(unitOfMeasureLabels).map(([key, label]) => (
          <Card key={key} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{statsByUnit[key] || 0}</div>
              <div className="text-sm text-slate-400">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar ingredientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Ingrediente
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-slate-400 font-medium">Código</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Nombre</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Unidad</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center p-8 text-slate-400">
                      No se encontraron ingredientes
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map((ingredient) => (
                    <tr key={ingredient.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-4">
                        <code className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-sm">
                          {ingredient.code || '-'}
                        </code>
                      </td>
                      <td className="p-4 text-white font-medium">{ingredient.name}</td>
                      <td className="p-4">
                        <Badge variant="default">{unitOfMeasureLabels[ingredient.unitOfMeasure]}</Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(ingredient)}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(ingredient.id)}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Código (opcional)</label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="ING-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Nombre *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ron blanco"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Unidad de Medida</label>
                <select
                  value={formData.unitOfMeasure}
                  onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  {Object.entries(unitOfMeasureLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================
// PRODUCTS TAB
// ========================
interface ProductsTabProps {
  products: ProductResponseDto[]
  ingredients: IngredientDto[]
  isLoading: boolean
  onRefresh: () => void
  onSave: (product: ProductRequestDto | UpdateProductDto, isEdit: boolean, id?: number) => Promise<void>
  onDelete: (code: string) => Promise<void>
}

const ProductsTab: FC<ProductsTabProps> = ({ 
  products, 
  ingredients, 
  isLoading, 
  onRefresh, 
  onSave, 
  onDelete 
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductResponseDto | null>(null)
  const [formData, setFormData] = useState<ProductRequestDto>({
    name: '',
    code: '',
    description: '',
    price: 0,
    photoId: undefined,
    isPrepared: false,
    category: 'BEER',
    ingredients: [],
  })
  const [isSaving, setIsSaving] = useState(false)
  const [showIngredients, setShowIngredients] = useState(false)

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const handleOpenModal = (product?: ProductResponseDto) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        code: product.code || '',
        description: product.description || '',
        price: product.price,
        photoId: product.photoId,
        isPrepared: product.isPrepared,
        category: product.category,
        ingredients: product.ingredients?.map(ing => ({
          ingredientId: ing.ingredient_id,
          amount: ing.amount
        })) || [],
      })
      setShowIngredients(product.isPrepared)
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        code: '',
        description: '',
        price: 0,
        photoId: undefined,
        isPrepared: false,
        category: 'BEER',
        ingredients: [],
      })
      setShowIngredients(false)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setShowIngredients(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.code?.trim()) {
      toast.error('Nombre y código son requeridos')
      return
    }

    setIsSaving(true)
    try {
      const dataToSend = {
        ...formData,
        ingredients: formData.isPrepared ? formData.ingredients : [],
      }
      await onSave(dataToSend, !!editingProduct, editingProduct?.id)
      handleCloseModal()
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (code: string) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return
    await onDelete(code)
  }

  // Check if an ingredient is selected
  const isIngredientSelected = (ingredientId: number) => {
    return formData.ingredients.some(ing => ing.ingredientId === ingredientId)
  }

  // Get amount for a specific ingredient
  const getIngredientAmount = (ingredientId: number) => {
    const ing = formData.ingredients.find(i => i.ingredientId === ingredientId)
    return ing?.amount || 0
  }

  // Toggle ingredient selection
  const toggleIngredient = (ingredientId: number) => {
    if (isIngredientSelected(ingredientId)) {
      setFormData({
        ...formData,
        ingredients: formData.ingredients.filter(ing => ing.ingredientId !== ingredientId)
      })
    } else {
      setFormData({
        ...formData,
        ingredients: [...formData.ingredients, { ingredientId, amount: 1 }]
      })
    }
  }

  // Update ingredient amount
  const updateIngredientAmount = (ingredientId: number, amount: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.map(ing => 
        ing.ingredientId === ingredientId ? { ...ing, amount } : ing
      )
    })
  }

  if (isLoading) {
    return <LoadingState message="Cargando productos..." />
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            categoryFilter === 'all'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
          }`}
        >
          Todos ({products.length})
        </button>
        {Object.entries(categoryLabels).map(([key, label]) => {
          const count = products.filter(p => p.category === key).length
          return (
            <button
              key={key}
              onClick={() => setCategoryFilter(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                categoryFilter === key
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {label} ({count})
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="primary" size="sm" onClick={() => handleOpenModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-slate-400 font-medium">Código</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Nombre</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Categoría</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Precio</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Preparado</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8 text-slate-400">
                      No se encontraron productos
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-4">
                        <code className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-sm">
                          {product.code || '-'}
                        </code>
                      </td>
                      <td className="p-4 text-white font-medium">{product.name}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${categoryColors[product.category] || 'bg-slate-500/20 text-slate-400'}`}>
                          {categoryLabels[product.category] || product.category}
                        </span>
                      </td>
                      <td className="p-4 text-emerald-400 font-semibold">
                        {formatPrice(product.price)}
                      </td>
                      <td className="p-4">
                        {product.isPrepared ? (
                          <Badge variant="success">Sí</Badge>
                        ) : (
                          <Badge variant="default">No</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(product)}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.code || '')}
                            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Código *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="PROD-001"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Mojito"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Descripción</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  rows={2}
                  placeholder="Descripción del producto..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Precio *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Photo ID</label>
                  <input
                    type="number"
                    value={formData.photoId || ''}
                    onChange={(e) => setFormData({ ...formData, photoId: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Prepared Toggle */}
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
                <input
                  type="checkbox"
                  id="isPrepared"
                  checked={formData.isPrepared}
                  onChange={(e) => {
                    setFormData({ ...formData, isPrepared: e.target.checked })
                    setShowIngredients(e.target.checked)
                  }}
                  className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <label htmlFor="isPrepared" className="text-slate-300">
                  Este producto requiere preparación
                </label>
              </div>

              {/* Ingredients Section */}
              {showIngredients && (
                <div className="border border-slate-700 rounded-lg p-4">
                  <h4 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                    <Beaker className="w-5 h-5 text-orange-400" />
                    Seleccionar Ingredientes
                    <span className="ml-2 text-sm text-slate-400">
                      ({formData.ingredients.length} seleccionados)
                    </span>
                  </h4>

                  {ingredients.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                      {ingredients.map(ingredient => {
                        const isSelected = isIngredientSelected(ingredient.id)
                        const amount = getIngredientAmount(ingredient.id)
                        
                        return (
                          <div 
                            key={ingredient.id} 
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              isSelected 
                                ? 'bg-emerald-500/10 border border-emerald-500/30' 
                                : 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              id={`ingredient-${ingredient.id}`}
                              checked={isSelected}
                              onChange={() => toggleIngredient(ingredient.id)}
                              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                            />
                            <label 
                              htmlFor={`ingredient-${ingredient.id}`}
                              className="flex-1 cursor-pointer"
                            >
                              <span className="text-white font-medium">{ingredient.name}</span>
                              <span className="ml-2 text-slate-400 text-sm">
                                ({unitOfMeasureLabels[ingredient.unitOfMeasure]})
                              </span>
                              {ingredient.code && (
                                <code className="ml-2 text-xs text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                  {ingredient.code}
                                </code>
                              )}
                            </label>
                            
                            {isSelected && (
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 text-sm">Cantidad:</span>
                                <input
                                  type="number"
                                  min="0.1"
                                  step="0.1"
                                  value={amount}
                                  onChange={(e) => updateIngredientAmount(ingredient.id, parseFloat(e.target.value) || 0)}
                                  className="w-20 px-2 py-1 bg-slate-800 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-emerald-500 text-center"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-amber-400 p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      No hay ingredientes disponibles. Crea ingredientes primero en la pestaña "Ingredientes".
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" className="flex-1" disabled={isSaving}>
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================
// STOCK TAB
// ========================
interface StockTabProps {
  stock: InventoryResponseDto[]
  ingredients: IngredientDto[]
  isLoading: boolean
  onRefresh: () => void
  onAddStock: (quantity: number, code: string) => Promise<void>
  onDeductStock: (quantity: number, code: string) => Promise<void>
  onCreateStock: (code: string, quantity: number) => Promise<void>
}

const StockTab: FC<StockTabProps> = ({
  stock,
  ingredients,
  isLoading,
  onRefresh,
  onAddStock,
  onDeductStock,
  onCreateStock,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'deduct' | 'create'>('add')
  const [selectedItem, setSelectedItem] = useState<InventoryResponseDto | null>(null)
  const [quantity, setQuantity] = useState(0)
  const [selectedIngredientCode, setSelectedIngredientCode] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const filteredStock = (stock || []).filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Get ingredients that don't have stock yet
  const ingredientsWithoutStock = (ingredients || []).filter(
    ing => ing.code && !(stock || []).some(s => s.code === ing.code)
  )

  const handleOpenModal = (mode: 'add' | 'deduct' | 'create', item?: InventoryResponseDto) => {
    setModalMode(mode)
    setSelectedItem(item || null)
    setQuantity(0)
    if (mode === 'create' && ingredientsWithoutStock.length > 0) {
      setSelectedIngredientCode(ingredientsWithoutStock[0].code)
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedItem(null)
    setQuantity(0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0')
      return
    }

    setIsSaving(true)
    try {
      if (modalMode === 'create') {
        await onCreateStock(selectedIngredientCode, quantity)
      } else if (modalMode === 'add' && selectedItem) {
        await onAddStock(quantity, selectedItem.code)
      } else if (modalMode === 'deduct' && selectedItem) {
        await onDeductStock(quantity, selectedItem.code)
      }
      handleCloseModal()
    } finally {
      setIsSaving(false)
    }
  }

  // Stats
  const totalItems = stock.length
  const lowStockItems = stock.filter(s => s.quantity < 10).length
  const outOfStockItems = stock.filter(s => s.quantity === 0).length

  if (isLoading) {
    return <LoadingState message="Cargando stock..." />
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Boxes className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{totalItems}</div>
                <div className="text-sm text-slate-400">Total Items</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-400">{lowStockItems}</div>
                <div className="text-sm text-slate-400">Stock Bajo (&lt;10)</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                <TrendingDown className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">{outOfStockItems}</div>
                <div className="text-sm text-slate-400">Sin Stock</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Beaker className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{ingredientsWithoutStock.length}</div>
                <div className="text-sm text-slate-400">Sin Inventario</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
          {ingredientsWithoutStock.length > 0 && (
            <Button variant="primary" size="sm" onClick={() => handleOpenModal('create')}>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Inventario
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left p-4 text-slate-400 font-medium">Código</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Ingrediente</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Cantidad</th>
                  <th className="text-left p-4 text-slate-400 font-medium">Estado</th>
                  <th className="text-right p-4 text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center p-8 text-slate-400">
                      No se encontraron items en el inventario
                    </td>
                  </tr>
                ) : (
                  filteredStock.map((item) => (
                    <tr key={item.code} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                      <td className="p-4">
                        <code className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-sm">
                          {item.code}
                        </code>
                      </td>
                      <td className="p-4 text-white font-medium">{item.name}</td>
                      <td className="p-4">
                        <span className={`text-lg font-bold ${
                          item.quantity === 0 ? 'text-red-400' :
                          item.quantity < 10 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.quantity === 0 ? (
                          <Badge variant="danger">Sin Stock</Badge>
                        ) : item.quantity < 10 ? (
                          <Badge variant="warning">Bajo</Badge>
                        ) : (
                          <Badge variant="success">Disponible</Badge>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal('add', item)}
                            className="p-2 text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Agregar stock"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenModal('deduct', item)}
                            className="p-2 text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors"
                            title="Descontar stock"
                            disabled={item.quantity === 0}
                          >
                            <TrendingDown className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">
                {modalMode === 'create' ? 'Crear Inventario' :
                 modalMode === 'add' ? 'Agregar Stock' : 'Descontar Stock'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {modalMode === 'create' ? (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Seleccionar Ingrediente
                  </label>
                  <select
                    value={selectedIngredientCode}
                    onChange={(e) => setSelectedIngredientCode(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    {ingredientsWithoutStock.map(ing => (
                      <option key={ing.code} value={ing.code}>
                        {ing.name} ({ing.code})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="p-4 bg-slate-800/50 rounded-lg">
                  <p className="text-slate-400 text-sm">Ingrediente:</p>
                  <p className="text-white font-medium">{selectedItem?.name}</p>
                  <p className="text-slate-400 text-sm mt-2">Stock actual:</p>
                  <p className="text-2xl font-bold text-emerald-400">{selectedItem?.quantity}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {modalMode === 'create' ? 'Cantidad Inicial' :
                   modalMode === 'add' ? 'Cantidad a Agregar' : 'Cantidad a Descontar'}
                </label>
                <input
                  type="number"
                  min="1"
                  max={modalMode === 'deduct' ? selectedItem?.quantity : undefined}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Ingresa la cantidad"
                  required
                />
                {modalMode === 'deduct' && selectedItem && (
                  <p className="text-sm text-slate-400 mt-1">
                    Máximo: {selectedItem.quantity}
                  </p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  variant={modalMode === 'deduct' ? 'outline' : 'primary'} 
                  className={`flex-1 ${modalMode === 'deduct' ? 'border-amber-500 text-amber-400 hover:bg-amber-500/10' : ''}`}
                  disabled={isSaving}
                >
                  {modalMode === 'add' && <TrendingUp className="w-4 h-4 mr-2" />}
                  {modalMode === 'deduct' && <TrendingDown className="w-4 h-4 mr-2" />}
                  {modalMode === 'create' && <Plus className="w-4 h-4 mr-2" />}
                  {isSaving ? 'Guardando...' : 
                   modalMode === 'create' ? 'Crear' :
                   modalMode === 'add' ? 'Agregar' : 'Descontar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// ========================
// MAIN COMPONENT
// ========================
const InventoryPanel: FC = () => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'products' | 'stock'>('ingredients')
  const [ingredients, setIngredients] = useState<IngredientDto[]>([])
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [stock, setStock] = useState<InventoryResponseDto[]>([])
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)
  const [isLoadingStock, setIsLoadingStock] = useState(true)

  const fetchIngredients = async () => {
    setIsLoadingIngredients(true)
    try {
      const data = await ingredientService.getAll()
      setIngredients(data)
    } catch (error) {
      console.error('Error fetching ingredients:', error)
      toast.error('Error al cargar ingredientes')
    } finally {
      setIsLoadingIngredients(false)
    }
  }

  const fetchProducts = async () => {
    setIsLoadingProducts(true)
    try {
      const data = await productService.getAll()
      setProducts(data as ProductResponseDto[])
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Error al cargar productos')
    } finally {
      setIsLoadingProducts(false)
    }
  }

  const fetchStock = async () => {
    setIsLoadingStock(true)
    try {
      const data = await inventoryService.getAll()
      setStock(data || [])
    } catch (error) {
      console.error('Error fetching stock:', error)
      toast.error('Error al cargar stock')
      setStock([])
    } finally {
      setIsLoadingStock(false)
    }
  }

  useEffect(() => {
    fetchIngredients()
    fetchProducts()
    fetchStock()
  }, [])

  // Ingredient handlers
  const handleSaveIngredient = async (
    ingredient: CreateIngredientDto | UpdateIngredientDto, 
    isEdit: boolean, 
    id?: number
  ) => {
    try {
      if (isEdit && id) {
        await ingredientService.update({ ...ingredient, id } as UpdateIngredientDto)
        toast.success('Ingrediente actualizado')
      } else {
        await ingredientService.create(ingredient as CreateIngredientDto)
        toast.success('Ingrediente creado')
      }
      fetchIngredients()
    } catch (error) {
      console.error('Error saving ingredient:', error)
      toast.error('Error al guardar ingrediente')
      throw error
    }
  }

  const handleDeleteIngredient = async (id: number) => {
    try {
      const ingredient = ingredients.find(ing => ing.id === id)
      if (ingredient?.code) {
        await ingredientService.delete(ingredient.code)
        toast.success('Ingrediente eliminado')
        fetchIngredients()
      }
    } catch (error) {
      console.error('Error deleting ingredient:', error)
      toast.error('Error al eliminar ingrediente')
    }
  }

  // Product handlers
  const handleSaveProduct = async (
    product: ProductRequestDto | UpdateProductDto, 
    isEdit: boolean, 
    id?: number
  ) => {
    try {
      if (isEdit && id) {
        await productService.update({ ...product, id } as UpdateProductDto)
        toast.success('Producto actualizado')
      } else {
        await productService.create(product as ProductRequestDto)
        toast.success('Producto creado')
      }
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      toast.error('Error al guardar producto')
      throw error
    }
  }

  const handleDeleteProduct = async (code: string) => {
    try {
      await productService.delete(code)
      toast.success('Producto eliminado')
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Error al eliminar producto')
    }
  }

  // Stock handlers
  const handleAddStock = async (quantity: number, code: string) => {
    try {
      await inventoryService.addStock(quantity, code)
      toast.success(`Se agregaron ${quantity} unidades`)
      fetchStock()
    } catch (error) {
      console.error('Error adding stock:', error)
      toast.error('Error al agregar stock')
      throw error
    }
  }

  const handleDeductStock = async (quantity: number, code: string) => {
    try {
      await inventoryService.deductStock(quantity, code)
      toast.success(`Se descontaron ${quantity} unidades`)
      fetchStock()
    } catch (error) {
      console.error('Error deducting stock:', error)
      toast.error('Error al descontar stock')
      throw error
    }
  }

  const handleCreateStock = async (code: string, quantity: number) => {
    try {
      await inventoryService.create({ code, quantity })
      toast.success('Inventario creado')
      fetchStock()
    } catch (error) {
      console.error('Error creating stock:', error)
      toast.error('Error al crear inventario')
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Inventario</h1>
            <p className="text-slate-400">Administra ingredientes, productos y stock del bar</p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800 pb-4">
            <button
              onClick={() => setActiveTab('ingredients')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'ingredients'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Beaker className="w-5 h-5" />
              Ingredientes
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'ingredients' ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                {ingredients.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'products'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Package className="w-5 h-5" />
              Productos
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'products' ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                {products.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === 'stock'
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Boxes className="w-5 h-5" />
              Stock
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === 'stock' ? 'bg-white/20' : 'bg-slate-700'
              }`}>
                {stock.length}
              </span>
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'ingredients' && (
            <IngredientsTab
              ingredients={ingredients}
              isLoading={isLoadingIngredients}
              onRefresh={fetchIngredients}
              onSave={handleSaveIngredient}
              onDelete={handleDeleteIngredient}
            />
          )}
          {activeTab === 'products' && (
            <ProductsTab
              products={products}
              ingredients={ingredients}
              isLoading={isLoadingProducts}
              onRefresh={fetchProducts}
              onSave={handleSaveProduct}
              onDelete={handleDeleteProduct}
            />
          )}
          {activeTab === 'stock' && (
            <StockTab
              stock={stock}
              ingredients={ingredients}
              isLoading={isLoadingStock}
              onRefresh={fetchStock}
              onAddStock={handleAddStock}
              onDeductStock={handleDeductStock}
              onCreateStock={handleCreateStock}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryPanel
