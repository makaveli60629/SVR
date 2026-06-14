import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-189-SKY-FLOOR-HARDLOCK";
const GOLD = 0xffdf8a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;

function isOfficial(name){
  return /PHASE189|PHASE188|PHASE187|PHASE186|PHASE185|PHASE181|PHASE180|PHASE178|PHASE177|PGA|REIKI|WELLNESS|SPONSOR|STORE|SCORPION|LEGEND|Watch|Teleport|Hand|Controller/i.test(String(name||""));
}
function hideFlatSky(scene){
  let hidden = 0;
  scene.traverse(obj=>{
    if(!obj || obj.isScene || isOfficial(obj.name)) return;
    const name = String(obj.name || "");
    const y = obj.getWorldPosition ? obj.getWorldPosition(new THREE.Vector3()).y : (obj.position?.y || 0);
    const type = obj.geometry?.type || "";
    const matName = String(obj.material?.name || "");
    const flatSky = obj.isMesh && /Plane|Shape/.test(type) && y > 4.5;
    const oldPlanet = /moon|mars|planet|earth|sky|picture|billboard|background|city|tower|building|skyline/i.test(name + " " + matName);
    if((flatSky || oldPlanet) && obj.visible !== false){ obj.visible = false; hidden++; }
  });
  return hidden;
}
function canvas(title,line,color="#ffdf8a"){
  const c=document.createElement("canvas"); c.width=900; c.height=360;
  const x=c.getContext("2d");
  x.fillStyle="#050814"; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=color; x.lineWidth=12; x.strokeRect(24,24,c.width-48,c.height-48);
  x.textAlign="center"; x.textBaseline="middle";
  x.fillStyle=color; x.font="900 54px system-ui,Arial"; x.fillText(title,c.width/2,118);
  x.fillStyle="#fff"; x.font="800 34px system-ui,Arial"; x.fillText(line,c.width/2,220);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function face(o,a,r,y){ o.position.set(Math.cos(a)*r,y,Math.sin(a)*r); o.lookAt(0,y,0); }
function makeSign(name,title,line,a,r,y,w=2.4,h=.95,color="#ffdf8a"){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:canvas(title,line,color),transparent:true,side:THREE.DoubleSide}));
  m.name=name; face(m,a,r,y); return m;
}
function addSecondFloorHard(root){
  const deckMat=new THREE.MeshStandardMaterial({color:0x333044,roughness:.48,metalness:.14,emissive:0x04040c,emissiveIntensity:.22});
  const deck=new THREE.Mesh(new THREE.TorusGeometry(11.85,.46,18,220),deckMat);
  deck.name="PHASE189_HARD_VISIBLE_SECOND_FLOOR_DECK"; deck.rotation.x=Math.PI/2; deck.position.y=3.35; root.add(deck);
  const railMat=new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.92});
  [10.45,12.95].forEach((r,i)=>{ const rail=new THREE.Mesh(new THREE.TorusGeometry(r,.075,14,220),railMat); rail.name=`PHASE189_HARD_SECOND_FLOOR_RAIL_${i+1}`; rail.rotation.x=Math.PI/2; rail.position.y=3.92; root.add(rail); });
  const glow=new THREE.Mesh(new THREE.TorusGeometry(11.72,.045,12,220),new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.52}));
  glow.name="PHASE189_SECOND_FLOOR_BRIGHT_UNDERGLOW"; glow.rotation.x=Math.PI/2; glow.position.y=3.02; root.add(glow);
  for(let i=0;i<12;i++){
    const a=-Math.PI*.80 + i*(Math.PI*1.60/11);
    const sign=makeSign(`PHASE189_UPPER_STORE_${i+1}`,i%2?"UPPER STORE":"SECOND FLOOR",i%3===0?"Sponsor Slot":i%3===1?"Shop Front":"Ad Gallery",a,11.35,4.55,1.65,.66,i%3===0?"#ffdf8a":i%3===1?"#7ffcff":"#a77cff");
    root.add(sign);
  }
  for(let side of [-1,1]){
    for(let i=0;i<9;i++){
      const step=new THREE.Mesh(new THREE.BoxGeometry(1.28,.13,.52),deckMat);
      step.name=`PHASE189_REAL_STAIR_VISUAL_${side}_${i+1}`;
      step.position.set(side*(4.6+i*.32),.20+i*.28,6.25-i*.46);
      step.rotation.y=side*.55;
      root.add(step);
    }
    const pad=new THREE.Mesh(new THREE.CylinderGeometry(.66,.8,.10,48),new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.45}));
    pad.name=`PHASE189_UPPER_FLOOR_ACCESS_PAD_${side>0?"RIGHT":"LEFT"}`; pad.position.set(side*7.35,.08,4.1); root.add(pad);
    const label=makeSign(`PHASE189_ACCESS_PAD_SIGN_${side>0?"RIGHT":"LEFT"}`,"UPPER FLOOR","Teleport access pad",Math.PI/2-side*.42,6.8,1.35,1.65,.62,"#7ffcff");
    root.add(label);
  }
}
function addMoonMars(root){
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1.45,48,32),new THREE.MeshStandardMaterial({color:0xe4e1d7,roughness:.62,metalness:.02,emissive:0x1a2133,emissiveIntensity:.24}));
  moon.name="PHASE189_ONLY_BIG_MOON"; moon.position.set(-3.6,12.2,-9.4); root.add(moon);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(.50,36,24),new THREE.MeshStandardMaterial({color:0xc95734,roughness:.78,emissive:0x2d0904,emissiveIntensity:.26}));
  mars.name="PHASE189_ONLY_SMALL_MARS"; mars.position.set(4.6,10.8,-10.7); root.add(mars);
  root.userData.moon=moon; root.userData.mars=mars;
}
export function installPhase189SkyFloorHardlock(){
  const scene=window.__SVR_SCENE__; if(!scene) return null;
  let root=scene.getObjectByName("PHASE189_SKY_FLOOR_HARDLOCK_ROOT");
  if(!root){
    root=new THREE.Group(); root.name="PHASE189_SKY_FLOOR_HARDLOCK_ROOT";
    addSecondFloorHard(root); addMoonMars(root); scene.add(root);
  }
  const scan=()=>{ const hidden=hideFlatSky(scene); window.SVR_PHASE189_HARDLOCK={label:LABEL,active:true,flatSkyHidden:hidden,secondFloor:true,checkedAt:new Date().toISOString()}; };
  scan(); setTimeout(scan,100); setTimeout(scan,500); setInterval(scan,900);
  const loop=(now)=>{ if(!root.parent) return; const t=now*.001; if(root.userData.moon) root.userData.moon.rotation.y=t*.12; if(root.userData.mars) root.userData.mars.rotation.y=t*.06; requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  console.log("[Phase189] sky and second floor hardlock active");
  return root;
}
export function autoInstallPhase189SkyFloorHardlock(){
  const start=performance.now();
  const id=setInterval(()=>{ if(window.__SVR_SCENE__){ clearInterval(id); installPhase189SkyFloorHardlock(); } else if(performance.now()-start>16000) clearInterval(id); },400);
}
