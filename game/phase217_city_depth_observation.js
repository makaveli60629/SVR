import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-217-CITY-DEPTH-OBSERVATION-LOCK";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const PURPLE = 0xa77cff;

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_NO_FACE_OVERLAY = true;
  window.SVR_PHASE217 = {
    build: LABEL,
    active: true,
    cityDepthObservation: true,
    secondFloorSightline: true,
    proceduralForegroundSkyline: true,
    keepsPhase216CityBackdrop: true,
    checkedAt: new Date().toISOString()
  };
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{
    if ((el.textContent || "").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`;
  });
}

function mat(color, emissive = 0x000000, intensity = 0.18, opacity = 1){
  return new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });
}

function glow(color, opacity = 0.38){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}

function addBuilding(root, i, x, z, h, w, d, color){
  const tower = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat(color));
  tower.name = `PHASE217_CITY_DEPTH_TOWER_${i}`;
  tower.position.set(x, 2.1 + h/2, z);
  root.add(tower);

  const cap = new THREE.Mesh(new THREE.BoxGeometry(w*1.08,0.08,d*1.08), glow(i % 3 === 0 ? GOLD : CYAN, .25));
  cap.name = `PHASE217_CITY_DEPTH_TOWER_${i}_ROOF_GLOW`;
  cap.position.set(x, 2.1 + h + .05, z);
  root.add(cap);

  const rows = Math.max(3, Math.floor(h / .48));
  const cols = Math.max(2, Math.floor(w / .28));
  for(let r=0;r<rows;r+=2){
    for(let c=0;c<cols;c+=2){
      if ((r + c + i) % 4 === 0) continue;
      const win = new THREE.Mesh(new THREE.PlaneGeometry(.08,.045), glow((r+c+i)%5===0 ? PURPLE : CYAN, .42));
      win.name = `PHASE217_CITY_DEPTH_WINDOW_${i}_${r}_${c}`;
      win.position.set(x - w*.42 + c*(w/(cols||1)), 2.35 + r*.24, z + d*.505);
      root.add(win);
    }
  }
  if (i % 4 === 0){
    const antenna = new THREE.Mesh(new THREE.CylinderGeometry(.025,.035,.92,10), glow(PURPLE,.44));
    antenna.name = `PHASE217_CITY_DEPTH_ANTENNA_${i}`;
    antenna.position.set(x, 2.1+h+.48, z);
    root.add(antenna);
  }
}

function addObservationBand(root){
  const band = new THREE.Mesh(new THREE.PlaneGeometry(37.2, 1.34), glow(CYAN,.095));
  band.name = "PHASE217_SECOND_FLOOR_CITY_OBSERVATION_GLASS_BAND";
  band.position.set(0, 4.86, -15.08);
  band.renderOrder = 12;
  root.add(band);

  const rail = new THREE.Mesh(new THREE.BoxGeometry(36.4,.045,.055), glow(GOLD,.42));
  rail.name = "PHASE217_SECOND_FLOOR_CITY_SIGHTLINE_GOLD_RAIL";
  rail.position.set(0, 4.16, -15.02);
  root.add(rail);

  const labelTex = (()=>{
    const c=document.createElement("canvas"); c.width=640; c.height=160;
    const ctx=c.getContext("2d");
    ctx.fillStyle="rgba(3,5,14,.78)"; ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle="#7ffcff"; ctx.lineWidth=8; ctx.strokeRect(10,10,c.width-20,c.height-20);
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle="#ffffff"; ctx.font="900 42px system-ui,Arial"; ctx.fillText("CITY OVERLOOK",c.width/2,66);
    ctx.fillStyle="#ffd98a"; ctx.font="800 22px system-ui,Arial"; ctx.fillText("second-floor skyline view",c.width/2,112);
    const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
  })();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.8,.70), new THREE.MeshBasicMaterial({ map:labelTex, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  sign.name = "PHASE217_CITY_OVERLOOK_LABEL";
  sign.position.set(0,5.58,-15.0);
  root.add(sign);
}

function install(){
  stamp();
  const scene = window.__SVR_SCENE__;
  if (!scene || window.SVR_PHASE217_CITY_DEPTH_INSTALLED) return false;
  const prior = scene.getObjectByName("PHASE217_CITY_DEPTH_OBSERVATION_ROOT");
  if (prior) prior.parent?.remove(prior);
  const root = new THREE.Group();
  root.name = "PHASE217_CITY_DEPTH_OBSERVATION_ROOT";
  scene.add(root);

  addObservationBand(root);
  const colors = [0x050914,0x07101f,0x0a1028,0x0c0e1a,0x091426];
  for(let i=0;i<34;i++){
    const row = i % 3;
    const x = -25.2 + i*1.54;
    const z = -26.2 - row*1.28;
    const h = 1.9 + ((i*7)%13)*.28;
    const w = .42 + ((i*5)%5)*.12;
    const d = .35 + ((i*3)%4)*.14;
    addBuilding(root, i+1, x, z, h, w, d, colors[i % colors.length]);
  }

  window.SVR_PHASE217_CITY_DEPTH_INSTALLED = true;
  return true;
}

stamp();
let tries = 0;
const timer = setInterval(()=>{ tries++; if (install() || tries > 100) clearInterval(timer); }, 200);
[700,1500,3200,6500].forEach(ms=>setTimeout(install,ms));
