/* BRS PWA — SW mínimo (instalação). Não intercepta navegação/API/áudio. */
const CACHE = "brs-pwa-v3";
const PRECACHE = ["/site.webmanifest", "/images/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

// Handlers no topo do script (requisito do Chrome para 'message').
self.addEventListener("message", (event) => {
  if (event?.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

// Sem fetch handler: deixa a rede nativa cuidar de HTML, /api/musicas/stream e áudio.
// Interceptar fetch quebrava páginas (Response undefined) e mascarava erros de stream.
