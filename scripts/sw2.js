

const CACHE_NAME = 'float-up-cache-v1.3';

// Credits:
// The following code is primarily derived from:
// https://www.pwabuilder.com/serviceworker
// "Offline copy of pages"

//Install stage sets up the index page (home page) in the cache and opens a new cache
self.addEventListener('install', function(event) {
  var indexPage = new Request('index.html');
  event.waitUntil(
    fetch(indexPage).then(function(response) {
      return caches.open(CACHE_NAME).then(function(cache) {
        console.log('opened cache'+ response.url);
        return cache.put(indexPage, response);
      });
  }));
});


//If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener('fetch', function(event) {
  var updateCache = function(request){
    return caches.open(CACHE_NAME).then(function (cache) {
      return fetch(request).then(function (response) {
        console.log('add page to offline cache'+response.url)
        return cache.put(request, response);
      });
    });
  };
  event.waitUntil(updateCache(event.request));
  //Check to see if you have it in the cache
  //Return response
  //If not in the cache, then return error page
  event.respondWith(
   fetch(event.request).catch(function(error) {
     console.log( 'Network request Failed. Serving content from cache: ' + error );
     return caches.open(CACHE_NAME).then(function (cache) {
        return cache.match(event.request).then(function (matching) {
          var report =  !matching || matching.status == 404?Promise.reject('no-match'): matching;
          return report
        });
      });
    })
  );
})
