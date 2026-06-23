import TopNav from './TopNav'
import Footer from './Footer'
import OfflineBanner from './OfflineBanner'
import SyncToast from './SyncToast'

interface Props {
  children: React.ReactNode
  background?: string
}

export default function MainLayout({ children, background = 'bg-white' }: Props) {
  return (
    <div className={`min-h-screen flex flex-col ${background}`}>
      <TopNav />
      <OfflineBanner />
      <div className="flex-1">{children}</div>
      <Footer />
      <SyncToast />
    </div>
  )
}
