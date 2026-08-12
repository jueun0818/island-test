var CACHE_VERSION = "v11";
var CACHE_NAME = "castaway-cache-" + CACHE_VERSION;
var CORE_ASSETS = [
  "/",
  "/manifest.json",
  "/icons/favicon-32.png",
  "/icons/icon-180.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png"
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function(event){
  var req = event.request;
  if (req.method !== "GET") return;

  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then(function(cached){
      var network = fetch(req).then(function(response){
        if (response && response.status === 200 && response.type === "basic") {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, copy); });
        }
        return response;
      }).catch(function(){
        if (cached) return cached;
        if (req.mode === "navigate") return caches.match("/");
        return Response.error();
      });
      return cached || network;
    })
  );
});

self.addEventListener("message", function(event){
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
