(function(){
  const BUILD = "PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK";
  const aliases = [
    "./modules/enterprise_bridge.js",
    "./modules/enterprise_bridge_phase229.js",
    "./modules/enterprise_bridge_phase230.js",
    "./modules/enterprise_bridge_phase242.js",
    "./modules/enterprise_bridge_phase242.js"
  ];
  const state = {
    build: BUILD,
    phase: 232,
    publicPageTouched: false,
    checkedAt: null,
    status: "READY",
    aliases,
    checks: []
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  async function probe(url){
    const full = url + (url.includes("?") ? "&" : "?") + "v=phase242-" + Date.now();
    try {
      const r = await fetch(full, { cache: "no-store" });
      const text = await r.text();
      return { url, ok: r.ok, status: r.status, bytes: text.length, text: text.slice(0, 100) };
    } catch(err) {
      return { url, ok:false, error:String(err && err.message || err) };
    }
  }

  async function run(){
    const checks = [];
    for(const alias of aliases) checks.push(await probe(alias));
    checks.push(await probe("./main.js?v=phase242"));
    state.checks = checks;
    state.checkedAt = new Date().toISOString();
    state.status = checks.every(c => c.ok) ? "BRIDGE_ALIASES_OK" : "MISSING_ALIAS";
    window.dispatchEvent(new CustomEvent("svr_bridge_alias_recovery_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-bridge-alias-recovery");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-bridge-alias-recovery";
    p.style.cssText = [
      "position:fixed","left:18px","bottom:18px","z-index:100006",
      "width:min(820px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(4,6,14,.97)","color:#f2f8ff",
      "border:1px solid rgba(125,190,255,.70)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const rows = (state.checks || []).map(c => `<li>${c.ok ? "✅" : "⚠️"} <b>${esc(c.url)}</b> — ${esc(c.status || c.error || "")} ${c.bytes ? "(" + c.bytes + " bytes)" : ""}</li>`).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Bridge Alias Recovery</b>
        <button id="svrBridgeAliasClose" style="border:1px solid #9cf;background:#06121d;color:#f2f8ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(125,190,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Status:</b> ${esc(state.status)}</div>
      <div><b>Fix:</b> phase229/230/231/232 bridge aliases are present so stale main.js imports cannot 404.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrBridgeAliasRun" style="border:1px solid #9cf;background:#06121d;color:#f2f8ff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Run Alias Check</button>
      <ul>${rows}</ul>
      <h4>PowerShell apply + deploy + wait</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-AND-DEPLOY.ps1" -WaitForDeploy</pre>
      <p style="color:#d7eaff;margin-bottom:0">Press F9 to toggle this bridge alias recovery panel.</p>
    `;
    p.querySelector("#svrBridgeAliasClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrBridgeAliasRun").onclick = () => run();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) run();
  }

  window.SVR_BRIDGE_ALIAS_RECOVERY = { state, run, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if(ev.key === "F9" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_bridge_alias_recovery_ready", { detail: state }));
})();
