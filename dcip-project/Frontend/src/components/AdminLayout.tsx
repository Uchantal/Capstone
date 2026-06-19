import AdminNav from './AdminNav'
import Footer from './Footer'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F9F7F4]">
      <AdminNav />
      <div className="flex-1">{children}</div>
      <Footer />
    </div>
  )
}
