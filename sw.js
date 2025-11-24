const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
  '/', // Para la ruta raíz
  '/index.html',
  '/comunidad.html',
  '/firebase-config.js',
  '/firebase.js',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Evento de instalación: se abre el caché y se guardan los archivos del app-shell.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
  );
});

// Evento de activación: se limpia el caché antiguo si existe una nueva versión.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Evento fetch: intercepta las peticiones de red.
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Estrategia "Cache First" para recursos locales y fuentes de Google.
  // Ideal para archivos que no cambian a menudo.
  if (
    urlsToCache.includes(requestUrl.pathname) ||
    requestUrl.origin === 'https://fonts.googleapis.com' ||
    requestUrl.origin === 'https://fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Si está en caché, lo devuelve. Si no, va a la red.
          return response || fetch(event.request).then(fetchResponse => {
            // Opcional: guardar en caché la nueva respuesta para futuras peticiones
            return caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, fetchResponse.clone());
              return fetchResponse;
            });
          });
        })
    );
    return;
  }

  // Estrategia "Network First" para las APIs de Firebase y las imágenes.
  // Intenta obtener la versión más reciente de la red, y si falla, usa el caché.
  if (requestUrl.href.includes('firebase') || requestUrl.href.includes('firebasestorage')) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        return caches.open('dynamic-cache').then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => caches.match(event.request)) // Si la red falla, busca en caché.
    );
    return;
  }

  // Para cualquier otra petición, simplemente se ejecuta la petición de red.
  event.respondWith(fetch(event.request));
});