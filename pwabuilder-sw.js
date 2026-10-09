// Service worker de consultecweb: la app abre también sin internet
const CACHE = "technomaav-v9";
const offlineFallbackPage = "./offline.html";
const JSPDF = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
const PRECACHE = ["./", "./index.html", offlineFallbackPage, "./manifest.json",
                  "./icons/icon-192.png", "./icons/icon-512.png", "./icons/logo.jpg"];

self.addEventListener("message", (e) => {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE).then(() => c.add(JSPDF).catch(() => {}))));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET" || (new URL(req.url).origin !== location.origin && req.url !== JSPDF)) return;

  // Páginas: red primero, si falla usa la copia guardada, y si no, la página offline
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch(req);
        cache.put(req, res.clone());
        return res;
      } catch (err) {
        return (await cache.match(req)) || (await cache.match("./index.html")) ||
               (await cache.match(offlineFallbackPage)) || Response.error();
      }
    })());
    return;
  }

  // Resto de archivos: caché primero y se actualiza en segundo plano
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => cached);
    return cached || net;
  })());
});
