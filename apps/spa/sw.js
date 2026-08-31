/* ===========================================================================
   VOLDEBUG — service worker
   ---------------------------------------------------------------------------
   What "offline" honestly means for this app: everything a student's
   progress needs — XP, streaks, badges, chapter and prompt history — already
   lives in localStorage and needs no network at all. The app now also talks
   to an API when a student is signed in, but that traffic is deliberately
   NOT this worker's business: journey events are queued in localStorage by
   the app itself and replayed when the connection returns, which is a far
   better offline story than a cached POST would be.

   So this worker's job stays small and honest: cache the shell (one HTML
   file), serve it when there is no network, and get out of the way of
   anything it does not recognise — above all /v1, which must never be
   answered from a cache.

   The app is served under /app/ (same origin as the API at /v1), so every
   path here is scoped to /app/. CACHE_VERSION must change whenever app.js or
   styles.css change — bumping it is what discards the old cache, and
   forgetting to bump it is the single most common way a service worker
   quietly serves a stale build to every returning student.
   =========================================================================== */

const CACHE_VERSION = 'voldebug-v5';
const SHELL_URL = '/app/';

const PRECACHE = [
  '/app/',
  '/app/manifest.json',
  '/app/icon-192.png',
  '/app/icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only ever handle same-origin GET requests. Anything else (fonts from
  // Google, a POST, cross-origin calls) is left completely alone — this
  // worker has no business deciding what happens to traffic it doesn't own.
  if (req.method !== 'GET') return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.origin !== self.location.origin) return;

  // The API is never cached, never intercepted. A stale profile served from
  // a cache would look exactly like progress that failed to save.
  if (url.pathname === '/v1' || url.pathname.startsWith('/v1/')) return;

  // Nothing outside the app's own scope is ours to serve.
  if (!url.pathname.startsWith('/app/')) return;

  // Network-first for the app shell itself: a student with a connection
  // should always get today's build, not yesterday's cached one. The cache
  // is the fallback for when the network fails, not the default source.
  if (req.mode === 'navigate' || url.pathname === '/app/' || url.pathname.endsWith('/index.html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then(c => c.put(SHELL_URL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL_URL))
    );
    return;
  }

  // Everything else precached (icons, manifest): cache-first, since these
  // do not change without a new icon set entirely.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req))
  );
});
