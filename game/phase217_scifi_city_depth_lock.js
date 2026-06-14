import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-217-SCIFI-CITY-DEPTH-SECOND-FLOOR-LOCK";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const PURPLE = 0xa77cff;

function stamp(){
  window.SVR_PHASE106 = window.SVR_PHASE106 || {};
  window.SVR_PHASE106.build = LABEL;
  window.SVR_PHASE217 = {
    build: LABEL,
    active: true,
    layeredCityDepth: true,
    secondFloorViewPriority: true,
    source: "uploaded scifi city.zip",
    noLegacySkyline: true,
    noFaceOverlay: true,
    checkedAt: new Date().toISOString()
  };
  window.SVR_DISABLE_LEGACY_SKYLINE = true;
  window.SVR_BACKGROUND_BUILDINGS_REMOVED = true;
  window.SVR_NO_FACE_OVERLAY = true;
  document.title = `SVR Poker • ${LABEL}`;
  document.querySelectorAll(".pill").forEach(el=>{ if ((el.textContent||"").includes("BUILD:")) el.textContent = `BUILD: ${LABEL}`; });
}

function makeWindowTexture(seed=1){
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 1024;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#050812";
  ctx.fillRect(0,0,c.width,c.height);
  for(let y=30;y<c.height-30;y+=42){
    for(let x=28;x<c.width-28;x+=38){
      const on = ((x*13 + y*7 + seed*31) % 9) > 3;
      ctx.fillStyle = on ? "rgba(125,252,255,.88)" : "rgba(120,90,190,.18)";
      ctx.fillRect(x,y,18,18);
      if(on){
        ctx.fillStyle = "rgba(255,217,138,.20)";
        ctx.fillRect(x+3,y+3,12,12);
      }
    }
  }
  ctx.strokeStyle = "rgba(255,255,255,.12)";
  ctx.lineWidth = 4;
  for(let y=0;y<c.height;y+=126){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(c.width,y); ctx.stroke(); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function mat(color, emissive=color, intensity=.18, opacity=1){
  return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity:intensity, roughness:.66, metalness:.18, transparent:opacity<1, opacity });
}
function glow(color, opacity=.45){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide });
}

function makeTower(root, name, x, z, w, h, d, seed, color=0x0a1020){
  const tex = makeWindowTexture(seed);
  const body = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), new THREE.MeshStandardMaterial({ map:tex, color, emissive:0x071427, emissiveIntensity:.24, roughness:.72, metalness:.10 }));
  body.name = name;
  body.position.set(x, 4.0 + h/2, z);
  root.add(body);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(w+.08,.08,d+.08), glow(seed%2?CYAN:PURPLE,.42));
  trim.name = `${name}_UPPER_LIGHT_TRIM`;
  trim.position.set(x, 4.05 + h, z);
  root.add(trim);
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,1.35,12), glow(GOLD,.38));
  mast.name = `${name}_ROOFLINE_BEACON`;
  mast.position.set(x, 4.75 + h, z);
  root.add(mast);
  return body;
}

function addHoloSign(root, name, text, x, y, z, rotY=0){
  const c = document.createElement("canvas");
  c.width = 900; c.height = 260;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(2,5,14,.82)"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle = "#7ffcff"; ctx.lineWidth = 12; ctx.strokeRect(18,18,c.width-36,c.height-36);
  ctx.font = "900 78px system-ui,Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle = "#ffffff"; ctx.fillText(text,c.width/2,c.height/2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(4.4,1.28), new THREE.MeshBasicMaterial({ map:tex, transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  p.name = name;
  p.position.set(x,y,z); p.rotation.y = rotY; p.renderOrder = 35;
  root.add(p);
}

function install(){
  stamp();
  const scene = window.__SVR_SCENE__;
  if(!scene || window.SVR_PHASE217_DEPTH_INSTALLED) return !!scene;
  const old = scene.getObjectByName("PHASE217_CITY_DEPTH_ROOT");
  if(old) old.parent?.remove(old);
  const root = new THREE.Group();
  root.name = "PHASE217_CITY_DEPTH_ROOT";
  scene.add(root);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(48,10), glow(0x13234a,.18));
  back.name = "PHASE217_CITY_DEPTH_SOFT_NIGHT_BACKDROP";
  back.position.set(0,9.1,-29.2);
  root.add(back);

  const xs = [-18,-15.4,-12.6,-9.9,-7.1,-4.3,-1.4,1.6,4.6,7.2,9.9,12.5,15.1,17.7];
  xs.forEach((x,i)=>{
    const h = 3.4 + (i%5)*1.15 + (i%2)*.7;
    const w = 1.05 + (i%3)*.28;
    const d = .70 + (i%4)*.12;
    const z = -25.2 - (i%3)*1.55;
    makeTower(root,`PHASE217_UPPER_VIEW_SCI_FI_STACK_${i+1}`,x,z,w,h,d,i+5,i%2?0x10172d:0x0a1324);
  });

  [-16,-8,0,8,16].forEach((x,i)=>{
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(4.8,.16,.18), glow(i%2?CYAN:GOLD,.40));
    bridge.name = `PHASE217_UPPER_CITY_AERIAL_BRIDGE_${i+1}`;
    bridge.position.set(x,8.4+(i%2)*1.1,-24.7-i*.32);
    root.add(bridge);
  });

  addHoloSign(root,"PHASE217_CITY_DEPTH_HOLO_SIGN","SVR CITY",-10.8,9.6,-24.1,.05);
  addHoloSign(root,"PHASE217_CITY_DEPTH_HOLO_SIGN_RIGHT","SECOND FLOOR VIEW",10.6,10.0,-24.4,-.05);

  const sideMat = glow(0x2b1556,.24);
  const west = new THREE.Mesh(new THREE.PlaneGeometry(16,7.5), sideMat);
  west.name = "PHASE217_UPPER_WEST_CITY_DEPTH_WRAP";
  west.position.set(-23.9,8.4,-17.6); west.rotation.y = Math.PI/2.55; root.add(west);
  const east = new THREE.Mesh(new THREE.PlaneGeometry(16,7.5), sideMat.clone());
  east.name = "PHASE217_UPPER_EAST_CITY_DEPTH_WRAP";
  east.position.set(23.9,8.4,-17.6); east.rotation.y = -Math.PI/2.55; root.add(east);

  window.SVR_PHASE217_DEPTH_INSTALLED = true;
  return true;
}

stamp();
let n=0;
const id=setInterval(()=>{ n++; if(install() || n>100) clearInterval(id); },180);
[400,900,1800,3200,6200].forEach(ms=>setTimeout(install,ms));
setInterval(stamp,1200);
