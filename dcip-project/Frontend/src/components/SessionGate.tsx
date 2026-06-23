import { useSessionGate } from '../hooks/useSessionGate'

export default function SessionGate({ children }: { children: React.ReactNode }) {
  const { isOpen } = useSessionGate()

  // null = first check still in flight; show blank to avoid content flash
  if (isOpen === null) {
    return <div className="min-h-screen bg-white" />
  }

  if (isOpen === false) {
    return (
      <div className="min-h-screen bg-[#F9F7F4] flex flex-col items-center justify-center px-6">
        <div className="bg-white border border-surface-border rounded-2xl p-10 max-w-md w-full text-center shadow-sm">
          <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-7 h-7 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-text-primary font-bold text-xl mb-3">Lab Session Closed</h1>
          <p className="text-text-secondary text-sm leading-relaxed mb-6">
            Your supervisor has closed the lab session. Please wait for the session to be
            opened before continuing your practice.
          </p>
          <p className="text-text-muted text-xs">
            This page checks automatically every 30 seconds.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
