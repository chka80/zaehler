// Service Worker: macht die App offline nutzbar.
// Bei Änderungen an der App die Versionsnummer erhöhen, damit Handys die neue Version laden.
const CACHE = "rauchfrei-v3g";
const FILES = [
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", e => {
  // Dateien einzeln speichern, damit eine fehlende Datei nicht alles blockiert
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FILES.map(f => c.add(f).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Erst aus dem Netz laden (damit Updates ankommen), offline aus dem Cache.
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    // "no-cache": immer beim Server nachfragen, ob es eine neue Version gibt (nicht den Browser-Zwischenspeicher nutzen)
    fetch(e.request, { cache: "no-cache" })
      .then(res => {
        if (res.ok && new URL(e.request.url).origin === location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("./index.html")))
  );
});
