import type { PitchStatus } from '../../utils/voicePitch'

interface Props {
  status: PitchStatus
  label?: string
}

export default function PitchIndicator({ status, label }: Props) {
  return (
    <div className="space-y-1">
      {label && <p className="text-text-muted text-xs">{label}</p>}
      <div className="w-full rounded-full overflow-hidden border border-gray-200 h-8 flex text-xs font-medium">
        <div className={`flex-1 flex items-center justify-center transition-colors duration-100 ${
          status === 'none' ? 'bg-gray-300 text-gray-600' : 'bg-gray-100 text-gray-300'
        }`}>
          No voice
        </div>
        <div className={`flex-1 flex items-center justify-center transition-colors duration-100 ${
          status === 'close' ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-300'
        }`}>
          Close
        </div>
        <div className={`flex-1 flex items-center justify-center transition-colors duration-100 ${
          status === 'on' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'
        }`}>
          On pitch
        </div>
      </div>
    </div>
  )
}
