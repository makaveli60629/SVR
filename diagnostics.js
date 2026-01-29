/**
 * diagnostics.js (ROOT) — PERMANENT
 * Writes to #diag in index.html.
 */
export function initDiagnostics({ build, href, ua } = {}) {
  const el = document.getElementById('diag');
  const pad = (n) => String(n).padStart(2,'0');

  function ts(){
    const d = new Date();
    return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3,'0')}]`;
  }

  function write(line){
    if (!el) return;
    el.textContent += (el.textContent ? '\n' : '') + line;
  }

  const api = {
    log: (m)=>write(`${ts()} ${m}`),
    warn: (m)=>write(`${ts()} [warn] ${m}`),
    error: (m)=>write(`${ts()} [error] ${m}`),
    render: (text)=>{ if(el) el.textContent = String(text || ''); },
  };

  api.log('=== SCARLETT DIAGNOSTICS ===');
  api.log(`build=${build || 'unknown'}`);
  api.log(`href=${href || location.href}`);
  api.log(`ua=${ua || navigator.userAgent}`);

  window.addEventListener('error', (e)=> api.error(e?.message || e?.type || 'error'));
  window.addEventListener('unhandledrejection', (e)=> api.error(String(e?.reason || e)));

  return api;
}
