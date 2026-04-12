import { useState, type FormEvent } from 'react'
import { api } from '../../lib/api'
import { SPECIALTIES } from '../../lib/constants'
import { formatRut, validateRut } from '../../lib/rut'

interface Props {
  orgId: string
  onCreated: () => void
  onCancel: () => void
}

export default function NewWorkerForm({ orgId, onCreated, onCancel }: Props) {
  const [rut, setRut] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [specialty, setSpecialty] = useState(SPECIALTIES[0])
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!validateRut(rut)) {
      setError('RUT invalido')
      return
    }
    if (!firstName.trim() || !lastName.trim()) {
      setError('Nombre y apellido son requeridos')
      return
    }
    setSubmitting(true)
    try {
      await api.createWorker(orgId, {
        rut: formatRut(rut),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        specialty,
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      })
      onCreated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear trabajador')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
  const rutValid = rut.length === 0 || validateRut(rut)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">RUT *</label>
        <input
          type="text"
          value={rut}
          onChange={(e) => setRut(e.target.value)}
          onBlur={() => rut && setRut(formatRut(rut))}
          className={`${inputCls} ${!rutValid ? 'border-red-400' : ''}`}
          placeholder="12.345.678-9"
          autoFocus
        />
        {!rutValid && <p className="text-xs text-red-600 mt-1">RUT invalido</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
          <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="Juan" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellido *</label>
          <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Perez" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Especialidad *</label>
        <select value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={inputCls}>
          {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Telefono</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+56 9 1234 5678" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="juan@ejemplo.cl" />
        </div>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={submitting} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Creando...' : 'Crear Trabajador'}
        </button>
      </div>
    </form>
  )
}
