// Bump CACHE version whenever you change index.html or icons.
const CACHE = "sprites-v12";
const SPRITE_IDS = ["water","earth","fire","duck","ghost","demon","king","punk","dream","zeropoint"];
const VARIANT_KEYS = ["standard","gold","gummy","galaxy"]; // Galaxy released for all 10 sprites
const SPRITE_IMAGES = [
  ...SPRITE_IDS.flatMap(id => VARIANT_KEYS.map(v => `./images/${id}-${v}.webp`)),
  "./images/peanut-standard.webp"
];
const SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-maskable-512.png",
  "./apple-touch-icon.png",
  "./favicon-32.png",
  ...SPRITE_IMAGES
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;

  // Never cache the sync/login API — it must always hit the network.
  if (sameOrigin && url.pathname.startsWith("/api/")) return;

  // The page itself (navigations): network-first so a new deploy shows up immediately;
  // fall back to the cached shell only when offline. This prevents stale-version bugs.
  if (sameOrigin && req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => caches.match(req).then(hit => hit || caches.match("./index.html")))
    );
    return;
  }

  if (sameOrigin) {
    // Static assets (images, icons): cache-first, refresh in background.
    e.respondWith(
      caches.match(req).then(hit => {
        const net = fetch(req).then(res => {
          if (res && res.ok) caches.open(CACHE).then(c => c.put(req, res.clone()));
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
  } else {
    // Cross-origin (Google Fonts): cache opportunistically so it works offline too.
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && (res.ok || res.type === "opaque")) {
          caches.open(CACHE).then(c => c.put(req, res.clone()));
        }
        return res;
      }).catch(() => hit))
    );
  }
});
