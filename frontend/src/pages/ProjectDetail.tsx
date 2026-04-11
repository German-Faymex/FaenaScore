import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck } from 'lucide-react'
import { api, type Project, type ProjectWorkerItem } from '../lib/api'
import { useOrg } from '../lib/org'
import ScoreBadge from '../components/ui/ScoreBadge'

export default function ProjectDetail() {
  const { orgId: ORG_ID } = useOrg()
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [workers, setWorkers] = useState<ProjectWorkerItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id || !ORG_ID) return
    async function load() {
      try {
        const [p, w] = await Promise.all([
          api.getProject(ORG_ID!, id!),
          api.listProjectWorkers(ORG_ID!, id!),
        ])
        setProject(p)
        setWorkers(w)
      } catch { /* */ }
      finally { setLoading(false) }
    }
    load()
  }, [id, ORG_ID])

  if (loading) return <div className="animate-pulse text-gray-400">Cargando...</div>
  if (!project) return <div className="text-gray-500">Proyecto no encontrado</div>

  const unevaluated = workers.filter((w) => !w.evaluated)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/projects" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          {project.client_name && <p className="text-sm text-gray-500">{project.client_name} · {project.location}</p>}
        </div>
      </div>

      {/* Evaluate button */}
      {unevaluated.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-medium text-blue-900">{unevaluated.length} trabajadores sin evaluar</p>
            <p className="text-sm text-blue-700">Completa las evaluaciones del equipo</p>
          </div>
          <Link
            to={`/evaluate/${id}/${unevaluated[0].id}`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <ClipboardCheck className="w-4 h-4" /> Evaluar
          </Link>
        </div>
      )}

      {/* Workers table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Equipo ({workers.length})</h2>
        </div>
        {workers.length === 0 ? (
          <p className="p-4 text-gray-400 text-sm">Sin trabajadores asignados</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {workers.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link to={`/workers/${w.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                    {w.first_name} {w.last_name}
                  </Link>
                  <p className="text-xs text-gray-500">{w.specialty}</p>
                </div>
                <div className="flex items-center gap-2">
                  {w.evaluated ? (
                    <ScoreBadge score={w.score_in_project} size="sm" />
                  ) : (
                    <Link to={`/evaluate/${id}/${w.id}`} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium hover:bg-blue-200">
                      Evaluar
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
