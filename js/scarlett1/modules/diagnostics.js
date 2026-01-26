export function initDiagnostics({ Bus }) {
  let last = performance.now();
  let frames = 0;
  function tick() {
    frames++;
    const now = performance.now();
    if (now - last >= 500) {
      const fps = Math.round((frames * 1000) / (now - last));
      frames = 0; last = now;
      const el = document.getElementById('fps-val');
      if (el) el.textContent = String(fps);
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  Bus.log('DIAGNOSTICS ONLINE');
}
