/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core'
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching'

declare let self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<never> }

self.skipWaiting()
clientsClaim()
cleanupOutdatedCaches()
precacheAndRoute(self.__WB_MANIFEST)

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const target = String(event.notification.data?.url ?? '/baby-check/#/today')
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (clients) => {
      const existing = clients.find((client) => 'focus' in client) as WindowClient | undefined
      if (existing) {
        await existing.navigate(target)
        return existing.focus()
      }
      return self.clients.openWindow(target)
    }),
  )
})
