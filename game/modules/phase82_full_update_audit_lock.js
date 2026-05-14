import * as THREE from "three";

const BUILD = "PHASE-83-DIRECT-SCENE-ROUTE-VERIFY-LOCK";
const STORE_URL = "https://svrpoker.com/site/store.html";

function canvasTexture(width, height, painter){
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  painter(ctx, width, height, c);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function textPanelTexture({title, subtitle = "", lines = [], accent = "#7dff8a", danger = false} = {}){
  return canvasTexture(1400, 820, (x, w, h)=>{
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, danger ? "#2b0610" : "#050715");
    g.addColorStop(0.58, "#090019");
    g.addColorStop(1, "#02050a");
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
    x.strokeStyle = accent;
    x.lineWidth = 12;
    x.strokeRect(26, 26, w - 52, h - 52);
    x.fillStyle = "rgba(255,255,255,.08)";
    for (let i = 0; i < 24; i++) x.fillRect(54 + i * 54, 56, 2, h - 112);
    x.textAlign = "center";
    x.fillStyle = "#ffffff";
    x.font = "900 82px system-ui, Arial";
    x.fillText(title, w / 2, 145);
    if (subtitle){
      x.fillStyle = accent;
      x.font = "800 44px system-ui, Arial";
      x.fillText(subtitle, w / 2, 214);
    }
    x.fillStyle = "#eaffff";
    x.font = "36px system-ui, Arial";
    let y = 318;
    for (const line of lines){
      x.fillText(String(line), w / 2, y);
      y += 58;
    }
  });
}

function makeGlowTexture(color = "rgba(180,140,255,"){
  return canvasTexture(128, 128, (x, w, h)=>{
    const g = x.createRadialGradient(w/2, h/2, 3, w/2, h/2, 62);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.28, `${color}.45)`);
    g.addColorStop(1, `${color}0)`);
    x.fillStyle = g;
    x.fillRect(0, 0, w, h);
  });
}

function makePlanetTexture(kind = "moon"){
  return canvasTexture(768, 768, (x, w, h)=>{
    const mars = kind === "mars";
    const g = x.createRadialGradient(w * .36, h * .30, 18, w * .5, h * .5, w * .44);
    if (mars){
      g.addColorStop(0, "#ffd2a0");
      g.addColorStop(.45, "#ff7744");
      g.addColorStop(1, "#681d12");
    } else {
      g.addColorStop(0, "#ffffff");
      g.addColorStop(.55, "#dce8ff");
      g.addColorStop(1, "#7a8aa4");
    }
    x.fillStyle = "rgba(0,0,0,0)";
    x.clearRect(0,0,w,h);
    x.fillStyle = g;
    x.beginPath();
    x.arc(w/2,h/2,w*.41,0,Math.PI*2);
    x.fill();
    if (mars){
      x.strokeStyle = "rgba(75,17,8,.34)";
      x.lineWidth = 12;
      for (let i=0;i<8;i++){
        x.beginPath();
        x.ellipse(w/2, h*.25 + i*h*.065, w*.27-i*8, 12+(i%2)*6, i*.16, 0, Math.PI*2);
        x.stroke();
      }
    } else {
      x.fillStyle = "rgba(55,70,98,.26)";
      [[.36,.38,.045],[.60,.31,.068],[.64,.62,.046],[.29,.63,.032],[.71,.49,.039],[.47,.54,.024]].forEach(([px,py,r])=>{
        x.beginPath();
        x.arc(w*px,h*py,w*r,0,Math.PI*2);
        x.fill();
      });
    }
  });
}

function addGuaranteedMoonMars(scene){
  if (scene.userData.SVR_PHASE82_MOON_MARS_LOCK) return scene.userData.SVR_PHASE82_MOON_MARS_LOCK;
  const root = new THREE.Group();
  root.name = "SVR_PHASE82_GLB_STYLE_MOON_MARS_HIGH_SKY_LOCK";
  scene.add(root);
  const glowTex = makeGlowTexture();
  function body({name, kind, pos, scale, haloScale, color, intensity}){
    const group = new THREE.Group();
    group.name = name;
    group.position.copy(pos);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: 0.72, depthWrite: false, blending: THREE.AdditiveBlending }));
    halo.scale.setScalar(haloScale);
    group.add(halo);
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(scale, 64, 32), new THREE.MeshStandardMaterial({ map: makePlanetTexture(kind), roughness: .82, metalness: 0, emissive: color, emissiveIntensity: kind === "mars" ? .16 : .10 }));
    sphere.name = `${name}_TEXTURED_SPHERE`;
    group.add(sphere);
    const light = new THREE.PointLight(color, intensity, 140, 1.8);
    group.add(light);
    root.add(group);
    return { group, sphere, halo };
  }
  const moon = body({ name:"SVR_PHASE82_TEXTURED_GLOW_MOON", kind:"moon", pos:new THREE.Vector3(-18, 24, -42), scale:2.75, haloScale:13.5, color:0xddeaff, intensity:2.8 });
  const mars = body({ name:"SVR_PHASE82_TEXTURED_GLOW_MARS", kind:"mars", pos:new THREE.Vector3(10, 22, -48), scale:1.28, haloScale:7.2, color:0xff7441, intensity:1.35 });
  const tick = (dt)=>{
    moon.sphere.rotation.y += dt * .045;
    mars.sphere.rotation.y += dt * .09;
    const t = performance.now() * .001;
    moon.halo.material.opacity = .66 + Math.sin(t * .7) * .05;
    mars.halo.material.opacity = .60 + Math.sin(t * .9) * .05;
  };
  scene.userData.SVR_PHASE82_MOON_MARS_LOCK = { root, tick, moon, mars };
  return scene.userData.SVR_PHASE82_MOON_MARS_LOCK;
}

function addStorePortalPanel(scene, sceneTargets = {}){
  if (scene.userData.SVR_PHASE82_STORE_PANEL_LOCK) return scene.userData.SVR_PHASE82_STORE_PANEL_LOCK;
  const root = new THREE.Group();
  root.name = "SVR_PHASE82_IN_GAME_STORE_WEB_PORTAL_PANEL_LOCK";
  const storeRec = sceneTargets.store || sceneTargets.storePortal || null;
  const pos = storeRec?.look ? storeRec.look.clone() : new THREE.Vector3(5.2, 1.7, -5.2);
  const target = storeRec?.pos ? storeRec.pos.clone() : new THREE.Vector3(3.9, 0, -2.9);
  root.position.copy(pos);
  root.position.y = 1.65;
  root.lookAt(target.x, 1.55, target.z);
  root.rotateY(Math.PI);

  const panelTex = textPanelTexture({
    title:"SVR STORE PORTAL",
    subtitle:"IN-GAME WEB PANEL",
    accent:"#7dff8a",
    lines:[
      "Opens: svrpoker.com/site/store.html",
      "Store room route restored",
      "Portal sits near store wall",
      "Lobby walkway stays clear"
    ]
  });
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 2.46), new THREE.MeshBasicMaterial({ map: panelTex, transparent: true, side: THREE.DoubleSide }));
  panel.position.set(0, 0, 0);
  root.add(panel);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(4.36, 2.62, .08), new THREE.MeshStandardMaterial({ color:0x081413, roughness:.36, metalness:.32, emissive:0x0c3b23, emissiveIntensity:.45 }));
  frame.position.z = -.055;
  root.add(frame);
  const pad = new THREE.Mesh(new THREE.RingGeometry(.75, .92, 80), new THREE.MeshBasicMaterial({ color:0x7dff8a, transparent:true, opacity:.72, side:THREE.DoubleSide }));
  pad.rotation.x = -Math.PI / 2;
  pad.position.set(0, -1.55, 1.35);
  root.add(pad);
  scene.add(root);
  const route = { pos: target, look: pos.clone().setY(1.75) };
  sceneTargets.store = sceneTargets.store || route;
  sceneTargets.storePortal = sceneTargets.storePortal || sceneTargets.store;
  scene.userData.SVR_PHASE82_STORE_PANEL_LOCK = { root, storeUrl: STORE_URL };
  return scene.userData.SVR_PHASE82_STORE_PANEL_LOCK;
}

function normalizeRoutes(sceneTargets = {}){
  const fallbacks = {
    lobby: "in-lobby",
    table: "in-lobby",
    seat: "in-lobby",
    reiki: "in-lobby storefront",
    reikiRoom: "./reiki.html",
    reikiPrivate: "./reiki.html",
    pga: "in-lobby storefront",
    pgaDrive: "./pga-drive.html",
    pgaDriving: "./pga-drive.html",
    drive: "./pga-drive.html",
    pgaChipPutt: "./chip-putt.html",
    chipPutt: "./chip-putt.html",
    pgaShortGame: "./chip-putt.html",
    smoker: "./smoker-lounge.html",
    smokerLounge: "./smoker-lounge.html",
    scorpion: "./scorpion.html",
    scorpionRoom: "./scorpion.html",
    store: "in-lobby store portal",
    storeScene: "./store-room.html",
    storeRoom: "./store-room.html",
    vrStore: "./store-room.html"
  };
  window.SVR_PHASE82_ROUTE_AUDIT = {
    build: BUILD,
    checkedAt: new Date().toISOString(),
    storeUrl: STORE_URL,
    routes: Object.keys(fallbacks).map(key => ({ key, target: fallbacks[key], hasSceneTarget: !!sceneTargets[key] }))
  };
  return window.SVR_PHASE82_ROUTE_AUDIT;
}

export function applyPhase82FullSceneAuditLock({ scene, sceneTargets = {}, log = console.log } = {}){
  const sky = addGuaranteedMoonMars(scene);
  const store = addStorePortalPanel(scene, sceneTargets);
  const audit = normalizeRoutes(sceneTargets);
  const prevTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt)=>{
    if (typeof prevTick === "function") prevTick(dt);
    sky.tick(dt);
  };
  window.SVR_STORE_PORTAL_URL = STORE_URL;
  window.SVR_PHASE82_SCENE_BUTTON_ROUTE_LOCK = true;
  scene.userData.SVR_BUILD = BUILD;
  log?.(`[${BUILD}] scene routes audited, moon/mars forced visible, store panel restored. Store URL: ${STORE_URL}`);
  return { build: BUILD, sky, store, audit };
}

export { BUILD as PHASE82_BUILD, STORE_URL as PHASE82_STORE_URL };
