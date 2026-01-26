export const Diagnostics = (() => {
  const state = { build: 'SCARLETT1_SPINE_RECOVERY_V2', lines: [], startedAt: performance.now() };
  let root, pre;

  function log(msg) {
    state.lines.push(`[${((performance.now()-state.startedAt)/1000).toFixed(3)}] ${msg}`);
    if (pre) pre.textContent = state.lines.join('\n');
  }

  function mount() {
    if (root) return;
    root = document.createElement('div');
    root.style.cssText = 'position:fixed;left:10px;top:10px;width:520px;max-width:95vw;background:#0a0c12cc;color:#d8e6ff;font:12px monospace;z-index:99999;border-radius:12px;border:1px solid #4a6bff;padding:10px';
    pre = document.createElement('pre');
    root.appendChild(pre);
    document.body.appendChild(root);
    log('Diagnostics mounted');
  }

  return { mount, log };
})();
