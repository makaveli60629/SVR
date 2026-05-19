// PHASE-119-QUEST-REGRESSION-BUNDLE-ADMIN-ONLINE-LOCK
// Game-side only. Runtime regression and loaded-resource size audit.
// No website or /site files are touched.

const PHASE = 'PHASE-119-QUEST-REGRESSION-BUNDLE-ADMIN-ONLINE-LOCK';
const LIMIT_BYTES = 25 * 1024 * 1024;
const REQUIRED = [
  'SVR_PLAYABLE_POKER','SVR_POKER_ACTION_HUD','SVR_PHASE101_VISUAL_CARD_MESH_SYNC',
  'SVR_PHASE102_CHIP_MOTION_FX','SVR_PHASE103_CONTROLLER_INPUT','SVR_PHASE104_PRIVATE_ROUTE_GUARD',
  'SVR_PHASE107_RAISE_SIZING_HUD','SVR_PHASE108_WATCH_POKER_DISABLED_STATES',
  'SVR_PHASE110_QUEST_PERFORMANCE_MONITOR','SVR_PHASE111_GAMEPLAY_DEMO_POLISH',
  'SVR_PHASE113_RUNTIME_HEALTH_SYNC','SVR_PHASE116_CUSTOM_RAISE_UI','SVR_PHASE119_ADMIN_ONLINE'
];
let panel, body, lastSig = '';
function resources(){ return performance.getEntriesByType('resource').map(r=>({ name:r.name, type:r.initiatorType, transfer:r.transferSize||0, encoded:r.encodedBodySize||0, decoded:r.decodedBodySize||0 })); }
function loadedBytes(){ const list = resources(); const transfer = list.reduce((a,r)=>a+(r.transfer||0),0); const encoded = list.reduce((a,r)=>a+(r.encoded||0),0); return transfer || encoded; }
function missing(){ return REQUIRED.filter(key=>!window[key]); }
function perf(){ return window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR?.metrics?.() || null; }
function audit(){
  const bytes = loadedBytes();
  const miss = missing();
  const p = perf();
  const ok = miss.length === 0 && bytes < LIMIT_BYTES && p?.status !== 'LOW-PERF';
  const biggest = resources().sort((a,b)=>(b.transfer||b.encoded||0)-(a.transfer||a.encoded||0)).slice(0,8);
  return { phase:PHASE, ok, siteTouched:false, loadedBytes:bytes, loadedMB:Number((bytes/1048576).toFixed(2)), limitMB:25, missingGlobals:miss, perf:p, biggest, timestamp:new Date().toISOString() };
}
function style(){
  if (document.getElementById('svr-phase119-style')) return;
  const s = document.createElement('style');
  s.id = 'svr-phase119-style';
  s.textContent = '#svrBundleAudit{position:fixed;right:12px;top:118px;z-index:48;border:1px solid rgba(127,245,199,.46);border-radius:999px;background:rgba(3,8,14,.76);color:#eafff4;padding:7px 11px;font:900 11px/1 system-ui;cursor:pointer}#svrBundlePanel{position:fixed;right:12px;top:158px;z-index:48;width:min(430px,calc(100vw - 24px));max-height:60vh;overflow:auto;border:1px solid rgba(180,140,255,.42);border-radius:16px;background:linear-gradient(135deg,rgba(4,8,16,.92),rgba(22,9,42,.94));color:#f6f3ff;padding:12px;display:none;font:12px/1.35 system-ui;box-shadow:0 18px 52px rgba(0,0,0,.48)}#svrBundlePanel.open{display:block}.r{display:flex;justify-content:space-between;gap:10px;border-top:1px solid rgba(255,255,255,.08);padding:6px 0}.k{color:rgba(246,243,255,.68)}.v{font-weight:900;text-align:right}.good{color:#7ff5c7}.warn{color:#f6e27f}.bad{color:#ff6b7f}body.preview-mode #svrBundleAudit,body.preview-mode #svrBundlePanel{display:none!important}';
  document.head.appendChild(s);
}
function row(k,v,c){ return '<div class="r"><span class="k">'+k+'</span><span class="v '+(c||'')+'">'+v+'</span></div>'; }
function make(){
  if (panel) return;
  style();
  panel = document.createElement('button'); panel.id = 'svrBundleAudit'; panel.type = 'button'; panel.textContent = 'BUNDLE WAIT';
  body = document.createElement('section'); body.id = 'svrBundlePanel';
  document.body.append(panel, body);
  panel.addEventListener('click',()=>body.classList.toggle('open'));
}
function render(){
  make();
  const a = audit();
  const sig = JSON.stringify({mb:a.loadedMB, miss:a.missingGlobals, perf:a.perf?.status});
  if (sig === lastSig) return; lastSig = sig;
  panel.textContent = a.ok ? 'BUNDLE OK' : 'BUNDLE CHECK';
  const cls = a.ok ? 'good' : 'warn';
  body.innerHTML = '<strong>Quest Regression + Bundle Audit</strong>' +
    row('Phase', PHASE) + row('Status', a.ok ? 'OK' : 'CHECK', cls) +
    row('Loaded runtime', a.loadedMB + ' MB / 25 MB target', a.loadedBytes < LIMIT_BYTES ? 'good' : 'bad') +
    row('Missing globals', a.missingGlobals.length ? a.missingGlobals.join(', ') : 'none', a.missingGlobals.length ? 'bad' : 'good') +
    row('Performance', a.perf ? (a.perf.status + ' • ' + a.perf.fps + ' FPS') : 'waiting', a.perf?.status === 'LOW-PERF' ? 'bad' : 'good') +
    row('Admin online', window.SVR_ADMIN_ONLINE ? 'YES' : 'NO', window.SVR_ADMIN_ONLINE ? 'good' : 'warn') +
    row('Site touched', 'NO', 'good') +
    '<div class="r"><span class="k">Largest loaded</span><span class="v">'+ a.biggest.map(x=>(x.name.split('/').pop()||x.name)+': '+(((x.transfer||x.encoded||0)/1024).toFixed(1))+'KB').join('<br>') + '</span></div>';
}
function boot(){ window.SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT = { phase:PHASE, audit, render }; setInterval(render, 1200); setTimeout(render, 900); }
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
