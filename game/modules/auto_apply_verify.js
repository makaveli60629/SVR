(function(){
  const BUILD = "PHASE-244-MAIN-RUNTIME-CATCH-FIX-LOCK";
  const state = {
    build: BUILD,
    phase: 219,
    status: "READY_TO_VERIFY",
    publicPageTouched: false,
    checks: []
  };

  async function checkJson(url){
    try {
      const r = await fetch(url + (url.includes("?") ? "&" : "?") + "v=phase244-" + Date.now(), { cache: "no-store" });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch(_e) {}
      return { url, ok: r.ok, status: r.status, json, text: text.slice(0, 180) };
    } catch (err) {
      return { url, ok: false, error: String(err && err.message || err) };
    }
  }

  async function run(){
    const checks = [];
    checks.push(await checkJson("./version.json"));
    checks.push(await checkJson("./deploy-health.json"));
    checks.push(await checkJson("../deploy-health.json"));
    const phaseOk = checks.some(c => JSON.stringify(c).includes("PHASE-219"));
    state.status = phaseOk ? "PHASE_219_VISIBLE" : "NEEDS_DEPLOY_OR_CACHE_REFRESH";
    state.checks = checks;
    state.checkedAt = new Date().toISOString();
    window.dispatchEvent(new CustomEvent("svr_auto_apply_verify_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-auto-apply-verify");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-auto-apply-verify";
    p.style.cssText = "position:fixed;left:14px;top:76px;z-index:99993;width:min(560px,calc(100vw - 28px));max-height:72vh;overflow:auto;background:rgba(3,5,12,.94);color:#eaf7ff;border:1px solid rgba(120,255,186,.45);border-radius:16px;box-shadow:0 18px 60px rgba(0,0,0,.55);padding:14px;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace;display:none";
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    p.style.display = show ? "block" : p.style.display;
    const checksHtml = (state.checks || []).map(c => `<li>${c.ok ? "✅" : "⚠️"} ${c.url} — ${c.status || c.error || ""}<br><small>${(c.json && (c.json.build || c.json.phase)) || c.text || ""}</small></li>`).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Auto Apply Verify</b>
        <button id="svrAutoVerifyClose" style="border:1px solid #8fb;background:#06131d;color:#eaf7ff;border-radius:999px;padding:4px 10px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(120,255,186,.25)">
      <div><b>Build:</b> ${BUILD}</div>
      <div><b>Status:</b> ${state.status}</div>
      <div><b>Public page:</b> locked / untouched</div>
      <button id="svrAutoVerifyRun" style="margin-top:10px;border:1px solid #8fb;background:#092016;color:#eafff4;border-radius:999px;padding:7px 12px;cursor:pointer">Run Verify</button>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-FIXED.ps1"</pre>
      <ul>${checksHtml}</ul>
      <p style="color:#aee;margin-bottom:0">Press O to toggle this panel. It verifies deployed JSON markers after Auto Deploy.</p>
    `;
    p.querySelector("#svrAutoVerifyClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrAutoVerifyRun").onclick = () => run();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) run();
  }

  window.SVR_AUTO_APPLY_VERIFY = { state, run, toggle, open:()=>render(true), close:()=>{panel().style.display="none";} };
  window.addEventListener("keydown", ev => {
    if((ev.key||"").toLowerCase()==="o" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) toggle();
  }, true);
  window.dispatchEvent(new CustomEvent("svr_auto_apply_verify_ready", { detail: state }));
})();
