// ===============================
// LOBBY LIGHTING & NEON UPGRADES
// ===============================

// Extra global lights (bright, no shadows)
addLight(el, "hemisphere", { intensity: 1.55, color: "#f2fdff", groundColor: "#07101a" }, "0 60 0");
addLight(el, "directional", { intensity: 1.9, color: "#ffffff" }, "35 45 30");
addLight(el, "point", { intensity: 2.2, distance: 180, decay: 2, color: "#00e5ff" }, "0 18 0");
addLight(el, "point", { intensity: 1.6, distance: 180, decay: 2, color: "#7b61ff" }, "-22 14 -22");

// --- Neon wall ring (mid-height) ---
const WALL_RADIUS = 30;     // match your wall radius
const WALL_RING_Y = 10.5;   // mid-height glow
const WALL_SEGMENTS = 32;

for (let i = 0; i < WALL_SEGMENTS; i++) {
  const a = (i / WALL_SEGMENTS) * Math.PI * 2;
  const x = Math.cos(a) * WALL_RADIUS;
  const z = Math.sin(a) * WALL_RADIUS;
  const rotY = (-a * 180 / Math.PI) + 90;

  // Thin neon band hugging the wall (does not block doors)
  const band = document.createElement("a-plane");
  band.setAttribute("position", `${x} ${WALL_RING_Y} ${z}`);
  band.setAttribute("rotation", `0 ${rotY} 0`);
  band.setAttribute("width", "5.5");
  band.setAttribute("height", "0.35");
  band.setAttribute("material", "color:#0b0f14; emissive:#00e5ff; emissiveIntensity:1.55; opacity:0.55; transparent:true");
  el.appendChild(band);

  // Small “sconce” light near the band
  const sconce = document.createElement("a-entity");
  sconce.setAttribute("light", "type: point; intensity: 0.95; distance: 16; decay: 2; color: #00e5ff");
  sconce.setAttribute("position", `${x} ${WALL_RING_Y + 0.35} ${z}`);
  el.appendChild(sconce);
}

// --- Upgrade Pillars: add multiple neon bands per pillar ---
function upgradePillarNeon() {
  // Find pillars by scanning cylinders with your pillar material color
  const pillars = el.querySelectorAll("a-cylinder");
  pillars.forEach(p => {
    const h = parseFloat(p.getAttribute("height") || "0");
    if (h < 10) return; // ignore non-pillars
    const pos = p.getAttribute("position");
    if (!pos) return;

    // Add 3 glow bands up the pillar
    const ys = [2.0, 6.5, 11.0];
    ys.forEach((yy, idx) => {
      const ring = document.createElement("a-ring");
      ring.setAttribute("radius-inner", "0.74");
      ring.setAttribute("radius-outer", "0.86");
      ring.setAttribute("rotation", "-90 0 0");
      ring.setAttribute("position", `${pos.x} ${yy} ${pos.z}`);
      ring.setAttribute("material",
        `color:${idx % 2 === 0 ? "#00e5ff" : "#7b61ff"}; emissive:${idx % 2 === 0 ? "#00e5ff" : "#7b61ff"}; emissiveIntensity:1.9; opacity:0.60; transparent:true`
      );
      el.appendChild(ring);
    });
  });
}
setTimeout(upgradePillarNeon, 250);

// Helper (same style you already use)
function addLight(root, type, cfg, pos) {
  const l = document.createElement("a-entity");
  const kv = Object.entries(cfg).map(([k, v]) => `${k}: ${v}`).join("; ");
  l.setAttribute("light", `type: ${type}; ${kv}`);
  l.setAttribute("position", pos);
  root.appendChild(l);
}

if (window.hudLog) hudLog("Lobby lighting boosted ✅ (wall neon + sconces + pillar bands)");
