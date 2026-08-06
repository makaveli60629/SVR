const PHASE388_PREDECESSOR='phase388-quest-table-player-eric';
const SVR_CACHE='svr-poker-phase389-full-audit-visible-fixes-v1';
const CORE=[
  '/offline.html','/logo.png','/manifest.webmanifest?v=phase389','/site-public-hooks.js?v=phase389',
  '/site/avatar.html?v=phase389','/site/profile.html?v=phase389',
  '/site/css/phase389-avatar-profile-visible-refresh.css?v=phase389',
  '/site/js/phase389-avatar-room.js?v=phase389','/site/js/phase389-profile-showroom.js?v=phase389',
  '/game/quest.html?v=phase389','/game/index.html?platform=quest&v=phase389&direct=1&autoseat=1&questfix=1&clean=1',
  '/game/modules/phase388_quest_table_player_eric_authority.js?v=phase389',
  '/game/modules/phase388_quest_view_dealer_guard.js?v=phase389',
  '/game/modules/phase388_table_material_visibility_guard.js?v=phase389',
  '/game/modules/phase389_runtime_health_visibility.js?v=phase389',
  '/game/android-tabletop.html?v=phase389','/game/styles/phase385_android_tabletop.css?v=phase389',
  '/game/styles/phase389_android_responsive_layout.css?v=phase389',
  '/game/modules/phase385_android_tabletop_3d.js?v=phase389','/game/modules/phase389_android_responsive_layout.js?v=phase389'
];
self.addEventListener('install',event=>event.waitUntil(caches.open(SVR_CACHE).then(cache=>cache.addAll(CORE.map(url=>new Request(url,{cache:'reload'}))).catch(()=>undefined)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==SVR_CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('message',event=>{if(['SKIP_WAITING','PHASE388_CLEAR','PHASE389_CLEAR'].includes(event?.data?.type)){event.waitUntil(caches.keys().then(keys=>Promise.all(keys.map(key=>caches.delete(key)))).then(()=>self.skipWaiting()));}});
const fresh=url=>url.pathname==='/'||url.pathname==='/index.html'||url.pathname.startsWith('/site/')||url.pathname.startsWith('/game/')||url.pathname.startsWith('/downloads/')||url.pathname.startsWith('/update/')||url.pathname==='/manifest.webmanifest'||url.pathname==='/site-public-hooks.js'||url.pathname.endsWith('/deploy-health.json')||url.pathname.endsWith('.apk');
async function networkOnly(request){return fetch(new Request(request,{cache:'no-store',headers:request.headers}));}
async function networkFirst(request){try{return await fetch(new Request(request,{cache:'no-store'}));}catch(error){const cached=await caches.match(request,{ignoreSearch:true})||await caches.match('/offline.html');if(cached)return cached;throw error;}}
self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;if(fresh(url)){event.respondWith(networkOnly(request));return;}if(request.mode==='navigate'){event.respondWith(networkFirst(request));return;}event.respondWith(caches.match(request).then(cached=>cached||networkFirst(request)));});
