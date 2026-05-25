(function(){
  const BUILD = "PHASE-223-TESTER-LAUNCH-CARD-LOCK";
  const state = {
    build: BUILD,
    phase: 221,
    publicPageTouched: false,
    openedAt: null,
    steps: [
      "Download latest SVR_PHASE###_NEXT_PACKET.zip",
      "Keep SVR-AUTO-APPLY-NEXT-FIXED.ps1 in Downloads",
      "Run one PowerShell command from C:\\Users\\ronal\\SVR",
      "Run GitHub Actions Auto Deploy",
      "Test with cache-bust URL"
    ]
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function panel(){
    let p = document.getElementById("svr-one-command-runbook");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-one-command-runbook";
    p.style.cssText = [
      "position:fixed","right:14px","bottom:14px","z-index:99995",
      "width:min(640px,calc(100vw - 28px))","max-height:74vh","overflow:auto",
      "background:rgba(4,3,13,.96)","color:#f3ecff",
      "border:1px solid rgba(195,135,255,.55)","border-radius:16px",
      "box-shadow:0 18px 60px rgba(0,0,0,.6)","padding:14px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const stepList = state.steps.map((s,i)=>`<li><b>${i+1}.</b> ${esc(s)}</li>`).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR One-Command Runbook</b>
        <button id="svrRunbookClose" style="border:1px solid #c8f;background:#17061d;color:#f7eaff;border-radius:999px;padding:4px 10px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(195,135,255,.28)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Public page:</b> locked / untouched</div>
      <ol>${stepList}</ol>
      <div><b>PowerShell:</b></div>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-FIXED.ps1"</pre>
      <div><b>Deploy:</b> GitHub → Actions → Auto Deploy → Run workflow → main</div>
      <div><b>Test:</b> /game/?v=phase223-runbook</div>
      <p style="color:#dec8ff;margin-bottom:0">Press N to toggle this runbook.</p>
    `;
    p.querySelector("#svrRunbookClose").onclick = () => p.style.display = "none";
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    state.openedAt = new Date().toISOString();
    render(show);
    window.dispatchEvent(new CustomEvent("svr_one_command_runbook_update", { detail: { ...state, visible: show } }));
  }

  window.SVR_ONE_COMMAND_RUNBOOK = { state, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if((ev.key || "").toLowerCase() === "n" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) toggle();
  }, true);
  window.dispatchEvent(new CustomEvent("svr_one_command_runbook_ready", { detail: state }));
})();
