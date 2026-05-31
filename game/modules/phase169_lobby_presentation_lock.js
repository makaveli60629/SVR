// PHASE-169-LOBBY-PRESENTATION-LOCK
// Safe presentation layer only. Does not redesign lobby geometry, website, Reiki, PGA, or Scorpion runtime.
(function(){
  const PHASE = "PHASE-169-LOBBY-PRESENTATION-LOCK";
  if (window.__SVR_PHASE169_LOBBY_PRESENTATION__) return;
  window.__SVR_PHASE169_LOBBY_PRESENTATION__ = true;

  const isPreview = new URLSearchParams(location.search).has("preview") || new URLSearchParams(location.search).get("cam") === "director" || window.self !== window.top;
  if (isPreview) return;

  const css = document.createElement("style");
  css.id = "svr-phase169-lobby-presentation-style";
  css.textContent = `
    #svrPhase169Boot {
      position: fixed;
      inset: 0;
      z-index: 75;
      display: grid;
      place-items: center;
      padding: 24px;
      pointer-events: none;
      background: radial-gradient(circle at center, rgba(36,18,64,.82), rgba(0,0,0,.55) 48%, rgba(0,0,0,.82));
      transition: opacity .55s ease, visibility .55s ease;
    }
    #svrPhase169Boot.hide { opacity: 0; visibility: hidden; }
    #svrPhase169BootCard {
      width: min(760px, 92vw);
      border: 1px solid rgba(180,140,255,.42);
      border-radius: 28px;
      padding: 28px;
      text-align: center;
      color: #fff;
      background: rgba(5, 5, 13, .76);
      box-shadow: 0 0 48px rgba(146, 96, 255, .30), inset 0 0 46px rgba(120,255,186,.06);
      backdrop-filter: blur(10px);
    }
    #svrPhase169BootCard h1 { margin: 0 0 8px; letter-spacing: .08em; font-size: clamp(28px, 6vw, 60px); text-shadow: 0 0 24px rgba(180,140,255,.8); }
    #svrPhase169BootCard p { margin: 8px auto; max-width: 560px; color: #d9d2ff; line-height: 1.48; }
    #svrPhase169BootCard .phase-pill { display:inline-block; margin-top:14px; border:1px solid rgba(120,255,186,.45); border-radius:999px; padding:8px 13px; color:#dfffee; background:rgba(2,10,8,.58); font-size:12px; letter-spacing:.05em; }
    #svrPhase169Directory {
      position: fixed;
      right: 14px;
      top: 72px;
      z-index: 22;
      width: min(310px, calc(100vw - 28px));
      border: 1px solid rgba(180,140,255,.38);
      border-radius: 18px;
      padding: 12px;
      color: #fff;
      background: rgba(4,5,12,.72);
      box-shadow: 0 16px 38px rgba(0,0,0,.38);
      backdrop-filter: blur(8px);
      font-family: system-ui, Segoe UI, Arial, sans-serif;
    }
    #svrPhase169Directory.minimized .phase169-grid { display:none; }
    #svrPhase169Directory.minimized .phase169-note { display:none; }
    #svrPhase169Directory header { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
    #svrPhase169Directory h2 { margin:0; font-size:13px; letter-spacing:.08em; color:#f1e9ff; }
    #svrPhase169Directory .phase169-toggle { border:1px solid rgba(120,255,186,.38); background:rgba(0,0,0,.42); color:#fff; border-radius:999px; padding:5px 9px; cursor:pointer; font-size:12px; }
    #svrPhase169Directory .phase169-grid { display:grid; grid-template-columns:1fr 1fr; gap:7px; }
    #svrPhase169Directory button.phase169-room {
      border: 1px solid rgba(120,255,186,.34);
      border-radius: 14px;
      padding: 9px 8px;
      min-height: 42px;
      background: linear-gradient(180deg, rgba(20,26,32,.72), rgba(0,0,0,.48));
      color: #eafff5;
      text-align: left;
      cursor: pointer;
      font-size: 12px;
    }
    #svrPhase169Directory button.phase169-room strong { display:block; color:#fff; font-size:12px; }
    #svrPhase169Directory button.phase169-room span { display:block; color:#aeeed2; font-size:10px; margin-top:2px; }
    #svrPhase169Directory .phase169-note { margin-top:9px; color:#aaa3d9; font-size:11px; line-height:1.35; }
    body.xr-presenting #svrPhase169Directory, body.xr-presenting #svrPhase169Boot { display:none!important; }
    @media (max-width: 760px) { #svrPhase169Directory { left: 12px; right: 12px; top: auto; bottom: 72px; width:auto; } }
  `;
  document.head.appendChild(css);

  const boot = document.createElement("div");
  boot.id = "svrPhase169Boot";
  boot.innerHTML = `<section id="svrPhase169BootCard"><h1>SVR POKER</h1><p>Lobby presentation lock is active. Portals remain clean, private scenes stay separate, and the current lobby layout is preserved.</p><div class="phase-pill">${PHASE}</div></section>`;
  document.body.appendChild(boot);
  setTimeout(()=>boot.classList.add("hide"), 1800);
  setTimeout(()=>boot.remove(), 2500);

  const directory = document.createElement("aside");
  directory.id = "svrPhase169Directory";
  directory.innerHTML = `
    <header><h2>ROOM DIRECTORY</h2><button class="phase169-toggle" type="button">Hide</button></header>
    <div class="phase169-grid">
      <button class="phase169-room" data-target="seat"><strong>Table Seat</strong><span>Join playable area</span></button>
      <button class="phase169-room" data-target="scorpion"><strong>Scorpion</strong><span>Private poker room</span></button>
      <button class="phase169-room" data-target="reikiRoom"><strong>Reiki Room</strong><span>Meditation scene</span></button>
      <button class="phase169-room" data-target="pgaDrive"><strong>PGA Drive</strong><span>Private range</span></button>
      <button class="phase169-room" data-target="pgaChipPutt"><strong>Chip/Putt</strong><span>Short game room</span></button>
      <button class="phase169-room" data-target="storeRoom"><strong>VR Store</strong><span>Store portal room</span></button>
      <button class="phase169-room" data-target="smokerLounge"><strong>Lounge</strong><span>Social room</span></button>
      <button class="phase169-room" data-target="lobby"><strong>Lobby</strong><span>Return center</span></button>
    </div>
    <div class="phase169-note">Desktop helper only. Quest/VR uses watch, portals, and controller/hand routing.</div>
  `;
  document.body.appendChild(directory);

  const toggle = directory.querySelector(".phase169-toggle");
  toggle?.addEventListener("click", ()=>{
    directory.classList.toggle("minimized");
    toggle.textContent = directory.classList.contains("minimized") ? "Show" : "Hide";
  });

  function clickSceneTarget(target){
    const nav = document.getElementById("sceneNav");
    if (!nav) return false;
    const byPrivate = nav.querySelector(`[data-private="${target}"]`);
    const byScene = nav.querySelector(`[data-scene="${target}"]`);
    const btn = byPrivate || byScene;
    if (!btn) return false;
    btn.click();
    return true;
  }

  directory.querySelectorAll("button.phase169-room").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const target = btn.getAttribute("data-target");
      if (!target) return;
      const ok = clickSceneTarget(target);
      const status = document.getElementById("status");
      if (status) status.textContent = ok ? `Directory: ${target}` : `Directory target unavailable: ${target}`;
    });
  });

  window.addEventListener("keydown", (e)=>{
    if (e.repeat) return;
    if (e.code === "KeyD") {
      directory.classList.toggle("minimized");
      if (toggle) toggle.textContent = directory.classList.contains("minimized") ? "Show" : "Hide";
    }
  });

  window.SVR_PHASE169_LOBBY_PRESENTATION = { phase: PHASE, directory: true, protected: ["site", "lobby-layout", "private-scenes"] };
  console.log(`[${PHASE}] loaded`);
})();
