const CACHE_NAME = 'iasa-app-cache-v1';
const DATA_CACHE_NAME = 'iasa-app-data-cache-v1';

// Lista de archivos estáticos para cachear en la instalación.
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/comunidad.html',
  '/styles.css',
  '/firebase-config.js',
  '/firebase.js',
  '/manifest.json',
  '/descargaLOGO.jpg',
  '/logo1.png',
  '/logo2.png',
  '/logoservice.png',
  '/iconos/calendario.png'
  // Agrega aquí otros assets estáticos importantes (CSS, otros JS, imágenes de la UI).
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  // Cachear archivos uno por uno para evitar que un 404 bloquee la instalación
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('[Service Worker] Cacheando assets estáticos (safe add)');
      try {
        await Promise.all(STATIC_ASSETS.map(async (p) => {
          try {
            const resp = await fetch(p, { cache: 'no-cache' });
            if (resp && resp.ok) await cache.put(p, resp.clone());
          } catch (e) {
            // no hacer fallar toda la instalación por un archivo faltante
            console.warn('[Service Worker] No se pudo cachear', p, e && e.message);
          }
        }));
      } catch (e) {
        console.warn('[Service Worker] Error genérico cache add:', e && e.message);
      }
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

  // --- Navegación (páginas HTML) : network-first con fallback offline ---
  const acceptsHtml = request.headers.get('accept') && request.headers.get('accept').includes('text/html');
  if (request.mode === 'navigate' || acceptsHtml) {
    event.respondWith(
      fetch(request)
        .then(networkResponse => {
          // Almacenar una copia de la página en caché para la próxima vez
          caches.open(CACHE_NAME).then(cache => {
            try { cache.put(request, networkResponse.clone()); } catch (e) { /* ignore */ }
          });
          return networkResponse;
        })
        .catch(() => {
          // Si no hay red, devolver la página de fallback cached
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // Estrategia "Cache First" para otros assets estáticos (imagenes, css, js)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((networkResp) => {
          // Opcional: cachear respuestas exitosas para futuras peticiones
          if (networkResp && networkResp.ok && request.method === 'GET') {
            caches.open(CACHE_NAME).then(cache => {
              try { cache.put(request, networkResp.clone()); } catch (e) { /* ignore */ }
            });
          }
          return networkResp;
        })
        .catch(() => {
          // Si no hay cache ni red para recursos críticos, devolvemos offline fallback para HTML
          if (request.destination === 'document' || acceptsHtml) return caches.match('/offline.html');
          return new Response(null, { status: 504, statusText: 'Gateway Timeout' });
        });
    })
  );
});

// Escucha mensajes desde los clientes para purgar entradas del caché
self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (!data || !data.action) return;

  if (data.action === 'purge-cache') {
    const urls = Array.isArray(data.urls) ? data.urls.filter(Boolean) : [];
    const purgeFirestore = !!data.purgeFirestore;

    // Borrar URLs específicas de todos los caches abiertos
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.open(cacheName).then((cache) => {
            // Primero borrar las URLs solicitadas
            const deletes = urls.map(u => cache.delete(u, { ignoreSearch: true }));

            // Si se pidió purgar Firestore, borrar entradas que apunten a firestore.googleapis.com
            let purgeFirestorePromise = Promise.resolve();
            if (purgeFirestore) {
              purgeFirestorePromise = cache.keys().then((requests) => {
                return Promise.all(requests.map((req) => {
                  try {
                    if (req.url && req.url.includes('firestore.googleapis.com')) {
                      return cache.delete(req);
                    }
                  } catch (e) { /* ignore */ }
                  return Promise.resolve(false);
                }));
              });
            }

            return Promise.all([Promise.all(deletes), purgeFirestorePromise]);
          });
        })
      );
    }).then(() => {
      console.log('[Service Worker] Caché purgado (mensaje client).', { urls, purgeFirestore });
    }).catch((err) => {
      console.warn('[Service Worker] Error purgando caché:', err);
    });
  }
});