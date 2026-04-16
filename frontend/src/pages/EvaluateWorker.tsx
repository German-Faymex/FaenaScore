import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, ArrowLeft } from 'lucide-react'
import StarRating from '../components/ui/StarRating'
import { api } from '../lib/api'
import { useOrg } from '../lib/org'
import { SCORE_LABELS, REHIRE_OPTIONS } from '../lib/constants'

interface ContextHeader {
  worker_name: string
  worker_rut: string
  worker_specialty: string
  project_name: string
  project_client?: string | null
}

export default function EvaluateWorker() {
  const { orgId: ORG_ID } = useOrg()
  const { projectId, workerId } = useParams()
  const navigate = useNavigate()

  const [ctx, setCtx] = useState<ContextHeader | null>(null)
  const [scores, setScores] = useState([0, 0, 0, 0, 0])
  const [wouldRehire, setWouldRehire] = useState('')
  const [rehireReason, setRehireReason] = useState('')
  const [comment, setComment] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!ORG_ID || !projectId || !workerId) return
    let cancelled = false
    Promise.all([
      api.getWorker(ORG_ID, workerId),
      api.getProject(ORG_ID, projectId),
    ])
      .then(([w, p]) => {
        if (cancelled) return
        setCtx({
          worker_name: `${w.first_name} ${w.last_name}`,
          worker_rut: w.rut,
          worker_specialty: w.specialty,
          project_name: p.name,
          project_client: p.client_name,
        })
      })
      .catch(() => { /* header stays in loading state; submit still works */ })
    return () => { cancelled = true }
  }, [ORG_ID, projectId, workerId])

  const allScoresSet = scores.every((s) => s > 0)
  const needsReason = wouldRehire === 'reservations' || wouldRehire === 'no'
  const reasonOk = !needsReason || rehireReason.trim().length >= 3
  const canSubmit = allScoresSet && wouldRehire !== '' && reasonOk

  async function handleSubmit() {
    if (!canSubmit || !projectId || !workerId) return
    setSaving(true)
    setError('')

    try {
      await api.createEvaluation(ORG_ID!, {
        project_id: projectId,
        worker_id: workerId,
        score_quality: scores[0],
        score_safety: scores[1],
        score_punctuality: scores[2],
        score_teamwork: scores[3],
        score_technical: scores[4],
        would_rehire: wouldRehire,
        rehire_reason: rehireReason || undefined,
        comment: comment || undefined,
      })
      navigate(`/app/projects/${projectId}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg shrink-0 mt-0.5">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Evaluar Trabajador</p>
          {ctx ? (
            <>
              <h1 className="text-xl font-bold text-gray-900 truncate">{ctx.worker_name}</h1>
              <p className="text-sm text-gray-600 truncate">
                {ctx.worker_specialty} · RUT {ctx.worker_rut}
              </p>
              <p className="text-sm text-gray-500 mt-1 truncate">
                Proyecto: <span className="font-medium text-gray-700">{ctx.project_name}</span>
                {ctx.project_client ? ` · ${ctx.project_client}` : ''}
              </p>
            </>
          ) : (
            <>
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mt-1" />
              <div className="h-4 w-32 bg-gray-100 rounded animate-pulse mt-1" />
            </>
          )}
        </div>
      </div>

      {/* Score dimensions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-5">
        {SCORE_LABELS.map((label, i) => (
          <div key={label} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <StarRating value={scores[i]} onChange={(v) => { const n = [...scores]; n[i] = v; setScores(n) }} size="lg" />
          </div>
        ))}
      </div>

      {/* Rehire */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        <p className="text-sm font-medium text-gray-700">¿Recontratarías a este trabajador?</p>
        <div className="grid grid-cols-3 gap-2">
          {REHIRE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setWouldRehire(opt.value)}
              className={`py-3 px-2 rounded-lg text-sm font-medium border-2 transition-all touch-manipulation ${
                wouldRehire === opt.value
                  ? `${opt.color} border-current`
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {needsReason && (
          <div>
            <textarea
              placeholder="Motivo (requerido)..."
              value={rehireReason}
              onChange={(e) => setRehireReason(e.target.value)}
              rows={2}
              className={`w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 ${
                rehireReason.trim().length > 0 && !reasonOk ? 'border-red-400' : 'border-gray-300'
              }`}
            />
            {!reasonOk && rehireReason.trim().length > 0 && (
              <p className="text-xs text-red-600 mt-1">El motivo debe tener al menos 3 caracteres</p>
            )}
          </div>
        )}
      </div>

      {/* Comment */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <textarea
          placeholder="Comentario adicional (opcional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || saving}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3.5 rounded-xl text-base font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
      >
        <Save className="w-5 h-5" />
        {saving ? 'Guardando...' : 'Guardar Evaluación'}
      </button>
    </div>
  )
}
