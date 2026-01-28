// /js/scarlett1/ui.js
// SCARLETT • UI (PERMANENT)
// - Top-left title chip + status
// - Top-right: Copy Report + Hide Diagnostics + Show/Hide UI
// - Bottom: Enter VR + Emergency Reload
// - Optional: also hides touch pads + diagnostics when UI hidden

export const UI = (() => {
  let mounted = false;
  let uiHidden = false;

  function css() {
    const style = document.createElement("style");
    style.textContent = `
      :root{
        --scar-bg: rgba(10,12,18,0.72);
        --scar-bd: rgba(120,160,255,0.35);
        --scar-tx: #d8e6ff;
        --scar-tx2:#cfe3ff;
        --scar-btn: rgba(20,30,60,0.82);
        --scar-btn-bd: rgba(80,120,255,0.40);
        --scar-glow: rgba(80,120,255,0.18);
      }

      .scar-ui-hidden .scar-ui,
      .scar-ui-hidden #scarlett-diagnostics,
      .scar-ui-hidden .scar-pad {
        display:none !important;
      }

      .scar-ui{
        position:fixed;
        inset:0;
        pointer-events:none;
        z-index:999998;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
      }

      .scar-top{
        position:fixed;
        left:10px;
        top:10px;
        display:flex;
        gap:10px;
        align-items:center;
        pointer-events:auto;
      }

      .scar-chip{
        display:flex;
        gap:10px;
        align-items:center;
        padding:10px 12px;
        border-radius:14px;
        background:var(--scar-bg);
        border:1px solid var(--scar-bd);
        box-shadow:0 10px 30px rgba(0,0,0,0.35);
        backdrop-filter: blur(10px);
        color:var(--scar-tx);
      }

      .scar-chip .title{
        font-weight:800;
        letter-spacing:0.3px;
        line-height:1.1;
      }

      .scar-chip .sub{
        opacity:0.92;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        font-size:12px;
      }

      .scar-actions{
        position:fixed;
        right:10px;
        top:10px;
        display:flex;
        gap:10px;
        pointer-events:auto;
      }

      .scar-btn{
        padding:10px 14px;
        border-radius:14px;
        background:var(--scar-btn);
        color:var(--scar-tx2);
        border:1px solid var(--scar-btn-bd);
        font-size:13px;
        box-shadow:0 10px 30px rgba(0,0,0,0.25);
        backdrop-filter: blur(10px);
      }
      .scar-btn:active{ transform: scale(0.97); }

      .scar-bottom{
        position:fixed;
        left:50%;
        bottom:14px;
        transform:translateX(-50%);
        display:flex;
        gap:14px;
        pointer-events:auto;
      }

      .scar-hint{
        position:fixed;
        left:50%;
        bottom:70px;
        transform:translateX(-50%);
        padding:6px 10px;
        border-radius:12px;
        background:rgba(10,12,18,0.55);
        border:1px solid rgba(120,160,255,0.22);
        color:rgba(216,230,255,0.85);
        font-size:12px;
        pointer-events:none;
        display:none;
      }
      .scar-hint.show{ display:block; }
    `;
    document.head.appendChild(style);
  }

  function mount({
    Diagnostics,
    onEnterVR,
    onReload,
    onTogglePads, // optional callback(bool)
    getStatusText, // optional () => string
  } = {}) {
    if (mounted) return;
    mounted = true;

    css();

    const root = document.createElement("div");
    root.className = "scar-ui";
    root.id = "scar-ui-root";

    const top = document.createElement("div");
    top.className = "scar-top";

    const chip = document.createElement("div");
    chip.className = "scar-chip";

    const left = document.createElement("div");
    left.innerHTML = `
      <div class="title">SCARLETT <span style="opacity:.9">DIAG</span></div>
      <div class="sub" id="scar-ui-status">module loaded</div>
    `;

    chip.appendChild(left);
    top.appendChild(chip);

    const actions = document.createElement("div");
    actions.className = "scar-actions";

    const btn = (label) => {
      const b = document.createElement("button");
      b.className = "scar-btn";
      b.textContent = label;
      return b;
    };

    const copy = btn("Copy Report");
    copy.onclick = async () => {
      try {
        const ok = await Diagnostics?.copyReport?.();
        Diagnostics?.log?.(ok ? "[copy] report copied ✅" : "[copy] failed ❌");
        flash(ok ? "Report copied ✅" : "Copy failed ❌");
      } catch (e) {
        Diagnostics?.warn?.("[copy] exception");
        flash("Copy failed ❌");
      }
    };

    const hideDiag = btn("Hide");
    hideDiag.onclick = () => {
      const el = document.getElementById("scarlett-diagnostics");
      if (!el) return;
      const nowHidden = el.style.display !== "none";
      el.style.display = nowHidden ? "none" : "block";
      hideDiag.textContent = nowHidden ? "Show" : "Hide";
      Diagnostics?.log?.(nowHidden ? "[ui] diagnostics hidden" : "[ui] diagnostics shown");
    };

    const toggleUI = btn("Show UI");
    toggleUI.onclick = () => {
      uiHidden = !uiHidden;
      document.body.classList.toggle("scar-ui-hidden", uiHidden);
      toggleUI.textContent = uiHidden ? "Show UI" : "Hide UI";
      onTogglePads?.(!uiHidden);
      Diagnostics?.log?.(uiHidden ? "[ui] ui hidden" : "[ui] ui shown");
    };
    // Start visible, so button should say Hide UI
    toggleUI.textContent = "Hide UI";

    actions.appendChild(copy);
    actions.appendChild(hideDiag);
    actions.appendChild(toggleUI);

    const bottom = document.createElement("div");
    bottom.className = "scar-bottom";

    const enter = btn("ENTER VR");
    enter.onclick = () => onEnterVR?.();

    const reload = btn("EMERGENCY: RELOAD");
    reload.onclick = () => onReload?.();

    bottom.appendChild(enter);
    bottom.appendChild(reload);

    const hint = document.createElement("div");
    hint.className = "scar-hint";
    hint.id = "scar-ui-hint";

    root.appendChild(top);
    root.appendChild(actions);
    root.appendChild(bottom);
    root.appendChild(hint);

    document.body.appendChild(root);

    // Status ticker
    const statusEl = document.getElementById("scar-ui-status");
    const tick = () => {
      if (!statusEl) return;
      const s = getStatusText?.();
      if (s) statusEl.textContent = s;
      requestAnimationFrame(tick);
    };
    tick();
  }

  function flash(text) {
    const hint = document.getElementById("scar-ui-hint");
    if (!hint) return;
    hint.textContent = text;
    hint.classList.add("show");
    clearTimeout(hint._t);
    hint._t = setTimeout(() => hint.classList.remove("show"), 1200);
  }

  return { mount };
})();
