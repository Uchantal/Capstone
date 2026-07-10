import { describe, it, expect } from 'vitest'
import { verifyGuitarPerformance, NoteEvent } from './guitarVerification'

function makeEvent(overrides: Partial<NoteEvent> = {}, index = 0): NoteEvent {
  return {
    note: 'E',
    string: 'E2',
    frequency: 82.4,
    timestamp: index * 2000,
    duration: 500,
    ...overrides,
  }
}

function passingEvents(): NoteEvent[] {
  const notes = ['E', 'A', 'D', 'G', 'B', 'F']
  const strings = ['E2', 'A2', 'D3', 'G3']
  return Array.from({ length: 12 }, (_, i) => makeEvent({
    note: notes[i % notes.length],
    string: strings[i % strings.length],
    timestamp: i * 2000,
  }))
}

describe('verifyGuitarPerformance', () => {
  it('passes when all requirements are met', () => {
    const result = verifyGuitarPerformance(passingEvents(), ['Am'])
    expect(result.passed).toBe(true)
  })

  it('fails when fewer than 12 notes are played', () => {
    const events = passingEvents().slice(0, 8)
    const result = verifyGuitarPerformance(events, ['Am'])
    expect(result.passed).toBe(false)
    const noteBreakdown = result.breakdown.find(b => b.label === 'Notes played')
    expect(noteBreakdown?.met).toBe(false)
  })

  it('fails when fewer than 6 unique notes are used', () => {
    const events = Array.from({ length: 12 }, (_, i) => makeEvent({
      note: 'E',
      string: ['E2', 'A2', 'D3', 'G3'][i % 4],
      timestamp: i * 2000,
    }))
    const result = verifyGuitarPerformance(events, ['Am'])
    expect(result.passed).toBe(false)
    const uniqueBreakdown = result.breakdown.find(b => b.label === 'Note variety')
    expect(uniqueBreakdown?.met).toBe(false)
  })

  it('fails when fewer than 4 strings are used', () => {
    const notes = ['E', 'A', 'D', 'G', 'B', 'F']
    const events = Array.from({ length: 12 }, (_, i) => makeEvent({
      note: notes[i % notes.length],
      string: 'E2',
      timestamp: i * 2000,
    }))
    const result = verifyGuitarPerformance(events, ['Am'])
    expect(result.passed).toBe(false)
    const stringBreakdown = result.breakdown.find(b => b.label === 'Strings explored')
    expect(stringBreakdown?.met).toBe(false)
  })

  it('fails when no chord is played', () => {
    const result = verifyGuitarPerformance(passingEvents(), [])
    expect(result.passed).toBe(false)
    const chordBreakdown = result.breakdown.find(b => b.label === 'Chord used')
    expect(chordBreakdown?.met).toBe(false)
  })

  it('fails when performance duration is under 20 seconds', () => {
    const events = Array.from({ length: 12 }, (_, i) => makeEvent({
      note: ['E', 'A', 'D', 'G', 'B', 'F'][i % 6],
      string: ['E2', 'A2', 'D3', 'G3'][i % 4],
      timestamp: i * 500,
    }))
    const result = verifyGuitarPerformance(events, ['Am'])
    expect(result.passed).toBe(false)
    const durationBreakdown = result.breakdown.find(b => b.label === 'Performance length')
    expect(durationBreakdown?.met).toBe(false)
  })

  it('returns 0 duration for a single note event', () => {
    const result = verifyGuitarPerformance([makeEvent()], [])
    expect(result.performanceDurationSeconds).toBe(0)
  })

  it('returns 0 duration for an empty events array', () => {
    const result = verifyGuitarPerformance([], [])
    expect(result.performanceDurationSeconds).toBe(0)
    expect(result.passed).toBe(false)
  })

  it('counts unique chord shapes correctly', () => {
    const result = verifyGuitarPerformance(passingEvents(), ['Am', 'Am', 'G', 'C'])
    expect(result.chordShapeCount).toBe(3)
    expect(result.chordShapesUsed).toEqual(['Am', 'G', 'C'])
  })

  it('returns a breakdown with 5 items', () => {
    const result = verifyGuitarPerformance(passingEvents(), ['Am'])
    expect(result.breakdown).toHaveLength(5)
  })
})
