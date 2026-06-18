import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../TopNav'
import PianoKeyboard from './PianoKeyboard'
import { useChordValidation } from '../../hooks/useChordValidation'
import {
  buildChord,
  CHROMATIC_SCALE,
  FLAT_NAMES,
  type ChordType,
} from '../../utils/pianoTheory'

interface ChordDef {
  symbol: string
  root: string
  type: ChordType
  useFlats?: boolean
}

interface Props {
  levelNumber: number
  totalLevels: number
  levelTitle: string
  description: string
  chords: ChordDef[]
  nextPath: string
}

function noteNamesToIds(noteNames: string[]): string[] {
  const normalize = (n: string) => {
    const e = Object.entries(FLAT_NAMES).find(([, flat]) => flat === n)
    return e ? e[0] : n
  }
  const normalized = noteNames.map(normalize)
  let oct = 4
  const result: string[] = []
  let prevIdx = -1
  for (const note of normalized) {
    const idx = CHROMATIC_SCALE.indexOf(note as typeof CHROMATIC_SCALE[number])
    if (idx <= prevIdx && result.length > 0) oct++
    result.push(note + oct)
    prevIdx = idx
  }
  return result
}

function ProgressBar({ value, total, label }: { value: number; total: number; label: string }) {
  return (
    <div className="mb-5">
      <p className="text-text-muted text-xs mb-1.5">{label}</p>
      <div className="w-full h-1 bg-gray-200 rounded-full">
        <div className="h-1 bg-primary rounded-full transition-all" style={{ width: `${(value / total) * 100}%` }} />
      </div>
    </div>
  )
}

export default function ChordLevelScreen({ levelNumber, totalLevels, levelTitle, description, chords, nextPath }: Props) {
  const navigate = useNavigate()
  const [chordIdx, setChordIdx] = useState(0)
  const [pressedNotes, setPressedNotes] = useState<string[]>([])
  const [validState, setValidState] = useState<'idle' | 'holding' | 'correct'>('idle')
  const [completed, setCompleted] = useState(false)

  const currentChord = chords[chordIdx]
  const expectedNoteNames = buildChord(currentChord.root, currentChord.type, currentChord.useFlats)
  const highlightNotes = noteNamesToIds(expectedNoteNames)
  const pressedNoteNames = pressedNotes.map(n => n.replace(/\d+$/, ''))

  const isHolding = pressedNoteNames.length > 0
    && pressedNoteNames.length === expectedNoteNames.length

  const handleMatch = useCallback(() => {
    if (validState === 'correct') return
    setValidState('correct')
    setTimeout(() => {
      if (chordIdx + 1 >= chords.length) {
        setCompleted(true)
      } else {
        setChordIdx(i => i + 1)
        setValidState('idle')
      }
    }, 800)
  }, [validState, chordIdx, chords.length])

  useChordValidation(pressedNoteNames, expectedNoteNames, handleMatch)

  const feedbackClass = validState === 'correct'
    ? 'text-secondary font-semibold'
    : isHolding
    ? 'text-text-muted'
    : 'text-text-muted'

  const feedbackText = validState === 'correct'
    ? 'Correct! Hold it there.'
    : isHolding
    ? 'Hold steady...'
    : 'Find and press the notes below, hold for a moment.'

  return (
    <div className="min-h-screen bg-bg-page">
      <TopNav />
      <div className="max-w-5xl mx-auto px-6 md:px-10 lg:px-16 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-text-muted mb-5">
          <button onClick={() => navigate('/session/music-piano')} className="hover:text-text-primary transition-colors">
            Piano
          </button>
          <span>/</span>
          <span>Door To Know Piano</span>
          <span>/</span>
          <span className="text-text-primary">{levelTitle}</span>
        </div>

        <ProgressBar value={levelNumber} total={totalLevels} label={`Level ${levelNumber} of ${totalLevels}`} />

        <div className="mb-6">
          <h1 className="text-text-primary font-bold text-2xl mb-1">{levelTitle}</h1>
          <p className="text-text-secondary text-sm">{description}</p>
        </div>

        {/* Chord to play */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-text-muted text-xs uppercase tracking-wide">
              Chord {chordIdx + 1} of {chords.length}
            </p>
            <div className="flex gap-1.5">
              {chords.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < chordIdx
                      ? 'bg-secondary'
                      : i === chordIdx
                      ? 'bg-primary'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-6 mb-4">
            <span className="text-6xl font-bold text-text-primary leading-none">
              {currentChord.symbol}
            </span>
            <div>
              <p className="text-text-muted text-xs uppercase tracking-wide mb-1">Notes to play</p>
              <p className="text-text-primary font-semibold text-lg">
                {expectedNoteNames.join(' · ')}
              </p>
            </div>
          </div>

          <p className={`text-sm ${feedbackClass}`}>{feedbackText}</p>
        </div>

        {/* Keyboard */}
        <PianoKeyboard
          onNotesChange={notes => {
            setPressedNotes(notes)
            if (validState === 'correct') return
            setValidState('idle')
          }}
          highlightNotes={validState !== 'correct' ? highlightNotes : []}
          disabled={validState === 'correct'}
        />
      </div>

      {/* Completion overlay */}
      {completed && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-2xl">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary font-bold text-2xl">★</span>
            </div>
            <h2 className="text-text-primary font-bold text-xl mb-2">Level {levelNumber} Complete!</h2>
            <p className="text-text-secondary text-sm mb-6">
              You played all {chords.length} chords. Well done.
            </p>
            <button
              onClick={() => navigate(nextPath)}
              className="bg-primary text-white font-semibold px-6 py-3 rounded-xl hover:bg-primary-dark transition-colors w-full"
            >
              {levelNumber < totalLevels ? `Continue to Level ${levelNumber + 1}` : 'Continue to Free Practice'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
