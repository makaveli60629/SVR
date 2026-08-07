const SVR_CACHE='svr-poker-phase395-quest-browser-table-gameplay-v1';
const CORE=[
  '/offline.html','/logo.png','/manifest.webmanifest?v=phase395','/site-public-hooks.js?v=phase395','/launch-quest.css?v=phase395',
  '/game/quest.html?v=phase395','/game/index.html?platform=quest&v=phase395&direct=1&autoseat=1&questfix=1&clean=1',
  '/game/modules/phase395_quest_browser_table_gameplay_fix.js?v=phase395','/game/modules/phase395_quest_eric_floor_guard.js?v=phase395','/game/modules/phase393_quest_table_eric_seat_calibration.js?v=phase395',
  '/game/android.html?channel=stable&v=phase394','/game/android-tabletop.html?v=phase394','/game/android-stable.html?v=phase394',
  '/game/styles/phase393_android_table_layout.css?v=phase393','/game/styles/phase394_android_table_polish.css?v=phase394','/game/modules/phase393_android_common.js?v=phase393','/game/modules/phase393_android_evaluator.js?v=phase393','/game/modules/phase393_android_gameplay.js?v=phase393','/game/modules/phase394_android_table_polish.js?v=phase394',
  '/game/camera3-showcase.html?v=phase392','/site/avatar.html?v=phase392','/site/profile.html?v=phase392'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(SVR_CACHE).then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'}))).catch(()=>undefined)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==SVR_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(['SKIP_WAITING','PHASE391_CLEAR','PHASE392_CLEAR','PHASE393_CLEAR','PHASE394_CLEAR','PHASE395_CLEAR'].includes(event?.data?.type)){event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))).then(()=>self.skipWaiting()))}});
const fresh=url=>url.pathname==='/'||url.pathname==='/index.html'||url.pathname.startsWith('/site/')||url.pathname.startsWith('/game/')||url.pathname.startsWith('/downloads/')||url.pathname.startsWith('/update/')||url.pathname==='/manifest.webmanifest'||url.pathname==='/site-public-hooks.js'||url.pathname==='/launch-quest.css'||url.pathname.endsWith('/deploy-health.json')||url.pathname.endsWith('.apk');
async function networkOnly(request){return fetch(new Request(request,{cache:'no-store',headers:request.headers}))}
async function networkFirst(request){try{return await fetch(new Request(request,{cache:'no-store'}))}catch(error){const cached=await caches.match(request,{ignoreSearch:true})||await caches.match('/offline.html');if(cached)return cached;throw error}}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(fresh(url)){event.respondWith(networkOnly(request));return}if(request.mode==='navigate'){event.respondWith(networkFirst(request));return}event.respondWith(caches.match(request).then(cached=>cached||networkFirst(request)))});
