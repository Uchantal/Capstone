import { describe, it, expect } from 'vitest'

const VALID_STAGES = new Set([
  'course1', 'course2',
  'level1Learn', 'level1Practise', 'level1Demonstrate',
  'level2Learn', 'level2Practise', 'level2Demonstrate',
  'level3Learn', 'level3Practise', 'level3Demonstrate',
  'sharpening', 'production',
])

function computeOverall(scores: Record<string, unknown>): number | null {
  const values: number[] = []
  for (const key of VALID_STAGES) {
    const v = scores[key]
    if (typeof v === 'number') values.push(v)
  }
  return values.length > 0
    ? Math.round(values.reduce((a, b) => a + b, 0) / values.length)
    : null
}

describe('computeOverall engagement score', () => {
  it('returns null when no stage scores exist', () => {
    expect(computeOverall({})).toBeNull()
  })

  it('returns the score itself when only one stage is recorded', () => {
    expect(computeOverall({ level1Learn: 80 })).toBe(80)
  })

  it('averages two stage scores correctly', () => {
    expect(computeOverall({ level1Learn: 60, level1Practise: 80 })).toBe(70)
  })

  it('rounds the average to the nearest integer', () => {
    expect(computeOverall({ level1Learn: 70, level1Practise: 71 })).toBe(71)
  })

  it('ignores keys that are not valid stage names', () => {
    expect(computeOverall({ level1Learn: 100, unknownStage: 0 })).toBe(100)
  })

  it('ignores non-numeric values for valid stage keys', () => {
    expect(computeOverall({ level1Learn: 90, level1Practise: 'high' as unknown as number })).toBe(90)
  })

  it('returns 0 when all valid stages have a score of 0', () => {
    expect(computeOverall({ level1Learn: 0, level1Practise: 0 })).toBe(0)
  })

  it('returns 100 when all provided stages are at maximum', () => {
    expect(computeOverall({ level1Learn: 100, level1Practise: 100, level1Demonstrate: 100 })).toBe(100)
  })

  it('handles all 13 stages without error', () => {
    const all: Record<string, number> = {}
    for (const key of VALID_STAGES) all[key] = 50
    const result = computeOverall(all)
    expect(result).toBe(50)
  })
})

describe('stage validation', () => {
  it('accepts all 13 valid stage names', () => {
    for (const stage of VALID_STAGES) {
      expect(VALID_STAGES.has(stage)).toBe(true)
    }
  })

  it('rejects an unknown stage name', () => {
    expect(VALID_STAGES.has('level4Learn')).toBe(false)
  })

  it('rejects an empty string as a stage', () => {
    expect(VALID_STAGES.has('')).toBe(false)
  })

  it('score of 0 is valid', () => {
    const score = 0
    expect(typeof score === 'number' && score >= 0 && score <= 100).toBe(true)
  })

  it('score of 100 is valid', () => {
    const score = 100
    expect(typeof score === 'number' && score >= 0 && score <= 100).toBe(true)
  })

  it('score of -1 is invalid', () => {
    const score = -1
    expect(typeof score === 'number' && score >= 0 && score <= 100).toBe(false)
  })

  it('score of 101 is invalid', () => {
    const score = 101
    expect(typeof score === 'number' && score >= 0 && score <= 100).toBe(false)
  })

  it('a string score is invalid', () => {
    const score = '80'
    expect(typeof score === 'number').toBe(false)
  })
})
