// Idiocy's service worker: shows the notifications the server pushes while Idiocy is closed,
// and opens the right chat or post when one is tapped. It doesn't cache anything.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Every push shows a notification (phones stop sending pushes to apps that don't).
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) {}
  e.waitUntil(self.registration.showNotification(d.title || 'Idiocy', {
    body: d.body || '',
    icon: 'icon-192.png',
    tag: d.tag || undefined, // a newer message from the same chat replaces the older one
    renotify: !!d.tag,
    data: { url: d.url || './' },
  }));
});

// Tapping one: back to Idiocy if it's open somewhere (it opens the chat itself), or open it.
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL(e.notification.data && e.notification.data.url || './', self.registration.scope).href;
  e.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const win = open.find(w => new URL(w.url).origin === self.location.origin);
    if (win) {
      await win.focus();
      win.postMessage({ open: url });
      return;
    }
    await self.clients.openWindow(url);
  })());
});
