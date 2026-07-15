import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function DcipLogoLink() {
  const navigate = useNavigate()
  const { user } = useAuth()

  return (
    <button
      onClick={() => navigate(user ? '/dashboard' : '/')}
      className="bg-primary rounded-lg w-9 h-8 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
    >
      <span className="text-white font-bold text-[10px] tracking-tight">DCIP</span>
    </button>
  )
}
