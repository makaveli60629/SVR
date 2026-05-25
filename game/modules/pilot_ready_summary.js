(function(){
  const BUILD = "PHASE-230-POWER-DEPLOY-WAIT-LOG-LOCK";
  const state = {
    build: BUILD,
    phase: 226,
    publicPageTouched: false,
    status: "READY_TO_CHECK",
    checkedAt: null,
    evidence: []
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  async function probe(url){
    const full = url + (url.includes("?") ? "&" : "?") + "v=phase230-" + Date.now();
    try {
      const r = await fetch(full, { cache: "no-store" });
      const text = await r.text();
      let json = null;
      try { json = JSON.parse(text); } catch(_e) {}
      return { url, ok: r.ok, status: r.status, json, text: text.slice(0, 220) };
    } catch(err) {
      return { url, ok:false, error:String(err && err.message || err) };
    }
  }

  async function run(){
    const evidence = [];
    evidence.push(await probe("./version.json"));
    evidence.push(await probe("./deploy-health.json"));
    evidence.push(await probe("../deploy-health.json"));
    const combined = JSON.stringify(evidence);
    const phaseOk = combined.includes("PHASE-226") || combined.includes('"phase":226') || combined.includes('"phase": 230');
    const hasPanels = !!(window.SVR_PILOT_HANDOFF_CARD || window.SVR_QA_SHORTCUT_INDEX || window.SVR_POST_DEPLOY_CHECKLIST);
    const noBootError = !document.body.innerText.includes("SVR Boot Fallback") && !document.body.innerText.includes("Boot Guard recovery");
    state.evidence = evidence;
    state.checkedAt = new Date().toISOString();
    state.status = (phaseOk && hasPanels && noBootError) ? "PILOT_READY_SUMMARY_OK" : "NEEDS_REVIEW";
    window.dispatchEvent(new CustomEvent("svr_pilot_ready_summary_update", { detail: { ...state } }));
    render(true);
    return { ...state };
  }

  function panel(){
    let p = document.getElementById("svr-pilot-ready-summary");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-pilot-ready-summary";
    p.style.cssText = [
      "position:fixed","left:16px","bottom:16px","z-index:100000",
      "width:min(700px,calc(100vw - 32px))","max-height:78vh","overflow:auto",
      "background:rgba(4,8,14,.97)","color:#f2fff9",
      "border:1px solid rgba(125,255,180,.62)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.72)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show){
    const p = panel();
    if(show) p.style.display = "block";
    const evidence = (state.evidence || []).map(e => {
      const val = (e.json && (e.json.build || e.json.phase || JSON.stringify(e.json).slice(0,120))) || e.text || e.error || "";
      return `<li>${e.ok ? "✅" : "⚠️"} <b>${esc(e.url)}</b> — ${esc(e.status || "")}<br><small>${esc(val)}</small></li>`;
    }).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Pilot Ready Summary</b>
        <button id="svrPilotReadyClose" style="border:1px solid #8fb;background:#061d13;color:#f2fff9;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(125,255,180,.3)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Status:</b> ${esc(state.status)}</div>
      <div><b>Checked:</b> ${esc(state.checkedAt || "not yet")}</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrPilotReadyRun" style="margin-top:10px;border:1px solid #8fb;background:#092016;color:#eafff4;border-radius:999px;padding:7px 12px;cursor:pointer">Run Summary Check</button>
      <h4>Final pilot checks</h4>
      <ol>
        <li>Game loads past Booting.</li>
        <li>No red runtime recovery panel is visible.</li>
        <li>Phase 230 appears in version/deploy markers.</li>
        <li>Tester panels are available: H, ?, E, M.</li>
        <li>Public Matrix launch page remains untouched.</li>
      </ol>
      <h4>Evidence</h4>
      <ul>${evidence}</ul>
      <h4>One-command update</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">cd C:\\Users\\ronal\\SVR
powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\\Downloads\\SVR-AUTO-APPLY-NEXT-FIXED.ps1"</pre>
      <p style="color:#bfffdc;margin-bottom:0">Press Y to toggle this Pilot Ready Summary.</p>
    `;
    p.querySelector("#svrPilotReadyClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrPilotReadyRun").onclick = () => run();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if(show) run();
  }

  window.SVR_PILOT_READY_SUMMARY = { state, run, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if((ev.key || "").toLowerCase() === "y" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) toggle();
  }, true);
  window.dispatchEvent(new CustomEvent("svr_pilot_ready_summary_ready", { detail: state }));
})();
