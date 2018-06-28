// cache version variable
const version = 'v1';
// staticAssetsCache is a cache for all static assets such as CSS, JS, images, etc.
const staticAssetsCache = version + 'staticassets';
// Static assets to be cached
const cachedAssets = [
  '/',
  '/restaurant.html',
  '/css/reset.css',
  '/css/styles.css',
  '/data/restaurants.json',
  '/js/main.js',
  '/js/restaurant_info.js'
];

// Installs cache for static assets
self.addEventListener('install', installEvent => {
  skipWaiting();
  installEvent.waitUntil(
    caches.open(staticAssetsCache)
    .then( staticCache => {
      return staticCache.addAll(cachedAssets);
    })
  );
});

// Code that runs everytime the browser requests a file from the site
self.addEventListener('fetch', fetchEvent => {
  const request = fetchEvent.request;
  fetchEvent.respondWith(
    caches.match(request)
    .then( responseFromCache => {
      if (responseFromCache) {
        return responseFromCache;
      }
      return fetch(request);
    })
  );
});

self.addEventListener('activate', activateEvent => {
  activateEvent.waitUntil(
    caches.keys()
    .then( cachedAssets => {
      return Promise.all(
        cachedAssets.map( cachedAsset => {
          if (cachedAsset != staticAssetsCache) {
            return caches.delete(cachedAsset);
          }
        })
      );
    })
    .then( () => {
      return clients.claim();
    })
  );
});
