import * as THREE from "three";
const LABEL="PHASE-299-STOREFRONT-WALKUP-ACTIVATION-LOCK";
const DATA=[
 ["reiki","REIKI HUB","The Zen Den","meditation-room",-12,-16.02,0xb55cff],
 ["pga","PGA GOLF","Training Hub","driving-range",-6,-16.02,0x7ffcff],
 ["play","PLAY GAME","Table Select","table-select",0,-16.02,0xffd98a],
 ["store","SVR STORE","Official Store","store-preview",6,-16.02,0x8dffb4],
 ["scorpion","SCORPION","VIP Room","private-room",12,-16.02,0xff5b8c],
 ["theater","THEATER","Vibes Lounge","theater-lounge",15.75,5.8,0xa77cff]
];
let lastKey="", lastAt=0;
function labelTexture(title,sub,color){
 const c=document.createElement("canvas"),ctx=c.getContext("2d"); c.width=768;c.height=384;
 ctx.fillStyle="#03050c";ctx.fillRect(0,0,c.width,c.height);
 ctx.strokeStyle=`#${color.toString(16).padStart(6,"0")}`;ctx.lineWidth=10;ctx.strokeRect(20,20,728,344);
 ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=3;ctx.strokeRect(48,48,672,288);
 ctx.textAlign="center";ctx.textBaseline="middle";
 ctx.fillStyle="#fff";ctx.font="900 58px system-ui,Arial";ctx.fillText(title,384,132);
 ctx.fillStyle=`#${color.toString(16).padStart(6,"0")}`;ctx.font="800 34px system-ui,Arial";ctx.fillText(sub,384,228);
 ctx.fillStyle="#e8f4ff";ctx.font="700 24px system-ui,Arial";ctx.fillText("walk up / select",384,300);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function firePortal(key,label,target,source="manual"){
 const now=performance.now();
 if(source==="walkup" && key===lastKey && now-lastAt<6500) return null;
 lastKey=key; lastAt=now;
 const payload={key,label,target,source,build:LABEL,activatedAt:new Date().toISOString()};
 window.SVR_PHASE299_LAST_STOREFRONT_PORTAL=payload;
 window.SVR_PHASE298_LAST_STOREFRONT_PORTAL=payload;
 try{window.dispatchEvent(new CustomEvent("svr-portal-selected",{detail:payload}));}catch{}
 const status=document.getElementById("status"); if(status) status.textContent=`${label} portal selected: ${target}`;
 return payload;
}
function installKeys(){
 if(window.__SVR_PHASE299_KEYS__) return; window.__SVR_PHASE299_KEYS__=true;
 const map={Digit1:DATA[1],Digit2:DATA[0],Digit3:DATA[2],Digit4:DATA[3],Digit5:DATA[4],Digit6:DATA[5]};
 window.addEventListener("keydown",e=>{const d=map[e.code]; if(d) firePortal(d[0],d[1],d[3],"keyboard");});
}
function installClick(scene,camera){
 if(window.__SVR_PHASE299_POINTER__) return; window.__SVR_PHASE299_POINTER__=true;
 const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
 window.addEventListener("pointerdown",e=>{const renderer=window.__SVR_RENDERER__, canvas=renderer?.domElement||document.querySelector("canvas"); if(!canvas||!camera)return; const r=canvas.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(pointer,camera); const hit=ray.intersectObjects(scene.children,true).find(h=>h.object?.userData?.phase299Portal)?.object; if(hit) firePortal(hit.userData.portalKey,hit.userData.portalLabel,hit.userData.portalTarget,"pointer");},{passive:true});
}
function getHeadXZ(){
 const renderer=window.__SVR_RENDERER__, camera=window.__SVR_CAMERA__; if(!camera) return null;
 const p=new THREE.Vector3();
 try{ if(renderer?.xr?.isPresenting){ renderer.xr.getCamera(camera).getWorldPosition(p); return p; } }catch{}
 camera.getWorldPosition(p); return p;
}
function checkWalkup(){
 const scene=window.__SVR_SCENE__; if(!scene) return;
 const p=getHeadXZ(); if(!p) return;
 const pads=[]; scene.traverse(o=>{ if(o?.userData?.phase299PortalPad) pads.push(o); });
 let best=null,bestD=1.55;
 pads.forEach(o=>{ const q=new THREE.Vector3(); o.getWorldPosition(q); const d=Math.hypot(p.x-q.x,p.z-q.z); if(d<bestD){bestD=d;best=o;} });
 if(best) firePortal(best.userData.portalKey,best.userData.portalLabel,best.userData.portalTarget,"walkup");
}
function apply(){
 const scene=window.__SVR_SCENE__; if(!scene) return false; const camera=window.__SVR_CAMERA__||scene.userData?._camera||null;
 const old=scene.getObjectByName("PHASE298_STOREFRONT_PORTAL_ROOT"); if(old) old.parent?.remove(old);
 const old2=scene.getObjectByName("PHASE297_READABLE_STOREFRONT_ROOT"); if(old2) old2.parent?.remove(old2);
 const root=new THREE.Group(); root.name="PHASE299_STOREFRONT_WALKUP_ROOT"; scene.add(root);
 DATA.forEach((d,i)=>{const [key,title,sub,target,x,z,color]=d; const g=new THREE.Group(); g.name=`PHASE299_FRONT_${key.toUpperCase()}`; g.position.set(x,0,z); if(i===5) g.rotation.y=-Math.PI/2; root.add(g);
 const back=new THREE.Mesh(new THREE.BoxGeometry(3.9,2.05,.08),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.35,side:THREE.DoubleSide})); back.position.y=2.65; g.add(back);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.55,1.72),new THREE.MeshBasicMaterial({map:labelTexture(title,sub,color),transparent:true,side:THREE.DoubleSide,depthWrite:false})); sign.position.set(0,2.68,.05); sign.renderOrder=190; sign.userData.phase299Portal=true; sign.userData.portalKey=key; sign.userData.portalLabel=title; sign.userData.portalTarget=target; g.add(sign);
 const pad=new THREE.Mesh(new THREE.RingGeometry(.78,1.04,72),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.62,side:THREE.DoubleSide})); pad.name=`PHASE299_${key.toUpperCase()}_WALKUP_PAD`; pad.rotation.x=-Math.PI/2; pad.position.set(0,.045,1.72); pad.userData.phase299Portal=true; pad.userData.phase299PortalPad=true; pad.userData.portalKey=key; pad.userData.portalLabel=title; pad.userData.portalTarget=target; g.add(pad);});
 installKeys(); installClick(scene,camera);
 if(!window.__SVR_PHASE299_WALKUP_TIMER__){ window.__SVR_PHASE299_WALKUP_TIMER__=setInterval(checkWalkup,650); }
 window.SVR_PHASE299_STOREFRONT_WALKUP_ACTIVATION_LOCK={build:LABEL,active:true,count:DATA.length,walkupRadius:1.55,siteTouched:false,publicRootTouched:false,keys:"1 PGA / 2 Reiki / 3 Play / 4 Store / 5 Scorpion / 6 Theater",checkedAt:new Date().toISOString()};
 window.SVR_LIVE_BUILD_POINTER=LABEL; window.SVR_LOCKED_FINAL_BUILD=LABEL; return true;
}
apply(); let n=0; const t=setInterval(()=>{n++; if(apply()||n>90) clearInterval(t);},250);
