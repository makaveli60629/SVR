// PHASE-183-SOUTH-WALL-ABOUT-ANGEL-FRAME-LOCK
// Places the uploaded Angel Wings/Sword artwork on the south wall as the official ABOUT area.
// It hides the older three small info boards in that wall zone and replaces them with a larger framed art + refined ABOUT panels.
import * as THREE from "three";

const PHASE = "PHASE-183-SOUTH-WALL-ABOUT-ANGEL-FRAME-LOCK";

if (!window.__SVR_PHASE183_SOUTH_WALL_ABOUT_ART__) {
  window.__SVR_PHASE183_SOUTH_WALL_ABOUT_ART__ = true;

  function canvasTex(draw, w = 1024, h = 512) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); draw(x, c);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }

  function textTex(title, subtitle, lines = [], accent = "#8fe0ff") {
    return canvasTex((x, c) => {
      const g = x.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "rgba(4,7,15,0.98)"); g.addColorStop(1, "rgba(20,7,28,0.96)");
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
      x.strokeStyle = accent; x.lineWidth = 10; x.strokeRect(18, 18, c.width - 36, c.height - 36);
      x.strokeStyle = "rgba(180,140,255,.70)"; x.lineWidth = 4; x.strokeRect(48, 48, c.width - 96, c.height - 96);
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillStyle = "#f8fbff"; x.font = "900 64px system-ui,Segoe UI,Arial"; x.fillText(String(title).toUpperCase(), c.width / 2, 108);
      x.fillStyle = "#bfffea"; x.font = "800 34px system-ui,Segoe UI,Arial"; x.fillText(String(subtitle).toUpperCase(), c.width / 2, 174);
      x.fillStyle = "rgba(255,255,255,.88)"; x.font = "28px system-ui,Segoe UI,Arial";
      lines.slice(0, 5).forEach((line, i) => x.fillText(String(line), c.width / 2, 258 + i * 42));
      x.fillStyle = "rgba(255,255,255,.50)"; x.font = "22px system-ui,Segoe UI,Arial"; x.fillText(PHASE, c.width / 2, c.height - 44);
    }, 1024, 512);
  }

  function frame(parent, w, h, colorA = 0xd9d9ff, colorB = 0x7ff5c7, z = .05) {
    const mk = (x,y,sx,sy,color,opacity)=>{ const m = new THREE.Mesh(new THREE.PlaneGeometry(sx,sy), new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, toneMapped:false })); m.position.set(x,y,z); m.renderOrder = 120; parent.add(m); return m; };
    mk(0, h/2+.055, w+.24, .045, colorA, .92); mk(0, -h/2-.055, w+.24, .045, colorA, .70);
    mk(-w/2-.055, 0, .045, h+.24, colorB, .84); mk(w/2+.055, 0, .045, h+.24, colorB, .84);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w + .70, h + .70), new THREE.MeshBasicMaterial({ color: colorA, transparent:true, opacity:.10, side:THREE.DoubleSide, depthWrite:false }));
    glow.position.z = z - .025; glow.renderOrder = 100; parent.add(glow); return glow;
  }

  function hideOldSouthInfoBoards(scene) {
    let hidden = 0;
    scene.traverse((o) => {
      if (!o || !o.isMesh || !o.geometry) return;
      const type = o.geometry.type || "";
      const p = o.geometry.parameters || {};
      const isPlane = /PlaneGeometry/.test(type);
      const w = Number(p.width || 0), h = Number(p.height || 0);
      const pos = new THREE.Vector3(); o.getWorldPosition(pos);
      // Old ABOUT / TOURNEY / LEADERBOARD boards are small plane panels on the south/about wall.
      if (isPlane && pos.z > 8.0 && pos.y > .75 && pos.y < 3.2 && w >= 1.75 && w <= 2.35 && h >= 1.75 && h <= 2.35) {
        o.visible = false;
        o.userData.phase183HiddenOldAboutBoard = true;
        hidden++;
      }
    });
    return hidden;
  }

  async function getAngelUri() {
    // Reuse the already-committed Phase 182 data URI so this module stays small and cache-safe.
    try {
      const res = await fetch("./modules/phase182_lobby_audit_storefront_rebuild.js?v=phase183-read-art", { cache: "no-store" });
      const text = await res.text();
      const m = text.match(/const\s+ANGEL_URI\s*=\s*"([^"]+)"/);
      if (m && m[1]) return m[1];
    } catch (err) { console.warn(`[${PHASE}] could not read Phase 182 art URI`, err); }
    return null;
  }

  async function addSouthAboutArea(scene) {
    if (!scene || scene.getObjectByName("PHASE183_SOUTH_WALL_ABOUT_AREA_ROOT")) return false;
    const hidden = hideOldSouthInfoBoards(scene);
    const artUri = await getAngelUri();

    const root = new THREE.Group();
    root.name = "PHASE183_SOUTH_WALL_ABOUT_AREA_ROOT";
    // Same wall zone as the old ABOUT/TOURNEY/LEADERBOARD boards, but larger and higher.
    root.position.set(0, 2.95, 13.42);
    root.lookAt(0, 2.95, 0);
    scene.add(root);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(9.25, 5.95), new THREE.MeshBasicMaterial({ color: 0x010104, side: THREE.DoubleSide, toneMapped:false }));
    back.name = "PHASE183_SOUTH_ABOUT_BLACK_BACKPLATE";
    back.position.z = -.035; back.renderOrder = 90; root.add(back);

    const title = new THREE.Mesh(new THREE.PlaneGeometry(7.4, .62), new THREE.MeshBasicMaterial({ map: textTex("ABOUT SVR POKER", "Play-money VR poker • sponsor rooms • community impact", ["South wall official about area"], "#d9d9ff"), transparent:true, side:THREE.DoubleSide, depthWrite:false, toneMapped:false }));
    title.name = "PHASE183_ABOUT_TITLE_BAR"; title.position.set(0, 2.85, .06); title.renderOrder = 130; root.add(title);

    if (artUri) {
      new THREE.TextureLoader().load(artUri, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
        const art = new THREE.Mesh(new THREE.PlaneGeometry(5.75, 4.42), new THREE.MeshBasicMaterial({ map: tex, transparent:true, side:THREE.DoubleSide, depthWrite:false, toneMapped:false }));
        art.name = "PHASE183_ANGEL_WINGS_SWORD_FRAMED_ART";
        art.position.set(0, .36, .08); art.renderOrder = 135; root.add(art); frame(art, 5.75, 4.42, 0xe7e7ff, 0x7ff5c7, .04);
      });
    } else {
      const fallback = new THREE.Mesh(new THREE.PlaneGeometry(5.75, 4.42), new THREE.MeshBasicMaterial({ map: textTex("ANGEL ART", "Asset pending reload", ["Refresh page after deploy", "Ctrl + F5"], "#d9d9ff"), transparent:true, side:THREE.DoubleSide }));
      fallback.position.set(0, .36, .08); root.add(fallback); frame(fallback, 5.75, 4.42, 0xe7e7ff, 0x7ff5c7, .04);
    }

    const left = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.55), new THREE.MeshBasicMaterial({ map: textTex("MISSION", "Why SVR exists", ["Social VR poker", "Play-money chips", "Sponsor-supported events", "Community giving goals"], "#7ff5c7"), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
    left.name = "PHASE183_ABOUT_MISSION_PANEL"; left.position.set(-3.92, -1.52, .09); left.renderOrder = 132; root.add(left); frame(left, 2.15, 1.55, 0x7ff5c7, 0xb48cff, .035);

    const right = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.55), new THREE.MeshBasicMaterial({ map: textTex("HUBS", "Private rooms", ["Scorpion Poker", "Reiki placeholder", "PGA Training", "Store & Lounge"], "#b48cff"), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
    right.name = "PHASE183_ABOUT_HUBS_PANEL"; right.position.set(3.92, -1.52, .09); right.renderOrder = 132; root.add(right); frame(right, 2.15, 1.55, 0xb48cff, 0x7ff5c7, .035);

    const lightA = new THREE.PointLight(0xd9d9ff, 1.4, 9, 2); lightA.position.set(0, 1.8, 1.1); root.add(lightA);
    const lightB = new THREE.PointLight(0x7ff5c7, .8, 7, 2); lightB.position.set(-3.6, -1.4, 1.0); root.add(lightB);

    const status = document.getElementById("status"); if (status) status.textContent = `Phase 183: south wall ABOUT art locked (${hidden} old boards hidden)`;
    window.SVR_PHASE183_SOUTH_WALL_ABOUT_ART = { phase: PHASE, hiddenOldBoards: hidden, position: { x:0, y:2.95, z:13.42 }, art: "AngelWingz framed on south/about wall" };
    console.log(`[${PHASE}] loaded`, window.SVR_PHASE183_SOUTH_WALL_ABOUT_ART);
    return true;
  }

  function boot() {
    const tryHook = () => { const scene = window.SVR_GAME?.scene; if (!scene) return false; addSouthAboutArea(scene); return true; };
    if (!tryHook()) { let n = 0; const id = setInterval(() => { n++; if (tryHook() || n > 120) clearInterval(id); }, 250); }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once:true }); else boot();
}
