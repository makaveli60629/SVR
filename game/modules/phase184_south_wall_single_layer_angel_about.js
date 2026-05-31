// PHASE-184-SOUTH-WALL-SINGLE-LAYER-ANGEL-ABOUT-LOCK
// Final cleanup: south wall is ONE layer only. Old logo/black panels/info boards are hidden; AngelWingz art becomes the framed ABOUT feature.
import * as THREE from "three";

const PHASE = "PHASE-184-SOUTH-WALL-SINGLE-LAYER-ANGEL-ABOUT-LOCK";

if (!window.__SVR_PHASE184_SOUTH_WALL_SINGLE_LAYER__) {
  window.__SVR_PHASE184_SOUTH_WALL_SINGLE_LAYER__ = true;

  function canvasTex(draw, w = 1024, h = 512) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); draw(x, c);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }

  function panelTex(title, sub, lines = [], accent = "#d9d9ff") {
    return canvasTex((x, c) => {
      const g = x.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#050711"); g.addColorStop(1, "#14071c");
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
      x.strokeStyle = accent; x.lineWidth = 10; x.strokeRect(18, 18, c.width - 36, c.height - 36);
      x.strokeStyle = "rgba(127,245,199,.72)"; x.lineWidth = 4; x.strokeRect(48, 48, c.width - 96, c.height - 96);
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillStyle = "#fff"; x.font = "900 64px system-ui,Segoe UI,Arial"; x.fillText(String(title).toUpperCase(), c.width / 2, 108);
      x.fillStyle = "#bfffea"; x.font = "800 34px system-ui,Segoe UI,Arial"; x.fillText(String(sub).toUpperCase(), c.width / 2, 174);
      x.fillStyle = "rgba(255,255,255,.88)"; x.font = "28px system-ui,Segoe UI,Arial";
      lines.slice(0, 5).forEach((line, i) => x.fillText(String(line), c.width / 2, 258 + i * 42));
      x.fillStyle = "rgba(255,255,255,.42)"; x.font = "20px system-ui,Segoe UI,Arial"; x.fillText("PHASE 184 • SINGLE SOUTH WALL LAYER", c.width / 2, c.height - 42);
    }, 1024, 512);
  }

  function bar(parent, x, y, z, w, h, color, opacity = .8) {
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    mesh.position.set(x, y, z); mesh.renderOrder = 220; parent.add(mesh); return mesh;
  }

  function frame(parent, w, h) {
    bar(parent, 0, h / 2 + .06, .06, w + .26, .05, 0xd9d9ff, .92);
    bar(parent, 0, -h / 2 - .06, .06, w + .26, .05, 0xd9d9ff, .72);
    bar(parent, -w / 2 - .06, 0, .06, .05, h + .26, 0x7ff5c7, .84);
    bar(parent, w / 2 + .06, 0, .06, .05, h + .26, 0xb48cff, .84);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w + .8, h + .8), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: .10, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    glow.position.z = .035; glow.renderOrder = 205; parent.add(glow);
  }

  async function getAngelUri() {
    try {
      const res = await fetch("./modules/phase182_lobby_audit_storefront_rebuild.js?v=phase184-read-art", { cache: "no-store" });
      const text = await res.text();
      const match = text.match(/const\s+ANGEL_URI\s*=\s*"([^"]+)"/);
      if (match && match[1] && match[1].startsWith("data:image/")) return match[1];
    } catch (err) { console.warn(`[${PHASE}] Angel art lookup failed`, err); }
    return null;
  }

  function hideSouthWallLayers(scene) {
    let hidden = 0;
    const nameRx = /PHASE182_SOUTH|PHASE183_SOUTH|PHASE183_ANGEL|PHASE183_ABOUT|PHASE182_ANGEL|PHASE182_SOUTH_WALL|ABOUT|TOURNEY|LEADERBOARD|LEGENDS WALL|SVR LEGENDS WALL/i;
    scene.traverse((obj) => {
      if (!obj || obj.name === "PHASE184_SOUTH_WALL_SINGLE_LAYER_ROOT") return;
      const label = `${obj.name || ""} ${obj.userData?.label || ""} ${obj.userData?.title || ""}`;
      const pos = new THREE.Vector3();
      try { obj.getWorldPosition(pos); } catch (_err) { pos.set(999, 999, 999); }
      const geo = obj.geometry;
      const type = geo?.type || "";
      const southZone = pos.z > 7.2 && Math.abs(pos.x) < 8.0 && pos.y > .35 && pos.y < 6.9;
      const panelLike = !!geo && /PlaneGeometry|BoxGeometry/.test(type);
      if (nameRx.test(label) || (southZone && panelLike)) {
        obj.visible = false;
        obj.userData.phase184HiddenSouthLayer = true;
        hidden++;
      }
    });
    return hidden;
  }

  async function build(scene) {
    if (!scene) return false;
    hideSouthWallLayers(scene);
    const old = scene.getObjectByName("PHASE184_SOUTH_WALL_SINGLE_LAYER_ROOT");
    if (old) { old.visible = false; scene.remove(old); }

    const root = new THREE.Group();
    root.name = "PHASE184_SOUTH_WALL_SINGLE_LAYER_ROOT";
    root.position.set(0, 3.03, 13.34);
    root.lookAt(0, 3.03, 0);
    root.userData.phase184OfficialSouthAboutWall = true;
    scene.add(root);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(8.2, 5.65), new THREE.MeshBasicMaterial({ color: 0x010104, side: THREE.DoubleSide, toneMapped: false }));
    back.name = "PHASE184_SINGLE_BACKPLATE"; back.position.z = -.04; back.renderOrder = 190; root.add(back);

    const title = new THREE.Mesh(new THREE.PlaneGeometry(7.55, .72), new THREE.MeshBasicMaterial({ map: panelTex("ABOUT SVR POKER", "Play-money VR poker • sponsor rooms • community impact", ["Official south wall area"], "#d9d9ff"), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    title.name = "PHASE184_ABOUT_TITLE_ONLY_LAYER"; title.position.set(0, 2.68, .08); title.renderOrder = 230; root.add(title);

    const artUri = await getAngelUri();
    if (artUri) {
      new THREE.TextureLoader().load(artUri, (img) => {
        img.colorSpace = THREE.SRGBColorSpace; img.anisotropy = 8;
        const art = new THREE.Mesh(new THREE.PlaneGeometry(5.95, 4.35), new THREE.MeshBasicMaterial({ map: img, transparent: false, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
        art.name = "PHASE184_ANGELWINGZ_REPLACES_LOGO_ART"; art.position.set(0, .30, .10); art.renderOrder = 240; root.add(art); frame(art, 5.95, 4.35);
      });
    } else {
      const artFallback = new THREE.Mesh(new THREE.PlaneGeometry(5.95, 4.35), new THREE.MeshBasicMaterial({ map: panelTex("ANGELWINGZ ART", "Reloading image", ["Deploy then Ctrl+F5", "This panel replaces logo area"], "#d9d9ff"), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
      artFallback.position.set(0, .30, .10); artFallback.renderOrder = 240; root.add(artFallback); frame(artFallback, 5.95, 4.35);
    }

    const mission = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 1.38), new THREE.MeshBasicMaterial({ map: panelTex("MISSION", "Why SVR exists", ["Social VR poker", "Play-money chips", "Community impact", "Sponsor-supported rooms"], "#7ff5c7"), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    mission.position.set(-3.58, -1.74, .11); mission.renderOrder = 232; root.add(mission); frame(mission, 2.08, 1.38);

    const hubs = new THREE.Mesh(new THREE.PlaneGeometry(2.08, 1.38), new THREE.MeshBasicMaterial({ map: panelTex("HUBS", "Private rooms", ["Scorpion Poker", "Reiki placeholder", "PGA Training", "Store & Lounge"], "#b48cff"), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    hubs.position.set(3.58, -1.74, .11); hubs.renderOrder = 232; root.add(hubs); frame(hubs, 2.08, 1.38);

    const light = new THREE.PointLight(0xd9d9ff, 1.5, 9, 2); light.position.set(0, 1.3, 1.05); root.add(light);
    const status = document.getElementById("status"); if (status) status.textContent = "Phase 184: south wall single-layer AngelWingz About wall locked";
    document.querySelectorAll(".pill").forEach((pill) => { if (/PHASE-|Hands ready/i.test(pill.textContent || "")) pill.textContent = "PHASE-184-SOUTH-WALL-SINGLE-LAYER-ANGEL-ABOUT-LOCK"; });
    window.SVR_PHASE184_SOUTH_WALL = { phase: PHASE, mode: "one layer only", art: "AngelWingz replaces logo", position: { x: 0, y: 3.03, z: 13.34 } };
    console.log(`[${PHASE}] loaded`, window.SVR_PHASE184_SOUTH_WALL);
    return true;
  }

  function boot() {
    const tryHook = () => { const scene = window.SVR_GAME?.scene; if (!scene) return false; build(scene); return true; };
    if (!tryHook()) { let n = 0; const id = setInterval(() => { n++; if (tryHook() || n > 120) clearInterval(id); }, 250); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
}
