import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ClipboardCheck, UserPlus, Pencil } from 'lucide-react'
import { api, type Project, type ProjectWorkerItem } from '../lib/api'
import { useOrg } from '../lib/org'
import { PROJECT_STATUSES } from '../lib/constants'
import ScoreBadge from '../components/ui/ScoreBadge'
import Modal from '../components/ui/Modal'
import AssignWorkersForm from '../components/forms/AssignWorkersForm'
import NewProjectForm from '../components/forms/NewProjectForm'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  planning: 'bg-gray-100 text-gray-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function ProjectDetail() {
  const { orgId: ORG_ID } = useOrg()
  const { id } = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [workers, setWorkers] = useState<ProjectWorkerItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showAssign, setShowAssign] = useState(false)
  const [showEdit, setShowEdit] = useState(false)

  const load = useCallback(async () => {
    if (!id || !ORG_ID) return
    try {
      const [p, w] = await Promise.all([
        api.getProject(ORG_ID, id),
        api.listProjectWorkers(ORG_ID, id),
      ])
      setProject(p)
      setWorkers(w)
    } catch { /* */ }
    finally { setLoading(false) }
  }, [id, ORG_ID])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando proyecto">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-gray-200 rounded-lg animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-7 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-48 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="h-5 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-100">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
  if (!project) return <div className="text-gray-500">Proyecto no encontrado</div>

  const unevaluated = workers.filter((w) => !w.evaluated)

  return (
    <div className="space-y-6">
      <div>
        <nav className="flex items-center gap-1 text-xs text-gray-500 mb-2" aria-label="Breadcrumb">
          <Link to="/app/projects" className="hover:text-gray-700">Proyectos</Link>
          <span className="text-gray-400">/</span>
          <span className="text-gray-700 truncate">{project.name}</span>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/app/projects" className="p-2 hover:bg-gray-100 rounded-lg" aria-label="Volver a proyectos">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[project.status] || 'bg-gray-100 text-gray-700'}`}>
                {PROJECT_STATUSES.find((s) => s.value === project.status)?.label || project.status}
              </span>
            </div>
            {project.client_name && <p className="text-sm text-gray-500">{project.client_name} · {project.location}</p>}
          </div>
          <button onClick={() => setShowEdit(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Editar">
            <Pencil className="w-4 h-4" />
          </button>
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
            to={`/app/evaluate/${id}/${unevaluated[0].id}`}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <ClipboardCheck className="w-4 h-4" /> Evaluar
          </Link>
        </div>
      )}

      {/* Workers table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Equipo ({workers.length})</h2>
          <button onClick={() => setShowAssign(true)} className="flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700">
            <UserPlus className="w-4 h-4" /> Asignar
          </button>
        </div>
        {workers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500">Sin trabajadores asignados al proyecto</p>
            <button
              onClick={() => setShowAssign(true)}
              className="mt-3 inline-flex items-center gap-1.5 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700"
            >
              <UserPlus className="w-4 h-4" /> Asignar trabajadores
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {workers.map((w) => (
              <div key={w.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link to={`/app/workers/${w.id}`} className="text-sm font-medium text-gray-900 hover:text-blue-600">
                    {w.first_name} {w.last_name}
                  </Link>
                  <p className="text-xs text-gray-500">{w.specialty}</p>
                </div>
                <div className="flex items-center gap-2">
                  {w.evaluated ? (
                    <ScoreBadge score={w.score_in_project} size="sm" />
                  ) : (
                    <Link to={`/app/evaluate/${id}/${w.id}`} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium hover:bg-blue-200">
                      Evaluar
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {ORG_ID && id && (
        <>
          <Modal open={showAssign} onClose={() => setShowAssign(false)} title="Asignar Trabajadores" size="lg">
            <AssignWorkersForm
              orgId={ORG_ID}
              projectId={id}
              excludeIds={workers.map((w) => w.id)}
              onAssigned={() => { setShowAssign(false); load() }}
              onCancel={() => setShowAssign(false)}
            />
          </Modal>
          <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar Proyecto">
            <NewProjectForm
              orgId={ORG_ID}
              initial={project}
              onCreated={() => { setShowEdit(false); load() }}
              onCancel={() => setShowEdit(false)}
            />
          </Modal>
        </>
      )}
    </div>
  )
}
