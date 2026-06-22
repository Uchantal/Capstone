import { useState } from 'react'

export default function SessionNotepad() {
  const [open, setOpen]   = useState(false)
  const [notes, setNotes] = useState('')

  return (
    <div style={{ position: 'absolute', bottom: 12, right: 12, zIndex: 30, pointerEvents: 'auto' }}>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          title="Session Notes"
          style={{
            width: 34, height: 34,
            background: '#fff',
            border: '1px solid #C9A84C',
            borderRadius: 6,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>
            <line x1="9" y1="7" x2="16" y2="7"/>
            <line x1="9" y1="11" x2="16" y2="11"/>
            <line x1="9" y1="15" x2="13" y2="15"/>
          </svg>
        </button>
      ) : (
        <div style={{
          width: 220,
          background: '#fff',
          border: '1px solid #C9A84C',
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 8px',
            borderBottom: '1px solid #C9A84C',
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: '#1A1A1A', fontFamily: 'sans-serif' }}>
              Session Notes
            </span>
            <button
              onClick={() => setOpen(false)}
              title="Close"
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', lineHeight: 1 }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Write measurements or notes here"
            style={{
              display: 'block', width: '100%', height: 160,
              border: 'none', outline: 'none', resize: 'none',
              padding: '7px 9px', fontSize: 12,
              fontFamily: 'sans-serif', color: '#1A1A1A',
              boxSizing: 'border-box', lineHeight: 1.5,
            }}
          />
        </div>
      )}
    </div>
  )
}
