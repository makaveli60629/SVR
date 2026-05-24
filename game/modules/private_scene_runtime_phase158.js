import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";

const PHASE="PHASE-158-WEBXR-PRIVATE-SCENE-ROOMS-ONE-BY-ONE-LOCK";
const SCENES={
  reiki:{title:"REIKI ROOM",sub:"SVR AWAITING APPROVAL • MEDITATION TEST",color:0xb48cff,accent:0x7ff5c7,items:["BREATH PANEL","CALM PORTAL","SVR PLACEHOLDER"]},
  pga:{title:"PGA RANGE",sub:"PRIVATE DRIVE • CHIP • PUTT TEST",color:0x7ff5c7,accent:0xf6e27f,items:["STAND HERE","AIM MAT","RANGE TARGET"]},
  scorpion:{title:"SCORPION ROOM",sub:"PRIVATE POKER TABLE TEST",color:0xff5572,accent:0xb48cff,items:["ONE TABLE","PLAYER SEAT","DEALER ZONE"]},
  lounge:{title:"LOUNGE",sub:"PRIVATE SOCIAL ROOM TEST",color:0xf6e27f,accent:0xb48cff,items:["SOCIAL AREA","MEDIA OFF","PRIVATE HANGOUT"]},
  private:{title:"PRIVATE ROOM",sub:"SVR MODULAR PRIVATE SCENE",color:0xb48cff,accent:0xf6e27f,items:["MODULE READY","RETURN PORTAL","SVR"]}
};
const query=new URLSearchParams(location.search);
const key=(query.get("scene")||"private").toLowerCase();
const cfg=SCENES[key]||SCENES.private;
const LOGO_URL="../logo.png";
const ROOM=13;

const app=document.getElementById("app")||document.body;
const statusEl=document.getElementById("status"),modeEl=document.getElementById("mode"),titleEl=document.getElementById("title");
const setStatus=t=>{if(statusEl)statusEl.textContent=t;};
const setMode=t=>{if(modeEl)modeEl.textContent=t;};
if(titleEl) titleEl.textContent=cfg.title;

const debug=document.createElement("div");
debug.style.cssText="position:fixed;left:12px;top:54px;z-index:90;padding:7px 10px;border:1px solid rgba(180,140,255,.9);border-radius:12px;background:rgba(0,0,0,.82);color:#e6d7ff;font:900 12px/1.35 system-ui;white-space:pre-wrap;pointer-events:none";
debug.textContent="Phase 158 private scene booting";document.body.appendChild(debug);

const scene=new THREE.Scene();scene.background=new THREE.Color(0x03030a);
const camera=new THREE.PerspectiveCamera(64,innerWidth/innerHeight,.06,220);camera.position.set(0,1.62,0);
const dolly=new THREE.Group();dolly.name="SVR_PHASE158_PRIVATE_SCENE_DOLLY";dolly.position.set(0,0,6.6);dolly.add(camera);scene.add(dolly);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,depth:true,stencil:false,powerPreference:"high-performance"});
renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,.68));renderer.xr.enabled=true;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.NoToneMapping;
try{renderer.xr.setFramebufferScaleFactor?.(.68);renderer.xr.setFoveation?.(.30);}catch{}
app.appendChild(renderer.domElement);document.body.appendChild(VRButton.createButton(renderer,{requiredFeatures:["local-floor"],optionalFeatures:["bounded-floor"]}));

const loader=new THREE.TextureLoader();
function tex(url,rx=1,ry=1){const t=loader.load(url,undefined,undefined,()=>{});t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx,ry);t.anisotropy=4;return t;}
function canvasTex(draw,w=512,h=512){const c=document.createElement("canvas");c.width=w;c.height=h;const x=c.getContext("2d");draw(x,c);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;}
function labelTex(title,sub,color="#b48cff"){return canvasTex(x=>{x.fillStyle="rgba(0,0,0,.90)";if(x.roundRect){x.beginPath();x.roundRect(20,32,984,192,28);x.fill();}else x.fillRect(20,32,984,192);x.strokeStyle=color;x.lineWidth=9;x.strokeRect(42,50,940,156);x.fillStyle="#fff";x.font="900 62px system-ui,Arial";x.textAlign="center";x.textBaseline="middle";x.fillText(title,512,103);x.fillStyle="#e6d7ff";x.font="900 28px system-ui,Arial";x.fillText(sub,512,168);},1024,256);}
function glowTex(color){return canvasTex(x=>{const g=x.createRadialGradient(256,256,8,256,256,250);g.addColorStop(0,color);g.addColorStop(1,"rgba(0,0,0,0)");x.fillStyle=g;x.fillRect(0,0,512,512);});}
const logo=tex(LOGO_URL,1,1);logo.wrapS=THREE.ClampToEdgeWrapping;logo.wrapT=THREE.ClampToEdgeWrapping;
const logoMat=new THREE.MeshBasicMaterial({map:logo,transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false});

const floor=new THREE.Mesh(new THREE.PlaneGeometry(28,28),new THREE.MeshBasicMaterial({map:tex("./assets/texture/slate_basecolor.jpg",5,5),side:THREE.FrontSide,toneMapped:false}));floor.rotation.x=-Math.PI/2;scene.add(floor);
const wallMat=new THREE.MeshBasicMaterial({map:tex("./assets/texture/stonebrick_wall_basecolor.png",2.5,1),side:THREE.DoubleSide,toneMapped:false});
function wall(x,z,r,w=26,h=4.8){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),wallMat);m.position.set(x,h/2,z);m.rotation.y=r;scene.add(m);return m;}
wall(0,-ROOM,0);wall(0,ROOM,Math.PI);wall(ROOM,0,-Math.PI/2);wall(-ROOM,0,Math.PI/2);
const trimMat=new THREE.MeshBasicMaterial({color:cfg.color,transparent:true,opacity:.75,toneMapped:false});
function box(x,y,z,sx,sy,sz,mat=trimMat){const b=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),mat);b.position.set(x,y,z);scene.add(b);return b;}
[[-ROOM,-ROOM],[ROOM,-ROOM],[-ROOM,ROOM],[ROOM,ROOM]].forEach(([x,z])=>box(x,2.4,z,.35,4.8,.35));
const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.2,1.8),new THREE.MeshBasicMaterial({map:labelTex(cfg.title,cfg.sub,"#"+cfg.color.toString(16).padStart(6,"0")),transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));sign.position.set(0,3.1,-ROOM+.05);sign.renderOrder=20;scene.add(sign);
const brand=new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4),logoMat.clone());brand.position.set(0,1.45,-ROOM+.08);brand.renderOrder=21;scene.add(brand);

function addTextPanel(text,x,z,color=cfg.color){const p=new THREE.Mesh(new THREE.PlaneGeometry(3.6,.9),new THREE.MeshBasicMaterial({map:labelTex(text,"MODULE", "#"+color.toString(16).padStart(6,"0")),transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));p.position.set(x,1.35,z);p.lookAt(0,1.35,6.6);scene.add(p);return p;}
cfg.items.forEach((it,i)=>{const x=(i-1)*4.4;addTextPanel(it,x,-4.8+i*.5,i%2?cfg.accent:cfg.color);});

if(key==="scorpion"){
  const table=new THREE.Mesh(new THREE.CylinderGeometry(2.15,2.15,.22,64),new THREE.MeshBasicMaterial({map:tex("./assets/texture/tablefelt.png"),toneMapped:false}));table.position.set(0,.55,0);scene.add(table);
  const ring=new THREE.Mesh(new THREE.RingGeometry(2.45,2.58,72),new THREE.MeshBasicMaterial({color:cfg.color,transparent:true,opacity:.62,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.05;scene.add(ring);
}else if(key==="pga"){
  const mat=new THREE.MeshBasicMaterial({color:0x2a7d32,transparent:true,opacity:.75,toneMapped:false});
  const range=new THREE.Mesh(new THREE.PlaneGeometry(7,10),mat);range.rotation.x=-Math.PI/2;range.position.set(0,.025,-3);scene.add(range);
  const ball=new THREE.Mesh(new THREE.SphereGeometry(.12,18,12),new THREE.MeshBasicMaterial({color:0xffffff,toneMapped:false}));ball.position.set(0,.18,1.2);scene.add(ball);
}else if(key==="reiki"){
  const orb=new THREE.Mesh(new THREE.SphereGeometry(.95,28,18),new THREE.MeshBasicMaterial({color:cfg.color,transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}));orb.position.set(0,1.5,-2);scene.add(orb);
}else if(key==="lounge"){
  for(let i=0;i<4;i++){const seat=new THREE.Mesh(new THREE.BoxGeometry(1.2,.35,1.2),new THREE.MeshBasicMaterial({color:i%2?cfg.color:cfg.accent,transparent:true,opacity:.65,toneMapped:false}));seat.position.set((i-1.5)*2,.25,-1.8);scene.add(seat);}
}
const returnPad=new THREE.Group();returnPad.name="SVR_PHASE158_RETURN_PORTAL";returnPad.position.set(0,.07,8.4);scene.add(returnPad);
const returnRing=new THREE.Mesh(new THREE.RingGeometry(.9,1.28,72),new THREE.MeshBasicMaterial({color:0xf6e27f,transparent:true,opacity:.92,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));returnRing.rotation.x=-Math.PI/2;returnPad.add(returnRing);
const returnLogo=new THREE.Mesh(new THREE.CircleGeometry(.78,48),logoMat.clone());returnLogo.rotation.x=-Math.PI/2;returnLogo.position.y=.012;returnPad.add(returnLogo);
const retSign=new THREE.Mesh(new THREE.PlaneGeometry(3.2,.8),new THREE.MeshBasicMaterial({map:labelTex("RETURN","LOBBY","#f6e27f"),transparent:true,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));retSign.position.set(0,1.25,0);retSign.lookAt(0,1.25,6.6);returnPad.add(retSign);

const targetGroup=new THREE.Group();targetGroup.visible=false;scene.add(targetGroup);
const targetLogo=new THREE.Mesh(new THREE.CircleGeometry(.90,72),logoMat.clone());targetLogo.rotation.x=-Math.PI/2;targetLogo.renderOrder=1200;targetGroup.add(targetLogo);
const targetRing=new THREE.Mesh(new THREE.RingGeometry(1.04,1.45,80),new THREE.MeshBasicMaterial({color:cfg.color,transparent:true,opacity:1,depthTest:false,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));targetRing.rotation.x=-Math.PI/2;targetRing.position.y=.018;targetRing.renderOrder=1201;targetGroup.add(targetRing);
const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(),new THREE.Vector3(0,0,-1)]),new THREE.LineBasicMaterial({color:0xe6d7ff,transparent:true,opacity:1,depthTest:false,depthWrite:false}));line.visible=false;line.renderOrder=1202;scene.add(line);
scene.add(new THREE.HemisphereLight(0xffffff,0x111122,.9));

let rc=null,gp=null,armed=false,armedBy="none",valid=false,cd=0,selectHeld=false,snapCd=0,returnHover=false,stickPair="none",aimMode="none";
for(let i=0;i<2;i++){const c=renderer.xr.getController(i);c.visible=false;dolly.add(c);c.addEventListener("connected",e=>{c.inputSource=e.data;if(e.data?.handedness==="right"){rc=c;gp=e.data.gamepad||null;setStatus("Right controller connected");}});c.addEventListener("selectstart",()=>{if(c!==rc)return;selectHeld=true;arm("trigger");});c.addEventListener("selectend",()=>{if(c!==rc)return;selectHeld=false;if(armed&&valid)commit("selectend");disarm();});c.addEventListener("squeezestart",()=>{if(c!==rc)return;arm("grip-preview");});c.addEventListener("squeezeend",()=>{if(c!==rc)return;if(armedBy==="grip-preview"&&!selectHeld)disarm();});}
const origin=new THREE.Vector3(),dirA=new THREE.Vector3(),dirB=new THREE.Vector3(),rawP=new THREE.Vector3(),invP=new THREE.Vector3(),fallback=new THREE.Vector3(),camPos=new THREE.Vector3(),camFwd=new THREE.Vector3(),finalP=new THREE.Vector3(),head=new THREE.Vector3(),head2=new THREE.Vector3(),mv=new THREE.Vector3();
let last=performance.now(),acc=0,samples=0,worst=0,report=performance.now(),tw=false,gw=false,t0=0;
function getGP(){return gp||rc?.inputSource?.gamepad;}function button(i){return getGP()?.buttons?.[i]?.value||0;}function axes(){return getGP()?.axes||[];}function dz(v){return Math.abs(v)<.14?0:v;}function xrCam(){return renderer.xr.isPresenting?renderer.xr.getCamera(camera):camera;}
function stick(){const a=axes(),p0={x:dz(a[0]||0),y:dz(a[1]||0),n:"01"},p1={x:dz(a[2]||0),y:dz(a[3]||0),n:"23"};const s=Math.hypot(p1.x,p1.y)>Math.hypot(p0.x,p0.y)?p1:p0;stickPair=s.n;return s;}function clamp(){dolly.position.x=THREE.MathUtils.clamp(dolly.position.x,-11.8,11.8);dolly.position.z=THREE.MathUtils.clamp(dolly.position.z,-11.8,11.8);}function headingForward(){mv.set(-Math.sin(dolly.rotation.y),0,-Math.cos(dolly.rotation.y)).normalize();return mv;}
function arm(k){if(performance.now()<cd)return;armed=true;armedBy=k;setStatus(k==="grip-preview"?"Grip preview only":"Trigger aiming");}function disarm(){armed=false;armedBy="none";valid=false;targetGroup.visible=false;line.visible=false;}
function snap(a){const x=xrCam();x.getWorldPosition(head);dolly.rotation.y+=a;dolly.updateMatrixWorld(true);x.getWorldPosition(head2);dolly.position.x+=head.x-head2.x;dolly.position.z+=head.z-head2.z;clamp();setStatus(a>0?"Snap right 45":"Snap left 45");}
function move(dt){if(!renderer.xr.isPresenting||armed)return;const s=stick(),ax=Math.abs(s.x),ay=Math.abs(s.y),now=performance.now();if(ax>.72&&ax>ay*1.35&&now>snapCd){snap(Math.sign(s.x)*-SNAP);snapCd=now+420;return;}if(ay>.14){dolly.position.addScaledVector(headingForward(),-s.y*dt*1.55);clamp();}}
function floorHit(o,d,out){if(Math.abs(d.y)<.035)return false;const t=-o.y/d.y;if(!isFinite(t)||t<.08||t>13)return false;out.copy(o).addScaledVector(d,t);out.y=0;return true;}function score(p){const vx=p.x-camPos.x,vz=p.z-camPos.z,front=vx*camFwd.x+vz*camFwd.z,dist=Math.hypot(vx,vz);return front<-.25?-9999:front*2-Math.abs(dist-4.2)*.25;}
function computeTarget(){const x=xrCam();x.getWorldPosition(camPos);x.getWorldDirection(camFwd);camFwd.y=0;if(camFwd.lengthSq()<.001)camFwd.copy(headingForward());camFwd.normalize();fallback.copy(camPos).addScaledVector(camFwd,4.2).setY(0);if(!rc){finalP.copy(fallback);aimMode="fallback";}else{rc.updateWorldMatrix(true,false);rc.getWorldPosition(origin);rc.getWorldDirection(dirA);dirA.normalize();dirB.copy(dirA).multiplyScalar(-1);const okA=floorHit(origin,dirA,rawP),okB=floorHit(origin,dirB,invP),scA=okA?score(rawP):-9999,scB=okB?score(invP):-9999;if(scA>=scB&&okA){finalP.copy(rawP);aimMode="raw";}else if(okB){finalP.copy(invP);aimMode="inverted";}else{finalP.copy(fallback);aimMode="fallback";}}const vx=finalP.x-camPos.x,vz=finalP.z-camPos.z;if(vx*camFwd.x+vz*camFwd.z<.35){finalP.copy(fallback);aimMode+="+front-correct";}finalP.x=THREE.MathUtils.clamp(finalP.x,-11.8,11.8);finalP.z=THREE.MathUtils.clamp(finalP.z,-11.8,11.8);finalP.y=0;valid=true;returnHover=Math.hypot(finalP.x,finalP.z-8.4)<1.45;returnRing.material.opacity=returnHover?1:.65;returnLogo.material.opacity=returnHover?1:.75;return true;}
function showTarget(){if(!computeTarget())return;targetGroup.visible=true;line.visible=true;targetGroup.position.set(finalP.x,.074,finalP.z);const p=line.geometry.attributes.position;p.setXYZ(0,origin.x||camPos.x,origin.y||1.2,origin.z||camPos.z);p.setXYZ(1,finalP.x,.16,finalP.z);p.needsUpdate=true;}
function commit(reason){if(performance.now()<cd||!valid)return;cd=performance.now()+850;if(returnHover){setStatus("Returning to lobby");location.href="./?v=phase158-private-rooms";return;}const x=xrCam();x.getWorldPosition(head);dolly.position.x+=finalP.x-head.x;dolly.position.z+=finalP.z-head.z;clamp();setStatus("Teleported");window.SVR_PHASE158_LAST_TELEPORT={scene:key,reason,aimMode,target:{x:finalP.x,z:finalP.z},at:new Date().toISOString()};}
function input(){const tr=button(0),gr=button(1);if(tr>.18&&!tw){t0=performance.now();arm("trigger");}if(tw&&tr<=.10){if(performance.now()-t0>90&&armed&&valid)commit("trigger-release");if(armedBy!=="grip-preview")disarm();}if(gr>.25&&!gw)arm("grip-preview");if(gw&&gr<=.12&&!selectHeld&&armedBy==="grip-preview")disarm();tw=tr>.18;gw=gr>.25;}

addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
renderer.xr.addEventListener("sessionstart",()=>{setStatus("Phase 158 private room ready");setMode(cfg.title);});
renderer.setAnimationLoop(()=>{const now=performance.now(),dt=Math.min((now-last)/1000,.05);last=now;move(dt);input();if(armed)showTarget();returnRing.rotation.z+=dt*.45;acc+=dt;samples++;worst=Math.max(worst,dt*1000);if(now-report>1000){const fps=(1/Math.max(acc/samples,.001)).toFixed(1);debug.textContent=`PHASE 158 PRIVATE ROOM\nScene ${key.toUpperCase()} • FPS ${fps} • worst ${worst.toFixed(0)}ms\nDolly ${dolly.position.x.toFixed(2)}, ${dolly.position.z.toFixed(2)} • Yaw ${(THREE.MathUtils.radToDeg(dolly.rotation.y)%360).toFixed(0)}\nStick axes${stickPair}\nAim ${aimMode}\nReturn ${returnHover?"ready":"none"}`;acc=0;samples=0;worst=0;report=now;}renderer.render(scene,camera);});
window.SVR_PHASE158_PRIVATE_SCENE={phase:PHASE,scene:key,officialLogo:LOGO_URL,noMusic:true,worldMoved:false,referenceSpaceMutated:false,returnRoute:"./?v=phase158-private-rooms",nextBuild:"PHASE-159-SCORPION-ROOM-GAMEPLAY-FIRST"};
setStatus("Phase 158 ready");setMode(cfg.title);
