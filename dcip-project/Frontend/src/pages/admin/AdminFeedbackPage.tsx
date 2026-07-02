import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout'
import { getAdminFeedback } from '../../services/api'

interface FeedbackItem {
  _id: string
  name?: string
  email?: string
  feedbackType: string
  discipline?: string
  message: string
  screenshotData?: string
  submittedAt: string
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default function AdminFeedbackPage() {
  const [items, setItems] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState<string | null>(null)

  useEffect(() => {
    getAdminFeedback()
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-text-primary font-bold text-2xl mb-1">Feedback Submissions</h1>
          <p className="text-text-secondary text-sm">
            {loading ? 'Loading...' : `${items.length} submission${items.length !== 1 ? 's' : ''} received`}
          </p>
        </div>

        {!loading && items.length === 0 && (
          <div className="bg-white border border-surface-border rounded-2xl p-8 text-center">
            <p className="text-text-secondary text-sm">No feedback submissions yet.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="bg-white border border-surface-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border bg-[#F9F7F4]">
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Name</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Email</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Type</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Discipline</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Message</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Screenshot</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {items.map(item => (
                    <tr key={item._id} className="hover:bg-[#F9F7F4] transition-colors">
                      <td className="px-4 py-3 text-text-primary font-medium whitespace-nowrap">
                        {item.name || 'Anonymous'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {item.email || 'not provided'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{item.feedbackType}</td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {item.discipline || '-'}
                      </td>
                      <td className="px-4 py-3 text-text-secondary max-w-xs">
                        <p className="line-clamp-2">{item.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        {item.screenshotData ? (
                          <button
                            onClick={() => setLightbox(item.screenshotData!)}
                            aria-label="View full screenshot"
                            className="block"
                          >
                            <img
                              src={item.screenshotData}
                              alt="Screenshot"
                              loading="lazy"
                              className="w-16 h-11 object-cover rounded border border-surface-border hover:border-primary hover:opacity-90 transition-all"
                            />
                          </button>
                        ) : (
                          <span className="text-text-muted text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text-secondary whitespace-nowrap">
                        {formatDate(item.submittedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Screenshot lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-3 border-b border-surface-border">
              <p className="text-text-primary font-semibold text-sm">Attached Screenshot</p>
              <button
                onClick={() => setLightbox(null)}
                className="text-text-secondary text-xs px-3 py-1.5 rounded-lg border border-surface-border hover:bg-surface-warm transition-colors"
              >
                Close
              </button>
            </div>
            <div className="p-4 bg-surface-warm/40">
              <img
                src={lightbox}
                alt="User screenshot"
                className="max-w-full max-h-[75vh] object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}
