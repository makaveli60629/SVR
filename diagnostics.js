/**
 * diagnostics.js (ROOT) — PERMANENT
 * Writes to #diagPre (matches index.html HUD)
 * Safe on mobile + Quest
 */

export function initDiagnostics({ build, href, ua } = {}) {
  const el = document.getElementById('diagPre');

  const pad = (n) => String(n).padStart(2,'0');

  function ts(){
    const d = new Date();
    return `[${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${String(d.getMilliseconds()).padStart(3,'0')}]`;
  }

  function write(line){
    if (!el) return;
    el.textContent += (el.textContent ? '\n' : '') + line;
    el.scrollTop = el.scrollHeight;
  }

  const api = {
    log:   (m)=>write(`${ts()} ${m}`),
    warn:  (m)=>write(`${ts()} [warn] ${m}`),
    error: (m)=>write(`${ts()} [error] ${m}`),
    render:(text)=>{
      if (!el) return;
      el.textContent = String(text || '');
      el.scrollTop = 0;
    },
    clear:()=>{
      if (el) el.textContent = '';
    }
  };

  // Initial header
  api.log('=== SCARLETT DIAGNOSTICS ===');
  api.log(`build=${build || 'unknown'}`);
  api.log(`href=${href || location.href}`);
  api.log(`ua=${ua || navigator.userAgent}`);

  // Catch ALL runtime errors (mobile-safe)
  window.addEventListener('error', (e)=>{
    api.error(e?.message || e?.type || 'window error');
  });

  window.addEventListener('unhandledrejection', (e)=>{
    api.error(String(e?.reason || 'promise rejection'));
  });

  return api;
}
