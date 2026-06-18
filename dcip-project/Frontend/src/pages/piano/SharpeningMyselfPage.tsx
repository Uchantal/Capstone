import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import TopNav from '../../components/TopNav'
import PianoKeyboard from '../../components/piano/PianoKeyboard'
import { ALL_TWELVE_CHORDS, buildChord } from '../../utils/pianoTheory'

export default function SharpeningMyselfPage() {
  const navigate = useNavigate()
  const [pressedNotes, setPressedNotes] = useState<string[]>([])
  const [selectedChord, setSelectedChord] = useState<string | null>(null)

  const currentChordDef = selectedChord
    ? ALL_TWELVE_CHORDS.find(c => c.symbol === selectedChord)
    : null

  const highlightNotes: string[] = []
  if (currentChordDef) {
    const names = buildChord(currentChordDef.root, currentChordDef.type, currentChordDef.useFlats)
    const normalize = (n: string) => {
      const e = Object.entries({ 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }).find(([,flat]) => flat === n)
      return e ? e[0] : n
    }
    const normalized = names.map(normalize)
    let oct = 4
    let prevIdx = -1
    const chromatic = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
    for (const note of normalized) {
      const idx = chromatic.indexOf(note)
      if (idx <= prevIdx && highlightNotes.length > 0) oct++
      highlightNotes.push(note + oct)
      prevIdx = idx
    }
  }

  const pressedNoteNames = pressedNotes.map(n => n.replace(/\d+$/, ''))

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
          <span className="text-text-primary">Sharpening Myself</span>
        </div>

        <h1 className="text-text-primary font-bold text-2xl mb-1">Sharpening Myself</h1>
        <p className="text-text-secondary text-sm mb-6">
          Free practice time. Explore any chord from the reference below. Click a chord to highlight it on the keyboard, then play it. When you feel ready, move to the production test.
        </p>

        {/* Chord reference grid */}
        <div className="bg-white border border-border rounded-2xl p-6 mb-5">
          <p className="text-text-muted text-xs uppercase tracking-wide mb-4">Chord Reference</p>
          <div className="grid grid-cols-4 gap-2 md:grid-cols-3">
            {ALL_TWELVE_CHORDS.map(chord => {
              const notes = buildChord(chord.root, chord.type, chord.useFlats)
              const isSelected = selectedChord === chord.symbol
              return (
                <button
                  key={chord.symbol}
                  onClick={() => setSelectedChord(isSelected ? null : chord.symbol)}
                  className={`text-left p-3 rounded-xl border transition-colors ${
                    isSelected
                      ? 'bg-primary/10 border-primary/40'
                      : 'border-border hover:border-primary/30 hover:bg-[#F9F7F4]'
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
        </div>

        {/* Live status */}
        {pressedNotes.length > 0 && (
          <div className="bg-white border border-border rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
            <span className="text-text-muted text-xs">Playing:</span>
            <div className="flex gap-1.5 flex-wrap">
              {pressedNoteNames.map(n => (
                <span key={n} className="bg-primary/10 text-primary text-xs font-semibold px-2 py-0.5 rounded-md">{n}</span>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard */}
        <PianoKeyboard
          onNotesChange={setPressedNotes}
          highlightNotes={highlightNotes}
        />

        {/* CTA */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={() => navigate('/piano/production')}
            className="bg-primary text-white font-semibold px-8 py-3 rounded-xl hover:bg-primary-dark transition-colors"
          >
            I am ready to be tested
          </button>
        </div>
      </div>
    </div>
  )
}
