// cache version variable
const version = 'restaurantCache-v1';
// staticAssetsCache is a cache for all static assets such as CSS, JS, images, etc.
const staticAssetsCache = version + 'staticassets';
// Static assets to be cached
const cachedAssets = [
  '/',
  '/index.html',
  '/restaurant.html',
  '/manifest.json',
  '/css/reset.css',
  '/css/styles.css',
  '/js/main.js',
  '/js/dbhelper.js',
  '/js/restaurant_info.js',
  '/js/idb.js'
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
    caches.match(request, {ignoreSearch: true})
    .then( responseFromCache => {
      if (responseFromCache) {
        return responseFromCache;
      }
      return fetch(request);
      // Can also add the requests in the cache dynamically here. Link to learn: https://developers.google.com/web/ilt/pwa/caching-files-with-service-worker
      // Thank you for the feedback. I will look into this further.
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
