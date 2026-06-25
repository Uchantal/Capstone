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

// Tightened from 15 Hz — YIN gives sub-Hz precision so ±8 cleanly separates adjacent notes
export const PITCH_TOLERANCE = 8
// Slightly wider for demonstrations where student sings without hearing the reference first
export const DEMO_TOLERANCE = 12

// ── YIN autocorrelation pitch detector ───────────────────────────────────────
// Replaces the old peak-bin FFT approach. YIN finds the fundamental period of
// the waveform directly from the time-domain signal, giving sub-Hz precision and
// immunity to harmonics fooling the detector. Reference: de Cheveigné & Kawahara 2002.

function detectPitchYIN(analyser: AnalyserNode): number | null {
  const buffer = new Float32Array(1024)
  analyser.getFloatTimeDomainData(buffer)
  const sampleRate = analyser.context.sampleRate

  // RMS energy gate — ignore silence and very quiet signals
  let rms = 0
  for (let i = 0; i < buffer.length; i++) rms += buffer[i] * buffer[i]
  rms = Math.sqrt(rms / buffer.length)
  if (rms < 0.008) return null  // low threshold — students sing quietly in shared labs

  const W = 512           // half-buffer search window
  const THRESHOLD = 0.15  // lower = stricter; 0.10–0.20 is standard for YIN

  // Difference function d(tau) combined with cumulative mean normalisation in one pass
  const cmnd = new Float32Array(W)
  cmnd[0] = 1
  let runningSum = 0

  for (let tau = 1; tau < W; tau++) {
    let sum = 0
    for (let j = 0; j < W; j++) {
      const delta = buffer[j] - buffer[j + tau]
      sum += delta * delta
    }
    runningSum += sum
    cmnd[tau] = runningSum > 0 ? (sum * tau) / runningSum : 1
  }

  // Search only in the singing vocal range (75 Hz – 1050 Hz)
  const tauMin = Math.max(1, Math.floor(sampleRate / 1050))
  const tauMax = Math.min(W - 2, Math.floor(sampleRate / 75))

  // Find the first local minimum of cmnd that dips below threshold
  let bestTau = -1
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (cmnd[tau] < THRESHOLD) {
      while (tau + 1 <= tauMax && cmnd[tau + 1] < cmnd[tau]) tau++
      bestTau = tau
      break
    }
  }

  if (bestTau < 0) return null

  // Parabolic interpolation for sub-sample (sub-Hz) precision
  let refinedTau = bestTau
  if (bestTau > 0 && bestTau < W - 1) {
    const s0 = cmnd[bestTau - 1]
    const s1 = cmnd[bestTau]
    const s2 = cmnd[bestTau + 1]
    const denom = 2 * (s0 - 2 * s1 + s2)
    if (Math.abs(denom) > 1e-9) {
      refinedTau = bestTau + (s0 - s2) / denom
    }
  }

  return refinedTau > 0 ? sampleRate / refinedTau : null
}

// ── Harmonic presence check ───────────────────────────────────────────────────
// Human singing voice produces energy at integer multiples of the fundamental
// (2F, 3F, 4F …). A hand clap, finger snap, or broadband noise does not.
// This check rejects sounds that lack harmonic structure.

function hasVoiceHarmonics(analyser: AnalyserNode, fundamental: number): boolean {
  const data = new Uint8Array(analyser.frequencyBinCount)
  analyser.getByteFrequencyData(data)
  const binHz = analyser.context.sampleRate / (2 * analyser.frequencyBinCount)

  const ampAt = (freq: number): number => {
    const bin = Math.round(freq / binHz)
    const lo = Math.max(0, bin - 1)
    const hi = Math.min(data.length - 1, bin + 2)
    let max = 0
    for (let i = lo; i <= hi; i++) if (data[i] > max) max = data[i]
    return max
  }

  const f1 = ampAt(fundamental)
  if (f1 < 30) return false  // soft lab singing threshold — was 50, lowered to accept quiet voices

  const f2 = ampAt(fundamental * 2)
  const f3 = ampAt(fundamental * 3)

  // At least one harmonic must carry meaningful energy relative to the fundamental
  return f2 > f1 * 0.15 || f3 > f1 * 0.12
}

// ── Public API ────────────────────────────────────────────────────────────────

export function detectPitch(analyser: AnalyserNode): number | null {
  const freq = detectPitchYIN(analyser)
  if (freq === null) return null
  if (!hasVoiceHarmonics(analyser, freq)) return null
  return freq
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
  if (diff <= tolerance * 2.5) return 'close'
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
