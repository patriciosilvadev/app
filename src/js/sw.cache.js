workbox.setConfig({ debug: false })

workbox.core.skipWaiting()
workbox.core.clientsClaim()
workbox.routing.registerRoute(
  new RegExp('localhost'),
  new workbox.strategies.NetworkOnly()
)

workbox.precaching.precacheAndRoute(self.__precacheManifest)
