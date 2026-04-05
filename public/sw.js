/**
 * Service Worker — Mundo Muebles Popayán PWA
 * Estrategia: Cache First para assets, Network First para datos
 */
const CACHE_NAME = "mundo-muebles-v8";
const STATIC_ASSETS = [
  "/",
  "/index.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Solo manejar peticiones GET
  if (event.request.method !== "GET") return;
  
  // Ignorar extensiones del navegador y peticiones externas
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.url.includes("fonts.googleapis.com")) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request)
        .then((response) => {
          // Cachear respuestas exitosas de assets estáticos
          if (response.ok && (
            event.request.url.includes("/assets/") ||
            event.request.url.endsWith(".js") ||
            event.request.url.endsWith(".css")
          )) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      
      // Cache first para assets, network first para páginas
      return event.request.url.includes("/assets/") ? (cached || networkFetch) : networkFetch;
    })
  );
});

// Manejo de push notifications (base para implementación futura con FCM)
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  const options = {
    body:    data.body    || "Notificación de Mundo Muebles",
    icon:    "/icon-192.png",
    badge:   "/icon-192.png",
    vibrate: [100, 50, 100],
    data:    { url: data.url || "/" },
  };
  event.waitUntil(
    self.registration.showNotification(data.title || "Mundo Muebles", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || "/")
  );
});
