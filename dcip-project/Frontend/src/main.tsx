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
        .then(() => {
          console.log('Service Worker registered')
          // When a new SW activates (skipWaiting fires after a deploy), reload so
          // the page always runs the latest JS bundle. Without this the old bundle
          // keeps running even though the new SW is controlling the page, which
          // causes features added in the latest deploy (e.g. the back button) to
          // appear broken until the student manually refreshes.
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload()
          })
        })
        .catch((err) => console.log('SW registration failed:', err))
    })
  } else {
    // Unregister any stale service workers in development so they don't serve cached pages
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister())
    })
  }
}
