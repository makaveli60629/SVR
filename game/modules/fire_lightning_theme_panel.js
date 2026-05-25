(function(){
  const BUILD = "PHASE-242-WATCH-TELEPORT-CONFLICT-GUARD-LOCK";
  const state = {
    build: BUILD,
    phase: 240,
    publicPageTouched: false,
    arch: "enabled",
    handGlow: "enabled",
    theme: "fire-orange + electric-cyan + SVR-violet",
    checkedAt: null
  };

  function esc(v) {
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function panel(){
    let p = document.getElementById("svr-fire-lightning-theme-panel");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-fire-lightning-theme-panel";
    p.style.cssText = [
      "position:fixed","right:18px","top:176px","z-index:100014",
      "width:min(820px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(9,6,12,.97)","color:#fff7ec",
      "border:1px solid rgba(255,135,50,.75)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    state.checkedAt = new Date().toISOString();
    const handInfo = window.SVR_FIRE_LIGHTNING_HANDS || null;
    const archInfo = window.SVR_FIRE_LIGHTNING_ARCH || null;
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Fire Lightning Theme</b>
        <button id="svrFireThemeClose" style="border:1px solid #fb8;background:#211306;color:#fff7ec;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(255,135,50,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Arch:</b> SVR fire/electric portal arch near lobby spawn path</div>
      <div><b>Hands:</b> electric lightning aura around hand/controller hand proxies</div>
      <div><b>Theme colors:</b> fire orange, ember gold, electric cyan, SVR violet</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <h4>Live state</h4>
      <pre style="white-space:pre-wrap;background:rgba(255,255,255,.06);border-radius:10px;padding:10px">${esc(JSON.stringify({ state, handInfo, archInfo }, null, 2))}</pre>
      <h4>Test</h4>
      <ol>
        <li>Enter the lobby and look toward the main walkway: the fire lightning arch should be visible.</li>
        <li>Enter VR or controller fallback: both hand visuals should have electric/fire glow.</li>
        <li>Move/teleport as normal. The glow should not block teleport.</li>
      </ol>
      <p style="color:#ffd8a8;margin-bottom:0">Press F4 to toggle this Fire Lightning Theme panel.</p>
    `;
    p.querySelector("#svrFireThemeClose").onclick = () => p.style.display = "none";
    window.dispatchEvent(new CustomEvent("svr_fire_lightning_theme_update", { detail: { ...state } }));
    return p;
  }

  function toggle(){
    const p = panel();
    render(p.style.display === "none");
  }

  window.SVR_FIRE_LIGHTNING_THEME_PANEL = {
    state,
    open:()=>render(true),
    close:()=>{ panel().style.display = "none"; },
    toggle,
    snapshot:()=>({...state})
  };

  window.addEventListener("keydown", ev => {
    if(ev.key === "F4" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      toggle();
    }
  }, true);
  window.dispatchEvent(new CustomEvent("svr_fire_lightning_theme_ready", { detail: state }));
})();
