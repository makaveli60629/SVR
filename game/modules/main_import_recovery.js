(function(){
  const BUILD = "PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK";
  const state = {
    build: BUILD,
    phase: 231,
    publicPageTouched: false,
    checkedAt: null,
    status: "READY",
    checks: []
  };

  const dependencies = [
    "./main.js?v=phase242",
    "./modules/enterprise_bridge_phase242.js",
    "./modules/power_deploy_wait_log.js?v=phase242",
    "./modules/power_deploy_watcher.js?v=phase242",
    "./modules/pilot_feedback_export.js?v=phase242"
  ];

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  async function probe(url){
    const full = url + (url.includes("?") ? "&" : "?") + "probe=" + Date.now();
    try {
      const r = await fetch(full, { cache: "no-store" });
      const text = await r.text();
      return { url, ok: r.ok, status: r.status, bytes: text.length, text: text.slice(0, 120) };
    } catch(err) {
      return { url, ok:false, error:String(err && err.message || err) };
    }
  }

  async function run(){
    const checks = [];
    for(const dep of dependencies) checks.push(await probe(dep));
    state.checks = checks;
    state.checkedAt = new Date().toISOString();
    state.status = checks.every(c => c.ok) ? "MAIN_IMPORTS_OK" : "MISSING_OR_BLOCKED_IMPORT";
    window.dispatchEvent(new CustomEvent("svr_main_import_recovery_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-main-import-recovery");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-main-import-recovery";
    p.style.cssText = [
      "position:fixed","left:18px","top:148px","z-index:100005",
      "width:min(800px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(8,5,16,.97)","color:#f4eeff",
      "border:1px solid rgba(210,150,255,.70)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const checks = (state.checks || []).map(c => `<li>${c.ok ? "✅" : "⚠️"} <b>${esc(c.url)}</b> — ${esc(c.status || c.error || "")} ${c.bytes ? "(" + c.bytes + " bytes)" : ""}</li>`).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Main Import Recovery</b>
        <button id="svrMainImportClose" style="border:1px solid #caf;background:#16061d;color:#f4eeff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(210,150,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Status:</b> ${esc(state.status)}</div>
      <div><b>Fix:</b> cache-busted enterprise bridge file restored for Phase 242.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrMainImportRun" style="border:1px solid #caf;background:#16061d;color:#f4eeff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Run Import Check</button>
      <ul>${checks}</ul>
      <h4>PowerShell apply + deploy + wait</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-AND-DEPLOY.ps1" -WaitForDeploy</pre>
      <p style="color:#e7cfff;margin-bottom:0">Press F8 to toggle this main import recovery panel.</p>
    `;
    p.querySelector("#svrMainImportClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrMainImportRun").onclick = () => run();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) run();
  }

  window.SVR_MAIN_IMPORT_RECOVERY = { state, run, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if(ev.key === "F8" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_main_import_recovery_ready", { detail: state }));
})();
