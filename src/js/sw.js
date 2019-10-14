workbox.core.skipWaiting()
workbox.core.clientsClaim()

workbox.routing.registerRoute(
  new RegExp('localhost'),
  new workbox.strategies.NetworkOnly()
)

workbox.precaching.precacheAndRoute(self.__precacheManifest);

self.addEventListener('push', event => {
  const data = event.data.json()

  self.registration.showNotification(data.title, {
    body: data.body,
  })
})
