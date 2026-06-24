import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import PianoKeyboard from '../../components/piano/PianoKeyboard'
import { noteToFrequency } from '../../utils/pianoTheory'
import { verifyPianoPerformance } from '../../utils/pianoVerification'
import type { NoteEvent, PianoVerificationResult } from '../../utils/pianoVerification'
import { saveProductionResult, savePortfolioItem, completePianoProduction } from '../../services/api'
import { usePianoProgress } from '../../hooks/usePianoProgress'

type Phase = 'intro' | 'recording' | 'results'

function formatTime(s: number): string {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function parseNoteId(id: string): { note: string; octave: number } | null {
  const m = id.match(/^([A-G]#?)(\d)$/)
  if (!m) return null
  return { note: m[1], octave: parseInt(m[2]) }
}

export default function PianoProductionPage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { loading } = usePianoProgress()

  const [phase, setPhase] = useState<Phase>('intro')
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [verificationResult, setVerificationResult] = useState<PianoVerificationResult | null>(null)
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Audio capture refs
  const audioCtxRef = useRef<AudioContext | null>(null)
  const recordingDestRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioDataUrlRef = useRef<string>('')

  // Note tracking refs
  const noteEventsRef = useRef<NoteEvent[]>([])
  const pressTimesRef = useRef<Map<string, number>>(new Map())
  const prevNoteIdsRef = useRef<Set<string>>(new Set())

  // Timer ref
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

  const handleNotesChange = useCallback((noteIds: string[]) => {
    if (phaseRef.current !== 'recording') return
    const now = Date.now()
    const currentSet = new Set(noteIds)

    for (const id of noteIds) {
      if (!prevNoteIdsRef.current.has(id)) {
        pressTimesRef.current.set(id, now)
      }
    }

    for (const id of prevNoteIdsRef.current) {
      if (!currentSet.has(id)) {
        const pressTime = pressTimesRef.current.get(id)
        if (pressTime !== undefined) {
          const parsed = parseNoteId(id)
          if (parsed) {
            noteEventsRef.current.push({
              note: parsed.note,
              octave: parsed.octave,
              frequency: noteToFrequency(parsed.note, parsed.octave),
              timestamp: pressTime,
              duration: now - pressTime,
            })
          }
          pressTimesRef.current.delete(id)
        }
      }
    }

    prevNoteIdsRef.current = currentSet
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

    const result = verifyPianoPerformance(noteEventsRef.current)
    setVerificationResult(result)
    completePianoProduction(result.passed).catch(() => {})
    setPhase('results')
  }, [])

  const handleBegin = () => {
    noteEventsRef.current = []
    pressTimesRef.current.clear()
    prevNoteIdsRef.current = new Set()
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

    const now = Date.now()
    for (const [id, pressTime] of pressTimesRef.current) {
      const parsed = parseNoteId(id)
      if (parsed) {
        noteEventsRef.current.push({
          note: parsed.note,
          octave: parsed.octave,
          frequency: noteToFrequency(parsed.note, parsed.octave),
          timestamp: pressTime,
          duration: now - pressTime,
        })
      }
    }
    pressTimesRef.current.clear()
    mediaRecorderRef.current?.stop()
  }

  const handleSave = async () => {
    if (saving || saved || !verificationResult) return
    if (isPreviewMode) { setSaved(true); return }
    setSaving(true)
    try {
      await savePortfolioItem({
        discipline: 'music-piano',
        title: `Piano Production - ${new Date().toLocaleDateString()}`,
        fileType: 'audio/webm',
        fileData: audioDataUrlRef.current || 'audio-session',
        durationMinutes: Math.max(1, Math.round(elapsedSeconds / 60)),
      })
      await saveProductionResult({
        discipline: 'music-piano',
        totalPrompts: 5,
        correctCount: verificationResult.breakdown.filter(b => b.met).length,
        outcome: verificationResult.passed ? 'demonstrated' : 'needs-more-practice',
        attemptDetails: [],
        noteEvents: noteEventsRef.current,
        verificationResult,
      })
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

  if (!isPreviewMode && loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  if (phase === 'intro') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="bg-primary rounded-md w-6 h-6 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">DC</span>
            </div>
            <span className="text-text-primary font-bold text-sm">DCIP Piano</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-surface-border text-text-secondary text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Save and Exit
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center">
            <div className="bg-white border border-surface-border rounded-2xl p-10 shadow-sm">
              <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Piano Production</p>
              <h1 className="text-text-primary font-bold text-2xl mb-4">Play Your Melody</h1>
              <p className="text-text-secondary text-sm leading-relaxed mb-6">
                This is your moment to create. Play your own melody using everything you have learned across the Door To Know Piano journey. Use different notes, build chords, create something that is yours. When you are satisfied, stop recording and submit.
              </p>
              <p className="text-text-secondary text-sm mb-8">
                Passing this production awards the Advanced Piano badge.
              </p>
              <button
                onClick={handleBegin}
                className="bg-primary text-white font-semibold px-10 py-3 rounded-xl hover:bg-primary-dark transition-colors"
              >
                Begin Recording
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (phase === 'results' && verificationResult) {
    const passed = verificationResult.passed
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
          <div className="flex items-center gap-2 flex-1">
            <div className="bg-primary rounded-md w-6 h-6 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">DC</span>
            </div>
            <span className="text-text-primary font-bold text-sm">DCIP Piano</span>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="border border-surface-border text-text-secondary text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Exit
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6 bg-white">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-text-primary font-bold text-2xl mb-6">Your Production Result</h2>

            <div className={`border-2 rounded-2xl p-6 mb-6 ${passed ? 'border-secondary/30 bg-secondary/5' : 'border-surface-border bg-white'}`}>
              <p className={`font-bold text-2xl mb-1 ${passed ? 'text-[#2D6A4F]' : 'text-accent'}`}>
                {passed ? 'Demonstrated' : 'Keep Practising'}
              </p>
              <p className="text-text-secondary text-sm mb-3">
                {passed
                  ? 'All five criteria were met. Your production is saved to your portfolio.'
                  : 'Some criteria were not met. Review the breakdown below and try again.'}
              </p>
              {passed && (
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full">
                  Advanced Piano Badge
                </div>
              )}
            </div>

            <div className="bg-white border border-surface-border rounded-2xl overflow-hidden mb-6">
              <div className="bg-[#F9F7F4] px-5 py-3 border-b border-surface-border">
                <p className="text-text-muted text-xs uppercase tracking-wide font-medium">Breakdown</p>
              </div>
              <div className="divide-y divide-surface-border">
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
              <div className="bg-white border border-surface-border rounded-2xl p-5 mb-6">
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
                className="w-full border border-surface-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
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
      </div>
    )
  }

  // Recording phase
  const canStop = elapsedSeconds >= 10

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="bg-primary rounded-md w-6 h-6 flex items-center justify-center">
            <span className="text-white font-bold text-[10px]">DC</span>
          </div>
          <span className="text-text-primary font-bold text-sm">DCIP Piano</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-accent animate-pulse" />
          <span className="text-text-secondary text-sm">Recording in progress</span>
          <span className="text-text-primary font-mono font-bold text-sm">{formatTime(elapsedSeconds)}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-text-secondary text-sm">Play your melody. When you are ready, stop the recording.</p>
            {!canStop && (
              <p className="text-text-muted text-xs mt-1">Play for at least 10 seconds before stopping.</p>
            )}
          </div>
          <button
            onClick={handleStop}
            disabled={!canStop}
            className="flex-shrink-0 bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-sm"
          >
            Stop and Submit
          </button>
        </div>

        <div className="flex-1 bg-[#E8E4DC] p-4 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm">
            <PianoKeyboard
              onNotesChange={handleNotesChange}
              externalAudioContext={audioCtxRef.current ?? undefined}
              recordingDest={recordingDestRef.current ?? undefined}
            />
          </div>
          <p className="flex-shrink-0 pt-2 text-center text-xs text-text-secondary">
            Keys A-K + W E T Y U for octave 1 | Use mouse or touch for octave 2
          </p>
        </div>
      </div>
    </div>
  )
}
