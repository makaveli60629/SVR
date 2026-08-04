import * as THREE from "three";

const LABEL = "PHASE-293-LOBBY-VISUAL-TRUTH-LOCK";

function makeMarbleTexture(){
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 1024;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#0b0d14";
  ctx.fillRect(0,0,c.width,c.height);
  for(let y=0;y<c.height;y++){
    for(let x=0;x<c.width;x+=4){
      const wave = Math.sin((x+y)*0.018) + Math.sin(x*0.041) + Math.sin((x-y)*0.027);
      const v = 24 + Math.floor((wave+3)*14) + Math.floor(Math.random()*8);
      ctx.fillStyle = `rgb(${v},${v+2},${v+8})`;
      ctx.fillRect(x,y,4,1);
    }
  }
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 3;
  for(let i=0;i<=8;i++){
    const p = i*c.width/8;
    ctx.beginPath(); ctx.moveTo(p,0); ctx.lineTo(p,c.height); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,p); ctx.lineTo(c.width,p); ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4,4);
  return tex;
}
function planetTexture(kind){
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(230,210,20,256,256,260);
  if(kind === "mars"){
    g.addColorStop(0,"#ffb06a"); g.addColorStop(.45,"#b94d2b"); g.addColorStop(1,"#42120c");
  } else {
    g.addColorStop(0,"#f0eee4"); g.addColorStop(.55,"#aaa79e"); g.addColorStop(1,"#42464f");
  }
  ctx.fillStyle = g;
  ctx.fillRect(0,0,512,512);
  for(let i=0;i<(kind === "mars" ? 170 : 230);i++){
    const x = Math.random()*512, y = Math.random()*512;
    const r = kind === "mars" ? 3+Math.random()*22 : 2+Math.random()*18;
    ctx.beginPath();
    ctx.arc(x,y,r,0,Math.PI*2);
    ctx.fillStyle = kind === "mars" ? "rgba(90,24,12,.35)" : "rgba(25,28,36,.28)";
    ctx.fill();
  }
  for(let i=0;i<22;i++){
    ctx.beginPath();
    ctx.moveTo(Math.random()*512,Math.random()*512);
    ctx.bezierCurveTo(Math.random()*512,Math.random()*512,Math.random()*512,Math.random()*512,Math.random()*512,Math.random()*512);
    ctx.strokeStyle = kind === "mars" ? "rgba(255,190,120,.18)" : "rgba(255,255,255,.16)";
    ctx.lineWidth = 1 + Math.random()*3;
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function hideDuplicatePlanets(scene, keepMoon, keepMars){
  let hidden = 0;
  scene.traverse((obj)=>{
    const n = String(obj.name || "").toUpperCase();
    if ((n.includes("MOON") && obj !== keepMoon && !obj.isLight) || (n.includes("MARS") && obj !== keepMars && !obj.isLight)){
      if (obj.visible !== false){ hidden += 1; }
      obj.visible = false;
      obj.userData.phase293HiddenDuplicatePlanet = true;
    }
  });
  return hidden;
}
function ensurePlanet(scene, name, kind, position, scale){
  let obj = scene.getObjectByName(name);
  if(!obj){
    const color = kind === "mars" ? 0xc95d36 : 0xdcdad2;
    obj = new THREE.Mesh(new THREE.SphereGeometry(1,64,40), new THREE.MeshStandardMaterial({ color, roughness:.72, metalness:.02 }));
    obj.name = name;
    scene.add(obj);
  }
  obj.visible = true;
  obj.position.set(position.x, position.y, position.z);
  obj.scale.setScalar(scale);
  obj.material = new THREE.MeshStandardMaterial({
    map: planetTexture(kind),
    color: kind === "mars" ? 0xff8a55 : 0xffffff,
    roughness:.78,
    metalness:.01,
    emissive: kind === "mars" ? 0x4b1408 : 0x202638,
    emissiveIntensity: kind === "mars" ? .25 : .18
  });
  obj.userData.phase293PrimaryPlanet = true;
  obj.updateMatrixWorld(true);
  return obj;
}
function applyMarbleFloor(scene){
  const floor = scene.getObjectByName("PHASE195_ONE_VISUAL_FLOOR") || scene.getObjectByName("PHASE200_ONE_VISUAL_FLOOR");
  if(!floor) return false;
  floor.material = new THREE.MeshStandardMaterial({ map:makeMarbleTexture(), color:0xffffff, roughness:.62, metalness:.12, emissive:0x03040a, emissiveIntensity:.05 });
  floor.material.needsUpdate = true;
  floor.userData.phase293MarbleFloor = true;
  const grid = scene.getObjectByName("PHASE200_SUBTLE_ORDERED_FLOOR_GRID");
  if(grid){ grid.visible = false; grid.userData.phase293HiddenTileGrid = true; }
  return true;
}
function applyRedCarpetStairs(scene){
  let count = 0;
  scene.traverse((obj)=>{
    if(!obj?.userData?.svrStairStep || obj.userData.phase293Carpeted) return;
    const cover = new THREE.Mesh(new THREE.BoxGeometry(1.50,.025,.42), new THREE.MeshBasicMaterial({ color:0x6e061a, transparent:true, opacity:.86 }));
    cover.name = `${obj.name}_RED_CARPET_TOPPER`;
    cover.position.set(0,.075,0);
    obj.add(cover);
    obj.userData.phase293Carpeted = true;
    count += 1;
  });
  return count;
}
function apply(){
  const scene = window.__SVR_SCENE__;
  if(!scene) return false;
  const moon = ensurePlanet(scene,"PHASE293_SINGLE_SHOW_MOON_TEXTURED", "moon", new THREE.Vector3(-10.4,19.2,-39.0), 2.15);
  const mars = ensurePlanet(scene,"PHASE293_SINGLE_SHOW_MARS_TEXTURED", "mars", new THREE.Vector3(8.8,17.8,-42.0), 1.25);
  const hiddenPlanets = hideDuplicatePlanets(scene, moon, mars);
  const marbleFloor = applyMarbleFloor(scene);
  const stairCovers = applyRedCarpetStairs(scene);
  window.SVR_PHASE293_LOBBY_VISUAL_TRUTH_LOCK = {
    build: LABEL,
    active: true,
    siteTouched: false,
    moonLargeTextured: true,
    marsLargeTextured: true,
    duplicatePlanetsHidden: hiddenPlanets,
    marbleFloor,
    redCarpetStairCovers: stairCovers,
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}
apply();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if(apply() || tries > 160) clearInterval(timer); },150);
[500,1200,2400,4800,8000,12000,18000].forEach((delay)=>setTimeout(apply,delay));
