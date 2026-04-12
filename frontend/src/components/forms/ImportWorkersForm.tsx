import { useState, type FormEvent } from 'react'
import { Upload } from 'lucide-react'
import { api } from '../../lib/api'

interface Props {
  orgId: string
  onDone: () => void
  onCancel: () => void
}

export default function ImportWorkersForm({ orgId, onDone, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<{ created: number; updated: number; errors: string[] } | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!file) {
      setError('Selecciona un archivo')
      return
    }
    setSubmitting(true)
    try {
      const res = await api.importWorkers(orgId, file)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al importar')
    } finally {
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm">
          <p className="font-medium text-green-900">Importacion completa</p>
          <p className="text-green-700">{result.created} creados, {result.updated} actualizados</p>
        </div>
        {result.errors.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm max-h-40 overflow-y-auto">
            <p className="font-medium text-amber-900 mb-1">{result.errors.length} errores:</p>
            <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
              {result.errors.slice(0, 20).map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
        <button onClick={onDone} className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
          Listo
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-3">
        <p className="font-medium text-gray-900 mb-1">Formato esperado</p>
        <p>Excel o CSV con columnas: <code className="text-xs">rut, first_name, last_name, specialty, phone, email</code></p>
      </div>

      <label className="flex flex-col items-center justify-center w-full min-h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 p-6">
        <Upload className="w-8 h-8 text-gray-400 mb-2" />
        <span className="text-sm text-gray-600">
          {file ? file.name : 'Click para subir Excel o CSV'}
        </span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
      </label>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
          Cancelar
        </button>
        <button type="submit" disabled={submitting || !file} className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
          {submitting ? 'Subiendo...' : 'Importar'}
        </button>
      </div>
    </form>
  )
}
