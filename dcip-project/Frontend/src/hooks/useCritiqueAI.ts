import { useRef, useState } from 'react'
import api from '../services/api'

export type CritiqueState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'needsExplanation'; question: string }
  | { status: 'done'; score: number; feedback: string; suggestions: string[] }
  | { status: 'skipped' }
  | { status: 'error'; message: string }

export function useCritiqueAI() {
  const [state, setState] = useState<CritiqueState>({ status: 'idle' })
  const abortRef = useRef(false)

  async function runCritique(imageData: string, discipline: string, level: number) {
    abortRef.current = false
    setState({ status: 'loading' })
    try {
      const res = await api.post('/ai/critique', { imageData, discipline, level })
      if (abortRef.current) return
      const data = res.data
      if (data.needsExplanation) {
        setState({ status: 'needsExplanation', question: data.question ?? 'Can you explain the idea behind your work?' })
      } else {
        setState({
          status: 'done',
          score:       typeof data.score === 'number' ? data.score : 70,
          feedback:    data.feedback ?? '',
          suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
        })
      }
    } catch {
      if (!abortRef.current) {
        setState({ status: 'error', message: 'AI assessment unavailable right now. Your work was still saved.' })
      }
    }
  }

  async function submitExplanation(imageData: string, discipline: string, level: number, explanation: string) {
    setState({ status: 'loading' })
    try {
      const res = await api.post('/ai/critique', { imageData, discipline, level, explanation })
      const data = res.data
      setState({
        status:      'done',
        score:       typeof data.score === 'number' ? data.score : 70,
        feedback:    data.feedback ?? '',
        suggestions: Array.isArray(data.suggestions) ? data.suggestions : [],
      })
    } catch {
      setState({ status: 'error', message: 'AI assessment unavailable right now. Your work was still saved.' })
    }
  }

  function skipCritique() {
    abortRef.current = true
    setState({ status: 'skipped' })
  }

  function resetCritique() {
    abortRef.current = true
    setState({ status: 'idle' })
  }

  return { state, runCritique, submitExplanation, skipCritique, resetCritique }
}
