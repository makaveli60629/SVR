(function(){
  const BUILD = "PHASE-235-VR-INPUT-SPAWN-CLEAR-LOCK";
  const state = {
    build: BUILD,
    phase: 235,
    publicPageTouched: false,
    rightStickMove: "enabled",
    fistTeleport: "enabled",
    spawnChair: "removed/hidden",
    checkedAt: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function panel(){
    let p = document.getElementById("svr-vr-input-spawn-clear");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-vr-input-spawn-clear";
    p.style.cssText = [
      "position:fixed","right:18px","top:128px","z-index:100009",
      "width:min(760px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(3,8,14,.97)","color:#eefbff",
      "border:1px solid rgba(130,255,225,.72)","border-radius:18px",
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
        <b>SVR VR Input / Spawn Clear Recovery</b>
        <button id="svrInputSpawnClose" style="border:1px solid #8fd;background:#061d18;color:#eefbff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(130,255,225,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Right stick forward/back:</b> enabled</div>
      <div><b>Right stick left/right:</b> 45-degree snap turn retained</div>
      <div><b>Hand fist teleport:</b> make fist to aim, release fist to teleport</div>
      <div><b>Spawn chair:</b> front South Edge physical chair hidden; floor seat marker remains</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <h4>Test sequence</h4>
      <ol>
        <li>Enter VR.</li>
        <li>Push right stick forward/backward to move.</li>
        <li>Push right stick left/right to snap turn.</li>
        <li>With hand tracking, make a fist to show the teleport marker; release fist to teleport.</li>
        <li>Confirm the chair directly in front of spawn is no longer blocking the path.</li>
      </ol>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-AND-DEPLOY.ps1" -WaitForDeploy -SmokeProbe</pre>
      <p style="color:#cffff5;margin-bottom:0">Press F3 to toggle this panel.</p>
    `;
    p.querySelector("#svrInputSpawnClose").onclick = () => p.style.display = "none";
    window.dispatchEvent(new CustomEvent("svr_vr_input_spawn_clear_update", { detail: { ...state } }));
    return p;
  }

  function toggle(){
    const p = panel();
    render(p.style.display === "none");
  }

  window.SVR_VR_INPUT_SPAWN_CLEAR = {
    state,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>({...state})
  };
  window.addEventListener("keydown", ev => {
    if(ev.key === "F3" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_vr_input_spawn_clear_ready", { detail: state }));
})();
