import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import { useVoiceDemonstrationProgress } from '../../hooks/useVoiceDemonstrationProgress'
import { useVoiceMic } from '../../hooks/useVoiceMic'
import { drawWaveform } from '../../utils/voicePitch'
import Footer from '../../components/Footer'

export default function VoiceStudioPage() {
  const navigate = useNavigate()
  const { markStageVisited } = useVoiceDemonstrationProgress()
  const { initMic, analyserRef, micStreamRef, micError } = useVoiceMic()

  const [breathSize, setBreathSize]   = useState<'small' | 'large'>('small')
  const [breathPhase, setBreathPhase] = useState<'in' | 'out'>('in')
  const [breathDone, setBreathDone]   = useState(false)
  const [recording, setRecording]     = useState(false)
  const [recordings, setRecordings]   = useState<{ url: string }[]>([])

  const waveformRef    = useRef<HTMLCanvasElement>(null)
  const mediaRef       = useRef<MediaRecorder | null>(null)
  const chunksRef      = useRef<Blob[]>([])
  const rafRef         = useRef<number>(0)
  const recordingRef   = useRef(false)
  const stageMarkedRef = useRef(false)

  // Breathing animation: 2 cycles (in 4s, out 4s) × 2 = 16s total
  useEffect(() => {
    const t1 = setTimeout(() => { setBreathSize('large'); setBreathPhase('in')  },   100)
    const t2 = setTimeout(() => { setBreathSize('small'); setBreathPhase('out') },  4100)
    const t3 = setTimeout(() => { setBreathSize('large'); setBreathPhase('in')  },  8100)
    const t4 = setTimeout(() => { setBreathSize('small'); setBreathPhase('out') }, 12100)
    const t5 = setTimeout(() => { setBreathDone(true) },                          16100)
    return () => { [t1, t2, t3, t4, t5].forEach(clearTimeout) }
  }, [])

  // Mark stage visited once on mount
  useEffect(() => {
    if (!stageMarkedRef.current) {
      stageMarkedRef.current = true
      markStageVisited('voice-studio')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runWaveformLoop = () => {
    if (!recordingRef.current) return
    if (analyserRef.current && waveformRef.current) {
      drawWaveform(analyserRef.current, waveformRef.current)
    }
    rafRef.current = requestAnimationFrame(runWaveformLoop)
  }

  const startRecording = async () => {
    const ok = await initMic()
    if (!ok || !micStreamRef.current) return
    chunksRef.current = []
    const mr = new MediaRecorder(micStreamRef.current)
    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      setRecordings(prev => [...prev, { url: URL.createObjectURL(blob) }])
    }
    mr.start()
    mediaRef.current = mr
    recordingRef.current = true
    setRecording(true)
    rafRef.current = requestAnimationFrame(runWaveformLoop)
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
    recordingRef.current = false
    cancelAnimationFrame(rafRef.current)
    setRecording(false)
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg-page">
      <TopNav />
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Voice and Singing</p>
        <h1 className="text-text-primary font-bold text-2xl mb-2">Voice Studio</h1>
        <p className="text-text-secondary text-sm mb-8">
          This is your voice studio. Hum, sing, or speak freely. Listen to how your voice sounds.
        </p>

        {/* Breathing warm-up */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-6">
          <h2 className="text-text-primary font-semibold text-base mb-4">Breathing Warm-Up</h2>
          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex flex-col items-center gap-3">
              <div className={`rounded-full border-4 transition-all ease-in-out duration-[4000ms] flex items-center justify-center
                ${breathSize === 'large'
                  ? 'w-40 h-40 bg-purple-100 border-purple-500'
                  : 'w-24 h-24 bg-transparent border-purple-300'
                }`}
              >
                {!breathDone && (
                  <span className="text-purple-700 font-semibold text-sm">
                    {breathPhase === 'in' ? 'In' : 'Out'}
                  </span>
                )}
                {breathDone && (
                  <span className="text-purple-500 font-semibold text-sm">Done</span>
                )}
              </div>
              <p className="text-purple-700 text-xs font-medium">
                {breathDone ? 'Breathing exercise complete' : breathPhase === 'in' ? 'Breathe in...' : 'Breathe out...'}
              </p>
            </div>
            <div className="flex-1 min-w-48">
              <p className="text-text-secondary text-sm leading-relaxed">
                Breathe in for 4 counts, out for 4 counts. This prepares your voice.
              </p>
              <p className="text-text-muted text-xs mt-2">
                Follow the circle. Two full cycles, then you are ready to continue.
              </p>
            </div>
          </div>
        </div>

        {/* Recording interface */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-8">
          <h2 className="text-text-primary font-semibold text-base mb-2">Record Your Voice</h2>
          <p className="text-text-secondary text-sm mb-4">
            Hum or sing freely while you do the breathing warm-up. The waveform shows your voice in real time.
          </p>

          {micError && (
            <p className="text-xs text-accent bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{micError}</p>
          )}

          {!recording ? (
            <button
              onClick={startRecording}
              className="bg-purple-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-purple-800 transition-colors"
            >
              Start Recording
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="inline-block w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-accent text-sm font-medium">Recording...</span>
                <button
                  onClick={stopRecording}
                  className="border border-purple-400 text-purple-700 text-sm px-4 py-1.5 rounded-lg hover:bg-purple-50 transition-colors"
                >
                  Stop
                </button>
              </div>
              <canvas ref={waveformRef} width={800} height={80} className="w-full rounded-lg bg-gray-950" />
            </div>
          )}

          {recordings.length > 0 && !recording && (
            <div className="mt-4 space-y-2">
              <p className="text-text-muted text-xs font-medium">Listen back:</p>
              {recordings.map((rec, i) => (
                <audio key={i} controls src={rec.url} className="w-full h-9" />
              ))}
              <button
                onClick={startRecording}
                className="border border-purple-400 text-purple-700 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors"
              >
                Record another take
              </button>
            </div>
          )}
        </div>

        {breathDone && (
          <div className="flex justify-end">
            <button
              onClick={() => navigate('/voice/posture-breath-voice')}
              className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
            >
              Continue to Door To Know Voice
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}
