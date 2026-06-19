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

  useEffect(() => {
    getAdminFeedback()
      .then(res => setItems(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <AdminLayout>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-text-primary font-bold text-2xl mb-1">Feedback Submissions</h1>
          <p className="text-text-secondary text-sm">
            {loading ? 'Loading...' : `${items.length} submission${items.length !== 1 ? 's' : ''} received`}
          </p>
        </div>

        {!loading && items.length === 0 && (
          <div className="bg-white border border-border rounded-2xl p-8 text-center">
            <p className="text-text-secondary text-sm">No feedback submissions yet.</p>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div className="bg-white border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-[#F9F7F4]">
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Name</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Email</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Type</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Discipline</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Message</th>
                    <th className="text-left px-4 py-3 text-text-muted text-xs font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
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
    </AdminLayout>
  )
}
