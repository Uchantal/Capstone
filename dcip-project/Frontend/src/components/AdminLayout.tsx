import AdminNav from './AdminNav'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9F7F4]">
      <AdminNav />
      {children}
    </div>
  )
}
