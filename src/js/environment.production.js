import * as Sentry from '@sentry/browser'

export const UPLOAD_HOST = 'https://api.weekday.sh/api/upload'
export const AUTH_HOST = 'https://api.weekday.sh/api/auth'
export const API_HOST = 'https://api.weekday.sh/graphql'
export const SOCKETIO_HOST = 'https://websocket.weekday.sh'
export const LOCAL_DB = 'weekday'

// Set up Sentry
Sentry.init({ dsn: 'https://aab4b362715b436a9180426477e17e2b@sentry.io/1513390' })

// Workbox
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then(registration => {
        console.log('SW registered: ', registration)
      })
      .catch(registrationError => {
        console.log('SW registration failed: ', registrationError)
      })
  })
}
