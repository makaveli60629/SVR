(function(){
  const BUILD = "PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK";
  const state = {
    build: BUILD,
    phase: 242,
    publicPageTouched: false,
    checkedAt: null,
    watch: null,
    teleport: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function readState(){
    state.checkedAt = new Date().toISOString();
    state.watch = {
      upright: window.SVR_WATCH_UPRIGHT_STATE || null,
      interaction: window.SVR_WATCH_INTERACTION_STATE || null
    };
    state.teleport = {
      hand: window.SVR_HAND_TELEPORT_STATE || null,
      input: window.SVR_TELEPORT_INPUT_STATE || null
    };
    window.dispatchEvent(new CustomEvent("svr_watch_teleport_conflict_guard_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-watch-teleport-conflict-guard");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-watch-teleport-conflict-guard";
    p.style.cssText = [
      "position:fixed","right:18px","top:186px","z-index:100016",
      "width:min(840px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(5,7,13,.97)","color:#eff8ff",
      "border:1px solid rgba(120,220,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    const text = JSON.stringify({ state, watchInteraction: window.SVR_WATCH_INTERACTION_STATE || null, watchUpright: window.SVR_WATCH_UPRIGHT_STATE || null, handTeleport: window.SVR_HAND_TELEPORT_STATE || null }, null, 2);
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Watch / Teleport Conflict Guard</b>
        <button id="svrWatchTpGuardClose" style="border:1px solid #8df;background:#06131d;color:#eff8ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(120,220,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Fix:</b> hand teleport pauses while the watch is being viewed/touched.</div>
      <div><b>Black-square guard:</b> watch screen is double-sided and refreshed by texture heartbeat.</div>
      <div><b>Watch:</b> upright orientation correction remains.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrWatchTpGuardRead" style="border:1px solid #8df;background:#06131d;color:#eff8ff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Read Guard State</button>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px;max-height:340px;overflow:auto">${esc(text)}</pre>
      <h4>Test</h4>
      <ol>
        <li>Turn teleport ON.</li>
        <li>Look at the watch and bring the input finger near the screen.</li>
        <li>The watch should stay readable; teleport should pause instead of freezing.</li>
        <li>Move hand away from the watch and point/pinch at floor to teleport.</li>
      </ol>
      <p style="color:#dcefff;margin-bottom:0">Press F7 to toggle this guard panel.</p>
    `;
    p.querySelector("#svrWatchTpGuardClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrWatchTpGuardRead").onclick = () => readState();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) readState();
  }

  window.SVR_WATCH_TELEPORT_CONFLICT_GUARD = {
    state,
    readState,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>JSON.parse(JSON.stringify(state))
  };

  window.addEventListener("keydown", ev => {
    if(ev.key === "F7" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.addEventListener("svr_watch_interaction_update", ev => { state.watch = { ...(state.watch || {}), interaction: ev.detail }; });
  window.dispatchEvent(new CustomEvent("svr_watch_teleport_conflict_guard_ready", { detail: state }));
})();
