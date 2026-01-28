/**
 * SCARLETT1 • DIAGNOSTICS (PERMANENT)
 * Overlay with: Copy Report + Hide + Show HUD.
 */
export const Diagnostics = (() => {
  const state = {
    build: "SCARLETT1_PERMANENT_FIX_V2",
    lines: [],
    startedAt: performance.now(),
    lastError: null,
  };

  let root, pre, hidden = false;

  function now(){ return ((performance.now()-state.startedAt)/1000).toFixed(3); }
  function push(line){
    state.lines.push(line);
    if (state.lines.length > 900) state.lines.shift();
    if (pre && !hidden) pre.textContent = state.lines.join("\n");
  }
  function log(msg){ push(`[${now()}] ${msg}`); }
  function warn(msg){ push(`[${now()}] [warn] ${msg}`); }
  function error(msg){ state.lastError = msg; push(`[${now()}] [error] ${msg}`); }

  function setHidden(v){
    hidden = v;
    if (!root) return;
    root.style.display = hidden ? "none" : "block";
    const showBtn = document.getElementById("scarlett-showhud");
    if (showBtn) showBtn.style.display = hidden ? "block" : "none";
    if (!hidden && pre) pre.textContent = state.lines.join("\n");
  }

  async function copyReport(){
    const report = [
      "Scarlett Diagnostics Report",
      `build=${state.build}`,
      `href=${location.href}`,
      `ua=${navigator.userAgent}`,
      `time=${new Date().toISOString()}`,
      `lastError=${state.lastError || "none"}`,
      "",
      ...state.lines,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(report);
      log("[copy] report copied ✅");
      return true;
    } catch {
      const ta = document.createElement("textarea");
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      log(ok ? "[copy] report copied (fallback) ✅" : "[copy] copy failed ❌");
      return ok;
    }
  }

  function mount(){
    if (root) return;

    root = document.createElement("div");
    root.id = "scarlett-diagnostics";
    root.style.cssText = `
      position:fixed; left:10px; top:10px; z-index:100001;
      width:min(680px, calc(100vw - 20px));
      background:rgba(10,12,18,0.92);
      border:1px solid rgba(120,160,255,0.35);
      border-radius:12px;
      box-shadow:0 10px 30px rgba(0,0,0,0.45);
      color:#d8e6ff;
      font:12px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      overflow:hidden;
      user-select:text;
      pointer-events:auto;
    `;

    const bar = document.createElement("div");
    bar.style.cssText = `
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 10px 8px 10px;
      border-bottom:1px solid rgba(120,160,255,0.2);
      background:linear-gradient(180deg, rgba(40,55,90,0.35), rgba(0,0,0,0));
      gap:10px;
    `;

    const left = document.createElement("div");
    left.innerHTML = `<div style="font-weight:800;">ScarlettVR Poker • Diagnostics</div>
                      <div style="opacity:.8;font-size:11px;">BUILD ${state.build}</div>`;

    const btnRow = document.createElement("div");
    btnRow.style.cssText = "display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end;";

    const mkBtn = (label, fn) => {
      const b = document.createElement("button");
      b.textContent = label;
      b.style.cssText = `
        border:1px solid rgba(120,160,255,0.35);
        background:rgba(40,60,120,0.25);
        color:#d8e6ff; padding:6px 10px; border-radius:999px;
        font:12px ui-monospace, monospace;
      `;
      b.addEventListener("click", fn);
      return b;
    };

    btnRow.append(
      mkBtn("Copy Report", () => copyReport()),
      mkBtn("Hide", () => setHidden(true)),
    );

    bar.append(left, btnRow);

    pre = document.createElement("pre");
    pre.style.cssText = "margin:0; padding:10px; max-height:46vh; overflow:auto; white-space:pre-wrap;";

    root.append(bar, pre);
    document.body.appendChild(root);

    const show = document.createElement("button");
    show.textContent = "Show HUD";
    show.id = "scarlett-showhud";
    show.style.cssText = `
      position:fixed; right:12px; top:12px; z-index:100002;
      border:1px solid rgba(120,160,255,0.35);
      background:rgba(40,60,120,0.25);
      color:#d8e6ff; padding:8px 12px; border-radius:999px;
      font:12px ui-monospace, monospace; display:none;
      pointer-events:auto;
    `;
    show.addEventListener("click", () => setHidden(false));
    document.body.appendChild(show);

    window.addEventListener("error", (e)=> error(e?.message || "Unknown window error"));
    window.addEventListener("unhandledrejection", (e)=> {
      const msg = (e?.reason && (e.reason.stack || e.reason.message)) || String(e?.reason || "Unhandled rejection");
      error(msg);
    });

    log("=== SCARLETT DIAGNOSTICS ===");
    log(`href=${location.href}`);
    log(`secureContext=${window.isSecureContext}`);
    log(`ua=${navigator.userAgent}`);
    log(`touch=${("ontouchstart" in window) || (navigator.maxTouchPoints>0)} maxTouchPoints=${navigator.maxTouchPoints||0}`);
    log(`xr=${!!navigator.xr}`);
  }

  return { mount, log, warn, error, copyReport, setHidden };
})();
