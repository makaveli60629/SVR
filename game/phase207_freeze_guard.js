const LABEL = "UPDATE-3.0-PHASE-207-QUEST-FREEZE-RECOVERY-LOCK";

const BAD_3D_OVERLAY = /PHASE204_VISUAL_GUIDE|PHASE204_GUIDANCE|PHASE204_FEEDBACK|PHASE204_TARGET|PHASE204_GUIDE_|PHASE204_VISUAL_GUIDE_ROOT|FACE_OVERLAY|BLACK_OVERLAY|VIEW_OVERLAY|TARGET_LABEL|GUIDANCE_LABEL/i;
const HTML_OVERLAY_IDS = ["bootFallback", "log", "err"];
let cleanupRuns = 0;
let lastCleanup = 0;

function lockLabel(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE207 = {
    build: LABEL,
    active: true,
    freezeRecovery: true,
    heavyOverlayIntervalsDisabled: true,
    carouselBootDisabled: true,
    phase191ScanLimited: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE203_BOOT_DISABLED = true;
  window.SVR_PHASE204_BOOT_DISABLED = true;
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function suppressHtmlOverlays(){
  HTML_OVERLAY_IDS.forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = "none";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
  });
  const renderer = window.__SVR_RENDERER__;
  if (renderer?.xr?.isPresenting){
    document.body.classList.add("xr-active");
    ["hud", "sceneNav"].forEach(id=>{
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = "none";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    });
  }
}

function remove3DOverlaysLimited(){
  const now = performance.now();
  if (cleanupRuns > 10 || now - lastCleanup < 350) return;
  lastCleanup = now;
  cleanupRuns++;
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__;
  if (!scene) return;
  const toRemove = [];
  scene.traverse(obj=>{
    const name = String(obj.name || "");
    if (BAD_3D_OVERLAY.test(name)) toRemove.push(obj);
  });
  toRemove.forEach(obj=>obj.parent?.remove(obj));
  camera?.children?.slice?.().forEach(obj=>{
    const name = String(obj.name || "");
    if (BAD_3D_OVERLAY.test(name) || obj.userData?.phase204Overlay){
      obj.visible = false;
      obj.parent?.remove(obj);
    }
  });
}

function install(){
  lockLabel();
  suppressHtmlOverlays();
  remove3DOverlaysLimited();
  const renderer = window.__SVR_RENDERER__;
  if (renderer?.xr && !window.SVR_PHASE207_XR_LISTENERS){
    window.SVR_PHASE207_XR_LISTENERS = true;
    renderer.xr.addEventListener("sessionstart", ()=>{
      document.body.classList.add("xr-active");
      cleanupRuns = 0;
      setTimeout(()=>{ suppressHtmlOverlays(); remove3DOverlaysLimited(); }, 50);
      setTimeout(()=>{ suppressHtmlOverlays(); remove3DOverlaysLimited(); }, 350);
      setTimeout(()=>{ suppressHtmlOverlays(); remove3DOverlaysLimited(); }, 1000);
    });
    renderer.xr.addEventListener("sessionend", ()=>{
      suppressHtmlOverlays();
      remove3DOverlaysLimited();
    });
  }
}

install();
setTimeout(install,100);
setTimeout(install,500);
setTimeout(install,1500);
setTimeout(install,3000);
