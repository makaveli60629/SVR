import * as THREE from "three";

const PANEL_W = 3.35;
const PANEL_H = 1.42;

function makeCanvasTexture({ title, subtitle, lines = [], badge = "SVR", accent = "#7ffcff", dark = "#05070d" }){
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 620;
  const ctx = canvas.getContext("2d");
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, dark);
  grad.addColorStop(1, "#13051f");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = accent;
  ctx.lineWidth = 12;
  ctx.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);
  ctx.globalAlpha = 0.22;
  for (let x = 86; x < canvas.width; x += 84){
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 58);
    ctx.lineTo(x - 42, canvas.height - 58);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255,255,255,.08)";
  ctx.beginPath();
  ctx.roundRect(74, 66, 218, 72, 28);
  ctx.fill();
  ctx.fillStyle = accent;
  ctx.font = "900 34px system-ui, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badge, 183, 102);

  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 70px system-ui, Arial";
  ctx.fillText(title, 80, 215);
  ctx.fillStyle = accent;
  ctx.font = "800 38px system-ui, Arial";
  ctx.fillText(subtitle, 82, 280);

  ctx.font = "700 31px system-ui, Arial";
  lines.slice(0, 5).forEach((line, idx)=>{
    ctx.fillStyle = idx === 0 ? "#fff7c8" : "#dcecff";
    ctx.fillText(line, 104, 355 + idx * 52);
  });

  ctx.fillStyle = "rgba(255,255,255,.70)";
  ctx.font = "700 24px system-ui, Arial";
  ctx.textAlign = "right";
  ctx.fillText("MODULAR • LOW-DRAW • APPROVAL READY", canvas.width - 82, canvas.height - 84);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 1;
  texture.generateMipmaps = true;
  return texture;
}

function addPanel(scene, { name, position, rotationY = 0, texture, accent = 0x7ffcff }){
  const group = new THREE.Group();
  group.name = name;
  group.position.copy(position);
  group.rotation.y = rotationY;

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(PANEL_W + 0.22, PANEL_H + 0.22, 0.08),
    new THREE.MeshBasicMaterial({ color: 0x05060a })
  );
  back.position.z = -0.045;
  group.add(back);

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(PANEL_W, PANEL_H),
    new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide })
  );
  panel.renderOrder = 20;
  group.add(panel);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(PANEL_W + 0.45, PANEL_H + 0.45),
    new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.08, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false })
  );
  glow.position.z = -0.015;
  group.add(glow);

  scene.add(group);
  return group;
}

function addHoloLogo(scene, { name, position, color = 0x7ffcff, label = "SVR" }){
  const group = new THREE.Group();
  group.name = name;
  group.position.copy(position);

  const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.56, blending: THREE.AdditiveBlending, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.018, 12, 96), ringMat);
  ring.rotation.x = Math.PI / 2;
  group.add(ring);

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(0.18, 24, 12),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending })
  );
  group.add(orb);

  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,512,256);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 76px system-ui, Arial";
  ctx.fillText(label, 256, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const text = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.5), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
  text.position.y = -0.56;
  group.add(text);

  scene.add(group);
  group.userData.tick = (t)=>{
    ring.rotation.z = t * 0.55;
    orb.position.y = Math.sin(t * 1.3) * 0.035;
    group.rotation.y = Math.sin(t * 0.35) * 0.12;
  };
  return group;
}

function addFloorGuide(scene){
  const group = new THREE.Group();
  group.name = "Phase167 Octagon Floor Guide";
  const radius = 7.25;
  const pts = [];
  for (let i = 0; i < 8; i++){
    const a = Math.PI / 8 + i * Math.PI / 4;
    pts.push(new THREE.Vector3(Math.cos(a) * radius, 0.026, Math.sin(a) * radius));
  }
  pts.push(pts[0].clone());
  const geom = new THREE.BufferGeometry().setFromPoints(pts);
  const line = new THREE.Line(geom, new THREE.LineBasicMaterial({ color: 0x9b7cff, transparent: true, opacity: 0.55 }));
  group.add(line);
  scene.add(group);
  return group;
}

export function installLobbyCommandCenterPhase167({ scene, log = console.log, enabled = true } = {}){
  if (!enabled || !scene) return null;
  const root = new THREE.Group();
  root.name = "PHASE167_LOBBY_COMMAND_CENTER_ADS_NOTIFICATIONS_LEADERBOARDS";
  scene.add(root);

  const radius = 6.92;
  const panels = [
    {
      key:"north", title:"TIER 1 SPONSOR", subtitle:"North pillar banner slider", badge:"AD-1", accentHex:"#7ffcff", accent:0x7ffcff,
      lines:["Premium rotating banner lane", "Sponsor packet controlled", "Enable / disable by module", "No hard-coded partner lock"],
      pos:new THREE.Vector3(0, 2.18, -radius), rot:0
    },
    {
      key:"east", title:"LEADERBOARD", subtitle:"Live ranking wall", badge:"TOP", accentHex:"#ffe28a", accent:0xffe28a,
      lines:["1. King  •  $50,000", "2. Nova Bot  •  $47,200", "3. Claudia  •  $44,900", "Weekly / weekend / monthly views"],
      pos:new THREE.Vector3(radius, 2.18, 0), rot:-Math.PI/2
    },
    {
      key:"south", title:"NOTIFICATIONS", subtitle:"Lobby event command board", badge:"NOW", accentHex:"#ff8ad8", accent:0xff8ad8,
      lines:["Freeze guard active", "Android sticks locked", "Quest locomotion protected", "Sponsor approvals modular"],
      pos:new THREE.Vector3(0, 2.18, radius), rot:Math.PI
    },
    {
      key:"west", title:"EVENTS & PRIZES", subtitle:"Schedule and promo board", badge:"WIN", accentHex:"#8dffb4", accent:0x8dffb4,
      lines:["Weekend tables", "Bi-weekly prize lane", "Daily giveaway kiosk", "Charity tracker ready"],
      pos:new THREE.Vector3(-radius, 2.18, 0), rot:Math.PI/2
    }
  ];

  panels.forEach((p)=>{
    const tex = makeCanvasTexture({ title:p.title, subtitle:p.subtitle, lines:p.lines, badge:p.badge, accent:p.accentHex });
    const panel = addPanel(root, { name:`Phase167 ${p.title}`, position:p.pos, rotationY:p.rot, texture:tex, accent:p.accent });
    panel.userData.kind = p.key;
    const logo = addHoloLogo(root, { name:`Phase167 ${p.title} Holo Logo`, position:p.pos.clone().add(new THREE.Vector3(0, 1.32, 0)), color:p.accent, label:p.badge });
    logo.rotation.y = p.rot;
  });

  const floorGuide = addFloorGuide(root);

  root.userData.tick = (t)=>{
    root.children.forEach((child)=>{
      if (child.userData?.tick) child.userData.tick(t);
    });
    floorGuide.rotation.y = Math.sin(t * 0.12) * 0.015;
  };

  scene.userData._phase167CommandCenter = root;
  window.SVR_PHASE167_COMMAND_CENTER = {
    locked:true,
    systems:["tier1Ads", "notifications", "leaderboards", "events", "hologramLogos"],
    mode:"modular-luxury-low-draw"
  };
  log("[Phase167] Command center installed: ads, notifications, leaderboards, events, holo logos.");
  return root;
}
