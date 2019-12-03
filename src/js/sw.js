workbox.setConfig({ debug: false })
workbox.core.skipWaiting()
workbox.core.clientsClaim()
workbox.routing.registerRoute(new RegExp('localhost'), new workbox.strategies.NetworkOnly())
workbox.precaching.precacheAndRoute(self.__precacheManifest)

self.addEventListener('push', e => {
  let data = {}

  if (e.data) {
    // IMPORTANT:
    // The following line does not use "e.data.json",
    // but "e.data.json()" !!!!!
    data = e.data.json()
  }

  self.registration.showNotification(data.title, {
    body: 'It is time to go for lunch.',
    icon: 'MyLogo.png',
  })
})
