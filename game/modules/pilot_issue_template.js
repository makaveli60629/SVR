(function(){
  const BUILD = "PHASE-227-PILOT-ISSUE-TEMPLATE-LOCK";
  const state = {
    build: BUILD,
    phase: 227,
    publicPageTouched: false,
    openedAt: null,
    lastCopiedAt: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function template(){
    const url = location.href;
    const ua = navigator.userAgent || "unknown";
    return [
      "SVR PILOT ISSUE REPORT",
      "Build: " + BUILD,
      "URL tested: " + url,
      "Device/browser: " + ua,
      "Tester name:",
      "Area tested: Lobby / Poker / Watch / Private Scene / Controls / Other",
      "Severity: Blocker / Bug / Polish / Question",
      "What I pressed or did:",
      "Expected result:",
      "Actual result:",
      "Screenshot/video attached: Yes / No",
      "Did hard refresh fix it: Yes / No / Not tried",
      "Notes:"
    ].join("\n");
  }

  async function copyTemplate(){
    const text = template();
    try {
      await navigator.clipboard.writeText(text);
      state.lastCopiedAt = new Date().toISOString();
      window.dispatchEvent(new CustomEvent("svr_pilot_issue_template_copied", { detail: { ...state, text } }));
      render(true, "Copied issue template to clipboard.");
    } catch(err) {
      render(true, "Copy failed. Select the template text manually.");
    }
  }

  function downloadTemplate(){
    const blob = new Blob([template()], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "svr-pilot-issue-template-phase227.txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function panel(){
    let p = document.getElementById("svr-pilot-issue-template");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-pilot-issue-template";
    p.style.cssText = [
      "position:fixed","left:50%","top:50%","transform:translate(-50%,-50%)",
      "z-index:100001","width:min(760px,calc(100vw - 32px))","max-height:82vh","overflow:auto",
      "background:rgba(8,7,12,.97)","color:#fff8ec",
      "border:1px solid rgba(255,190,110,.65)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show, message){
    const p = panel();
    if(show) p.style.display = "block";
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Pilot Issue Template</b>
        <button id="svrIssueTemplateClose" style="border:1px solid #fb8;background:#211306;color:#fff8ec;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(255,190,110,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      ${message ? `<p style="color:#ffd28f"><b>${esc(message)}</b></p>` : ""}
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0">
        <button id="svrIssueCopy" style="border:1px solid #fb8;background:#211306;color:#fff8ec;border-radius:999px;padding:7px 12px;cursor:pointer">Copy Template</button>
        <button id="svrIssueDownload" style="border:1px solid #fb8;background:#211306;color:#fff8ec;border-radius:999px;padding:7px 12px;cursor:pointer">Download TXT</button>
      </div>
      <textarea id="svrIssueText" style="width:100%;min-height:310px;box-sizing:border-box;background:rgba(255,255,255,.06);color:#fff8ec;border:1px solid rgba(255,190,110,.3);border-radius:12px;padding:10px;font:12px/1.45 ui-monospace,Menlo,Consolas,monospace">${esc(template())}</textarea>
      <p style="color:#ffe1b8;margin-bottom:0">Press F2 to toggle this issue template.</p>
    `;
    p.querySelector("#svrIssueTemplateClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrIssueCopy").onclick = copyTemplate;
    p.querySelector("#svrIssueDownload").onclick = downloadTemplate;
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    state.openedAt = new Date().toISOString();
    render(show);
    window.dispatchEvent(new CustomEvent("svr_pilot_issue_template_update", { detail: { ...state, visible: show } }));
  }

  window.SVR_PILOT_ISSUE_TEMPLATE = { state, template, copyTemplate, downloadTemplate, toggle, open:()=>render(true), close:()=>{panel().style.display="none";}, snapshot:()=>({...state}) };
  window.addEventListener("keydown", ev => {
    if(ev.key === "F2" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_pilot_issue_template_ready", { detail: state }));
})();
