const PHASE391_PREDECESSOR='phase391-production-consolidation';
const SVR_PWA_CACHE='svr-poker-pwa-phase392-public-android-showcase-polish-v1';
const CORE=[
  '/offline.html','/logo.png','/manifest.webmanifest?v=phase392','/site-public-hooks.js?v=phase392',
  '/site/avatar.html?v=phase392','/site/profile.html?v=phase392','/site/phase383-home-restore.js?v=phase392','/site/phase392-site-polish.js?v=phase392',
  '/site/css/phase389-avatar-profile-visible-refresh.css?v=phase392',
  '/site/js/phase389-avatar-room.js?v=phase392','/site/js/phase389-profile-showroom.js?v=phase392','/site/js/phase392-avatar-pedestal-fix.js?v=phase392',
  '/game/quest.html?v=phase392','/game/index.html?platform=quest&v=phase392&direct=1&autoseat=1&questfix=1&clean=1',
  '/game/modules/phase380_original_table_authority_lock.js?v=phase392',
  '/game/modules/phase391_eric_dealer_authority.js?v=phase392',
  '/game/modules/phase390_quest_table_geometry_cards_spawn_authority.js?v=phase392',
  '/game/modules/phase390_surface_cards_final_guard.js?v=phase392',
  '/game/modules/phase390_front_spawn_final_guard.js?v=phase392',
  '/game/modules/phase391_production_runtime_audit.js?v=phase392',
  '/game/camera3-showcase.html?v=phase392','/game/modules/phase392_camera3_table_showcase.js?v=phase392',
  '/game/android.html?channel=stable&v=phase392','/game/android-tabletop.html?v=phase392','/game/android-stable.html?v=phase392',
  '/game/styles/phase392_android_gameplay.css?v=phase392','/game/modules/phase392_android_gameplay.js?v=phase392'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(SVR_PWA_CACHE).then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'}))).catch(()=>undefined)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==SVR_PWA_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(['SKIP_WAITING','PHASE391_CLEAR','PHASE392_CLEAR'].includes(event?.data?.type)){event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))).then(()=>self.skipWaiting()));}});
const fresh=url=>url.pathname==='/'||url.pathname==='/index.html'||url.pathname.startsWith('/site/')||url.pathname.startsWith('/game/')||url.pathname.startsWith('/downloads/')||url.pathname.startsWith('/update/')||url.pathname==='/manifest.webmanifest'||url.pathname==='/site-public-hooks.js'||url.pathname.endsWith('/deploy-health.json')||url.pathname.endsWith('.apk');
async function networkOnly(request){return fetch(new Request(request,{cache:'no-store',headers:request.headers}));}
async function networkFirst(request){const cache=await caches.open(SVR_PWA_CACHE);try{const response=await fetch(new Request(request,{cache:'no-store'}));if(response?.ok)cache.put(request,response.clone()).catch(()=>undefined);return response;}catch(error){const cached=await cache.match(request,{ignoreSearch:true})||await caches.match('/offline.html');if(cached)return cached;throw error;}}
async function cacheFirst(request){const cached=await caches.match(request);if(cached)return cached;const response=await fetch(request);if(response?.ok)caches.open(SVR_PWA_CACHE).then(cache=>cache.put(request,response.clone())).catch(()=>undefined);return response;}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(fresh(url)){event.respondWith(networkOnly(request));return;}if(request.mode==='navigate'){event.respondWith(networkFirst(request));return;}if(/\.(png|webp|svg|ico|css)$/i.test(url.pathname)){event.respondWith(cacheFirst(request));return;}event.respondWith(networkFirst(request));});