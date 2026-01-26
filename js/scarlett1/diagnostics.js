/**
 * SCARLETT1 • DIAGNOSTICS (PERMANENT)
 * Always-on overlay, error capture, copy report.
 */
export const Diagnostics = (() => {
  const state = {
    build: 'SCARLETT1_WORLD_PHASE1',
    lines: [],
    startedAt: performance.now(),
    lastError: null,
  };

  let root, pre;

  function now() { return ((performance.now() - state.startedAt) / 1000).toFixed(3); }
  function push(line) {
    state.lines.push(line);
    if (state.lines.length > 500) state.lines.shift();
    if (pre) pre.textContent = state.lines.join('\n');
  }
  function log(msg) { push(`[${now()}] ${msg}`); }
  function warn(msg) { push(`[${now()}] [warn] ${msg}`); }
  function error(msg) { state.lastError = msg; push(`[${now()}] [error] ${msg}`); }

  function mount() {
    if (root) return;

    root = document.createElement('div');
    root.id = 'scarlett-diagnostics';
    root.style.cssText = `
      position:fixed; left:10px; top:10px; z-index:999999;
      width:min(560px, calc(100vw - 20px));
      background:rgba(10,12,18,0.92);
      border:1px solid rgba(120,160,255,0.35);
      border-radius:12px;
      box-shadow:0 10px 30px rgba(0,0,0,0.45);
      color:#d8e6ff;
      font:12px/1.35 ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
      overflow:hidden;
      user-select:text;
    `;

    const bar = document.createElement('div');
    bar.style.cssText = `
      display:flex; align-items:center; justify-content:space-between;
      padding:10px 10px 8px 10px;
      border-bottom:1px solid rgba(120,160,255,0.2);
      background:linear-gradient(180deg, rgba(40,55,90,0.35), rgba(0,0,0,0));
    `;

    const title = document.createElement('div');
    title.textContent = `ScarlettVR Poker • Diagnostics`;
    title.style.cssText = `font-weight:700; letter-spacing:0.2px;`;

    const chip = document.createElement('div');
    chip.textContent = `BUILD: ${state.build}`;
    chip.style.cssText = `
      padding:3px 8px; border-radius:999px;
      border:1px solid rgba(120,160,255,0.35);
      background:rgba(40,60,120,0.25);
      font-size:11px;
    `;

    bar.appendChild(title);
    bar.appendChild(chip);

    pre = document.createElement('pre');
    pre.style.cssText = `margin:0; padding:10px; max-height:42vh; overflow:auto; white-space:pre-wrap;`;

    root.appendChild(bar);
    root.appendChild(pre);
    document.body.appendChild(root);

    // Global error capture
    window.addEventListener('error', (e) => {
      error(e?.message || 'Unknown window error');
    });
    window.addEventListener('unhandledrejection', (e) => {
      const msg = (e?.reason && (e.reason.stack || e.reason.message)) || String(e?.reason || 'Unhandled rejection');
      error(msg);
    });

    // Snapshot
    const ua = navigator.userAgent || 'unknown';
    const touch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    log(`=== SCARLETT DIAGNOSTICS ===`);
    log(`BUILD=${state.build}`);
    log(`href=${location.href}`);
    log(`secureContext=${window.isSecureContext}`);
    log(`ua=${ua}`);
    log(`touch=${touch} maxTouchPoints=${navigator.maxTouchPoints || 0}`);
    log(`xr=${!!navigator.xr}`);
    log(`--- MODULE AUDIT (scarlett1) ---`);
    [
      './js/scarlett1/index.js',
      './js/scarlett1/spine.js',
      './js/scarlett1/diagnostics.js',
      './js/scarlett1/devhud.js',
      './js/scarlett1/androidControls.js',
    ].forEach(p => log(`[audit] expects ${p}`));
  }

  async function copyReport() {
    const report = [
      `Scarlett Diagnostics Report`,
      `build=${state.build}`,
      `href=${location.href}`,
      `time=${new Date().toISOString()}`,
      `lastError=${state.lastError || 'none'}`,
      ``,
      ...state.lines,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(report);
      log(`[copy] report copied to clipboard ✅`);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = report;
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(ta);
      log(ok ? `[copy] report copied (fallback) ✅` : `[copy] copy failed ❌`);
      return ok;
    }
  }

  return { mount, log, warn, error, copyReport };
})();
