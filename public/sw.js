const CACHE_NAME = "museek-v2";
const urlsToCache = [
  "/",
  "/login",
  "/library",
  "/search",
  "/manifest.json",
  "/uploads/22a6a2b0-7bdf-4eb5-9308-9b278edef5a4.png",
];

// Install event
self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Opened cache");
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.log("Cache add failed:", error);
      })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log("Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Helper function to check if URL is cacheable
const isCacheableRequest = (request) => {
  const url = new URL(request.url);
  // Don't cache chrome-extension, moz-extension, or other browser extension URLs
  if (
    url.protocol === "chrome-extension:" ||
    url.protocol === "moz-extension:" ||
    url.protocol === "safari-extension:"
  ) {
    return false;
  }
  // Don't cache data: URLs
  if (url.protocol === "data:") {
    return false;
  }
  return true;
};

// Fetch event
self.addEventListener("fetch", (event) => {
  // Skip non-cacheable requests
  if (!isCacheableRequest(event.request)) {
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          // Only cache if the request is cacheable
          if (isCacheableRequest(event.request)) {
            const responseToCache = response.clone();

            caches
              .open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch((error) => {
                console.log("Failed to cache request:", error);
              });
          }

          return response;
        });
      })
      .catch(() => {
        if (event.request.destination === "document") {
          return caches.match("/");
        }
      })
  );
});

// Background sync for when connection is restored
self.addEventListener("sync", (event) => {
  console.log("Background sync triggered");
});

// Push notification handling
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New music available!",
    icon: "/uploads/22a6a2b0-7bdf-4eb5-9308-9b278edef5a4.png",
    badge: "/uploads/22a6a2b0-7bdf-4eb5-9308-9b278edef5a4.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: "explore",
        title: "Listen Now",
        icon: "/uploads/22a6a2b0-7bdf-4eb5-9308-9b278edef5a4.png",
      },
      {
        action: "close",
        title: "Close",
        icon: "/uploads/22a6a2b0-7bdf-4eb5-9308-9b278edef5a4.png",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification("Museek", options));
});
