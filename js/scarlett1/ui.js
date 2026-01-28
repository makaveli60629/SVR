/**
 * SCARLETT1 • UI (PERMANENT)
 * Bottom buttons that never overlap diagnostics.
 */
export function mountUI({ onEnterVR, onReload, onReset }){
  const wrap = document.createElement("div");
  wrap.id = "scarlett-bottom-ui";
  wrap.style.cssText = `
    position:fixed; left:0; right:0; bottom:14px;
    display:flex; justify-content:center; gap:12px;
    z-index:100000; pointer-events:auto;
  `;

  const mk = (label, cb) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.style.cssText = `
      border:1px solid rgba(120,160,255,0.35);
      background:rgba(40,60,120,0.25);
      color:#d8e6ff; padding:14px 18px; border-radius:14px;
      font:700 14px system-ui, -apple-system, Segoe UI, Roboto, Arial;
      min-width:120px;
    `;
    b.addEventListener("click", cb);
    return b;
  };

  wrap.append(
    mk("ENTER VR", onEnterVR),
    mk("RESET", onReset),
    mk("RELOAD", onReload),
  );

  document.body.appendChild(wrap);
  return wrap;
}
