import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import api from './services/api'
import { setupOfflineInterceptor } from './utils/syncQueue'

setupOfflineInterceptor(api)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    // Register SW in production for offline-first support
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered')
          // Force an update check immediately and on each focus; browsers may defer SW checks for up to 24h.
          registration.update()
          document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') registration.update()
          })
          // Reload when a new SW activates so the page always runs the latest bundle.
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload()
          })
        })
        .catch((err) => console.log('SW registration failed:', err))
    })
  } else {
    // In dev, unregister stale service workers to avoid serving cached pages.
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister())
    })
  }
}
