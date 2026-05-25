(function(){
  const BUILD = "PHASE-247-BLACK-SCREEN-RENDER-LOOP-GUARD-LOCK";
  const PHASE = 247;
  const state = { build: BUILD, phase: PHASE, publicPageTouched: false, checkedAt: null };

  function esc(v){
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({ "<":"&lt;", ">":"&gt;", "&":"&amp;" }[s]));
  }

  function readState(){
    state.checkedAt = new Date().toISOString();
    state.runtime = window.SVR_MAIN_RUNTIME_STATE || null;
    render(true);
    return JSON.parse(JSON.stringify(state));
  }

  function panel(){
    let p = document.getElementById("svr-black-screen-render-loop-guard");
    if (p) return p;
    p = document.createElement("div");
    p.id = "svr-black-screen-render-loop-guard";
    p.style.cssText = [
      "position:fixed","left:18px","top:216px","z-index:100020",
      "width:min(860px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(7,7,14,.97)","color:#f4f7ff",
      "border:1px solid rgba(160,190,255,.72)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if (show) p.style.display = "block";
    const runtime = window.SVR_MAIN_RUNTIME_STATE || null;
    const text = JSON.stringify({ build: BUILD, phase: PHASE, runtime }, null, 2);
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Black Screen Render Loop Guard</b>
        <button id="svrBlackGuardClose" style="border:1px solid #acf;background:#111428;color:#f4f7ff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(160,190,255,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Fix:</b> world, hands, teleport, watch, and renderer updates are isolated. Emergency render runs even after a shielded error.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <button id="svrBlackGuardRead" style="border:1px solid #acf;background:#111428;color:#f4f7ff;border-radius:999px;padding:7px 12px;cursor:pointer;margin-top:10px">Read Runtime State</button>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px;max-height:340px;overflow:auto">${esc(text)}</pre>
      <p style="color:#dce4ff;margin-bottom:0">Press F10 to toggle this black-screen guard panel.</p>
    `;
    p.querySelector("#svrBlackGuardClose").onclick = () => p.style.display = "none";
    p.querySelector("#svrBlackGuardRead").onclick = () => readState();
    return p;
  }

  function toggle(){
    const p = panel();
    const show = p.style.display === "none";
    render(show);
    if (show) readState();
  }

  window.SVR_BLACK_SCREEN_RENDER_LOOP_GUARD = { state, readState, open:()=>render(true), close:()=>{ panel().style.display = "none"; }, toggle };
  window.addEventListener("keydown", ev => {
    if (ev.key === "F10" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_black_screen_render_loop_guard_ready", { detail: state }));
})();
