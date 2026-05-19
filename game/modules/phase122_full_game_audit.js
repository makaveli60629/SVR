// PHASE-122-FULL-GAME-AUDIT-RUNTIME-SYNC-LOCK
// Game-side only. Full current-stack audit/sync after Phase 121.
// No website, public page, or /site files are touched.

const PHASE = 'PHASE-122-FULL-GAME-AUDIT-RUNTIME-SYNC-LOCK';
const REQUIRED = [
  'SVR_PLAYABLE_POKER',
  'SVR_POKER_ACTION_HUD',
  'SVR_PHASE101_VISUAL_CARD_MESH_SYNC',
  'SVR_PHASE102_CHIP_MOTION_FX',
  'SVR_PHASE103_CONTROLLER_INPUT',
  'SVR_PHASE104_PRIVATE_ROUTE_GUARD',
  'SVR_PHASE107_RAISE_SIZING_HUD',
  'SVR_PHASE108_WATCH_POKER_DISABLED_STATES',
  'SVR_PHASE110_QUEST_PERFORMANCE_MONITOR',
  'SVR_PHASE111_GAMEPLAY_DEMO_POLISH',
  'SVR_PHASE113_RUNTIME_HEALTH_SYNC',
  'SVR_PHASE116_CUSTOM_RAISE_UI',
  'SVR_PHASE119_ADMIN_ONLINE',
  'SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT',
  'SVR_PHASE120_DEMO_CANDIDATE_LOCK',
  'SVR_PHASE121_DEMO_STATUS_PATCH'
];

let root, body, button, lastSig = '';
function missing(){ return REQUIRED.filter(k => !window[k]); }
function perf(){ return window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR?.metrics?.() || null; }
function bundle(){ return window.SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT?.audit?.() || null; }
function candidate(){ return window.SVR_PHASE120_DEMO_CANDIDATE_LOCK?.candidate?.() || null; }
function poker(){ return window.SVR_PLAYABLE_POKER?.getState?.() || null; }
function routes(){ return window.SVR_PHASE104_PRIVATE_ROUTE_GUARD?.audit || null; }
function yes(v){ return v ? 'YES' : 'NO'; }
function cls(v){ return v ? 'good' : 'bad'; }

function syncLabel(){
  document.documentElement.dataset.svrBuild = PHASE;
  window.SVR_CURRENT_GAME_PHASE = PHASE;
  window.SVR_GAME_TRACK = 'game-side-only';
  window.SVR_SITE_TOUCHED_BY_GAME_TRACK = false;
  const build = Array.from(document.querySelectorAll('.pill')).find(p => String(p.textContent || '').includes('BUILD:'));
  if (build) build.textContent = 'BUILD: ' + PHASE;
  if (!String(document.title || '').includes('Phase 122')) document.title = 'ScarlettVR Poker • Phase 122 full game audit runtime sync';
}

function audit(){
  const m = missing();
  const p = perf();
  const b = bundle();
  const c = candidate();
  const ps = poker();
  const r = routes();
  const routeMissing = r?.missingRoutes?.length || 0;
  const ok = m.length === 0 && (!p || p.status !== 'LOW-PERF') && (!b || b.loadedBytes < 25 * 1024 * 1024) && !!window.SVR_ADMIN_ONLINE;
  const out = {
    phase: PHASE,
    ok,
    siteTouched: false,
    gameTrackOnly: true,
    missingGlobals: m,
    routeMissing,
    performance: p,
    bundle: b,
    candidate: c,
    pokerStreet: ps?.street || null,
    pokerPot: ps?.pot ?? null,
    modules: {
      poker: !!window.SVR_PLAYABLE_POKER,
      hud: !!window.SVR_POKER_ACTION_HUD,
      cards: !!window.SVR_PHASE101_VISUAL_CARD_MESH_SYNC,
      chips: !!window.SVR_PHASE102_CHIP_MOTION_FX,
      controller: !!window.SVR_PHASE103_CONTROLLER_INPUT,
      routes: !!window.SVR_PHASE104_PRIVATE_ROUTE_GUARD,
      raiseHud: !!window.SVR_PHASE107_RAISE_SIZING_HUD,
      watchLocks: !!window.SVR_PHASE108_WATCH_POKER_DISABLED_STATES,
      perf: !!window.SVR_PHASE110_QUEST_PERFORMANCE_MONITOR,
      demo: !!window.SVR_PHASE111_GAMEPLAY_DEMO_POLISH,
      healthSync: !!window.SVR_PHASE113_RUNTIME_HEALTH_SYNC,
      customRaise: !!window.SVR_PHASE116_CUSTOM_RAISE_UI,
      adminOnline: !!window.SVR_ADMIN_ONLINE,
      bundleAudit: !!window.SVR_PHASE119_QUEST_REGRESSION_BUNDLE_AUDIT,
      demoCandidate: !!window.SVR_PHASE120_DEMO_CANDIDATE_LOCK,
      phase121Patch: !!window.SVR_PHASE121_DEMO_STATUS_PATCH
    },
    timestamp: new Date().toISOString()
  };
  window.SVR_PHASE122_FULL_GAME_AUDIT = out;
  window.SVR_PHASE122_RUNTIME_AUDIT = out;
  window.SVR_PHASE121_RUNTIME_AUDIT = out;
  window.dispatchEvent(new CustomEvent('svr-runtime-audit', { detail: out }));
  return out;
}

function style(){
  if (document.getElementById('svr-phase122-style')) return;
  const s = document.createElement('style');
  s.id = 'svr-phase122-style';
  s.textContent = '#svrPhase122Btn{position:fixed;left:50%;top:104px;transform:translateX(-50%);z-index:51;border:1px solid rgba(127,245,199,.55);border-radius:999px;background:rgba(3,8,14,.8);color:#7ff5c7;padding:8px 13px;font:950 11px/1 system-ui;cursor:pointer;box-shadow:0 12px 32px rgba(0,0,0,.42)}#svrPhase122Panel{position:fixed;left:50%;top:146px;transform:translateX(-50%);z-index:51;width:min(560px,calc(100vw - 24px));max-height:64vh;overflow:auto;border:1px solid rgba(127,245,199,.42);border-radius:18px;background:linear-gradient(135deg,rgba(5,8,16,.94),rgba(22,10,42,.96));color:#f6f3ff;padding:12px;display:none;font:12px/1.35 system-ui;box-shadow:0 18px 52px rgba(0,0,0,.52)}#svrPhase122Panel.open{display:block}.p122-row{display:flex;justify-content:space-between;gap:12px;border-top:1px solid rgba(255,255,255,.08);padding:6px 0}.p122-key{color:rgba(246,243,255,.68)}.p122-val{font-weight:900;text-align:right}.good{color:#7ff5c7}.warn{color:#f6e27f}.bad{color:#ff6b7f}body.preview-mode #svrPhase122Btn,body.preview-mode #svrPhase122Panel{display:none!important}';
  document.head.appendChild(s);
}
function row(k,v,c){ return '<div class="p122-row"><span class="p122-key">'+k+'</span><span class="p122-val '+(c||'')+'">'+v+'</span></div>'; }
function make(){
  if (button) return;
  style();
  button = document.createElement('button');
  button.id = 'svrPhase122Btn';
  button.type = 'button';
  button.textContent = 'AUDIT 122';
  root = document.createElement('section');
  root.id = 'svrPhase122Panel';
  root.innerHTML = '<strong>SVR Full Game Audit</strong><div id="svrPhase122Body"></div>';
  body = root.querySelector('#svrPhase122Body');
  document.body.append(button, root);
  button.addEventListener('click', () => root.classList.toggle('open'));
}
function render(){
  make();
  const a = audit();
  const sig = JSON.stringify({ ok:a.ok, miss:a.missingGlobals, route:a.routeMissing, perf:a.performance?.status, fps:a.performance?.fps, bundle:a.bundle?.loadedMB, poker:a.pokerStreet, pot:a.pokerPot });
  if (sig === lastSig) return;
  lastSig = sig;
  button.textContent = a.ok ? 'AUDIT 122 OK' : 'AUDIT 122 CHECK';
  body.innerHTML =
    row('Phase', PHASE) +
    row('Status', a.ok ? 'OK' : 'CHECK', a.ok ? 'good' : 'warn') +
    row('Site touched', 'NO', 'good') +
    row('Missing modules', a.missingGlobals.length ? a.missingGlobals.join(', ') : 'none', a.missingGlobals.length ? 'bad' : 'good') +
    row('Private routes missing', a.routeMissing || 'none', a.routeMissing ? 'warn' : 'good') +
    row('Performance', a.performance ? (a.performance.status + ' • ' + a.performance.fps + ' FPS') : 'waiting', a.performance?.status === 'LOW-PERF' ? 'bad' : 'good') +
    row('Bundle', a.bundle ? (a.bundle.loadedMB + ' MB / 25 MB') : 'waiting', a.bundle?.loadedBytes > 25*1024*1024 ? 'bad' : 'good') +
    row('Poker', a.pokerStreet ? (String(a.pokerStreet).toUpperCase() + ' • Pot $' + (a.pokerPot || 0)) : 'waiting', a.pokerStreet ? 'good' : 'warn') +
    row('Admin online', yes(window.SVR_ADMIN_ONLINE), cls(window.SVR_ADMIN_ONLINE)) +
    row('Custom raise', yes(window.SVR_PHASE116_CUSTOM_RAISE_UI), cls(window.SVR_PHASE116_CUSTOM_RAISE_UI)) +
    row('Demo candidate', yes(window.SVR_PHASE120_DEMO_CANDIDATE_LOCK), cls(window.SVR_PHASE120_DEMO_CANDIDATE_LOCK));
}
function tick(){ syncLabel(); render(); setTimeout(tick, 1000); }
function boot(){
  window.SVR_PHASE122_FULL_GAME_AUDIT_MODULE = { phase: PHASE, audit, render, syncLabel };
  setTimeout(tick, 500);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
