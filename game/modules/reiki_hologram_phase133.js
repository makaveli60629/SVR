import * as THREE from "three";

const PHOTO_URL = "./assets/ui/shyona_royston.png";
const VIDEO_URL = "./assets/video/reiki_hologram.mp4";

function texture(w, h, draw){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function rr(ctx,x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function approval(ctx,w,h){
  ctx.fillStyle="rgba(210,0,30,.32)"; rr(ctx,70,h-142,w-140,84,24); ctx.fill();
  ctx.strokeStyle="#ff233f"; ctx.lineWidth=8; rr(ctx,70,h-142,w-140,84,24); ctx.stroke();
  ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#ffd5da"; ctx.font="900 38px system-ui,Arial";
  ctx.fillText("AWAITING APPROVAL",w/2,h-100);
}
function panel(title, lines=[], accent="#7dfff0"){
  return texture(900,1200,(ctx,w,h)=>{
    const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#02080b"); g.addColorStop(1,"#120617");
    ctx.fillStyle=g; ctx.fillRect(0,0,w,h); ctx.strokeStyle=accent; ctx.lineWidth=14; rr(ctx,26,26,w-52,h-52,44); ctx.stroke();
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#f7ffff"; ctx.font="900 58px system-ui,Arial"; ctx.fillText(title,w/2,100);
    ctx.fillStyle="#dcfff7"; ctx.font="700 32px system-ui,Arial"; let y=210;
    lines.slice(0,9).forEach(line=>{ctx.fillText(line,w/2,y); y+=58;});
    approval(ctx,w,h);
  });
}
function founderPanel(){
  return panel("FOUNDER INFO",[
    "Trueitive.com",
    "Shyona Royston",
    "Release • relax • rejuvenate",
    "Massage therapy",
    "Reiki energy healing",
    "Meditation support",
    "Holistic nutrition support",
    "North Hollywood, CA",
    "Info@Trueitive.com"
  ]);
}
function photoPanel(){
  return texture(900,1200,(ctx,w,h)=>{
    ctx.fillStyle="#02080b"; ctx.fillRect(0,0,w,h); ctx.strokeStyle="#7dfff0"; ctx.lineWidth=14; rr(ctx,26,26,w-52,h-52,44); ctx.stroke();
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#f7ffff"; ctx.font="900 54px system-ui,Arial"; ctx.fillText("SHYONA ROYSTON",w/2,90);
    ctx.strokeStyle="rgba(125,255,240,.55)"; ctx.lineWidth=8; rr(ctx,130,145,w-260,610,34); ctx.stroke();
    ctx.fillStyle="rgba(255,255,255,.08)"; rr(ctx,145,160,w-290,580,28); ctx.fill();
    ctx.fillStyle="#dcfff7"; ctx.font="800 31px system-ui,Arial"; ctx.fillText("Founder Photo",w/2,825); ctx.fillText("Trueitive.com presentation",w/2,882);
    approval(ctx,w,h);
  });
}
function chakraPanel(){
  return texture(900,1200,(ctx,w,h)=>{
    ctx.fillStyle="#020408"; ctx.fillRect(0,0,w,h); ctx.strokeStyle="#7dfff0"; ctx.lineWidth=14; rr(ctx,26,26,w-52,h-52,44); ctx.stroke();
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#f7ffff"; ctx.font="900 62px system-ui,Arial"; ctx.fillText("7 CHAKRAS",w/2,95);
    const names=["Crown","Third Eye","Throat","Heart","Solar","Sacral","Root"];
    const colors=["#d88cff","#7b6cff","#54d9ff","#55ff99","#ffd13d","#ff8a2a","#ff3355"];
    names.forEach((name,i)=>{ const y=210+i*102; ctx.fillStyle=colors[i]; ctx.beginPath(); ctx.arc(210,y,36,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="rgba(255,255,255,.9)"; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(210,y,50,0,Math.PI*2); ctx.stroke(); ctx.fillStyle="#fff"; ctx.font="900 34px serif"; ctx.fillText("✦",210,y+1); ctx.fillStyle="#eaffff"; ctx.font="900 34px system-ui,Arial"; ctx.fillText(name,515,y); });
    approval(ctx,w,h);
  });
}
function slide(title, lines, accent="#b58cff"){ return panel(title,lines,accent); }
function button(label, accent){
  return new THREE.Mesh(new THREE.PlaneGeometry(.92,.40),new THREE.MeshBasicMaterial({map:panel(label,["tap / trigger"],accent),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
}
function isChildOf(obj,parent){ let p=obj; while(p){ if(p===parent) return true; p=p.parent; } return false; }
function hideLegacyReiki(scene, group){
  const pos=new THREE.Vector3();
  scene.traverse(obj=>{
    if(!obj?.isMesh || isChildOf(obj,group)) return;
    obj.getWorldPosition(pos);
    const local=group.worldToLocal(pos.clone());
    const nearReikiWall=Math.abs(local.x)<6.9 && local.y>.45 && local.y<6.1 && local.z>-3.6 && local.z<1.6;
    if(nearReikiWall && (obj.geometry?.type?.includes("Plane") || obj.material?.map || obj.material?.transparent)) obj.visible=false;
  });
}

export function applyReikiHologramPhase133({scene,camera,renderer,sceneTargets,setStatus=()=>{},log=()=>{}}={}){
  if(!scene || scene.userData._phase135ReikiWallAligned) return scene?.userData?._phase135ReikiWallAligned;
  const rec=sceneTargets?.reiki || sceneTargets?.reikiRoom; if(!rec?.pos || !rec?.look) return null;
  const wallCenter=rec.look.clone(); wallCenter.y=0;
  const group=new THREE.Group(); group.name="PHASE135 WALL ALIGNED TRUEITIVE REIKI HOLOGRAM"; group.position.copy(wallCenter);
  const entry=new THREE.Vector3().subVectors(rec.pos,wallCenter); entry.y=0; if(entry.lengthSq()<.001) entry.set(-1,0,0); else entry.normalize();
  group.rotation.y=Math.atan2(entry.x,entry.z); scene.add(group); group.updateMatrixWorld(true); hideLegacyReiki(scene,group);

  const teal=new THREE.MeshStandardMaterial({color:0x7dfff0,emissive:0x218c82,emissiveIntensity:.72,roughness:.24,metalness:.38});
  const dark=new THREE.MeshStandardMaterial({color:0x020607,emissive:0x061015,emissiveIntensity:.22,roughness:.86,metalness:.06});
  const red=new THREE.MeshStandardMaterial({color:0x8b071e,roughness:.86,side:THREE.DoubleSide});
  const carpet=new THREE.Mesh(new THREE.PlaneGeometry(5.4,7.2),red); carpet.rotation.x=-Math.PI/2; carpet.position.set(0,.018,-2.15); group.add(carpet);
  const back=new THREE.Mesh(new THREE.BoxGeometry(11.2,5.15,.18),dark); back.position.set(0,2.88,.10); group.add(back);
  [[0,5.48,.0,11.4,.16,.24],[-5.68,2.88,.0,.16,5.25,.24],[5.68,2.88,.0,.16,5.25,.24]].forEach(v=>{const m=new THREE.Mesh(new THREE.BoxGeometry(v[3],v[4],v[5]),teal); m.position.set(v[0],v[1],v[2]); group.add(m);});

  const left=new THREE.Mesh(new THREE.PlaneGeometry(2.28,3.42),new THREE.MeshBasicMaterial({map:founderPanel(),transparent:true,side:THREE.DoubleSide,depthWrite:false})); left.position.set(-3.78,2.78,-.18); group.add(left);
  const photoBack=new THREE.Mesh(new THREE.PlaneGeometry(2.28,3.42),new THREE.MeshBasicMaterial({map:photoPanel(),transparent:true,side:THREE.DoubleSide,depthWrite:false})); photoBack.position.set(3.78,2.78,-.18); group.add(photoBack);
  const photoImg=new THREE.Mesh(new THREE.PlaneGeometry(1.55,2.05),new THREE.MeshBasicMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,opacity:1})); photoImg.position.set(3.78,2.98,-.205); group.add(photoImg);
  new THREE.TextureLoader().load(PHOTO_URL,t=>{t.colorSpace=THREE.SRGBColorSpace; photoImg.material.map=t; photoImg.material.needsUpdate=true;},undefined,()=>{photoImg.visible=false;});

  const video=document.createElement("video"); video.src=VIDEO_URL; video.loop=true; video.playsInline=true; video.preload="metadata"; video.muted=true; video.volume=.85;
  const videoTex=new THREE.VideoTexture(video); videoTex.colorSpace=THREE.SRGBColorSpace;
  const slides=[{kind:"video",map:null},{kind:"panel",map:slide("ABOUT",["Trueitive.com","Release • relax • rejuvenate","Energy in motion","Mind • body • spirit"])},{kind:"panel",map:chakraPanel()},{kind:"panel",map:slide("REIKI",["Energy healing","Clear blockages","Reduce stress","Chakra balancing","Inner peace"],"#7dffb2")}];
  let index=0;
  const displayMat=new THREE.MeshBasicMaterial({map:videoTex,transparent:true,opacity:.92,side:THREE.DoubleSide,depthWrite:false});
  const display=new THREE.Mesh(new THREE.PlaneGeometry(2.20,3.50),displayMat); display.position.set(0,2.92,-.62); group.add(display);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(2.42,3.75,.08),teal); frame.position.set(0,2.92,-.66); group.add(frame);
  const prev=button("BACK","#b58cff"), next=button("NEXT","#7dffb2"); prev.position.set(-1.9,.78,-.80); next.position.set(1.9,.78,-.80); group.add(prev,next);
  function setSlide(n){ index=(n+slides.length)%slides.length; const s=slides[index]; displayMat.map=s.kind==="video"?videoTex:s.map; displayMat.needsUpdate=true; if(s.kind!=="video") video.pause(); setStatus(`Reiki hologram slide ${index+1}/${slides.length}`,{force:true}); }
  setSlide(0);
  const ray=new THREE.Raycaster(), mouse=new THREE.Vector2();
  renderer?.domElement?.addEventListener("pointerdown",ev=>{const r=renderer.domElement.getBoundingClientRect(); mouse.x=((ev.clientX-r.left)/r.width)*2-1; mouse.y=-((ev.clientY-r.top)/r.height)*2+1; ray.setFromCamera(mouse,camera); const hit=ray.intersectObjects([prev,next,display],true)[0]; if(!hit)return; hit.object===prev?setSlide(index-1):setSlide(index+1);},{passive:true});
  window.addEventListener("keydown",ev=>{if(ev.code==="ArrowLeft")setSlide(index-1); if(ev.code==="ArrowRight")setSlide(index+1);});
  let primed=false,near=false; const gp=new THREE.Vector3(), cp=new THREE.Vector3(); const prime=()=>{primed=true;}; window.addEventListener("pointerdown",prime,{passive:true}); window.addEventListener("keydown",prime);
  const oldTick=scene.userData._tickWorld;
  scene.userData._tickWorld=dt=>{oldTick?.(dt); camera?.getWorldPosition(cp); group.getWorldPosition(gp); near=cp.distanceTo(gp)<10.5; if(near&&primed&&index===0){video.muted=false; if(video.paused)video.play().catch(()=>{});} else {if(!video.paused)video.pause(); video.muted=true;} display.position.y=2.92+Math.sin(performance.now()*.002)*.03;};
  scene.userData._phase135ReikiWallAligned={group,setSlide,video}; log?.("Phase 135 expanded lobby / wall aligned Reiki hologram active"); setStatus("Phase 135 lobby expanded and Reiki aligned to wall",{force:true}); return scene.userData._phase135ReikiWallAligned;
}
