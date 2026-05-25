(function(){
  const BUILD = "PHASE-235-VR-INPUT-SPAWN-CLEAR-LOCK";
  const state = {
    build: BUILD,
    phase: 223,
    publicPageTouched: false,
    shortcuts: [
      ["M", "Deploy health"],
      ["E", "Post-deploy checklist"],
      ["N", "One-command runbook"],
      ["O", "Auto-apply verify"],
      ["I", "Auto-apply status"],
      ["C", "Tester launch card"]
    ],
    quickChecks: [
      "Game loads past Booting",
      "No red runtime recovery panel",
      "Poker table visible",
      "Watch / HUD visible",
      "Private scene buttons work",
      "Version/deploy markers show latest phase"
    ],
    openedAt: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function panel(){
    let p = document.getElementById("svr-tester-launch-card");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-tester-launch-card";
    p.style.cssText = [
      "position:fixed","right:14px","top:110px","z-index:99997",
      "width:min(650px,calc(100vw - 28px))","max-height:74vh","overflow:auto",
      "background:rgba(5,6,18,.96)","color:#eef2ff",
      "border:1px solid rgba(120,150,255,.58)","border-radius:16px",
      "box-shadow:0 18px 60px rgba(0,0,0,.6)","padding:14px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const shortcuts = state.shortcuts.map(([k,v]) => `<tr><td style="padding:4px 12px 4px 0"><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`).join("");
    const checks = state.quickChecks.map(x => `<li>${esc(x)}</li>`).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Tester Launch Card</b>
        <button id="svrTesterCardClose" style="border:1px solid #9af;background:#070b20;color:#eef2ff;border-radius:999px;padding:4px 10px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(120,150,255,.28)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Test URL:</b> /game/?v=phase235-testercard</div>
      <div><b>Public page:</b> locked / untouched</div>
      <h4>Quick checks</h4>
      <ol>${checks}</ol>
      <h4>Shortcut map</h4>
      <table>${shortcuts}</table>
      <h4>One-command update</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-FIXED.ps1"</pre>
      <p style="color:#cfd8ff;margin-bottom:0">Press C to toggle this tester card.</p>
    `;
    p.querySelector("#svrTesterCardClose").onclick = () => p.style.display = "none";
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    state.openedAt = new Date().toISOString();
    render(show);
    window.dispatchEvent(new CustomEvent("svr_tester_launch_card_update", { detail: { ...state, visible: show } }));
  }

  window.SVR_TESTER_LAUNCH_CARD = { state, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if((ev.key || "").toLowerCase() === "c" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) toggle();
  }, true);
  window.dispatchEvent(new CustomEvent("svr_tester_launch_card_ready", { detail: state }));
})();
