import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GuitarFretboard, { STRING_DATA } from '../../components/guitar/GuitarFretboard'
import { noteAt } from '../../components/guitar/GuitarLevelScreen'
import { verifyGuitarPerformance } from '../../utils/guitarVerification'
import type { NoteEvent, GuitarVerificationResult } from '../../utils/guitarVerification'
import { useGuitarProgress } from '../../hooks/useGuitarProgress'
import { saveProductionResult } from '../../services/api'
import { savePortfolioItem } from '../../services/api'

type Phase = 'intro' | 'recording' | 'results'

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

export default function GuitarProductionPage() {
  const navigate = useNavigate()
  const { completedStages, loading: progressLoading, markComplete } = useGuitarProgress()

  useEffect(() => {
    if (progressLoading) return
    if (!completedStages.includes('guitar-sharpening')) {
      navigate('/guitar/sharpening-myself', {
        replace: true,
        state: { lockedMessage: 'Complete Sharpening Myself first.' },
      })
    }
  }, [completedStages, progressLoading, navigate])

  const [phase, setPhase] = useState<Phase>('intro')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [verificationResult, setVerificationResult] = useState<GuitarVerificationResult | null>(null)
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Audio capture refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const recordingDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioDataUrlRef = useRef<string>('')

  // Note and chord tracking refs
  const noteEventsRef = useRef<NoteEvent[]>([])
  const chordsPlayedRef = useRef<string[]>([])

  // Timer
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const phaseRef = useRef<Phase>('intro')

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      audioCtxRef.current?.close()
    }
  }, [])

  const handleNotePlay = useCallback((si: number, fret: number) => {
    if (phaseRef.current !== 'recording') return
    noteEventsRef.current.push({
      note: noteAt(si, fret),
      string: STRING_DATA[si].name,
      fret,
      frequency: STRING_DATA[si].open * Math.pow(2, fret / 12),
      timestamp: Date.now(),
      duration: 1400,
    })
  }, [])

  const handleChordPlay = useCallback((chordId: string) => {
    if (phaseRef.current !== 'recording') return
    chordsPlayedRef.current.push(chordId)
  }, [])

  const handleRecordingStop = useCallback(() => {
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
    const url = URL.createObjectURL(blob)
    setAudioBlobUrl(url)

    const reader = new FileReader()
    reader.onload = () => {
      audioDataUrlRef.current = reader.result as string
    }
    reader.readAsDataURL(blob)

    const result = verifyGuitarPerformance(noteEventsRef.current, chordsPlayedRef.current)
    setVerificationResult(result)
    setPhase('results')
  }, [])

  const handleBegin = () => {
    noteEventsRef.current = []
    chordsPlayedRef.current = []
    audioChunksRef.current = []
    audioDataUrlRef.current = ''

    const ctx = new AudioContext()
    const dest = ctx.createMediaStreamDestination()
    audioCtxRef.current = ctx
    recordingDestRef.current = dest

    const mr = new MediaRecorder(dest.stream)
    mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
    mr.onstop = handleRecordingStop
    mr.start()
    mediaRecorderRef.current = mr

    setElapsedSeconds(0)
    timerRef.current = setInterval(() => setElapsedSeconds(s => s + 1), 1000)

    setPhase('recording')
  }

  const handleStop = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
    mediaRecorderRef.current?.stop()
  }

  const handleSave = async () => {
    if (saving || saved || !verificationResult) return
    setSaving(true)
    try {
      await savePortfolioItem({
        discipline: 'music-guitar',
        title: `Guitar Production - ${new Date().toLocaleDateString()}`,
        fileType: 'audio/webm',
        fileData: audioDataUrlRef.current || 'audio-session',
        durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      })
      await saveProductionResult({
        discipline: 'music-guitar',
        totalPrompts: 5,
        correctCount: verificationResult.breakdown.filter(b => b.met).length,
        outcome: verificationResult.passed ? 'demonstrated' : 'needs-more-practice',
        attemptDetails: [],
        noteEvents: noteEventsRef.current,
        verificationResult,
      })
      await markComplete('guitar-production')
      setSaved(true)
      navigate('/portfolio')
    } catch {
      setSaved(true)
      navigate('/portfolio')
    } finally {
      setSaving(false)
    }
  }

  const handleTryAgain = () => {
    if (audioBlobUrl) URL.revokeObjectURL(audioBlobUrl)
    setAudioBlobUrl(null)
    setVerificationResult(null)
    setElapsedSeconds(0)
    setSaved(false)
    setSaving(false)
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    recordingDestRef.current = null
    setPhase('intro')
  }

  // ── Intro ────────────────────────────────────────────────────────────────
  if (phase === 'intro') {
    return (
      <div className="min-h-screen bg-bg-page flex flex-col">
        <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-xs">DC</span>
            </div>
            <span className="text-text-primary font-bold text-sm">DCIP Guitar</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Save and Exit
          </button>
        </nav>
        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-16 w-full">
          <h1 className="text-text-primary font-bold text-3xl mb-5">Production</h1>
          <p className="text-text-secondary text-base mb-6 max-w-xl leading-relaxed">
            This is your moment to create. Play your own melody on the guitar using what you have learned. Move across the strings, use the chords you know, find your own sound. When you are satisfied, stop recording and submit.
          </p>
          <button
            onClick={handleBegin}
            className="bg-primary text-white font-semibold px-10 py-4 rounded-xl hover:bg-primary-dark transition-colors text-base"
          >
            Begin Recording
          </button>
        </div>
      </div>
    )
  }

  // ── Results ──────────────────────────────────────────────────────────────
  if (phase === 'results' && verificationResult) {
    const passed = verificationResult.passed
    return (
      <div className="min-h-screen bg-bg-page flex flex-col">
        <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
              <span className="text-white font-bold text-xs">DC</span>
            </div>
            <span className="text-text-primary font-bold text-sm">DCIP Guitar</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-border text-text-secondary text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Exit
          </button>
        </nav>

        <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-10 w-full">
          <h2 className="text-text-primary font-bold text-2xl mb-6">Your Production Result</h2>

          <div className={`border-2 rounded-2xl p-6 mb-6 ${passed ? 'border-secondary/30 bg-secondary/5' : 'border-border bg-white'}`}>
            <p className={`font-bold text-2xl mb-1 ${passed ? 'text-[#2D6A4F]' : 'text-accent'}`}>
              {passed ? 'Demonstrated' : 'Keep Practising'}
            </p>
            <p className="text-text-secondary text-sm">
              {passed
                ? 'All five criteria were met. Your production is saved to your portfolio.'
                : 'Some criteria were not met. Review the breakdown below and try again.'}
            </p>
          </div>

          <div className="bg-white border border-border rounded-2xl overflow-hidden mb-6">
            <div className="bg-[#F9F7F4] px-5 py-3 border-b border-border">
              <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Breakdown</p>
            </div>
            <div className="divide-y divide-border">
              {verificationResult.breakdown.map((item, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-text-primary text-sm font-medium">{item.label}</span>
                    <span className={`text-sm font-semibold shrink-0 ${item.met ? 'text-[#2D6A4F]' : 'text-accent'}`}>
                      {item.met ? 'Met' : 'Not met'}
                    </span>
                  </div>
                  <p className="text-text-secondary text-xs mt-1">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {audioBlobUrl && (
            <div className="bg-white border border-border rounded-2xl p-5 mb-6">
              <p className="text-text-primary text-sm font-medium mb-3">Listen to your melody</p>
              <audio controls src={audioBlobUrl} className="w-full" />
            </div>
          )}

          <div className="space-y-3">
            {!saved ? (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
              >
                {saving ? 'Saving...' : 'Save to Portfolio'}
              </button>
            ) : (
              <div className="w-full bg-secondary/10 text-[#2D6A4F] font-semibold py-3 rounded-xl text-center text-sm">
                Saved to portfolio
              </div>
            )}
            <button
              onClick={handleTryAgain}
              className="w-full border border-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-text-muted text-sm hover:text-text-secondary transition-colors py-2"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Recording ─────────────────────────────────────────────────────────────
  const canStop = elapsedSeconds >= 10

  return (
    <div className="min-h-screen bg-bg-page flex flex-col">
      <nav className="border-b border-border bg-white flex items-center justify-between px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="bg-primary rounded-md w-8 h-8 flex items-center justify-center">
            <span className="text-white font-bold text-xs">DC</span>
          </div>
          <span className="text-text-primary font-bold text-sm">DCIP Guitar</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
            <span className="text-text-secondary text-sm">Recording in progress</span>
          </div>
          <span className="text-text-primary font-mono font-bold text-sm">{formatTime(elapsedSeconds)}</span>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8 w-full flex-1">
        <div className="mb-6">
          <GuitarFretboard
            onNotePlay={handleNotePlay}
            onChordPlay={handleChordPlay}
            showChords={true}
            externalAudioContext={audioCtxRef.current ?? undefined}
            recordingDest={recordingDestRef.current ?? undefined}
          />
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleStop}
            disabled={!canStop}
            className="w-full max-w-xs bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Stop and Submit
          </button>
          <p className="text-text-muted text-xs">
            Play for at least 20 seconds for the best result.
          </p>
        </div>
      </div>
    </div>
  )
}
