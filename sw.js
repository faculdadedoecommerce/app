// App Faecom: guarda só a "casca" (ícones e esta página); dados e tela vêm sempre da API
const CACHE = 'faecom-casca-v6';
const API = 'https://api.faecom.com.br';
const CASCA = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html'))));
});
// Notificações: o aviso chega sem conteúdo e o app busca a mensagem na API da Faecom.
const OPC = { icon: 'icon-192.png', badge: 'icon-192.png' };
self.addEventListener('push', e => {
  e.waitUntil(self.registration.pushManager.getSubscription()
    .then(s => s ? fetch(API + '/push/pull', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ep: s.endpoint }) }).then(r => r.json()) : { msgs: [] })
    .then(j => {
      const m = (j && j.msgs) || [];
      if (!m.length) return self.registration.showNotification('Faê', Object.assign({ body: 'Você tem novidades nas suas lojas.', data: { u: '/' } }, OPC));
      return Promise.all(m.slice(-3).map(x => self.registration.showNotification(x.t || 'Faê', Object.assign({ body: x.b || '', tag: String(x.ts || Date.now()), data: { u: x.u || '/' } }, OPC))));
    })
    .catch(() => self.registration.showNotification('Faê', Object.assign({ body: 'Você tem novidades nas suas lojas.', data: { u: '/' } }, OPC))));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const u = (e.notification.data && e.notification.data.u) || '/';
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => {
    for (const w of ws) { if ('focus' in w) { if ('navigate' in w) w.navigate(u).catch(() => {}); return w.focus(); } }
    return self.clients.openWindow(u);
  }));
});
