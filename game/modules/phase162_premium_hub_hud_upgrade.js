import * as THREE from "three";

function makeTexture(w,h,draw){
  const c=document.createElement("canvas"); c.width=w; c.height=h; const ctx=c.getContext("2d");
  draw(ctx,w,h); const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}
function buttonTexture(label, accent="#00ff66", gold="#ffd700"){
  return makeTexture(1100,280,(ctx,w,h)=>{
    const bg=ctx.createLinearGradient(0,0,w,h); bg.addColorStop(0,"rgba(3,9,12,.96)"); bg.addColorStop(.55,"rgba(4,24,18,.94)"); bg.addColorStop(1,"rgba(16,10,4,.94)");
    ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle=accent; ctx.lineWidth=16; ctx.strokeRect(18,18,w-36,h-36);
    ctx.strokeStyle=gold; ctx.lineWidth=6; ctx.strokeRect(50,50,w-100,h-100);
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.shadowColor=gold; ctx.shadowBlur=18;
    ctx.fillStyle="#fff"; ctx.font="900 72px system-ui,Arial"; ctx.fillText(label,w/2,h/2,w-110);
  });
}
function makeSlate(width,height,accent=0x00ff66,gold=0xffd700){
  const group=new THREE.Group(); group.name="PHASE162 PREMIUM HOLOGRAPHIC GLASS SLATE";
  const glass=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshPhysicalMaterial({color:0x07090a,metalness:.82,roughness:.14,transparent:true,opacity:.74,transmission:.18,ior:1.5,clearcoat:1,clearcoatRoughness:.08,side:THREE.DoubleSide,depthWrite:false}));
  glass.userData.phase162PremiumHud=true;
  const edge=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(width,height)),new THREE.LineBasicMaterial({color:accent,transparent:true,opacity:.94,blending:THREE.AdditiveBlending})); edge.position.z=.007;
  const halo=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(width+.08,height+.08)),new THREE.LineBasicMaterial({color:gold,transparent:true,opacity:.54,blending:THREE.AdditiveBlending})); halo.position.z=.012;
  group.add(glass,edge,halo); group.userData.edge=edge; group.userData.halo=halo; group.userData.phase162PremiumHud=true; return group;
}
const THEME={
  WELLNESS:{accent:0x7dffcc,gold:0xffd56e}, PGA:{accent:0x7dffb2,gold:0x58fff4}, STORE:{accent:0x58fff4,gold:0xffd56e}, SPONSOR:{accent:0xffffff,gold:0xb58cff}, LEGENDS:{accent:0x65b7ff,gold:0xffd56e}, SCORPION:{accent:0xff5e75,gold:0xffd56e}, CHARITY:{accent:0xff7fa8,gold:0x58fff4}
};
function themeFor(group){
  const name=String(group.name||"").toUpperCase();
  return Object.entries(THEME).find(([k])=>name.includes(k))?.[1] || {accent:0x00ff66,gold:0xffd700};
}
function addButton(group,label,x,y,z,theme,interactives){
  const root=makeSlate(1.42,.36,theme.accent,theme.gold); root.name=`PHASE162 TACTILE HUD BUTTON ${label}`; root.position.set(x,y,z);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(1.32,.29),new THREE.MeshBasicMaterial({map:buttonTexture(label,"#00ff66","#ffd700"),transparent:true,side:THREE.DoubleSide,depthWrite:false})); face.position.z=.022; face.userData.phase162PremiumHud=true; root.add(face);
  root.userData.phase162TactileButton=true; root.userData.initialZ=z; root.userData.pressDepth=.045; root.userData.label=label; root.userData.theme=theme;
  group.add(root); interactives.push(root); return root;
}
function decorate(group,interactives){
  if(!group || group.userData._phase162PremiumHudDecorated) return;
  const th=themeFor(group);
  const rail=makeSlate(5.25,.56,th.accent,th.gold); rail.name="PHASE162 PREMIUM HUB HUD BUTTON RAIL"; rail.position.set(0,.72,.42); group.add(rail);
  addButton(group,"OPEN",-1.72,.72,.48,th,interactives);
  addButton(group,"INFO",0,.72,.48,th,interactives);
  addButton(group,"NEXT",1.72,.72,.48,th,interactives);
  group.userData._phase162PremiumHudDecorated=true;
}
function bind(args,interactives){
  const dom=args.renderer?.domElement, camera=args.camera; if(!dom||!camera||!interactives.length) return;
  const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
  dom.addEventListener("pointerdown",ev=>{
    const rect=dom.getBoundingClientRect(); mouse.x=((ev.clientX-rect.left)/rect.width)*2-1; mouse.y=-((ev.clientY-rect.top)/rect.height)*2+1; ray.setFromCamera(mouse,camera);
    const hit=ray.intersectObjects(interactives,true)[0]; if(!hit) return;
    let root=hit.object; while(root && !root.userData?.phase162TactileButton) root=root.parent; if(!root) return;
    root.position.z=root.userData.initialZ-root.userData.pressDepth;
    root.userData.edge?.material?.color?.set(root.userData.theme.gold);
    root.userData.halo?.material?.color?.set(root.userData.theme.gold);
    args.setStatus?.(`HUD press: ${root.userData.label}`,{force:true});
    setTimeout(()=>{root.position.z=root.userData.initialZ; root.userData.edge?.material?.color?.set(root.userData.theme.accent);},170);
  },{passive:true});
}
export function applyPhase162PremiumHubHudUpgrade(args={}, result={}){
  const scene=args.scene; if(!scene || scene.userData._phase162PremiumHubHud) return result;
  const state=scene.userData._phase162AllHubLuxury; const groups=state?.groups || [];
  const interactives=[]; groups.forEach(g=>decorate(g,interactives)); bind(args,interactives);
  scene.userData._phase162PremiumHubHud={interactives}; window.SVR_PHASE162_PREMIUM_HUB_HUD=true;
  args.setStatus?.("Phase 162: premium holographic hub HUD buttons active",{force:true});
  return {...result, phase162PremiumHud:interactives};
}
