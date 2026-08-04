import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-188-SECOND-FLOOR-VISIBILITY-LOCK";
const GOLD = 0xffdf8a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;

function tex(title, line1, line2, color="#ffdf8a"){
  const c=document.createElement("canvas"); c.width=900; c.height=360;
  const x=c.getContext("2d");
  const g=x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#040712"); g.addColorStop(1,"#14051d");
  x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=color; x.lineWidth=12; x.strokeRect(24,24,c.width-48,c.height-48);
  x.textAlign="center"; x.textBaseline="middle";
  x.fillStyle=color; x.font="900 48px system-ui,Arial"; x.fillText(title,c.width/2,92);
  x.fillStyle="#fff"; x.font="800 31px system-ui,Arial"; x.fillText(line1,c.width/2,180);
  x.fillStyle="#dffcff"; x.font="700 24px system-ui,Arial"; x.fillText(line2,c.width/2,254);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function face(obj,a,r,y){ obj.position.set(Math.cos(a)*r,y,Math.sin(a)*r); obj.lookAt(0,y,0); }
function makePanel(title,line1,line2,a,r,y,w=1.9,h=.78,color="#ffdf8a"){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex(title,line1,line2,color),transparent:true,side:THREE.DoubleSide}));
  face(m,a,r,y); return m;
}
function addDeck(root){
  const deckMat=new THREE.MeshStandardMaterial({color:0x2a2637,roughness:.52,metalness:.10,emissive:0x02030a,emissiveIntensity:.18});
  const outer=new THREE.Mesh(new THREE.TorusGeometry(11.9,.34,16,192),deckMat);
  outer.name="PHASE188_VISIBLE_SECOND_FLOOR_WALKWAY_DECK"; outer.rotation.x=Math.PI/2; outer.position.y=3.08; root.add(outer);
  const railMat=new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.82});
  const innerRail=new THREE.Mesh(new THREE.TorusGeometry(10.55,.055,12,192),railMat);
  innerRail.name="PHASE188_SECOND_FLOOR_INNER_GOLD_BANISTER"; innerRail.rotation.x=Math.PI/2; innerRail.position.y=3.58; root.add(innerRail);
  const outerRail=new THREE.Mesh(new THREE.TorusGeometry(12.7,.06,12,192),railMat);
  outerRail.name="PHASE188_SECOND_FLOOR_OUTER_GOLD_BANISTER"; outerRail.rotation.x=Math.PI/2; outerRail.position.y=3.58; root.add(outerRail);
  const glow=new THREE.Mesh(new THREE.TorusGeometry(11.65,.035,12,192),new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.34}));
  glow.name="PHASE188_SECOND_FLOOR_UNDERLIGHT_RING"; glow.rotation.x=Math.PI/2; glow.position.y=2.82; root.add(glow);
  for(let i=0;i<40;i++){
    const a=i*Math.PI*2/40;
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,.74,12),new THREE.MeshStandardMaterial({color:0xd7c69d,roughness:.55,metalness:.12,emissive:0x0a0703,emissiveIntensity:.12}));
    post.name=`PHASE188_SECOND_FLOOR_RAIL_POST_${i+1}`; post.position.set(Math.cos(a)*10.75,3.32,Math.sin(a)*10.75); root.add(post);
  }
}
function addUpperStorefronts(root){
  const names=["PLAY GAME","WELLNESS","PGA TRAINING","LEGENDS","SPONSORS","SCORPION SHOP","VIP LOUNGE","MEMBERSHIP","EVENTS","STORE"];
  names.forEach((name,i)=>{
    const a=-Math.PI/2 + (i-(names.length-1)/2)*0.30;
    const panel=makePanel(name,"SECOND FLOOR","UPPER STOREFRONT",a,11.58,4.28,1.68,.68,i%3===0?"#ffdf8a":i%3===1?"#7ffcff":"#a77cff");
    panel.name=`PHASE188_UPPER_STOREFRONT_${name.replace(/\s+/g,"_")}`;
    root.add(panel);
    const alcove=new THREE.Mesh(new THREE.BoxGeometry(1.92,1.38,.16),new THREE.MeshStandardMaterial({color:0x171421,roughness:.63,metalness:.05,emissive:0x06030a,emissiveIntensity:.22}));
    alcove.name=`PHASE188_UPPER_ALCOVE_FRAME_${i+1}`; face(alcove,a,11.75,4.23); alcove.rotation.y+=Math.PI/2; root.add(alcove);
  });
}
function addStairsAndPads(root){
  const mat=new THREE.MeshStandardMaterial({color:0x3a3448,roughness:.55,metalness:.08,emissive:0x04040b,emissiveIntensity:.18});
  for(let side of [-1,1]){
    for(let i=0;i<7;i++){
      const step=new THREE.Mesh(new THREE.BoxGeometry(1.18,.10,.45),mat);
      step.name=`PHASE188_SECOND_FLOOR_VISIBLE_STAIR_${side}_${i+1}`;
      step.position.set(side*(5.3+i*.28),.18+i*.22,5.75-i*.42);
      step.rotation.y=side*.48;
      root.add(step);
    }
    const pad=new THREE.Mesh(new THREE.CylinderGeometry(.58,.72,.08,36),new THREE.MeshBasicMaterial({color:CYAN,transparent:true,opacity:.36}));
    pad.name=`PHASE188_UPPER_FLOOR_TELEPORT_PAD_${side>0?"RIGHT":"LEFT"}`; pad.position.set(side*7.0,3.14,3.0); root.add(pad);
  }
  const s=makePanel("UPPER FLOOR","Walkway + Storefronts","Teleport pads on left and right",Math.PI/2,6.1,3.95,2.35,.82,"#ffdf8a");
  s.name="PHASE188_UPPER_FLOOR_MAIN_SIGN"; root.add(s);
}
function addSupportColumns(root){
  const mat=new THREE.MeshStandardMaterial({color:0xd4c3a2,roughness:.62,metalness:.08,emissive:0x0b0703,emissiveIntensity:.12});
  for(let i=0;i<20;i++){
    const a=i*Math.PI*2/20;
    const col=new THREE.Mesh(new THREE.CylinderGeometry(.14,.20,3.0,24),mat);
    col.name=`PHASE188_SECOND_FLOOR_SUPPORT_COLUMN_${i+1}`;
    col.position.set(Math.cos(a)*11.55,1.55,Math.sin(a)*11.55);
    root.add(col);
    const cap=new THREE.Mesh(new THREE.CylinderGeometry(.25,.23,.12,24),mat);
    cap.name=`PHASE188_COLUMN_CAP_${i+1}`; cap.position.set(col.position.x,3.08,col.position.z); root.add(cap);
  }
}
export function installPhase188SecondFloorVisibility(){
  const scene=window.__SVR_SCENE__; if(!scene) return null;
  const old=scene.getObjectByName("PHASE188_SECOND_FLOOR_VISIBILITY_ROOT"); if(old) return old;
  const root=new THREE.Group(); root.name="PHASE188_SECOND_FLOOR_VISIBILITY_ROOT";
  addDeck(root); addSupportColumns(root); addUpperStorefronts(root); addStairsAndPads(root);
  scene.add(root);
  window.SVR_PHASE188_SECOND_FLOOR={label:LABEL,locked:true,visibleSecondFloor:true,walkwayY:3.08,storefronts:10,checkedAt:new Date().toISOString()};
  console.log("[Phase188] second floor visibility active");
  return root;
}
export function autoInstallPhase188SecondFloorVisibility(){
  const start=performance.now();
  const id=setInterval(()=>{ if(window.__SVR_SCENE__){ clearInterval(id); installPhase188SecondFloorVisibility(); } else if(performance.now()-start>16000) clearInterval(id); },500);
}
