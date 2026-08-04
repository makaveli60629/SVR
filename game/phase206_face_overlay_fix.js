const LABEL = "UPDATE-3.0-PHASE-206-FACE-OVERLAY-REMOVAL-LOCK";

const BAD_3D_OVERLAY = /PHASE204_VISUAL_GUIDE|PHASE204_GUIDANCE|PHASE204_FEEDBACK|PHASE204_TARGET|PHASE204_GUIDE_|PHASE204_VISUAL_GUIDE_ROOT|FACE_OVERLAY|BLACK_OVERLAY|VIEW_OVERLAY|TARGET_LABEL|GUIDANCE_LABEL/i;
const BAD_HTML_IDS = ["bootFallback", "log", "err"];

function lockLabel(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE206 = {
    build: LABEL,
    active: true,
    faceOverlayRemoved: true,
    phase204VisualGuideDisabled: true,
    htmlOverlaySuppressed: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_NO_FACE_OVERLAY = true;
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function suppressHtmlOverlays(){
  BAD_HTML_IDS.forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = "none";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
  });
  const renderer = window.__SVR_RENDERER__;
  const inXR = !!renderer?.xr?.isPresenting;
  if (inXR){
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

function remove3DOverlays(){
  const scene = window.__SVR_SCENE__;
  const camera = window.__SVR_CAMERA__;
  if (!scene) return;
  const toRemove = [];
  scene.traverse(obj=>{
    const name = String(obj.name || "");
    if (BAD_3D_OVERLAY.test(name)) toRemove.push(obj);
  });
  toRemove.forEach(obj=>obj.parent?.remove(obj));
  if (camera?.children?.length){
    camera.children.slice().forEach(obj=>{
      const name = String(obj.name || "");
      if (BAD_3D_OVERLAY.test(name) || obj.userData?.phase203Action || obj.userData?.phase204Overlay){
        obj.visible = false;
        obj.parent?.remove(obj);
      }
    });
  }
}

function install(){
  lockLabel();
  suppressHtmlOverlays();
  remove3DOverlays();
  const renderer = window.__SVR_RENDERER__;
  if (renderer?.xr && !window.SVR_PHASE206_XR_LISTENERS){
    window.SVR_PHASE206_XR_LISTENERS = true;
    renderer.xr.addEventListener("sessionstart", ()=>{
      document.body.classList.add("xr-active");
      setTimeout(()=>{ suppressHtmlOverlays(); remove3DOverlays(); }, 50);
      setTimeout(()=>{ suppressHtmlOverlays(); remove3DOverlays(); }, 500);
      setTimeout(()=>{ suppressHtmlOverlays(); remove3DOverlays(); }, 1500);
    });
    renderer.xr.addEventListener("sessionend", ()=>{
      suppressHtmlOverlays();
      remove3DOverlays();
    });
  }
}

install();
setTimeout(install,100);
setTimeout(install,500);
setTimeout(install,1500);
setTimeout(install,3000);
setInterval(install,1200);
