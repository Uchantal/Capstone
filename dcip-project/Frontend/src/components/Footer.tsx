import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-[#080A0E]">
      <div className="flex h-1">
        <div className="flex-1 bg-accent" />
        <div className="flex-1 bg-primary" />
        <div className="flex-1 bg-secondary" />
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">

          <div>
            <Link to="/" className="inline-block w-9 h-9 bg-primary rounded-lg flex items-center justify-center mb-3 hover:opacity-80 transition-opacity">
              <span className="text-white font-bold text-[11px] tracking-tight">DCIP</span>
            </Link>
            <p className="text-white font-semibold text-sm mb-2">
              Digital Creative Infrastructure Platform
            </p>
            <p className="text-white/50 text-xs max-w-xs">
              Building creative skills for talented youth in Rwandan secondary schools.
            </p>
          </div>

          <div>
            <p className="text-white/40 text-xs font-semibold tracking-widest mb-3 uppercase">Platform</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/#about" className="text-white/70 text-sm hover:text-white transition-colors">About</Link>
              <Link to="/#disciplines" className="text-white/70 text-sm hover:text-white transition-colors">Disciplines</Link>
              <Link to="/#how-it-works" className="text-white/70 text-sm hover:text-white transition-colors">How It Works</Link>
              <Link to="/register" className="text-white/70 text-sm hover:text-white transition-colors">Register</Link>
              <Link to="/login" className="text-white/70 text-sm hover:text-white transition-colors">Log In</Link>
            </div>
          </div>

          <div>
            <p className="text-white/40 text-xs font-semibold tracking-widest mb-3 uppercase">Support</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/feedback" className="text-white/70 text-sm hover:text-white transition-colors">Send us Feedback</Link>
            </div>
          </div>

          <div>
            <p className="text-white/40 text-xs font-semibold tracking-widest mb-3 uppercase">Contact</p>
            <p className="text-white/70 text-sm mb-2">For inquiries and collaboration:</p>
            <a
              href="mailto:uwimachantal025@gmail.com"
              className="text-primary hover:text-primary/80 transition-colors text-sm"
            >
              uwimachantal025@gmail.com
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row justify-between gap-2">
          <span className="text-white/40 text-xs">2025 DCIP By U.Chantal. All rights reserved.</span>
          <span className="text-white/40 text-xs">Built for Rwanda's creative Students.</span>
        </div>
      </div>
    </footer>
  )
}
