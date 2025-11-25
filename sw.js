const CACHE_NAME = 'iasa-app-cache-v1';
const DATA_CACHE_NAME = 'iasa-app-data-cache-v1';

// Lista de archivos estáticos para cachear en la instalación.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/comunidad.html',
  '/firebase-config.js',
  '/manifest.json',
  '/descargaLOGO.png',
  // Agrega aquí otros assets estáticos importantes (CSS, otros JS, imágenes de la UI).
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cacheando assets estáticos');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar cachés viejos que no coincidan con los nombres actuales.
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
            console.log('[Service Worker] Eliminando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // --- CORRECCIÓN ---
  // Ignorar todas las solicitudes que no sean GET.
  // Esto es crucial para que las peticiones POST de Firestore no fallen.
  if (request.method !== 'GET') {
    return; // Dejar que el navegador maneje la solicitud normalmente.
  }

  // Estrategia "Stale-While-Revalidate" para las API de Firebase Firestore.
  // Esto es lo que permite que los datos se actualicen.
  if (url.hostname === 'firestore.googleapis.com') {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return cache.match(request).then((cachedResponse) => {
          const networkFetch = fetch(request).then((networkResponse) => {
            // Si la petición a la red es exitosa, la guardamos en el caché de datos.
            // Esto actualiza el caché con los datos más recientes (incluyendo eliminaciones).
            cache.put(request, networkResponse.clone());
            return networkResponse;
          });

          // Devuelve la respuesta del caché si existe, si no, espera a la red.
          return cachedResponse || networkFetch;
        });
      })
    );
    return;
  }

  // Estrategia "Cache First" para todos los demás assets estáticos.
  event.respondWith(
    caches.match(request).then((response) => {
      // Si está en caché, lo devuelve. Si no, lo busca en la red.
      return response || fetch(request);
    })
  );
});