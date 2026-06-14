const LABEL = "UPDATE-3.0-PHASE-210-MINIMAL-QUEST-BOOT-CONTROL-LOCK";

function lock(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE210 = {
    build: LABEL,
    active: true,
    minimalBootChain: true,
    phase207BootRemovedFromIndex: true,
    phase208BootRemovedFromIndex: true,
    keepsPhase209ControlFix: true,
    noNewSceneLoops: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE203_BOOT_DISABLED = true;
  window.SVR_PHASE204_BOOT_DISABLED = true;
  window.SVR_PHASE207_BOOT_DISABLED = true;
  window.SVR_PHASE208_BOOT_DISABLED = true;
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
  ["bootFallback","log","err"].forEach(id=>{
    const el = document.getElementById(id);
    if (!el) return;
    el.style.display = "none";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
  });
  const renderer = window.__SVR_RENDERER__;
  if (renderer?.xr?.isPresenting){
    document.body.classList.add("xr-active");
    ["hud","sceneNav"].forEach(id=>{
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = "none";
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
    });
  }
}

lock();
setTimeout(lock,100);
setTimeout(lock,700);
setTimeout(lock,1800);
