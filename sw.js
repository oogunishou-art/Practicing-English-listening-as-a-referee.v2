/* 審判英語リスニング：電波がなくてもアプリを開けるようにする（ページだけを保存。音声はアプリ側で保存済み） */
const SHELL = 'rvshell-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.searchParams.has('appv')) return;              // 新しい版の確認はそのまま通す
  const isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname);
  if (!isPage) return;                                   // 音声ファイルなどは触らない
  e.respondWith((async () => {
    const cache = await caches.open(SHELL);
    const key = new URL('./index.html', self.registration.scope).href;
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(req, { signal: ctrl.signal, cache: 'no-store' });
      clearTimeout(t);
      if (res.ok) await cache.put(key, res.clone());
      return res;
    } catch (err) {
      const hit = await cache.match(key);
      if (hit) return hit;
      throw err;
    }
  })());
});
