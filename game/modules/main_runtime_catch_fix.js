(function(){
  const BUILD = "PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK";
  const PHASE = 244;
  const state = {
    build: BUILD,
    phase: PHASE,
    publicPageTouched: false,
    checkedAt: null,
    mainState: null,
    lastRuntimeError: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function readState(){
    state.checkedAt = new Date().toISOString();
    state.mainState = window.SVR_MAIN_RUNTIME_STATE || null;
    state.lastRuntimeError = state.mainState?.lastAnimationError || null;
    window.dispatchEvent(new CustomEvent("svr_main_runtime_catch_fix_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-main-runtime-catch-fix");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-main-runtime-catch-fix";
    p.style.cssText = [
      "position:fixed","right:18px","top:206px","z-index:100018",
      "width:min(860px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(7,6,12,.97)","color:#f5f2ff",
      "border:1px solid rgba(180,150,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    const text = JSON.stringify({ state, mainRuntime: window.SVR_MAIN_RUNTIME_STATE || null }, null, 2);
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Main Runtime Catch Fix</b>
        <button id="svrMainRuntimeClose" style="border:1px solid #caf;background:#12091d;color:#f5f2ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(180,150,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Fix:</b> main.js no longer references undefined PHASE.build inside the animation-loop catch block.</div>
      <div><b>Quest guard:</b> animation errors are logged/recovered instead of re-thrown into WebXR.</div>
      <div><b>Deploy sync:</b> Phase 243 forced deploy marker retained.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrMainRuntimeRead" style="border:1px solid #caf;background:#12091d;color:#f5f2ff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Read Runtime State</button>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px;max-height:340px;overflow:auto">${esc(text)}</pre>
      <p style="color:#e3d7ff;margin-bottom:0">Press F9 to toggle this main runtime panel.</p>
    `;
    p.querySelector("#svrMainRuntimeClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrMainRuntimeRead").onclick = () => readState();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) readState();
  }

  window.SVR_MAIN_RUNTIME_CATCH_FIX = {
    state,
    readState,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>JSON.parse(JSON.stringify(state))
  };

  window.addEventListener("svr_main_runtime_error", ev => {
    state.lastRuntimeError = ev.detail || null;
  });
  window.addEventListener("keydown", ev => {
    if(ev.key === "F9" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_main_runtime_catch_fix_ready", { detail: state }));
})();
