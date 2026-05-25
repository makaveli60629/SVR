(function(){
  const BUILD = "PHASE-238-HAND-TELEPORT-PINCH-DESTINATION-LOCK";
  const state = {
    build: BUILD,
    phase: 229,
    publicPageTouched: false,
    openedAt: null,
    lastCheckedAt: null,
    checks: []
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  async function probe(url){
    const full = url + (url.includes("?") ? "&" : "?") + "v=phase238-" + Date.now();
    try {
      const r = await fetch(full, { cache: "no-store" });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch(_e) {}
      return { url, ok: r.ok, status: r.status, json, text: text.slice(0, 240) };
    } catch(err) {
      return { url, ok:false, error:String(err && err.message || err) };
    }
  }

  async function run(){
    const checks = [];
    checks.push(await probe("./version.json"));
    checks.push(await probe("./deploy-health.json"));
    checks.push(await probe("../deploy-health.json"));
    state.checks = checks;
    state.lastCheckedAt = new Date().toISOString();
    window.dispatchEvent(new CustomEvent("svr_power_deploy_watcher_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-power-deploy-watcher");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-power-deploy-watcher";
    p.style.cssText = [
      "position:fixed","left:18px","top:118px","z-index:100003",
      "width:min(780px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(3,6,14,.97)","color:#eff6ff",
      "border:1px solid rgba(120,180,255,.68)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const checks = (state.checks || []).map(c => {
      const val = (c.json && (c.json.build || c.json.phase || JSON.stringify(c.json).slice(0,140))) || c.text || c.error || "";
      return `<li>${c.ok ? "✅" : "⚠️"} <b>${esc(c.url)}</b> — ${esc(c.status || "")}<br><small>${esc(val)}</small></li>`;
    }).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Power Deploy Watcher</b>
        <button id="svrPowerDeployClose" style="border:1px solid #8bf;background:#06121d;color:#eff6ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(120,180,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <div><b>Checked:</b> ${esc(state.lastCheckedAt || "not yet")}</div>
      <h4>PowerShell-only deploy</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-AND-DEPLOY.ps1"</pre>
      <h4>First-time GitHub CLI setup</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">winget install --id GitHub.cli -e
gh auth login</pre>
      <button id="svrPowerDeployCheck" style="border:1px solid #8bf;background:#06121d;color:#eff6ff;border-radius:999px;padding:7px 12px;cursor:pointer">Check Live Deploy Markers</button>
      <h4>Live evidence</h4>
      <ul>${checks}</ul>
      <p style="color:#cfe4ff;margin-bottom:0">Press F6 to toggle this Power Deploy Watcher.</p>
    `;
    p.querySelector("#svrPowerDeployClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrPowerDeployCheck").onclick = () => run();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    state.openedAt = new Date().toISOString();
    render(show);
    if(show) run();
    window.dispatchEvent(new CustomEvent("svr_power_deploy_watcher_toggle", { detail: { ...state, visible: show } }));
  }

  window.SVR_POWER_DEPLOY_WATCHER = { state, run, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if(ev.key === "F6" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_power_deploy_watcher_ready", { detail: state }));
})();
