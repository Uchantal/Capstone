import { useState } from 'react'

interface Props {
  children: React.ReactNode
}

export default function CanvasInstructionPanel({ children }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className="flex-shrink-0 bg-white border-r border-surface-border flex flex-col overflow-hidden"
      style={{
        width: collapsed ? '2rem' : '40%',
        minWidth: collapsed ? 'auto' : '320px',
        transition: 'width 200ms ease',
      }}
    >
      <div className="h-8 flex-shrink-0 flex items-center justify-end px-1 border-b border-surface-border">
        <button
          onClick={() => setCollapsed(p => !p)}
          title={collapsed ? 'Show instructions' : 'Hide instructions'}
          className="w-6 h-6 flex items-center justify-center border border-[#C8960C] bg-white text-[#1A1A1A] rounded hover:bg-[#C8960C]/10 transition-colors flex-shrink-0"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            {collapsed
              ? <polyline points="9 18 15 12 9 6" />
              : <polyline points="15 18 9 12 15 6" />}
          </svg>
        </button>
      </div>
      {!collapsed && (
        <div className="flex-1 overflow-y-auto p-6 flex flex-col">
          {children}
        </div>
      )}
    </div>
  )
}
