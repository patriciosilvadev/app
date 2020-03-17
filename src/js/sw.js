workbox.precaching.precacheAndRoute(self.__precacheManifest)

// workbox.setConfig({ debug: false })
// workbox.core.skipWaiting()
// workbox.core.clientsClaim()

// Don't cache localhost
// workbox.routing.registerRoute(new RegExp('localhost'), new workbox.strategies.NetworkOnly())

// Cache API
workbox.routing.registerRoute(
  new RegExp(/\/api/),
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
  new RegExp(/\/graphql/),
  new workbox.strategies.NetworkFirst({
    cacheName: 'graphql',
    plugins: [
      new workbox.expiration.Plugin({
        maxAgeSeconds: 10 * 60,
      }),
    ],
  })
)

// Skip waiting
addEventListener('message', event => {
  skipWaiting()
  console.log(`SKIPPING WAITING (FROM APP): ${event.data}`)
})

addEventListener('push', event => {
  let data = {}

  if (event.data) {
    data = event.data.json()
  }

  const title = data.title || 'Yack'
  const message = data.message || 'This is the default message'
  const icon = 'https://weekday-marketing.s3-us-west-2.amazonaws.com/logo-transparent.png'

  var notification = new self.Notification(title, {
    body: message,
    tag: 'yack-notification',
    icon: icon,
  })

  /*
  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '',
    image: 'https://weekday-marketing.s3-us-west-2.amazonaws.com/logo-transparent.png',
  })
  */

  notification.addEventListener('click', function() {
    if (clients.openWindow) {
      clients.openWindow('https://yack.app')
    }
  })
})
