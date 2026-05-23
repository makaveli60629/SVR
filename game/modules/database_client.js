// PHASE-102-AWS-SMART-DATA-BRIDGE-LOCK
// Browser-side API client for SVR Poker.
// Public/game clients never store database passwords, payment secrets, admin secrets, or private service keys.
// This module only talks to the secure SVR backend API at https://api.svrpoker.com unless overridden for local testing.

const DEFAULT_TIMEOUT_MS = 3800;
const SAFE_STORAGE_KEY = 'SVR_API_BASE_URL';
const BUILD_PHASE = 'PHASE-102-AWS-SMART-DATA-BRIDGE-LOCK';
const DEFAULT_API_BASE = 'https://api.svrpoker.com';

const FALLBACK = {
  profile: { name:'SVR Guest Member', tier:'Preview VIP', chips:25000, room:'Lobby', status:'Ready' },
  rooms: [
    { key:'scorpion', title:'Scorpion Room', route:'./scorpion.html', access:'development' },
    { key:'reiki', title:'Reiki Room', route:'./reiki.html', access:'approval-lock' },
    { key:'pga-drive', title:'PGA Drive', route:'./pga-drive.html', access:'development' },
    { key:'chip-putt', title:'Chip/Putt', route:'./chip-putt.html', access:'development' },
    { key:'store-room', title:'VR Store Room', route:'./store-room.html', access:'development' },
    { key:'smoker-lounge', title:'Smoker Lounge', route:'./smoker-lounge.html', access:'development' }
  ],
  ads: [
    { key:'espresso', title:'Espresso With Cream', placement:'Reiki building / wall banner', status:'active' },
    { key:'svr-store', title:'SVR Store', placement:'Store portal', status:'preview' },
    { key:'impact', title:'Community Impact', placement:'Site and lobby panels', status:'preview' }
  ],
  store: [
    { sku:'watch-skin', title:'SVR Watch Skin', status:'preview' },
    { sku:'table-theme', title:'Neon Table Theme', status:'preview' },
    { sku:'ad-badge', title:'Sponsor Ad Badge', status:'preview' }
  ],
  manifest: { phase: BUILD_PHASE, platform:'aws-ready', publicCopy:'professional', secrets:'never-in-browser' }
};

function cleanBaseUrl(value){ return String(value || '').trim().replace(/\/+$/, ''); }
function safeLocalStorageGet(key){ try { return localStorage.getItem(key); } catch (_) { return null; } }
function safeLocalStorageSet(key, value){ try { value ? localStorage.setItem(key, value) : localStorage.removeItem(key); } catch (_) {} }
function getConfiguredBaseUrl(){
  const params = new URLSearchParams(window.location.search || '');
  return cleanBaseUrl(params.get('api')) || cleanBaseUrl(window.SVR_API_BASE || window.SVR_API_BASE_URL) || cleanBaseUrl(safeLocalStorageGet(SAFE_STORAGE_KEY)) || DEFAULT_API_BASE;
}
async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal, cache:'no-store' }); }
  finally { clearTimeout(timer); }
}
function queueOfflineEvent(event){
  try { const key='SVR_OFFLINE_EVENTS'; const old=JSON.parse(localStorage.getItem(key)||'[]'); old.push({ ...event, queuedAt:new Date().toISOString() }); localStorage.setItem(key, JSON.stringify(old.slice(-160))); } catch (_) {}
}
function mergeFallback(value, fallback){
  if (Array.isArray(fallback)) return Array.isArray(value) && value.length ? value : fallback;
  if (fallback && typeof fallback === 'object') return value && typeof value === 'object' ? { ...fallback, ...value } : fallback;
  return value ?? fallback;
}

export function createDatabaseClient({ log = console.log, statusCb = () => {} } = {}){
  let apiBase = getConfiguredBaseUrl();
  const state = { phase: BUILD_PHASE, configured:Boolean(apiBase), apiBasePublic:apiBase ? apiBase.replace(/^https?:\/\//,'') : '', provider:'secure-api', status: apiBase ? 'checking' : 'safe-local-mode', database:'unknown', siteBridge:'ready', lastHealthAt:null, lastError:null };
  function publish(next = {}){ Object.assign(state,next); window.SVR_DATABASE_STATE={...state}; statusCb({...state}); return {...state}; }
  function setApiBase(url){ apiBase = cleanBaseUrl(url) || DEFAULT_API_BASE; safeLocalStorageSet(SAFE_STORAGE_KEY, apiBase === DEFAULT_API_BASE ? '' : apiBase); return publish({ configured:Boolean(apiBase), apiBasePublic:apiBase.replace(/^https?:\/\//,''), status:apiBase?'configured':'safe-local-mode' }); }
  async function health(){
    if(!apiBase) return publish({ configured:false, status:'safe-local-mode', database:'fallback-ready', lastHealthAt:new Date().toISOString(), lastError:null });
    try { const res=await fetchWithTimeout(`${apiBase}/api/health`); const data=await res.json().catch(()=>({})); const ok=Boolean(data.ok===true||data.status==='ok'); return publish({ configured:true, status:ok?'online':'api-error', database:data.database || (ok?'connected-or-ready':'fallback-ready'), lastHealthAt:new Date().toISOString(), lastError:ok?null:(data.error||data.message||`HTTP ${res.status}`) }); }
    catch(error){ log('[SVR API] health check failed', error?.message || error); return publish({ configured:true, status:'offline-fallback', database:'fallback-ready', lastHealthAt:new Date().toISOString(), lastError:error?.message || String(error) }); }
  }
  async function postGameEvent(type, payload = {}){
    const event={ type, payload, phase:BUILD_PHASE, at:new Date().toISOString(), path:location.pathname, ua:navigator.userAgent, source:'game' };
    if(!apiBase){ queueOfflineEvent(event); return { ok:false, queued:true, reason:'api-not-configured' }; }
    try { const res=await fetchWithTimeout(`${apiBase}/api/game/events`, { method:'POST', headers:{'Content-Type':'application/json','Accept':'application/json'}, body:JSON.stringify(event) }, 2600); if(!res.ok) throw new Error(`HTTP ${res.status}`); return await res.json().catch(()=>({ok:true})); }
    catch(error){ queueOfflineEvent(event); return { ok:false, queued:true, error:error?.message || String(error) }; }
  }
  async function getPublicPayload(path, fallback = null){
    if(!apiBase) return fallback;
    try { const res=await fetchWithTimeout(`${apiBase}${path}`, { headers:{Accept:'application/json'} }); if(!res.ok) throw new Error(`HTTP ${res.status}`); return mergeFallback(await res.json(), fallback); }
    catch(error){ log('[SVR API] public payload failed', path, error?.message || error); return fallback; }
  }
  const client={
    getState:()=>({...state}), setApiBase, health, postGameEvent,
    getProfile:()=>getPublicPayload('/api/game/player/profile', FALLBACK.profile),
    getRooms:()=>getPublicPayload('/api/game/rooms', FALLBACK.rooms),
    getAds:()=>getPublicPayload('/api/ads', FALLBACK.ads),
    getStore:()=>getPublicPayload('/api/store/products', FALLBACK.store),
    getManifest:()=>getPublicPayload('/api/public/manifest', FALLBACK.manifest),
    fallback:()=>JSON.parse(JSON.stringify(FALLBACK))
  };
  window.SVR_DATABASE_CLIENT=client;
  window.SVR_PUBLIC_DATA_FALLBACK=FALLBACK;
  publish();
  return client;
}
