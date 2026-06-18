import { useEffect, useRef } from 'react'
import { checkChordMatch } from '../utils/pianoTheory'

export function useChordValidation(
  pressedNotes: string[],
  expectedNotes: string[],
  onMatch: () => void,
) {
  const onMatchRef = useRef(onMatch)
  useEffect(() => { onMatchRef.current = onMatch })

  const pressedKey = pressedNotes.join(',')
  const expectedKey = expectedNotes.join(',')

  useEffect(() => {
    if (pressedNotes.length === 0) return
    if (!checkChordMatch(pressedNotes, expectedNotes)) return
    const timer = setTimeout(() => onMatchRef.current(), 400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pressedKey, expectedKey])
}
