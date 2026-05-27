(function(){
  const BUILD = "PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK";
  const routes = [
    ["Game index", "./index.html"],
    ["Main module", "./main.js?v=phase252"],
    ["Version", "./version.json"],
    ["Game deploy health", "./deploy-health.json"],
    ["Root deploy health", "../deploy-health.json"],
    ["Optional loader", "./modules/optional_module_loader.js?v=phase252"],
    ["Stable bridge", "./modules/enterprise_bridge.js"],
    ["Phase 230 bridge alias", "./modules/enterprise_bridge_phase252.js"],
    ["Phase 244 bridge alias", "./modules/enterprise_bridge_phase252.js"],
    ["Boot fallback", "./modules/boot_fallback.js?v=phase252"]
  ];

  const state = {
    build: BUILD,
    phase: 252,
    publicPageTouched: false,
    checkedAt: null,
    status: "READY",
    checks: []
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  async function probe(label, url){
    const full = url + (url.includes("?") ? "&" : "?") + "probe=phase252-" + Date.now();
    const started = performance.now();
    try {
      const r = await fetch(full, { cache: "no-store" });
      const text = await r.text();
      const ms = Math.round(performance.now() - started);
      let json = null;
      try { json = JSON.parse(text); } catch(_e) {}
      const hasPhase = text.includes("PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK") || text.includes("phase252") || text.includes('"phase": 252') || text.includes('"phase": 252');
      return { label, url, ok: r.ok, status: r.status, ms, bytes: text.length, hasPhase, json, sample: text.slice(0, 180) };
    } catch(err) {
      return { label, url, ok: false, error: String(err && err.message || err) };
    }
  }

  async function run(){
    const checks = [];
    for(const [label, url] of routes) checks.push(await probe(label, url));
    state.checks = checks;
    state.checkedAt = new Date().toISOString();
    const requiredOk = checks.filter(x => ["Main module","Version","Optional loader","Stable bridge","Phase 244 bridge alias"].includes(x.label)).every(x => x.ok);
    const phaseVisible = checks.some(x => x.hasPhase);
    state.status = requiredOk && phaseVisible ? "SMOKE_PROBE_OK" : "NEEDS_REVIEW";
    window.dispatchEvent(new CustomEvent("svr_power_deploy_smoke_probe_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-power-deploy-smoke-probe");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-power-deploy-smoke-probe";
    p.style.cssText = [
      "position:fixed","left:18px","top:118px","z-index:100008",
      "width:min(840px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(3,7,13,.97)","color:#f0fbff",
      "border:1px solid rgba(120,230,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const rows = (state.checks || []).map(c => {
      const marker = c.hasPhase ? " · phase252" : "";
      const detail = c.error || ((c.status || "") + " · " + (c.ms || "?") + "ms · " + (c.bytes || 0) + " bytes" + marker);
      return `<tr><td>${c.ok ? "✅" : "⚠️"}</td><td><b>${esc(c.label)}</b></td><td>${esc(c.url)}</td><td>${esc(detail)}</td></tr>`;
    }).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Power Deploy Smoke Probe</b>
        <button id="svrSmokeProbeClose" style="border:1px solid #8df;background:#06171d;color:#f0fbff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(120,230,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Status:</b> ${esc(state.status)}</div>
      <div><b>Checked:</b> ${esc(state.checkedAt || "not yet")}</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrSmokeProbeRun" style="border:1px solid #8df;background:#06171d;color:#f0fbff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Run Smoke Probe</button>
      <table style="width:100%;border-collapse:collapse;margin-top:10px">${rows || "<tr><td>No checks yet</td></tr>"}</table>
      <h4>PowerShell apply + deploy + wait + smoke probe</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-AND-DEPLOY.ps1" -WaitForDeploy -SmokeProbe</pre>
      <p style="color:#ccf5ff;margin-bottom:0">Press F12 to toggle this smoke probe panel.</p>
    `;
    p.querySelector("#svrSmokeProbeClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrSmokeProbeRun").onclick = () => run();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) run();
  }

  window.SVR_POWER_DEPLOY_SMOKE_PROBE = { state, routes, run, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>JSON.parse(JSON.stringify(state)) };
  window.addEventListener("keydown", ev => {
    if(ev.key === "F12" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_power_deploy_smoke_probe_ready", { detail: state }));
})();
