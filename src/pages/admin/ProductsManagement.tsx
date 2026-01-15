import { useState, useEffect, type FC } from 'react'
import {
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  ShoppingBag,
  X,
  Save,
  ChevronDown,
  ChevronUp,
  Beaker
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingState } from '../../components/ui'
import Button from '../../components/ui/Button'
import { productService, type ProductForListDto } from '../../features/products/api/productService'
import { ingredientService } from '../../features/ingredients/api/ingredientService'
import type { 
  IngredientDto, 
  ProductRequestDto, 
  ProductResponseDto, 
  UpdateProductDto,
  ProductIngredientRequestDto
} from '../../types'
import toast from 'react-hot-toast'

const categoryLabels: Record<string, string> = {
  BEER: 'Cervezas',
  WINE: 'Vinos',
  COCKTAILS: 'Cocteles',
  JUICES: 'Jugos',
}

const ProductsPage: FC = () => {
  const [products, setProducts] = useState<ProductForListDto[]>([])
  const [ingredients, setIngredients] = useState<IngredientDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductResponseDto | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [showIngredients, setShowIngredients] = useState(false)

  // Form state
  const [formData, setFormData] = useState<{
    name: string
    code: string
    description: string
    price: number
    photoId?: number
    isPrepared: boolean
    category: string
    ingredients: ProductIngredientRequestDto[]
  }>({
    name: '',
    code: '',
    description: '',
    price: 0,
    isPrepared: false,
    category: 'BEER',
    ingredients: [],
  })

  // Fetch products
  const fetchProducts = async () => {
    setIsLoading(true)
    try {
      const data = await productService.getAll()
      setProducts(data)
    } catch (error) {
      console.error('Error fetching products:', error)
      toast.error('Error al cargar productos')
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch ingredients for dropdown
  const fetchIngredients = async () => {
    try {
      const data = await ingredientService.getAll()
      setIngredients(data)
    } catch (error) {
      console.error('Error fetching ingredients:', error)
    }
  }

  useEffect(() => {
    fetchProducts()
    fetchIngredients()
  }, [])

  // Filter products
  const filteredProducts = products.filter(prod => {
    const matchesSearch = prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.code?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !categoryFilter || prod.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      price: 0,
      isPrepared: false,
      category: 'BEER',
      ingredients: [],
    })
    setShowIngredients(false)
  }

  // Open modal for creating
  const handleOpenCreate = () => {
    setEditingProduct(null)
    resetForm()
    setIsModalOpen(true)
  }

  // Open modal for editing
  const handleOpenEdit = async (product: ProductForListDto) => {
    try {
      const fullProduct = await productService.getById(product.id)
      setEditingProduct(fullProduct)
      setFormData({
        name: fullProduct.name,
        code: fullProduct.code || '',
        description: fullProduct.description || '',
        price: fullProduct.price,
        photoId: fullProduct.photoId,
        isPrepared: fullProduct.isPrepared,
        category: fullProduct.category,
        ingredients: fullProduct.ingredients?.map(ing => ({
          ingredientId: ing.ingredient_id,
          amount: ing.amount,
        })) || [],
      })
      setShowIngredients(fullProduct.isPrepared)
      setIsModalOpen(true)
    } catch (error) {
      toast.error('Error al cargar producto')
    }
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (editingProduct) {
        // Update
        const updateData: UpdateProductDto = {
          id: editingProduct.id,
          name: formData.name,
          code: formData.code || undefined,
          description: formData.description,
          price: formData.price,
          photoId: formData.photoId,
          isPrepared: formData.isPrepared,
          category: formData.category,
          ingredients: formData.isPrepared ? formData.ingredients : [],
        }
        await productService.update(updateData)
        toast.success('Producto actualizado')
      } else {
        // Create
        const createData: ProductRequestDto = {
          name: formData.name,
          code: formData.code || undefined,
          description: formData.description,
          price: formData.price,
          photoId: formData.photoId,
          isPrepared: formData.isPrepared,
          category: formData.category,
          ingredients: formData.isPrepared ? formData.ingredients : [],
        }
        await productService.create(createData)
        toast.success('Producto creado')
      }
      setIsModalOpen(false)
      fetchProducts()
    } catch (error: any) {
      console.error('Error saving product:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al guardar'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async (product: ProductForListDto) => {
    if (!product.code) {
      toast.error('No se puede eliminar: producto sin código')
      return
    }

    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return

    try {
      await productService.delete(product.code)
      toast.success('Producto eliminado')
      fetchProducts()
    } catch (error: any) {
      console.error('Error deleting product:', error)
      const errorMessage = error?.response?.data?.message || 'Error al eliminar'
      toast.error(errorMessage)
    }
  }

  // Add ingredient to product
  const handleAddIngredient = () => {
    if (ingredients.length === 0) {
      toast.error('No hay ingredientes disponibles')
      return
    }
    setFormData({
      ...formData,
      ingredients: [...formData.ingredients, { ingredientId: ingredients[0].id, amount: 0 }],
    })
  }

  // Remove ingredient from product
  const handleRemoveIngredient = (index: number) => {
    setFormData({
      ...formData,
      ingredients: formData.ingredients.filter((_, i) => i !== index),
    })
  }

  // Update ingredient
  const handleUpdateIngredient = (index: number, field: 'ingredientId' | 'amount', value: number) => {
    const newIngredients = [...formData.ingredients]
    newIngredients[index] = { ...newIngredients[index], [field]: value }
    setFormData({ ...formData, ingredients: newIngredients })
  }

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <ShoppingBag className="w-8 h-8 text-amber-400" />
                Gestión de Productos
              </h1>
              <p className="text-slate-400 mt-2">
                Administra el catálogo de bebidas y productos
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                onClick={fetchProducts}
                disabled={isLoading}
              >
                Actualizar
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleOpenCreate}
              >
                Nuevo Producto
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mt-8">
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{products.length}</p>
                </div>
              </div>
            </Card>
            {Object.entries(categoryLabels).map(([cat, label]) => (
              <Card key={cat} className="!p-4 cursor-pointer hover:border-emerald-500/50 transition-colors"
                onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    categoryFilter === cat ? 'bg-emerald-500/20' : 'bg-slate-700'
                  }`}>
                    <span className={`text-xs font-bold ${
                      categoryFilter === cat ? 'text-emerald-400' : 'text-slate-400'
                    }`}>{cat.slice(0, 2)}</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">{label}</p>
                    <p className="text-xl font-bold text-white">
                      {products.filter(p => p.category === cat).length}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-amber-400" />
                  Lista de Productos
                  {categoryFilter && (
                    <Badge variant="info" className="ml-2">{categoryLabels[categoryFilter]}</Badge>
                  )}
                </CardTitle>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState message="Cargando productos..." />
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {searchTerm || categoryFilter ? 'No se encontraron productos' : 'No hay productos registrados'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">ID</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Código</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Nombre</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Categoría</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Precio</th>
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Tipo</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr
                          key={product.id}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-500">{product.id}</td>
                          <td className="py-3 px-4">
                            <code className="text-amber-400 bg-slate-800 px-2 py-1 rounded text-sm">
                              {product.code || '-'}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-white font-medium">{product.name}</td>
                          <td className="py-3 px-4">
                            <Badge variant="default">{categoryLabels[product.category] || product.category}</Badge>
                          </td>
                          <td className="py-3 px-4 text-emerald-400 font-semibold">
                            {formatPrice(product.price)}
                          </td>
                          <td className="py-3 px-4">
                            {product.isPrepared ? (
                              <Badge variant="warning" className="flex items-center gap-1 w-fit">
                                <Beaker className="w-3 h-3" />
                                Preparado
                              </Badge>
                            ) : (
                              <Badge variant="info">Directo</Badge>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(product)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="!text-red-400 hover:!bg-red-500/10"
                                onClick={() => handleDelete(product)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 rounded-2xl w-full max-w-2xl border border-slate-700 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Daiquiri"
                    required
                    minLength={3}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Code */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Código (opcional)
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ej: D01-ML-0008P"
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Formato: A99-AA-9999A</p>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Categoría *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                  >
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Precio *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    required
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Descripción *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del producto..."
                  required
                  rows={2}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Is Prepared */}
              <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl">
                <input
                  type="checkbox"
                  id="isPrepared"
                  checked={formData.isPrepared}
                  onChange={(e) => {
                    setFormData({ ...formData, isPrepared: e.target.checked })
                    setShowIngredients(e.target.checked)
                  }}
                  className="w-5 h-5 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500 bg-slate-700"
                />
                <label htmlFor="isPrepared" className="text-white cursor-pointer">
                  <span className="font-medium">Requiere preparación</span>
                  <p className="text-sm text-slate-400">Marcar si este producto necesita ingredientes para su preparación</p>
                </label>
              </div>

              {/* Ingredients Section */}
              {formData.isPrepared && (
                <div className="border border-slate-700 rounded-xl overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowIngredients(!showIngredients)}
                    className="w-full flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Beaker className="w-5 h-5 text-amber-400" />
                      <span className="text-white font-medium">Ingredientes ({formData.ingredients.length})</span>
                    </div>
                    {showIngredients ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  {showIngredients && (
                    <div className="p-4 space-y-3">
                      {formData.ingredients.length === 0 ? (
                        <p className="text-slate-400 text-center py-4">
                          No hay ingredientes. Agrega al menos uno.
                        </p>
                      ) : (
                        formData.ingredients.map((ing, index) => {
                          const ingredientInfo = ingredients.find(i => i.id === ing.ingredientId)
                          return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                              <select
                                value={ing.ingredientId}
                                onChange={(e) => handleUpdateIngredient(index, 'ingredientId', parseInt(e.target.value))}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                              >
                                {ingredients.map(ingredient => (
                                  <option key={ingredient.id} value={ingredient.id}>
                                    {ingredient.name} ({ingredient.unitOfMeasure})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={ing.amount}
                                onChange={(e) => handleUpdateIngredient(index, 'amount', parseFloat(e.target.value) || 0)}
                                placeholder="Cantidad"
                                className="w-24 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                              />
                              <span className="text-slate-400 text-sm w-12">
                                {ingredientInfo?.unitOfMeasure || '-'}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveIngredient(index)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )
                        })
                      )}
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        leftIcon={<Plus className="w-4 h-4" />}
                        onClick={handleAddIngredient}
                        className="w-full"
                      >
                        Agregar Ingrediente
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-700">
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1"
                  leftIcon={<Save className="w-4 h-4" />}
                  disabled={isSaving}
                >
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

export default ProductsPage
