import * as THREE from "three";
import { applyPhase141VisiblePlanetsProfessionalStorefront } from "./phase141_visible_planets_professional_storefront.js";

function makeTex(kind){
  const c=document.createElement('canvas'); c.width=1024; c.height=512; const x=c.getContext('2d');
  if(kind==='earth'){
    const g=x.createLinearGradient(0,0,1024,512); g.addColorStop(0,'#167ad1'); g.addColorStop(.55,'#0b448c'); g.addColorStop(1,'#05143e'); x.fillStyle=g; x.fillRect(0,0,1024,512);
    [[130,160,120,55,-.2],[310,260,100,60,.4],[550,190,170,75,-.3],[720,330,125,62,.2],[890,150,100,46,.1]].forEach((p,i)=>{x.fillStyle=i%2?'#3daa59':'#6ac477';x.beginPath();x.ellipse(...p,0,Math.PI*2);x.fill();});
    x.fillStyle='rgba(255,255,255,.28)'; for(let i=0;i<20;i++){x.beginPath();x.ellipse((i*83+40)%1024,50+(i*57)%410,85+(i%4)*20,12+(i%3)*7,i*.3,0,Math.PI*2);x.fill();}
  } else if(kind==='moon'){
    x.fillStyle='#dddddf'; x.fillRect(0,0,1024,512); for(let i=0;i<70;i++){x.fillStyle='rgba(55,58,70,.22)';x.beginPath();x.arc((i*89)%1024,(i*53)%512,8+(i%8)*5,0,Math.PI*2);x.fill();}
  } else {
    const g=x.createLinearGradient(0,0,1024,512); g.addColorStop(0,'#7d2b1a'); g.addColorStop(.5,'#c86b3e'); g.addColorStop(1,'#ef985e'); x.fillStyle=g; x.fillRect(0,0,1024,512);
    x.fillStyle='rgba(74,18,8,.38)'; for(let i=0;i<45;i++){x.beginPath();x.ellipse((i*83)%1024,(i*47)%512,35+(i%6)*16,10+(i%5)*7,i*.34,0,Math.PI*2);x.fill();}
  }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
function addPlanets(scene){
  if(scene.userData.phase142Planets) return scene.userData.phase142Planets;
  ['_phase141ShowcasePlanets','_phase140Planets','_phase137StablePlanets','_phase136Solar'].forEach(k=>{if(scene.userData[k]?.group)scene.userData[k].group.visible=false;});
  const g=new THREE.Group(); g.name='PHASE142 BIG VISIBLE PLANETS NORTH SKY'; scene.add(g);
  const earth=new THREE.Mesh(new THREE.SphereGeometry(34,72,40),new THREE.MeshStandardMaterial({map:makeTex('earth'),roughness:.6,emissive:0x06172f,emissiveIntensity:.12}));
  const moon=new THREE.Mesh(new THREE.SphereGeometry(10,48,28),new THREE.MeshStandardMaterial({map:makeTex('moon'),roughness:.9}));
  const mars=new THREE.Mesh(new THREE.SphereGeometry(13,48,28),new THREE.MeshStandardMaterial({map:makeTex('mars'),roughness:.78}));
  const light=new THREE.PointLight(0xc7e6ff,1.8,520,1.55); g.add(earth,moon,mars,light);
  const state={group:g,update(dt=0){g.visible=true;earth.visible=moon.visible=mars.visible=true;const t=performance.now()*.001;const eo=t*.0025;earth.position.set(Math.cos(eo)*62,56,-94+Math.sin(eo)*18);earth.rotation.y+=dt*.018;const mo=t*.018;moon.position.set(earth.position.x+Math.cos(mo)*56,earth.position.y+13,earth.position.z+Math.sin(mo)*40);moon.rotation.y+=dt*.025;const ma=t*.010,md=90+Math.sin(t*.012)*40;mars.position.set(earth.position.x+Math.cos(ma)*md,earth.position.y+23,earth.position.z+Math.sin(ma)*md*.62);mars.rotation.y+=dt*.022;light.position.copy(earth.position);scene.traverse(o=>{if((o.isLine||o.type==='LineLoop')&&o.position?.y>20)o.visible=false;});}};
  scene.userData.phase142Planets=state; return state;
}
function texSign(title){const c=document.createElement('canvas');c.width=1200;c.height=520;const x=c.getContext('2d');x.fillStyle='#02070a';x.fillRect(0,0,1200,520);x.strokeStyle='#7dfff0';x.lineWidth=16;x.strokeRect(24,24,1152,472);x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.font='900 78px system-ui';x.fillText(title,600,130);x.fillStyle='#dffff8';x.font='800 40px system-ui';x.fillText('Professional glass wellness storefront',600,240);x.fillText('Interactive hologram meditation portal',600,300);x.fillStyle='rgba(220,0,34,.36)';x.fillRect(335,390,530,70);x.strokeStyle='#ff2b49';x.lineWidth=5;x.strokeRect(335,390,530,70);x.fillStyle='#ffd8de';x.font='900 32px system-ui';x.fillText('AWAITING APPROVAL',600,425);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function getReiki(result,scene){return result?.group||scene.userData?._phase136Reiki?.group||scene.userData?._phase135ReikiWallAligned?.group||null;}
function remodelReiki(group){
  if(!group||group.userData.phase142Remodel)return;
  const teal=new THREE.MeshStandardMaterial({color:0x7dfff0,roughness:.18,metalness:.52,emissive:0x16b8a8,emissiveIntensity:.85});
  const black=new THREE.MeshStandardMaterial({color:0x020508,roughness:.78,metalness:.10,emissive:0x020b0d,emissiveIntensity:.35});
  const glass=new THREE.MeshStandardMaterial({color:0xbffff8,transparent:true,opacity:.24,roughness:.02,metalness:.14,emissive:0x0c3d38,emissiveIntensity:.22,side:THREE.DoubleSide,depthWrite:false});
  const gold=new THREE.MeshStandardMaterial({color:0xd9b45f,roughness:.22,metalness:.82}); const red=new THREE.MeshStandardMaterial({color:0xb30522,roughness:.46,emissive:0x5a030d,emissiveIntensity:.4});
  const back=new THREE.Mesh(new THREE.BoxGeometry(13.6,6.2,.22),black);back.position.set(0,3.05,.02);group.add(back);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.7,1.18),new THREE.MeshBasicMaterial({map:texSign('TRUEITIVE REIKI'),transparent:true,side:THREE.DoubleSide,depthWrite:false}));sign.position.set(0,5.48,.42);group.add(sign);
  [-4.55,0,4.55].forEach(x=>{const p=new THREE.Mesh(new THREE.PlaneGeometry(3.1,4.75),glass);p.position.set(x,3.03,.31);group.add(p);});
  [[0,6.1,.34,13.9,.18,.26],[-6.9,3.05,.34,.18,6.05,.26],[6.9,3.05,.34,.18,6.05,.26],[0,.22,.34,13.6,.14,.24]].forEach(v=>{const m=new THREE.Mesh(new THREE.BoxGeometry(v[3],v[4],v[5]),teal);m.position.set(v[0],v[1],v[2]);group.add(m);});
  const carpet=new THREE.Mesh(new THREE.PlaneGeometry(2.85,13.8),new THREE.MeshStandardMaterial({color:0x9e071f,roughness:.7,emissive:0x33030a,emissiveIntensity:.2,side:THREE.DoubleSide}));carpet.rotation.x=-Math.PI/2;carpet.position.set(0,.052,5.35);group.add(carpet);
  const zs=[-.2,1.35,3.05,4.85,6.75,8.75,10.85];for(const side of[-1,1]){const pts=[];zs.forEach(z=>{const x=side*1.78;const pole=new THREE.Group();pole.position.set(x,0,z);group.add(pole);const base=new THREE.Mesh(new THREE.CylinderGeometry(.25,.36,.12,34),gold);base.position.y=.06;pole.add(base);const stem=new THREE.Mesh(new THREE.CylinderGeometry(.055,.07,1.09,30),gold);stem.position.y=.59;pole.add(stem);const cap=new THREE.Mesh(new THREE.SphereGeometry(.18,30,20),gold);cap.position.y=1.18;pole.add(cap);pts.push(new THREE.Vector3(x,.99,z));});for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],mid=a.clone().lerp(b,.5);mid.y-=.28;group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a,mid,b]),40,.056,20,false),red));}}
  group.userData.phase142Remodel=true;
}
export async function applyPhase142QuickLobbyRemodel(args={}){const result=await applyPhase141VisiblePlanetsProfessionalStorefront(args);const scene=args.scene;if(!scene)return result;const planets=addPlanets(scene);remodelReiki(getReiki(result,scene));if(!scene.userData.phase142Tick){const old=scene.userData._tickWorld;scene.userData._tickWorld=dt=>{old?.(dt);planets.update(dt);};scene.userData.phase142Tick=true;}args.setStatus?.('Phase 142 remodel active: planets are big in north sky',{force:true});return {...result,phase142Planets:planets};}
