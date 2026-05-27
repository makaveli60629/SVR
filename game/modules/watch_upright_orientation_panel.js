(function(){
  const BUILD = "PHASE-253-FORWARD-RESTORE-LOCOMOTION-KIOSK-POKER-LOCK";
  const state = {
    build: BUILD,
    phase: 253,
    publicPageTouched: false,
    checkedAt: null,
    watchState: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function readState(){
    state.checkedAt = new Date().toISOString();
    state.watchState = window.SVR_WATCH_UPRIGHT_STATE || null;
    window.dispatchEvent(new CustomEvent("svr_watch_upright_panel_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-watch-upright-orientation-panel");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-watch-upright-orientation-panel";
    p.style.cssText = [
      "position:fixed","left:18px","top:176px","z-index:100015",
      "width:min(820px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(5,7,13,.97)","color:#eff7ff",
      "border:1px solid rgba(155,210,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    const watchState = state.watchState || window.SVR_WATCH_UPRIGHT_STATE || null;
    const stateText = watchState ? JSON.stringify(watchState, null, 2) : "No watch state yet. Raise your watch hand in VR.";
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Watch Upright Orientation</b>
        <button id="svrWatchUprightClose" style="border:1px solid #9df;background:#06131d;color:#eff7ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(155,210,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Fix:</b> watch auto-rolls 180° only when camera-up detects it is upside down.</div>
      <div><b>Face direction:</b> watch screen still faces the player/camera.</div>
      <div><b>Controls:</b> button hit testing stays aligned because the full watch group is corrected.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrWatchUprightRead" style="border:1px solid #9df;background:#06131d;color:#eff7ff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Read Watch Orientation</button>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px;max-height:330px;overflow:auto">${esc(stateText)}</pre>
      <h4>Test</h4>
      <ol>
        <li>Raise the watch hand.</li>
        <li>The text should read upright instead of upside down.</li>
        <li>Press the watch teleport button to confirm touches still align.</li>
      </ol>
      <p style="color:#dcefff;margin-bottom:0">Press F6 to toggle this watch orientation panel.</p>
    `;
    p.querySelector("#svrWatchUprightClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrWatchUprightRead").onclick = () => readState();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) readState();
  }

  window.SVR_WATCH_UPRIGHT_ORIENTATION_PANEL = {
    state,
    readState,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>JSON.parse(JSON.stringify(state))
  };

  window.addEventListener("keydown", ev => {
    if(ev.key === "F6" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.addEventListener("svr_watch_upright_update", ev => {
    state.watchState = ev.detail || null;
  });
  window.dispatchEvent(new CustomEvent("svr_watch_upright_panel_ready", { detail: state }));
})();
