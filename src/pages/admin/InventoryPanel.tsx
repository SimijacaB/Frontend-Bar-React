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
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Card, CardContent, Badge, LoadingState } from '../../components/ui'
import Button from '../../components/ui/Button'
import { ingredientService } from '../../features/ingredients/api/ingredientService'
import { productService } from '../../features/products/api/productService'
import type { 
  IngredientDto, 
  CreateIngredientDto, 
  UpdateIngredientDto,
  ProductResponseDto,
  ProductRequestDto,
  UpdateProductDto,
  ProductIngredientRequestDto
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

  const addIngredient = () => {
    if (ingredients.length === 0) return
    const firstIngredient = ingredients[0]
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredientId: firstIngredient.id, amount: 1 }]
    })
  }

  const removeIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index)
    })
  }

  const updateIngredient = (index: number, field: keyof ProductIngredientRequestDto, value: number) => {
    const updated = [...formData.ingredients]
    updated[index] = { ...updated[index], [field]: value }
    setFormData({ ...formData, ingredients: updated })
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
                        ${product.price.toFixed(2)}
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
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() => setShowIngredients(!showIngredients)}
                  >
                    <h4 className="text-lg font-medium text-white flex items-center gap-2">
                      <Beaker className="w-5 h-5 text-orange-400" />
                      Ingredientes
                    </h4>
                    {showIngredients ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="mt-4 space-y-3">
                    {formData.ingredients.map((ing, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <select
                          value={ing.ingredientId}
                          onChange={(e) => updateIngredient(index, 'ingredientId', parseInt(e.target.value))}
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                        >
                          {ingredients.map(ingredient => (
                            <option key={ingredient.id} value={ingredient.id}>
                              {ingredient.name} ({unitOfMeasureLabels[ingredient.unitOfMeasure]})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={ing.amount}
                          onChange={(e) => updateIngredient(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-24 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-emerald-500"
                          placeholder="Cantidad"
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {ingredients.length > 0 ? (
                      <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Ingrediente
                      </Button>
                    ) : (
                      <p className="text-sm text-amber-400">
                        No hay ingredientes disponibles. Crea ingredientes primero en la pestaña "Ingredientes".
                      </p>
                    )}
                  </div>
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
// MAIN COMPONENT
// ========================
const InventoryPanel: FC = () => {
  const [activeTab, setActiveTab] = useState<'ingredients' | 'products'>('ingredients')
  const [ingredients, setIngredients] = useState<IngredientDto[]>([])
  const [products, setProducts] = useState<ProductResponseDto[]>([])
  const [isLoadingIngredients, setIsLoadingIngredients] = useState(true)
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

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

  useEffect(() => {
    fetchIngredients()
    fetchProducts()
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

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Inventario</h1>
            <p className="text-slate-400">Administra ingredientes y productos del bar</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4">
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
          </div>

          {/* Tab Content */}
          {activeTab === 'ingredients' ? (
            <IngredientsTab
              ingredients={ingredients}
              isLoading={isLoadingIngredients}
              onRefresh={fetchIngredients}
              onSave={handleSaveIngredient}
              onDelete={handleDeleteIngredient}
            />
          ) : (
            <ProductsTab
              products={products}
              ingredients={ingredients}
              isLoading={isLoadingProducts}
              onRefresh={fetchProducts}
              onSave={handleSaveProduct}
              onDelete={handleDeleteProduct}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default InventoryPanel
