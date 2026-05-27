(function(){
  const BUILD = "PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK";
  const shortcuts = [
    ["?", "Open QA shortcut index"],
    ["/", "Open QA shortcut index"],
    ["C", "Tester launch card"],
    ["E", "Post-deploy checklist"],
    ["M", "One-command deploy health"],
    ["N", "One-command runbook"],
    ["O", "Auto-apply verify"],
    ["I", "Auto-apply status"],
    ["D", "Boot diagnostic"],
    ["L", "Route health"],
    ["R", "Route recovery"],
    ["V", "Deploy preflight"],
    ["T", "Smoke test"],
    ["U", "Release candidate checklist"],
    ["W", "Guided playtest wizard"],
    ["G", "Bug report panel"],
    ["J", "Tester feedback"],
    ["K", "Test queue"],
    ["B", "Test report bundle"],
    ["Z", "Demo certification"],
    ["P", "Pilot testing gate"]
  ];

  const state = {
    build: BUILD,
    phase: 252,
    publicPageTouched: false,
    shortcutCount: shortcuts.length,
    openedAt: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function panel(){
    let p = document.getElementById("svr-qa-shortcut-index");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-qa-shortcut-index";
    p.style.cssText = [
      "position:fixed","left:50%","top:50%","transform:translate(-50%,-50%)",
      "z-index:99998","width:min(720px,calc(100vw - 28px))","max-height:82vh","overflow:auto",
      "background:rgba(3,3,12,.97)","color:#f2f6ff",
      "border:1px solid rgba(150,190,255,.62)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.72)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const rows = shortcuts.map(([k,v]) => `<tr><td style="padding:5px 16px 5px 0"><kbd style="border:1px solid #9bf;border-radius:6px;padding:2px 7px;background:#0a1028">${esc(k)}</kbd></td><td>${esc(v)}</td></tr>`).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR QA Shortcut Index</b>
        <button id="svrQaShortcutClose" style="border:1px solid #9bf;background:#071020;color:#eef4ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(150,190,255,.3)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Public page:</b> locked / untouched</div>
      <div><b>Test URL:</b> /game/?v=phase252-shortcuts</div>
      <h4>Panels / test keys</h4>
      <table>${rows}</table>
      <h4>One-command update</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-FIXED.ps1"</pre>
      <p style="color:#cfe0ff;margin-bottom:0">Press ? or / to toggle this shortcut index.</p>
    `;
    p.querySelector("#svrQaShortcutClose").onclick = () => p.style.display = "none";
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    state.openedAt = new Date().toISOString();
    render(show);
    window.dispatchEvent(new CustomEvent("svr_qa_shortcut_index_update", { detail: { ...state, visible: show } }));
  }

  window.SVR_QA_SHORTCUT_INDEX = { state, shortcuts, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state, shortcuts}) };
  window.addEventListener("keydown", ev => {
    const key = ev.key || "";
    if((key === "?" || key === "/") && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_qa_shortcut_index_ready", { detail: state }));
})();
