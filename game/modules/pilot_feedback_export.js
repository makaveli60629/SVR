(function(){
  const BUILD = "PHASE-234-POWER-DEPLOY-SMOKE-PROBE-LOCK";
  const state = {
    build: BUILD,
    phase: 228,
    publicPageTouched: false,
    openedAt: null,
    lastExportAt: null,
    latestBundle: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function getNotes() {
    const el = document.getElementById("svrPilotFeedbackNotes");
    return el ? el.value : "";
  }

  function collectBundle() {
    const bundle = {
      build: BUILD,
      phase: 228,
      url: location.href,
      userAgent: navigator.userAgent || "",
      language: navigator.language || "",
      timestamp: new Date().toISOString(),
      publicPageTouched: false,
      notes: getNotes(),
      modulePresence: {
        pilotIssueTemplate: !!window.SVR_PILOT_ISSUE_TEMPLATE,
        pilotReadySummary: !!window.SVR_PILOT_READY_SUMMARY,
        pilotHandoffCard: !!window.SVR_PILOT_HANDOFF_CARD,
        qaShortcutIndex: !!window.SVR_QA_SHORTCUT_INDEX,
        postDeployChecklist: !!window.SVR_POST_DEPLOY_CHECKLIST,
        oneCommandDeployHealth: !!window.SVR_ONE_COMMAND_DEPLOY_HEALTH,
        autoApplyVerify: !!window.SVR_AUTO_APPLY_VERIFY,
        autoApplyStatus: !!window.SVR_AUTO_APPLY_STATUS
      },
      bodyErrorHints: {
        bootFallbackVisible: document.body.innerText.includes("SVR Boot Fallback"),
        bootGuardRecoveryVisible: document.body.innerText.includes("Boot Guard recovery"),
        redRuntimePanelTextVisible: document.body.innerText.includes("runtime") && document.body.innerText.includes("error")
      }
    };
    state.latestBundle = bundle;
    state.lastExportAt = bundle.timestamp;
    window.dispatchEvent(new CustomEvent("svr_pilot_feedback_export_update", { detail: { ...state } }));
    return bundle;
  }

  async function copyBundle() {
    const text = JSON.stringify(collectBundle(), null, 2);
    try {
      await navigator.clipboard.writeText(text);
      render(true, "Copied pilot feedback JSON to clipboard.");
    } catch(err) {
      render(true, "Copy failed. Use Download JSON instead.");
    }
  }

  function downloadBundle() {
    const text = JSON.stringify(collectBundle(), null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "svr-pilot-feedback-phase234.json";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    render(true, "Downloaded pilot feedback JSON.");
  }

  function panel(){
    let p = document.getElementById("svr-pilot-feedback-export");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-pilot-feedback-export";
    p.style.cssText = [
      "position:fixed","right:18px","bottom:18px","z-index:100002",
      "width:min(780px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(5,10,18,.97)","color:#eef9ff",
      "border:1px solid rgba(125,210,255,.65)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show, message){
    const p = panel();
    if(show) p.style.display = "block";
    const bundle = collectBundle();
    const bundlePreview = esc(JSON.stringify(bundle, null, 2));
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Pilot Feedback Export</b>
        <button id="svrPilotFeedbackClose" style="border:1px solid #8cf;background:#06141d;color:#eef9ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(125,210,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      ${message ? `<p style="color:#9ee4ff"><b>${esc(message)}</b></p>` : ""}
      <label><b>Tester notes:</b></label>
      <textarea id="svrPilotFeedbackNotes" style="width:100%;min-height:110px;box-sizing:border-box;background:rgba(255,255,255,.06);color:#eef9ff;border:1px solid rgba(125,210,255,.35);border-radius:12px;padding:10px;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace" placeholder="What worked, what failed, device, browser, controls, scene, screenshot notes...">${esc(bundle.notes || "")}</textarea>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
        <button id="svrPilotFeedbackCopy" style="border:1px solid #8cf;background:#06141d;color:#eef9ff;border-radius:999px;padding:7px 12px;cursor:pointer">Copy JSON</button>
        <button id="svrPilotFeedbackDownload" style="border:1px solid #8cf;background:#06141d;color:#eef9ff;border-radius:999px;padding:7px 12px;cursor:pointer">Download JSON</button>
        <button id="svrPilotFeedbackRefresh" style="border:1px solid #8cf;background:#06141d;color:#eef9ff;border-radius:999px;padding:7px 12px;cursor:pointer">Refresh Preview</button>
      </div>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px;max-height:300px;overflow:auto">${bundlePreview}</pre>
      <p style="color:#c7efff;margin-bottom:0">Press F4 to toggle this feedback export panel.</p>
    `;
    p.querySelector("#svrPilotFeedbackClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrPilotFeedbackCopy").onclick = copyBundle;
    p.querySelector("#svrPilotFeedbackDownload").onclick = downloadBundle;
    p.querySelector("#svrPilotFeedbackRefresh").onclick = () => render(true, "Preview refreshed.");
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    state.openedAt = new Date().toISOString();
    render(show);
    window.dispatchEvent(new CustomEvent("svr_pilot_feedback_export_toggle", { detail: { ...state, visible: show } }));
  }

  window.SVR_PILOT_FEEDBACK_EXPORT = { state, collectBundle, copyBundle, downloadBundle, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if(ev.key === "F4" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_pilot_feedback_export_ready", { detail: state }));
})();
