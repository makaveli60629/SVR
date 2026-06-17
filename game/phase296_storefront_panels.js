import * as THREE from "three";
const LABEL="PHASE-298-STOREFRONT-PORTAL-TARGET-LOCK";
const DATA=[
 ["reiki","REIKI HUB","The Zen Den","meditation-room",-12,-16.02,0xb55cff],
 ["pga","PGA GOLF","Training Hub","driving-range",-6,-16.02,0x7ffcff],
 ["play","PLAY GAME","Table Select","table-select",0,-16.02,0xffd98a],
 ["store","SVR STORE","Official Store","store-preview",6,-16.02,0x8dffb4],
 ["scorpion","SCORPION","VIP Room","private-room",12,-16.02,0xff5b8c],
 ["theater","THEATER","Vibes Lounge","theater-lounge",15.75,5.8,0xa77cff]
];
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
function firePortal(key,label,target){
 const payload={key,label,target,build:LABEL,activatedAt:new Date().toISOString()};
 window.SVR_PHASE298_LAST_STOREFRONT_PORTAL=payload;
 try{window.dispatchEvent(new CustomEvent("svr-portal-selected",{detail:payload}));}catch{}
 const status=document.getElementById("status"); if(status) status.textContent=`${label} portal selected: ${target}`;
 return payload;
}
function installKeys(){
 if(window.__SVR_PHASE298_KEYS__) return; window.__SVR_PHASE298_KEYS__=true;
 const map={Digit1:DATA[1],Digit2:DATA[0],Digit3:DATA[2],Digit4:DATA[3],Digit5:DATA[4],Digit6:DATA[5]};
 window.addEventListener("keydown",e=>{const d=map[e.code]; if(d) firePortal(d[0],d[1],d[3]);});
}
function installClick(scene,camera){
 if(window.__SVR_PHASE298_POINTER__) return; window.__SVR_PHASE298_POINTER__=true;
 const ray=new THREE.Raycaster(), pointer=new THREE.Vector2();
 window.addEventListener("pointerdown",e=>{const renderer=window.__SVR_RENDERER__, canvas=renderer?.domElement||document.querySelector("canvas"); if(!canvas||!camera)return; const r=canvas.getBoundingClientRect(); pointer.x=((e.clientX-r.left)/r.width)*2-1; pointer.y=-((e.clientY-r.top)/r.height)*2+1; ray.setFromCamera(pointer,camera); const hit=ray.intersectObjects(scene.children,true).find(h=>h.object?.userData?.phase298Portal)?.object; if(hit) firePortal(hit.userData.portalKey,hit.userData.portalLabel,hit.userData.portalTarget);},{passive:true});
}
function apply(){
 const scene=window.__SVR_SCENE__; if(!scene) return false; const camera=window.__SVR_CAMERA__||scene.userData?._camera||null;
 const old=scene.getObjectByName("PHASE297_READABLE_STOREFRONT_ROOT"); if(old) old.parent?.remove(old);
 const root=new THREE.Group(); root.name="PHASE298_STOREFRONT_PORTAL_ROOT"; scene.add(root);
 DATA.forEach((d,i)=>{const [key,title,sub,target,x,z,color]=d; const g=new THREE.Group(); g.name=`PHASE298_FRONT_${key.toUpperCase()}`; g.position.set(x,0,z); if(i===5) g.rotation.y=-Math.PI/2; root.add(g);
 const back=new THREE.Mesh(new THREE.BoxGeometry(3.9,2.05,.08),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.35,side:THREE.DoubleSide})); back.position.y=2.65; g.add(back);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.55,1.72),new THREE.MeshBasicMaterial({map:labelTexture(title,sub,color),transparent:true,side:THREE.DoubleSide,depthWrite:false})); sign.position.set(0,2.68,.05); sign.renderOrder=185; sign.userData.phase298Portal=true; sign.userData.portalKey=key; sign.userData.portalLabel=title; sign.userData.portalTarget=target; g.add(sign);
 const pad=new THREE.Mesh(new THREE.RingGeometry(.78,1.04,72),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.62,side:THREE.DoubleSide})); pad.name=`PHASE298_${key.toUpperCase()}_PORTAL_PAD`; pad.rotation.x=-Math.PI/2; pad.position.set(0,.045,1.72); pad.userData.phase298Portal=true; pad.userData.portalKey=key; pad.userData.portalLabel=title; pad.userData.portalTarget=target; g.add(pad);});
 installKeys(); installClick(scene,camera);
 window.SVR_PHASE298_STOREFRONT_PORTAL_TARGET_LOCK={build:LABEL,active:true,count:DATA.length,siteTouched:false,publicRootTouched:false,keys:"1 PGA / 2 Reiki / 3 Play / 4 Store / 5 Scorpion / 6 Theater",checkedAt:new Date().toISOString()};
 window.SVR_LIVE_BUILD_POINTER=LABEL; window.SVR_LOCKED_FINAL_BUILD=LABEL; return true;
}
apply(); let n=0; const t=setInterval(()=>{n++; if(apply()||n>90) clearInterval(t);},250);
