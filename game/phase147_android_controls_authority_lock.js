const LABEL = 'PHASE-147-ANDROID-CONTROLS-AUTHORITY-LOCK';
const ua = navigator.userAgent || '';
const isAndroid = /Android/i.test(ua);
const isQuest = /Quest|Oculus|Meta Quest/i.test(ua);
const isAndroidAuthority = isAndroid && !isQuest;
const CLAMP = 10.5;
let ticks = 0;
let corrections = 0;
let lastAction = 'loaded';

function core(){ return { renderer: window.__SVR_RENDERER__, scene: window.__SVR_SCENE__, camera: window.__SVR_CAMERA__ }; }
function finite(v){ return Number.isFinite(v); }
function publish(action='state'){
  const { renderer, scene, camera } = core();
  window.SVR_ANDROID_CONTROLS_AUTHORITY = {
    build: LABEL,
    active: true,
    isAndroid,
    isQuest,
    authorityEnabled: isAndroidAuthority,
    questMovementBlockedForAndroid: isAndroidAuthority,
    touchControlsExpected: !!document.getElementById('androidSmartControls'),
    authorityPanelVisible: !!document.getElementById('svrAndroidAuthorityPanel'),
    rendererPresent: !!renderer,
    scenePresent: !!scene,
    cameraPresent: !!camera,
    cameraPosition: camera ? { x:+camera.position.x.toFixed(3), y:+camera.position.y.toFixed(3), z:+camera.position.z.toFixed(3) } : null,
    corrections,
    ticks,
    lastAction: action || lastAction,
    checkedAt: new Date().toISOString()
  };
}
function clampCamera(reason='clamp'){
  const { camera, scene, renderer } = core();
  if(!camera) return false;
  let changed = false;
  if(!finite(camera.position.x) || !finite(camera.position.y) || !finite(camera.position.z)){
    camera.position.set(0, 1.62, 7.2);
    camera.lookAt?.(0, 1.45, -2);
    changed = true;
  }
  if(camera.position.y < 1.05 || camera.position.y > 2.25){ camera.position.y = 1.62; changed = true; }
  if(camera.position.x < -CLAMP){ camera.position.x = -CLAMP; changed = true; }
  if(camera.position.x > CLAMP){ camera.position.x = CLAMP; changed = true; }
  if(camera.position.z < -CLAMP){ camera.position.z = -CLAMP; changed = true; }
  if(camera.position.z > CLAMP){ camera.position.z = CLAMP; changed = true; }
  if(scene) scene.userData._camera = camera;
  if(renderer?.domElement){
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.visibility = 'visible';
    renderer.domElement.style.opacity = '1';
  }
  if(changed){ corrections++; lastAction = reason; window.SVR_RECOVER_ANDROID_VIEW?.(); }
  publish(reason);
  return changed;
}
function centerView(){
  const { camera } = core();
  if(camera){
    camera.position.y = 1.62;
    camera.lookAt?.(0, 1.45, -2);
    lastAction = 'center-view';
  }
  window.SVR_RECOVER_ANDROID_VIEW?.();
  publish('center-view');
}
function goTable(){
  window.dispatchEvent(new KeyboardEvent('keydown', { code:'KeyJ' }));
  lastAction = 'table-button';
  publish('table-button');
}
function installPanel(){
  if(!isAndroidAuthority || document.getElementById('svrAndroidAuthorityPanel')) return;
  const style = document.createElement('style');
  style.id = 'svr-android-authority-style';
  style.textContent = `
    html,body{overscroll-behavior:none!important;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}
    #svrAndroidAuthorityPanel{position:fixed;left:50%;top:max(8px,env(safe-area-inset-top));transform:translateX(-50%);z-index:2147483645;display:flex;gap:6px;align-items:center;justify-content:center;padding:6px;border:1px solid rgba(141,255,180,.38);border-radius:999px;background:rgba(0,0,0,.54);box-shadow:0 0 18px rgba(141,255,180,.16);backdrop-filter:blur(10px);font-family:system-ui,Arial,sans-serif;opacity:.84}
    #svrAndroidAuthorityPanel button{border:1px solid rgba(141,255,180,.52);border-radius:999px;background:rgba(141,255,180,.10);color:#dfffe9;font:900 10px system-ui,Arial;letter-spacing:.04em;padding:7px 9px;min-width:58px;touch-action:none}
    #svrAndroidAuthorityPanel .svr-lite-label{color:#8dffb4;font:900 10px system-ui,Arial;letter-spacing:.08em;padding:0 4px;white-space:nowrap}
    body.svr-android-authority #androidSmartControls{z-index:2147483600!important}
    body.svr-android-authority .android-stick{border-color:rgba(141,255,180,.62)!important;box-shadow:0 0 22px rgba(141,255,180,.22)!important}
    body.svr-android-authority .android-knob{background:rgba(141,255,180,.64)!important;box-shadow:0 0 18px rgba(141,255,180,.70)!important}
    @media(max-width:520px){#svrAndroidAuthorityPanel{top:max(6px,env(safe-area-inset-top));gap:4px;padding:5px}#svrAndroidAuthorityPanel button{font-size:9px;min-width:50px;padding:6px 7px}.svr-lite-label{display:none}}
  `;
  document.head.appendChild(style);
  const panel = document.createElement('div');
  panel.id = 'svrAndroidAuthorityPanel';
  panel.innerHTML = '<span class="svr-lite-label">ANDROID LITE</span><button type="button" data-act="center">CENTER</button><button type="button" data-act="recover">RECOVER</button><button type="button" data-act="table">TABLE</button>';
  panel.addEventListener('pointerdown', (event) => {
    const btn = event.target.closest('button[data-act]');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    if(btn.dataset.act === 'center') centerView();
    if(btn.dataset.act === 'recover'){ window.SVR_RECOVER_ANDROID_VIEW?.(); clampCamera('recover-button'); }
    if(btn.dataset.act === 'table') goTable();
  }, { passive:false });
  document.body.appendChild(panel);
  document.body.classList.add('svr-android-authority');
}
function guardEvents(){
  if(!isAndroidAuthority || window.SVR_ANDROID_AUTHORITY_EVENTS_LOCKED) return;
  window.SVR_ANDROID_AUTHORITY_EVENTS_LOCKED = true;
  ['gesturestart','gesturechange','gestureend'].forEach(type => window.addEventListener(type, e => e.preventDefault(), { passive:false }));
  document.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchmove', e => {
    if(e.target?.closest?.('#androidSmartControls,#svrAndroidAuthorityPanel')) return;
    e.preventDefault();
  }, { passive:false });
  window.addEventListener('blur', () => { lastAction = 'blur'; publish('blur'); });
  window.addEventListener('focus', () => { clampCamera('focus'); });
  window.addEventListener('orientationchange', () => setTimeout(() => clampCamera('orientationchange'), 300));
}
function tick(){
  ticks++;
  if(isAndroidAuthority) clampCamera('tick');
  if(ticks < 900) requestAnimationFrame(tick);
}
function install(){
  guardEvents();
  installPanel();
  clampCamera('install');
  window.SVR_ANDROID_CENTER_VIEW = centerView;
  window.SVR_ANDROID_GOTO_TABLE = goTable;
  window.SVR_ANDROID_CLAMP_CAMERA = clampCamera;
  publish('install');
}
install();
setTimeout(install, 700);
setTimeout(install, 1800);
requestAnimationFrame(tick);
publish('loaded');
