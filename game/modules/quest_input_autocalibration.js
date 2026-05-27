(function(){
  const BUILD = "PHASE-253-FORWARD-RESTORE-LOCOMOTION-KIOSK-POKER-LOCK";
  const state = {
    build: BUILD,
    phase: 253,
    publicPageTouched: false,
    checkedAt: null,
    lastInput: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function readInput(){
    const input = window.SVR_TELEPORT_INPUT_STATE || null;
    state.checkedAt = new Date().toISOString();
    state.lastInput = input;
    window.dispatchEvent(new CustomEvent("svr_quest_input_autocalibration_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-quest-input-autocalibration");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-quest-input-autocalibration";
    p.style.cssText = [
      "position:fixed","right:18px","top:148px","z-index:100011",
      "width:min(840px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(4,7,13,.97)","color:#f1fbff",
      "border:1px solid rgba(130,215,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    const input = state.lastInput || window.SVR_TELEPORT_INPUT_STATE || null;
    const inputText = input ? JSON.stringify(input, null, 2) : "No XR controller input state yet. Enter VR and move the sticks.";
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Quest Input Autocalibration</b>
        <button id="svrQuestInputClose" style="border:1px solid #8cf;background:#06141d;color:#f1fbff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(130,215,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Right stick:</b> auto-calibrates between axes [2,3] and [0,1]</div>
      <div><b>Movement:</b> right-stick Y moves forward/back, left stick still works</div>
      <div><b>Turn:</b> right-stick X snap-turns 45 degrees</div>
      <div><b>Teleport:</b> face pinch/fist toggles hand TP; pointed pinch teleports</div>
      <div><b>Spawn:</b> front chair clear remains locked</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrQuestInputRead" style="border:1px solid #8cf;background:#06141d;color:#f1fbff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Read Live Input State</button>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px;max-height:330px;overflow:auto">${esc(inputText)}</pre>
      <h4>Test sequence</h4>
      <ol>
        <li>Enter VR.</li>
        <li>Push right stick forward/back. Movement source should show <b>right-stick-y</b>.</li>
        <li>Push right stick left/right. Snap turn should still work.</li>
        <li>Use hand tracking: hold fist to aim, release fist to teleport.</li>
      </ol>
      <p style="color:#d6f3ff;margin-bottom:0">Press F11 to toggle this autocalibration panel.</p>
    `;
    p.querySelector("#svrQuestInputClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrQuestInputRead").onclick = () => readInput();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) readInput();
  }

  window.SVR_QUEST_INPUT_AUTOCALIBRATION = {
    state,
    readInput,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>JSON.parse(JSON.stringify(state))
  };

  window.addEventListener("keydown", ev => {
    if(ev.key === "F11" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_quest_input_autocalibration_ready", { detail: state }));
})();
