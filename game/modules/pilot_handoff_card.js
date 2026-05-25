(function(){
  const BUILD = "PHASE-226-PILOT-READY-SUMMARY-LOCK";
  const state = {
    build: BUILD,
    phase: 225,
    publicPageTouched: false,
    openedAt: null,
    mustPass: [
      "Game loads past Booting",
      "No red runtime error or recovery panel",
      "Poker table and controls are visible",
      "Watch/HUD panels are visible",
      "Private scene links open",
      "Version marker matches Phase 226"
    ],
    reportItems: [
      "Device/browser used",
      "Exact URL tested",
      "What button or key was pressed",
      "Screenshot of any red error panel",
      "Whether reload fixed the issue"
    ]
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function panel(){
    let p = document.getElementById("svr-pilot-handoff-card");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-pilot-handoff-card";
    p.style.cssText = [
      "position:fixed","right:16px","top:128px","z-index:99999",
      "width:min(680px,calc(100vw - 32px))","max-height:78vh","overflow:auto",
      "background:rgba(6,6,16,.97)","color:#f6fbff",
      "border:1px solid rgba(130,255,230,.62)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.72)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const mustPass = state.mustPass.map(x => `<li>${esc(x)}</li>`).join("");
    const reports = state.reportItems.map(x => `<li>${esc(x)}</li>`).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Pilot Handoff Card</b>
        <button id="svrPilotHandoffClose" style="border:1px solid #8fe;background:#061d1a;color:#f6fbff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(130,255,230,.3)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Tester URL:</b> /game/?v=phase226-handoff</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <h4>Must-pass checks</h4>
      <ol>${mustPass}</ol>
      <h4>Report these details if something fails</h4>
      <ol>${reports}</ol>
      <h4>Useful keys</h4>
      <table>
        <tr><td><b>?</b> or <b>/</b></td><td>QA shortcut index</td></tr>
        <tr><td><b>E</b></td><td>Post-deploy checklist</td></tr>
        <tr><td><b>M</b></td><td>Deploy health</td></tr>
        <tr><td><b>G</b></td><td>Bug report panel</td></tr>
        <tr><td><b>H</b></td><td>Pilot handoff card</td></tr>
      </table>
      <h4>Owner update command</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-FIXED.ps1"</pre>
      <p style="color:#bffef3;margin-bottom:0">Press H to toggle this pilot handoff card.</p>
    `;
    p.querySelector("#svrPilotHandoffClose").onclick = () => p.style.display = "none";
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    state.openedAt = new Date().toISOString();
    render(show);
    window.dispatchEvent(new CustomEvent("svr_pilot_handoff_card_update", { detail: { ...state, visible: show } }));
  }

  window.SVR_PILOT_HANDOFF_CARD = { state, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if((ev.key || "").toLowerCase() === "h" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) toggle();
  }, true);
  window.dispatchEvent(new CustomEvent("svr_pilot_handoff_card_ready", { detail: state }));
})();
