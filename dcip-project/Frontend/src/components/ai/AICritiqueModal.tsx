import { useState } from 'react'

interface Props {
  question: string
  onSubmit: (explanation: string) => void
  onSkip: () => void
}

export default function AICritiqueModal({ question, onSubmit, onSkip }: Props) {
  const [text, setText] = useState('')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <h3 className="text-text-primary font-bold text-base text-center mb-2">AI needs a little help</h3>
        <p className="text-text-secondary text-sm text-center leading-relaxed mb-4">{question}</p>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type your explanation here..."
          rows={3}
          className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none mb-4"
          autoFocus
        />
        <div className="flex gap-2">
          <button
            onClick={onSkip}
            className="flex-1 border border-surface-border text-text-secondary rounded-xl py-2 text-sm hover:bg-surface-warm transition-colors"
          >
            Skip
          </button>
          <button
            onClick={() => { if (text.trim()) onSubmit(text.trim()) }}
            disabled={!text.trim()}
            className="flex-1 bg-primary text-white rounded-xl py-2 text-sm font-semibold hover:bg-primary-dark transition-colors disabled:opacity-40"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  )
}
