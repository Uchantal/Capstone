import { useNavigate } from 'react-router-dom'
import AdminLayout from '../../components/AdminLayout'
import { DISCIPLINES } from '../../hooks/usePreviewSequence'

export default function AdminPreviewPage() {
  const navigate = useNavigate()

  // Navigate into a page with preview mode active
  const go = (path: string) => navigate(path + '?preview=true')

  return (
    <AdminLayout>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-text-primary font-bold text-2xl mb-1">Platform Preview</h1>
          <p className="text-text-secondary text-sm">
            Navigate any part of the platform directly. Stage gating is bypassed in preview mode. No data is saved during preview.
          </p>
        </div>

        <div className="bg-primary/10 border border-primary rounded-lg p-3 mb-6">
          <p className="text-text-primary text-sm">
            You are viewing the platform as an administrator. Stage requirements are bypassed. Student data is not affected.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DISCIPLINES.map(discipline => (
            <div
              key={discipline.slug}
              className="bg-white border border-surface-border rounded-xl p-5 flex flex-col"
            >
              {/* Discipline header with Enter button */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-text-primary font-semibold text-sm">{discipline.title}</p>
                <button
                  onClick={() => go(discipline.pages[0].path)}
                  className="text-xs font-semibold bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-primary-dark transition-colors flex-shrink-0"
                >
                  Enter
                </button>
              </div>

              {/* Individual page links */}
              <div className="flex flex-col gap-0.5">
                {discipline.pages.map((page, idx) => (
                  <button
                    key={page.path}
                    onClick={() => go(page.path)}
                    className="w-full text-left px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-warm rounded-lg transition-colors flex items-center gap-2"
                  >
                    <span className="text-text-muted tabular-nums w-5 flex-shrink-0 text-right">{idx + 1}.</span>
                    <span className="truncate">{page.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </AdminLayout>
  )
}
