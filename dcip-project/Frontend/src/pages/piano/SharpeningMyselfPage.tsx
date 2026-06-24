import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import PianoKeyboard from '../../components/piano/PianoKeyboard'
import { ALL_TWELVE_CHORDS, buildChord } from '../../utils/pianoTheory'
import { usePianoProgress } from '../../hooks/usePianoProgress'

export default function SharpeningMyselfPage() {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const { loading, markStageVisited } = usePianoProgress()
  const [pressedNotes, setPressedNotes] = useState<string[]>([])
  const [selectedChord, setSelectedChord] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return
    markStageVisited('piano-sharpening')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading])

  const currentChordDef = selectedChord
    ? ALL_TWELVE_CHORDS.find(c => c.symbol === selectedChord)
    : null

  const highlightNotes: string[] = []
  if (currentChordDef) {
    const names = buildChord(currentChordDef.root, currentChordDef.type, currentChordDef.useFlats)
    const normalize = (n: string) => {
      const e = Object.entries({ 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' }).find(([, flat]) => flat === n)
      return e ? e[0] : n
    }
    const normalized = names.map(normalize)
    let oct = 4
    let prevIdx = -1
    const chromatic = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    for (const note of normalized) {
      const idx = chromatic.indexOf(note)
      if (idx <= prevIdx && highlightNotes.length > 0) oct++
      highlightNotes.push(note + oct)
      prevIdx = idx
    }
  }

  const pressedNoteNames = pressedNotes.map(n => n.replace(/\d+$/, ''))

  if (!isPreviewMode && loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
        <div className="flex items-center gap-2 text-xs text-text-muted flex-1">
          <button
            onClick={() => navigate('/session/music-piano')}
            className="hover:text-text-primary transition-colors"
          >
            Piano
          </button>
          <span>/</span>
          <span className="text-text-primary">Sharpening Myself</span>
        </div>
        <button
          onClick={() => navigate('/piano/production')}
          className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition-colors text-sm"
        >
          I am ready to be tested
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border overflow-y-auto p-4">
          <h1 className="text-text-primary font-bold text-lg mb-1">Sharpening Myself</h1>
          <p className="text-text-secondary text-sm mb-4">
            Free practice time. Explore any chord from the reference below. Click a chord to highlight it on the keyboard, then play it. When you feel ready, move to the production test.
          </p>

          <p className="text-text-muted text-xs uppercase tracking-wide mb-3">Chord Reference</p>
          <div className="grid grid-cols-4 gap-2">
            {ALL_TWELVE_CHORDS.map(chord => {
              const notes = buildChord(chord.root, chord.type, chord.useFlats)
              const isSelected = selectedChord === chord.symbol
              return (
                <button
                  key={chord.symbol}
                  onClick={() => setSelectedChord(isSelected ? null : chord.symbol)}
                  className={`text-left p-2.5 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-primary/40'
                      : 'border-surface-border hover:border-primary/30 hover:bg-white'
                  }`}
                >
                  <p className={`font-bold text-sm mb-0.5 ${isSelected ? 'text-primary' : 'text-text-primary'}`}>
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
