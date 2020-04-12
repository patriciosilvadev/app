workbox.precaching.precacheAndRoute(self.__precacheManifest)

// workbox.setConfig({ debug: false })
// workbox.core.skipWaiting()
// workbox.core.clientsClaim()

// Cache API
workbox.routing.registerRoute(
  new RegExp(/\/api.yack.co/),
  new workbox.strategies.NetworkFirst({
    cacheName: 'api',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 10 * 60,
      }),
    ],
  })
)

// Cache GraphQL endpoints
workbox.routing.registerRoute(
  new RegExp(/\/api.yack.co\/graphql/),
  new workbox.strategies.NetworkFirst({
    cacheName: 'graphql',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 10 * 60,
      }),
    ],
  })
)

// Don't cache localhost
workbox.routing.registerRoute(new RegExp(/\/localhost/), new workbox.strategies.NetworkOnly())

// Skip waiting
addEventListener('message', event => {
  console.log(`PROD:MESSAGE → ${event.data}`)

  if (event.data == 'SKIP_WAITING') skipWaiting()
})

addEventListener('push', event => {
  let data = {}

  if (event.data) {
    data = event.data.json()
  }

  const title = data.title || 'Yack'
  const body = data.body || 'This is the default message'
  const icon = 'https://yack-marketing.s3-us-west-2.amazonaws.com/logo.png'
  const image = 'https://yack-marketing.s3-us-west-2.amazonaws.com/logo.png'
  const tag = 'yack-notification'

  self.registration.showNotification(title, {
    body,
    tag,
    icon,
    image,
  })

  /*
  notification.addEventListener('click', function() {
    if (clients.openWindow) {
      clients.openWindow('https://yack.app')
    }
  })
  */
})
