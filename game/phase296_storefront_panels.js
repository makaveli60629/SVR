import * as THREE from "three";
const LABEL="PHASE-297-STOREFRONT-READABLE-SIGN-LOCK";
const DATA=[
 ["REIKI HUB","The Zen Den",-12,-16.02,0xb55cff],
 ["PGA GOLF","Training Hub",-6,-16.02,0x7ffcff],
 ["PLAY GAME","Table Select",0,-16.02,0xffd98a],
 ["SVR STORE","Official Store",6,-16.02,0x8dffb4],
 ["SCORPION","VIP Room",12,-16.02,0xff5b8c],
 ["THEATER","Vibes Lounge",15.75,5.8,0xa77cff]
];
function labelTexture(title,sub,color){
 const c=document.createElement("canvas"),ctx=c.getContext("2d"); c.width=768;c.height=384;
 ctx.fillStyle="#03050c";ctx.fillRect(0,0,c.width,c.height);
 ctx.strokeStyle=`#${color.toString(16).padStart(6,"0")}`;ctx.lineWidth=10;ctx.strokeRect(20,20,728,344);
 ctx.strokeStyle="rgba(255,255,255,.18)";ctx.lineWidth=3;ctx.strokeRect(48,48,672,288);
 ctx.textAlign="center";ctx.textBaseline="middle";
 ctx.fillStyle="#fff";ctx.font="900 58px system-ui,Arial";ctx.fillText(title,384,142);
 ctx.fillStyle=`#${color.toString(16).padStart(6,"0")}`;ctx.font="800 34px system-ui,Arial";ctx.fillText(sub,384,242);
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t;
}
function apply(){
 const scene=window.__SVR_SCENE__; if(!scene) return false;
 const old=scene.getObjectByName("PHASE297_READABLE_STOREFRONT_ROOT"); if(old) old.parent?.remove(old);
 const root=new THREE.Group(); root.name="PHASE297_READABLE_STOREFRONT_ROOT"; scene.add(root);
 DATA.forEach((d,i)=>{const [title,sub,x,z,color]=d; const g=new THREE.Group(); g.name=`PHASE297_READABLE_FRONT_${i+1}`; g.position.set(x,0,z); if(i===5) g.rotation.y=-Math.PI/2; root.add(g);
 const back=new THREE.Mesh(new THREE.BoxGeometry(3.9,2.05,.08),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.35,side:THREE.DoubleSide})); back.position.y=2.65; g.add(back);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.55,1.72),new THREE.MeshBasicMaterial({map:labelTexture(title,sub,color),transparent:true,side:THREE.DoubleSide,depthWrite:false})); sign.position.set(0,2.68,.05); sign.renderOrder=180; g.add(sign);
 const pad=new THREE.Mesh(new THREE.RingGeometry(.75,1.0,72),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.55,side:THREE.DoubleSide})); pad.rotation.x=-Math.PI/2; pad.position.set(0,.045,1.72); g.add(pad);});
 window.SVR_PHASE297_STOREFRONT_READABLE_SIGN_LOCK={build:LABEL,active:true,count:DATA.length,siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
 window.SVR_LIVE_BUILD_POINTER=LABEL; window.SVR_LOCKED_FINAL_BUILD=LABEL; return true;
}
apply(); let n=0; const t=setInterval(()=>{n++; if(apply()||n>90) clearInterval(t);},250);
