import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import PianoKeyboard from './PianoKeyboard'
import { buildChord, type ChordType } from '../../utils/pianoTheory'
import { usePianoProgress } from '../../hooks/usePianoProgress'

interface ChordDef {
  symbol: string
  root: string
  type: ChordType
  useFlats?: boolean
}

interface Props {
  levelNumber: 1 | 2 | 3
  levelTitle: string
  instruction: string
  chords: ChordDef[]
  demonstratePath: string
  stageId: string
  requiresDemo?: boolean
  requiresDemoPath?: string
}

export default function LevelPractiseScreen({
  levelNumber,
  levelTitle,
  instruction,
  chords,
  demonstratePath,
  stageId,
  requiresDemo,
  requiresDemoPath,
}: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { progress, loading, markStageVisited } = usePianoProgress()
  const [pressedNotes, setPressedNotes] = useState<string[]>([])
  const [selectedChord, setSelectedChord] = useState<string | null>(null)

  // Gate: if this level requires a prior demonstration, redirect if not passed
  useEffect(() => {
    if (loading) return
    if (requiresDemo === false) return
    if (requiresDemoPath && !progress[`level${levelNumber - 1 as 1 | 2}DemonstrationPassed` as keyof typeof progress]) {
      navigate(requiresDemoPath, {
        replace: true,
        state: { lockedMessage: `Complete the Level ${levelNumber - 1} demonstration first.` },
      })
    }
  }, [loading, progress, requiresDemo, requiresDemoPath, levelNumber, navigate])

  // Mark this practise stage as visited on mount
  useEffect(() => {
    if (loading) return
    markStageVisited(stageId)
  // markStageVisited is stable; run once after loading
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const currentChordDef = selectedChord
    ? chords.find(c => c.symbol === selectedChord) ?? null
    : null

  const highlightNotes: string[] = []
  if (currentChordDef) {
    const names = buildChord(currentChordDef.root, currentChordDef.type, currentChordDef.useFlats)
    const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const normalize = (n: string) => {
      const e = Object.entries({ 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' }).find(([, flat]) => flat === n)
      return e ? e[0] : n
    }
    const normalized = names.map(normalize)
    let oct = 4
    let prevIdx = -1
    for (const note of normalized) {
      const idx = chromatic.indexOf(note)
      if (idx <= prevIdx && highlightNotes.length > 0) oct++
      highlightNotes.push(note + oct)
      prevIdx = idx
    }
  }

  const pressedNoteNames = pressedNotes.map(n => n.replace(/\d+$/, ''))

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-14 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button
            onClick={() => navigate('/session/music-piano')}
            className="hover:text-text-primary transition-colors"
          >
            Piano
          </button>
          <span>/</span>
          <span>Door To Know Piano</span>
          <span>/</span>
          <span className="text-text-primary">{levelTitle} Practise</span>
        </div>
        <button
          onClick={() => navigate(demonstratePath)}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          I am ready to demonstrate
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border overflow-y-auto p-4">
          {lockedMessage && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-4 text-accent text-sm">
              {lockedMessage}
            </div>
          )}

          <h1 className="text-text-primary font-bold text-lg mb-1">{levelTitle}: Practise</h1>
          <p className="text-text-secondary text-sm mb-4">{instruction}</p>

          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Chord Reference</p>
          <div className="grid grid-cols-3 gap-2">
            {chords.map(chord => {
              const notes = buildChord(chord.root, chord.type, chord.useFlats)
              const isSelected = selectedChord === chord.symbol
              return (
                <button
                  key={chord.symbol}
                  onClick={() => setSelectedChord(isSelected ? null : chord.symbol)}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-primary/40'
                      : 'border-surface-border hover:border-primary/30 hover:bg-white'
                  }`}
                >
                  <p className={`font-bold text-base mb-0.5 ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
                    {chord.symbol}
                  </p>
                  <p className="text-text-muted text-[10px] leading-tight">{notes.join(' · ')}</p>
                </button>
              )
            })}
          </div>

          {selectedChord && (
            <p className="text-text-muted text-xs mt-3">
              Highlighted: <span className="text-text-primary font-semibold">{selectedChord}</span>. The keyboard shows which keys to press.
            </p>
          )}

          {pressedNotes.length > 0 && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-text-muted text-xs">Playing:</span>
              <div className="flex gap-1.5 flex-wrap">
                {pressedNoteNames.map(n => (
                  <span key={n} className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-md">{n}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 bg-[#E8E4DC] p-4 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm">
            <PianoKeyboard
              onNotesChange={setPressedNotes}
              highlightNotes={highlightNotes}
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
