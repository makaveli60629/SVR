(function(){
  const BUILD = "PHASE-222-POST-DEPLOY-CHECKLIST-LOCK";
  const state = {
    build: BUILD,
    phase: 222,
    publicPageTouched: false,
    status: "READY",
    checkedAt: null,
    checklist: [
      { label: "Git push completed", done: false },
      { label: "GitHub Actions Auto Deploy ran", done: false },
      { label: "Cache-bust URL loaded", done: false },
      { label: "version.json shows Phase 222", done: false },
      { label: "deploy-health.json available", done: false },
      { label: "Tester shortcut panels available", done: false }
    ],
    checks: []
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  async function get(url){
    const full = url + (url.includes("?") ? "&" : "?") + "v=phase222-" + Date.now();
    try {
      const r = await fetch(full, { cache: "no-store" });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch(_e) {}
      return { url, ok: r.ok, status: r.status, json, text: text.slice(0, 240) };
    } catch (err) {
      return { url, ok: false, error: String(err && err.message || err) };
    }
  }

  async function run(){
    const checks = [];
    checks.push(await get("./version.json"));
    checks.push(await get("./deploy-health.json"));
    checks.push(await get("../deploy-health.json"));
    const combined = JSON.stringify(checks);
    const phaseVisible = combined.includes("PHASE-222") || combined.includes('"phase":222') || combined.includes('"phase": 222');
    const deployHealth = checks.some(c => c.url.includes("deploy-health") && c.ok);
    state.checks = checks;
    state.checkedAt = new Date().toISOString();
    state.status = phaseVisible && deployHealth ? "POST_DEPLOY_OK" : "CHECK_DEPLOY_OR_CACHE";
    state.checklist = state.checklist.map(item => {
      if(item.label.includes("version.json")) return {...item, done: phaseVisible};
      if(item.label.includes("deploy-health")) return {...item, done: deployHealth};
      if(item.label.includes("Cache-bust")) return {...item, done: location.search.includes("phase222")};
      if(item.label.includes("Tester shortcut")) return {...item, done: !!(window.SVR_ONE_COMMAND_RUNBOOK || window.SVR_ONE_COMMAND_DEPLOY_HEALTH || window.SVR_AUTO_APPLY_STATUS)};
      return item;
    });
    window.dispatchEvent(new CustomEvent("svr_post_deploy_checklist_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-post-deploy-checklist");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-post-deploy-checklist";
    p.style.cssText = [
      "position:fixed","left:14px","top:96px","z-index:99996",
      "width:min(660px,calc(100vw - 28px))","max-height:74vh","overflow:auto",
      "background:rgba(2,10,8,.96)","color:#eafff4",
      "border:1px solid rgba(120,255,186,.58)","border-radius:16px",
      "box-shadow:0 18px 60px rgba(0,0,0,.6)","padding:14px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const items = state.checklist.map(x => `<li>${x.done ? "✅" : "⬜"} ${esc(x.label)}</li>`).join("");
    const checks = (state.checks || []).map(c => {
      const val = (c.json && (c.json.build || c.json.phase || JSON.stringify(c.json).slice(0,120))) || c.text || c.error || "";
      return `<li>${c.ok ? "✅" : "⚠️"} <b>${esc(c.url)}</b> — ${esc(c.status || "")}<br><small>${esc(val)}</small></li>`;
    }).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Post-Deploy Checklist</b>
        <button id="svrPostDeployClose" style="border:1px solid #8fb;background:#061d13;color:#eafff4;border-radius:999px;padding:4px 10px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(120,255,186,.28)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Status:</b> ${esc(state.status)}</div>
      <div><b>Checked:</b> ${esc(state.checkedAt || "not yet")}</div>
      <div><b>Public page:</b> locked / untouched</div>
      <button id="svrPostDeployRun" style="margin-top:10px;border:1px solid #8fb;background:#092016;color:#eafff4;border-radius:999px;padding:7px 12px;cursor:pointer">Run Checklist</button>
      <ol>${items}</ol>
      <div><b>One-command update:</b></div>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-FIXED.ps1"</pre>
      <div><b>Live checks:</b></div>
      <ul>${checks}</ul>
      <p style="color:#bfffdc;margin-bottom:0">Press E to toggle this panel after Auto Deploy.</p>
    `;
    p.querySelector("#svrPostDeployClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrPostDeployRun").onclick = () => run();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) run();
  }

  window.SVR_POST_DEPLOY_CHECKLIST = { state, run, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if((ev.key || "").toLowerCase() === "e" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) toggle();
  }, true);
  window.dispatchEvent(new CustomEvent("svr_post_deploy_checklist_ready", { detail: state }));
})();
