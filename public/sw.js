const CACHE_NAME = 'talent-mind-v2';
// Next.js sert ses assets sous /_next/static/ avec des noms hashés générés au build —
// pas de chemins statiques prévisibles type CRA (bundle.js/main.css) à précacher ici.
// '/' est exclu : next-intl (localePrefix "always") le redirige TOUJOURS vers /fr, et un
// navigateur refuse de servir une réponse mise en cache issue d'une redirection pour une
// navigation (net::ERR_FAILED) — le précacher est à la fois inutile et cassant.
const urlsToCache = [
  '/manifest.json'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // addAll() échoue en bloc si UNE seule URL échoue — on précache donc chaque
        // URL individuellement pour qu'une ressource manquante ne casse pas l'install.
        return Promise.all(
          urlsToCache.map((url) => cache.add(url).catch(() => {}))
        );
      })
      .then(() => self.skipWaiting()) // active la nouvelle version sans attendre la fermeture des onglets
  );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName); // purge les caches des versions précédentes (ex: v1, avec sa réponse "/" redirigée cassée)
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interception des requêtes — network-first pour les navigations (jamais de page HTML
// périmée/redirigée servie depuis le cache), cache-first pour le reste.
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Retourner la réponse du cache si elle existe
        if (response) {
          return response;
        }
        // Sinon, faire la requête réseau
        return fetch(event.request);
      }
    )
  );
});