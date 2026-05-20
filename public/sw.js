// 棋道 Service Worker
// Web Push 通知の受信とクリック処理のみを担当する最小実装。
// （オフラインキャッシュは現時点では未対応）

self.addEventListener('install', (event) => {
  // 即時アクティベート
  event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Push 受信
self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: '棋道', body: event.data ? event.data.text() : '' }
  }

  const title = data.title || '棋道'
  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-192.png',
    tag: data.tag || 'kido-default',
    data: { url: data.url || '/dashboard' },
    requireInteraction: false,
    vibrate: [120, 60, 120]
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// クリックで該当URLを開く
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.navigate(targetUrl)
          return client.focus()
        }
      }
      return self.clients.openWindow(targetUrl)
    })
  )
})
