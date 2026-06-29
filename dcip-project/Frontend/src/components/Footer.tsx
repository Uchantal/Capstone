import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="w-full bg-[#080A0E]">
      {/* Colour bar */}
      <div className="flex h-1 w-full">
        <div className="flex-1 bg-accent" />
        <div className="flex-1 bg-primary" />
        <div className="flex-1 bg-secondary" />
      </div>

      {/* Main content — full width with responsive padding */}
      <div className="w-full px-4 sm:px-8 md:px-12 lg:px-16 xl:px-20 2xl:px-24 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-8 lg:gap-10">

          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex w-9 h-9 bg-primary rounded-lg items-center justify-center mb-3 hover:opacity-80 transition-opacity">
              <span className="text-white font-bold text-[11px] tracking-tight">DCIP</span>
            </Link>
            <p className="text-white font-semibold text-sm mb-2">
              Digital Creative Infrastructure Platform
            </p>
            <p className="text-white/50 text-xs leading-relaxed">
              Building creative skills for talented youth in Rwandan secondary schools.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <p className="text-white/40 text-xs font-semibold tracking-widest mb-3 uppercase">Platform</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/#about"        className="text-white/70 text-sm hover:text-white transition-colors">About</Link>
              <Link to="/#disciplines"  className="text-white/70 text-sm hover:text-white transition-colors">Disciplines</Link>
              <Link to="/#how-it-works" className="text-white/70 text-sm hover:text-white transition-colors">How It Works</Link>
              <Link to="/register"      className="text-white/70 text-sm hover:text-white transition-colors">Register</Link>
              <Link to="/login"         className="text-white/70 text-sm hover:text-white transition-colors">Log In</Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <p className="text-white/40 text-xs font-semibold tracking-widest mb-3 uppercase">Support</p>
            <div className="flex flex-col gap-2.5">
              <Link to="/feedback" className="text-white/70 text-sm hover:text-white transition-colors">Send us Feedback</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white/40 text-xs font-semibold tracking-widest mb-3 uppercase">Contact</p>
            <p className="text-white/70 text-sm mb-2">For inquiries and collaboration:</p>
            <a
              href="mailto:uwimachantal025@gmail.com"
              className="text-primary hover:text-primary/80 transition-colors text-sm break-all"
            >
              uwimachantal025@gmail.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-8 pt-6 flex flex-col sm:flex-row sm:justify-between gap-2">
          <span className="text-white/40 text-xs">2026 DCIP By U.Chantal. All rights reserved.</span>
          <span className="text-white/40 text-xs">Built for Rwanda's creative Students.</span>
        </div>
      </div>
    </footer>
  )
}
