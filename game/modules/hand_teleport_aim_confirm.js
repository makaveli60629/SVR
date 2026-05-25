(function(){
  const BUILD = "PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK";
  const state = {
    build: BUILD,
    phase: 239,
    publicPageTouched: false,
    checkedAt: null,
    handState: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function readState(){
    state.checkedAt = new Date().toISOString();
    state.handState = window.SVR_HAND_TELEPORT_STATE || null;
    window.dispatchEvent(new CustomEvent("svr_hand_teleport_aim_confirm_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-hand-teleport-aim-confirm");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-hand-teleport-aim-confirm";
    p.style.cssText = [
      "position:fixed","right:18px","top:164px","z-index:100013",
      "width:min(840px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(4,7,14,.97)","color:#f3fbff",
      "border:1px solid rgba(165,225,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    const handState = state.handState || window.SVR_HAND_TELEPORT_STATE || null;
    const stateText = handState ? JSON.stringify(handState, null, 2) : "No hand teleport state yet. Turn teleport ON near face/chin first.";
    const targetText = handState && handState.target ? `x=${handState.target.x}, z=${handState.target.z}` : "no locked target yet";
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Hand Teleport Aim Confirm</b>
        <button id="svrHandAimClose" style="border:1px solid #9df;background:#06131d;color:#f3fbff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(165,225,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Mode:</b> face/chin toggle, point + pinch destination</div>
      <div><b>Destination:</b> ${esc(targetText)}</div>
      <div><b>Rule:</b> release alone never cancels or teleports; only face toggle or pointed pinch acts.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrHandAimRead" style="border:1px solid #9df;background:#06131d;color:#f3fbff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Read Hand Teleport State</button>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px;max-height:330px;overflow:auto">${esc(stateText)}</pre>
      <h4>Correct test</h4>
      <ol>
        <li>Look at hand near face/chin.</li>
        <li>Pinch/fist once: teleport turns ON.</li>
        <li>Point at floor; wait for destination ring to glow.</li>
        <li>Pinch while pointing: teleport executes.</li>
        <li>To cancel, hand near face/chin + pinch/fist.</li>
      </ol>
      <p style="color:#d9f1ff;margin-bottom:0">Press F2 to toggle this aim confirmation panel.</p>
    `;
    p.querySelector("#svrHandAimClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrHandAimRead").onclick = () => readState();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) readState();
  }

  window.SVR_HAND_TELEPORT_AIM_CONFIRM = {
    state,
    readState,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>JSON.parse(JSON.stringify(state))
  };

  window.addEventListener("keydown", ev => {
    if(ev.key === "F2" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.addEventListener("svr_hand_teleport_state_update", ev => {
    state.handState = ev.detail || null;
  });
  window.dispatchEvent(new CustomEvent("svr_hand_teleport_aim_confirm_ready", { detail: state }));
})();
