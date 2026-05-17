import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { CONFIG } from "./config.js";
import { assetUrls, loadFirstTexture } from "./asset_base.js";
import { createPokerDemo } from "./poker_demo.js";
import { addPgaHub, tickPgaHub } from "./hubs/pga_hub.js";

function delay(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }
async function withTimeout(promise, ms){
  return await Promise.race([
    promise,
    (async()=>{ await delay(ms); throw new Error("timeout"); })()
  ]);
}
function boxSize(obj){
  const box = new THREE.Box3();
  const tempBox = new THREE.Box3();
  const tempPos = new THREE.Vector3();
  let foundMesh = false;
  obj.updateMatrixWorld(true);
  obj.traverse((child)=>{
    if (!child.isMesh || !child.geometry) return;
    const geom = child.geometry;
    if (!geom.boundingBox) geom.computeBoundingBox();
    if (!geom.boundingBox) return;
    tempBox.copy(geom.boundingBox).applyMatrix4(child.matrixWorld);
    if (!foundMesh){
      box.copy(tempBox);
      foundMesh = true;
    } else {
      box.union(tempBox);
    }
  });
  if (!foundMesh) box.setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  return { size, center, box };
}
function dropToGround(obj){
  const { size, center } = boxSize(obj);
  obj.position.y += (size.y * 0.5) - center.y;
}
function scaleToHeight(obj, targetH){
  const { size } = boxSize(obj);
  if (size.y > 0.0001) obj.scale.multiplyScalar(targetH / size.y);
}
function fitDiameter(obj, targetDia){
  const { size } = boxSize(obj);
  const dia = Math.max(size.x, size.z);
  if (dia > 0.0001) obj.scale.multiplyScalar(targetDia / dia);
}

function orientCharacterUpright(obj){
  const trials = [
    [0,0,0],
    [-Math.PI*0.5,0,0],
    [Math.PI*0.5,0,0],
    [0,0,Math.PI*0.5],
    [0,0,-Math.PI*0.5],
    [0,Math.PI,0],
    [-Math.PI*0.5,Math.PI,0],
    [Math.PI*0.5,Math.PI,0],
    [0,Math.PI,Math.PI*0.5],
    [0,Math.PI,-Math.PI*0.5]
  ];
  const original = obj.rotation.clone();
  let best = { score: -Infinity, rot: original.clone() };
  for (const [rx,ry,rz] of trials){
    obj.rotation.set(rx,ry,rz);
    obj.updateMatrixWorld(true);
    const { size } = boxSize(obj);
    const score = size.y - Math.max(size.x, size.z) * 0.25;
    if (Number.isFinite(score) && score > best.score){
      best = { score, rot: obj.rotation.clone() };
    }
  }
  obj.rotation.copy(best.rot);
  obj.updateMatrixWorld(true);
}
async function tryLoadGLTF(urls, log, timeoutMs = 12000){
  const loader = new GLTFLoader();
  for (const url of urls){
    try{
      const gltf = await withTimeout(loader.loadAsync(url), timeoutMs);
      log("Loaded GLTF:", url);
      return gltf.scene;
    }catch(_err){ log("GLTF miss:", url); }
  }
  return null;
}
async function tryLoadFBX(urls, log, timeoutMs = 12000){
  const loader = new FBXLoader();
  for (const url of urls){
    try{
      const fbx = await withTimeout(loader.loadAsync(url), timeoutMs);
      log("Loaded FBX:", url);
      return fbx;
    }catch(_err){ log("FBX miss:", url); }
  }
  return null;
}

async function tryLoadOBJ(urls, log, timeoutMs = 12000){
  const loader = new OBJLoader();
  for (const url of urls){
    try{
      const obj = await withTimeout(loader.loadAsync(url), timeoutMs);
      log("Loaded OBJ:", url);
      return obj;
    }catch(_err){ log("OBJ miss:", url); }
  }
  return null;
}
function canvasTexture(width, height, painter){
  const c = document.createElement("canvas");
  c.width = width; c.height = height;
  const x = c.getContext("2d");
  painter(x, width, height, c);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  return tex;
}
function roundRectPath(ctx, x, y, w, h, r){
  const rr = Math.min(r, w * 0.5, h * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
function loadUiTexture(url){
  const tex = new THREE.TextureLoader().load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

// Phase 84F boot fix: shared espresso texture for all skyline/ad helper functions.
const SVR_ESPRESSO_AD_TEXTURE_PATH = './assets/ads/espresso_with_cream/espresso_with_cream_vertical_building_ad_512x1024.png';
const espressoTex = loadUiTexture(SVR_ESPRESSO_AD_TEXTURE_PATH);

function fillWrappedText(ctx, text, x, y, maxWidth, lineHeight){
  const words = String(text || '').split(/\s+/);
  let line = '';
  let yy = y;
  for (const word of words){
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line){
      ctx.fillText(line, x, yy);
      line = word;
      yy += lineHeight;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, x, yy);
  return yy;
}
function makeSpriteTexture(){
  return canvasTexture(128, 128, (x,w,h)=>{
    const g = x.createRadialGradient(w/2,h/2,3,w/2,h/2,58);
    g.addColorStop(0,"rgba(255,255,255,1)");
    g.addColorStop(0.18,"rgba(220,230,255,0.95)");
    g.addColorStop(0.42,"rgba(180,140,255,0.26)");
    g.addColorStop(1,"rgba(180,140,255,0)");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
  });
}
function makeEarthTexture(){
  return canvasTexture(1024, 512, (x,w,h)=>{
    x.fillStyle = "#0a2c60";
    x.fillRect(0,0,w,h);
    for (let i = 0; i < 68; i++){
      x.fillStyle = `rgba(${20 + Math.random()*40|0}, ${90 + Math.random()*90|0}, ${60 + Math.random()*60|0}, ${0.55 + Math.random()*0.25})`;
      x.beginPath();
      x.ellipse(Math.random()*w, Math.random()*h, 40+Math.random()*130, 18+Math.random()*75, Math.random()*Math.PI, 0, Math.PI*2);
      x.fill();
    }
    x.fillStyle = "rgba(255,255,255,0.22)";
    for (let i = 0; i < 24; i++){
      x.beginPath();
      x.ellipse(Math.random()*w, Math.random()*h, 60+Math.random()*180, 15+Math.random()*40, Math.random()*Math.PI, 0, Math.PI*2);
      x.fill();
    }
  });
}
function makeWoodTexture(){
  return canvasTexture(1024, 256, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,0,h);
    g.addColorStop(0,"#5f381c");
    g.addColorStop(1,"#2a160d");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
    for (let i=0;i<180;i++){
      x.strokeStyle = `rgba(${120+Math.random()*80|0},${70+Math.random()*35|0},${35+Math.random()*20|0},0.22)`;
      x.beginPath();
      const yy = Math.random()*h;
      x.moveTo(0,yy);
      x.bezierCurveTo(w*0.25, yy+Math.random()*18-9, w*0.75, yy+Math.random()*18-9, w, yy+Math.random()*12-6);
      x.stroke();
    }
  });
}
function makeChairTexture(){
  return canvasTexture(512, 512, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#2c1a34");
    g.addColorStop(1,"#17111f");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
    x.strokeStyle = "rgba(255,255,255,0.08)";
    x.lineWidth = 2;
    for (let i=0;i<24;i++){
      x.beginPath();
      x.moveTo(0, i*(h/24));
      x.lineTo(w, i*(h/24));
      x.stroke();
    }
  });
}

function makePillShape(w, h, r){
  const hw = w * 0.5;
  const hh = h * 0.5;
  const cr = Math.min(r, hw * 0.98, hh * 0.98);
  const shape = new THREE.Shape();
  shape.moveTo(-hw + cr, -hh);
  shape.lineTo(hw - cr, -hh);
  shape.absarc(hw - cr, -hh + cr, cr, -Math.PI * 0.5, 0, false);
  shape.lineTo(hw, hh - cr);
  shape.absarc(hw - cr, hh - cr, cr, 0, Math.PI * 0.5, false);
  shape.lineTo(-hw + cr, hh);
  shape.absarc(-hw + cr, hh - cr, cr, Math.PI * 0.5, Math.PI, false);
  shape.lineTo(-hw, -hh + cr);
  shape.absarc(-hw + cr, -hh + cr, cr, Math.PI, Math.PI * 1.5, false);
  return shape;
}

function createStablePokerTable(scene, tableTopY = 0.90, feltTex = null){
  const group = new THREE.Group();
  const topShape = makePillShape(4.18, 2.72, 0.92);
  const railShape = makePillShape(4.62, 3.10, 1.02);
  const hole = makePillShape(4.02, 2.56, 0.86);
  railShape.holes.push(hole);

  const railGeo = new THREE.ExtrudeGeometry(railShape, { depth: 0.18, bevelEnabled: false, curveSegments: 32 });
  railGeo.rotateX(-Math.PI * 0.5);
  railGeo.translate(0, tableTopY - 0.09, 0);
  const railMat = new THREE.MeshStandardMaterial({ color: 0x3a2518, roughness: 0.78, metalness: 0.06, emissive: 0x090607, emissiveIntensity: 0.06 });
  const rail = new THREE.Mesh(railGeo, railMat);
  group.add(rail);

  const feltGeo = new THREE.ShapeGeometry(topShape, 48);
  feltGeo.rotateX(-Math.PI * 0.5);
  feltGeo.translate(0, tableTopY, 0);
  const feltMat = new THREE.MeshStandardMaterial({
    map: feltTex || null,
    color: feltTex ? 0xffffff : 0x6a1d86,
    roughness: 0.92,
    metalness: 0.0,
    emissive: 0x16061c,
    emissiveIntensity: 0.04,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1
  });
  const felt = new THREE.Mesh(feltGeo, feltMat);
  felt.renderOrder = 6;
  group.add(felt);

  const lip = new THREE.Mesh(
    new THREE.TorusGeometry(1.95, 0.055, 14, 80),
    new THREE.MeshStandardMaterial({ color: 0x3a2518, roughness: 0.56, metalness: 0.08, emissive: 0x0c0810, emissiveIntensity: 0.02 })
  );
  lip.rotation.x = Math.PI * 0.5;
  lip.scale.set(1.0, 1.0, 0.70);
  lip.position.y = tableTopY + 0.005;
  group.add(lip);

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.58, 0.76, tableTopY - 0.11, 28),
    new THREE.MeshStandardMaterial({ color: 0x1d1823, roughness: 0.88, metalness: 0.04, emissive: 0x08070c, emissiveIntensity: 0.02 })
  );
  pedestal.position.y = (tableTopY - 0.11) * 0.5;
  group.add(pedestal);

  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.22, 1.36, 0.11, 36),
    new THREE.MeshStandardMaterial({ color: 0x18131f, roughness: 0.82, metalness: 0.06, emissive: 0x06060b, emissiveIntensity: 0.02 })
  );
  base.position.y = 0.055;
  group.add(base);


  scene.add(group);
  return { group, topY: tableTopY };
}


function findPlayableFeltMesh(table){
  let best = null;
  table.updateMatrixWorld(true);
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  table.traverse((child)=>{
    if (!child.isMesh) return;
    const name = String(child.name || '').toLowerCase();
    let priority = 0;
    if (/circle005/.test(name)) priority = 3;
    else if (/object002/.test(name)) priority = 2;
    else if (/circle02/.test(name)) priority = 1;
    if (!priority) return;
    box.setFromObject(child);
    box.getSize(size);
    const area = size.x * size.z;
    if (!best || priority > best.priority || (priority === best.priority && area > best.area)) best = { mesh: child, priority, area };
  });
  return best?.mesh || null;
}

function findPlayableFeltSurface(table){
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  let best = null;
  table.updateMatrixWorld(true);
  table.traverse((child)=>{
    if (!child.isMesh || !child.visible) return;
    const name = String(child.name || '').toLowerCase();
    if (!(/circle005|object002|circle02/.test(name))) return;
    box.setFromObject(child); box.getSize(size); box.getCenter(center);
    const score = size.x * size.z;
    if (!best || score > best.score) best = { box: box.clone(), size: size.clone(), center: center.clone(), score };
  });
  return best;
}

function findTableTopSurface(table){
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  let best = null;
  table.updateMatrixWorld(true);
  table.traverse((child)=>{
    if (!child.isMesh || !child.visible) return;
    box.setFromObject(child); box.getSize(size); box.getCenter(center);
    const area = size.x * size.z;
    if (size.y > 0.22 || area < 0.8) return;
    if (!best || center.y > best.center.y || (Math.abs(center.y - best.center.y) < 0.05 && area > best.area)) best = { box: box.clone(), size: size.clone(), center: center.clone(), area };
  });
  return best;
}

async function createPreferredTable(scene, tableTopY = 0.90, feltTex = null, log = console.log){
  const realTable = await tryLoadGLTF(assetUrls("models/table.glb"), log, 12000) || await tryLoadFBX(assetUrls("models/table.fbx"), log, 12000);
  if (!realTable) return createStablePokerTable(scene, tableTopY, feltTex);
  const hideNames = /circle007|circle008|object001/i;
  const railMat = new THREE.MeshStandardMaterial({ color: 0x211612, roughness: 0.88, metalness: 0.04, emissive: 0x090607, emissiveIntensity: 0.03, side: THREE.DoubleSide });
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2a1b14, roughness: 0.92, metalness: 0.03, emissive: 0x0a0708, emissiveIntensity: 0.03, side: THREE.DoubleSide });
  const feltMesh = findPlayableFeltMesh(realTable);
  realTable.traverse((child)=>{
    if (!child.isMesh) return;
    const name = String(child.name || "").toLowerCase();
    child.castShadow = false;
    child.receiveShadow = false;
    child.frustumCulled = false;
    if (hideNames.test(name)){
      child.visible = false;
      return;
    }
    if (child === feltMesh){
      child.visible = true;
      return;
    }
    child.material = (/circle006/.test(name) ? bodyMat : railMat).clone();
  });
  fitDiameter(realTable, 4.92);
  realTable.updateMatrixWorld(true);
  const bb = boxSize(realTable).box;
  realTable.position.set(-((bb.min.x + bb.max.x) * 0.5), tableTopY - bb.max.y, -((bb.min.z + bb.max.z) * 0.5));
  realTable.updateMatrixWorld(true);
  scene.add(realTable);
  const top = findPlayableFeltSurface(realTable) || findTableTopSurface(realTable);
  let feltY = top ? (top.box.max.y + 0.0018) : (tableTopY + 0.0018);
  let overlay = null;
  const map = feltTex ? feltTex.clone() : null;
  if (map){
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
    map.anisotropy = 8;
    map.flipY = false;
    map.needsUpdate = true;
  }
  if (feltMesh){
    feltMesh.visible = true;
    feltMesh.renderOrder = 20;
    feltMesh.material = new THREE.MeshStandardMaterial({ map: map, color: map ? 0xffffff : 0x0d0d10, roughness: 0.96, metalness: 0.0, emissive: 0x020203, emissiveIntensity: 0.02, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  } else if (top){
    const w = Math.max(1.2, top.size.x * 0.91);
    const h = Math.max(0.8, top.size.z * 0.88);
    const r = Math.min(h * 0.46, w * 0.16);
    const shape = makePillShape(w, h, r);
    const geo = new THREE.ShapeGeometry(shape, 56);
    geo.rotateX(-Math.PI * 0.5);
    geo.translate(top.center.x, feltY, top.center.z);
    const mat = new THREE.MeshStandardMaterial({ map: map, color: map ? 0xffffff : 0x0d0d10, roughness: 0.98, metalness: 0.0, emissive: 0x040405, emissiveIntensity: 0.02, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    overlay = new THREE.Mesh(geo, mat);
    overlay.renderOrder = 24;
    overlay.frustumCulled = false;
    scene.add(overlay);
  }
  return { group: realTable, topY: feltY, felt: feltMesh || overlay || null };
}
function buildStars(scene, R){
  const count = 3200;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  for (let i = 0; i < count; i++){
    const rr = R + 180 + Math.random() * 420;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.58 + 0.02;
    pos[i*3+0] = Math.cos(theta) * Math.sin(phi) * rr;
    pos[i*3+1] = Math.cos(phi) * rr * 0.95 + 90;
    pos[i*3+2] = Math.sin(theta) * Math.sin(phi) * rr;
    const tint = 0.88 + Math.random() * 0.12;
    col[i*3+0] = tint;
    col[i*3+1] = 0.92 + Math.random() * 0.08;
    col[i*3+2] = 0.98 + Math.random() * 0.02;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({
    size: 0.14,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.98,
    map: makeSpriteTexture(),
    vertexColors: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    depthTest: true
  }));
  scene.add(pts);

  const spriteGroup = new THREE.Group();
  for (let i = 0; i < 48; i++){
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeSpriteTexture(),
      color: new THREE.Color(i % 9 === 0 ? 0xb48cff : (i % 5 === 0 ? 0x9fe4ff : 0xffffff)),
      transparent: true,
      opacity: 0.34 + Math.random() * 0.20,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      depthTest: true
    }));
    spr.scale.setScalar(0.038 + Math.random() * 0.12);
    const rr = R + 220 + Math.random() * 360;
    const theta = Math.random() * Math.PI * 2;
    const y = 120 + Math.random() * 180;
    spr.position.set(Math.cos(theta) * rr, y, Math.sin(theta) * rr);
    spriteGroup.add(spr);
  }
  scene.add(spriteGroup);
  return { pts, spriteGroup };
}

function buildLobbySprites(scene, R, wallHeight){
  const group = new THREE.Group();
  const colors = [0xe67cff, 0xff77d7, 0x86e3ff, 0xc08dff, 0xf6fbff, 0xbfe8ff];
  for (let i = 0; i < 18; i++){
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeSpriteTexture(),
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.30 + Math.random() * 0.14,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    const ang = (i / 36) * Math.PI * 2;
    const rad = R * (0.28 + Math.random() * 0.14);
    const sz = 0.36 + Math.random() * 0.88;
    spr.scale.set(sz, sz, 1);
    spr.position.set(Math.cos(ang) * rad, wallHeight * 0.18 + Math.random() * 2.1, Math.sin(ang) * rad);
    spr.userData.baseY = spr.position.y;
    spr.userData.phase = Math.random() * Math.PI * 2;
    group.add(spr);
  }

  const tiny = new THREE.Group();
  for (let i = 0; i < 60; i++){
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeSpriteTexture(),
      color: colors[i % colors.length],
      transparent: true,
      opacity: 0.10 + Math.random() * 0.08,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    const ang = Math.random() * Math.PI * 2;
    const rad = R * (0.16 + Math.random() * 0.46);
    spr.scale.setScalar(0.03 + Math.random() * 0.08);
    spr.position.set(Math.cos(ang) * rad, 0.26 + Math.random() * 2.3, Math.sin(ang) * rad);
    spr.userData.baseY = spr.position.y;
    spr.userData.phase = Math.random() * Math.PI * 2;
    spr.userData.rise = 0.10 + Math.random() * 0.14;
    spr.userData.radius = rad;
    spr.userData.angle = ang;
    tiny.add(spr);
  }

  const snow = new THREE.Group();
  for (let i = 0; i < 80; i++){
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({
      map: makeSpriteTexture(),
      color: new THREE.Color(i % 4 === 0 ? 0xf6fbff : (i % 3 === 0 ? 0xdff4ff : 0xfaf8ff)),
      transparent: true,
      opacity: 0.12 + Math.random() * 0.10,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    const ang = Math.random() * Math.PI * 2;
    const rad = R * (0.08 + Math.random() * 0.52);
    spr.scale.setScalar(0.04 + Math.random() * 0.09);
    spr.position.set(Math.cos(ang) * rad, 0.18 + Math.random() * 1.5, Math.sin(ang) * rad);
    spr.userData.baseY = spr.position.y;
    spr.userData.phase = Math.random() * Math.PI * 2;
    spr.userData.rise = 0.16 + Math.random() * 0.16;
    spr.userData.radius = rad;
    spr.userData.angle = ang;
    spr.userData.wobble = 0.05 + Math.random() * 0.08;
    snow.add(spr);
  }

  group.userData.tiny = tiny;
  group.userData.snow = snow;
  group.add(tiny);
  group.add(snow);

  scene.add(group);
  return group;
}


async function addRikiArea(scene, R, wallHeight, spawnLogoTex, log = console.log){
  const angle = 0;
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const right = new THREE.Vector3(Math.sin(angle), 0, -Math.cos(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.05), 0.01, Math.sin(angle) * (R - 4.05));
  const safeLogoTex = spawnLogoTex || loadUiTexture('./assets/ui/logo.png');

  const floorPad = new THREE.Mesh(
    new THREE.PlaneGeometry(14.2, 7.0),
    new THREE.MeshStandardMaterial({ color: 0x0a0f12, roughness: 0.95, metalness: 0.04, emissive: 0x221018, emissiveIntensity: 0.12, side: THREE.DoubleSide })
  );
  floorPad.rotation.x = -Math.PI * 0.5;
  floorPad.position.copy(center).add(new THREE.Vector3(0, 0.002, 0));
  scene.add(floorPad);

  const carpet = new THREE.Mesh(
    new THREE.PlaneGeometry(7.2, 5.4),
    new THREE.MeshStandardMaterial({ color: 0x8d1024, roughness: 0.96, metalness: 0.02, emissive: 0x35050d, emissiveIntensity: 0.24, side: THREE.DoubleSide })
  );
  carpet.rotation.x = -Math.PI * 0.5;
  carpet.position.copy(center).addScaledVector(inward, -0.22).add(new THREE.Vector3(0, 0.004, 0));
  scene.add(carpet);

  const root = new THREE.Group();
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x11161a, roughness: 0.28, metalness: 0.30, emissive: 0x2f1116, emissiveIntensity: 0.20 });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xff5a66, roughness: 0.18, metalness: 0.56, emissive: 0x9b1420, emissiveIntensity: 0.72 });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0xffb5bd, transparent: true, opacity: 0.10, roughness: 0.04, metalness: 0.22, emissive: 0x64131a, emissiveIntensity: 0.24, side: THREE.DoubleSide });

  const rearWall = new THREE.Mesh(
    new THREE.BoxGeometry(13.2, 6.05, 0.18),
    new THREE.MeshStandardMaterial({ color: 0x090f12, roughness: 0.72, metalness: 0.16, emissive: 0x17070b, emissiveIntensity: 0.18 })
  );
  rearWall.position.set(0, 2.98, -2.24);
  root.add(rearWall);

  const leftColumn = new THREE.Mesh(new THREE.BoxGeometry(0.16, 5.8, 0.22), trimMat);
  leftColumn.position.set(-6.52, 2.9, 0.74);
  root.add(leftColumn);
  const rightColumn = leftColumn.clone();
  rightColumn.position.x = 6.52;
  root.add(rightColumn);
  const frontHeader = new THREE.Mesh(new THREE.BoxGeometry(13.2, 0.16, 0.22), trimMat);
  frontHeader.position.set(0, 5.76, 0.74);
  root.add(frontHeader);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(13.0, 0.12, 4.8), frameMat);
  roof.position.set(0, 5.92, -0.42);
  root.add(roof);

  const sideFrameL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 4.9, 4.5), frameMat);
  sideFrameL.position.set(-6.48, 2.38, -0.48);
  root.add(sideFrameL);
  const sideFrameR = sideFrameL.clone();
  sideFrameR.position.x = 6.48;
  root.add(sideFrameR);

  const frontGlassL = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.95), glassMat);
  frontGlassL.position.set(-4.82, 2.26, 0.66);
  root.add(frontGlassL);
  const frontGlassR = frontGlassL.clone();
  frontGlassR.position.x = 4.82;
  root.add(frontGlassR);
  const sideGlassL = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 4.05), glassMat);
  sideGlassL.position.set(-6.40, 2.25, -0.48);
  sideGlassL.rotation.y = Math.PI * 0.5;
  root.add(sideGlassL);
  const sideGlassR = sideGlassL.clone();
  sideGlassR.position.x = 6.40;
  sideGlassR.rotation.y = -Math.PI * 0.5;
  root.add(sideGlassR);

  const signBackA = new THREE.Mesh(new THREE.PlaneGeometry(7.8, 0.96), new THREE.MeshBasicMaterial({ color: 0x05090c, side: THREE.DoubleSide }));
  signBackA.position.set(0, 5.12, 0.68);
  root.add(signBackA);
  const signTexA = canvasTexture(1400, 220, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h); g.addColorStop(0, '#1c0709'); g.addColorStop(1, '#07090c');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,82,95,0.95)'; x.lineWidth = 10; x.strokeRect(12,12,w-24,h-24);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#fff6f6'; x.font = 'bold 90px system-ui, Arial'; x.fillText('REIKI HUB', w/2, 88);
    x.fillStyle = '#ffb6bd'; x.font = 'bold 34px system-ui, Arial'; x.fillText('SVR WELLNESS PLACEHOLDER', w/2, 152);
  });
  const signA = new THREE.Mesh(new THREE.PlaneGeometry(7.62, 0.88), new THREE.MeshBasicMaterial({ map: signTexA, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  signA.position.copy(signBackA.position).add(new THREE.Vector3(0,0,0.02));
  root.add(signA);

  const signBackB = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 0.76), new THREE.MeshBasicMaterial({ color: 0x05090c, side: THREE.DoubleSide }));
  signBackB.position.set(0, 4.28, 0.69);
  root.add(signBackB);
  const signTexB = canvasTexture(1200, 200, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h); g.addColorStop(0, '#160507'); g.addColorStop(1, '#0b0d10');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,85,98,0.88)'; x.lineWidth = 8; x.strokeRect(12,12,w-24,h-24);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#fff2f2'; x.font = 'bold 78px system-ui, Arial'; x.fillText('AWAITING APPROVAL', w/2, 98);
  });
  const signB = new THREE.Mesh(new THREE.PlaneGeometry(6.44, 0.70), new THREE.MeshBasicMaterial({ map: signTexB, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  signB.position.copy(signBackB.position).add(new THREE.Vector3(0,0,0.02));
  root.add(signB);

  const logoPlate = new THREE.Mesh(new THREE.PlaneGeometry(1.10, 0.72), new THREE.MeshBasicMaterial({ map: safeLogoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  logoPlate.position.set(-4.95, 4.68, 0.73);
  root.add(logoPlate);

  const zenDenTex = canvasTexture(900, 180, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h); g.addColorStop(0, '#17060a'); g.addColorStop(1, '#101010');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,85,98,0.82)'; x.lineWidth = 8; x.strokeRect(12,12,w-24,h-24);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#fff5f5'; x.font = 'bold 58px system-ui, Arial'; x.fillText('PRIVATE REIKI ROOM', w/2, 76);
    x.fillStyle = '#ffb6bd'; x.font = 'bold 24px system-ui, Arial'; x.fillText('meditate • restore • breathe', w/2, 132);
  });
  const zenDenPlate = new THREE.Mesh(new THREE.PlaneGeometry(2.84, 0.52), new THREE.MeshBasicMaterial({ map: zenDenTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  zenDenPlate.position.set(4.95, 4.68, 0.73);
  root.add(zenDenPlate);

  const leftInfoTex = canvasTexture(900, 1200, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h); g.addColorStop(0, '#12070b'); g.addColorStop(1, '#090c12');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,85,98,0.90)'; x.lineWidth = 10; x.strokeRect(18,18,w-36,h-36);
    x.textAlign = 'left';
    x.fillStyle = '#fff7f7'; x.font = 'bold 58px system-ui, Arial'; x.fillText('Partner Slot', 60, 110);
    x.fillStyle = '#ffb6bd'; x.font = 'bold 48px system-ui, Arial'; x.fillText('AWAITING APPROVAL', 60, 182);
    x.fillStyle = '#f5eeee'; x.font = '34px system-ui, Arial';
    let y = 268;
    y = fillWrappedText(x, 'This Reiki / wellness hub is held as an SVR placeholder until a future partner is approved in writing.', 60, y, w - 120, 46);
    y += 84;
    x.fillStyle = '#ffb6bd'; x.font = 'bold 40px system-ui, Arial'; x.fillText('Live Policy', 60, y);
    y += 62;
    x.fillStyle = '#fff8f8'; x.font = '34px system-ui, Arial';
    ['No unapproved branding', 'No founder photos', 'No outside websites', 'SVR placeholder only'].forEach((line)=>{ x.fillText('• ' + line, 72, y); y += 58; });
  });
  const leftInfo = new THREE.Mesh(new THREE.PlaneGeometry(3.28, 4.02), new THREE.MeshBasicMaterial({ map: leftInfoTex, side: THREE.DoubleSide, transparent: true }));
  leftInfo.position.set(-4.10, 2.18, -2.10);
  root.add(leftInfo);

  const centerInfoTex = canvasTexture(900, 1200, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h); g.addColorStop(0, '#150608'); g.addColorStop(1, '#111118');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,85,98,0.88)'; x.lineWidth = 10; x.strokeRect(18,18,w-36,h-36);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#fff7f7'; x.font = 'bold 70px system-ui, Arial'; x.fillText('SVR REIKI HUB', w/2, 104);
    x.fillStyle = '#ffb6bd'; x.font = 'bold 42px system-ui, Arial'; x.fillText('AWAITING APPROVAL', w/2, 172);
    x.fillStyle = '#fff5f5'; x.font = 'bold 46px system-ui, Arial'; x.fillText('Private Meditation Route', w/2, 306);
    x.fillStyle = '#ffd6da'; x.font = '31px system-ui, Arial'; x.fillText('Relaxation • wellness placeholder • future partner module', w/2, 372);
    x.fillStyle = 'rgba(255,82,95,0.16)'; roundRectPath(x, 90, 430, w-180, 138, 28); x.fill();
    x.strokeStyle = 'rgba(255,85,98,0.65)'; x.lineWidth = 6; roundRectPath(x, 90, 430, w-180, 138, 28); x.stroke();
    x.fillStyle = '#ffebee'; x.font = 'bold 42px system-ui, Arial'; x.fillText('ENTER PRIVATE REIKI', w/2, 510);
    x.fillStyle = '#ffb6bd'; x.font = '31px system-ui, Arial'; x.fillText('Use the portal after written partner approval', w/2, 564);
    x.fillStyle = '#fff7f7'; x.font = 'bold 38px system-ui, Arial'; x.fillText('Approval Lock Active', w/2, 716);
    x.fillStyle = '#ffb6bd'; x.font = '34px system-ui, Arial'; x.fillText('All external branding is disabled', w/2, 790);
  });
  const centerInfo = new THREE.Mesh(new THREE.PlaneGeometry(2.70, 4.02), new THREE.MeshBasicMaterial({ map: centerInfoTex, side: THREE.DoubleSide, transparent: true }));
  centerInfo.position.set(0, 2.18, -2.10);
  root.add(centerInfo);

  const rightInfoTex = canvasTexture(900, 1200, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h); g.addColorStop(0, '#10060a'); g.addColorStop(1, '#141016');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,85,98,0.88)'; x.lineWidth = 10; x.strokeRect(18,18,w-36,h-36);
    x.textAlign = 'center';
    x.fillStyle = '#fff6f6'; x.font = 'bold 62px system-ui, Arial'; x.fillText('SAFE PLACEHOLDER', w/2, 120);
    x.fillStyle = '#ffb6bd'; x.font = 'bold 42px system-ui, Arial'; x.fillText('NO SPONSOR ACTIVE', w/2, 190);
    x.fillStyle = '#f6eeee'; x.font = '34px system-ui, Arial';
    let y = 310;
    ['Sponsor name: disabled', 'Founder image: disabled', 'Website links: disabled', 'Approval required'].forEach((line)=>{ x.fillText(line, w/2, y); y += 104; });
  });
  const rightInfo = new THREE.Mesh(new THREE.PlaneGeometry(2.94, 4.02), new THREE.MeshBasicMaterial({ map: rightInfoTex, side: THREE.DoubleSide, transparent: true }));
  rightInfo.position.set(4.05, 2.18, -2.10);
  root.add(rightInfo);

  const reserveTex = canvasTexture(960, 220, (x,w,h)=>{
    x.fillStyle = '#240507'; roundRectPath(x, 0, 0, w, h, 28); x.fill();
    x.strokeStyle = 'rgba(255,85,98,0.92)'; x.lineWidth = 8; roundRectPath(x, 10, 10, w-20, h-20, 24); x.stroke();
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#fff2f2'; x.font = 'bold 48px system-ui, Arial'; x.fillText('AWAITING APPROVAL', w/2, 82);
    x.fillStyle = '#ffb6bd'; x.font = 'bold 34px system-ui, Arial'; x.fillText('SVR PLACEHOLDER ONLY', w/2, 152);
  });
  const reservePlaque = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 0.70), new THREE.MeshBasicMaterial({ map: reserveTex, transparent: true, side: THREE.DoubleSide }));
  reservePlaque.position.set(4.05, -1.22, -2.06);
  root.add(reservePlaque);

  const portalTex = canvasTexture(1024, 1024, (x,w,h)=>{
    x.clearRect(0,0,w,h);
    const grad = x.createRadialGradient(w/2, h/2, 80, w/2, h/2, 400);
    grad.addColorStop(0, 'rgba(255,85,98,0.86)');
    grad.addColorStop(0.55, 'rgba(195,58,76,0.34)');
    grad.addColorStop(1, 'rgba(30,10,12,0.0)');
    x.fillStyle = grad; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,85,98,0.96)'; x.lineWidth = 18; x.beginPath(); x.arc(w/2, h/2, 250, 0, Math.PI*2); x.stroke();
    x.fillStyle = '#fff2f2'; x.textAlign = 'center'; x.font = 'bold 72px system-ui, Arial'; x.fillText('REIKI ROOM', w/2, h/2 + 166);
  });
  const portal = new THREE.Mesh(new THREE.CircleGeometry(1.18, 64), new THREE.MeshBasicMaterial({ map: portalTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  portal.rotation.x = -Math.PI * 0.5;
  portal.position.set(0, 0.03, 0.98);
  root.add(portal);
  const portalLogo = new THREE.Mesh(new THREE.PlaneGeometry(1.18, 0.54), new THREE.MeshBasicMaterial({ map: safeLogoTex, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  portalLogo.rotation.x = -Math.PI * 0.5;
  portalLogo.position.set(0, 0.035, 0.98);
  root.add(portalLogo);

  const postMat = new THREE.MeshStandardMaterial({ color: 0xd9d1dc, roughness: 0.26, metalness: 0.76, emissive: 0x28333a, emissiveIntensity: 0.12 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0xbf0c28, roughness: 0.78, metalness: 0.08, emissive: 0x520b16, emissiveIntensity: 0.22 });
  const rails = [
    { x: -2.84, zA: 1.58, zB: -1.26 },
    { x:  2.84, zA: 1.58, zB: -1.26 }
  ];
  rails.forEach(({x, zA, zB})=>{
    [zA, zB].forEach((z)=>{
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.05,0.95,14), postMat);
      post.position.set(x, 0.48, z);
      root.add(post);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), postMat);
      head.position.copy(post.position).add(new THREE.Vector3(0,0.49,0));
      root.add(head);
    });
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.024,0.024,Math.abs(zA-zB),12), ropeMat);
    rope.rotation.x = Math.PI * 0.5;
    rope.position.set(x, 0.86, (zA+zB)*0.5);
    root.add(rope);
  });

  const plantRoot = await tryLoadOBJ(assetUrls('models/riki/plant/indoor_plant.obj'), log, 12000);
  const plantCol = await loadFirstTexture(assetUrls('models/riki/plant/plant_col.jpg'), { colorSpace: THREE.SRGBColorSpace });
  if (plantRoot){
    plantRoot.traverse((child)=>{
      if (!child.isMesh) return;
      child.castShadow = false;
      child.receiveShadow = false;
      child.frustumCulled = false;
      const nm = String(child.material?.name || child.name || '').toLowerCase();
      if (nm.includes('pot')) child.material = new THREE.MeshStandardMaterial({ color: 0x25393b, roughness: 0.88, metalness: 0.10, emissive: 0x0d1618, emissiveIntensity: 0.08 });
      else child.material = new THREE.MeshStandardMaterial({ map: plantCol || null, color: 0xffffff, roughness: 0.96, metalness: 0.0, side: THREE.DoubleSide });
    });
    const placements = [[-5.0,1.8],[-5.0,0.1],[-4.2,-1.45],[-3.2,-2.05],[-2.0,1.55],[2.0,1.55],[3.2,-2.05],[4.2,-1.45],[5.0,0.1],[5.0,1.8]];
    placements.forEach(([ox,oz], idx)=>{
      const plant = plantRoot.clone(true);
      scaleToHeight(plant, 1.20 + (idx % 3) * 0.14);
      dropToGround(plant);
      plant.position.copy(center).addScaledVector(right, ox).addScaledVector(inward, oz);
      plant.rotation.y = angle + Math.PI + (idx % 2 ? 0.14 : -0.10);
      scene.add(plant);
    });
  }

  const reikiFillA = new THREE.PointLight(0xff5a66, 2.4, 18, 2.0);
  reikiFillA.position.copy(center).add(new THREE.Vector3(-2.6, 2.8, 0.8));
  scene.add(reikiFillA);
  const reikiFillB = new THREE.PointLight(0xff98a2, 1.9, 18, 2.0);
  reikiFillB.position.copy(center).add(new THREE.Vector3(2.6, 2.8, 0.8));
  scene.add(reikiFillB);

  const hubTarget = center.clone().addScaledVector(inward, 3.2);
  const roomTarget = center.clone().addScaledVector(inward, 1.3).addScaledVector(right, 0.0);
  return {
    center: center.clone(),
    target: hubTarget,
    roomTarget,
    look: center.clone().addScaledVector(inward, -2.0)
  };
}

function createOrbHaloSprite(color = 0xffffff, opacity = 0.5){
  return new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeSpriteTexture(),
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  }));
}
function createMatrixBillboardTexture(variant = "main"){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 1536;
  const ctx = canvas.getContext("2d");
  const glyphs = "0101SVRPOKERALLIN0101011010010110";
  const phrases = variant === "main"
    ? ["SCARLETT VR POKER", "ALL IN", "SPONSOR READY", "DONOR NATION", "WIN MONEY"]
    : ["JOIN THE LEAGUE", "RESERVED FOR S.R.", "SCARLETT VR POKER"];
  const cols = Array.from({ length: 60 }, (_, i)=>({ x: 12 + i * 17, y: Math.random() * canvas.height, speed: 9 + (i % 7) }));
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  let lastT = -999;
  function redraw(t = 0){
    if (t - lastT < 0.08) return;
    lastT = t;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const bg = ctx.createLinearGradient(0,0,0,canvas.height);
    bg.addColorStop(0, "rgba(5,0,12,0.98)");
    bg.addColorStop(1, "rgba(1,2,8,1.0)");
    ctx.fillStyle = bg;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    ctx.font = "bold 22px monospace";
    cols.forEach((c, i)=>{
      const phase = Math.floor(t * 22 + i * 5);
      for (let j = 0; j < 96; j++){
        const yy = (c.y + j * 18) % (canvas.height + 160) - 80;
        const char = glyphs[(phase + j + i * 3) % glyphs.length];
        const hot = j < 4;
        ctx.fillStyle = hot ? "rgba(255,245,255,0.98)" : (i % 2 ? "rgba(238,114,255,0.80)" : "rgba(118,204,255,0.82)");
        ctx.fillText(char, c.x, yy);
      }
      c.y += c.speed;
      if (c.y > canvas.height + 40) c.y = -Math.random() * 180;
    });

    const panelTop = variant === "main" ? 200 : 320;
    const panelH = variant === "main" ? 1080 : 860;
    ctx.fillStyle = variant === "main" ? "rgba(7,10,18,0.40)" : "rgba(0,0,0,0.92)";
    ctx.fillRect(70, panelTop, canvas.width - 140, panelH);
    ctx.strokeStyle = "rgba(148,226,255,0.40)";
    ctx.lineWidth = 4;
    ctx.strokeRect(70, panelTop, canvas.width - 140, panelH);

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    phrases.forEach((line, idx)=>{
      ctx.fillStyle = idx % 2 ? "rgba(202,144,255,0.98)" : "rgba(230,245,255,0.98)";
      ctx.font = idx === 0 ? "bold 62px system-ui, Arial" : "bold 42px system-ui, Arial";
      ctx.fillText(line, canvas.width / 2, panelTop + 130 + idx * 96);
    });
    tex.needsUpdate = true;
  }
  redraw(0);
  return { texture: tex, update: redraw };
}

function createSponsorPlateTexture(title = "MAIN SPONSOR SCREEN", subtitle = "SCARLETT VR POKER"){
  return canvasTexture(1024, 256, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "rgba(5,16,30,0.94)");
    g.addColorStop(1, "rgba(25,4,34,0.94)");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
    x.strokeStyle = "rgba(130,210,255,0.95)";
    x.lineWidth = 8;
    x.strokeRect(10,10,w-20,h-20);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#f2f7ff";
    x.font = "bold 56px system-ui, Arial";
    x.fillText(title, w/2, 92);
    x.fillStyle = "rgba(198,136,255,0.96)";
    x.font = "bold 34px system-ui, Arial";
    x.fillText(subtitle, w/2, 172);
  });
}
function createAdBillboardTexture(lines = ["SVRPOKER.COM", "ALL IN"]){
  return canvasTexture(512, 512, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#04122c");
    g.addColorStop(1,"#25092a");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
    x.strokeStyle = "rgba(127,212,255,0.92)";
    x.lineWidth = 8;
    x.strokeRect(18,18,w-36,h-36);
    x.fillStyle = "#f6fbff";
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.font = "bold 52px system-ui, Arial";
    x.fillText(lines[0], w/2, h/2 - 40);
    x.font = "bold 64px system-ui, Arial";
    x.fillText(lines[1], w/2, h/2 + 38);
  });
}

function createStoreDisplayTexture(){
  return canvasTexture(1024, 1024, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "#081221");
    g.addColorStop(1, "#18081e");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
    x.strokeStyle = "rgba(140,220,255,0.88)";
    x.lineWidth = 10;
    x.strokeRect(18,18,w-36,h-36);
    x.fillStyle = "rgba(20,28,40,0.72)";
    x.fillRect(74,94,w-148,h-188);
    x.strokeStyle = "rgba(190,120,255,0.72)";
    x.lineWidth = 5;
    x.strokeRect(74,94,w-148,h-188);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#f3f8ff";
    x.font = "bold 78px system-ui, Arial";
    x.fillText("SVR STORE", w/2, 170);
    x.fillStyle = "rgba(188,214,255,0.98)";
    x.font = "bold 42px system-ui, Arial";
    x.fillText("north east wall", w/2, 236);
    const items = ["chips", "cards", "sponsor merch", "hall of fame soon"];
    items.forEach((item, i)=>{
      const yy = 420 + i*110;
      x.fillStyle = i % 2 ? "rgba(194,145,255,0.95)" : "rgba(127,214,255,0.95)";
      x.fillRect(190, yy-34, w-380, 68);
      x.fillStyle = "#08101a";
      x.font = "bold 34px system-ui, Arial";
      x.fillText(item.toUpperCase(), w/2, yy);
    });
  });
}

function createPlaqueTexture(title = "legend", subtitle = "hall of fame"){
  return canvasTexture(512, 256, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "rgba(8,14,24,0.98)");
    g.addColorStop(1, "rgba(34,10,44,0.98)");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
    x.strokeStyle = "rgba(136,220,255,0.85)";
    x.lineWidth = 6;
    x.strokeRect(12,12,w-24,h-24);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#f6fbff";
    x.font = "bold 40px system-ui, Arial";
    x.fillText(String(title || "").toUpperCase(), w/2, 92);
    x.fillStyle = "rgba(198,136,255,0.96)";
    x.font = "bold 26px system-ui, Arial";
    x.fillText(String(subtitle || "").toUpperCase(), w/2, 170);
  });
}

function createInfoBoardTexture(title = "leaderboard", lines = []){
  return canvasTexture(1024, 1024, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0, "#07111d");
    g.addColorStop(1, "#240d29");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
    x.strokeStyle = "rgba(143,224,255,0.92)";
    x.lineWidth = 10;
    x.strokeRect(22,22,w-44,h-44);
    x.fillStyle = "rgba(255,255,255,0.06)";
    x.fillRect(64,96,w-128,120);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#f6fbff";
    x.font = "bold 72px system-ui, Arial";
    x.fillText(String(title || "").toUpperCase(), w/2, 156);
    x.strokeStyle = "rgba(194,145,255,0.56)";
    x.lineWidth = 4;
    x.beginPath();
    x.moveTo(84, 246);
    x.lineTo(w - 84, 246);
    x.stroke();
    const visibleLines = lines.slice(0,7);
    const rowH = visibleLines.length > 6 ? 86 : (visibleLines.length > 5 ? 98 : 118);
    visibleLines.forEach((line, idx)=>{
      const yy = 330 + idx * rowH;
      x.fillStyle = idx % 2 ? "rgba(194,145,255,0.95)" : "rgba(127,214,255,0.95)";
      x.fillRect(96, yy - 36, w - 192, 72);
      x.fillStyle = "#08101a";
      x.font = `bold ${visibleLines.length > 6 ? 22 : (visibleLines.length > 5 ? 25 : 31)}px system-ui, Arial`;
      x.fillText(String(line || "").toUpperCase(), w/2, yy);
    });
  });
}

function addLobbyInfoBoards(scene, R, wallHeight){
  const baseAngle = Math.PI * 0.5;
  const inward = new THREE.Vector3(-Math.cos(baseAngle), 0, -Math.sin(baseAngle));
  const tangent = new THREE.Vector3(-inward.z, 0, inward.x);
  const baseCenter = new THREE.Vector3(Math.cos(baseAngle) * (R - 2.3), 1.72, Math.sin(baseAngle) * (R - 2.3));
  const defs = [
    { title: "leaderboard", lines: ["top cash tables", "player stacks and stats", "sponsor bonus wins", "community giveback", "animal shelter aid", "feedback and rankings"], offset: -2.65 },
    { title: "tourney", lines: ["daily sit n go", "weekend finals", "sponsor hosted events", "WIN CASH MONEY", "league points and prizes", "PGA hub coming soon"], offset: 0.0 },
    { title: "about", lines: ["poker that gives back", "homeless outreach", "animal shelters", "wellness and reiki hub", "sponsors raise funds", "ads support the mission"], offset: 2.65 }
  ];
  const boards = [];
  defs.forEach((def, idx)=>{
    const board = new THREE.Mesh(
      new THREE.PlaneGeometry(1.92, 1.92),
      new THREE.MeshBasicMaterial({ map: createInfoBoardTexture(def.title, def.lines), side: THREE.DoubleSide })
    );
    board.position.copy(baseCenter).addScaledVector(tangent, def.offset).addScaledVector(inward, 0.08).add(new THREE.Vector3(0, Math.sin(idx) * 0.03, 0));
    board.lookAt(0, board.position.y, 0);
    board.renderOrder = 32;
    scene.add(board);
    const glow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.18, 2.18),
      new THREE.MeshBasicMaterial({ color: idx % 2 ? 0xc18dff : 0x8fdfff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
    );
    glow.position.copy(board.position).addScaledVector(inward, 0.02);
    glow.lookAt(0, glow.position.y, 0);
    glow.renderOrder = 31;
    scene.add(glow);
    boards.push({ board, glow, phase: idx * 0.8 });
  });
  return boards;
}
function createHologramSilhouette(kind = "legend"){
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x9fe1ff, transparent: true, opacity: 0.24, wireframe: true });
  let mesh;
  if (kind === "free ghost"){
    mesh = new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.55, 10, 1, true), mat);
    mesh.position.y = 0.78;
  } else if (kind === "mutant2"){
    mesh = new THREE.Mesh(new THREE.OctahedronGeometry(0.82, 1), mat);
    mesh.position.y = 0.92;
  } else {
    mesh = new THREE.Mesh(new THREE.TorusKnotGeometry(0.42, 0.14, 84, 10), mat);
    mesh.position.y = 0.9;
  }
  group.add(mesh);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSpriteTexture(), color: 0xb48cff, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(2.2, 2.2, 1);
  halo.position.y = 0.92;
  group.add(halo);
  group.userData.core = mesh;
  return group;
}
function buildLegendHall(scene, R, wallHeight, log = console.log){
  const group = new THREE.Group();
  const center = new THREE.Vector3(-R * 0.46, 0, -R * 0.36);
  group.position.copy(center);

  scene.add(group);

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(11.0, 0.18, 6.4),
    new THREE.MeshStandardMaterial({ color: 0x10141d, roughness: 0.78, metalness: 0.12, emissive: 0x0a0f1a, emissiveIntensity: 0.12 })
  );
  base.position.y = 0.09;
  group.add(base);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(11.2, 0.08, 6.6),
    new THREE.MeshStandardMaterial({ color: 0x7b57ff, roughness: 0.22, metalness: 0.34, emissive: 0x5521ff, emissiveIntensity: 0.95 })
  );
  trim.position.y = 0.22;
  group.add(trim);

  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(10.2, 5.8),
    new THREE.MeshStandardMaterial({ color: 0x0b1018, roughness: 0.82, metalness: 0.08, emissive: 0x091120, emissiveIntensity: 0.12, side: THREE.DoubleSide })
  );
  backWall.position.set(0, 3.05, -3.16);
  group.add(backWall);

  const titleTex = createPlaqueTexture("game legends", "hall of fame top 10");
  const title = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 1.46),
    new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, side: THREE.DoubleSide })
  );
  title.position.set(0, 5.00, -3.05);
  group.add(title);

  const pedX = [-2.9, 0, 2.9];
  const labels = ["character model", "scarlett vr", "animated model"];
  const holoGroups = [];
  pedX.forEach((xPos, idx)=>{
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(0.86, 0.98, 1.08, 24),
      new THREE.MeshStandardMaterial({ color: 0x171b22, roughness: 0.65, metalness: 0.24, emissive: 0x0c1018, emissiveIntensity: 0.16 })
    );
    pedestal.position.set(xPos, 0.62, -0.3);
    group.add(pedestal);

    const cap = new THREE.Mesh(
      new THREE.CylinderGeometry(0.94, 0.94, 0.06, 28),
      new THREE.MeshStandardMaterial({ color: 0x8bcfff, roughness: 0.18, metalness: 0.42, emissive: 0x4da9ff, emissiveIntensity: 0.65 })
    );
    cap.position.set(xPos, 1.18, -0.3);
    group.add(cap);

    const plaqueTex = createPlaqueTexture(labels[idx], "reserved display");
    const plaque = new THREE.Mesh(
      new THREE.PlaneGeometry(2.2, 0.62),
      new THREE.MeshBasicMaterial({ map: plaqueTex, transparent: true, side: THREE.DoubleSide })
    );
    plaque.position.set(xPos, 0.72, 0.82);
    plaque.rotation.x = -0.42;
    group.add(plaque);

    const holo = createHologramSilhouette(labels[idx]);
    holo.position.set(xPos, 1.2, -0.3);
    group.add(holo);
    holoGroups.push(holo);

    const spot = new THREE.SpotLight(0xe7f1ff, 13.5, 18, Math.PI * 0.16, 0.26, 1.4);
    spot.position.set(xPos, 6.2, 1.2);
    spot.target.position.set(xPos, 1.2, -0.3);
    spot.castShadow = false;
    group.add(spot);
    group.add(spot.target);
  });

  const postMat = new THREE.MeshStandardMaterial({ color: 0xaab5c8, roughness: 0.32, metalness: 0.55, emissive: 0x1b2432, emissiveIntensity: 0.22 });
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x6e4dff, roughness: 0.34, metalness: 0.14, emissive: 0x4522d0, emissiveIntensity: 0.88 });
  const railPts = [
    new THREE.Vector3(-4.75, 0, 1.7),
    new THREE.Vector3( 4.75, 0, 1.7),
    new THREE.Vector3( 5.2, 0, -2.15),
    new THREE.Vector3(-5.2, 0, -2.15)
  ];
  railPts.forEach((p)=>{
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.08, 16), postMat);
    post.position.copy(p).add(new THREE.Vector3(0, 0.54, 0));
    group.add(post);
  });
  function addRope(a,b,y){
    const dir = new THREE.Vector3().subVectors(b,a);
    const len = dir.length();
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, len, 12), ropeMat);
    rope.position.copy(a).lerp(b, 0.5).add(new THREE.Vector3(0, y, 0));
    rope.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.clone().normalize());
    group.add(rope);
  }
  for (let i = 0; i < railPts.length; i++){
    const a = railPts[i];
    const b = railPts[(i + 1) % railPts.length];
    addRope(a,b,0.78);
    addRope(a,b,0.54);
  }

  const blocker = new THREE.Mesh(
    new THREE.BoxGeometry(10.8, 0.18, 0.52),
    new THREE.MeshStandardMaterial({ color: 0x111722, roughness: 0.76, metalness: 0.08, emissive: 0x0d1220, emissiveIntensity: 0.10 })
  );
  blocker.position.set(0, 0.09, 1.96);
  group.add(blocker);

  const fillA = new THREE.PointLight(0x9a7cff, 5.4, 30, 2.0);
  fillA.position.set(-2.8, 3.8, -1.0);
  group.add(fillA);
  const fillB = new THREE.PointLight(0x89d8ff, 5.0, 30, 2.0);
  fillB.position.set(2.8, 3.8, -1.0);
  group.add(fillB);

  return { group, holoGroups };
}

function buildAlignedLegendHall(scene, R, wallHeight, log = console.log){
  const hall = buildLegendHall(scene, R, wallHeight, log);
  const angle = -Math.PI * 0.75;
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.4), 0, Math.sin(angle) * (R - 4.4));
  hall.group.position.copy(center);
  hall.group.rotation.y = Math.atan2(-center.x, -center.z);
  return hall;
}


async function populateLegendPedestals(legendHall, spawnLogoTex, log = console.log){
  if (!legendHall?.group) return;
  legendHall.holoGroups?.forEach((holo)=>{ holo.visible = false; });
  legendHall.displayUpdaters = [];

  const prepare = (root)=>{
    root.traverse((obj)=>{
      if (!obj.isMesh) return;
      obj.castShadow = false;
      obj.receiveShadow = false;
      obj.frustumCulled = false;
    });
  };

  async function addModel(xPos, urls, opts={}){
    const root = await tryLoadGLTF(urls, log, 12000);
    if (!root) return;
    prepare(root);
    orientCharacterUpright(root);
    scaleToHeight(root, opts.targetHeight || 2.32);
    dropToGround(root);
    root.position.set(xPos, 1.12, -0.34);
    root.rotation.y = Math.PI;
    legendHall.group.add(root);
    legendHall.displayUpdaters.push((t, dt)=>{ root.rotation.y += dt * (opts.spin || 0.22); root.position.y = 1.12 + Math.sin(t * 1.15 + xPos) * 0.03; });
  }

  await addModel(-2.9, assetUrls("models/legend_character.glb"), { spin: 0.10, targetHeight: 2.12 });

  if (spawnLogoTex){
    const logo = new THREE.Mesh(
      new THREE.PlaneGeometry(2.0, 2.0),
      new THREE.MeshBasicMaterial({ map: spawnLogoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    logo.position.set(0, 2.60, -0.28);
    legendHall.group.add(logo);
    legendHall.displayUpdaters.push((t, dt)=>{ logo.rotation.y += dt * 0.40; logo.position.y = 2.60 + Math.sin(t * 1.45) * 0.08; });
  }

  await addModel(2.9, assetUrls("models/legend_animated.glb"), { spin: -0.09, targetHeight: 2.12 });
}

function chooseBestWallFacingY(obj){
  const rotations = [0, Math.PI * 0.5, Math.PI, -Math.PI * 0.5];
  let bestRot = 0;
  let bestScore = -Infinity;
  for (const ry of rotations){
    obj.rotation.y = ry;
    obj.updateMatrixWorld(true);
    const { size } = boxSize(obj);
    const score = size.x * 1.2 - size.z * 0.9;
    if (score > bestScore){
      bestScore = score;
      bestRot = ry;
    }
  }
  obj.rotation.y = bestRot;
  obj.updateMatrixWorld(true);
  return bestRot;
}

function buildStoreWall(scene, R, wallHeight, spawnLogoTex){
  const group = new THREE.Group();
  const angle = -Math.PI * 0.25;
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 0.54), wallHeight * 0.5, Math.sin(angle) * (R - 0.54));
  group.position.copy(center);
  group.rotation.y = Math.atan2(inward.x, inward.z);

  scene.add(group);

  const wallFrame = new THREE.Mesh(
    new THREE.BoxGeometry(8.6, wallHeight - 0.5, 0.22),
    new THREE.MeshStandardMaterial({ color: 0x0c1118, roughness: 0.72, metalness: 0.16, emissive: 0x101a2b, emissiveIntensity: 0.16 })
  );
  group.add(wallFrame);

  const signX = -2.28;
  const signZ = 0.12;
  const modelX = 2.18;

  const signPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(4.25, wallHeight - 1.25),
    new THREE.MeshStandardMaterial({ color: 0x060a12, roughness: 0.72, metalness: 0.12, emissive: 0x0e1730, emissiveIntensity: 0.24, side: THREE.DoubleSide })
  );
  signPanel.position.set(signX, 0.0, 0.105);
  group.add(signPanel);

  const storeTex = createStoreDisplayTexture();
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(4.0, wallHeight - 1.55),
    new THREE.MeshBasicMaterial({ map: storeTex, side: THREE.DoubleSide })
  );
  screen.position.set(signX, -0.02, signZ);
  group.add(screen);


  const plaqueTex = createPlaqueTexture("store wall", "north east");
  const plaque = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 0.84),
    new THREE.MeshBasicMaterial({ map: plaqueTex, transparent: true, side: THREE.DoubleSide })
  );
  plaque.position.set(signX, wallHeight * 0.39, 0.14);
  group.add(plaque);

  if (spawnLogoTex){
    const logo = new THREE.Mesh(
      new THREE.PlaneGeometry(1.3, 1.3),
      new THREE.MeshBasicMaterial({ map: spawnLogoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    logo.position.set(signX, wallHeight * 0.18, 0.16);
    group.add(logo);
  }

  const displayPanel = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, wallHeight - 1.32),
    new THREE.MeshStandardMaterial({ color: 0x070d14, roughness: 0.78, metalness: 0.08, emissive: 0x121c2f, emissiveIntensity: 0.22, side: THREE.DoubleSide })
  );
  displayPanel.position.set(modelX, 0.02, 0.085);
  group.add(displayPanel);

  const spotA = new THREE.SpotLight(0x9fdcff, 8.5, 24, Math.PI * 0.18, 0.28, 1.3);
  spotA.position.set(-1.7, wallHeight * 0.86, 3.2);
  spotA.target.position.set(signX, wallHeight * 0.20, 0.18);
  group.add(spotA);
  group.add(spotA.target);
  const spotB = new THREE.SpotLight(0xc191ff, 9.0, 26, Math.PI * 0.20, 0.24, 1.2);
  spotB.position.set(1.9, wallHeight * 0.86, 3.2);
  spotB.target.position.set(modelX, wallHeight * 0.12, 0.18);
  group.add(spotB);
  group.add(spotB.target);
  const modelFill = new THREE.PointLight(0x8fd6ff, 3.4, 16, 2.0);
  modelFill.position.set(modelX, wallHeight * 0.35, 1.2);
  group.add(modelFill);

  const modelMount = new THREE.Group();
  modelMount.position.set(modelX, -(wallHeight * 0.5) + 0.02, 1.10);
  group.add(modelMount);

  const kioskShell = new THREE.Group();
  const kioskBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 2.22, 0.54),
    new THREE.MeshStandardMaterial({ color: 0x121722, roughness: 0.46, metalness: 0.22, emissive: 0x18243d, emissiveIntensity: 0.26 })
  );
  kioskBody.position.y = 1.11;
  kioskShell.add(kioskBody);
  const kioskScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.92, 1.36),
    new THREE.MeshBasicMaterial({ map: storeTex, side: THREE.DoubleSide })
  );
  kioskScreen.position.set(0, 1.18, 0.275);
  kioskShell.add(kioskScreen);
  const kioskTrim = new THREE.Mesh(
    new THREE.BoxGeometry(1.02, 1.46, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xa6dfff, roughness: 0.24, metalness: 0.42, emissive: 0x3d7fff, emissiveIntensity: 0.45 })
  );
  kioskTrim.position.set(0, 1.18, 0.26);
  kioskShell.add(kioskTrim);
  modelMount.add(kioskShell);

  (async ()=>{
    let storeModel = await tryLoadGLTF(assetUrls("models/store.glb", "store.glb"), ()=>{}, 9000);
    if (!storeModel) storeModel = await tryLoadFBX(assetUrls("models/store.fbx", "store.fbx"), ()=>{}, 10000);
    if (!storeModel) return;
    touchModelShadows(storeModel);
    orientCharacterUpright(storeModel);
    scaleToHeight(storeModel, 2.70);
    fitDiameter(storeModel, 2.10);
    storeModel.rotation.set(0, 0, 0);
    let info = boxSize(storeModel);
    storeModel.position.set(-info.center.x, -info.box.min.y, -info.center.z + 0.10);
    info = boxSize(storeModel);
    storeModel.position.x -= info.center.x * 0.02;
    storeModel.traverse((child)=>{ if (child.isMesh && child.material){ child.material.emissive = new THREE.Color(0x101828); child.material.emissiveIntensity = 0.06; } });
    kioskShell.visible = false;
    modelMount.add(storeModel);
  })().catch(()=>{});

  const activeBtn = new THREE.Mesh(
    new THREE.BoxGeometry(0.9, 0.22, 0.08),
    new THREE.MeshStandardMaterial({ color: 0x8b1e2f, roughness: 0.45, metalness: 0.18, emissive: 0x5a0b18, emissiveIntensity: 0.9 })
  );
  activeBtn.position.set(signX, 0.72, 0.20);
  group.add(activeBtn);


  const adHeader = new THREE.Mesh(
    new THREE.PlaneGeometry(3.26, 0.56),
    new THREE.MeshBasicMaterial({ map: createSponsorPlateTexture('SPONSOR SLOT', 'awaiting approval'), transparent: true, side: THREE.DoubleSide })
  );
  adHeader.position.set(modelX, wallHeight * 0.39, 0.18);
  group.add(adHeader);

  const adBillboard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.42, 4.30),
    new THREE.MeshBasicMaterial({ map: createAdBillboardTexture(['SVR SPONSOR', 'AWAITING APPROVAL']), transparent: true, side: THREE.DoubleSide })
  );
  adBillboard.position.set(modelX, -0.20, 0.15);
  group.add(adBillboard);

  const activePlaque = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.5),
    new THREE.MeshBasicMaterial({ map: createPlaqueTexture("active", "store entry"), transparent: true, side: THREE.DoubleSide })
  );
  activePlaque.position.set(signX, 1.04, 0.18);
  group.add(activePlaque);

  return { group };
}

function addScorpionRoom(scene, R, wallHeight){
  const angle = Math.PI * 0.24; // southeast wall area
  const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
  const center = new THREE.Vector3(Math.cos(angle) * (R - 4.6), 0, Math.sin(angle) * (R - 4.6));

  const root = new THREE.Group();
  root.position.copy(center);
  root.lookAt(root.position.clone().add(inward));
  scene.add(root);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(9.6, 0.12, 6.0),
    new THREE.MeshStandardMaterial({ color: 0x120812, roughness: 0.88, metalness: 0.04, emissive: 0x2a0b24, emissiveIntensity: 0.18 })
  );
  floor.position.set(0, 0.06, 0);
  root.add(floor);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(9.8, 5.7, 0.16),
    new THREE.MeshStandardMaterial({ color: 0x08070d, roughness: 0.74, metalness: 0.10, emissive: 0x1f0a20, emissiveIntensity: 0.18 })
  );
  backWall.position.set(0, 2.85, -2.82);
  root.add(backWall);

  const leftWall = new THREE.Mesh(
    new THREE.BoxGeometry(0.16, 5.4, 5.9),
    new THREE.MeshStandardMaterial({ color: 0x0a0810, roughness: 0.72, metalness: 0.08, emissive: 0x18081c, emissiveIntensity: 0.16 })
  );
  leftWall.position.set(-4.84, 2.7, 0);
  root.add(leftWall);
  const rightWall = leftWall.clone();
  rightWall.position.x = 4.84;
  root.add(rightWall);

  const signTex = canvasTexture(1200, 220, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0, '#120313');
    g.addColorStop(1, '#290516');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,111,181,0.92)';
    x.lineWidth = 10; x.strokeRect(16,16,w-32,h-32);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#fff2fb'; x.font = 'bold 86px system-ui, Arial'; x.fillText('SCORPION GAME ROOM', w/2, 100);
    x.fillStyle = '#ffadd7'; x.font = 'bold 30px system-ui, Arial'; x.fillText('REAL PLAY • TABLE FLOW • PRIVATE ACTION', w/2, 170);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 1.10), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide }));
  sign.position.set(0, 5.14, -2.72);
  root.add(sign);

  const portalTex = canvasTexture(1024, 1024, (x,w,h)=>{
    const g = x.createRadialGradient(w/2,h/2,120,w/2,h/2,w/2);
    g.addColorStop(0,'rgba(255,255,255,0.98)');
    g.addColorStop(0.18,'rgba(255,135,220,0.96)');
    g.addColorStop(0.55,'rgba(158,54,255,0.46)');
    g.addColorStop(1,'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0,0,w,h);
  });
  const portal = new THREE.Mesh(
    new THREE.RingGeometry(0.72, 1.16, 64),
    new THREE.MeshBasicMaterial({ map: portalTex, color: 0xffffff, transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  portal.rotation.x = -Math.PI * 0.5;
  portal.position.set(0, 0.03, 1.7);
  root.add(portal);

  const boardTex = canvasTexture(900, 720, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'#0b0d17');
    g.addColorStop(1,'#1c0721');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(214,132,255,0.92)';
    x.lineWidth = 10; x.strokeRect(18,18,w-36,h-36);
    x.fillStyle = '#fdf5ff'; x.font = 'bold 60px system-ui, Arial'; x.fillText('SCORPION ACCESS', 44, 92);
    x.fillStyle = '#ffc4eb'; x.font = '36px system-ui, Arial'; 
    let y = 180;
    ['Fast jump from watch', 'Fist near face toggles teleport', 'Reserved for real play flow', 'Modular room for future game scene'].forEach(line=>{ x.fillText('• ' + line, 54, y); y += 92; });
  });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.56), new THREE.MeshBasicMaterial({ map: boardTex, transparent: true, side: THREE.DoubleSide }));
  board.position.set(-2.34, 2.1, -2.68);
  root.add(board);

  const lightA = new THREE.PointLight(0xff7fd0, 1.4, 18, 2.0);
  lightA.position.set(0, 3.8, 1.2);
  root.add(lightA);

  return {
    root,
    target: center.clone().add(inward.clone().multiplyScalar(2.0)).setY(0),
    look: center.clone().setY(1.6)
  };
}

function buildOuterCity(scene, R){
  const group = new THREE.Group();
  const glassMats = [
    new THREE.MeshStandardMaterial({ color: 0x9fdfff, roughness: 0.14, metalness: 0.32, emissive: 0x15396a, emissiveIntensity: 1.26 }),
    new THREE.MeshStandardMaterial({ color: 0xb993ff, roughness: 0.16, metalness: 0.30, emissive: 0x31125f, emissiveIntensity: 1.16 }),
    new THREE.MeshStandardMaterial({ color: 0x8bd7ff, roughness: 0.12, metalness: 0.32, emissive: 0x1c4e84, emissiveIntensity: 1.32 })
  ];
  const bodyMats = [
    new THREE.MeshStandardMaterial({ color: 0x07101a, roughness: 0.68, metalness: 0.24, emissive: 0x091624, emissiveIntensity: 0.84 }),
    new THREE.MeshStandardMaterial({ color: 0x09131f, roughness: 0.62, metalness: 0.28, emissive: 0x0c1b2d, emissiveIntensity: 0.92 }),
    new THREE.MeshStandardMaterial({ color: 0x0a1219, roughness: 0.64, metalness: 0.26, emissive: 0x0d1828, emissiveIntensity: 0.88 })
  ];
  const matrix = createMatrixBillboardTexture();
  const billboardUpdaters = [matrix.update];
  const adTex = createAdBillboardTexture(["SVRPOKER.COM", "ALL IN"]);
  const sponsorHoldTex = createAdBillboardTexture(['SPONSOR SLOT', 'AVAILABLE']);
  // Phase 84F: espressoTex is preloaded/shared above to avoid boot ReferenceError.

  const count = 68;
  // PHASE-84C: Player-view ad corridor. The sponsor skyline faces the seated/lobby player.
  // Ads are placed on dedicated towers with a clear sight-line instead of being hidden behind random buildings.
  const adSlotMap = new Map([
    // PHASE-84D: player view looks north through the lobby, so the premium ad must live on the north/center face.
    [0,  { type: 'premiumVertical', texture: 'placeholder', name: 'AD_CENTER_PREMIUM_PLACEHOLDER_BEHIND_WALL_ONLY', angle: -Math.PI * 0.5, rr: R + 24, h: 66, w: 11.8, d: 3.6 }],
    [3,  { type: 'vertical', texture: 'matrix', name: 'AD_RIGHT_TOWER_VISIBLE', angle: -Math.PI * 0.5 + 0.30, rr: R + 36, h: 48, w: 7.2, d: 3.8 }],
    [65, { type: 'vertical', texture: 'placeholder', name: 'AD_LEFT_TOWER_VISIBLE', angle: -Math.PI * 0.5 - 0.30, rr: R + 36, h: 48, w: 7.2, d: 3.8 }],
    [7,  { type: 'horizontal', texture: 'svr', name: 'AD_RIGHT_LOWER_BANNER', angle: -Math.PI * 0.5 + 0.54, rr: R + 42, h: 28, w: 11.4, d: 3.6 }],
    [61, { type: 'horizontal', texture: 'placeholder', name: 'AD_LEFT_LOWER_BANNER', angle: -Math.PI * 0.5 - 0.54, rr: R + 42, h: 28, w: 11.4, d: 3.6 }],
    [12, { type: 'vertical', texture: 'placeholder', name: 'AD_FAR_RIGHT_SPONSOR_SLOT', angle: -Math.PI * 0.5 + 0.78, rr: R + 50, h: 40, w: 6.4, d: 3.8 }],
    [56, { type: 'vertical', texture: 'matrix', name: 'AD_FAR_LEFT_SPONSOR_SLOT', angle: -Math.PI * 0.5 - 0.78, rr: R + 50, h: 40, w: 6.4, d: 3.8 }]
  ]);
  const adIndices = new Set(adSlotMap.keys());
  const espressoBuildingIndex = 0;
  const normalizeAngle = (ang)=> Math.atan2(Math.sin(ang), Math.cos(ang));
  for (let i = 0; i < count; i++){
    const slot = adSlotMap.get(i);
    let a = slot?.angle ?? ((i / count) * Math.PI * 2);
    const corridor = Math.abs(normalizeAngle(a + Math.PI * 0.5)) < 0.92;
    let rr = slot?.rr ?? ((R + 18) + Math.random() * 26);
    let h = slot?.h ?? (18 + Math.random() * 34);
    let w = slot?.w ?? (3.8 + Math.random() * 6.8);
    let d = slot?.d ?? (3.2 + Math.random() * 6.2);
    if (!slot && corridor){
      // keep non-ad towers in the sight corridor lower and farther back so banners remain visible
      rr = R + 52 + Math.random() * 20;
      h = 12 + Math.random() * 17;
      w = 2.4 + Math.random() * 3.6;
      d = 2.8 + Math.random() * 3.2;
    }
    if (slot?.type === 'premiumVertical') { h = Math.max(h, 62); w = Math.max(w, 9.2); d = Math.max(d, 3.8); }
    else if (slot?.type === 'vertical') { h = Math.max(h, 42); w = Math.max(w, 6.4); d = Math.max(d, 3.6); }
    else if (slot?.type === 'horizontal') { h = Math.max(h, 28); w = Math.max(w, 10.8); d = Math.max(d, 3.4); }
    const x = Math.cos(a) * rr;
    const z = Math.sin(a) * rr;
    const style = i % 6;
    const bodyMat = bodyMats[i % bodyMats.length];
    const glassMat = glassMats[i % glassMats.length];
    let bodyGeo;
    if (style === 0) bodyGeo = new THREE.BoxGeometry(w, h, d);
    else if (style === 1) bodyGeo = new THREE.CylinderGeometry(w * 0.48, w * 0.62, h, 12);
    else if (style === 2) bodyGeo = new THREE.BoxGeometry(w * 0.92, h, d * 0.76);
    else if (style === 3) bodyGeo = new THREE.CylinderGeometry(w * 0.52, w * 0.58, h, 10);
    else if (style === 4) bodyGeo = new THREE.BoxGeometry(w * 0.84, h, d * 1.18);
    else bodyGeo = new THREE.BoxGeometry(w * 1.08, h, d * 0.88);

    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.set(x, h * 0.5, z);
    body.rotation.y = -a + Math.PI / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    const outward = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const frontInset = d * 0.5 + 0.08;

    const frontGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(2.2, w * 0.80), Math.max(10, h * 0.88)),
      glassMat
    );
    frontGlass.position.set(x - outward.x * frontInset, h * 0.52, z - outward.z * frontInset);
    frontGlass.lookAt(frontGlass.position.clone().sub(outward));
    group.add(frontGlass);

    const stripCount = 3 + (Math.random() * 3 | 0);
    for (let s2 = 0; s2 < stripCount; s2++){
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(1.8, w * 0.86), 0.24), glassMat);
      strip.position.set(x - outward.x * (frontInset - 0.02), 4 + ((s2 + 1) / (stripCount + 1)) * (h - 6), z - outward.z * (frontInset - 0.02));
      strip.lookAt(strip.position.clone().sub(outward));
      group.add(strip);
    }

    if (i % 6 === 0){
      const poleH = 3.4 + Math.random() * 5.0;
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, poleH, 8), glassMat);
      pole.position.set(x, h + poleH * 0.5, z);
      group.add(pole);
      const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 12), glassMat);
      beacon.position.set(x, h + poleH, z);
      group.add(beacon);
    }

    if (adIndices.has(i)){
      const slot = adSlotMap.get(i) || { type: 'vertical', texture: 'svr', name: 'AD_SLOT' };
      const isEspresso = i === espressoBuildingIndex || slot.texture === 'espresso';
      const tex = isEspresso ? espressoTex : (slot.texture === 'matrix' ? matrix.texture : (slot.texture === 'placeholder' ? sponsorHoldTex : adTex));
      if (tex) tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      const isHorizontal = slot.type === 'horizontal';
      const bw = isEspresso ? Math.max(5.4, Math.min(w * 0.86, 7.4)) : (isHorizontal ? Math.max(7.2, Math.min(w * 0.92, 10.6)) : Math.max(4.6, Math.min(w * 0.80, 6.4)));
      const bh = isEspresso ? Math.max(24.0, Math.min(h * 0.80, 38.0)) : (isHorizontal ? Math.max(3.0, Math.min(h * 0.22, 5.6)) : Math.max(12.0, Math.min(h * 0.68, 25.0)));
      const bill = new THREE.Mesh(
        new THREE.PlaneGeometry(bw, bh),
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: false,
          side: THREE.DoubleSide,
          color: 0xffffff,
          depthWrite: true
        })
      );
      bill.name = isEspresso ? "SVR_Espresso_With_Cream_Building_Ad" : `SVR_Building_Billboard_${slot.name || i}`;
      const yFit = isEspresso ? Math.min(Math.max(h * 0.55, 24.0), h - 3.0) : (isHorizontal ? Math.min(Math.max(h * 0.56, 11.0), h - 2.2) : Math.min(Math.max(h * 0.56, 14.0), h - 2.4));
      // Use building depth, not width, so the ad sits directly on the visible front face.
      const faceOffset = d * 0.5 + 0.42;
      bill.position.set(x - outward.x * faceOffset, yFit, z - outward.z * faceOffset);
      bill.lookAt(bill.position.clone().sub(outward));
      bill.renderOrder = isEspresso ? 45 : 42;
      group.add(bill);

      if (isEspresso){
        const adGlow = new THREE.PointLight(0xffc15a, 0.95, 26, 2.1);
        adGlow.position.copy(bill.position).add(new THREE.Vector3(0, 0.5, 0));
        group.add(adGlow);
      }

      if (false){
        const neon = new THREE.Mesh(
          new THREE.PlaneGeometry(bw, 1.48),
          new THREE.MeshBasicMaterial({
            map: canvasTexture(1500, 260, (ctx,w2,h2)=>{
              const g = ctx.createLinearGradient(0,0,w2,h2);
              g.addColorStop(0, "rgba(2,28,15,0.92)");
              g.addColorStop(1, "rgba(3,8,6,0.96)");
              ctx.fillStyle = g; ctx.fillRect(0,0,w2,h2);
              ctx.strokeStyle = "rgba(86,255,176,0.96)";
              ctx.lineWidth = 10;
              roundRectPath(ctx, 12, 12, w2 - 24, h2 - 24, 26);
              ctx.stroke();
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#d9ffee";
              ctx.font = "bold 92px system-ui, Arial";
              ctx.fillText("SPONSOR SLOT", w2 / 2, 94);
              ctx.fillStyle = "#7bffb7";
              ctx.font = "700 50px system-ui, Arial";
              ctx.fillText("Modular Building Banner", w2 / 2, 178);
            }),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        neon.position.copy(bill.position).add(new THREE.Vector3(0, -bh * 0.58, 0.02));
        neon.lookAt(neon.position.clone().sub(outward));
        group.add(neon);
      }
    }
  }


  scene.add(group);
  return { group, billboardUpdaters };
}

function makeSeat(scene, x, z, angle, label, chairMat, metalMat){
  // Phase 84I hotfix: some prior injected ad/seat code referenced R inside makeSeat.
  // Keep a local room-radius fallback so the seat path can never black-screen from undefined R.
  const R = CONFIG?.ROOM_RADIUS || 30;
  const group = new THREE.Group();
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.36, 0.54, 48),
    new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: 0.64, side: THREE.DoubleSide })
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.014;
  group.add(ring);
  const seatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.72, 18), metalMat);
  seatBase.position.y = 0.36;
  group.add(seatBase);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 0.06, 28), metalMat);
  foot.position.y = 0.03;
  group.add(foot);
  const seatShell = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.10, 0.72), chairMat);
  seatShell.position.y = 0.70;
  group.add(seatShell);
  const seatCushion = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.08, 0.58),
    new THREE.MeshStandardMaterial({ color: 0x2f2040, roughness: 0.72, metalness: 0.08, emissive: 0x140a1e, emissiveIntensity: 0.06 })
  );
  seatCushion.position.y = 0.77;
  group.add(seatCushion);
  const back = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.76, 0.12), chairMat);
  back.position.set(0, 1.10, -0.30);
  back.rotation.x = -0.16;
  group.add(back);
  const lumbar = new THREE.Mesh(
    new THREE.BoxGeometry(0.54, 0.26, 0.07),
    new THREE.MeshStandardMaterial({ color: 0x2a1836, roughness: 0.72, metalness: 0.05, emissive: 0x120916, emissiveIntensity: 0.05 })
  );
  lumbar.position.set(0, 1.04, -0.23);
  lumbar.rotation.x = -0.10;
  group.add(lumbar);
  const armL = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.18, 0.56), chairMat);
  armL.position.set(-0.35, 0.90, 0.02);
  group.add(armL);
  const armR = armL.clone();
  armR.position.x = 0.35;
  group.add(armR);
  const headrest = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.18, 0.10), chairMat);
  headrest.position.set(0, 1.45, -0.26);
  group.add(headrest);
  const sideL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.62, 0.10), metalMat);
  sideL.position.set(-0.32, 1.02, -0.18);
  sideL.rotation.z = 0.08;
  group.add(sideL);
  const sideR = sideL.clone();
  sideR.position.x = 0.32;
  sideR.rotation.z = -0.08;
  group.add(sideR);
  const legs = [[-0.24,0.34,-0.24],[0.24,0.34,-0.24],[-0.24,0.34,0.24],[0.24,0.34,0.24]];
  for (const [lx,ly,lz] of legs){
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.72, 12), metalMat);
    leg.position.set(lx, ly, lz);
    group.add(leg);
  }
  const crossbar = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.06), metalMat);
  crossbar.position.set(0, 0.22, 0);
  group.add(crossbar);
  group.position.set(x, 0, z);
  group.rotation.y = angle;

  scene.add(group);
  return { group, ring, x, z, angle, label };
}
function addChipsAndCards(scene, tableTopY = 0.86){
  const group = new THREE.Group();
  const chipMatA = new THREE.MeshStandardMaterial({ color: 0xb48cff, roughness: 0.35, metalness: 0.25, emissive: 0x230d30, emissiveIntensity: 0.35 });
  const chipMatB = new THREE.MeshStandardMaterial({ color: 0x00e2c7, roughness: 0.35, metalness: 0.25, emissive: 0x06261f, emissiveIntensity: 0.28 });
  const stacks = [[-1.42, 1.20, chipMatA],[-1.04, 1.05, chipMatB],[-0.72, 1.28, chipMatB],[-0.18, 1.22, chipMatA],[0.38, 1.18, chipMatB],[0.92,1.08,chipMatA],[1.24,0.92,chipMatB],[1.52,0.82,chipMatA],[-0.56,0.86,chipMatA],[0.14,0.88,chipMatB]];
  for (const [x, z, mat] of stacks){
    for (let i = 0; i < 8; i++){
      const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.018, 24), mat);
      chip.position.set(x, tableTopY + 0.010 + i * 0.018, z - 0.19);
      group.add(chip);
    }
  }

  scene.add(group);
  return group;
}


function addDealingDemo(scene, seats, tableTopY = 0.86, getDealerPos = null){
  const group = new THREE.Group();
  const cardMat = new THREE.MeshStandardMaterial({ color: 0xfefdf7, roughness: 0.86, metalness: 0.0, emissive: 0x0e0d10, emissiveIntensity: 0.03 });
  const redMat = new THREE.MeshStandardMaterial({ color: 0xca3048, roughness: 0.58, metalness: 0.08, emissive: 0x460914, emissiveIntensity: 0.12 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x111318, roughness: 0.58, metalness: 0.08, emissive: 0x06070a, emissiveIntensity: 0.06 });
  const dealer = getDealerPos ? getDealerPos() : new THREE.Vector3(0, tableTopY + 0.08, -1.18);
  const handSeconds = 18.0;
  const userSeatIndex = 3;
  const seatCards = [];
  const labels = [];
  const buttonMarkers = [];
  const botNames = ['BOT ALPHA','BOT NOVA','BOT VEGA','YOU','BOT ORBIT','BOT ACE'];
  seats.forEach((seat, seatIndex)=>{
    for (let c = 0; c < 2; c++){
      const card = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.31, 0.008), cardMat);
      const pip = new THREE.Mesh(new THREE.BoxGeometry(0.026, 0.0025, 0.026), c === 0 ? redMat : blackMat);
      card.visible = false; pip.visible = false;
      group.add(card); group.add(pip);
      seatCards.push({ seat, seatIndex, c, order: seatIndex + c * seats.length, card, pip });
    }
    const plaqueText = seatIndex === userSeatIndex ? 'PLAYER OPEN' : botNames[seatIndex] || `BOT ${seatIndex+1}`;
    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(seatIndex === userSeatIndex ? 0.60 : 0.42, 0.12),
      new THREE.MeshBasicMaterial({ map: createPlaqueTexture(plaqueText, seat.label || 'seat'), transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    group.add(label);
    labels.push({ seat, seatIndex, label });
  });
  const community = [];
  for (let i = 0; i < 5; i++){
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.42, 0.010), cardMat);
    const pip = new THREE.Mesh(new THREE.BoxGeometry(0.034, 0.0025, 0.034), i % 2 ? blackMat : redMat);
    card.visible = false; pip.visible = false;
    group.add(card); group.add(pip);
    community.push({ card, pip, i });
  }
  const potGroup = new THREE.Group();
  const potBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.22, 0.26, 0.025, 28),
    new THREE.MeshStandardMaterial({ color: 0x101216, roughness: 0.65, metalness: 0.28, emissive: 0x2a0f38, emissiveIntensity: 0.10 })
  );
  potGroup.add(potBase);
  const potChips = [];
  for (let i = 0; i < 10; i++){
    const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.016, 22), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x00d9c9 : 0xb48cff, roughness: 0.40, metalness: 0.24, emissive: i % 2 ? 0x06261f : 0x240a30, emissiveIntensity: 0.28 }));
    chip.position.y = 0.015 + i * 0.017;
    chip.visible = false;
    potGroup.add(chip);
    potChips.push(chip);
  }
  potGroup.position.set(0, tableTopY + 0.012, -0.10);
  group.add(potGroup);
  const boardGlow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 0.62),
    new THREE.MeshBasicMaterial({ color: 0xa35dff, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })
  );
  boardGlow.rotation.x = -Math.PI * 0.5;
  boardGlow.position.set(0, tableTopY + 0.006, -0.03);
  group.add(boardGlow);

  const markerMat = (color)=> new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.18, emissive: color, emissiveIntensity: 0.25 });
  function createMarker(text, color){
    const root = new THREE.Group();
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.018, 18), markerMat(color));
    root.add(disc);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.06), new THREE.MeshBasicMaterial({ map: createPlaqueTexture(text, ''), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    plate.position.set(0, 0.08, 0);
    root.add(plate);
    return root;
  }
  const dealerButton = createMarker('D', 0xf4d46a);
  const sbMarker = createMarker('SB', 0x71d8ff);
  const bbMarker = createMarker('BB', 0xff7acc);
  group.add(dealerButton);
  group.add(sbMarker);
  group.add(bbMarker);
  const winningHalo = new THREE.Mesh(new THREE.RingGeometry(0.30, 0.42, 36), new THREE.MeshBasicMaterial({ color: 0x74ffd6, transparent: true, opacity: 0.0, side: THREE.DoubleSide }));
  winningHalo.rotation.x = -Math.PI * 0.5;
  winningHalo.position.y = tableTopY + 0.02;
  group.add(winningHalo);


  scene.add(group);

  function smooth01(v){ return Math.max(0, Math.min(1, v)); }
  function smoothstep(v){ const x = smooth01(v); return x * x * (3 - 2 * x); }
  function seatCardTarget(rec, phase, handIndex){
    const offset = rec.c === 0 ? -0.12 : 0.12;
    const x = rec.seat.x * 0.30 + offset * Math.cos(rec.seat.angle + Math.PI * 0.5);
    const z = rec.seat.z * 0.22 + offset * Math.sin(rec.seat.angle + Math.PI * 0.5) - 0.02;
    const y = tableTopY + 0.56 + Math.sin(phase * 1.4 + handIndex * 0.3 + rec.order) * 0.014;
    return new THREE.Vector3(x, y, z);
  }
  function boardTarget(i, phase, handIndex){
    return new THREE.Vector3(-0.72 + i * 0.36, tableTopY + 0.86 + Math.sin(phase * 1.2 + i * 0.32 + handIndex) * 0.016, -0.04);
  }

  function update(t){
    const handIndex = Math.floor(t / handSeconds);
    const phase = t % handSeconds;
    const dealerSeat = handIndex % seats.length;
    const sbSeat = (dealerSeat + 1) % seats.length;
    const bbSeat = (dealerSeat + 2) % seats.length;
    const winnerSeat = (dealerSeat + 4) % seats.length;

    const holeStart = 0.55;
    const holeStep = 0.42;
    const holeFlight = 0.34;
    const flopStart = 6.15;
    const flopStep = 0.28;
    const turnStart = 9.55;
    const riverStart = 12.15;
    const showdownStart = 14.25;
    const resetFade = 17.2;

    labels.forEach((rec)=>{
      const lx = rec.seat.x * 0.31;
      const lz = rec.seat.z * 0.23 - 0.02;
      rec.label.position.set(lx, tableTopY + 0.78, lz);
      const cam = scene.userData?._camera;
      const ly = cam ? Math.atan2(cam.position.x - lx, cam.position.z - lz) : 0;
      rec.label.rotation.set(0, ly, 0);
      rec.label.material.opacity = rec.seatIndex === userSeatIndex ? 0.72 : 0.92;
    });

    seatCards.forEach((rec)=>{
      const startAt = holeStart + rec.order * holeStep;
      const target = seatCardTarget(rec, phase, handIndex);
      const local = phase - startAt;
      const active = local > -0.12 && phase < resetFade;
      const arrive = smoothstep(local / holeFlight);
      rec.card.visible = active;
      rec.pip.visible = active;
      const fly = dealer.clone().lerp(target, arrive);
      fly.y += Math.sin(Math.PI * smooth01(local / holeFlight)) * 0.24;
      rec.card.position.copy(active ? fly : dealer);
      const cam = scene.userData?._camera;
      const ry = cam ? Math.atan2(cam.position.x - rec.card.position.x, cam.position.z - rec.card.position.z) : 0;
      rec.card.rotation.set(0.0, ry, 0.0);
      rec.pip.position.copy(rec.card.position).add(new THREE.Vector3(0.0, 0.06, 0.006));
      rec.pip.rotation.copy(rec.card.rotation);
      if (phase >= showdownStart){
        rec.card.position.y = target.y + Math.sin(phase * 2.2 + rec.order) * 0.018;
        rec.pip.position.copy(rec.card.position).add(new THREE.Vector3(0.0, 0.06, 0.006));
      }
      const fade = phase > resetFade ? (1.0 - smooth01((phase - resetFade) / 0.6)) : 1.0;
      rec.card.material.opacity = fade;
      rec.card.material.transparent = fade < 0.999;
      rec.pip.material.opacity = fade;
      rec.pip.material.transparent = fade < 0.999;
    });

    community.forEach((rec)=>{
      let startAt = flopStart + rec.i * flopStep;
      if (rec.i === 3) startAt = turnStart;
      if (rec.i === 4) startAt = riverStart;
      const target = boardTarget(rec.i, phase, handIndex);
      const local = phase - startAt;
      const active = local > -0.12 && phase < resetFade;
      const arrive = smoothstep(local / 0.34);
      rec.card.visible = active;
      rec.pip.visible = active;
      const fly = dealer.clone().lerp(target, arrive);
      fly.y += Math.sin(Math.PI * smooth01(local / 0.34)) * 0.28;
      rec.card.position.copy(active ? fly : dealer);
      const cam = scene.userData?._camera;
      const ry = cam ? Math.atan2(cam.position.x - rec.card.position.x, cam.position.z - rec.card.position.z) : 0;
      rec.card.rotation.set(0.0, ry, 0.0);
      rec.pip.position.copy(rec.card.position).add(new THREE.Vector3(0.0, 0.09, 0.006));
      rec.pip.rotation.copy(rec.card.rotation);
      const fade = phase > resetFade ? (1.0 - smooth01((phase - resetFade) / 0.6)) : 1.0;
      rec.card.material.opacity = fade;
      rec.card.material.transparent = fade < 0.999;
      rec.pip.material.opacity = fade;
      rec.pip.material.transparent = fade < 0.999;
    });

    const potVisible = phase >= flopStart ? (phase >= showdownStart ? 10 : phase >= riverStart ? 8 : phase >= turnStart ? 6 : 4) : 2;
    potChips.forEach((chip, i)=>{ chip.visible = i < potVisible; });
    potGroup.rotation.y += 0.002;
    boardGlow.material.opacity = phase >= flopStart ? (phase >= showdownStart ? 0.18 : 0.12) : 0.06;

    [
      [dealerButton, dealerSeat, tableTopY + 0.034, 0.12],
      [sbMarker, sbSeat, tableTopY + 0.034, 0.20],
      [bbMarker, bbSeat, tableTopY + 0.034, 0.28]
    ].forEach(([marker, seatIdx, y, lift])=>{
      const seat = seats[seatIdx];
      const inward = new THREE.Vector3(-seat.x, 0, -seat.z).normalize();
      marker.position.set(seat.x * 0.23 + inward.x * lift, y, seat.z * 0.17 + inward.z * lift);
      marker.rotation.set(0, Math.atan2(inward.x, inward.z), 0);
    });

    const winSeat = seats[winnerSeat];
    winningHalo.position.set(winSeat.x * 0.22, tableTopY + 0.02, winSeat.z * 0.16);
    winningHalo.material.opacity = phase >= showdownStart ? 0.55 + Math.sin(phase * 4.0) * 0.08 : 0.0;
  }
  return { group, update, dealer, handSeconds };
}
function applyEricMaterial(obj, texture, normalTex){
  obj.traverse((child)=>{
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    child.material = new THREE.MeshStandardMaterial({
      map: texture || null,
      normalMap: normalTex || null,
      color: texture ? 0xffffff : 0xd6d4e8,
      roughness: 0.68,
      metalness: 0.02,
      emissive: 0x0d0914,
      emissiveIntensity: 0.06,
      side: THREE.DoubleSide,
      skinning: !!child.isSkinnedMesh
    });
    child.frustumCulled = false;
  });
}
function applyClaudiaMaterial(obj, texture){
  obj.traverse((child)=>{
    if (!child.isMesh) return;
    child.castShadow = true;
    child.receiveShadow = true;
    child.material = new THREE.MeshStandardMaterial({
      map: texture || null,
      color: texture ? 0xffffff : 0xe6e6f2,
      roughness: 0.72,
      metalness: 0.02,
      emissive: 0x0b0d18,
      emissiveIntensity: 0.05,
      side: THREE.DoubleSide,
      skinning: !!child.isSkinnedMesh,
      alphaTest: 0.1
    });
    child.frustumCulled = false;
  });
}
function touchModelShadows(obj){
  obj.traverse((child)=>{
    if (!child.isMesh) return;
    child.castShadow = false;
    child.receiveShadow = false;
    if (!Array.isArray(child.material) && child.material) child.material.side = THREE.DoubleSide;
    child.frustumCulled = false;
  });
}
function sanitizeTableSurface(table, keepMesh = null){
  const box = new THREE.Box3();
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  const blinkNames = /object002_79f581|circle007|circle008/i;
  table.updateMatrixWorld(true);
  table.traverse((child)=>{
    if (!child.isMesh) return;
    box.setFromObject(child);
    box.getSize(size);
    box.getCenter(center);
    const flatSpan = Math.max(size.x, size.z);
    const isThinCap = size.y < 0.04 && flatSpan > 1.85 && center.y > 0.55;
    const isKnownBlink = blinkNames.test(child.name || "");
    if (isThinCap || isKnownBlink) child.visible = false;
  });
}

function addAlwaysVisibleEspressoAd(scene, R, wallHeight = 8){
  const group = new THREE.Group();
  group.name = 'SVR_PHASE84J_CARDINAL_BEHIND_WALL_ESPRESSO_ADS';

  // Phase 84J rule: all sponsor/ad towers sit BEHIND the perimeter wall,
  // raised above the wall line so storefronts and player pathways stay clear.
  // Four cardinal placements keep the banner visible from North/South/East/West views.
  const slots = [
    { name: 'NORTH', angle: -Math.PI * 0.5 },
    { name: 'SOUTH', angle:  Math.PI * 0.5 },
    { name: 'EAST',  angle:  0 },
    { name: 'WEST',  angle:  Math.PI }
  ];

  const towerMat = new THREE.MeshStandardMaterial({
    color: 0x061124,
    roughness: 0.54,
    metalness: 0.34,
    emissive: 0x10245a,
    emissiveIntensity: 0.86
  });
  const sideMat = new THREE.MeshStandardMaterial({
    color: 0x102f6c,
    roughness: 0.45,
    metalness: 0.24,
    emissive: 0x0d55a4,
    emissiveIntensity: 0.72
  });
  const goldMat = new THREE.MeshBasicMaterial({
    color: 0xffcf6a,
    transparent: true,
    opacity: 0.96,
    side: THREE.DoubleSide,
    depthWrite: false
  });

  const radius = R + 14.5;           // behind the wall, never inside the lobby/storefront area
  const towerW = 9.2;
  const towerH = 52.0;
  const towerD = 3.2;
  const towerY = wallHeight + towerH * 0.5 + 1.2;
  const adW = 7.0;
  const adH = 27.0;
  const adY = wallHeight + 27.5;     // moved higher above wall/rim sightline

  slots.forEach((slot)=>{
    const outward = new THREE.Vector3(Math.cos(slot.angle), 0, Math.sin(slot.angle));
    const inward = outward.clone().multiplyScalar(-1);
    const x = outward.x * radius;
    const z = outward.z * radius;

    const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerD), towerMat);
    tower.name = `SVR_PHASE84J_${slot.name}_BEHIND_WALL_AD_BUILDING`;
    tower.position.set(x, towerY, z);
    tower.lookAt(new THREE.Vector3(0, towerY, 0));
    tower.castShadow = false;
    tower.receiveShadow = false;
    tower.renderOrder = 32;
    group.add(tower);

    const accent = new THREE.Mesh(new THREE.PlaneGeometry(towerW * 0.86, towerH * 0.92), sideMat);
    accent.name = `SVR_PHASE84J_${slot.name}_AD_BUILDING_FACE`;
    accent.position.copy(tower.position).add(inward.clone().multiplyScalar(towerD * 0.5 + 0.025));
    accent.lookAt(new THREE.Vector3(0, accent.position.y, 0));
    accent.renderOrder = 33;
    group.add(accent);

    const ad = new THREE.Mesh(
      new THREE.PlaneGeometry(adW, adH),
      new THREE.MeshBasicMaterial({
        map: espressoTex,
        color: 0xffffff,
        transparent: false,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true
      })
    );
    ad.name = `SVR_ESPRESSO_WITH_CREAM_${slot.name}_BEHIND_WALL_AD`;
    ad.position.set(x, adY, z).add(inward.clone().multiplyScalar(towerD * 0.5 + 0.09));
    ad.lookAt(new THREE.Vector3(0, adY, 0));
    ad.renderOrder = 90;
    group.add(ad);

    const frameTop = new THREE.Mesh(new THREE.PlaneGeometry(adW + 0.55, 0.16), goldMat);
    frameTop.position.copy(ad.position).add(new THREE.Vector3(0, adH * 0.5 + 0.25, 0));
    frameTop.lookAt(new THREE.Vector3(0, frameTop.position.y, 0));
    frameTop.renderOrder = 91;
    group.add(frameTop);
    const frameBottom = frameTop.clone();
    frameBottom.position.copy(ad.position).add(new THREE.Vector3(0, -adH * 0.5 - 0.25, 0));
    group.add(frameBottom);
    const frameLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.16, adH + 0.66), goldMat);
    frameLeft.position.copy(ad.position).add(new THREE.Vector3(-adW * 0.5 - 0.25, 0, 0));
    frameLeft.lookAt(new THREE.Vector3(0, frameLeft.position.y, 0));
    frameLeft.renderOrder = 91;
    group.add(frameLeft);
    const frameRight = frameLeft.clone();
    frameRight.position.copy(ad.position).add(new THREE.Vector3(adW * 0.5 + 0.25, 0, 0));
    group.add(frameRight);

    const glow = new THREE.PointLight(0xffc15a, 0.9, 42, 2.0);
    glow.name = `SVR_PHASE84J_${slot.name}_ESPRESSO_AD_GLOW`;
    glow.position.copy(ad.position).add(inward.clone().multiplyScalar(1.4)).add(new THREE.Vector3(0, 1.4, 0));
    group.add(glow);
  });

  scene.add(group);
  return group;
}

export async function buildSkylineRoom(scene, { log = console.log } = {}){
  const R = CONFIG.ROOM_RADIUS;
  const H = CONFIG.WALL_HEIGHT;
  scene.fog = new THREE.FogExp2(0x010105, 0.00125);
  const hemi = new THREE.HemisphereLight(0xc7d6ec, 0x02040a, 0.50);
  scene.add(hemi);
  const key = new THREE.DirectionalLight(0xeaf1ff, 1.15);
  key.position.set(16, 28, 12);
  key.castShadow = false;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = -24;
  key.shadow.camera.right = 24;
  key.shadow.camera.top = 24;
  key.shadow.camera.bottom = -24;
  key.shadow.bias = -0.00002;
  key.shadow.normalBias = 0.035;
  scene.add(key);
  const tableSpot = new THREE.SpotLight(0xf0f4ff, 5.2, 120, Math.PI * 0.28, 0.22, 1.0);
  tableSpot.position.set(0, 15, 4);
  tableSpot.target.position.set(0, 0.8, 0);
  tableSpot.castShadow = false;
  scene.add(tableSpot);
  scene.add(tableSpot.target);
  const fill = new THREE.PointLight(0x7fafff, 1.2, 180, 1.9);
  fill.position.set(0, 10.2, 0);
  scene.add(fill);
  const rimLight = new THREE.PointLight(0x6d6cff, 1.8, 260, 1.8);
  rimLight.position.set(20, 18, -34);
  scene.add(rimLight);

  const floorTex = await loadFirstTexture(assetUrls("texture/slate_basecolor.jpg"), { colorSpace: THREE.SRGBColorSpace });
  const floorNormal = await loadFirstTexture(assetUrls("texture/slate_normal.png"));
  const floorRough = await loadFirstTexture(assetUrls("texture/slate_roughness.jpg"));
  [floorTex, floorNormal, floorRough].forEach(tex=>{ if (tex){ tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(64,64); tex.anisotropy = 4; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; } });
  const wallTex = await loadFirstTexture(assetUrls("texture/stonebrick_wall_basecolor.png"), { colorSpace: THREE.SRGBColorSpace });
  const wallNormal = await loadFirstTexture(assetUrls("texture/stonebrick_wall_normal.png"));
  const wallRough = await loadFirstTexture(assetUrls("texture/stonebrick_wall_roughness.png"));
  [wallTex, wallNormal, wallRough].forEach(tex=>{ if (tex){ tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(26,9); tex.anisotropy = 4; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; } });

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(R + 34, 220),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0.03,
      map: floorTex || null,
      normalMap: null,
      roughnessMap: null,
      polygonOffset: false
    })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = false;
  floor.renderOrder = -10;
  scene.add(floor);

  const wallHeight = H * 0.56;
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, wallHeight, 220, 1, true),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.84,
      metalness: 0.04,
      emissive: 0x143154,
      emissiveIntensity: 0.10,
      side: THREE.BackSide,
      map: wallTex || null,
      normalMap: null,
      normalScale: new THREE.Vector2(0, 0),
      roughnessMap: null
    })
  );
  wall.position.set(0, wallHeight / 2, 0);
  scene.add(wall);

  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(R - 1.2, 0.18, 16, 220),
    new THREE.MeshStandardMaterial({
      color: 0xb48cff,
      roughness: 0.2,
      metalness: 0.35,
      emissive: 0x2a0d3a,
      emissiveIntensity: 0.55
    })
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, wallHeight - 0.18, 0);
  scene.add(rim);

  const innerPlatform = null;

  const city = buildOuterCity(scene, R);
  const stars = buildStars(scene, R);
  const lobbySprites = buildLobbySprites(scene, R, wallHeight);
  const espressoAdGroup = addAlwaysVisibleEspressoAd(scene, R, wallHeight);
  const spawnLogoTex = await loadFirstTexture(assetUrls("ui/logo.png", "logo.png"), { colorSpace: THREE.SRGBColorSpace });
  const wallPanels = [];
  const wallPanelUpdaters = [];
  [
    { angle: -Math.PI * 0.5, kind: "main", title: "MAIN SPONSOR SCREEN", subtitle: "SCARLETT VR POKER", size: [9.4, wallHeight - 0.30], logo: [3.2, 3.2], y: wallHeight * 0.5 },
    { angle: Math.PI * 0.5, kind: "reserve", title: "LEAGUE WALL", subtitle: "SOUTH WALL", size: [6.8, wallHeight - 0.46], logo: [1.8, 1.8], y: wallHeight * 0.5 },
    { angle: 0, kind: "reiki", title: "REIKI TIME HUB", subtitle: "RED CARPET • PLANTS • ZEN STORE", size: [6.8, wallHeight - 0.46], logo: [1.8, 1.8], y: wallHeight * 0.5 },
    { angle: Math.PI, kind: "reserve", title: "LEGENDS", subtitle: "HALL OF FAME", size: [6.8, wallHeight - 0.46], logo: [1.8, 1.8], y: wallHeight * 0.5 }
  ].forEach(({ angle, kind, title, subtitle, size, logo, y })=>{
    const matrix = kind === "main" ? createMatrixBillboardTexture("main") : null;
    if (matrix) wallPanelUpdaters.push(matrix.update);
    const inward = new THREE.Vector3(-Math.cos(angle), 0, -Math.sin(angle));
    const rr = R - 0.38;
    const panelMat = new THREE.MeshBasicMaterial({
      map: matrix ? matrix.texture : null,
      transparent: false,
      side: THREE.DoubleSide,
      depthWrite: true,
      depthTest: true
    });
    if (!matrix) panelMat.color = new THREE.Color(0x040507);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(size[0], size[1]), panelMat);
    panel.position.set(Math.cos(angle) * rr, y, Math.sin(angle) * rr);
    panel.lookAt(0, y, 0);
    panel.renderOrder = 30;
    scene.add(panel);
    wallPanels.push(panel);
    if (spawnLogoTex){
      const logoMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(logo[0], logo[1]),
        new THREE.MeshBasicMaterial({
          map: spawnLogoTex,
          transparent: true,
          side: THREE.DoubleSide,
          depthWrite: false,
          depthTest: true
        })
      );
      logoMesh.position.copy(panel.position).addScaledVector(inward, 0.12).add(new THREE.Vector3(0, kind === "main" ? 1.85 : 1.25, 0));
      logoMesh.lookAt(0, y, 0);
      logoMesh.renderOrder = 31;
      scene.add(logoMesh);
      wallPanels.push(logoMesh);
      if (kind === "reiki"){
        const hubPlate = new THREE.Mesh(
          new THREE.PlaneGeometry(2.2, 0.54),
          new THREE.MeshBasicMaterial({
            map: createPlaqueTexture("reiki time hub", "scarlett vr poker"),
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            depthTest: true
          })
        );
        hubPlate.position.copy(logoMesh.position).add(new THREE.Vector3(0, -1.28, 0));
        hubPlate.lookAt(0, y, 0);
        hubPlate.renderOrder = 31;
        scene.add(hubPlate);
        wallPanels.push(hubPlate);
      }
    }
    const plateTex = createSponsorPlateTexture(title, subtitle);
    const plate = new THREE.Mesh(
      new THREE.PlaneGeometry(kind === "main" ? 5.4 : 4.5, 1.3),
      new THREE.MeshBasicMaterial({
        map: plateTex,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        depthTest: true
      })
    );
    plate.position.copy(panel.position).addScaledVector(inward, 0.14).add(new THREE.Vector3(0, -(size[1] * 0.33), 0));
    plate.lookAt(0, y, 0);
    plate.renderOrder = 31;
    scene.add(plate);
    wallPanels.push(plate);
  });

  // Legacy simple Reiki wall frame replaced by enhanced Reiki Time Hub storefront.

  const legendHall = buildAlignedLegendHall(scene, R, wallHeight, log);
  await populateLegendPedestals(legendHall, spawnLogoTex, log);
  const storeWall = buildStoreWall(scene, R, wallHeight, spawnLogoTex);
  addPgaHub(scene, { radius: R, wallHeight, log });
  const reikiHub = await addRikiArea(scene, R, wallHeight, spawnLogoTex, log);
  const scorpionRoom = addScorpionRoom(scene, R, wallHeight);
  const lobbyInfoBoards = addLobbyInfoBoards(scene, R, wallHeight);

  const moonTex = await loadFirstTexture(assetUrls("texture/moon_diffuse.png"), { colorSpace: THREE.SRGBColorSpace });
  const moonBump = await loadFirstTexture(assetUrls("texture/moon_bump.png"));
  const marsTex = await loadFirstTexture(assetUrls("texture/mars/diffuse_1k.jpg"), { colorSpace: THREE.SRGBColorSpace });
  const marsBump = await loadFirstTexture(assetUrls("texture/mars/bump_1k.jpg"));
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(9.4, 48, 48),
    new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.88,
      metalness: 0.0,
      map: makeEarthTexture(),
      emissive: 0x000000,
      emissiveIntensity: 0.0
    })
  );
  earth.position.set(0, wallHeight + 54.0, -(R + 140));
  earth.visible = false;
  earth.frustumCulled = false;
  earth.rotation.z = 0.24;
  earth.visible = false; earth.frustumCulled = false; scene.add(earth);
  earth.visible = false;
  const earthHalo = createOrbHaloSprite(0x6bc4ff, 0.0);
  earthHalo.scale.set(92, 92, 1);
  earthHalo.material.depthTest = false;
  earthHalo.visible = false;
  scene.add(earthHalo);
  earthHalo.visible = false;
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(5.6, 56, 56),
    new THREE.MeshStandardMaterial({
      color: 0xe9ebef,
      roughness: 0.99,
      metalness: 0.0,
      map: moonTex || null,
      bumpMap: moonBump || null,
      bumpScale: moonBump ? 0.94 : 0,
      emissive: 0x111820,
      emissiveIntensity: 0.0
    })
  );
  moon.position.set(-72, wallHeight + 126.0, -(R + 260.0));
  moon.frustumCulled = false;
  scene.add(moon);
  const moonHalo = createOrbHaloSprite(0xf4f7ff, 0.10);
  moonHalo.scale.set(44.0, 44.0, 1);
  moonHalo.material.depthTest = false;
  moonHalo.visible = true;
  scene.add(moonHalo);
  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(3.1, 44, 44),
    new THREE.MeshStandardMaterial({
      color: 0xc56b45,
      roughness: 0.82,
      metalness: 0.0,
      map: marsTex || null,
      bumpMap: marsBump || null,
      bumpScale: marsBump ? 0.42 : 0,
      emissive: 0x1c0904,
      emissiveIntensity: 0.0
    })
  );
  mars.position.set(96, wallHeight + 142.0, -(R + 310.0));
  mars.visible = true;
  mars.frustumCulled = false;
  mars.visible = true; mars.frustumCulled = false; scene.add(mars);
  mars.visible = true;
  const marsHalo = createOrbHaloSprite(0xff9b6b, 0.08);
  marsHalo.scale.set(28.0, 28.0, 1);
  marsHalo.material.depthTest = false;
  marsHalo.visible = true;
  scene.add(marsHalo);
  marsHalo.visible = true;
  const earthSpark = new THREE.Group();
  for (let i = 0; i < 8; i++){
    const spr = createOrbHaloSprite(i % 2 ? 0x79d8ff : 0xffffff, 0.40);
    spr.scale.setScalar(1.4 + (i % 3) * 0.5);
    spr.material.depthTest = false;
    earthSpark.add(spr);
  }
  earthSpark.visible = false;
  scene.add(earthSpark);
  const moonSpark = new THREE.Group();
  for (let i = 0; i < 6; i++){
    const spr = createOrbHaloSprite(i % 2 ? 0xfefefe : 0xbcd3ff, 0.34);
    spr.scale.setScalar(1.0 + (i % 3) * 0.45);
    spr.material.depthTest = false;
    moonSpark.add(spr);
  }
  moonSpark.visible = false;
  scene.add(moonSpark);
  const earthGlow = new THREE.PointLight(0x70c8ff, 0.0, 220, 1.8);
  scene.add(earthGlow);
  earthGlow.visible = false;
  const moonGlow = new THREE.PointLight(0xeaf2ff, 2.75, 560, 1.45);
  scene.add(moonGlow);
  const marsGlow = new THREE.PointLight(0xff9a72, 1.75, 420, 1.55);
  scene.add(marsGlow);
  marsGlow.visible = true;
  const skylineGlow = new THREE.PointLight(0x3b74ff, 4.8, 300, 1.7);
  skylineGlow.position.set(0, 34, -(R + 18));
  scene.add(skylineGlow);
  const accentGlow = new THREE.PointLight(0x92c2ff, 0.7, 70, 2.0);
  accentGlow.position.set(-9, 8, 7);
  scene.add(accentGlow);
  // Removed previous atmospheric overlay shells to keep the headset view clear.

  const chairTex = makeChairTexture();
  chairTex.repeat.set(2,2);
  const chairMat = new THREE.MeshStandardMaterial({ map: chairTex, color: 0xffffff, roughness: 0.62, metalness: 0.12, emissive: 0x12081a, emissiveIntensity: 0.10 });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x272a31, roughness: 0.35, metalness: 0.55, emissive: 0x0e1016, emissiveIntensity: 0.08 });
  const faceCenter = (x, z)=> Math.atan2(-x, -z);
  const seats = [
    makeSeat(scene, 0, -2.48, faceCenter(0, -2.48), "North Edge", chairMat, metalMat),
    makeSeat(scene, -2.28, -1.02, faceCenter(-2.28, -1.02), "Left Front", chairMat, metalMat),
    makeSeat(scene, -2.28, 1.02, faceCenter(-2.28, 1.02), "Left Back", chairMat, metalMat),
    makeSeat(scene, 0, 2.48, faceCenter(0, 2.48), "South Edge", chairMat, metalMat),
    makeSeat(scene, 2.28, -1.02, faceCenter(2.28, -1.02), "Right Front", chairMat, metalMat),
    makeSeat(scene, 2.28, 1.02, faceCenter(2.28, 1.02), "Right Back", chairMat, metalMat)
  ];

  const feltTex = await loadFirstTexture(assetUrls("texture/tablefelt.png"), { colorSpace: THREE.SRGBColorSpace });
  let tableTopY = 0.905;
  await createPreferredTable(scene, tableTopY, feltTex, log);
  if (spawnLogoTex){
    const tableLogoCarpet = new THREE.Mesh(
      new THREE.PlaneGeometry(4.5, 3.0),
      new THREE.MeshStandardMaterial({
        map: spawnLogoTex,
        color: 0xffffff,
        transparent: true,
        opacity: 0.86,
        roughness: 0.88,
        metalness: 0.02,
        emissive: 0x24061a,
        emissiveIntensity: 0.22,
        side: THREE.DoubleSide,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2
      })
    );
    tableLogoCarpet.rotation.x = -Math.PI * 0.5;
    tableLogoCarpet.position.set(0, 0.0035, 0);
    tableLogoCarpet.renderOrder = -4;
    scene.add(tableLogoCarpet);

    const carpetGlow = new THREE.Mesh(
      new THREE.CircleGeometry(2.6, 48),
      new THREE.MeshBasicMaterial({ color: 0x7a1230, transparent: true, opacity: 0.22, depthWrite: false })
    );
    carpetGlow.rotation.x = -Math.PI * 0.5;
    carpetGlow.position.set(0, 0.0024, 0);
    carpetGlow.renderOrder = -6;
    scene.add(carpetGlow);
  }
  const tableShadow = new THREE.Mesh(
    new THREE.CircleGeometry(2.55, 48),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.16, depthWrite: false })
  );
  tableShadow.rotation.x = -Math.PI / 2;
  tableShadow.position.y = 0.002;
  tableShadow.renderOrder = -5;
  scene.add(tableShadow);
  const tableAccentA = new THREE.PointLight(0xb48cff, 1.8, 16, 2.0);
  tableAccentA.position.set(-1.2, tableTopY + 0.6, 0.4);
  scene.add(tableAccentA);
  const tableAccentB = new THREE.PointLight(0x7bd5ff, 1.6, 16, 2.0);
  tableAccentB.position.set(1.2, tableTopY + 0.6, -0.4);
  scene.add(tableAccentB);
  addChipsAndCards(scene, tableTopY);
  const dealerSource = new THREE.Vector3(0, tableTopY + 0.34, -0.96);
  const pokerDemo = createPokerDemo({ scene, seats, chairRings: seats.map(s=>s.ring), tableTopY, statusCb: (text)=> scene.userData._pokerStatus = text, log });

  let dealerActor = null;
  let dealerAnchor = null;
  let dealerMixer = null;
  let dealerPose = null;
  const ericTex = await loadFirstTexture(assetUrls("models/eric/rp_eric_rigged_001_dif.jpg"), { colorSpace: THREE.SRGBColorSpace });
  const ericNorm = await loadFirstTexture(assetUrls("models/eric/rp_eric_rigged_001_norm.jpg"));
  const dealerBase = await tryLoadFBX(assetUrls("models/eric/eric.fbx"), log, 14000);
  const dealerIdle = await tryLoadFBX(assetUrls("models/anims/eric_idle.fbx"), log, 14000);
  if (dealerBase){
    dealerActor = dealerBase;
    applyEricMaterial(dealerActor, ericTex, ericNorm);
    orientCharacterUpright(dealerActor);
    dealerActor.rotation.x = 0;
    dealerActor.rotation.z = 0;
    scaleToHeight(dealerActor, 1.82);
    dropToGround(dealerActor);
    const eb = boxSize(dealerActor).box;
    dealerActor.position.set(0, -eb.min.y + 0.001, 0);
    dealerAnchor = new THREE.Group();
    dealerAnchor.position.set(0.04, 0.02, -1.96);
    dealerAnchor.add(dealerActor);
    dealerAnchor.lookAt(new THREE.Vector3(0, 1.02, 0.06));
    scene.add(dealerAnchor);
    dealerPose = { leftArm: [], rightArm: [], leftFore: [], rightFore: [], leftHand: [], rightHand: [], spine: [], shoulder: [] };
    dealerActor.traverse((obj)=>{
      if (!obj.isBone) return;
      const n = String(obj.name || '').toLowerCase();
      const left = /(left|\bl\b|_l\b|\.l\b|arm_l|hand_l|forearm_l|larm|lhand|lforearm)/.test(n);
      const right = /(right|\br\b|_r\b|\.r\b|arm_r|hand_r|forearm_r|rarm|rhand|rforearm)/.test(n);
      if (/spine|chest|hips/.test(n)) dealerPose.spine.push(obj);
      if (/shoulder|clavicle/.test(n)) dealerPose.shoulder.push(obj);
      if (/forearm|lowerarm/.test(n)){ if (left) dealerPose.leftFore.push(obj); if (right) dealerPose.rightFore.push(obj); }
      else if (/hand/.test(n)){ if (left) dealerPose.leftHand.push(obj); if (right) dealerPose.rightHand.push(obj); }
      else if (/upperarm|arm/.test(n)){ if (left) dealerPose.leftArm.push(obj); if (right) dealerPose.rightArm.push(obj); }
    });
    if (dealerIdle?.animations?.length){
      dealerMixer = new THREE.AnimationMixer(dealerActor);
      const action = dealerMixer.clipAction(dealerIdle.animations[0]);
      action.setLoop(THREE.LoopRepeat, Infinity);
      action.fadeIn(0.35).play();
    }
  }

  const seatedBots = [];
  const seatedBotBase = await tryLoadFBX(assetUrls("models/bots/male_sitting_pose.fbx"), log, 12000);
  if (seatedBotBase){
    applyEricMaterial(seatedBotBase, ericTex, ericNorm);
    orientCharacterUpright(seatedBotBase);
    scaleToHeight(seatedBotBase, 1.78);
    dropToGround(seatedBotBase);
    const bb = boxSize(seatedBotBase).box;
    seatedBotBase.position.set(0, -bb.min.y + 0.001, 0);
    const botSeatIndices = [0, 1, 2, 4, 5];
    const botTints = [0xffffff, 0xfff4ea, 0xeaf3ff, 0xf6eaff, 0xeefff8];
    botSeatIndices.forEach((seatIdx, idx)=>{
      const seat = seats[seatIdx];
      const bot = idx === 0 ? seatedBotBase : SkeletonUtils.clone(seatedBotBase);
      const pose = { leftArm: [], rightArm: [], leftFore: [], rightFore: [], leftHand: [], rightHand: [], spine: [] };
      bot.traverse((child)=>{
        if (child.isMesh && !Array.isArray(child.material) && child.material){
          child.material = child.material.clone();
          child.material.color.multiply(new THREE.Color(botTints[idx % botTints.length]));
          child.material.emissiveIntensity = 0.04;
          child.frustumCulled = false;
        }
        if (!child.isBone) return;
        const n = String(child.name || '').toLowerCase();
        const left = /(left|\bl\b|_l\b|\.l\b|arm_l|hand_l|forearm_l|larm|lhand|lforearm)/.test(n);
        const right = /(right|\br\b|_r\b|\.r\b|arm_r|hand_r|forearm_r|rarm|rhand|rforearm)/.test(n);
        if (/spine|chest|hips/.test(n)) pose.spine.push(child);
        if (/forearm|lowerarm/.test(n)){ if (left) pose.leftFore.push(child); if (right) pose.rightFore.push(child); }
        else if (/hand/.test(n)){ if (left) pose.leftHand.push(child); if (right) pose.rightHand.push(child); }
        else if (/upperarm|arm/.test(n)){ if (left) pose.leftArm.push(child); if (right) pose.rightArm.push(child); }
      });
      const anchor = new THREE.Group();
      const inward = new THREE.Vector3(-seat.x, 0, -seat.z).normalize();
      anchor.position.set(seat.x * 0.95 + inward.x * 0.10, 0.02, seat.z * 0.95 + inward.z * 0.10);
      anchor.add(bot);
      scene.add(anchor);
      seatedBots.push({ anchor, bot, seatIdx, phase: idx * 0.75, pose });
    });
  }


  scene.userData._tickWorld = (dt)=>{
    scene.userData._time = (scene.userData._time || 0) + dt;
    const t = scene.userData._time;
    pokerDemo.update(t, dt);
    earth.visible = false;
    earth.rotation.y += dt * 0.05;
    earth.rotation.z = 0.02;
    const cityOrbit = t * 0.012;
    const cityRadius = R + 112.0;
    earth.position.set(
      Math.cos(cityOrbit) * (cityRadius * 0.14),
      wallHeight + 72.0 + Math.sin(t * 0.018) * 0.22,
      -(cityRadius * 1.18) + Math.sin(cityOrbit) * 16.0
    );
    // PHASE-84C: high skyline moon, clear above all banner buildings from player POV.
    moon.position.set(
      -72 + Math.sin(t * 0.016) * 7.0,
      wallHeight + 126.0 + Math.sin(t * 0.050) * 2.0,
      -(R + 260.0) + Math.cos(t * 0.010) * 10.0
    );
    moon.rotation.y += dt * 0.08;
    moon.rotation.z = 0.03;
    // PHASE-84C: Mars stays high and offset from the moon, never at building height.
    mars.position.set(
      96 + Math.sin(t * 0.013 + 1.4) * 8.0,
      wallHeight + 142.0 + Math.sin(t * 0.045 + 0.8) * 1.8,
      -(R + 310.0) + Math.cos(t * 0.009 + 0.4) * 9.0
    );
    mars.visible = true;
    mars.rotation.y += dt * 0.06;
    mars.rotation.z = 0.04;
    moonGlow.position.copy(moon.position);
    moonHalo.position.copy(moon.position);
    moonHalo.material.opacity = 0.045 + 0.010 * (0.5 + 0.5 * Math.sin(t * 0.24));
    marsGlow.position.copy(mars.position);
    marsHalo.position.copy(mars.position);
    marsHalo.material.opacity = 0.026 + 0.010 * (0.5 + 0.5 * Math.sin(t * 0.28));
    if (lobbySprites){
      const tiny = lobbySprites.userData?.tiny || null;
      lobbySprites.children.forEach((spr, i)=>{
        if (!spr || spr === tiny || !spr.isSprite) return;
        spr.position.y = (spr.userData.baseY || spr.position.y) + Math.sin(t * 0.65 + (spr.userData.phase || 0)) * 0.10;
        if (spr.material && 'opacity' in spr.material) spr.material.opacity = 0.18 + 0.05 * (0.5 + 0.5 * Math.sin(t * 0.45 + i));
      });
      if (tiny?.children){
        tiny.children.forEach((spr, i)=>{
          if (!spr || !spr.isSprite) return;
          spr.position.y += (spr.userData.rise || 0.06) * dt;
          spr.position.x = Math.cos((spr.userData.angle || 0) + t * 0.04) * (spr.userData.radius || 1);
          spr.position.z = Math.sin((spr.userData.angle || 0) + t * 0.04) * (spr.userData.radius || 1);
          if (spr.position.y > wallHeight + 6) spr.position.y = 0.20;
          if (spr.material && 'opacity' in spr.material) spr.material.opacity = 0.05 + 0.03 * (0.5 + 0.5 * Math.sin(t * 0.42 + i));
        });
      }
      const snow = lobbySprites.userData?.snow || null;
      if (snow?.children){
        snow.children.forEach((spr, i)=>{
          if (!spr || !spr.isSprite) return;
          const a = (spr.userData.angle || 0) + t * (0.03 + (i % 5) * 0.002);
          spr.position.y += (spr.userData.rise || 0.09) * dt;
          spr.position.x = Math.cos(a) * (spr.userData.radius || 1) + Math.sin(t * 0.9 + i) * (spr.userData.wobble || 0.05);
          spr.position.z = Math.sin(a) * (spr.userData.radius || 1) + Math.cos(t * 0.8 + i) * (spr.userData.wobble || 0.05);
          if (spr.position.y > wallHeight + 5.2) spr.position.y = 0.16;
          if (spr.material && 'opacity' in spr.material) spr.material.opacity = 0.05 + 0.04 * (0.5 + 0.5 * Math.sin(t * 0.36 + i));
        });
      }
      lobbySprites.rotation.y += dt * 0.005;
    }
    if (earthSpark.visible) earthSpark.children.forEach((spr, i)=>{
      const a = i * ((Math.PI * 2) / Math.max(1, earthSpark.children.length));
      spr.position.set(
        earth.position.x + Math.cos(a) * (12.0 + (i % 2) * 0.4),
        earth.position.y + Math.sin(a * 1.5) * 1.1,
        earth.position.z + Math.sin(a) * (10.5 + (i % 2) * 0.4)
      );
    });
    if (moonSpark.visible) moonSpark.children.forEach((spr, i)=>{
      const a = i * ((Math.PI * 2) / Math.max(1, moonSpark.children.length));
      spr.position.set(
        moon.position.x + Math.cos(a) * (5.7 + (i % 2) * 0.3),
        moon.position.y + Math.sin(a * 1.4) * 0.9,
        moon.position.z + Math.sin(a) * (5.0 + (i % 2) * 0.3)
      );
    });
    rim.material.emissiveIntensity = 0.18;
    seats.forEach((seat)=>{ seat.ring.material.opacity = 0.60; });
    stars.spriteGroup.rotation.y += dt * 0.00018;
    stars.pts.material.opacity = 0.82;
    if (lobbyInfoBoards?.length) lobbyInfoBoards.forEach((rec, idx)=>{ const bob = Math.sin(t * 1.2 + rec.phase) * 0.04; rec.board.position.y = 1.72 + bob; rec.glow.position.y = rec.board.position.y; rec.glow.material.opacity = 0.10 + 0.06 * (0.5 + 0.5 * Math.sin(t * 1.4 + idx)); });
    city.billboardUpdaters.forEach(fn=>fn(t));
    tickPgaHub(scene, t);
    wallPanelUpdaters.forEach(fn=>fn(t));
    legendHall.holoGroups.forEach((holo, i)=>{
      const core = holo.userData.core;
      if (core){
        core.rotation.y += dt * (0.35 + i * 0.08);
        core.rotation.x = Math.sin(t * 0.7 + i) * 0.08;
        holo.position.y = 1.2 + Math.sin(t * 1.2 + i * 0.8) * 0.05;
      }
    });
    legendHall.displayUpdaters?.forEach((fn)=>fn(t, dt));
    legendHall.displayRoots?.forEach((root, idx)=>{ if (root && !root.userData?.manualSpin) root.rotation.y += dt * (idx % 2 ? -0.04 : 0.04); });
    if (dealerMixer) dealerMixer.update(dt);
    seatedBots.forEach((rec)=>{
      const seat = seats[rec.seatIdx];
      const inward = new THREE.Vector3(-seat.x, 0, -seat.z).normalize();
      rec.anchor.position.set(seat.x * 0.95 + inward.x * 0.10, 0.02 + Math.sin(t * 1.1 + rec.phase) * 0.005, seat.z * 0.95 + inward.z * 0.10);
      const cam = scene.userData?._camera;
      if (cam) rec.anchor.lookAt(new THREE.Vector3(cam.position.x, 1.10, cam.position.z));
      else rec.anchor.lookAt(new THREE.Vector3(0, 1.02, 0));
      if (rec.pose){
        rec.pose.spine.forEach((bone, i)=>{ bone.rotation.x = -0.08 + Math.sin(t * 0.7 + i * 0.2) * 0.02; bone.rotation.y = 0; bone.rotation.z = 0; });
        rec.pose.leftArm.forEach((bone)=>{ bone.rotation.x = -2.2; bone.rotation.y = -0.12; bone.rotation.z = 0.25; });
        rec.pose.rightArm.forEach((bone)=>{ bone.rotation.x = -2.2; bone.rotation.y = 0.12; bone.rotation.z = -0.25; });
        rec.pose.leftFore.forEach((bone)=>{ bone.rotation.x = -0.18; bone.rotation.y = 0.0; bone.rotation.z = 0.06; });
        rec.pose.rightFore.forEach((bone)=>{ bone.rotation.x = -0.18; bone.rotation.y = 0.0; bone.rotation.z = -0.06; });
        rec.pose.leftHand.forEach((bone)=>{ bone.rotation.x = 0.18; bone.rotation.y = 0.0; bone.rotation.z = 0.0; });
        rec.pose.rightHand.forEach((bone)=>{ bone.rotation.x = 0.18; bone.rotation.y = 0.0; bone.rotation.z = 0.0; });
      }
      rec.bot.rotation.y = 0;
    });
    if (dealerAnchor && dealerActor){
      dealerActor.position.y = Math.max(dealerActor.position.y, 0.002);
      dealerAnchor.position.set(0.04, 0.02, -1.96);
      dealerAnchor.lookAt(new THREE.Vector3(0, 1.02, 0.08));
      dealerAnchor.rotation.z = 0;
      dealerAnchor.rotation.x = 0;
      dealerActor.rotation.x = 0;
      dealerActor.rotation.z = 0;
      dealerActor.position.x = 0;
      dealerActor.position.z = 0;
      const dealerSwing = Math.sin(t * 1.8) * 0.16;
      dealerSource.set(0.22 + dealerSwing * 0.08, tableTopY + 0.18 + Math.abs(Math.sin(t * 1.8)) * 0.01, -1.08 + Math.cos(t * 1.8) * 0.02);
      if (dealerPose){
        dealerPose.spine.forEach((bone, i)=>{
          bone.rotation.x = 0.02 + Math.sin(t * 0.9 + i * 0.2) * 0.008;
          bone.rotation.y = Math.sin(t * 0.7 + i * 0.2) * 0.03;
          bone.rotation.z = 0.0;
        });
        dealerPose.shoulder.forEach((bone, i)=>{
          bone.rotation.x = -0.02;
          bone.rotation.y = Math.sin(t * 1.2 + i) * 0.015;
          bone.rotation.z = 0.0;
        });
        dealerPose.leftArm.forEach((bone)=>{ bone.rotation.x = -0.08; bone.rotation.y = 0.02; bone.rotation.z = 0.10; });
        dealerPose.leftFore.forEach((bone)=>{ bone.rotation.x = -0.34; bone.rotation.y = 0.0; bone.rotation.z = 0.08; });
        dealerPose.leftHand.forEach((bone)=>{ bone.rotation.x = 0.04; bone.rotation.y = 0.0; bone.rotation.z = 0.0; });
        dealerPose.rightArm.forEach((bone)=>{ bone.rotation.x = -0.14; bone.rotation.y = -0.12; bone.rotation.z = -0.18 + dealerSwing * 0.10; });
        dealerPose.rightFore.forEach((bone)=>{ bone.rotation.x = -0.82; bone.rotation.y = 0.0; bone.rotation.z = 0.10 - dealerSwing * 0.12; });
        dealerPose.rightHand.forEach((bone)=>{ bone.rotation.x = 0.22; bone.rotation.y = 0.06; bone.rotation.z = 0.0; });
      }
    }
  };

  const sceneTargets = {
    lobby: { pos: new THREE.Vector3(0, 0, 4.8), look: new THREE.Vector3(0, 1.15, 0) },
    table: { pos: new THREE.Vector3(0, 0, 3.2), look: new THREE.Vector3(0, 1.05, 0) },
    seat: seats[3] ? { pos: new THREE.Vector3(seats[3].x, 0, seats[3].z), look: new THREE.Vector3(0, 1.0, 0) } : null,
    reiki: reikiHub ? { pos: reikiHub.target.clone(), look: reikiHub.look.clone() } : null,
    reikiRoom: reikiHub ? { pos: reikiHub.roomTarget.clone(), look: reikiHub.center.clone() } : null,
    pga: scene.userData._pgaHub ? {
      pos: scene.userData._pgaHub.group.position.clone().add(scene.userData._pgaHub.inward.clone().multiplyScalar(3.2)).setY(0),
      look: scene.userData._pgaHub.group.position.clone().setY(1.8)
    } : null,
    pgaWall: scene.userData._pgaHub ? {
      pos: scene.userData._pgaHub.group.position.clone().add(scene.userData._pgaHub.inward.clone().multiplyScalar(2.2)).add(new THREE.Vector3(0,0,0.5)).setY(0),
      look: scene.userData._pgaHub.group.position.clone().setY(1.8)
    } : null,
    legends: {
      pos: new THREE.Vector3(legendHall.group.position.x * 0.82, 0, legendHall.group.position.z * 0.82),
      look: legendHall.group.position.clone().setY(1.8)
    },
    sponsor: {
      pos: new THREE.Vector3(storeWall.group.position.x * 0.86, 0, storeWall.group.position.z * 0.86),
      look: storeWall.group.position.clone().setY(1.6)
    },
    scorpion: scorpionRoom ? { pos: scorpionRoom.target.clone(), look: scorpionRoom.look.clone() } : null
  };

  return {
    roomClamp: R - 2.5,
    tableCenter: new THREE.Vector3(0, 0, 0),
    seats,
    joinRadius: 6.3,
    previewOrbitRadius: 12.8,
    sceneTargets
  };
}
