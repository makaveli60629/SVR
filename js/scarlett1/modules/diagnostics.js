export function initDiagnostics({ Bus }) {
  let last = performance.now(), frames = 0;
  function raf() {
    frames++;
    const now = performance.now();
    if (now - last >= 500) {
      const fps = Math.round(frames * 1000 / (now - last));
      frames = 0; last = now;
      const el = document.getElementById('fps');
      if (el) el.textContent = String(fps);
    }
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);
  Bus?.log?.('DIAGNOSTICS ONLINE');
}
