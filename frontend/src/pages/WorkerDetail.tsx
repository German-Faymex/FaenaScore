import { useCallback, useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Phone, Mail, Pencil } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api, type WorkerDetail as WorkerDetailType } from '../lib/api'
import { useOrg } from '../lib/org'
import StarRating from '../components/ui/StarRating'
import ScoreBadge from '../components/ui/ScoreBadge'
import Modal from '../components/ui/Modal'
import NewWorkerForm from '../components/forms/NewWorkerForm'

export default function WorkerDetail() {
  const { orgId: ORG_ID } = useOrg()
  const { id } = useParams()
  const [worker, setWorker] = useState<WorkerDetailType | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEdit, setShowEdit] = useState(false)

  const load = useCallback(() => {
    if (!id || !ORG_ID) return
    api.getWorker(ORG_ID!, id).then(setWorker).catch(() => {}).finally(() => setLoading(false))
  }, [id, ORG_ID])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="animate-pulse text-gray-400">Cargando...</div>
  if (!worker) return <div className="text-gray-500">Trabajador no encontrado</div>

  const { avg_scores, score_trend, rehire_stats, evaluations } = worker
  const totalRehire = rehire_stats.yes + rehire_stats.reservations + rehire_stats.no

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/app/workers" className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5" /></Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{worker.first_name} {worker.last_name}</h1>
          <p className="text-sm text-gray-500">{worker.specialty} · {worker.rut}</p>
        </div>
        <ScoreBadge score={worker.avg_score} />
        <button onClick={() => setShowEdit(true)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Editar">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Contact */}
      <div className="flex gap-3">
        {worker.phone && (
          <a href={`tel:${worker.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
            <Phone className="w-4 h-4" /> {worker.phone}
          </a>
        )}
        {worker.email && (
          <a href={`mailto:${worker.email}`} className="flex items-center gap-1.5 text-sm text-gray-600 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50">
            <Mail className="w-4 h-4" /> {worker.email}
          </a>
        )}
      </div>

      {/* Scores breakdown */}
      {avg_scores && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Scores Promedio</h2>
          <div className="space-y-3">
            {[
              { label: 'Calidad', value: avg_scores.quality },
              { label: 'Seguridad', value: avg_scores.safety },
              { label: 'Puntualidad', value: avg_scores.punctuality },
              { label: 'Trabajo en Equipo', value: avg_scores.teamwork },
              { label: 'Habilidad Tecnica', value: avg_scores.technical },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{label}</span>
                <StarRating value={Math.round(value)} readonly size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score trend chart */}
      {score_trend.length > 1 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Tendencia</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={score_trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project_name" tick={{ fontSize: 11 }} />
              <YAxis domain={[1, 5]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score_average" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Rehire stats */}
      {totalRehire > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Recontratacion</h2>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{rehire_stats.yes}</p>
              <p className="text-xs text-gray-500">Si</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">{rehire_stats.reservations}</p>
              <p className="text-xs text-gray-500">Reservas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{rehire_stats.no}</p>
              <p className="text-xs text-gray-500">No</p>
            </div>
          </div>
        </div>
      )}

      {ORG_ID && (
        <Modal open={showEdit} onClose={() => setShowEdit(false)} title="Editar Trabajador">
          <NewWorkerForm
            orgId={ORG_ID}
            initial={worker}
            onCreated={() => { setShowEdit(false); load() }}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      )}

      {/* Evaluation history */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Historial de Evaluaciones</h2>
        {evaluations.length === 0 ? (
          <p className="text-gray-400 text-sm">Sin evaluaciones</p>
        ) : (
          <div className="space-y-3">
            {evaluations.map((ev) => (
              <div key={ev.id} className="border border-gray-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-900">{ev.project_name}</span>
                  <ScoreBadge score={ev.score_average} size="sm" />
                </div>
                {ev.comment && <p className="text-xs text-gray-600 mt-1">{ev.comment}</p>}
                <p className="text-xs text-gray-400 mt-1">{ev.evaluator_name || 'Sin evaluador'} · {new Date(ev.created_at).toLocaleDateString('es-CL')}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
