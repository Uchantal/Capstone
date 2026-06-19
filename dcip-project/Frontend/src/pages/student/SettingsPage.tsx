import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import { useAuth } from '../../hooks/useAuth'
import { fetchMe, changePassword as apiChangePassword } from '../../services/api'
import Footer from '../../components/Footer'

interface UserProfile {
  id: string
  fullName: string
  username: string
  role: string
  school: { id: string; name: string; district: string } | null
  createdAt: string
}

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwSuccess,   setPwSuccess]   = useState('')
  const [pwError,     setPwError]     = useState('')
  const [pwLoading,   setPwLoading]   = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchMe()
      .then(res => setProfile(res.data))
      .catch(() => {})
      .finally(() => setProfileLoading(false))
  }, [user, navigate])

  if (!user) return null

  const passwordsMatch = newPw.length > 0 && confirmPw.length > 0 && newPw === confirmPw
  const passwordsMismatch = confirmPw.length > 0 && newPw !== confirmPw
  const canSubmit = currentPw.length > 0 && newPw.length >= 8 && passwordsMatch && !pwLoading

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    setPwLoading(true)
    setPwError('')
    setPwSuccess('')
    try {
      await apiChangePassword(currentPw, newPw)
      setPwSuccess('Password updated.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      setPwError(msg ?? 'Could not update password. Please try again.')
    } finally {
      setPwLoading(false)
    }
  }

  const createdAt = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-GB', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  const schoolDisplay = profile?.school?.name
    ? profile.school.district
      ? `${profile.school.name}, ${profile.school.district}`
      : profile.school.name
    : ''

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-10">

        <h1 className="text-text-primary font-bold text-2xl mb-8">Account Settings</h1>

        {/* Personal Information */}
        <div className="bg-white border border-border rounded-xl p-6 mb-6">
          <h2 className="text-base font-semibold text-text-primary mb-5">Personal Information</h2>

          {profileLoading ? (
            <p className="text-text-muted text-sm">Loading...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Full Name</p>
                <p className="text-text-primary font-medium text-sm">{profile?.fullName ?? user.fullName}</p>
              </div>
              <div>
                <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Username</p>
                <p className="text-text-primary font-medium text-sm">{profile?.username ?? user.username}</p>
              </div>
              {schoolDisplay ? (
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">School</p>
                  <p className="text-text-primary font-medium text-sm">{schoolDisplay}</p>
                </div>
              ) : null}
              {createdAt ? (
                <div>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Account created</p>
                  <p className="text-text-primary font-medium text-sm">{createdAt}</p>
                </div>
              ) : null}
            </div>
          )}

          <p className="text-text-muted text-xs mt-5 border-t border-border pt-4">
            To update your name or school, contact your school supervisor.
          </p>
        </div>

        {/* Change Password */}
        <div className="bg-white border border-border rounded-xl p-6">
          <h2 className="text-base font-semibold text-text-primary mb-5">Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-5 max-w-sm">
            {/* Current password */}
            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">
                Current password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPw}
                  onChange={e => { setCurrentPw(e.target.value); setPwError(''); setPwSuccess('') }}
                  placeholder="Enter current password"
                  className="w-full border border-border rounded-lg px-4 py-3 pr-10 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  {showCurrent ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">
                New password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPw}
                  onChange={e => { setNewPw(e.target.value); setPwError(''); setPwSuccess('') }}
                  placeholder="At least 8 characters"
                  className="w-full border border-border rounded-lg px-4 py-3 pr-10 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(v => !v)}
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  {showNew ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {/* Confirm new password */}
            <div>
              <label className="text-text-primary text-sm font-medium block mb-1.5">
                Confirm new password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPw}
                  onChange={e => { setConfirmPw(e.target.value); setPwError(''); setPwSuccess('') }}
                  placeholder="Re-enter new password"
                  className="w-full border border-border rounded-lg px-4 py-3 pr-10 text-sm text-text-primary placeholder-gray-400 focus:outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(v => !v)}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary cursor-pointer"
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordsMismatch && (
                <p className="text-accent text-xs mt-1.5">Passwords do not match</p>
              )}
              {passwordsMatch && (
                <p className="text-[#2D6A4F] text-xs mt-1.5">Passwords match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="bg-primary text-white text-sm font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>

            {pwSuccess && (
              <p className="text-[#2D6A4F] text-sm">{pwSuccess}</p>
            )}
            {pwError && (
              <p className="text-accent text-sm">{pwError}</p>
            )}
          </form>
        </div>
      </div>
      <Footer />
    </div>
  )
}
