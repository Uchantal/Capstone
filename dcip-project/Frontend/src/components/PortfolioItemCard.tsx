interface Props {
  discipline: string
  title: string
  createdAt: string
  syncStatus?: 'synced' | 'pending'
  sessionNumber?: number
  onView?: () => void
}

export default function PortfolioItemCard({
  discipline,
  title,
  createdAt,
  syncStatus = 'synced',
  sessionNumber,
  onView,
}: Props) {
  const date = new Date(createdAt)
  const formatted = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const label = discipline.replace('-', ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  return (
    <div className="bg-white border border-surface-border rounded-xl p-4 flex items-start gap-4">
      <div className="bg-white border border-surface-border rounded-xl w-16 h-16 flex items-center justify-center flex-shrink-0">
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-text-primary font-semibold text-sm">{label}</p>
            <p className="text-text-secondary text-xs mb-1">
              {sessionNumber ? `Session ${sessionNumber} · ` : ''}{formatted}, {time}
            </p>
            <p className="text-text-primary text-sm line-clamp-2">{title}</p>
          </div>
          {onView && (
            <button
              onClick={onView}
              className="text-primary text-sm font-medium flex-shrink-0 hover:text-primary-dark transition-colors"
            >
              View →
            </button>
          )}
        </div>

        <div className="mt-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              syncStatus === 'synced'
                ? 'bg-secondary/10 text-status-synced'
                : 'bg-surface-warm text-status-offline'
            }`}
          >
            {syncStatus === 'synced' ? 'Synced' : 'Pending'}
          </span>
        </div>
      </div>
    </div>
  )
}
