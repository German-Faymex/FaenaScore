interface ScoreBadgeProps {
  score: number | null
  size?: 'sm' | 'md'
}

function getColorClass(score: number): string {
  if (score < 2) return 'bg-red-100 text-red-800'
  if (score < 3) return 'bg-orange-100 text-orange-800'
  if (score < 4) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

export default function ScoreBadge({ score, size = 'md' }: ScoreBadgeProps) {
  if (score === null) return <span className="text-gray-400 text-sm">—</span>

  const sizeClass = size === 'sm' ? 'text-xs px-1.5 py-0.5' : 'text-sm px-2 py-0.5'

  return (
    <span className={`inline-flex items-center font-semibold rounded-full ${sizeClass} ${getColorClass(score)}`}>
      {score.toFixed(1)}
    </span>
  )
}
