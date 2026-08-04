import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-184-LOBBY-EXPERIENCE-POLISH-LOCK";

function canvasTex(w,h,draw){
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d"); draw(ctx,w,h);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function signTex(title,line1,line2,color="#7ffcff"){
  return canvasTex(1000,460,(ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#040814"); g.addColorStop(1,"#18051f");
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=color; ctx.lineWidth=14; ctx.strokeRect(26,26,w-52,h-52);
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillStyle=color; ctx.font="900 66px system-ui,Arial"; ctx.fillText(title,w/2,132);
    ctx.fillStyle="#fff"; ctx.font="800 39px system-ui,Arial"; ctx.fillText(line1,w/2,238);
    ctx.fillStyle="#ffdf8a"; ctx.font="800 31px system-ui,Arial"; ctx.fillText(line2,w/2,330);
  });
}
function faceCenter(o,x,z,y){ o.position.set(x,y,z); o.lookAt(0,y,0); }
function addSign(root,name,title,line1,line2,x,z,y,color){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(3.6,1.65),new THREE.MeshBasicMaterial({map:signTex(title,line1,line2,color),transparent:true,side:THREE.DoubleSide}));
  m.name=name; faceCenter(m,x,z,y); root.add(m); return m;
}
function addPath(root){
  const mat=new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.32,side:THREE.DoubleSide});
  const glow=new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.20,side:THREE.DoubleSide});
  for(let i=0;i<9;i++){
    const p=new THREE.Mesh(new THREE.PlaneGeometry(.62,.92),i%2?glow:mat);
    p.name=`PHASE184_START_PATH_STEP_${i+1}`; p.rotation.x=-Math.PI/2; p.position.set(0,.075,8.8-i*.78); root.add(p);
  }
  addSign(root,"PHASE184_START_HERE_SIGN","START HERE","Walk forward to PLAY GAME","Daily chips + table select",0,9.75,2.65,"#8dffb4");
}
function addDailyBonus(root){
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.72,.86,.38,36),new THREE.MeshStandardMaterial({color:0x191124,roughness:.55,metalness:.08,emissive:0x08040d,emissiveIntensity:.18}));
  base.name="PHASE184_DAILY_BONUS_KIOSK_BASE"; base.position.set(2.9,.19,3.2); root.add(base);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.82,.035,8,64),new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.72}));
  ring.name="PHASE184_DAILY_BONUS_KIOSK_RING"; ring.position.set(2.9,.56,3.2); ring.rotation.x=Math.PI/2; root.add(ring);
  addSign(root,"PHASE184_DAILY_BONUS_SIGN","DAILY BONUS","Claim free activity chips","Freerolls + rewards",2.9,3.95,1.72,"#ffdf8a");
}
function addScorpionPortal(root){
  const a=-Math.PI/2;
  const x=-7.8,z=0;
  const mat=new THREE.MeshStandardMaterial({color:0x19050a,roughness:.62,metalness:.08,emissive:0x220005,emissiveIntensity:.35});
  const left=new THREE.Mesh(new THREE.CylinderGeometry(.22,.28,3.1,24),mat); left.name="PHASE184_SCORPION_PORTAL_COLUMN_L"; left.position.set(x,1.55,z-.9); root.add(left);
  const right=left.clone(); right.name="PHASE184_SCORPION_PORTAL_COLUMN_R"; right.position.set(x,1.55,z+.9); root.add(right);
  const top=new THREE.Mesh(new THREE.BoxGeometry(.38,.34,2.25),mat); top.name="PHASE184_SCORPION_PORTAL_TOP"; top.position.set(x,3.18,z); root.add(top);
  addSign(root,"PHASE184_SCORPION_PORTAL_SIGN","SCORPION ROOM","Biggest private room","VIP tables + events",x-.1,z,3.85,"#ff3355");
  const portal=new THREE.Mesh(new THREE.PlaneGeometry(.08,1.9),new THREE.MeshBasicMaterial({color:0xff3355,transparent:true,opacity:.33,side:THREE.DoubleSide}));
  portal.name="PHASE184_SCORPION_PORTAL_GLOW"; portal.position.set(x+.05,1.65,z); portal.rotation.y=Math.PI/2; root.add(portal);
}
function addLegendsFix(root){
  const z=-8.25;
  addSign(root,"PHASE184_LEGENDS_HEADER","SVR LEGENDS","Hall of Fame pedestals","Statues locked to floor",0,z,2.8,"#a77cff");
  const stone=new THREE.MeshStandardMaterial({color:0xd8d0c2,roughness:.72,metalness:.06});
  const gold=new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.55});
  for(let i=0;i<5;i++){
    const x=(i-2)*1.05;
    const p=new THREE.Mesh(new THREE.CylinderGeometry(.34,.45,.28,32),stone); p.name=`PHASE184_LEGENDS_PEDESTAL_${i+1}`; p.position.set(x,.14,z+.75); root.add(p);
    const statue=new THREE.Mesh(new THREE.CapsuleGeometry(.18,.82,8,16),new THREE.MeshStandardMaterial({color:0xb8b0a4,roughness:.64,metalness:.08,emissive:0x0b0906,emissiveIntensity:.08}));
    statue.name=`PHASE184_LEGENDS_MANNEQUIN_LOCKED_${i+1}`; statue.position.set(x,.86,z+.75); root.add(statue);
    const light=new THREE.Mesh(new THREE.ConeGeometry(.16,.42,24),gold); light.name=`PHASE184_LEGENDS_SPOT_${i+1}`; light.position.set(x,1.62,z+.62); light.rotation.x=Math.PI; root.add(light);
  }
}
function addHandTutorial(root){
  addSign(root,"PHASE184_HAND_TUTORIAL_SIGN","QUEST HANDS","Fist = teleport  •  Pinch = select","Knock/check + chip gestures next",-3.2,4.1,1.82,"#7ffcff");
  const pulse=new THREE.Mesh(new THREE.TorusGeometry(.58,.025,8,64),new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.48}));
  pulse.name="PHASE184_HAND_TUTORIAL_PULSE"; pulse.position.set(-3.2,1.0,3.55); pulse.rotation.x=Math.PI/2; root.add(pulse);
  root.userData.handPulse=pulse;
}
function addMoonMars(root){
  const moon=new THREE.Mesh(new THREE.SphereGeometry(1.65,48,32),new THREE.MeshStandardMaterial({color:0xd8d8ce,roughness:.78,metalness:.02,emissive:0x111827,emissiveIntensity:.14}));
  moon.name="PHASE184_BIG_ROTATING_MOON"; moon.position.set(0,12.4,-11.5); root.add(moon);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(.72,36,24),new THREE.MeshStandardMaterial({color:0xc45a36,roughness:.82,metalness:.01,emissive:0x260a04,emissiveIntensity:.25}));
  mars.name="PHASE184_SMALL_MARS_BACK_SKY"; mars.position.set(4.8,11.2,-14.2); root.add(mars);
  const light=new THREE.DirectionalLight(0xcad8ff,.55); light.name="PHASE184_MOONLIGHT_REFLECTION_DRIVER"; light.position.copy(moon.position); root.add(light);
  root.userData.moon=moon; root.userData.mars=mars; root.userData.moonLight=light;
}
export function installPhase184LobbyExperiencePolish(){
  const scene=window.__SVR_SCENE__; if(!scene) return null;
  const old=scene.getObjectByName("PHASE184_LOBBY_EXPERIENCE_POLISH_ROOT"); if(old) return old;
  scene.traverse(o=>{ const n=String(o.name||""); if(/old.*moon|fake.*moon|old.*mars|fake.*mars|picture.*sky|sky.*picture|billboard.*moon|billboard.*mars/i.test(n)) o.visible=false; });
  const root=new THREE.Group(); root.name="PHASE184_LOBBY_EXPERIENCE_POLISH_ROOT";
  addPath(root); addDailyBonus(root); addScorpionPortal(root); addLegendsFix(root); addHandTutorial(root); addMoonMars(root);
  root.userData.tick=(t)=>{
    if(root.userData.moon){ root.userData.moon.rotation.y=t*.10; const a=t*.018; root.userData.moon.position.set(Math.cos(a)*8.5,12.4,Math.sin(a)*8.5-7.5); root.userData.moonLight?.position.copy(root.userData.moon.position); }
    if(root.userData.mars){ root.userData.mars.rotation.y=t*.06; }
    if(root.userData.handPulse){ root.userData.handPulse.scale.setScalar(1+Math.sin(t*2)*.08); }
  };
  scene.add(root);
  window.SVR_PHASE184_EXPERIENCE={label:LABEL,locked:true,features:["start path","daily bonus kiosk","scorpion portal","legends pedestals","hand tutorial","moon and mars polish"],checkedAt:new Date().toISOString()};
  console.log("[Phase184] lobby experience polish active");
  return root;
}
export function autoInstallPhase184LobbyExperiencePolish(){
  const start=performance.now();
  const id=setInterval(()=>{ if(window.__SVR_SCENE__){ clearInterval(id); installPhase184LobbyExperiencePolish(); } else if(performance.now()-start>16000) clearInterval(id); },500);
}
