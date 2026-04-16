export function formatRelative(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''

  const diffMs = Date.now() - d.getTime()
  const diffMin = Math.round(diffMs / 60_000)
  if (diffMin < 1) return 'ahora'
  if (diffMin < 60) return `hace ${diffMin} min`

  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `hace ${diffH} h`

  const diffD = Math.round(diffH / 24)
  if (diffD === 1) return 'ayer'
  if (diffD < 7) return `hace ${diffD} días`
  if (diffD < 30) return `hace ${Math.round(diffD / 7)} sem`
  if (diffD < 365) return `hace ${Math.round(diffD / 30)} meses`
  return `hace ${Math.round(diffD / 365)} años`
}
