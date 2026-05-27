(function(){
  const BUILD = "PHASE-257-ALIGNMENT-PORTAL-KIOSK-TABLE-LOCK";
  const modules = [
  "./runtime_crash_shield.js",
  "./safe_event_bus.js",
  "./boot_cache_watchdog.js",
  "./marker_health.js",
  "./boot_diagnostic_snapshot.js",
  "./boot_route_recovery.js",
  "./boot_route_health.js",
  "./auto_apply_helper.js",
  "./auto_apply_status.js?v=phase257-alignment-lock",
  "./auto_apply_verify.js?v=phase257-alignment-lock",
  "./one_command_deploy_health.js?v=phase257-alignment-lock",
  "./one_command_runbook.js?v=phase257-alignment-lock",
  "./post_deploy_checklist.js?v=phase257-alignment-lock",
  "./tester_launch_card.js?v=phase257-alignment-lock",
  "./qa_shortcut_index.js?v=phase257-alignment-lock",
  "./pilot_handoff_card.js?v=phase257-alignment-lock",
  "./pilot_ready_summary.js?v=phase257-alignment-lock",
  "./pilot_issue_template.js?v=phase257-alignment-lock",
  "./pilot_feedback_export.js?v=phase257-alignment-lock",
  "./power_deploy_watcher.js?v=phase257-alignment-lock",
  "./power_deploy_wait_log.js?v=phase257-alignment-lock",
  "./power_deploy_smoke_probe.js?v=phase257-alignment-lock",
  "./vr_input_spawn_clear_recovery.js?v=phase257-alignment-lock",
  "./vr_input_diagnostic.js?v=phase257-alignment-lock",
  "./quest_input_autocalibration.js?v=phase257-alignment-lock",
  "./hand_teleport_pinch_destination.js?v=phase257-alignment-lock",
  "./hand_teleport_aim_confirm.js?v=phase257-alignment-lock",
  "./fire_lightning_theme_panel.js?v=phase257-alignment-lock",
  "./watch_upright_orientation_panel.js?v=phase257-alignment-lock",
  "./watch_teleport_conflict_guard.js?v=phase257-alignment-lock",
  "./deploy_sync_force.js?v=phase257-alignment-lock",
  "./main_runtime_catch_fix.js?v=phase257-alignment-lock",
  "./main_import_recovery.js?v=phase257-alignment-lock",
  "./bridge_alias_recovery.js?v=phase257-alignment-lock",
  "./bridge_proxy.js",
  "./event_firewall.js",
  "./enterprise_bridge.js",
  "./bridge_selftest.js",
  "./runtime_qa.js",
  "./session_export.js",
  "./deploy_verify.js",
  "./smoke_test.js",
  "./release_candidate.js",
  "./playtest_wizard.js",
  "./bug_reporter.js",
  "./tester_feedback.js",
  "./test_queue.js",
  "./test_report_bundle.js",
  "./demo_certification.js",
  "./pilot_testing_ready.js",
  "./auto_apply_git_wrapper_fix.js?v=phase257-alignment-lock",
  "./phase257-alignment-lock_forward_restore_manifest.js?v=phase257-alignment-lock"
];
  const state = {
    build: BUILD,
    phase: 257,
    status: "LOADING",
    publicPageTouched: false,
    loaded: [],
    failed: [],
    startedAt: new Date().toISOString(),
    finishedAt: null
  };

  function resolve(path){
    return new URL(path, import.meta.url).href;
  }

  async function loadOne(path){
    try {
      await import(resolve(path));
      state.loaded.push(path);
      window.dispatchEvent(new CustomEvent("svr_optional_module_loaded", { detail: { build: BUILD, module: path } }));
      return { path, ok: true };
    } catch(err) {
      const item = { path, ok: false, error: String(err && err.message || err) };
      state.failed.push(item);
      console.warn("[SVR optional module skipped]", path, err);
      window.dispatchEvent(new CustomEvent("svr_optional_module_failed", { detail: item }));
      return item;
    }
  }

  async function loadAll(){
    for (const path of modules) {
      await loadOne(path);
    }
    state.status = state.failed.length ? "OPTIONAL_MODULES_PARTIAL" : "OPTIONAL_MODULES_OK";
    state.finishedAt = new Date().toISOString();
    window.SVR_OPTIONAL_MODULE_LOADER = api;
    window.dispatchEvent(new CustomEvent("svr_optional_module_loader_done", { detail: api.snapshot() }));
    return api.snapshot();
  }

  function panel(){
    let p = document.getElementById("svr-optional-module-loader-panel");
    if(p) return p;
    p = document.createElement("div");
    p.id = "svr-optional-module-loader-panel";
    p.style.cssText = [
      "position:fixed","right:18px","bottom:18px","z-index:100007",
      "width:min(820px,calc(100vw - 36px))","max-height:84vh","overflow:auto",
      "background:rgba(4,8,12,.97)","color:#efffff",
      "border:1px solid rgba(125,255,225,.70)","border-radius:18px",
      "box-shadow:0 24px 80px rgba(0,0,0,.74)","padding:16px",
      "font:12px/1.45 ui-monospace,Menlo,Consolas,monospace","display:none"
    ].join(";");
    document.body.appendChild(p);
    return p;
  }

  function esc(v){
    return String(v == null ? "" : v).replace(/[<>&]/g, s => ({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]));
  }

  function render(show=true){
    const p = panel();
    if(show) p.style.display = "block";
    const failed = state.failed.map(x => `<li>âš ï¸ <b>${esc(x.path)}</b><br><small>${esc(x.error)}</small></li>`).join("");
    const loaded = state.loaded.slice(-30).map(x => `<li>âœ… ${esc(x)}</li>`).join("");
    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
        <b>SVR Optional Module Loader</b>
        <button id="svrOptionalLoaderClose" style="border:1px solid #8fd;background:#061d18;color:#efffff;border-radius:999px;padding:5px 12px;cursor:pointer">Close</button>
      </div>
      <hr style="border:0;border-top:1px solid rgba(125,255,225,.32)">
      <div><b>Build:</b> ${esc(BUILD)}</div>
      <div><b>Status:</b> ${esc(state.status)}</div>
      <div><b>Loaded:</b> ${state.loaded.length} / ${modules.length}</div>
      <div><b>Failed optional:</b> ${state.failed.length}</div>
      <div><b>Fix:</b> optional QA/telemetry imports no longer block main game boot.</div>
      <div><b>Public Matrix page:</b> locked / untouched</div>
      <h4>Failed optional modules</h4>
      <ul>${failed || "<li>None</li>"}</ul>
      <h4>Recent loaded modules</h4>
      <ul>${loaded || "<li>Loading...</li>"}</ul>
      <p style="color:#cffff5;margin-bottom:0">Press F10 to toggle this optional module loader panel.</p>
    `;
    p.querySelector("#svrOptionalLoaderClose").onclick = () => p.style.display = "none";
    return p;
  }

  const api = {
    state,
    modules,
    loadAll,
    render,
    open: () => render(true),
    close: () => { panel().style.display = "none"; },
    toggle: () => {
      const p = panel();
      const show = p.style.display === "none";
      render(show);
    },
    snapshot: () => JSON.parse(JSON.stringify(state))
  };

  window.SVR_OPTIONAL_MODULE_LOADER = api;
  window.addEventListener("keydown", ev => {
    if(ev.key === "F10" && !ev.ctrlKey && !ev.metaKey && !ev.altKey) {
      ev.preventDefault();
      api.toggle();
    }
  }, true);

  window.dispatchEvent(new CustomEvent("svr_optional_module_loader_ready", { detail: api.snapshot() }));
  loadAll();
})();





