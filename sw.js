const PHASE390_PREDECESSOR='phase390-table-geometry-cards-spawn';
const SVR_CACHE='svr-poker-phase391-production-consolidation-v1';
const CORE=[
  '/offline.html','/logo.png','/manifest.webmanifest?v=phase391','/site-public-hooks.js?v=phase391',
  '/site/avatar.html?v=phase389','/site/profile.html?v=phase389','/site/phase383-home-restore.js?v=phase391',
  '/site/css/phase389-avatar-profile-visible-refresh.css?v=phase389',
  '/site/js/phase389-avatar-room.js?v=phase389','/site/js/phase389-profile-showroom.js?v=phase389',
  '/game/quest.html?v=phase391','/game/index.html?platform=quest&v=phase391&direct=1&autoseat=1&questfix=1&clean=1',
  '/game/modules/phase380_original_table_authority_lock.js?v=phase391',
  '/game/modules/phase389_runtime_health_visibility.js?v=phase391',
  '/game/modules/phase391_eric_dealer_authority.js?v=phase391',
  '/game/modules/phase390_quest_table_geometry_cards_spawn_authority.js?v=phase391',
  '/game/modules/phase390_surface_cards_final_guard.js?v=phase391',
  '/game/modules/phase390_front_spawn_final_guard.js?v=phase391',
  '/game/modules/phase391_production_runtime_audit.js?v=phase391',
  '/game/camera3-live.html?v=phase391','/game/modules/phase389_camera3_live_preview.js?v=phase391',
  '/game/android.html?channel=stable&v=phase391','/game/android-tabletop.html?v=phase391','/game/android-stable.html?v=phase391',
  '/game/styles/phase385_android_tabletop.css?v=phase391','/game/styles/phase389_android_responsive_layout.css?v=phase391',
  '/game/modules/phase385_android_tabletop_3d.js?v=phase391','/game/modules/phase389_android_responsive_layout.js?v=phase391'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(SVR_CACHE).then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'}))).catch(()=>undefined)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==SVR_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(['SKIP_WAITING','PHASE388_CLEAR','PHASE389_CLEAR','PHASE390_CLEAR','PHASE391_CLEAR'].includes(event?.data?.type)){event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))).then(()=>self.skipWaiting()));}});
const fresh=url=>url.pathname==='/'||url.pathname==='/index.html'||url.pathname.startsWith('/site/')||url.pathname.startsWith('/game/')||url.pathname.startsWith('/downloads/')||url.pathname.startsWith('/update/')||url.pathname==='/manifest.webmanifest'||url.pathname==='/site-public-hooks.js'||url.pathname.endsWith('/deploy-health.json')||url.pathname.endsWith('.apk');
async function networkOnly(request){return fetch(new Request(request,{cache:'no-store',headers:request.headers}));}
async function networkFirst(request){try{return await fetch(new Request(request,{cache:'no-store'}));}catch(error){const cached=await caches.match(request,{ignoreSearch:true})||await caches.match('/offline.html');if(cached)return cached;throw error;}}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(fresh(url)){event.respondWith(networkOnly(request));return;}if(request.mode==='navigate'){event.respondWith(networkFirst(request));return;}event.respondWith(caches.match(request).then(cached=>cached||networkFirst(request)));});
