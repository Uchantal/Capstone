import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { usePreviewMode } from '../../hooks/usePreviewMode'
import PianoKeyboard from './PianoKeyboard'
import { useChordValidation } from '../../hooks/useChordValidation'
import {
  buildChord,
  type ChordType,
} from '../../utils/pianoTheory'
import { completePianoDemonstration, savePortfolioItem } from '../../services/api'
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
  testChords: ChordDef[]
  requiredCorrect: number
  badgeLabel: 'Beginner' | 'Intermediate'
  nextPath: string
  practisePath: string
  practiseStageId: string
  practiseRedirect: string
  requiresDemoLevel?: 1 | 2
  requiresDemoRedirect?: string
}



type Phase = 'testing' | 'results'

export default function LevelDemonstrateScreen({
  levelNumber,
  levelTitle,
  testChords,
  requiredCorrect,
  badgeLabel,
  nextPath,
  practisePath,
  practiseStageId,
  practiseRedirect,
  requiresDemoLevel,
  requiresDemoRedirect,
}: Props) {
  const navigate = useNavigate()
  const isPreviewMode = usePreviewMode()
  const location = useLocation()
  const lockedMessage = (location.state as { lockedMessage?: string } | null)?.lockedMessage
  const { progress, loading } = usePianoProgress()

  const [phase, setPhase] = useState<Phase>('testing')
  const [chordIdx, setChordIdx] = useState(0)
  const [validState, setValidState] = useState<'idle' | 'correct'>('idle')
  const [pressedNotes, setPressedNotes] = useState<string[]>([])
  const [passed, setPassed] = useState(false)
  const [finalCorrect, setFinalCorrect] = useState(0)

  const correctCountRef = useRef(0)
  const chordIdxRef = useRef(0)
  const submittedRef = useRef(false)

  // Gate checks
  useEffect(() => {
    if (isPreviewMode) return
    if (loading) return
    if (requiresDemoLevel && requiresDemoRedirect) {
      const key = `level${requiresDemoLevel}DemonstrationPassed` as keyof typeof progress
      if (!progress[key]) {
        navigate(requiresDemoRedirect, {
          replace: true,
          state: { lockedMessage: `Complete the Level ${requiresDemoLevel} demonstration first.` },
        })
        return
      }
    }
    if (!progress.completedStages.includes(practiseStageId)) {
      navigate(practiseRedirect, {
        replace: true,
        state: { lockedMessage: 'Complete the practise session for this level first.' },
      })
    }
  }, [isPreviewMode, loading, progress, practiseStageId, practiseRedirect, requiresDemoLevel, requiresDemoRedirect, navigate])

  const advance = useCallback(async (wasCorrect: boolean) => {
    if (wasCorrect) correctCountRef.current++
    chordIdxRef.current++

    if (chordIdxRef.current >= testChords.length) {
      if (submittedRef.current) return
      submittedRef.current = true
      const didPass = correctCountRef.current >= requiredCorrect
      if (didPass && !isPreviewMode) {
        try { await completePianoDemonstration(levelNumber, true) } catch {}
        savePortfolioItem({
          discipline: 'piano',
          title: `Piano Level ${levelNumber} Demonstration`,
          fileType: 'result',
          fileData: `Passed ${correctCountRef.current} of ${testChords.length} chords`,
          durationMinutes: 0,
        }).catch(() => {})
      }
      setFinalCorrect(correctCountRef.current)
      setPassed(didPass)
      setPhase('results')
    } else {
      setChordIdx(chordIdxRef.current)
      setValidState('idle')
      setPressedNotes([])
    }
  }, [testChords.length, requiredCorrect, levelNumber])

  const handleMatch = useCallback(() => {
    if (validState === 'correct') return
    setValidState('correct')
    setTimeout(() => advance(true), 800)
  }, [validState, advance])

  const handleSkip = () => {
    if (validState === 'correct') return
    advance(false)
  }

  const handleTryAgain = () => {
    correctCountRef.current = 0
    chordIdxRef.current = 0
    submittedRef.current = false
    setChordIdx(0)
    setValidState('idle')
    setPressedNotes([])
    setPassed(false)
    setFinalCorrect(0)
    setPhase('testing')
  }

  const currentChord = testChords[chordIdx]
  const expectedNoteNames = currentChord
    ? buildChord(currentChord.root, currentChord.type, currentChord.useFlats)
    : []
  const pressedNoteNames = pressedNotes.map(n => n.replace(/\d+$/, ''))

  useChordValidation(pressedNoteNames, expectedNoteNames, handleMatch)

  if (loading) {
    return (
      <div className="h-screen bg-white flex items-center justify-center">
        <p className="text-text-muted text-sm">Loading...</p>
      </div>
    )
  }

  // Synchronous gate guard — prevents flash of content before redirect fires
  if (!isPreviewMode) {
    if (requiresDemoLevel && requiresDemoRedirect) {
      const key = `level${requiresDemoLevel}DemonstrationPassed` as keyof typeof progress
      if (!progress[key]) return null
    }
    if (!progress.completedStages.includes(practiseStageId)) return null
  }

  if (phase === 'results') {
    return (
      <div className="h-screen flex flex-col overflow-hidden">
        <div className="h-12 flex-shrink-0 bg-white border-b border-surface-border flex items-center px-4">
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <button
              onClick={() => navigate('/session/music-piano')}
              className="hover:text-text-primary transition-colors"
            >
              Piano
            </button>
            <span>/</span>
            <span>Door To Know Piano</span>
            <span>/</span>
            <span className="text-text-primary">{levelTitle} Demonstration</span>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 bg-white overflow-auto">
          <div className="max-w-md w-full">
            <div className={`border-2 rounded-2xl p-8 mb-6 ${passed ? 'border-secondary/30 bg-secondary/5' : 'border-surface-border bg-white'}`}>
              {passed ? (
                <>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level {levelNumber} Demonstration</p>
                  <h1 className="text-text-primary font-bold text-2xl mb-2">Demonstration passed</h1>
                  <p className="text-text-secondary text-sm leading-relaxed mb-4">
                    You got {finalCorrect} of {testChords.length} chords correct. You have earned the {badgeLabel} Piano badge.
                  </p>
                  <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-semibold px-4 py-2 rounded-full">
                    {badgeLabel} Piano Badge
                  </div>
                </>
              ) : (
                <>
                  <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Level {levelNumber} Demonstration</p>
                  <h1 className="text-text-primary font-bold text-2xl mb-2">Not quite</h1>
                  <p className="text-text-secondary text-sm leading-relaxed">
                    You got {finalCorrect} of {testChords.length} chords correct. You need {requiredCorrect} to pass. Go back and practise the chords again, then try the demonstration again.
                  </p>
                </>
              )}
            </div>

            <div className="space-y-3">
              {passed ? (
                <button
                  onClick={() => navigate(nextPath)}
                  className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                >
                  Continue
                </button>
              ) : (
                <>
                  <button
                    onClick={() => navigate(practisePath)}
                    className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors text-sm"
                  >
                    Practise Again
                  </button>
                  <button
                    onClick={handleTryAgain}
                    className="w-full border border-surface-border text-text-secondary font-medium py-3 rounded-xl hover:bg-gray-50 transition-colors text-sm"
                  >
                    Try Demonstration Again
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Testing phase
  const feedbackText = validState === 'correct'
    ? 'Correct. Hold steady.'
    : pressedNoteNames.length > 0
    ? 'Hold steady...'
    : 'Find the chord notes from memory and press them together.'

  const feedbackClass = validState === 'correct'
    ? 'text-secondary font-semibold'
    : 'text-text-muted'

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
          <span>Door To Know Piano</span>
          <span>/</span>
          <span className="text-text-primary">{levelTitle} Demonstration</span>
        </div>
        <button
          onClick={handleSkip}
          disabled={validState === 'correct'}
          className="border border-surface-border text-text-secondary text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Skip this chord
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-shrink-0 bg-[#F9F7F4] border-b border-surface-border p-4">
          {lockedMessage && (
            <div className="bg-accent/10 border border-accent/30 rounded-lg px-3 py-2 mb-4 text-accent text-sm">
              {lockedMessage}
            </div>
          )}

          <div className="flex items-center justify-between mb-4">
            <p className="text-text-muted text-xs uppercase tracking-wide">
              Chord {chordIdx + 1} of {testChords.length}
            </p>
            <div className="flex gap-1.5">
              {testChords.map((_, i) => (
                <span
                  key={i}
                  className={`w-2 h-2 rounded-full ${
                    i < chordIdx ? 'bg-secondary' : i === chordIdx ? 'bg-primary' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="mb-3">
            <p className="text-text-muted text-xs uppercase tracking-wide mb-2">Play this chord</p>
            <span className="text-5xl font-bold text-text-primary leading-none">
              {currentChord.symbol}
            </span>
          </div>

          <p className={`text-sm ${feedbackClass}`}>{feedbackText}</p>
        </div>

        <div className="flex-1 bg-[#E8E4DC] p-4 flex flex-col overflow-hidden">
          <div className="flex-1 flex flex-col overflow-hidden bg-white rounded-xl shadow-sm">
            <PianoKeyboard
              onNotesChange={notes => {
                setPressedNotes(notes)
                if (validState === 'correct') return
                setValidState('idle')
              }}
              highlightNotes={[]}
              disabled={validState === 'correct'}
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
