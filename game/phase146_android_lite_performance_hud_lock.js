const LABEL = 'PHASE-146-ANDROID-LITE-PERFORMANCE-HUD-LOCK';
const ua = navigator.userAgent || '';
const params = new URLSearchParams(location.search);
const isAndroid = /Android/i.test(ua);
const isQuest = /Quest|Oculus|Meta Quest/i.test(ua);
const liteRequested = params.get('mobile') === 'lite' || params.has('lite') || (isAndroid && !isQuest);
const hudRequested = params.has('hud') || liteRequested;

let frames = 0;
let last = performance.now();
let fps = 0;
let lowFpsCount = 0;

function core(){ return { renderer: window.__SVR_RENDERER__, scene: window.__SVR_SCENE__, camera: window.__SVR_CAMERA__ }; }
function safeRatio(){ return liteRequested ? Math.min(window.devicePixelRatio || 1, 1.10) : Math.min(window.devicePixelRatio || 1, 1.5); }
function applyLite(reason='apply'){
  const { renderer } = core();
  document.body.classList.toggle('svr-android-lite-mode', !!liteRequested);
  document.body.classList.toggle('svr-performance-hud-active', !!hudRequested);
  try{
    if(renderer){
      renderer.setPixelRatio?.(safeRatio());
      renderer.setSize?.(Math.max(1, innerWidth), Math.max(1, innerHeight), false);
      renderer.shadowMap && (renderer.shadowMap.enabled = !liteRequested);
      renderer.outputColorSpace && (renderer.outputColorSpace = renderer.outputColorSpace);
    }
  }catch(error){ window.SVR_PHASE146_LAST_ERROR = String(error?.message || error); }
  publish(reason);
}
function publish(reason='tick'){
  window.SVR_PHASE146_ANDROID_LITE_PERFORMANCE_HUD = {
    build: LABEL,
    active: true,
    liteRequested,
    hudRequested,
    isAndroid,
    isQuest,
    fps,
    lowFpsCount,
    pixelRatioCap: safeRatio(),
    rendererPresent: !!window.__SVR_RENDERER__,
    scenePresent: !!window.__SVR_SCENE__,
    cameraPresent: !!window.__SVR_CAMERA__,
    mode: liteRequested ? 'android-lite' : isQuest ? 'quest' : 'standard',
    reason,
    checkedAt: new Date().toISOString()
  };
}
function addHud(){
  if(!hudRequested || document.getElementById('svrPerfHud146')) return;
  const style = document.createElement('style');
  style.id = 'svr-phase146-hud-style';
  style.textContent = `
    #svrPerfHud146{position:fixed;right:10px;bottom:10px;z-index:2147483644;min-width:126px;border:1px solid rgba(141,255,180,.55);border-radius:14px;background:rgba(0,0,0,.58);color:#dfffe9;font:800 11px system-ui,Arial;padding:8px 10px;letter-spacing:.04em;box-shadow:0 0 18px rgba(141,255,180,.14);backdrop-filter:blur(8px);opacity:.78;user-select:none}
    #svrPerfHud146 strong{display:block;color:#8dffb4;font:900 11px system-ui,Arial;margin-bottom:2px}#svrPerfHud146 button{margin-top:6px;width:100%;border:1px solid rgba(127,252,255,.38);border-radius:10px;background:rgba(127,252,255,.08);color:#bffcff;font:900 10px system-ui,Arial;padding:5px;cursor:pointer}#svrPerfHud146.svr-collapsed .svr-hud-details{display:none}#svrPerfHud146.svr-warn{border-color:rgba(255,217,138,.70);color:#fff4cf}
    @media(max-width:520px){#svrPerfHud146{right:8px;bottom:54px;min-width:112px;font-size:10px;padding:7px 8px}}
  `;
  document.head.appendChild(style);
  const hud = document.createElement('div');
  hud.id = 'svrPerfHud146';
  hud.className = 'svr-collapsed';
  hud.innerHTML = '<strong>SVR PERF</strong><div class="svr-hud-line">checking...</div><div class="svr-hud-details"></div><button type="button">Details</button>';
  hud.querySelector('button')?.addEventListener('click', () => hud.classList.toggle('svr-collapsed'));
  document.body.appendChild(hud);
}
function updateHud(){
  const hud = document.getElementById('svrPerfHud146');
  if(!hud) return;
  const state = window.SVR_PHASE145_BOOT || window.SVR_PHASE144_BOOT || {};
  const recovery = window.SVR_PHASE145_ANDROID_BLACK_SCREEN_RECOVERY || {};
  const mode = liteRequested ? 'ANDROID LITE' : isQuest ? 'QUEST' : 'STANDARD';
  hud.classList.toggle('svr-warn', fps > 0 && fps < 24);
  const line = hud.querySelector('.svr-hud-line');
  const details = hud.querySelector('.svr-hud-details');
  if(line) line.textContent = `${mode} • ${fps || '--'} FPS`;
  if(details) details.textContent = `modules ${state.moduleCount || '--'} • recovery ${recovery.recoveries || 0} • PR ${safeRatio().toFixed(2)}`;
}
function frame(now){
  frames++;
  if(now - last >= 1000){
    fps = Math.round((frames * 1000) / (now - last));
    frames = 0;
    last = now;
    if(fps > 0 && fps < 24){ lowFpsCount++; applyLite('low-fps-cap'); }
    updateHud(); publish('fps');
  }
  requestAnimationFrame(frame);
}
function install(){
  addHud();
  applyLite('install');
  setTimeout(() => applyLite('late-core-check'), 900);
  setTimeout(updateHud, 1200);
}
window.SVR_APPLY_ANDROID_LITE_MODE = () => applyLite('manual-api');
window.addEventListener('resize', () => setTimeout(() => applyLite('resize'), 120));
window.addEventListener('orientationchange', () => setTimeout(() => applyLite('orientationchange'), 260));
install();
requestAnimationFrame(frame);
publish('loaded');
