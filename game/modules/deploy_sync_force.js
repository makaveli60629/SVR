(function(){
  const BUILD = "PHASE-252-FORWARD-RESTORE-QUEST-POKER-LOCK";
  const PHASE = 243;
  const state = {
    build: BUILD,
    phase: PHASE,
    publicPageTouched: false,
    checkedAt: null,
    checks: []
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  async function probe(label, url, expect){
    const full = url + (url.includes("?") ? "&" : "?") + "bust=phase252-" + Date.now();
    const started = performance.now();
    try {
      const r = await fetch(full, { cache: "no-store" });
      const text = await r.text();
      const ms = Math.round(performance.now() - started);
      const ok = r.ok && (!expect || text.includes(expect));
      return { label, url, ok, status: r.status, ms, bytes: text.length, expect: expect || "", sample: text.slice(0, 180) };
    } catch(err) {
      return { label, url, ok:false, error:String(err && err.message || err), expect: expect || "" };
    }
  }

  async function run(){
    state.checkedAt = new Date().toISOString();
    state.checks = [
      await probe("game index", "./index.html", BUILD),
      await probe("boot.js", "./boot.js?v=phase252", "main.js?v=phase252"),
      await probe("main.js", "./main.js?v=phase252", "optional_module_loader"),
      await probe("version.json", "./version.json", BUILD),
      await probe("deploy-health", "./deploy-health.json", BUILD),
      await probe("deploy-sync-force", "./deploy-sync-force.json", BUILD)
    ];
    window.dispatchEvent(new CustomEvent("svr_deploy_sync_force_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-deploy-sync-force");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-deploy-sync-force";
    p.style.cssText = [
      "position:fixed","left:18px","top:196px","z-index:100017",
      "width:min(860px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(5,8,14,.97)","color:#eff8ff",
      "border:1px solid rgba(90,220,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    const rows = (state.checks || []).map(c => {
      const detail = c.error || `${c.status} · ${c.ms}ms · ${c.bytes} bytes` + (c.expect ? ` · expect=${c.expect}` : "");
      return `<tr><td>${c.ok ? "✅" : "⚠️"}</td><td><b>${esc(c.label)}</b></td><td>${esc(c.url)}</td><td>${esc(detail)}</td></tr>`;
    }).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Deploy Sync Force</b>
        <button id="svrDeploySyncClose" style="border:1px solid #8df;background:#06131d;color:#eff8ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(90,220,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Purpose:</b> force live Pages deploy sync past stale Phase 238 cache.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrDeploySyncRun" style="border:1px solid #8df;background:#06131d;color:#eff8ff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Run Phase 244 Live Check</button>
      <table style="width:100%;border-collapse:collapse;margin-top:10px">${rows || "<tr><td>No checks yet</td></tr>"}</table>
      <h4>Forced PowerShell command</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-AND-DEPLOY.ps1" -Packet "$env:USERPROFILE\\Downloads\\SVR_PHASE243_NEXT_PACKET.zip" -WaitForDeploy -SmokeProbe</pre>
      <p style="color:#dcefff;margin-bottom:0">Press F8 to toggle this deploy sync panel.</p>
    `;
    p.querySelector("#svrDeploySyncClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrDeploySyncRun").onclick = () => run();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) run();
  }

  window.SVR_DEPLOY_SYNC_FORCE = {
    state,
    run,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>JSON.parse(JSON.stringify(state))
  };

  window.addEventListener("keydown", ev => {
    if(ev.key === "F8" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_deploy_sync_force_ready", { detail: state }));
})();
