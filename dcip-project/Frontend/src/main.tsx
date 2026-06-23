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
        .then(() => console.log('Service Worker registered'))
        .catch((err) => console.log('SW registration failed:', err))
    })
  } else {
    // Unregister any stale service workers in development so they don't serve cached pages
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((reg) => reg.unregister())
    })
  }
}
