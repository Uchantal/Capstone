import { useEffect, useState } from 'react'

interface Props {
  children: React.ReactNode
}

export default function CanvasInstructionPanel({ children }: Props) {
  // Auto-collapse on small screens so the canvas is fully usable immediately
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 640)

  // Re-collapse if the window is resized down to mobile
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < 640) setCollapsed(true)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div
      className="flex-shrink-0 bg-white border-r border-surface-border flex flex-col overflow-hidden"
      style={{
        width: collapsed ? '2rem' : 'min(40%, 420px)',
        minWidth: collapsed ? 'auto' : 'min(320px, 50vw)',
        transition: 'width 200ms ease',
      }}
    >
      {/* Collapse toggle */}
      <div className="h-8 flex-shrink-0 flex items-center justify-end px-1 border-b border-surface-border">
        <button
          onClick={() => setCollapsed(p => !p)}
          aria-label={collapsed ? 'Show instructions' : 'Hide instructions'}
          className="w-6 h-6 flex items-center justify-center border border-primary bg-white text-text-primary rounded hover:bg-primary/10 transition-colors flex-shrink-0"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <polyline points="9 18 15 12 9 6" />
              : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      </div>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col">
          {children}
        </div>
      )}
    </div>
  )
}
