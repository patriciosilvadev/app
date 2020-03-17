workbox.precaching.precacheAndRoute(self.__precacheManifest)

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

/*

workbox.setConfig({ debug: false })
workbox.core.skipWaiting()
workbox.core.clientsClaim()
workbox.routing.registerRoute(new RegExp('localhost'), new workbox.strategies.NetworkOnly())

self.addEventListener('push', e => {
  let data = {}

  if (e.data) {
    // IMPORTANT:
    // The following line does not use "e.data.json",
    // but "e.data.json()" !!!!!
    data = e.data.json()
  }

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'https://weekday-marketing.s3-us-west-2.amazonaws.com/logo-transparent.png',
    image: 'https://weekday-marketing.s3-us-west-2.amazonaws.com/logo-transparent.png',
  })
})
*/
