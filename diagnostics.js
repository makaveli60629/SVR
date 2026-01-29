export function initDiagnostics(meta = {}) {
  const el = document.getElementById('diag');
  const state = { meta, lines: [], lastError: 'none' };

  function ts(){ return new Date().toISOString().split('T')[1].replace('Z',''); }

  function render(overrideText) {
    if (!el) return;
    el.textContent =
      (overrideText ? overrideText + '\n\n' : '') +
      state.lines.slice(-240).join('\n');
  }

  function write(line) {
    state.lines.push(line);
    if (state.lines.length > 600) state.lines.splice(0, state.lines.length - 600);
    render();
  }

  function log(msg){ write('[' + ts() + '] ' + msg); }
  function warn(msg){ write('[WARN ' + ts() + '] ' + msg); }
  function error(msg){ state.lastError = String(msg); write('[ERR  ' + ts() + '] ' + msg); }

  window.addEventListener('error', (e) => error('Uncaught: ' + (e?.message || e)));
  window.addEventListener('unhandledrejection', (e) => error('Promise: ' + (e?.reason?.message || e?.reason || e)));

  log('=== SCARLETT DIAGNOSTICS ===');
  Object.entries(meta).forEach(([k,v]) => log(k + '=' + v));

  return { log, warn, error, render, state };
}
