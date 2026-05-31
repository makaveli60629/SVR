// PHASE-185-SOUTH-WALL-ANGLE-ANGEL-FIX-LOCK
// Fixes the south/about wall: one aligned layer only, AngelWingz art replacing the old logo/panels.
// Runs after prior south-wall modules and repeatedly hides old stacked panels.
import * as THREE from "three";

const PHASE = "PHASE-185-SOUTH-WALL-ANGLE-ANGEL-FIX-LOCK";
const ANGEL_URI = "data:image/webp;base64,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";

if (!window.__SVR_PHASE185_SOUTH_WALL_ANGLE_FIX__) {
  window.__SVR_PHASE185_SOUTH_WALL_ANGLE_FIX__ = true;

  function canvasTex(draw, w = 1024, h = 256) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); draw(x, c);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }

  function titleTex() {
    return canvasTex((x, c) => {
      const g = x.createLinearGradient(0, 0, c.width, c.height);
      g.addColorStop(0, "#050710"); g.addColorStop(1, "#13051d");
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
      x.strokeStyle = "rgba(217,217,255,.95)"; x.lineWidth = 8; x.strokeRect(16, 16, c.width - 32, c.height - 32);
      x.strokeStyle = "rgba(127,245,199,.75)"; x.lineWidth = 4; x.strokeRect(44, 44, c.width - 88, c.height - 88);
      x.textAlign = "center"; x.textBaseline = "middle";
      x.fillStyle = "#ffffff"; x.font = "900 54px system-ui,Segoe UI,Arial"; x.fillText("ABOUT SVR POKER", c.width / 2, 96);
      x.fillStyle = "#bfffea"; x.font = "800 26px system-ui,Segoe UI,Arial"; x.fillText("AngelWingz wall art • community mission • private room portals", c.width / 2, 158);
      x.fillStyle = "rgba(255,255,255,.48)"; x.font = "18px system-ui,Segoe UI,Arial"; x.fillText("PHASE 185 • SOUTH WALL ANGLE LOCK", c.width / 2, 214);
    });
  }

  function makeBar(parent, x, y, z, w, h, color, opacity = .82) {
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z); m.renderOrder = 420; parent.add(m); return m;
  }

  function addNeonFrame(parent, w, h, z = .075) {
    makeBar(parent, 0, h / 2 + .06, z, w + .28, .05, 0xd9d9ff, .95);
    makeBar(parent, 0, -h / 2 - .06, z, w + .28, .05, 0xd9d9ff, .72);
    makeBar(parent, -w / 2 - .06, 0, z, .05, h + .28, 0x7ff5c7, .88);
    makeBar(parent, w / 2 + .06, 0, z, .05, h + .28, 0xb48cff, .88);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(w + .80, h + .80), new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: .10, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    glow.position.z = z - .045; glow.renderOrder = 390; parent.add(glow);
  }

  function isUnderFinalRoot(obj) {
    for (let p = obj; p; p = p.parent) if (p.name === "PHASE185_SOUTH_WALL_ANGLE_ALIGNED_ROOT") return true;
    return false;
  }

  function hideOldSouthLayers(scene) {
    let hidden = 0;
    const nameRx = /PHASE18[234]_SOUTH|PHASE18[234]_ANGEL|PHASE18[234]_ABOUT|PHASE184_SINGLE|PHASE184_ANGEL|MISSION|HUBS|ABOUT|TOURNEY|LEADERBOARD|LEGENDS WALL|SVR LEGENDS WALL/i;
    scene.traverse((obj) => {
      if (!obj || isUnderFinalRoot(obj)) return;
      const label = `${obj.name || ""} ${obj.userData?.label || ""} ${obj.userData?.title || ""}`;
      let pos = new THREE.Vector3(999, 999, 999);
      try { obj.getWorldPosition(pos); } catch (_err) {}
      const geo = obj.geometry;
      const params = geo?.parameters || {};
      const type = geo?.type || "";
      const southPlane = /PlaneGeometry/.test(type) && pos.z > 7.0 && Math.abs(pos.x) < 8.8 && pos.y > .25 && pos.y < 6.8;
      const panelSize = (params.width || 0) > .5 && (params.width || 0) < 10.5 && (params.height || 0) > .25 && (params.height || 0) < 7.0;
      if (nameRx.test(label) || (southPlane && panelSize)) {
        obj.visible = false;
        obj.userData.phase185HiddenOldSouthLayer = true;
        hidden++;
      }
    });
    return hidden;
  }

  function buildFinalWall(scene) {
    if (!scene) return false;
    hideOldSouthLayers(scene);
    const prior = scene.getObjectByName("PHASE185_SOUTH_WALL_ANGLE_ALIGNED_ROOT");
    if (prior) { prior.visible = false; scene.remove(prior); }

    const root = new THREE.Group();
    root.name = "PHASE185_SOUTH_WALL_ANGLE_ALIGNED_ROOT";
    // Flush to the actual south wall plane instead of floating out in front of the lobby.
    root.position.set(0, 3.04, 8.82);
    root.rotation.y = Math.PI;
    root.userData.phase185OfficialSouthAboutWall = true;
    scene.add(root);

    const back = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 5.15), new THREE.MeshBasicMaterial({ color: 0x010104, side: THREE.DoubleSide, depthWrite: true, toneMapped: false }));
    back.name = "PHASE185_FLUSH_SINGLE_BACKPLATE"; back.position.z = -.035; back.renderOrder = 360; root.add(back);

    const title = new THREE.Mesh(new THREE.PlaneGeometry(7.1, .58), new THREE.MeshBasicMaterial({ map: titleTex(), transparent: true, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    title.name = "PHASE185_ABOUT_TITLE_STRIP"; title.position.set(0, 2.36, .08); title.renderOrder = 430; root.add(title);

    const loader = new THREE.TextureLoader();
    loader.load(ANGEL_URI, (img) => {
      img.colorSpace = THREE.SRGBColorSpace; img.anisotropy = 8;
      const art = new THREE.Mesh(new THREE.PlaneGeometry(5.95, 4.02), new THREE.MeshBasicMaterial({ map: img, transparent: false, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
      art.name = "PHASE185_ANGELWINGZ_ART_ON_SOUTH_WALL"; art.position.set(0, .06, .10); art.renderOrder = 440; root.add(art);
      addNeonFrame(art, 5.95, 4.02, .06);
    }, undefined, (err) => {
      console.warn(`[${PHASE}] AngelWingz texture failed`, err);
    });

    const lower = new THREE.Mesh(new THREE.PlaneGeometry(6.2, .36), new THREE.MeshBasicMaterial({ color: 0x050710, transparent: true, opacity: .88, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
    lower.name = "PHASE185_SINGLE_LAYER_BOTTOM_CAPTION_BACK"; lower.position.set(0, -2.36, .09); lower.renderOrder = 425; root.add(lower);
    makeBar(root, 0, -2.36, .12, 6.28, .035, 0xd9d9ff, .86);

    const light = new THREE.PointLight(0xd9d9ff, 1.25, 8.5, 2); light.position.set(0, .8, 1.1); root.add(light);

    window.SVR_PHASE185_SOUTH_WALL = { phase: PHASE, mode: "single aligned south wall layer", art: "AngelWingz embedded directly on wall", position: { x: 0, y: 3.04, z: 8.82, rotationY: 180 } };
    const status = document.getElementById("status"); if (status) status.textContent = "Phase 185: south wall aligned + AngelWingz fixed";
    document.querySelectorAll(".pill").forEach((pill) => { if (/PHASE-|Hands ready|BUILD:/i.test(pill.textContent || "")) pill.textContent = PHASE; });
    console.log(`[${PHASE}] loaded`, window.SVR_PHASE185_SOUTH_WALL);
    return true;
  }

  function boot() {
    const tryHook = () => {
      const scene = window.SVR_GAME?.scene;
      if (!scene) return false;
      buildFinalWall(scene);
      // Keep old polling modules from re-stacking the south wall after this fix.
      let passes = 0;
      const id = setInterval(() => {
        passes++;
        hideOldSouthLayers(scene);
        const root = scene.getObjectByName("PHASE185_SOUTH_WALL_ANGLE_ALIGNED_ROOT");
        if (root) root.visible = true;
        if (passes > 24) clearInterval(id);
      }, 500);
      return true;
    };
    if (!tryHook()) { let n = 0; const id = setInterval(() => { n++; if (tryHook() || n > 160) clearInterval(id); }, 200); }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
}
