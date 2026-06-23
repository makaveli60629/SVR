const LABEL = 'PHASE-145-ANDROID-BLACK-SCREEN-RECOVERY-LOCK';
const ua = navigator.userAgent || '';
const isAndroid = /Android/i.test(ua);
let recoveries = 0;
let lastReason = 'boot';

function finiteVector(v){ return v && Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z); }
function getCore(){ return { renderer: window.__SVR_RENDERER__, scene: window.__SVR_SCENE__, camera: window.__SVR_CAMERA__ }; }
function mark(reason){
  lastReason = reason;
  window.SVR_PHASE145_ANDROID_BLACK_SCREEN_RECOVERY = {
    build: LABEL,
    active: true,
    isAndroid,
    recoveries,
    lastReason,
    rendererPresent: !!window.__SVR_RENDERER__,
    scenePresent: !!window.__SVR_SCENE__,
    cameraPresent: !!window.__SVR_CAMERA__,
    checkedAt: new Date().toISOString()
  };
}
function recover(reason='manual'){
  const { renderer, scene, camera } = getCore();
  recoveries++;
  try{
    const canvas = renderer?.domElement || document.querySelector('canvas');
    if(canvas){
      canvas.style.display = 'block';
      canvas.style.visibility = 'visible';
      canvas.style.opacity = '1';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
    }
    if(renderer){
      renderer.setClearColor?.(0x02040b, 1);
      renderer.setPixelRatio?.(Math.min(window.devicePixelRatio || 1, isAndroid ? 1.25 : 1.5));
      renderer.setSize?.(Math.max(1, window.innerWidth), Math.max(1, window.innerHeight), false);
    }
    if(camera && (!finiteVector(camera.position) || camera.position.y < 0.45 || camera.position.y > 3.6 || Math.abs(camera.position.x) > 32 || Math.abs(camera.position.z) > 32)){
      camera.position.set(0, 1.62, 7.2);
      camera.lookAt?.(0, 1.45, -2.0);
    }
    if(scene && camera) scene.userData._camera = camera;
    document.body.classList.remove('android-black-screen-risk');
  }catch(error){
    window.SVR_PHASE145_LAST_ERROR = String(error?.message || error);
  }
  mark(reason);
}
function installEmergencyButton(){
  if(!isAndroid || document.getElementById('svrAndroidRecoverView')) return;
  const style = document.createElement('style');
  style.id = 'svr-android-recover-style';
  style.textContent = '#svrAndroidRecoverView{position:fixed;left:10px;bottom:10px;z-index:2147483645;border:1px solid rgba(141,255,180,.75);border-radius:999px;background:rgba(0,0,0,.62);color:#8dffb4;font:900 11px system-ui,Arial;padding:8px 10px;letter-spacing:.05em;opacity:.72}#svrAndroidRecoverView:active{opacity:1}';
  document.head.appendChild(style);
  const btn = document.createElement('button');
  btn.id = 'svrAndroidRecoverView';
  btn.type = 'button';
  btn.textContent = 'Recover View';
  btn.addEventListener('click', () => recover('manual-button'));
  document.body.appendChild(btn);
}
function monitor(){
  const { renderer, camera } = getCore();
  const canvas = renderer?.domElement || document.querySelector('canvas');
  if(!canvas || canvas.clientWidth <= 2 || canvas.clientHeight <= 2){ recover('canvas-size'); return; }
  const style = getComputedStyle(canvas);
  if(style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0){ recover('canvas-hidden'); return; }
  if(camera && (!finiteVector(camera.position) || camera.position.y < 0.45 || camera.position.y > 3.6 || Math.abs(camera.position.x) > 32 || Math.abs(camera.position.z) > 32)){ recover('camera-out-of-bounds'); return; }
  mark('monitor-ok');
}
function install(){
  const canvas = document.querySelector('canvas');
  if(canvas && !canvas.dataset.svrPhase145ContextGuard){
    canvas.dataset.svrPhase145ContextGuard = '1';
    canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); document.body.classList.add('android-black-screen-risk'); recover('webgl-context-lost'); }, false);
    canvas.addEventListener('webglcontextrestored', () => recover('webgl-context-restored'), false);
  }
  installEmergencyButton();
  recover('install');
}
window.SVR_RECOVER_ANDROID_VIEW = () => recover('window-api');
window.addEventListener('resize', () => recover('resize'));
window.addEventListener('orientationchange', () => setTimeout(() => recover('orientationchange'), 250));
window.addEventListener('pointerdown', () => { if(isAndroid) setTimeout(monitor, 180); }, { passive:true });
install();
setTimeout(install, 800);
setInterval(monitor, isAndroid ? 900 : 1800);
mark('loaded');
