import { useCallback, useEffect, useRef, useState } from 'react'

export function useVoiceMic() {
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioCtxRef  = useRef<AudioContext | null>(null)
  const analyserRef  = useRef<AnalyserNode | null>(null)
  const [micError, setMicError]   = useState<string | null>(null)
  const [micReady, setMicReady]   = useState(false)

  useEffect(() => {
    return () => {
      micStreamRef.current?.getTracks().forEach(t => t.stop())
      audioCtxRef.current?.close()
    }
  }, [])

  const initMic = useCallback(async (): Promise<boolean> => {
    if (micStreamRef.current) return true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      micStreamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      analyserRef.current = analyser
      setMicReady(true)
      return true
    } catch {
      setMicError('Microphone access denied. Allow microphone access in your browser settings.')
      return false
    }
  }, [])

  return { initMic, analyserRef, micStreamRef, audioCtxRef, micError, micReady }
}
