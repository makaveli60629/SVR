const LABEL = 'PHASE-153-ANDROID-SAFE-MODE-POLISH-LOCK';
const ua = navigator.userAgent || '';
const isAndroid = /Android/i.test(ua);
const isAndroidRoute = /\/game\/android\.html/i.test(location.pathname);
const active = isAndroid || isAndroidRoute;
let lastWalk = 'off';
let lastZone = 'lobby';
let lastFps = '--';
let warning = 'Use tap buttons first. Keep WALK OFF unless testing.';

function phase150(){ return window.SVR_PHASE150_ANDROID_TAP_MOVE || {}; }
function phase146(){ return window.SVR_PHASE146_ANDROID_LITE_PERFORMANCE_HUD || {}; }
function recovery(){ return window.SVR_PHASE145_ANDROID_BLACK_SCREEN_RECOVERY || {}; }
function publish(action='state'){
  const p150 = phase150();
  const p146 = phase146();
  const rec = recovery();
  lastWalk = p150.walkEnabled ? 'on' : 'off';
  lastZone = p150.currentZone || lastZone;
  lastFps = p146.fps || lastFps;
  window.SVR_PHASE153_ANDROID_SAFE_MODE_POLISH = {
    build: LABEL,
    active,
    walk: lastWalk,
    zone: lastZone,
    fps: lastFps,
    recoveries: rec.recoveries || p150.recoveries || 0,
    warning,
    action,
    checkedAt: new Date().toISOString()
  };
}
function injectStyles(){
  if(document.getElementById('svr-phase153-safe-style')) return;
  const style = document.createElement('style');
  style.id = 'svr-phase153-safe-style';
  style.textContent = `
    #svrAndroidSafeBadge153{position:fixed;left:10px;top:max(8px,env(safe-area-inset-top));z-index:2147483647;display:grid;gap:2px;min-width:150px;border:1px solid rgba(141,255,180,.68);border-radius:15px;background:rgba(0,0,0,.66);box-shadow:0 0 22px rgba(141,255,180,.18);backdrop-filter:blur(10px);padding:8px 10px;color:#eafff1;font-family:system-ui,Arial,sans-serif;pointer-events:none}
    #svrAndroidSafeBadge153 strong{color:#8dffb4;font:900 11px system-ui,Arial;letter-spacing:.08em;text-transform:uppercase}#svrAndroidSafeBadge153 span{font:800 10px system-ui,Arial;color:#dfffe9}#svrAndroidSafeBadge153 .warn{color:#ffd98a}
    #svrSafeInstruction153{position:fixed;left:50%;top:58px;transform:translateX(-50%);z-index:2147483646;width:min(92vw,680px);border:1px solid rgba(255,217,138,.36);border-radius:16px;background:rgba(0,0,0,.56);box-shadow:0 0 22px rgba(255,217,138,.12);backdrop-filter:blur(10px);padding:8px 12px;color:#fff4d0;font:900 11px system-ui,Arial;text-align:center;letter-spacing:.03em;pointer-events:none}
    #svrTapMovePanel{bottom:calc(150px + env(safe-area-inset-bottom))!important;border-color:rgba(141,255,180,.70)!important;background:rgba(0,0,0,.72)!important;opacity:.96!important}
    #svrTapMovePanel button{min-width:62px!important;min-height:34px!important;border-width:2px!important;font-size:10.5px!important}
    #svrTapMovePanel [data-zone="recover"],#svrTapMovePanel [data-zone="reset"]{transform:scale(1.08);font-size:11px!important;box-shadow:0 0 18px rgba(255,91,140,.25)!important}
    #svrTapMovePanel [data-zone="walk"]{min-width:88px!important}
    body.svr-phase150-walk-off #svrTapMovePanel [data-zone="walk"]{background:rgba(255,217,138,.20)!important;color:#fff4d0!important}
    body.svr-phase150-walk-on #svrTapMovePanel [data-zone="walk"]{background:rgba(255,91,140,.24)!important;color:#ffe4ec!important;border-color:rgba(255,91,140,.75)!important}
    #svrAndroidRecoverView{bottom:calc(86px + env(safe-area-inset-bottom))!important;left:50%!important;transform:translateX(-50%)!important;min-width:150px!important;min-height:38px!important;font-size:12px!important;opacity:.96!important;background:rgba(255,91,140,.18)!important;border-color:rgba(255,91,140,.74)!important;color:#ffdbe7!important;box-shadow:0 0 22px rgba(255,91,140,.26)!important}
    @media(max-width:520px){#svrAndroidSafeBadge153{left:8px;min-width:126px;padding:7px 8px}#svrSafeInstruction153{top:52px;font-size:10px;padding:7px 8px}#svrTapMovePanel{bottom:calc(140px + env(safe-area-inset-bottom))!important}#svrTapMovePanel button{min-width:52px!important;font-size:9.2px!important;padding:6px!important}#svrTapMovePanel [data-zone="walk"]{min-width:74px!important}}
  `;
  document.head.appendChild(style);
}
function ensureBadge(){
  if(!active) return;
  if(!document.getElementById('svrAndroidSafeBadge153')){
    const badge = document.createElement('div');
    badge.id = 'svrAndroidSafeBadge153';
    badge.innerHTML = '<strong>SAFE MODE ACTIVE</strong><span data-safe-zone>Zone: Lobby</span><span data-safe-walk>Walk: OFF</span><span data-safe-fps>FPS: --</span><span class="warn" data-safe-warning>Use tap buttons first.</span>';
    document.body.appendChild(badge);
  }
  if(!document.getElementById('svrSafeInstruction153')){
    const note = document.createElement('div');
    note.id = 'svrSafeInstruction153';
    note.textContent = 'Android Safe Mode: tap LOBBY/TABLE/STORE first. RECOVER or RESET if anything goes black. Turn WALK ON only after tap-move works.';
    document.body.appendChild(note);
    setTimeout(()=>{ note.style.opacity='0.42'; }, 8500);
  }
}
function updateText(){
  const p150 = phase150();
  const p146 = phase146();
  const rec = recovery();
  const walk = p150.walkEnabled ? 'ON - TEST ONLY' : 'OFF - SAFE';
  const zone = String(p150.currentZone || lastZone || 'lobby').toUpperCase();
  const fps = p146.fps || '--';
  const recoverCount = rec.recoveries || p150.recoveries || 0;
  let warn = 'Tap-move first. Keep WALK OFF for stability.';
  if(p150.walkEnabled) warn = 'WALK ON: test slowly. If black screen happens, RECOVER then WALK OFF.';
  if(Number(fps) > 0 && Number(fps) < 24) warn = 'Low FPS: stay in WALK OFF and use tap-move.';
  if(recoverCount > 0) warn = 'Recovery used: stay in Safe Mode and avoid joystick walking.';
  warning = warn;
  const badge = document.getElementById('svrAndroidSafeBadge153');
  if(badge){
    const zoneEl = badge.querySelector('[data-safe-zone]');
    const walkEl = badge.querySelector('[data-safe-walk]');
    const fpsEl = badge.querySelector('[data-safe-fps]');
    const warnEl = badge.querySelector('[data-safe-warning]');
    if(zoneEl) zoneEl.textContent = `Zone: ${zone}`;
    if(walkEl) walkEl.textContent = `Walk: ${walk}`;
    if(fpsEl) fpsEl.textContent = `FPS: ${fps} • Recoveries: ${recoverCount}`;
    if(warnEl) warnEl.textContent = warn;
  }
  publish('update');
}
function addPanelHelpers(){
  const panel = document.getElementById('svrTapMovePanel');
  if(!panel || panel.dataset.phase153Polished === '1') return;
  panel.dataset.phase153Polished = '1';
  panel.setAttribute('aria-label','Android Safe Mode tap-move panel');
  panel.querySelector('[data-zone="walk"]')?.setAttribute('title','Default is WALK OFF. Turn on only after tap-move works.');
  panel.querySelector('[data-zone="recover"]')?.setAttribute('title','Recover the view if Android goes black.');
  panel.querySelector('[data-zone="reset"]')?.setAttribute('title','Return to safe lobby spawn.');
}
function boot(){
  if(!active) return;
  injectStyles();
  ensureBadge();
  addPanelHelpers();
  updateText();
}
window.SVR_PHASE153_ANDROID_SAFE_MODE_RECOVER = () => { window.SVR_PHASE150_RECOVER?.('phase153-recover'); updateText(); };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
setInterval(boot, 750);
publish('loaded');
