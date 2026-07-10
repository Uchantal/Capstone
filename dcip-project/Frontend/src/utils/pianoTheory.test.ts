import { describe, it, expect } from 'vitest'
import { buildChord, noteToFrequency, checkChordMatch } from './pianoTheory'

describe('pianoTheory utilities', () => {
  it('builds a major triad correctly', () => {
    expect(buildChord('C', 'major')).toEqual(['C', 'E', 'G'])
  })

  it('builds a minor triad with flats when requested', () => {
    expect(buildChord('D', 'minor', true)).toEqual(['D', 'F', 'A'])
  })

  it('returns an empty array for an unknown root', () => {
    expect(buildChord('H' as any, 'major')).toEqual([])
  })

  it('computes A4 as 440Hz', () => {
    expect(noteToFrequency('A', 4)).toBeCloseTo(440, 5)
  })

  it('computes C4 frequency correctly', () => {
    expect(noteToFrequency('C', 4)).toBeCloseTo(261.6256, 3)
  })

  it('matches chord notes regardless of sharps and flats', () => {
    expect(checkChordMatch(['C', 'D#', 'G'], ['C', 'Eb', 'G'])).toBe(true)
  })

  it('returns false for mismatched chord note sets', () => {
    expect(checkChordMatch(['C', 'E', 'G'], ['C', 'F', 'A'])).toBe(false)
  })
})
