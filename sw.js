// ═══════════════ پیکربندی کش ═══════════════
const CACHE_VERSION = "ahmad-kababi-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./script.js",
  "./manifest.json",
  "./banner.webp",
  "./sobhane.webp",
  "./ghaza.webp",
  "./fastfood.webp",
  "./coffi.webp",
  "./cool.webp",
  "./bastani.webp",
  "./shirini.webp"
];

// ═══════════════ نصب ═══════════════
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

// ═══════════════ فعال‌سازی ═══════════════
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ═══════════════ واکشی ═══════════════
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isDataFile = url.pathname.includes("/data/");

  // فایل‌های داده‌ی منو: شبکه اول، کش جایگزین
  if (isDataFile) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then(
            (cached) => cached || new Response("", { status: 503 })
          )
        )
    );
    return;
  }

  // سایر منابع: کش اول، شبکه جایگزین
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (isSameOrigin && response.ok) {
            const copy = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => {
          if (request.mode === "navigate") return caches.match("./index.html");
          return new Response("", { status: 503 });
        });
    })
  );
});
