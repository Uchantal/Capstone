import { useEffect, useRef, useState } from 'react'
import api from '../../services/api'

interface Props {
  discipline: string
  context?: string
}

interface Bubble {
  text: string
  x: number
  y: number
}

interface ChatMessage {
  question: string
  image?: string
  answer: string | null
}

export default function AskAIHint({ discipline, context }: Props) {
  const [open,         setOpen]         = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [bubble,       setBubble]       = useState<Bubble | null>(null)
  const [question,     setQuestion]     = useState('')
  const [loading,      setLoading]      = useState(false)
  const [imageData,    setImageData]    = useState<string | null>(null)
  const [messages,     setMessages]     = useState<ChatMessage[]>([])

  const panelRef      = useRef<HTMLDivElement>(null)
  const bubbleRef     = useRef<HTMLDivElement>(null)
  const inputRef      = useRef<HTMLTextAreaElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const bottomRef     = useRef<HTMLDivElement>(null)

  // Scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Show inline bubble on text selection
  useEffect(() => {
    function onMouseUp(e: MouseEvent) {
      if (panelRef.current?.contains(e.target as Node)) return
      if (bubbleRef.current?.contains(e.target as Node)) return
      const sel  = window.getSelection()
      const text = sel?.toString().trim() ?? ''
      if (text.length < 8) { setBubble(null); return }
      const range = sel?.getRangeAt(0)
      const rect  = range?.getBoundingClientRect()
      if (!rect) return
      setSelectedText(text)
      setBubble({
        text,
        x: Math.min(Math.max(rect.left + rect.width / 2, 60), window.innerWidth - 60),
        y: rect.top - 8,
      })
    }
    document.addEventListener('mouseup', onMouseUp)
    return () => document.removeEventListener('mouseup', onMouseUp)
  }, [])

  // Clear bubble on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (panelRef.current?.contains(e.target as Node)) return
      if (bubbleRef.current?.contains(e.target as Node)) return
      setBubble(null)
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setImageData(ev.target?.result as string)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const textToAsk = question.trim() || selectedText

  async function ask(text: string, img?: string | null) {
    const newMsg: ChatMessage = { question: text, image: img ?? undefined, answer: null }
    setMessages(prev => [...prev, newMsg])
    setQuestion('')
    setSelectedText('')
    setImageData(null)
    setLoading(true)
    try {
      const res = await api.post('/ai/hint', {
        selectedText: text,
        discipline,
        context,
        ...(img ? { imageData: img } : {}),
      })
      setMessages(prev =>
        prev.map((m, i) => i === prev.length - 1 ? { ...m, answer: res.data.hint } : m)
      )
    } catch {
      setMessages(prev =>
        prev.map((m, i) => i === prev.length - 1 ? { ...m, answer: 'AI is unavailable right now. Please try again shortly.' } : m)
      )
    } finally {
      setLoading(false)
    }
  }

  function handleAsk() {
    if (!textToAsk || loading) return
    ask(textToAsk, imageData)
  }

  function handleBubbleClick(text: string) {
    setBubble(null)
    setOpen(true)
    setTimeout(() => ask(text), 80)
  }

  function handleToggle() {
    setOpen(prev => !prev)
  }

  return (
    <>
      {/* Inline selection bubble */}
      {bubble && (
        <div
          ref={bubbleRef}
          style={{ position: 'fixed', left: bubble.x - 48, top: bubble.y - 38, zIndex: 10000 }}
        >
          <button
            onMouseDown={e => e.preventDefault()}
            onClick={() => handleBubbleClick(bubble.text)}
            className="flex items-center gap-1.5 bg-[#1B3A6E] text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg whitespace-nowrap hover:opacity-90 transition-opacity"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Ask AI
          </button>
        </div>
      )}

      {/* Bottom-right panel */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3">

        {open && (
          <div
            ref={panelRef}
            className="bg-white rounded-2xl shadow-2xl border border-surface-border w-80 flex flex-col overflow-hidden"
            style={{ height: '70vh' }}
          >
            {/* Header */}
            <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-[#1B3A6E]">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <p className="text-white font-semibold text-sm">DCIP AI Assistant</p>
              </div>
              <div className="flex items-center gap-3">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    className="text-white/60 hover:text-white text-xs"
                    title="Clear chat"
                  >
                    Clear
                  </button>
                )}
                <button onClick={handleToggle} className="text-white/70 hover:text-white text-lg leading-none">&times;</button>
              </div>
            </div>

            {/* Chat history — scrollable */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {messages.length === 0 && (
                <p className="text-xs text-text-muted text-center pt-6 leading-relaxed">
                  Ask anything from this lesson, or highlight text on the page to ask about it.
                </p>
              )}

              {messages.map((msg, i) => (
                <div key={i} className="space-y-2">
                  {/* Question bubble */}
                  <div className="flex justify-end">
                    <div className="max-w-[85%] space-y-1">
                      {msg.image && (
                        <img src={msg.image} alt="attached" className="h-20 w-full object-cover rounded-xl border border-surface-border" />
                      )}
                      <div className="bg-[#1B3A6E] text-white text-xs rounded-2xl rounded-tr-sm px-3 py-2 leading-relaxed">
                        {msg.question}
                      </div>
                    </div>
                  </div>

                  {/* Answer bubble */}
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-surface-warm rounded-2xl rounded-tl-sm px-3 py-2">
                      {msg.answer === null ? (
                        <p className="text-xs text-text-muted italic">Thinking...</p>
                      ) : (
                        <p className="text-xs text-text-secondary leading-relaxed">{msg.answer}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              <div ref={bottomRef} />
            </div>

            {/* Input area — always visible at bottom */}
            <div className="flex-shrink-0 border-t border-surface-border px-3 py-3 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />

              {/* Selected text preview */}
              {selectedText && (
                <div className="border-l-2 border-[#1B3A6E] bg-surface-warm rounded-r-lg px-2 py-1.5">
                  <p className="text-[9px] text-text-muted uppercase tracking-wide mb-0.5 font-medium">Asking about</p>
                  <p className="text-[10px] text-text-secondary line-clamp-1 italic">"{selectedText}"</p>
                </div>
              )}

              {/* Image preview */}
              {imageData && (
                <div className="relative inline-block">
                  <img src={imageData} alt="upload" className="h-12 rounded-lg border border-surface-border object-cover" />
                  <button
                    onClick={() => setImageData(null)}
                    className="absolute -top-1.5 -right-1.5 bg-white border border-surface-border rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-text-muted hover:text-red-500"
                  >
                    &times;
                  </button>
                </div>
              )}

              <textarea
                ref={inputRef}
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAsk() } }}
                placeholder="Type a question..."
                rows={2}
                className="w-full border border-surface-border rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-[#1B3A6E] resize-none"
              />

              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  title="Attach an image"
                  className="flex items-center justify-center border border-surface-border rounded-xl px-3 py-2 hover:border-[#1B3A6E] transition-colors"
                >
                  <svg className="w-4 h-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={handleAsk}
                  disabled={!textToAsk || loading}
                  className="flex-1 bg-[#1B3A6E] text-white font-semibold py-2 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-40 text-sm"
                >
                  {loading ? 'Thinking...' : 'Ask AI'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Persistent trigger button */}
        <button
          onClick={handleToggle}
          className="flex items-center gap-2 bg-[#1B3A6E] text-white font-semibold px-4 py-2.5 rounded-full shadow-xl hover:opacity-90 transition-all"
          style={{ boxShadow: '0 4px 20px rgba(27,58,110,0.4)' }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="text-sm">Ask AI</span>
        </button>
      </div>
    </>
  )
}
