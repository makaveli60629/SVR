(function(){
  const BUILD = "PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK";
  const state = {
    build: BUILD,
    phase: 252,
    publicPageTouched: false,
    mode: "face-toggle-point-pinch",
    checkedAt: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function panel(){
    let p = document.getElementById("svr-hand-teleport-pinch-destination");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-hand-teleport-pinch-destination";
    p.style.cssText = [
      "position:fixed","left:18px","top:152px","z-index:100012",
      "width:min(820px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(5,7,13,.97)","color:#f3fbff",
      "border:1px solid rgba(160,220,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    state.checkedAt = new Date().toISOString();
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Hand Teleport: Face Toggle / Point Pinch</b>
        <button id="svrHandTpClose" style="border:1px solid #9df;background:#06131d;color:#f3fbff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(160,220,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>New rule:</b> face/chin pinch or fist toggles teleport ON/OFF only.</div>
      <div><b>Destination rule:</b> point away from face and pinch to teleport to the marker.</div>
      <div><b>Release rule:</b> release by itself does not shut teleport off.</div>
      <div><b>Quest movement:</b> right-stick autocalibration preserved.</div>
      <div><b>Spawn chair:</b> front chair clear preserved.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <h4>Test sequence</h4>
      <ol>
        <li>Look at your hand near your face/chin.</li>
        <li>Pinch or make fist once to turn teleport ON.</li>
        <li>Point at the floor destination.</li>
        <li>Pinch while pointing. That destination should teleport immediately.</li>
        <li>To cancel/turn off, bring hand back near face/chin and pinch or fist again.</li>
      </ol>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-AND-DEPLOY.ps1" -WaitForDeploy -SmokeProbe</pre>
      <p style="color:#d9f1ff;margin-bottom:0">Press F1 to toggle this hand teleport panel.</p>
    `;
    p.querySelector("#svrHandTpClose").onclick = () => p.style.display = "none";
    window.dispatchEvent(new CustomEvent("svr_hand_teleport_pinch_destination_update", { detail: { ...state } }));
    return p;
  }

  function toggle(){
    const p = panel();
    render(p.style.display === "none");
  }

  window.SVR_HAND_TELEPORT_PINCH_DESTINATION = {
    state,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>({...state})
  };

  window.addEventListener("keydown", ev => {
    if(ev.key === "F1" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_hand_teleport_pinch_destination_ready", { detail: state }));
})();
