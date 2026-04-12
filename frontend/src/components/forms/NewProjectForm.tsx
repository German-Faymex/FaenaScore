import { useState, type FormEvent } from 'react'
import { api } from '../../lib/api'

interface Props {
  orgId: string
  onCreated: () => void
  onCancel: () => void
}

export default function NewProjectForm({ orgId, onCreated, onCancel }: Props) {
  const [name, setName] = useState('')
  const [clientName, setClientName] = useState('')
  const [location, setLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }
    setSubmitting(true)
    try {
      await api.createProject(orgId, {
        name: name.trim(),
        client_name: clientName.trim() || undefined,
        location: location.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear proyecto')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Mantencion Molino SAG" autoFocus />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
        <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} className={inputCls} placeholder="Minera Escondida" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Ubicacion</label>
        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} placeholder="Antofagasta" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Inicio</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fin</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Creando...' : 'Crear Proyecto'}
        </button>
      </div>
    </form>
  )
}
