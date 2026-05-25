(function(){
  const BUILD = "PHASE-248-VISIBLE-RECOVERY-SCENE-GUARD-LOCK";
  const PHASE = 248;
  const state = { build: BUILD, phase: PHASE, publicPageTouched: false, checkedAt: null };

  function esc(v){
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;" }[s]));
  }

  function readState(){
    state.checkedAt = new Date().toISOString();
    state.recovery = window.SVR_VISIBLE_RECOVERY_SCENE_GUARD || null;
    state.runtime = window.SVR_MAIN_RUNTIME_STATE || null;
    render(true);
    return JSON.parse(JSON.stringify(state));
  }

  function panel(){
    let p = document.getElementById("svr-visible-recovery-scene-guard");
    if (p) return p;
    p = document.createElement("div");
    p.id = "svr-visible-recovery-scene-guard";
    p.style.cssText = [
      "position:fixed","right:18px","top:226px","z-index:100021",
      "width:min(880px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(5,8,14,.97)","color:#eff8ff",
      "border:1px solid rgba(80,255,220,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if (show) p.style.display = "block";
    const text = JSON.stringify({
      build: BUILD,
      phase: PHASE,
      recovery: window.SVR_VISIBLE_RECOVERY_SCENE_GUARD || null,
      runtime: window.SVR_MAIN_RUNTIME_STATE || null
    }, null, 2);
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Visible Recovery Scene Guard</b>
        <button id="svrVisibleRecoveryClose" style="border:1px solid #8fd;background:#061d18;color:#eff8ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(80,255,220,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Fix:</b> always renders a recovery grid/ring/sign so runtime shield cannot leave a pure black scene.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrVisibleRecoveryRead" style="border:1px solid #8fd;background:#061d18;color:#eff8ff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Read Recovery State</button>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px;max-height:340px;overflow:auto">${esc(text)}</pre>
      <p style="color:#dcefff;margin-bottom:0">Press F12 to toggle this visible recovery panel.</p>
    `;
    p.querySelector("#svrVisibleRecoveryClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrVisibleRecoveryRead").onclick = () => readState();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if (show) readState();
  }

  window.SVR_VISIBLE_RECOVERY_PANEL = { state, readState, open:()=>render(true), close:()=>{ panel().style.display = "none"; }, toggle };
  window.addEventListener("keydown", ev => {
    if (ev.key === "F12" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_visible_recovery_scene_guard_ready", { detail: state }));
})();
