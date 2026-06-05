import * as THREE from "three";

const BUILD = "PHASE-121-HIGH-SLOW-MOON-MARS-LOCK";

function makePlanetTexture(kind = "moon") {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 512;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(330,170,8,520,260,620);
  if (kind === "mars") {
    g.addColorStop(0,"#ffb06a"); g.addColorStop(.38,"#b85a37"); g.addColorStop(.78,"#74301f"); g.addColorStop(1,"#351611");
  } else {
    g.addColorStop(0,"#fff9df"); g.addColorStop(.35,"#d8d1c2"); g.addColorStop(.78,"#938f88"); g.addColorStop(1,"#514f4c");
  }
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
  for (let i=0;i<(kind === "mars" ? 90 : 140);i++) {
    const px=Math.random()*c.width, py=Math.random()*c.height;
    const rw=(kind === "mars" ? 18 : 10)+Math.random()*(kind === "mars" ? 90 : 54);
    const rh=rw*(.35+Math.random()*.38);
    x.save(); x.translate(px,py); x.rotate(Math.random()*Math.PI); x.beginPath(); x.ellipse(0,0,rw,rh,0,0,Math.PI*2);
    x.fillStyle = kind === "mars" ? (Math.random()>.45 ? "rgba(70,20,10,.28)" : "rgba(255,190,110,.16)") : (Math.random()>.32 ? "rgba(50,48,45,.25)" : "rgba(255,255,230,.14)");
    x.fill(); x.restore();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function makeGlowTexture() {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const x = c.getContext("2d");
  const g = x.createRadialGradient(128,128,4,128,128,126);
  g.addColorStop(0,"rgba(255,255,255,.85)"); g.addColorStop(.35,"rgba(255,255,255,.18)"); g.addColorStop(1,"rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0,0,256,256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function applyPhase121SkyFix(scene, { log = console.log } = {}) {
  if (!scene || scene.getObjectByName("SVR_PHASE121_HIGH_SLOW_MOON_MARS_LOCK")) return null;
  scene.traverse((o) => {
    const n = String(o.name || "");
    if (/MOON|MARS|PLANET|HIGH_TEXTURED/i.test(n) && o.parent) o.parent.remove(o);
  });
  const root = new THREE.Group(); root.name = "SVR_PHASE121_HIGH_SLOW_MOON_MARS_LOCK"; scene.add(root);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(5.2,96,48), new THREE.MeshBasicMaterial({ map: makePlanetTexture("moon") }));
  moon.name = "SVR_PHASE121_TEXTURED_MOON_HIGH"; moon.position.set(-62,104,-205); root.add(moon);
  const mars = new THREE.Mesh(new THREE.SphereGeometry(3.25,72,36), new THREE.MeshBasicMaterial({ map: makePlanetTexture("mars") }));
  mars.name = "SVR_PHASE121_TEXTURED_MARS_HIGH"; mars.position.set(74,96,-220); root.add(mars);
  const glowTex = makeGlowTexture();
  const moonGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color:0xe8ddc6, transparent:true, opacity:.18, depthWrite:false, blending:THREE.AdditiveBlending }));
  moonGlow.name = "SVR_PHASE121_MOON_GLOW"; moonGlow.scale.setScalar(18); moonGlow.position.copy(moon.position); root.add(moonGlow);
  const marsGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color:0xff8758, transparent:true, opacity:.18, depthWrite:false, blending:THREE.AdditiveBlending }));
  marsGlow.name = "SVR_PHASE121_MARS_GLOW"; marsGlow.scale.setScalar(10); marsGlow.position.copy(mars.position); root.add(marsGlow);
  const light = new THREE.PointLight(0xe8ddc6,.55,260,2.2); light.position.copy(moon.position); root.add(light);
  const oldTick = scene.onBeforeRender;
  scene.onBeforeRender = function(...args) {
    oldTick?.apply(this,args);
    const dt = 1/60, t = performance.now()*0.000003;
    moon.rotation.y += dt*.006; mars.rotation.y += dt*.010;
    moon.position.x = -62 + Math.sin(t)*1.1; mars.position.x = 74 + Math.sin(t+1.2)*1.0;
    light.position.copy(moon.position); moonGlow.position.copy(moon.position); marsGlow.position.copy(mars.position);
  };
  window.SVR_PHASE121_SKY_FIX = { build: BUILD, moon: moon.position.toArray(), mars: mars.position.toArray(), speed: "very slow" };
  log?.("Phase 121 high slow Moon/Mars loaded", window.SVR_PHASE121_SKY_FIX);
  return root;
}
