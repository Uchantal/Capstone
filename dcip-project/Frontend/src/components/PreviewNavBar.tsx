import { useNavigate } from 'react-router-dom'
import { usePreviewSequence } from '../hooks/usePreviewSequence'

// Sits in the flex-col layout above the page content — never overlaps the canvas.
export default function PreviewNavBar() {
  const navigate = useNavigate()
  const {
    discipline,
    disciplineIdx,
    pageIdx,
    totalPages,
    pageLabel,
    prevPath,
    nextPath,
    disciplines,
  } = usePreviewSequence()

  const go = (path: string) => navigate(path + '?preview=true')

  const navBtn =
    'px-2.5 py-1 rounded text-xs font-semibold transition-colors flex-shrink-0 ' +
    'disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/20 active:bg-black/30'

  return (
    <div
      className="h-10 flex-shrink-0 bg-primary text-white flex items-center gap-2 px-3 z-40 select-none"
      style={{ minHeight: 40 }}
    >
      {/* Admin label */}
      <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 flex-shrink-0 hidden sm:block">
        Admin Preview
      </span>
      <div className="w-px h-5 bg-white/30 flex-shrink-0 hidden sm:block" />

      {/* Previous */}
      <button
        onClick={() => prevPath && go(prevPath)}
        disabled={!prevPath}
        className={navBtn}
        title={prevPath ? 'Previous page' : 'No previous page'}
      >
        Prev
      </button>

      {/* Position label */}
      <div className="flex-1 text-center text-xs truncate opacity-90 font-medium">
        {discipline
          ? `${discipline.title} — ${pageLabel} (${pageIdx + 1} of ${totalPages})`
          : 'Select a discipline below to start previewing'}
      </div>

      {/* Next */}
      <button
        onClick={() => nextPath && go(nextPath)}
        disabled={!nextPath}
        className={navBtn}
        title={nextPath ? 'Next page' : 'No next page'}
      >
        Next
      </button>

      <div className="w-px h-5 bg-white/30 flex-shrink-0" />

      {/* Switch Discipline */}
      <select
        value={disciplineIdx >= 0 ? String(disciplineIdx) : ''}
        onChange={e => {
          const d = disciplines[Number(e.target.value)]
          if (d) go(d.pages[0].path)
        }}
        className="bg-white/20 border border-white/40 text-white text-xs rounded px-2 py-1 flex-shrink-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-white/60"
        title="Jump to first page of a discipline"
      >
        <option value="" disabled className="text-gray-900 bg-white">
          Switch Discipline
        </option>
        {disciplines.map((d, i) => (
          <option key={d.slug} value={String(i)} className="text-gray-900 bg-white">
            {d.title}
          </option>
        ))}
      </select>

      {/* Exit */}
      <button
        onClick={() => navigate('/admin/preview')}
        className="px-2.5 py-1 rounded text-xs font-semibold border border-white/50 hover:bg-black/20 transition-colors flex-shrink-0"
        title="Return to preview index"
      >
        Exit Preview
      </button>
    </div>
  )
}
