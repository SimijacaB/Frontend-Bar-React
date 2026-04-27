import { useState, useEffect, type FC } from 'react'
import {
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Search,
  Filter
} from 'lucide-react'
import toast from 'react-hot-toast'
import { tableService, type TableDto, type TableRequestDto } from '../../features/tables/api/tableService'
import { useAuth } from '../../features/auth/context/AuthContext'
import Button from '../../components/ui/Button'
import { Input, Card, CardContent, LoadingState, Modal } from '../../components/ui'
import AdminLayout from './AdminLayout'

const statusConfig = {
  FREE: { 
    label: 'Disponible', 
    color: 'bg-emerald-500', 
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/20',
    borderColor: 'border-emerald-500/30'
  },
  OCCUPIED: { 
    label: 'Ocupada', 
    color: 'bg-amber-500', 
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30'
  },
  RESERVED: { 
    label: 'Reservada', 
    color: 'bg-cyan-500', 
    textColor: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30'
  },
}

const TableManagement: FC = () => {
  const { user } = useAuth()
  const isAdmin = user?.roles?.includes('ADMIN') ?? false

  const [tables, setTables] = useState<TableDto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FREE' | 'OCCUPIED' | 'RESERVED'>('ALL')
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTable, setSelectedTable] = useState<TableDto | null>(null)
  
  // Form states
  const [formData, setFormData] = useState<TableRequestDto>({
    number: 0,
    capacity: 0,
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load tables
  const fetchTables = async () => {
    try {
      setLoading(true)
      const data = await tableService.getAll()
      setTables(data)
    } catch (err) {
      console.error('Error loading tables:', err)
      toast.error('Error al cargar mesas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchTables()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin])

  // Filter tables
  const filteredTables = tables.filter(table => {
    const matchesSearch = searchQuery === '' || 
      table.number.toString().includes(searchQuery) ||
      table.capacity.toString().includes(searchQuery)
    
    const matchesStatus = statusFilter === 'ALL' || table.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  // Handle create
  const handleCreate = async () => {
    if (!formData.number || formData.number < 1) {
      toast.error('El número de mesa debe ser mayor a 0')
      return
    }
    if (!formData.capacity || formData.capacity < 1) {
      toast.error('La capacidad debe ser mayor a 0')
      return
    }

    setIsSubmitting(true)
    try {
      await tableService.create(formData)
      toast.success('Mesa creada exitosamente')
      setIsCreateModalOpen(false)
      setFormData({ number: 0, capacity: 0, notes: '' })
      fetchTables()
    } catch (err: any) {
      console.error('Error creating table:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al crear la mesa'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle edit
  const handleEdit = async () => {
    if (!selectedTable) return
    
    if (!formData.number || formData.number < 1) {
      toast.error('El número de mesa debe ser mayor a 0')
      return
    }
    if (!formData.capacity || formData.capacity < 1) {
      toast.error('La capacidad debe ser mayor a 0')
      return
    }

    setIsSubmitting(true)
    try {
      await tableService.update(selectedTable.id, formData)
      toast.success('Mesa actualizada exitosamente')
      setIsEditModalOpen(false)
      setSelectedTable(null)
      setFormData({ number: 0, capacity: 0, notes: '' })
      fetchTables()
    } catch (err: any) {
      console.error('Error updating table:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al actualizar la mesa'
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete
  const handleDelete = async (table: TableDto) => {
    if (!confirm(`¿Estás seguro de eliminar la mesa ${table.number}?`)) {
      return
    }

    try {
      await tableService.delete(table.id)
      toast.success('Mesa eliminada exitosamente')
      fetchTables()
    } catch (err: any) {
      console.error('Error deleting table:', err)
      const errorMessage = err?.response?.data?.message || err?.message || 'Error al eliminar la mesa'
      toast.error(errorMessage)
    }
  }

  // Handle status change
  const handleStatusChange = async (table: TableDto, newStatus: 'FREE' | 'OCCUPIED' | 'RESERVED') => {
    try {
      await tableService.updateStatus(table.id, newStatus)
      toast.success(`Mesa ${table.number} actualizada a ${statusConfig[newStatus].label}`)
      fetchTables()
    } catch (err: any) {
      console.error('Error updating status:', err)
      toast.error('Error al actualizar el estado')
    }
  }

  // Open edit modal
  const openEditModal = (table: TableDto) => {
    setSelectedTable(table)
    setFormData({
      number: table.number,
      capacity: table.capacity,
      notes: table.notes || ''
    })
    setIsEditModalOpen(true)
  }

  // Close modals
  const closeModals = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedTable(null)
    setFormData({ number: 0, capacity: 0, notes: '' })
  }

  // Stats
  const stats = {
    total: tables.length,
    free: tables.filter(t => t.status === 'FREE').length,
    occupied: tables.filter(t => t.status === 'OCCUPIED').length,
    reserved: tables.filter(t => t.status === 'RESERVED').length,
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
          <p className="text-slate-400">Solo los administradores pueden gestionar mesas</p>
        </div>
      </div>
    )
  }

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Gestión de Mesas</h1>
            <p className="text-slate-400">Administra las mesas del restaurante</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              leftIcon={<RefreshCw className="w-4 h-4" />}
              onClick={fetchTables}
              disabled={loading}
            >
              Actualizar
            </Button>
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateModalOpen(true)}
            >
              Nueva Mesa
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-slate-300" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Disponibles</p>
                <p className="text-2xl font-bold text-white">{stats.free}</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Ocupadas</p>
                <p className="text-2xl font-bold text-white">{stats.occupied}</p>
              </div>
            </div>
          </Card>
          <Card className="!p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Reservadas</p>
                <p className="text-2xl font-bold text-white">{stats.reserved}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar por número o capacidad..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-slate-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="ALL">Todos los estados</option>
                  <option value="FREE">Disponibles</option>
                  <option value="OCCUPIED">Ocupadas</option>
                  <option value="RESERVED">Reservadas</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tables Grid */}
        {loading ? (
          <div className="py-12">
            <LoadingState message="Cargando mesas..." />
          </div>
        ) : filteredTables.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No hay mesas</h3>
              <p className="text-slate-400 mb-6">Crea tu primera mesa para comenzar</p>
              <Button
                variant="primary"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsCreateModalOpen(true)}
              >
                Crear Primera Mesa
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredTables.map((table) => {
              const status = statusConfig[table.status]
              return (
                <Card key={table.id} className="hover:border-slate-600 transition-colors">
                  <CardContent className="p-4">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl font-bold text-white">Mesa {table.number}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-400 text-sm">{table.capacity} asientos</span>
                        </div>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${status.color}`} />
                    </div>

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-3 ${status.bgColor} ${status.borderColor} border`}>
                      <span className={status.textColor}>{status.label}</span>
                    </div>

                    {/* Active Orders */}
                    {table.activeOrdersCount !== undefined && table.activeOrdersCount > 0 && (
                      <div className="mb-3 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <p className="text-amber-400 text-xs font-medium">
                          {table.activeOrdersCount} orden{table.activeOrdersCount > 1 ? 'es' : ''} activa{table.activeOrdersCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    {table.notes && (
                      <p className="text-slate-500 text-xs mb-3 italic">{table.notes}</p>
                    )}

                    {/* Actions */}
                    <div className="flex flex-col gap-2 mt-4">
                      {/* Status Change */}
                      {table.status !== 'FREE' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(table, 'FREE')}
                          className="w-full"
                        >
                          Marcar Disponible
                        </Button>
                      )}
                      {table.status !== 'OCCUPIED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(table, 'OCCUPIED')}
                          className="w-full"
                        >
                          Marcar Ocupada
                        </Button>
                      )}
                      {table.status !== 'RESERVED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(table, 'RESERVED')}
                          className="w-full"
                        >
                          Marcar Reservada
                        </Button>
                      )}
                      
                      {/* Edit & Delete */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          leftIcon={<Edit className="w-3 h-3" />}
                          onClick={() => openEditModal(table)}
                          className="flex-1"
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          leftIcon={<Trash2 className="w-3 h-3" />}
                          onClick={() => handleDelete(table)}
                          className="flex-1"
                        >
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

        {/* Create Modal */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={closeModals}
          title="Nueva Mesa"
          footer={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={closeModals} className="flex-1" disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleCreate} className="flex-1" isLoading={isSubmitting}>
                Crear Mesa
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Número de Mesa *</label>
              <Input
                type="number"
                value={formData.number || ''}
                onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
                placeholder="Ej: 1"
                min={1}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Capacidad (Asientos) *</label>
              <Input
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                placeholder="Ej: 4"
                min={1}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Notas (Opcional)</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre la mesa..."
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                rows={3}
              />
            </div>
          </div>
        </Modal>

        {/* Edit Modal */}
        <Modal
          isOpen={isEditModalOpen && !!selectedTable}
          onClose={closeModals}
          title={`Editar Mesa ${selectedTable?.number ?? ''}`}
          footer={
            <div className="flex gap-3">
              <Button variant="secondary" onClick={closeModals} className="flex-1" disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button variant="primary" onClick={handleEdit} className="flex-1" isLoading={isSubmitting}>
                Guardar Cambios
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Número de Mesa *</label>
              <Input
                type="number"
                value={formData.number || ''}
                onChange={(e) => setFormData({ ...formData, number: parseInt(e.target.value) || 0 })}
                placeholder="Ej: 1"
                min={1}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Capacidad (Asientos) *</label>
              <Input
                type="number"
                value={formData.capacity || ''}
                onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                placeholder="Ej: 4"
                min={1}
              />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-2">Notas (Opcional)</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Notas adicionales sobre la mesa..."
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
                rows={3}
              />
            </div>
          </div>
        </Modal>
      </div>
      </div>
    </AdminLayout>
  )
}

export default TableManagement
