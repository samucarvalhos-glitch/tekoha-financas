const CACHE='tekoha-v1-19-cortesias-1';
const ASSETS=['/','/index.html','/manifest.webmanifest','/icons/icon.png','/style-reference.css','/icons/icon-192.png','/icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('tekoha-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.origin!==location.origin||e.request.method!=='GET'||url.pathname.startsWith('/api/'))return;
  if(e.request.mode==='navigate'){
    e.respondWith(fetch(e.request).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE).then(c=>c.put('/index.html',clone));}return response;}).catch(()=>caches.match('/index.html')));return;
  }
  e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));
});
