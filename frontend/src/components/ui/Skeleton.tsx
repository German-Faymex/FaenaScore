interface Props {
  count?: number
  className?: string
}

export default function Skeleton({ count = 1, className = 'h-4 w-full' }: Props) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-gray-200 rounded animate-pulse ${className}`} />
      ))}
    </>
  )
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse" />
          <div className="flex gap-4">
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function RowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-4 py-3">
          <div className="h-4 flex-1 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-6 w-12 bg-gray-200 rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}
