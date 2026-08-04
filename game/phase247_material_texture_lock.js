import * as THREE from "three";

const BUILD = "PHASE-247-MATERIAL-TEXTURE-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const MARBLE_DARK = 0x141a29;
const WALL_DARK = 0x0b0f1a;
const STONE = 0xd8ccb4;

function waitForScene(){
  return new Promise((resolve)=>{
    let tries=0;
    const tick=()=>{
      if(window.__SVR_SCENE__) return resolve(window.__SVR_SCENE__);
      if(++tries>360) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}
function makeTexture(kind="marble", w=1024, h=1024){
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const x=c.getContext("2d");
  if(kind==="marble"){
    const bg=x.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,"#101725"); bg.addColorStop(.5,"#1a2132"); bg.addColorStop(1,"#070b13");
    x.fillStyle=bg; x.fillRect(0,0,w,h);
    for(let i=0;i<96;i++){
      x.strokeStyle=`rgba(255,255,255,${0.035+Math.random()*0.05})`;
      x.lineWidth=1+Math.random()*4;
      x.beginPath();
      const y=Math.random()*h;
      x.moveTo(-60,y);
      for(let px=0;px<w+80;px+=80){ x.lineTo(px,y+Math.sin(px*.015+i)*26+Math.random()*18); }
      x.stroke();
    }
    for(let i=0;i<18;i++){
      x.strokeStyle="rgba(255,217,138,.08)"; x.lineWidth=2;
      x.beginPath(); x.moveTo(Math.random()*w,0); x.lineTo(Math.random()*w,h); x.stroke();
    }
  } else if(kind==="wall"){
    x.fillStyle="#070b14"; x.fillRect(0,0,w,h);
    for(let row=0;row<16;row++){
      for(let col=0;col<14;col++){
        const ox=(row%2)*36;
        x.fillStyle=`rgba(30,42,66,${.26+((row+col)%4)*.035})`;
        x.fillRect(col*76-ox,row*64,72,60);
        x.strokeStyle="rgba(255,255,255,.035)"; x.strokeRect(col*76-ox,row*64,72,60);
      }
    }
  } else if(kind==="gold"){
    const bg=x.createLinearGradient(0,0,w,h);
    bg.addColorStop(0,"#5a3a0d"); bg.addColorStop(.45,"#ffd98a"); bg.addColorStop(1,"#3a2408");
    x.fillStyle=bg; x.fillRect(0,0,w,h);
    for(let i=0;i<80;i++){ x.fillStyle="rgba(255,255,255,.06)"; x.fillRect(Math.random()*w,Math.random()*h,2+Math.random()*8,1+Math.random()*3); }
  } else {
    x.fillStyle="#101826"; x.fillRect(0,0,w,h);
    for(let i=0;i<64;i++){ x.strokeStyle="rgba(127,252,255,.06)"; x.beginPath(); x.moveTo(0,Math.random()*h); x.lineTo(w,Math.random()*h); x.stroke(); }
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.wrapS=t.wrapT=THREE.RepeatWrapping; t.anisotropy=8; return t;
}
function materialWithTexture(kind, color, repeatX=4, repeatY=4, roughness=.72, metalness=.04){
  const map=makeTexture(kind);
  map.repeat.set(repeatX,repeatY);
  return new THREE.MeshStandardMaterial({ color, map, roughness, metalness, emissive:0x02040a, emissiveIntensity:.04 });
}
function applyMaterials(scene){
  const marble=materialWithTexture("marble",MARBLE_DARK,7,6,.78,.08);
  const wall=materialWithTexture("wall",WALL_DARK,5,3,.82,.03);
  const gold=materialWithTexture("gold",GOLD,2,1,.48,.22);
  const stone=materialWithTexture("stone",STONE,2,6,.58,.09);
  let floor=0, walls=0, trims=0, columns=0;
  scene.traverse((obj)=>{
    if(!obj.isMesh || !obj.name) return;
    if(/FLOOR|MARBLE|CARPET|RUNNER/.test(obj.name) && !/PORTAL|RING/.test(obj.name)){ obj.material=marble; floor++; }
    if(/WALL|BAY|BACK/.test(obj.name) && !/PANEL|SIGN|WINDOW|SKYLINE/.test(obj.name)){ obj.material=wall; walls++; }
    if(/GOLD|TRIM|BEAM|RAIL|STEP|CAP/.test(obj.name) && !/PORTAL/.test(obj.name)){ obj.material=gold; trims++; }
    if(/COLUMN|PILLAR/.test(obj.name) && !/LIGHT/.test(obj.name)){ obj.material=stone; columns++; }
  });
  return {floor,walls,trims,columns};
}
function addMaterialSamples(scene){
  const root=new THREE.Group(); root.name="PHASE247_MATERIAL_TEXTURE_SAMPLE_ROOT"; scene.add(root);
  const goldGlow=new THREE.Mesh(new THREE.RingGeometry(6.18,6.28,160),new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.24,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  goldGlow.name="PHASE247_POLISHED_MAIN_FLOOR_GOLD_ACCENT"; goldGlow.rotation.x=-Math.PI/2; goldGlow.position.set(0,.11,.55); root.add(goldGlow);
  const cyanLine=new THREE.Mesh(new THREE.RingGeometry(6.45,6.51,160),new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  cyanLine.name="PHASE247_POLISHED_MAIN_FLOOR_CYAN_ACCENT"; cyanLine.rotation.x=-Math.PI/2; cyanLine.position.set(0,.115,.55); root.add(cyanLine);
}
async function install(){
  const scene=await waitForScene();
  if(!scene) return;
  if(scene.getObjectByName("PHASE247_MATERIAL_TEXTURE_SAMPLE_ROOT")) return;
  const applied=applyMaterials(scene);
  addMaterialSamples(scene);
  window.SVR_PHASE247_MATERIAL_TEXTURE_LOCK={build:BUILD,active:true,siteTouched:false,applied,textureMode:"procedural Quest-safe",checkedAt:new Date().toISOString()};
  window.SVR_LOCKED_FINAL_BUILD=BUILD;
  const label=document.getElementById("svr-phase-label"); if(label) label.textContent="PHASE 247 ACTIVE • MATERIAL TEXTURE LOCK";
  const status=document.getElementById("status"); if(status) status.textContent="Phase 247 material texture lock active";
}
install();
