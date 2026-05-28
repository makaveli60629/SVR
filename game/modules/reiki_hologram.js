import * as THREE from "three";

const HOLOGRAM_NAME = "REIKI_ROOM_SYMBOLS_HOLOGRAM";

function makeReikiSymbolsTexture(){
  const c = document.createElement("canvas");
  c.width = 1400;
  c.height = 800;
  const x = c.getContext("2d");
  x.clearRect(0, 0, c.width, c.height);
  x.save();
  x.globalCompositeOperation = "lighter";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowBlur = 22;
  x.shadowColor = "rgba(88,255,232,0.92)";

  x.fillStyle = "rgba(178,255,255,0.98)";
  x.font = "bold 50px system-ui, Arial";
  x.fillText("REIKI SYMBOLS: COSMIC MAP OF HEALING", c.width / 2, 58);

  const cx = c.width / 2;
  const cy = c.height / 2 + 8;
  [74, 132, 188, 248].forEach((r, idx)=>{
    x.beginPath();
    x.strokeStyle = idx % 2 ? "rgba(72,255,205,0.55)" : "rgba(130,224,255,0.55)";
    x.lineWidth = idx === 0 ? 6 : 3;
    x.arc(cx, cy, r, 0, Math.PI * 2);
    x.stroke();
  });

  const core = x.createRadialGradient(cx, cy, 18, cx, cy, 160);
  core.addColorStop(0, "rgba(137,255,209,0.82)");
  core.addColorStop(0.42, "rgba(65,220,255,0.30)");
  core.addColorStop(1, "rgba(40,120,255,0.02)");
  x.fillStyle = core;
  x.beginPath();
  x.arc(cx, cy, 150, 0, Math.PI * 2);
  x.fill();

  x.fillStyle = "rgba(240,255,248,0.98)";
  x.font = "bold 62px system-ui, Arial";
  x.fillText("DAI KO MYO", cx, cy - 20);
  x.font = "bold 26px system-ui, Arial";
  x.fillStyle = "rgba(210,255,245,0.95)";
  x.fillText("Master symbol focus", cx, cy + 64);

  const nodes = [
    { a: -Math.PI/2, r: 248, s:"CKR", t:"Cho Ku Rei" },
    { a: -0.55, r: 242, s:"SHK", t:"Sei He Ki" },
    { a: 0.36, r: 250, s:"HSZSN", t:"Hon Sha Ze Sho Nen" },
    { a: 1.38, r: 232, s:"CKR", t:"Cho Ku Rei" },
    { a: 2.55, r: 232, s:"SHK", t:"Sei He Ki" },
    { a: Math.PI, r: 252, s:"REIKI", t:"Portal Energy" }
  ];

  nodes.forEach((n)=>{
    const px = cx + Math.cos(n.a) * n.r;
    const py = cy + Math.sin(n.a) * n.r;
    x.beginPath();
    x.strokeStyle = "rgba(112,245,255,0.46)";
    x.lineWidth = 4;
    x.moveTo(cx + Math.cos(n.a) * 156, cy + Math.sin(n.a) * 156);
    x.lineTo(px, py);
    x.stroke();
    const g = x.createRadialGradient(px, py, 8, px, py, 66);
    g.addColorStop(0, "rgba(255,255,255,0.92)");
    g.addColorStop(0.36, "rgba(61,255,218,0.54)");
    g.addColorStop(1, "rgba(33,85,255,0.02)");
    x.fillStyle = g;
    x.beginPath(); x.arc(px, py, 64, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "rgba(170,255,255,0.88)";
    x.lineWidth = 4;
    x.beginPath(); x.arc(px, py, 54, 0, Math.PI * 2); x.stroke();
    x.fillStyle = "rgba(240,255,255,0.98)";
    x.font = "bold 34px system-ui, Arial";
    x.fillText(n.s, px, py - 2);
    x.font = "bold 18px system-ui, Arial";
    x.fillStyle = "rgba(210,255,245,0.95)";
    x.fillText(n.t, px, py + 78);
  });

  ["Karuna Reiki", "Zonar", "Harth", "Gnosa", "Kriya", "Shanti"].forEach((label, i)=>{
    const px = 180 + (i % 2) * 118;
    const py = 150 + i * 86;
    x.beginPath(); x.strokeStyle = "rgba(92,245,255,0.38)"; x.lineWidth = 3;
    x.moveTo(px + 50, py); x.bezierCurveTo(410, py - 25, 500, cy - 110 + i * 32, cx - 225, cy - 38 + i * 14); x.stroke();
    x.fillStyle = "rgba(50,250,218,0.20)"; x.beginPath(); x.arc(px, py, 42, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "rgba(176,255,255,0.68)"; x.beginPath(); x.arc(px, py, 36, 0, Math.PI * 2); x.stroke();
    x.fillStyle = "rgba(236,255,255,0.96)"; x.font = "bold 24px system-ui, Arial"; x.fillText("R" + (i+1), px, py);
    x.fillStyle = "rgba(210,255,245,0.94)"; x.font = "bold 16px system-ui, Arial"; x.fillText(label, px, py + 54);
  });

  ["Tibetan Symbols", "Fire Dragon", "Raku", "Sacred Geometry", "Symbol 28"].forEach((label, i)=>{
    const px = c.width - 190 - (i % 2) * 128;
    const py = 160 + i * 104;
    x.beginPath(); x.strokeStyle = "rgba(92,245,255,0.38)"; x.lineWidth = 3;
    x.moveTo(px - 50, py); x.bezierCurveTo(1000, py - 20, 960, cy - 80 + i * 25, cx + 225, cy - 18 + i * 16); x.stroke();
    x.fillStyle = "rgba(50,250,218,0.20)"; x.beginPath(); x.arc(px, py, 42, 0, Math.PI * 2); x.fill();
    x.strokeStyle = "rgba(176,255,255,0.68)"; x.beginPath(); x.arc(px, py, 36, 0, Math.PI * 2); x.stroke();
    x.fillStyle = "rgba(236,255,255,0.96)"; x.font = "bold 24px system-ui, Arial"; x.fillText("S" + (i+1), px, py);
    x.fillStyle = "rgba(210,255,245,0.94)"; x.font = "bold 16px system-ui, Arial"; x.fillText(label, px, py + 54);
  });

  x.restore();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function makeTitleTexture(){
  const c = document.createElement("canvas"); c.width = 900; c.height = 220;
  const x = c.getContext("2d");
  x.clearRect(0,0,c.width,c.height);
  x.fillStyle = "rgba(3,8,15,0.72)"; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = "rgba(132,255,236,0.92)"; x.lineWidth = 8; x.strokeRect(12,12,c.width-24,c.height-24);
  x.shadowColor = "rgba(90,255,240,0.9)"; x.shadowBlur = 24;
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = "#f7ffff"; x.font = "bold 74px system-ui, Arial"; x.fillText("REIKI ROOM", c.width/2, 88);
  x.fillStyle = "#9effee"; x.font = "bold 31px system-ui, Arial"; x.fillText("PRIVATE MEDITATION PORTAL", c.width/2, 152);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}

function createHologram(){
  const root = new THREE.Group();
  root.name = HOLOGRAM_NAME;
  root.position.set(0, 2.45, -0.24);

  const glow = new THREE.Mesh(new THREE.PlaneGeometry(3.94, 2.38), new THREE.MeshBasicMaterial({ color: 0x48ffe3, transparent: true, opacity: 0.16, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  glow.position.set(0, 0, -0.035); glow.renderOrder = 42; root.add(glow);

  const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.78, 2.10), new THREE.MeshBasicMaterial({ map: makeReikiSymbolsTexture(), transparent: true, opacity: 0.84, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  panel.renderOrder = 44; root.add(panel);

  const title = new THREE.Mesh(new THREE.PlaneGeometry(2.95, 0.72), new THREE.MeshBasicMaterial({ map: makeTitleTexture(), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  title.position.set(0, 1.38, 0.025); title.renderOrder = 45; root.add(title);

  const ring = new THREE.Mesh(new THREE.RingGeometry(1.95, 2.04, 96), new THREE.MeshBasicMaterial({ color: 0x82fff0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false }));
  ring.position.set(0, 0, 0.035); ring.renderOrder = 46; root.add(ring);

  const light = new THREE.PointLight(0x82fff0, 1.9, 5.5, 2.0);
  light.position.set(0, 0.2, 0.35);
  root.add(light);

  const baseY = root.position.y;
  root.userData.tick = (t)=>{
    root.position.y = baseY + Math.sin(t * 1.15) * 0.045;
    root.rotation.y = Math.sin(t * 0.72) * 0.035;
    panel.material.opacity = 0.76 + 0.10 * (0.5 + 0.5 * Math.sin(t * 2.0));
    glow.material.opacity = 0.10 + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.7));
    ring.rotation.z += 0.0045;
  };
  return root;
}

function installOnPortal(portal){
  if (!portal || portal.userData.reikiHologramInstalled) return;
  portal.userData.reikiHologramInstalled = true;
  const holo = createHologram();
  portal.add(holo);
  const tick = ()=>{
    if (!holo.parent) return;
    holo.userData.tick?.(performance.now() * 0.001);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function scan(root){
  if (!root?.traverse) return;
  root.traverse((obj)=>{
    if (obj?.name === "PORTAL_reikiRoom" || obj?.userData?.portalKey === "reikiRoom") installOnPortal(obj);
  });
}

const originalSceneAdd = THREE.Scene.prototype.add;
if (!THREE.Scene.prototype.__svrReikiHologramPatched){
  THREE.Scene.prototype.__svrReikiHologramPatched = true;
  THREE.Scene.prototype.add = function(...objects){
    const result = originalSceneAdd.apply(this, objects);
    objects.forEach((obj)=>scan(obj));
    scan(this);
    return result;
  };
}
