const LABEL = 'PHASE-150-ANDROID-TAP-MOVE-NO-BLACK-FALLBACK';
const ua = navigator.userAgent || '';
const isAndroid = /Android/i.test(ua);
const isQuest = /Quest|Oculus|Meta Quest/i.test(ua);
const isAndroidRoute = /\/game\/android\.html/i.test(location.pathname);
const active = (isAndroid && !isQuest) || isAndroidRoute;
let walkEnabled = false;
let currentZone = 'lobby';
let moves = 0;
let recoveries = 0;

const ZONES = {
  lobby: { label:'LOBBY', pos:[0,1.62,7.2], look:[0,1.45,-2.0] },
  table: { label:'TABLE', pos:[0,1.62,4.4], look:[0,1.2,0.75] },
  store: { label:'STORE', pos:[6,1.62,-11.8], look:[6,2.0,-16.0] },
  pga: { label:'PGA', pos:[-6,1.62,-11.8], look:[-6,2.0,-16.0] },
  reiki: { label:'REIKI', pos:[-12,1.62,-11.8], look:[-12,2.0,-16.0] },
  scorpion: { label:'SCORPION', pos:[12,1.62,-11.8], look:[12,2.0,-16.0] },
  reset: { label:'RESET', pos:[0,1.62,7.2], look:[0,1.45,-2.0] }
};

function core(){ return { camera: window.__SVR_CAMERA__, renderer: window.__SVR_RENDERER__, scene: window.__SVR_SCENE__ }; }
function publish(action='state'){
  const { camera } = core();
  window.SVR_PHASE150_ANDROID_TAP_MOVE = {
    build: LABEL,
    active,
    walkEnabled,
    currentZone,
    moves,
    recoveries,
    cameraPresent: !!camera,
    cameraPosition: camera ? { x:+camera.position.x.toFixed(3), y:+camera.position.y.toFixed(3), z:+camera.position.z.toFixed(3) } : null,
    action,
    checkedAt: new Date().toISOString()
  };
}
function zeroMoveState(){
  try{
    const state = window.SVR_ANDROID_SAFE_MOVE_STATE;
    if(state?.move){ state.move.x = 0; state.move.y = 0; }
    if(state?.look){ state.look.x = 0; state.look.y = 0; }
  }catch{}
}
function setWalk(enabled){
  walkEnabled = !!enabled;
  document.body.classList.toggle('svr-phase150-walk-on', walkEnabled);
  document.body.classList.toggle('svr-phase150-walk-off', !walkEnabled);
  if(!walkEnabled) zeroMoveState();
  const btn = document.querySelector('#svrTapMovePanel [data-zone="walk"]');
  if(btn) btn.textContent = walkEnabled ? 'WALK ON' : 'WALK OFF';
  publish(walkEnabled ? 'walk-on' : 'walk-off');
}
function recover(reason='recover'){
  recoveries++;
  zeroMoveState();
  window.SVR_RECOVER_ANDROID_VIEW?.();
  window.SVR_ANDROID_CLAMP_CAMERA?.(reason);
  window.SVR_ANDROID_SAFE_CENTER?.();
  publish(reason);
}
function goZone(key){
  const zone = ZONES[key] || ZONES.lobby;
  const { camera, renderer, scene } = core();
  if(!camera) return;
  zeroMoveState();
  camera.position.set(zone.pos[0], zone.pos[1], zone.pos[2]);
  camera.lookAt?.(zone.look[0], zone.look[1], zone.look[2]);
  if(scene) scene.userData._camera = camera;
  if(renderer?.domElement){
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.visibility = 'visible';
    renderer.domElement.style.opacity = '1';
  }
  currentZone = key;
  moves++;
  window.SVR_ANDROID_CLAMP_CAMERA?.('tap-move-'+key);
  window.SVR_RECOVER_ANDROID_VIEW?.();
  publish('tap-move-'+key);
}
function installStyles(){
  if(document.getElementById('svr-phase150-style')) return;
  const style = document.createElement('style');
  style.id = 'svr-phase150-style';
  style.textContent = `
    #svrTapMovePanel{position:fixed;left:50%;bottom:calc(142px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:2147483646;display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:5px;width:min(96vw,640px);padding:7px;border:1px solid rgba(141,255,180,.42);border-radius:18px;background:rgba(0,0,0,.56);box-shadow:0 0 22px rgba(141,255,180,.14);backdrop-filter:blur(10px);font-family:system-ui,Arial,sans-serif;opacity:.88}
    #svrTapMovePanel button{border:1px solid rgba(141,255,180,.56);border-radius:999px;background:rgba(141,255,180,.10);color:#eafff1;font:900 10px system-ui,Arial;letter-spacing:.04em;padding:7px 9px;min-width:56px;touch-action:none}
    #svrTapMovePanel [data-zone="walk"]{border-color:rgba(255,217,138,.62);color:#fff4d0;background:rgba(255,217,138,.10)}
    #svrTapMovePanel [data-zone="recover"]{border-color:rgba(255,91,140,.62);color:#ffd6e4;background:rgba(255,91,140,.10)}
    body.svr-phase150-walk-off #androidSmartControls .android-stick-left{opacity:.22!important;pointer-events:none!important;filter:grayscale(1)!important}
    body.svr-phase150-walk-off #androidSmartControls .android-stick-left span::after{content:' OFF';color:#ffd98a}
    body.svr-phase150-walk-on #androidSmartControls .android-stick-left{opacity:1!important;pointer-events:auto!important;filter:none!important}
    @media(max-width:520px){#svrTapMovePanel{bottom:calc(126px + env(safe-area-inset-bottom));gap:4px;padding:6px}#svrTapMovePanel button{font-size:9px;min-width:48px;padding:6px 7px}}
  `;
  document.head.appendChild(style);
}
function installPanel(){
  if(!active || document.getElementById('svrTapMovePanel')) return;
  installStyles();
  const panel = document.createElement('div');
  panel.id = 'svrTapMovePanel';
  panel.innerHTML = '<button data-zone="lobby">LOBBY</button><button data-zone="table">TABLE</button><button data-zone="store">STORE</button><button data-zone="pga">PGA</button><button data-zone="reiki">REIKI</button><button data-zone="scorpion">SCORPION</button><button data-zone="reset">RESET</button><button data-zone="recover">RECOVER</button><button data-zone="walk">WALK OFF</button>';
  panel.addEventListener('pointerdown', (event)=>{
    const btn = event.target.closest('button[data-zone]');
    if(!btn) return;
    event.preventDefault();
    event.stopPropagation();
    const key = btn.dataset.zone;
    if(key === 'walk'){ setWalk(!walkEnabled); return; }
    if(key === 'recover'){ recover('tap-recover'); return; }
    goZone(key);
  }, { passive:false });
  document.body.appendChild(panel);
  setWalk(false);
  goZone('lobby');
}
function guard(){
  if(!active) return;
  installPanel();
  if(!walkEnabled) zeroMoveState();
  const { camera, renderer } = core();
  if(camera){
    if(!Number.isFinite(camera.position.x) || !Number.isFinite(camera.position.y) || !Number.isFinite(camera.position.z)) goZone('lobby');
    if(camera.position.y < 1.05 || camera.position.y > 2.35) camera.position.y = 1.62;
  }
  if(renderer?.domElement){
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.visibility = 'visible';
    renderer.domElement.style.opacity = '1';
  }
  publish('guard');
}
window.SVR_PHASE150_GO_ZONE = goZone;
window.SVR_PHASE150_SET_WALK = setWalk;
window.SVR_PHASE150_RECOVER = recover;
setTimeout(installPanel, 900);
setTimeout(installPanel, 1900);
setInterval(guard, 750);
publish('loaded');
