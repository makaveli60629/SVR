// PHASE-171-LOBBY-REFINE-SEAT-TAGS
// Targeted visual polish only: smaller seat/player tags, cleaner lobby UI, light non-destructive lobby accents.
import * as THREE from "three";

const PHASE = "PHASE-171-LOBBY-REFINE-SEAT-TAGS";
if (!window.__SVR_PHASE171_LOBBY_REFINE__) {
  window.__SVR_PHASE171_LOBBY_REFINE__ = true;

  const params = new URLSearchParams(location.search);
  const isPreview = params.has("preview") || params.get("cam") === "director" || window.self !== window.top;

  function installDomPolish(){
    if (document.getElementById("svr-phase171-style")) return;
    const style = document.createElement("style");
    style.id = "svr-phase171-style";
    style.textContent = `
      #hud { top: 10px!important; left: 10px!important; right: 10px!important; }
      #hud .pill, #hud .btn { font-size: 11px!important; padding: 6px 10px!important; }
      #sceneNav {
        bottom: 10px!important;
        gap: 6px!important;
        padding: 6px 8px!important;
        margin: 0 auto!important;
        max-width: min(980px, calc(100vw - 24px));
        border: 1px solid rgba(180,140,255,.20);
        border-radius: 999px;
        background: rgba(0,0,0,.22);
        backdrop-filter: blur(8px);
      }
      #sceneNav .scene-btn {
        font-size: 11px!important;
        padding: 7px 10px!important;
        border-radius: 999px!important;
        box-shadow: 0 6px 18px rgba(0,0,0,.24);
      }
      #svrPhase169Directory { transform: scale(.92); transform-origin: top right; opacity:.94; }
      #svrPhase170Poker { transform: scale(.92); transform-origin: top left; opacity:.94; }
      .svr-phase171-soft-hide { opacity:.72!important; }
      @media (max-width: 760px) {
        #sceneNav { border-radius: 18px; }
        #svrPhase169Directory, #svrPhase170Poker { transform: scale(.88); }
      }
    `;
    document.head.appendChild(style);
  }

  function compactButtonText(){
    const map = new Map([
      ["Reiki Hub", "Reiki"],
      ["Reiki Room", "Reiki Room"],
      ["PGA Hub", "PGA"],
      ["Scorpion Room", "Scorpion"],
      ["Chip/Putt", "Chip/Putt"]
    ]);
    document.querySelectorAll("#sceneNav .scene-btn").forEach(btn=>{
      const t = (btn.textContent || "").trim();
      if (map.has(t)) btn.textContent = map.get(t);
    });
  }

  function likelySeatTag(obj){
    const hay = `${obj.name || ""} ${obj.userData?.label || ""} ${obj.userData?.text || ""} ${obj.userData?.title || ""}`.toLowerCase();
    if (/seat|player|bot|dealer|stack|tag|label|name/.test(hay)) return true;
    if (obj.isSprite && obj.position?.y > 1.15 && Math.max(obj.scale?.x || 0, obj.scale?.y || 0) > 0.65) return true;
    return false;
  }

  function shrinkSeatTags(scene){
    let changed = 0;
    scene.traverse(obj=>{
      if (!obj || obj.userData?.phase171TagScaled) return;
      if (!likelySeatTag(obj)) return;
      if (!(obj.isSprite || obj.isMesh || obj.isGroup)) return;
      const sx = Math.abs(obj.scale?.x || 1);
      const sy = Math.abs(obj.scale?.y || 1);
      const sz = Math.abs(obj.scale?.z || 1);
      if (Math.max(sx, sy, sz) < 0.22) return;
      if (obj.isSprite) {
        obj.scale.multiplyScalar(0.48);
        obj.position.y = Math.min(obj.position.y, 2.05);
        if (obj.material) {
          obj.material.opacity = Math.min(obj.material.opacity ?? 1, 0.86);
          obj.material.transparent = true;
          obj.material.depthWrite = false;
        }
      } else if (/seat|player|bot|dealer|tag|label|name/i.test(`${obj.name || ""} ${obj.userData?.label || ""}`)) {
        obj.scale.multiplyScalar(0.68);
      }
      obj.userData.phase171TagScaled = true;
      changed++;
    });
    return changed;
  }

  function makeCanvasTexture(text, sub){
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 512;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0,0,c.width,c.height);
    g.addColorStop(0,"rgba(18,8,32,0.92)");
    g.addColorStop(1,"rgba(2,16,12,0.88)");
    x.fillStyle = g;
    x.fillRect(0,0,c.width,c.height);
    x.strokeStyle = "rgba(180,140,255,0.55)";
    x.lineWidth = 8;
    x.strokeRect(24,24,c.width-48,c.height-48);
    x.fillStyle = "#f7ecff";
    x.font = "bold 76px system-ui,Segoe UI,Arial";
    x.textAlign = "center";
    x.fillText(text, c.width/2, 210);
    x.fillStyle = "#bfffe5";
    x.font = "34px system-ui,Segoe UI,Arial";
    x.fillText(sub, c.width/2, 294);
    x.fillStyle = "rgba(255,255,255,0.62)";
    x.font = "26px system-ui,Segoe UI,Arial";
    x.fillText("Portals stay private • Lobby preserved • Quest-safe polish", c.width/2, 370);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  }

  function addLobbyRefineAccents(scene){
    if (scene.userData.phase171LobbyRefined) return;
    scene.userData.phase171LobbyRefined = true;

    const ringMat = new THREE.MeshBasicMaterial({ color: 0x8d62ff, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(3.45, 3.52, 96), ringMat);
    ring.name = "PHASE171_SUBTLE_TABLE_ORBIT_RING";
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(0, 0.035, 0);
    scene.add(ring);

    const outerMat = new THREE.MeshBasicMaterial({ color: 0x7ff5c7, transparent: true, opacity: 0.09, side: THREE.DoubleSide, depthWrite: false });
    const outer = new THREE.Mesh(new THREE.RingGeometry(7.8, 7.86, 128), outerMat);
    outer.name = "PHASE171_SOFT_LOBBY_FLOW_RING";
    outer.rotation.x = -Math.PI / 2;
    outer.position.set(0, 0.032, 0);
    scene.add(outer);

    const plaqueTex = makeCanvasTexture("SVR ROOM DIRECTORY", "Choose a room from the portals or watch");
    const plaque = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 1.7), new THREE.MeshBasicMaterial({ map: plaqueTex, transparent: true, side: THREE.DoubleSide }));
    plaque.name = "PHASE171_LOBBY_DIRECTORY_PLAQUE";
    plaque.position.set(0, 2.05, -7.25);
    plaque.rotation.y = 0;
    scene.add(plaque);

    const tick = (dt)=>{
      ring.rotation.z += dt * 0.045;
      outer.rotation.z -= dt * 0.022;
      const p = 0.5 + 0.5 * Math.sin(performance.now() * 0.001);
      ring.material.opacity = 0.13 + p * 0.07;
      outer.material.opacity = 0.06 + p * 0.035;
    };
    const prev = scene.userData._tickPhase171;
    scene.userData._tickPhase171 = (dt)=>{ if (prev) prev(dt); tick(dt); };
  }

  function hookSceneTick(scene){
    if (scene.userData.phase171Hooked) return;
    scene.userData.phase171Hooked = true;
    let scanCount = 0;
    const prev = scene.userData._tickWorld;
    scene.userData._tickWorld = (dt)=>{
      if (prev) prev(dt);
      if (scene.userData._tickPhase171) scene.userData._tickPhase171(dt);
      if (scanCount < 24) {
        scanCount++;
        shrinkSeatTags(scene);
      }
    };
    shrinkSeatTags(scene);
    addLobbyRefineAccents(scene);
  }

  function boot(){
    installDomPolish();
    compactButtonText();
    const tryHook = ()=>{
      const scene = window.SVR_GAME?.scene;
      if (!scene) return false;
      hookSceneTick(scene);
      const status = document.getElementById("status");
      if (status && !status.textContent.includes("Phase 171")) status.textContent = "Phase 171 lobby refined - seat tags compact";
      return true;
    };
    if (!tryHook()) {
      let attempts = 0;
      const id = setInterval(()=>{ attempts++; if (tryHook() || attempts > 40) clearInterval(id); }, 250);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true });
  else boot();

  window.SVR_PHASE171_LOBBY_REFINE = { phase: PHASE, seatTags: "compact", lobby: "refined", protected: ["site", "reiki", "pga", "scorpion", "lobby-layout"] };
  console.log(`[${PHASE}] loaded`);
}
