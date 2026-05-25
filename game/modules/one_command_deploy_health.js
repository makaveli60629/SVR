(function(){
  const BUILD = "PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK";
  const state = {
    build: BUILD,
    phase: 220,
    status: "WAITING",
    checkedAt: null,
    publicPageTouched: false,
    checks: []
  };

  async function fetchText(url){
    const full = url + (url.includes("?") ? "&" : "?") + "v=phase244-" + Date.now();
    try {
      const r = await fetch(full, { cache: "no-store" });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch(_e) {}
      return { url, ok: r.ok, status: r.status, json, text: text.slice(0, 240) };
    } catch(err) {
      return { url, ok: false, error: String(err && err.message || err) };
    }
  }

  async function run(){
    const checks = [];
    checks.push(await fetchText("./version.json"));
    checks.push(await fetchText("./deploy-health.json"));
    checks.push(await fetchText("../deploy-health.json"));
    const combined = JSON.stringify(checks);
    const phaseVisible = combined.includes("PHASE-220") || combined.includes("220");
    state.status = phaseVisible ? "DEPLOY_HEALTH_OK" : "DEPLOY_OR_CACHE_NOT_UPDATED";
    state.checkedAt = new Date().toISOString();
    state.checks = checks;
    window.dispatchEvent(new CustomEvent("svr_one_command_deploy_health_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-one-command-deploy-health");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-one-command-deploy-health";
    p.style.cssText = [
      "position:fixed","left:14px","bottom:14px","z-index:99994",
      "width:min(620px,calc(100vw - 28px))","max-height:72vh","overflow:auto",
      "background:rgba(3,5,12,.95)","color:#eaf7ff",
      "border:1px solid rgba(255,207,92,.55)","border-radius:16px",
      "box-shadow:0 18px 60px rgba(0,0,0,.6)","padding:14px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const checks = (state.checks || []).map(c => {
      const label = c.ok ? "✅" : "⚠️";
      const value = (c.json && (c.json.build || c.json.phase || JSON.stringify(c.json).slice(0,120))) || c.text || c.error || "";
      return `<li>${label} <b>${c.url}</b> — ${c.status || ""}<br><small>${String(value).replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s]))}</small></li>`;
    }).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR One-Command Deploy Health</b>
        <button id="svrDeployHealthClose" style="border:1px solid #fc5;background:#1d1606;color:#fff3bf;border-radius:999px;padding:4px 10px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(255,207,92,.28)">
      <div><b>Build:</b> ${BUILD}</div>
      <div><b>Status:</b> ${state.status}</div>
      <div><b>Checked:</b> ${state.checkedAt || "not yet"}</div>
      <div><b>Public page:</b> locked / untouched</div>
      <button id="svrDeployHealthRun" style="margin-top:10px;border:1px solid #fc5;background:#211800;color:#fff3bf;border-radius:999px;padding:7px 12px;cursor:pointer">Run Deploy Health</button>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-FIXED.ps1"</pre>
      <ul>${checks}</ul>
      <p style="color:#fff0b0;margin-bottom:0">Press M to open. This confirms whether the latest phase marker is live after Auto Deploy.</p>
    `;
    p.querySelector("#svrDeployHealthClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrDeployHealthRun").onclick = () => run();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) run();
  }

  window.SVR_ONE_COMMAND_DEPLOY_HEALTH = { state, run, toggle, open:()=>render(true), close:()=>{panel().style.display="none";} };
  window.addEventListener("keydown", ev => {
    if((ev.key || "").toLowerCase() === "m" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) toggle();
  }, true);
  window.dispatchEvent(new CustomEvent("svr_one_command_deploy_health_ready", { detail: state }));
})();
