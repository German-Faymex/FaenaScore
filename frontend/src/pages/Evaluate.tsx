import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import { api, type Project } from '../lib/api'

const ORG_ID = 'default'

export default function Evaluate() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.listProjects(ORG_ID, { status: 'active', size: 50 })
      .then((res) => setProjects(res.items))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="animate-pulse text-gray-400">Cargando...</div>

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Evaluar Equipo</h1>
      <p className="text-gray-600">Selecciona un proyecto activo para evaluar a los trabajadores.</p>

      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <ClipboardCheck className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No hay proyectos activos</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((p) => (
            <Link key={p.id} to={`/projects/${p.id}`} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-200 hover:shadow-sm transition-all">
              <h3 className="font-semibold text-gray-900">{p.name}</h3>
              {p.client_name && <p className="text-sm text-gray-500">{p.client_name}</p>}
              <div className="flex gap-4 mt-2 text-xs text-gray-500">
                <span>{p.worker_count} trabajadores</span>
                <span>{p.evaluation_count} evaluados</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
