import { useState, useEffect, type FC } from 'react'
import {
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Package,
  X,
  Save
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Badge, LoadingState } from '../../components/ui'
import Button from '../../components/ui/Button'
import { ingredientService } from '../../features/ingredients/api/ingredientService'
import type { IngredientDto, CreateIngredientDto, UpdateIngredientDto } from '../../types'
import { UnitOfMeasure } from '../../types'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'

const unitOfMeasureLabels: Record<string, string> = {
  ML: 'Mililitros (ML)',
  ONZ: 'Onzas (ONZ)',
  GR: 'Gramos (GR)',
  UN: 'Unidades (UN)',
}

const IngredientsPage: FC = () => {
  const [ingredients, setIngredients] = useState<IngredientDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<IngredientDto | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [formData, setFormData] = useState<CreateIngredientDto>({
    code: '',
    name: '',
    unitOfMeasure: 'ML',
  })

  // Fetch ingredients
  const fetchIngredients = async () => {
    setIsLoading(true)
    try {
      const data = await ingredientService.getAll()
      setIngredients(data)
    } catch (error) {
      console.error('Error fetching ingredients:', error)
      toast.error('Error al cargar ingredientes')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchIngredients()
  }, [])

  // Filter ingredients
  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ing.code?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Open modal for creating
  const handleOpenCreate = () => {
    setEditingIngredient(null)
    setFormData({ code: '', name: '', unitOfMeasure: 'ML' })
    setIsModalOpen(true)
  }

  // Open modal for editing
  const handleOpenEdit = (ingredient: IngredientDto) => {
    setEditingIngredient(ingredient)
    setFormData({
      code: ingredient.code || '',
      name: ingredient.name,
      unitOfMeasure: ingredient.unitOfMeasure,
    })
    setIsModalOpen(true)
  }

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (editingIngredient) {
        // Update
        const updateData: UpdateIngredientDto = {
          id: editingIngredient.id,
          code: formData.code || undefined,
          name: formData.name,
          unitOfMeasure: formData.unitOfMeasure,
        }
        await ingredientService.update(updateData)
        toast.success('Ingrediente actualizado')
      } else {
        // Create
        await ingredientService.create(formData)
        toast.success('Ingrediente creado')
      }
      setIsModalOpen(false)
      fetchIngredients()
    } catch (error: any) {
      console.error('Error saving ingredient:', error)
      const errorMessage = error?.response?.data?.message || error?.message || 'Error al guardar'
      toast.error(errorMessage)
    } finally {
      setIsSaving(false)
    }
  }

  // Handle delete
  const handleDelete = async (ingredient: IngredientDto) => {
    if (!ingredient.code) {
      toast.error('No se puede eliminar: ingrediente sin código')
      return
    }

    if (!confirm(`¿Estás seguro de eliminar "${ingredient.name}"?`)) return

    try {
      await ingredientService.delete(ingredient.code)
      toast.success('Ingrediente eliminado')
      fetchIngredients()
    } catch (error: any) {
      console.error('Error deleting ingredient:', error)
      const errorMessage = error?.response?.data?.message || 'Error al eliminar'
      toast.error(errorMessage)
    }
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
                <Package className="w-8 h-8 text-emerald-400" />
                Gestión de Ingredientes
              </h1>
              <p className="text-slate-400 mt-2">
                Administra los ingredientes para productos preparados
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="secondary"
                leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
                onClick={fetchIngredients}
                disabled={isLoading}
              >
                Actualizar
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleOpenCreate}
              >
                Nuevo Ingrediente
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
            <Card className="!p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Package className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total</p>
                  <p className="text-2xl font-bold text-white">{ingredients.length}</p>
                </div>
              </div>
            </Card>
            {Object.keys(UnitOfMeasure).slice(0, 3).map(unit => (
              <Card key={unit} className="!p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                    <span className="text-amber-400 text-sm font-bold">{unit}</span>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">{unit}</p>
                    <p className="text-2xl font-bold text-white">
                      {ingredients.filter(i => i.unitOfMeasure === unit).length}
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
                  <Package className="w-5 h-5 text-emerald-400" />
                  Lista de Ingredientes
                </CardTitle>
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar ingrediente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <LoadingState message="Cargando ingredientes..." />
              ) : filteredIngredients.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">
                    {searchTerm ? 'No se encontraron ingredientes' : 'No hay ingredientes registrados'}
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
                        <th className="text-left py-3 px-4 text-slate-400 font-medium">Unidad</th>
                        <th className="text-right py-3 px-4 text-slate-400 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredIngredients.map((ingredient) => (
                        <tr
                          key={ingredient.id}
                          className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                        >
                          <td className="py-3 px-4 text-slate-500">{ingredient.id}</td>
                          <td className="py-3 px-4">
                            <code className="text-emerald-400 bg-slate-800 px-2 py-1 rounded text-sm">
                              {ingredient.code || '-'}
                            </code>
                          </td>
                          <td className="py-3 px-4 text-white font-medium">{ingredient.name}</td>
                          <td className="py-3 px-4">
                            <Badge variant="info">{ingredient.unitOfMeasure}</Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleOpenEdit(ingredient)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="!text-red-400 hover:!bg-red-500/10"
                                onClick={() => handleDelete(ingredient)}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-slate-700">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <h3 className="text-xl font-bold text-white">
                {editingIngredient ? 'Editar Ingrediente' : 'Nuevo Ingrediente'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.code || ''}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Ej: R01-ML-0001I"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-slate-500 mt-1">Formato: A99-AA-9999A</p>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Ron blanco"
                  required
                  minLength={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Unit of Measure */}
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">
                  Unidad de Medida *
                </label>
                <select
                  value={formData.unitOfMeasure}
                  onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  {Object.entries(unitOfMeasureLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
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
    </AdminLayout>
  )
}

export default IngredientsPage
