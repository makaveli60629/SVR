(function(){
  const BUILD = "PHASE-253-FORWARD-RESTORE-LOCOMOTION-KIOSK-POKER-LOCK";
  const state = {
    build: BUILD,
    phase: 253,
    sourceBaseline: "PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK",
    publicPageTouched: false,
    restoredForward: true,
    fixes: [
      "Quest right-controller teleport ray forced in front of body",
      "Controller teleport is hold A/grip/trigger and release to teleport",
      "Hand teleport is face pinch/fist toggle only; pointed pinch teleports",
      "Right-stick forward uses snap-turn yaw so forward does not drift sideways",
      "Removed spawn/back-body teleport-machine fire arch",
      "Moon and Mars raised high above skyline",
      "Poker deal order relocked left-to-right from dealer button",
      "Cards and table tags raised and enlarged",
      "Table overlay/board glow reduced for readability"
    ],
    checkedAt: new Date().toISOString()
  };

  function esc(v){ return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s])); }
  function panel(){
    let p = document.getElementById("svr-phase252-forward-restore");
    if (p) return p;
    p = document.createElement("div");
    p.id = "svr-phase252-forward-restore";
    p.style.cssText = [
      "position:fixed","left:18px","top:92px","z-index:100030",
      "width:min(860px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(6,8,18,.96)","color:#f4fbff",
      "border:1px solid rgba(130,255,220,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }
  function render(show=true){
    const p = panel();
    if (show) p.style.display = "block";
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Phase 253 Forward Restore</b>
        <button id="svr252Close" style="border:1px solid #8fd;background:#061d18;color:#efffff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(130,255,220,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Returned baseline:</b> Phase 244 stable runtime, advanced forward as Phase 253.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px;max-height:360px;overflow:auto">${esc(JSON.stringify(state, null, 2))}</pre>
      <p style="color:#d6fff5;margin-bottom:0">Press F8 to toggle this manifest.</p>
    `;
    p.querySelector("#svr252Close").onclick = () => p.style.display = "none";
    return p;
  }
  function toggle(){ const p = panel(); render(p.style.display === "none"); }
  window.SVR_PHASE252_FORWARD_RESTORE = { state, open:()=>render(true), close:()=>{panel().style.display="none"}, toggle, snapshot:()=>JSON.parse(JSON.stringify(state)) };
  window.addEventListener("keydown", ev => { if (ev.key === "F8" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) { ev.preventDefault(); toggle(); } }, true);
  window.dispatchEvent(new CustomEvent("svr_phase252_forward_restore_ready", { detail: state }));
})();
