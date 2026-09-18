const SVR_CACHE='svr-poker-phase464-v1-runtime-fastpath';
const CORE=['/offline.html','/logo.png','/manifest.webmanifest?v=1.0.0','/game/app.html?v=1.0.0','/game/styles/app-v1.css?v=1.0.0','/game/styles/phase445-v1-release.css?v=phase445','/game/modules/app-v1.js?v=1.0.0','/game/data/tournaments-v1.json','/update/app-v1-release.json'];

self.addEventListener('install',event=>event.waitUntil(
  caches.open(SVR_CACHE)
    .then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'}))).catch(()=>undefined))
    .then(()=>self.skipWaiting())
));

self.addEventListener('activate',event=>event.waitUntil(
  caches.keys()
    .then(keys=>Promise.all(keys.filter(key=>key!==SVR_CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
));

self.addEventListener('message',event=>{
  if(event?.data?.type==='SKIP_WAITING')event.waitUntil(self.skipWaiting());
});

const alwaysFresh=url=>
  url.pathname.startsWith('/update/')
  || url.pathname.endsWith('/deploy-health.json')
  || url.pathname.endsWith('.apk');

const runtimeStatic=url=>
  url.pathname.startsWith('/game/modules/')
  || url.pathname.startsWith('/game/assets/')
  || /\.(?:js|mjs|css|json|png|jpe?g|webp|avif|svg|glb|gltf|fbx|bin|wasm|mp3|ogg|wav)$/i.test(url.pathname);

async function networkFirst(request){
  try{
    return await fetch(new Request(request,{cache:'no-store'}));
  }catch(error){
    const cached=await caches.match(request);
    if(cached)return cached;
    const offline=await caches.match('/offline.html');
    if(offline)return offline;
    throw error;
  }
}

async function cacheFirstRevalidate(event,request){
  const cache=await caches.open(SVR_CACHE);
  const cached=await cache.match(request);
  const refresh=fetch(request).then(async response=>{
    if(response && response.ok && (response.type==='basic'||response.type==='cors')){
      await cache.put(request,response.clone());
    }
    return response;
  }).catch(()=>null);

  if(cached){
    event.waitUntil(refresh);
    return cached;
  }

  const fresh=await refresh;
  if(fresh)return fresh;
  const offline=await caches.match('/offline.html');
  if(offline)return offline;
  throw new Error('SVR_RUNTIME_ASSET_UNAVAILABLE');
}

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  if(alwaysFresh(url)){
    event.respondWith(fetch(new Request(request,{cache:'no-store'})));
    return;
  }

  if(request.mode==='navigate'){
    event.respondWith(networkFirst(request));
    return;
  }

  if(runtimeStatic(url)){
    event.respondWith(cacheFirstRevalidate(event,request));
    return;
  }

  event.respondWith(caches.match(request).then(cached=>cached||networkFirst(request)));
});
