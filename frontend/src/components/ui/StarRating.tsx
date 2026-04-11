import { Star } from 'lucide-react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  size?: 'sm' | 'md' | 'lg'
  readonly?: boolean
}

const sizes = { sm: 'w-5 h-5', md: 'w-7 h-7', lg: 'w-9 h-9' }
const tapSizes = { sm: 'p-1', md: 'p-1.5', lg: 'p-2' }

function getColor(value: number) {
  if (value <= 2) return 'text-red-500'
  if (value <= 3) return 'text-yellow-500'
  return 'text-green-500'
}

export default function StarRating({ value, onChange, size = 'md', readonly = false }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star)}
          className={`${tapSizes[size]} ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'} transition-transform touch-manipulation`}
        >
          <Star
            className={`${sizes[size]} ${star <= value ? getColor(value) : 'text-gray-300'}`}
            fill={star <= value ? 'currentColor' : 'none'}
          />
        </button>
      ))}
    </div>
  )
}
