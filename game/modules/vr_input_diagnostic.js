(function(){
  const BUILD = "PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK";
  const state = {
    build: BUILD,
    phase: 236,
    publicPageTouched: false,
    lastSampleAt: null,
    samples: [],
    status: "READY"
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function getPads(){
    let pads = [];
    try {
      pads = Array.from(navigator.getGamepads ? navigator.getGamepads() : []).filter(Boolean);
    } catch(_err) {}
    return pads.map((gp, index)=>({
      index,
      id: gp.id || "",
      mapping: gp.mapping || "",
      connected: gp.connected,
      axes: Array.from(gp.axes || []).map(v => Math.round(v * 1000) / 1000),
      buttons: Array.from(gp.buttons || []).map((b,i)=>({ i, pressed: !!b.pressed, value: Math.round((b.value || 0) * 1000) / 1000 })).filter(b=>b.pressed || b.value > 0.05)
    }));
  }

  function sample(){
    const pads = getPads();
    state.lastSampleAt = new Date().toISOString();
    state.samples = pads;
    const anyForward = pads.some(gp => gp.axes.some(v => Math.abs(v) > 0.15));
    state.status = pads.length ? (anyForward ? "AXES_ACTIVE" : "GAMEPADS_SEEN_IDLE") : "NO_BROWSER_GAMEPADS_VISIBLE";
    window.dispatchEvent(new CustomEvent("svr_vr_input_diagnostic_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-vr-input-diagnostic");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-vr-input-diagnostic";
    p.style.cssText = [
      "position:fixed","left:18px","top:138px","z-index:100010",
      "width:min(840px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(3,8,14,.97)","color:#ecfbff",
      "border:1px solid rgba(100,240,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    const padRows = (state.samples || []).map(gp => `
      <li>
        <b>Gamepad #${gp.index}</b> ${esc(gp.id)}<br>
        <small>mapping=${esc(gp.mapping)} connected=${esc(gp.connected)} axes=${esc(JSON.stringify(gp.axes))}</small><br>
        <small>active buttons=${esc(JSON.stringify(gp.buttons))}</small>
      </li>
    `).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR VR Input Diagnostic</b>
        <button id="svrInputDiagClose" style="border:1px solid #8ef;background:#06171d;color:#ecfbff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(100,240,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Status:</b> ${esc(state.status)}</div>
      <div><b>Sample:</b> ${esc(state.lastSampleAt || "not yet")}</div>
      <div><b>Right stick target:</b> Y axis moves forward/back; X axis snap-turns 45 degrees.</div>
      <div><b>Hand target:</b> hold fist or pinch to aim; release to teleport.</div>
      <div><b>Spawn path:</b> front chair hidden/cleared.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrInputDiagSample" style="border:1px solid #8ef;background:#06171d;color:#ecfbff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Sample Controller Axes</button>
      <h4>Controller/gamepad samples</h4>
      <ul>${padRows || "<li>No browser gamepads visible yet. In immersive VR, use the in-game status text and controller movement test.</li>"}</ul>
      <h4>Test sequence</h4>
      <ol>
        <li>Enter VR mode.</li>
        <li>Push right stick forward/back and confirm body moves.</li>
        <li>Push right stick left/right and confirm 45-degree snap turn.</li>
        <li>Enable hand tracking, make a fist to show teleport marker, release to teleport.</li>
        <li>Confirm the chair directly in front of spawn is not blocking your path.</li>
      </ol>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-AND-DEPLOY.ps1" -WaitForDeploy -SmokeProbe</pre>
      <p style="color:#cff8ff;margin-bottom:0">Press F5 to toggle this diagnostic panel.</p>
    `;
    p.querySelector("#svrInputDiagClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrInputDiagSample").onclick = () => sample();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) sample();
  }

  window.SVR_VR_INPUT_DIAGNOSTIC = {
    state,
    sample,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>JSON.parse(JSON.stringify(state))
  };

  window.addEventListener("keydown", ev => {
    if(ev.key === "F5" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_vr_input_diagnostic_ready", { detail: state }));
})();
