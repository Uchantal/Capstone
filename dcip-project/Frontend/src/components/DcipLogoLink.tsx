import { Link } from 'react-router-dom'

export default function DcipLogoLink() {
  return (
    <Link
      to="/dashboard"
      className="bg-primary rounded-lg w-9 h-8 flex items-center justify-center hover:opacity-80 transition-opacity flex-shrink-0"
    >
      <span className="text-white font-bold text-[10px] tracking-tight">DCIP</span>
    </Link>
  )
}
