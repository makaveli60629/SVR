const LABEL = "PHASE-321-ANDROID-LOBBY-PRODUCTION-AUDIT-LOCK";
const ua = navigator.userAgent || "";
const isQuest = /Quest|Oculus|Meta Quest/i.test(ua);
const isAndroid = /Android/i.test(ua) && !isQuest;
const isAndroidRoute = /\/game\/android\.html$/i.test(location.pathname);
const active = isAndroid || isAndroidRoute;
let optimized = false;
let hiddenDecorations = 0;
let disabledLights = 0;
let sampleFrames = 0;
let sampleMs = 0;
let lastFrameAt = performance.now();
let currentPixelRatio = null;

function removeLegacyPanels(){
  [
    "svrAndroidAuthorityPanel",
    "svrTapMovePanel",
    "svrAndroidSafeBadge153",
    "svrSafeInstruction153",
    "svrAndroidLiteHud",
    "svrAndroidRecoverView"
  ].forEach((id)=>document.getElementById(id)?.remove());
  document.body.classList.remove("svr-phase150-walk-off", "svr-phase150-walk-on", "svr-android-authority");
}

function injectProductionCss(){
  if (document.getElementById("svr-phase321-android-production-style")) return;
  const style = document.createElement("style");
  style.id = "svr-phase321-android-production-style";
  style.textContent = `
    body.svr-phase321-android-production #safeStage{display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important}
    body.svr-phase321-android-production #hud,
    body.svr-phase321-android-production #sceneNav,
    body.svr-phase321-android-production #log,
    body.svr-phase321-android-production #err,
    body.svr-phase321-android-production #svrPhaseBadge,
    body.svr-phase321-android-production .phase-label,
    body.svr-phase321-android-production .svr-vr-button{display:none!important}
    body.svr-phase321-android-production canvas{display:block!important;visibility:visible!important;opacity:1!important}
  `;
  document.head.appendChild(style);
}

function optimizeScene(){
  if (!active || optimized) return false;
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  if (!scene || !renderer) return false;

  removeLegacyPanels();
  renderer.shadowMap.enabled = false;
  renderer.sortObjects = false;
  currentPixelRatio = Math.min(0.72, window.devicePixelRatio || 1);
  renderer.setPixelRatio(currentPixelRatio);

  const pointLights = [];
  scene.traverse((obj)=>{
    const name = String(obj.name || "");
    if (obj.isMesh){
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.frustumCulled = true;
      if (/(_LOWER_GLOW|_UPPER_GLOW|UPSTAIRS_.*_POST_|GUARD_GLASS|VISIBLE_WARM_LIGHT_BULB)/i.test(name)){
        obj.visible = false;
        hiddenDecorations++;
      }
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.filter(Boolean).forEach((mat)=>{
        mat.precision = "mediump";
        if (mat.map) mat.map.anisotropy = 1;
        if (mat.emissiveMap) mat.emissiveMap.anisotropy = 1;
      });
    }
    if (obj.isPointLight) pointLights.push(obj);
  });
  pointLights.forEach((light)=>{
    if (/WALL_BAY_LIGHT/i.test(light.name || "")){
      light.visible = false;
      disabledLights++;
    } else {
      light.castShadow = false;
      light.intensity = Math.min(light.intensity, 0.95);
    }
  });

  document.body.classList.add("svr-phase321-android-production", "boot-released", "runtime-visible", "overlay-released");
  const safe = document.getElementById("safeStage");
  if (safe) safe.remove();
  window.__SVR_GAME_READY__ = true;
  window.SVR_GAME_READY = true;
  optimized = true;
  publish("scene-optimized");
  return true;
}

function publish(action = "state"){
  window.SVR_PHASE321_ANDROID_PRODUCTION = {
    build: LABEL,
    active,
    optimized,
    fullPlannedLobbyPreserved: true,
    androidRoute: isAndroidRoute,
    legacySafeModePanelsRemoved: true,
    hiddenDecorations,
    disabledLights,
    currentPixelRatio,
    action,
    checkedAt: new Date().toISOString()
  };
}

function monitorFrames(now){
  if (!active || !optimized) return;
  const renderer = window.__SVR_RENDERER__;
  const dt = Math.min(250, now - lastFrameAt);
  lastFrameAt = now;
  sampleFrames++;
  sampleMs += dt;
  if (sampleFrames >= 120){
    const fps = sampleMs > 0 ? (sampleFrames * 1000) / sampleMs : 60;
    let nextRatio = 0.72;
    if (fps < 26) nextRatio = 0.54;
    else if (fps < 36) nextRatio = 0.62;
    if (renderer && Math.abs((currentPixelRatio || 0) - nextRatio) > 0.01){
      currentPixelRatio = nextRatio;
      renderer.setPixelRatio(nextRatio);
      publish(`adaptive-${Math.round(fps)}fps`);
    }
    sampleFrames = 0;
    sampleMs = 0;
  }
  requestAnimationFrame(monitorFrames);
}

function boot(){
  if (!active) return;
  injectProductionCss();
  removeLegacyPanels();
  if (!optimizeScene()) setTimeout(boot, 250);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
else boot();
setTimeout(boot, 250);
setTimeout(boot, 900);
requestAnimationFrame(monitorFrames);
publish("loaded");
