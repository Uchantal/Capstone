export const SCALE_NOTES = [
  { label: 'C4', note: 'C', freq: 261.63 },
  { label: 'D4', note: 'D', freq: 293.66 },
  { label: 'E4', note: 'E', freq: 329.63 },
  { label: 'F4', note: 'F', freq: 349.23 },
  { label: 'G4', note: 'G', freq: 392.00 },
  { label: 'A4', note: 'A', freq: 440.00 },
  { label: 'B4', note: 'B', freq: 493.88 },
  { label: 'C5', note: 'C', freq: 523.25 },
] as const

export type ScaleNote = (typeof SCALE_NOTES)[number]

export const PITCH_TOLERANCE = 15

export function detectPitch(analyser: AnalyserNode): number | null {
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(data)
  const sampleRate = analyser.context.sampleRate
  const binHz = sampleRate / (2 * analyser.frequencyBinCount)
  const lo = Math.max(1, Math.floor(60 / binHz))
  const hi = Math.min(analyser.frequencyBinCount - 1, Math.ceil(1000 / binHz))
  let maxAmp = 0
  let peak = lo
  for (let i = lo; i <= hi; i++) {
    if (data[i] > maxAmp) { maxAmp = data[i]; peak = i }
  }
  return maxAmp < 25 ? null : peak * binHz
}

export type PitchStatus = 'none' | 'close' | 'on'

export function getPitchStatus(
  freq: number | null,
  targetFreq: number,
  tolerance: number = PITCH_TOLERANCE,
): PitchStatus {
  if (freq === null) return 'none'
  const diff = Math.abs(freq - targetFreq)
  if (diff <= tolerance) return 'on'
  if (diff <= tolerance * 2) return 'close'
  return 'none'
}

export function playTone(freq: number, duration = 2.0): void {
  const ctx = new AudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const now = ctx.currentTime
  osc.type = 'sine'
  osc.frequency.value = freq
  osc.connect(gain)
  gain.connect(ctx.destination)
  gain.gain.setValueAtTime(0.3, now)
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration)
  osc.start(now)
  osc.stop(now + duration)
  setTimeout(() => ctx.close(), (duration + 0.5) * 1000)
}

export function nearestScaleNote(freq: number, tolerance = PITCH_TOLERANCE): string | null {
  for (const note of SCALE_NOTES) {
    if (Math.abs(freq - note.freq) <= tolerance) return note.label
  }
  return null
}

export function drawWaveform(analyser: AnalyserNode, canvas: HTMLCanvasElement): void {
  const ctx2d = canvas.getContext('2d')
  if (!ctx2d) return
  const data = new Uint8Array(analyser.fftSize)
  analyser.getByteTimeDomainData(data)
  ctx2d.clearRect(0, 0, canvas.width, canvas.height)
  ctx2d.beginPath()
  ctx2d.strokeStyle = '#C8960C'
  ctx2d.lineWidth = 2
  const sw = canvas.width / data.length
  let x = 0
  for (let i = 0; i < data.length; i++) {
    const y = (data[i] / 128.0) * (canvas.height / 2)
    if (i === 0) ctx2d.moveTo(x, y)
    else ctx2d.lineTo(x, y)
    x += sw
  }
  ctx2d.lineTo(canvas.width, canvas.height / 2)
  ctx2d.stroke()
}
