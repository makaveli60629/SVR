/**
 * diagnostics.js — ROOT (PERMANENT)
 * Zero dependencies. Never throws.
 */
export function initDiagnostics(meta = {}) {
  const el =
    document.getElementById('diag') ||
    document.getElementById('log') ||
    (() => {
      const p = document.createElement('pre');
      p.id = 'diag';
      p.style.position = 'fixed';
      p.style.left = '12px';
      p.style.bottom = '12px';
      p.style.maxHeight = '40vh';
      p.style.overflow = 'auto';
      p.style.zIndex = '99';
      document.body.appendChild(p);
      return p;
    })();

  function ts() {
    const d = new Date();
    return `[${d.toLocaleTimeString()}]`;
  }

  function write(type, msg) {
    el.textContent += `\n${ts()} ${type} ${msg}`;
  }

  write('===', 'SCARLETT DIAGNOSTICS ===');
  Object.entries(meta).forEach(([k,v]) => write('', `${k}=${v}`));

  return {
    log: (m) => write('', m),
    warn: (m) => write('[warn]', m),
    error: (m) => write('[error]', m),
    render: (m) => write('[report]', m)
  };
}
