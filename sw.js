const CACHE="minha-agenda-v2";

const FILES=[
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json"
];

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(FILES))
  );
});

self.addEventListener("fetch",event=>{
  event.respondWith(
    caches.match(event.request).then(cached=>{
      return cached || fetch(event.request);
    })
  );
});
