import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, FolderKanban, ClipboardCheck, TrendingUp } from 'lucide-react'
import { api, type DashboardStats, type TopWorker, type RecentEvaluation } from '../lib/api'
import { useOrg } from '../lib/org'
import ScoreBadge from '../components/ui/ScoreBadge'

export default function Dashboard() {
  const { orgId: ORG_ID } = useOrg()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [topWorkers, setTopWorkers] = useState<TopWorker[]>([])
  const [recent, setRecent] = useState<RecentEvaluation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ORG_ID) return
    async function load() {
      try {
        const [s, tw, re] = await Promise.all([
          api.getStats(ORG_ID!),
          api.getTopWorkers(ORG_ID!),
          api.getRecentEvaluations(ORG_ID!),
        ])
        setStats(s)
        setTopWorkers(tw)
        setRecent(re)
      } catch {
        // Will fail without DB — expected in dev without docker
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [ORG_ID])

  if (loading) return <div className="animate-pulse text-gray-400">Cargando...</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard icon={<FolderKanban className="w-5 h-5 text-blue-600" />} label="Proyectos" value={stats?.project_count ?? 0} sub={`${stats?.active_project_count ?? 0} activos`} />
        <KPICard icon={<Users className="w-5 h-5 text-emerald-600" />} label="Trabajadores" value={stats?.worker_count ?? 0} />
        <KPICard icon={<ClipboardCheck className="w-5 h-5 text-violet-600" />} label="Evaluaciones" value={stats?.evaluation_count ?? 0} />
        <KPICard icon={<TrendingUp className="w-5 h-5 text-amber-600" />} label="Score Promedio" value={stats?.avg_score_overall?.toFixed(1) ?? '—'} sub={stats?.rehire_rate ? `${(stats.rehire_rate * 100).toFixed(0)}% recontrataria` : undefined} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Workers */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Top Trabajadores</h2>
          {topWorkers.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin evaluaciones aun</p>
          ) : (
            <div className="space-y-2">
              {topWorkers.map((w) => (
                <Link key={w.id} to={`/app/workers/${w.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{w.full_name}</p>
                    <p className="text-xs text-gray-500">{w.specialty} · {w.evaluation_count} evals</p>
                  </div>
                  <ScoreBadge score={w.avg_score} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Evaluations */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Evaluaciones Recientes</h2>
          {recent.length === 0 ? (
            <p className="text-gray-400 text-sm">Sin evaluaciones aun</p>
          ) : (
            <div className="space-y-2">
              {recent.map((e) => (
                <div key={e.id} className="flex items-center justify-between p-2 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{e.worker_name}</p>
                    <p className="text-xs text-gray-500">{e.project_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreBadge score={e.score_average} size="sm" />
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${e.would_rehire === 'yes' ? 'bg-green-100 text-green-700' : e.would_rehire === 'no' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {e.would_rehire === 'yes' ? 'Si' : e.would_rehire === 'no' ? 'No' : 'Reservas'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function KPICard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-2">{icon}<span className="text-sm text-gray-600">{label}</span></div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  )
}
