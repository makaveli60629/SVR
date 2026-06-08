(function(){
  const BUILD = "VERSION-1.5.1-ANDROID-PLAY-OVERLAY-FIX";
  window.SVR_BUILD_LABEL = BUILD;

  function isAndroid(){
    return /Android/i.test(navigator.userAgent || "");
  }

  function isMobileLike(){
    return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") || Math.min(innerWidth, innerHeight) < 760;
  }

  function addStyle(){
    if (document.getElementById("svrAndroidPlayStyle")) return;
    const s = document.createElement("style");
    s.id = "svrAndroidPlayStyle";
    s.textContent = `
      html, body {
        background:#02040a !important;
        overscroll-behavior:none !important;
        touch-action:none !important;
      }

      body.svr-android-play #svrBootDiagPanel,
      body.svr-android-play #svrRuntimeErrorPanel,
      body.svr-android-play .svr-debug,
      body.svr-android-play [data-debug-panel] {
        display:none !important;
        opacity:0 !important;
        pointer-events:none !important;
      }

      body.svr-android-play #svrStrictLoader,
      body.svr-android-play #svrLoadingPro {
        display:none !important;
        opacity:0 !important;
        pointer-events:none !important;
      }

      body.svr-android-play #svrDropMenu,
      body.svr-android-play #svrTopMenu {
        top: max(8px, env(safe-area-inset-top)) !important;
        right: max(8px, env(safe-area-inset-right)) !important;
        z-index: 2147483200 !important;
        transform: scale(.82);
        transform-origin: top right;
      }

      body.svr-android-play #svrDropButton,
      body.svr-android-play #svrMenuButton {
        padding: 7px 10px !important;
        border-radius: 12px !important;
        font-size: 13px !important;
        background: rgba(0,0,0,.72) !important;
      }

      body.svr-android-play #svrDropPanel,
      body.svr-android-play #svrMenuPanel {
        width: min(235px, 54vw) !important;
        max-height: 58vh !important;
      }

      body.svr-android-play .svrDropItem,
      body.svr-android-play .svrMenuItem {
        padding: 8px 10px !important;
        font-size: 12px !important;
      }

      body.svr-android-play button,
      body.svr-android-play a {
        -webkit-tap-highlight-color: transparent;
      }

      body.svr-android-play canvas {
        display:block !important;
        visibility:visible !important;
        opacity:1 !important;
        width:100vw !important;
        height:100vh !important;
      }

      body.svr-android-play #svrAndroidPlayHud {
        position: fixed;
        left: max(8px, env(safe-area-inset-left));
        bottom: max(8px, env(safe-area-inset-bottom));
        z-index: 2147483190;
        display: flex;
        gap: 8px;
        align-items: center;
        font-family: Consolas, system-ui, sans-serif;
        pointer-events: auto;
      }

      body.svr-android-play #svrAndroidPlayHud button {
        border: 1px solid rgba(0,255,213,.65);
        background: rgba(0,0,0,.62);
        color: #eaffff;
        border-radius: 12px;
        padding: 9px 12px;
        font-weight: 900;
        font-size: 12px;
        box-shadow: 0 0 12px rgba(0,255,213,.18);
      }

      body.svr-android-play #svrAndroidPad {
        position: fixed;
        left: max(8px, env(safe-area-inset-left));
        bottom: max(54px, calc(env(safe-area-inset-bottom) + 54px));
        width: 118px;
        height: 118px;
        z-index: 2147483185;
        border: 1px solid rgba(0,255,213,.32);
        border-radius: 50%;
        background: rgba(0,255,213,.06);
        box-shadow: inset 0 0 24px rgba(0,255,213,.08);
        touch-action: none;
        opacity: .72;
      }

      body.svr-android-play #svrAndroidPadKnob {
        position: absolute;
        left: 41px;
        top: 41px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,.45);
        background: rgba(0,255,213,.38);
        box-shadow: 0 0 16px rgba(0,255,213,.28);
      }

      body.svr-android-play #svrAndroidTurn {
        position: fixed;
        right: max(18px, calc(env(safe-area-inset-right) + 18px));
        bottom: max(58px, calc(env(safe-area-inset-bottom) + 58px));
        width: 128px;
        height: 128px;
        z-index: 2147483185;
        pointer-events: none;
      }

      body.svr-android-play #svrAndroidTurn button {
        pointer-events: auto;
        position:absolute;
        width:58px;
        height:58px;
        border-radius:50%;
        border:1px solid rgba(0,255,213,.42);
        background:rgba(0,0,0,.48);
        color:#eaffff;
        font-size:24px;
        font-weight:900;
      }

      body.svr-android-play #svrTurnLeft { left:0; top:34px; }
      body.svr-android-play #svrTurnRight { right:0; top:34px; }

      @media (orientation: portrait) and (max-width: 900px) {
        body.svr-android-play #svrLandscapeHint { display:flex !important; }
      }

      @media (orientation: landscape) and (max-width: 940px) {
        body.svr-android-play #svrLandscapeHint { display:none !important; }
      }
    `;
    document.head.appendChild(s);
  }

  function hideDiagnosticPanels(){
    ["svrBootDiagPanel","svrRuntimeErrorPanel","svrLoadingPro","svrStrictLoader"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = "none";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
      }
    });
  }

  function makeHud(){
    if (!isMobileLike()) return;
    if (document.getElementById("svrAndroidPlayHud")) return;

    const hud = document.createElement("div");
    hud.id = "svrAndroidPlayHud";
    hud.innerHTML = `
      <button id="svrAndroidHideUi" type="button">Hide UI</button>
      <button id="svrAndroidMenuToggle" type="button">Menu</button>
    `;
    document.body.appendChild(hud);

    document.getElementById("svrAndroidHideUi").onclick = () => {
      document.body.classList.toggle("svr-ui-hidden");
      const hidden = document.body.classList.contains("svr-ui-hidden");
      ["svrDropMenu","svrTopMenu","svrAndroidPad","svrAndroidTurn"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = hidden ? "none" : "";
      });
      document.getElementById("svrAndroidHideUi").textContent = hidden ? "Show UI" : "Hide UI";
    };

    document.getElementById("svrAndroidMenuToggle").onclick = () => {
      const p = document.getElementById("svrDropPanel") || document.getElementById("svrMenuPanel");
      if (p) p.classList.toggle("open");
    };
  }

  function makeTouchControls(){
    if (!isMobileLike()) return;
    if (!document.getElementById("svrAndroidPad")) {
      const pad = document.createElement("div");
      pad.id = "svrAndroidPad";
      pad.innerHTML = '<div id="svrAndroidPadKnob"></div>';
      document.body.appendChild(pad);
      bindPad(pad);
    }

    if (!document.getElementById("svrAndroidTurn")) {
      const turn = document.createElement("div");
      turn.id = "svrAndroidTurn";
      turn.innerHTML = '<button id="svrTurnLeft" type="button">â€¹</button><button id="svrTurnRight" type="button">â€º</button>';
      document.body.appendChild(turn);
      document.getElementById("svrTurnLeft").onclick = () => dispatchMove("turn", -1);
      document.getElementById("svrTurnRight").onclick = () => dispatchMove("turn", 1);
    }
  }

  function dispatchMove(axis, value){
    window.dispatchEvent(new CustomEvent("svr-android-control", { detail: { axis, value } }));
    document.dispatchEvent(new CustomEvent("svr-android-control", { detail: { axis, value } }));

    // Keyboard fallback for runtimes already listening to WASD/arrow keys.
    const key = axis === "turn" ? (value < 0 ? "ArrowLeft" : "ArrowRight") : (value < 0 ? "s" : "w");
    window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles:true }));
    setTimeout(() => window.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles:true })), 80);
  }

  function bindPad(pad){
    const knob = () => document.getElementById("svrAndroidPadKnob");
    let active = false;
    const center = { x: 59, y: 59 };

    function setKnob(dx, dy){
      const k = knob();
      if (k) {
        k.style.left = (41 + dx) + "px";
        k.style.top = (41 + dy) + "px";
      }
    }

    function handle(ev){
      const t = ev.touches ? ev.touches[0] : ev;
      const r = pad.getBoundingClientRect();
      let dx = t.clientX - r.left - center.x;
      let dy = t.clientY - r.top - center.y;
      const len = Math.max(1, Math.hypot(dx, dy));
      const max = 38;
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      setKnob(dx, dy);

      if (Math.abs(dy) > 14) dispatchMove("move", -dy / max);
      if (Math.abs(dx) > 22) dispatchMove("strafe", dx / max);
    }

    pad.addEventListener("touchstart", ev => { active = true; ev.preventDefault(); handle(ev); }, { passive:false });
    pad.addEventListener("touchmove", ev => { if(active){ ev.preventDefault(); handle(ev); } }, { passive:false });
    pad.addEventListener("touchend", ev => { active = false; setKnob(0,0); dispatchMove("move", 0); }, { passive:false });
  }

  function compactExistingUi(){
    if (!isMobileLike()) return;
    document.body.classList.add("svr-android-play");
    hideDiagnosticPanels();

    // Move destination buttons out of center if old UI still exists.
    document.querySelectorAll("button,a").forEach(el => {
      if (el.closest("#svrDropMenu") || el.closest("#svrTopMenu") || el.closest("#svrAndroidPlayHud")) return;
      const txt = (el.textContent || "").trim().toLowerCase();
      if (["destinations","lobby","seat","reiki","pga","legend","sponsor","scorpion","table","zen den","drive","chip/putt","vr not supported"].includes(txt)) {
        el.style.maxWidth = "150px";
        el.style.fontSize = "12px";
        el.style.opacity = ".55";
      }
    });
  }

  function init(){
    addStyle();
    compactExistingUi();
    makeHud();
    makeTouchControls();
    hideDiagnosticPanels();
    console.log("[SVR]", BUILD, "Android play overlay fix active");
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", () => setTimeout(init, 800));
  setInterval(() => { compactExistingUi(); }, 2500);
})();
