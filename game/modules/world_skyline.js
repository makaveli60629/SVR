import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { FBXLoader } from "three/addons/loaders/FBXLoader.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { CONFIG } from "./config.js";
import { assetUrls, loadFirstTexture } from "./asset_base.js";
import { createPokerDemo } from "./poker_demo.js";
import { addPgaHub, tickPgaHub } from "./hubs/pga_hub.js";

// PHASE-173.2 DIRECT BOOT FIX: createMatrixBillboardTexture is local and hoisted before skyline build.
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


// Phase 173.1 boot hotfix helpers: these texture/sprite builders are intentionally
// local to world_skyline.js so the skyline can boot without relying on optional globals.
function createPlaqueTexture(title = "SVR", subtitle = ""){
  return canvasTexture(1024, 512, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#080612");
    g.addColorStop(0.58,"#17091f");
    g.addColorStop(1,"#05070e");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "rgba(210,125,255,0.92)";
    ctx.lineWidth = 18;
    ctx.strokeRect(28,28,w-56,h-56);
    ctx.strokeStyle = "rgba(120,220,255,0.28)";
    ctx.lineWidth = 6;
    ctx.strokeRect(54,54,w-108,h-108);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#fff7ff";
    ctx.font = "800 72px Arial, Helvetica, sans-serif";
    ctx.fillText(String(title || "SVR").toUpperCase(), w/2, h*0.43);
    ctx.fillStyle = "#dcb7ff";
    ctx.font = "700 38px Arial, Helvetica, sans-serif";
    ctx.fillText(String(subtitle || "").toUpperCase(), w/2, h*0.62);
  });
}

function createSponsorPlateTexture(title = "SPONSOR SLOT", subtitle = "AWAITING APPROVAL"){
  return canvasTexture(1024, 512, (ctx,w,h)=>{
    ctx.fillStyle = "#07070d";
    ctx.fillRect(0,0,w,h);
    const g = ctx.createRadialGradient(w/2,h/2,40,w/2,h/2,w*0.62);
    g.addColorStop(0,"rgba(255,255,255,0.18)");
    g.addColorStop(0.45,"rgba(185,90,255,0.20)");
    g.addColorStop(1,"rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "rgba(255,60,60,0.95)";
    ctx.lineWidth = 20;
    ctx.strokeRect(32,32,w-64,h-64);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 70px Arial, Helvetica, sans-serif";
    ctx.fillText(String(title || "SPONSOR SLOT").toUpperCase(), w/2, h*0.43);
    ctx.fillStyle = "#ffb4b4";
    ctx.font = "800 42px Arial, Helvetica, sans-serif";
    ctx.fillText(String(subtitle || "AWAITING APPROVAL").toUpperCase(), w/2, h*0.62);
  });
}

function createStoreDisplayTexture(){
  return canvasTexture(1400, 900, (ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#05070d");
    g.addColorStop(0.48,"#13061f");
    g.addColorStop(1,"#05070d");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "rgba(185,90,255,0.96)";
    ctx.lineWidth = 24;
    ctx.strokeRect(36,36,w-72,h-72);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 94px Arial, Helvetica, sans-serif";
    ctx.fillText("SVR STORE", w/2, 190);
    ctx.fillStyle = "#dcb7ff";
    ctx.font = "700 46px Arial, Helvetica, sans-serif";
    ctx.fillText("VR-FRIENDLY WEB PORTAL", w/2, 280);
    ctx.fillStyle = "#9fe8ff";
    ctx.font = "700 40px Arial, Helvetica, sans-serif";
    ["Watches", "Gloves", "Avatar Gear", "Sponsor Items"].forEach((line,i)=>{
      ctx.fillText(line, w/2, 420 + i*82);
    });
    ctx.fillStyle = "#fff2ff";
    ctx.font = "800 34px Arial, Helvetica, sans-serif";
    ctx.fillText("svrpoker.com/site/store.html", w/2, h-110);
  });
}

function createAdBillboardTexture(lines = ["SVRPOKER.COM", "ALL IN"]){
  const safeLines = Array.isArray(lines) && lines.length ? lines : [String(lines || "SVRPOKER.COM")];
  return canvasTexture(1400, 620, (ctx,w,h)=>{
    ctx.fillStyle = "#06070c";
    ctx.fillRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,w,0);
    g.addColorStop(0,"rgba(185,90,255,0.18)");
    g.addColorStop(0.5,"rgba(120,220,255,0.24)");
    g.addColorStop(1,"rgba(185,90,255,0.18)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "rgba(255,255,255,0.80)";
    ctx.lineWidth = 14;
    ctx.strokeRect(28,28,w-56,h-56);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    safeLines.slice(0,4).forEach((line,i)=>{
      ctx.fillStyle = i === 0 ? "#ffffff" : "#dcb7ff";
      ctx.font = i === 0 ? "900 86px Arial, Helvetica, sans-serif" : "800 58px Arial, Helvetica, sans-serif";
      ctx.fillText(String(line).toUpperCase(), w/2, 190 + i*96);
    });
  });
}

function createMatrixBillboardTexture(kind = "outer"){
  const width = 1024;
  const height = kind === "main" ? 1024 : 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 8;
  let frame = 0;
  const columns = 46;
  const drops = Array.from({ length: columns }, (_,i)=> (i * 17) % height);
  function paint(){
    frame++;
    ctx.fillStyle = "rgba(2,3,8,0.98)";
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = "rgba(185,90,255,0.22)";
    ctx.fillRect(0,0,width,height);
    ctx.font = "700 24px monospace";
    ctx.textAlign = "center";
    for (let i=0;i<columns;i++){
      const x = (i + 0.5) * (width / columns);
      for (let j=0;j<12;j++){
        const y = (drops[i] + j*34) % height;
        const alpha = Math.max(0.08, 0.88 - j*0.07);
        ctx.fillStyle = `rgba(218,180,255,${alpha})`;
        ctx.fillText(Math.random() > 0.5 ? "1" : "0", x, y);
      }
      drops[i] = (drops[i] + 4 + (i % 3)) % height;
    }
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.font = kind === "main" ? "900 92px Arial, Helvetica, sans-serif" : "900 60px Arial, Helvetica, sans-serif";
    ctx.fillText(kind === "main" ? "SVR POKER" : "SVR", width/2, height*0.42);
    ctx.fillStyle = "rgba(230,194,255,0.92)";
    ctx.font = kind === "main" ? "800 42px Arial, Helvetica, sans-serif" : "800 34px Arial, Helvetica, sans-serif";
    ctx.fillText(kind === "main" ? "PLAY MONEY • SOCIAL VR • COMMUNITY" : "ALL IN", width/2, height*0.56);
    texture.needsUpdate = true;
  }
  paint();
  return {
    texture,
    update(){
      if (frame % 2 === 0) paint();
      else frame++;
    }
  };
}

function createOrbHaloSprite(color = 0xffffff, extraOpacity = 0){
  const tex = canvasTexture(256, 256, (ctx,w,h)=>{
    const g = ctx.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2);
    g.addColorStop(0,"rgba(255,255,255,0.88)");
    g.addColorStop(0.22,"rgba(255,255,255,0.32)");
    g.addColorStop(1,"rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);
  });
  const mat = new THREE.SpriteMaterial({
    map: tex,
    color,
    transparent: true,
    opacity: Math.min(0.85, 0.36 + Math.max(0, extraOpacity || 0)),
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending
  });
  return new THREE.Sprite(mat);
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

  const group = new THREE.Group();
  group.position.copy(center);
  group.lookAt(group.position.clone().add(inward));
  scene.add(group);

  const floorMat = new THREE.MeshStandardMaterial({ color: 0x101018, roughness: 0.92, metalness: 0.04, emissive: 0x1e0a14, emissiveIntensity: 0.18, side: THREE.DoubleSide });
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x97fff2, transparent: true, opacity: 0.10, roughness: 0.05, metalness: 0.18, emissive: 0x1a7066, emissiveIntensity: 0.24, side: THREE.DoubleSide });
  const trimMat = new THREE.MeshStandardMaterial({ color: 0xff3b54, roughness: 0.24, metalness: 0.44, emissive: 0x9b0b20, emissiveIntensity: 0.75 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x080a0f, roughness: 0.78, metalness: 0.12, emissive: 0x090612, emissiveIntensity: 0.18 });

  const pad = new THREE.Mesh(new THREE.PlaneGeometry(13.2, 6.6), floorMat);
  pad.rotation.x = -Math.PI * 0.5;
  pad.position.set(0, 0.005, -0.38);
  group.add(pad);

  const rearWall = new THREE.Mesh(new THREE.BoxGeometry(12.6, 5.8, 0.18), darkMat);
  rearWall.position.set(0, 2.9, -2.18);
  group.add(rearWall);

  const header = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.20, 0.24), trimMat);
  header.position.set(0, 5.42, 0.58);
  group.add(header);
  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(0.18, 5.1, 0.24), trimMat);
  leftPost.position.set(-6.34, 2.55, 0.58);
  group.add(leftPost);
  const rightPost = leftPost.clone();
  rightPost.position.x = 6.34;
  group.add(rightPost);

  const glassL = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.72), glassMat);
  glassL.position.set(-4.12, 2.38, 0.64);
  group.add(glassL);
  const glassR = glassL.clone();
  glassR.position.x = 4.12;
  group.add(glassR);

  const signTex = canvasTexture(1400, 300, (x,w,h)=>{
    const g = x.createLinearGradient(0,0,w,h); g.addColorStop(0, '#11040a'); g.addColorStop(1, '#0b1018');
    x.fillStyle = g; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,70,92,0.95)'; x.lineWidth = 12; x.strokeRect(18,18,w-36,h-36);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = '#ffffff'; x.font = 'bold 94px system-ui, Arial'; x.fillText('REIKI HUB', w/2, 106);
    x.fillStyle = '#ffb7c3'; x.font = 'bold 42px system-ui, Arial'; x.fillText('AWAITING APPROVAL', w/2, 206);
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(7.4, 1.15), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  sign.position.set(0, 4.72, 0.70);
  group.add(sign);

  const infoTex = canvasTexture(1100, 950, (x,w,h)=>{
    x.fillStyle = '#080a10'; x.fillRect(0,0,w,h);
    x.strokeStyle = 'rgba(255,70,92,0.95)'; x.lineWidth = 12; x.strokeRect(22,22,w-44,h-44);
    x.textAlign = 'center';
    x.fillStyle = '#ffffff'; x.font = 'bold 58px system-ui, Arial'; x.fillText('SVR WELLNESS PORTAL', w/2, 112);
    x.fillStyle = '#ffb7c3'; x.font = 'bold 42px system-ui, Arial'; x.fillText('SPONSOR DETAILS PENDING', w/2, 192);
    x.fillStyle = '#f0efff'; x.font = '34px system-ui, Arial';
    const lines = ['No external Reiki branding is active.', 'No founder photos or outside websites are shown.', 'This storefront remains modular and approval-safe.', 'Use this portal for the future private meditation scene.'];
    let y = 306;
    lines.forEach(line => { x.fillText(line, w/2, y); y += 74; });
    x.fillStyle = '#ff4d68'; x.font = 'bold 52px system-ui, Arial'; x.fillText('AWAITING APPROVAL', w/2, 780);
  });
  const info = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.8), new THREE.MeshBasicMaterial({ map: infoTex, transparent: true, side: THREE.DoubleSide }));
  info.position.set(0, 2.35, -2.05);
  group.add(info);

  if (spawnLogoTex){
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshBasicMaterial({ map: spawnLogoTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    logo.position.set(0, 3.55, 0.74);
    group.add(logo);
  }

  const portalRing = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.035, 10, 80), new THREE.MeshBasicMaterial({ color: 0xff4d68, transparent: true, opacity: 0.82 }));
  portalRing.rotation.x = Math.PI * 0.5;
  portalRing.position.set(0, 0.055, 1.35);
  group.add(portalRing);

  const glow = new THREE.PointLight(0xff4d68, 4.8, 18, 2.0);
  glow.position.set(0, 2.6, 0.1);
  group.add(glow);

  const target = center.clone().addScaledVector(inward, 3.35).setY(0);
  const roomTarget = center.clone().addScaledVector(inward, 5.6).setY(0);
  const look = center.clone().setY(1.65);
  return { group, holoGroups: [], center: center.clone(), target, roomTarget, look };
}

// Phase 173.4 boot hotfix: local Legend Hall builder.
// Some restored skyline branches call buildLegendHall() but did not carry the helper.
// Keep this lightweight and procedural so the world can boot even if optional Legend GLBs fail.
function buildLegendHall(scene, R, wallHeight, log = console.log){
  const group = new THREE.Group();
  group.name = "SVR_Legend_Hall";
  const holoGroups = [];
  const displayRoots = [];
  const displayUpdaters = [];

  const baseMat = new THREE.MeshStandardMaterial({ color: 0x090814, roughness: 0.74, metalness: 0.18, emissive: 0x12051f, emissiveIntensity: 0.22 });
  const trimMat = new THREE.MeshBasicMaterial({ color: 0xb95aff, transparent: true, opacity: 0.82 });
  const glassMat = new THREE.MeshBasicMaterial({ color: 0x8fdcff, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });

  const floor = new THREE.Mesh(new THREE.BoxGeometry(8.4, 0.08, 4.4), baseMat);
  floor.position.set(0, 0.04, 0);
  group.add(floor);

  const back = new THREE.Mesh(new THREE.BoxGeometry(8.4, 3.8, 0.12), baseMat.clone());
  back.position.set(0, 1.94, -2.14);
  group.add(back);

  const signTex = createPlaqueTexture("LEGEND HALL", "SVR FEATURE SHOWCASE");
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5.9, 1.12), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  sign.position.set(0, 3.58, -2.215);
  group.add(sign);

  const infoTex = createAdBillboardTexture(["SVR LEGENDS", "PLAYER HISTORY", "REPLAYS", "COMING SOON"]);
  const info = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 2.18), new THREE.MeshBasicMaterial({ map: infoTex, side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  info.position.set(0, 1.82, -2.225);
  group.add(info);

  for (let i = -1; i <= 1; i++){
    const x = i * 2.55;
    const podium = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.68, 0.32, 28), new THREE.MeshStandardMaterial({ color: 0x181021, roughness: 0.66, metalness: 0.18, emissive: 0x1b0730, emissiveIntensity: 0.20 }));
    podium.position.set(x, 0.20, 0.42);
    group.add(podium);

    const holo = new THREE.Group();
    holo.position.set(x, 1.20, 0.42);
    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 1), new THREE.MeshBasicMaterial({ color: i === 0 ? 0xffffff : 0xdcb7ff, transparent: true, opacity: 0.72, wireframe: true }));
    core.userData.phase = i;
    holo.userData.core = core;
    holo.add(core);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.012, 8, 60), trimMat.clone());
    ring.rotation.x = Math.PI * 0.5;
    holo.add(ring);
    group.add(holo);
    holoGroups.push(holo);
  }

  const rail = new THREE.Mesh(new THREE.BoxGeometry(8.0, 0.035, 0.035), trimMat.clone());
  rail.position.set(0, 0.84, 1.96);
  group.add(rail);

  const glass = new THREE.Mesh(new THREE.PlaneGeometry(8.0, 2.7), glassMat);
  glass.position.set(0, 1.72, 2.01);
  group.add(glass);

  const glow = new THREE.PointLight(0xb95aff, 3.6, 16, 2.0);
  glow.position.set(0, 2.4, 0.8);
  group.add(glow);

  scene.add(group);
  return { group, holoGroups, displayRoots, displayUpdaters };
}

// Phase 173.4 boot hotfix: lobby info board builder used by the skyline return path.
function addLobbyInfoBoards(scene, R, wallHeight){
  const boards = [];
  const items = [
    { angle: -Math.PI * 0.12, title: "PLAYABLE POKER", sub: "Fold • Check • Call • Raise • All-In" },
    { angle: Math.PI * 0.12, title: "HAND HISTORY", sub: "Winner proof and recent results" },
    { angle: 0, title: "SVR MISSION", sub: "Play-money social VR with sponsor-ready impact" }
  ];
  items.forEach((item, idx)=>{
    const tex = createPlaqueTexture(item.title, item.sub);
    const board = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 1.42), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    const radius = R - 2.7;
    board.position.set(Math.cos(item.angle) * radius, 1.72, Math.sin(item.angle) * radius);
    board.lookAt(0, 1.55, 0);
    board.renderOrder = 42;
    scene.add(board);

    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: makeSpriteTexture(), color: 0xb95aff, transparent: true, opacity: 0.10, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.scale.set(5.4, 2.2, 1);
    glow.position.copy(board.position).add(new THREE.Vector3(0, 0, 0.04));
    scene.add(glow);
    boards.push({ board, glow, phase: idx * 0.9 });
  });
  return boards;
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


  const adTex = createPlaqueTexture('AWAITING APPROVAL', 'future sponsor ad');
  const adHeader = new THREE.Mesh(
    new THREE.PlaneGeometry(3.26, 0.56),
    new THREE.MeshBasicMaterial({ map: createSponsorPlateTexture('SPONSOR SLOT', 'awaiting approval'), transparent: true, side: THREE.DoubleSide })
  );
  adHeader.position.set(modelX, wallHeight * 0.39, 0.18);
  group.add(adHeader);

  const adBillboard = new THREE.Mesh(
    new THREE.PlaneGeometry(2.42, 4.30),
    new THREE.MeshBasicMaterial({ map: adTex, transparent: true, side: THREE.DoubleSide })
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
  const zenTex = createPlaqueTexture('AWAITING APPROVAL', 'future wellness module');

  const count = 68;
  const adIndices = new Set([4, 11, 20, 28, 36, 44, 52, 60]);
  for (let i = 0; i < count; i++){
    const a = (i / count) * Math.PI * 2;
    const rr = (R + 14) + Math.random() * 22;
    const h = 18 + Math.random() * 34;
    const w = 3.8 + Math.random() * 6.8;
    const d = 3.2 + Math.random() * 6.2;
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
      const tex = (i === 20 || i === 52) ? zenTex : (i % 2 ? matrix.texture : adTex);
      if (tex) tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
      const bw = Math.max(4.4, w * 0.92);
      const bh = Math.max(9.6, h * 0.56);
      const bill = new THREE.Mesh(
        new THREE.PlaneGeometry(bw, bh),
        new THREE.MeshBasicMaterial({ map: tex, transparent: false, side: THREE.DoubleSide })
      );
      bill.position.set(x - outward.x * (w * 0.52 + 0.44), Math.min(h * 0.56, 22), z - outward.z * (w * 0.52 + 0.44));
      bill.lookAt(bill.position.clone().sub(outward));
      group.add(bill);

      if (tex === zenTex){
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
              ctx.fillText("AWAITING APPROVAL.COM", w2 / 2, 94);
              ctx.fillStyle = "#7bffb7";
              ctx.font = "700 50px system-ui, Arial";
              ctx.fillText("Founder-led Reiki • Meditation • Wellness", w2 / 2, 178);
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
  moon.position.set(-164, wallHeight + 178.0, -(R + 548.0));
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
  mars.position.set(232, wallHeight + 196.0, -(R + 678.0));
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
  const dealerBase = null; // Phase 170: visible dealer body disabled; invisible card logic remains.
  const dealerIdle = null;
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
    moon.position.set(
      -44 + Math.sin(t * 0.020) * 5.0,
      wallHeight + 44.0 + Math.sin(t * 0.090) * 1.4,
      -(R + 128.0) + Math.cos(t * 0.016) * 6.0
    );
    moon.rotation.y += dt * 0.08;
    moon.rotation.z = 0.03;
    mars.position.set(
      68 + Math.sin(t * 0.016 + 1.4) * 6.5,
      wallHeight + 52.0 + Math.sin(t * 0.070 + 0.8) * 1.2,
      -(R + 154.0) + Math.cos(t * 0.012 + 0.4) * 5.0
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
    sceneTargets,
    pokerDemo
  };
}
