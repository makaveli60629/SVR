// PHASE-187-SOUTH-WALL-ESPRESSO-PLACEHOLDER-LOCK
// Replaces the failed AngelWingz south-wall image with an Espresso With Cream placeholder ad.
// Uses the same real south-wall anchor finder as Phase 186 and forces one visible layer.
import * as THREE from "three";

const PHASE = "PHASE-187-SOUTH-WALL-ESPRESSO-PLACEHOLDER-LOCK";

if (!window.__SVR_PHASE187_SOUTH_WALL_ESPRESSO__) {
  window.__SVR_PHASE187_SOUTH_WALL_ESPRESSO__ = true;

  function canvasTex(draw, w = 1024, h = 1024) {
    const c = document.createElement("canvas");
    c.width = w; c.height = h;
    const x = c.getContext("2d");
    draw(x, c);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }

  function espressoTex() {
    return canvasTex((x,c)=>{
      const g=x.createLinearGradient(0,0,0,c.height);
      g.addColorStop(0,"#0a0204"); g.addColorStop(.58,"#16070a"); g.addColorStop(1,"#2a1108");
      x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
      x.strokeStyle="#ffd77b"; x.lineWidth=30; x.strokeRect(34,34,c.width-68,c.height-68);
      x.strokeStyle="rgba(255,215,123,.62)"; x.lineWidth=6; x.strokeRect(66,66,c.width-132,c.height-132);

      const photoX=108, photoY=100, photoW=808, photoH=510;
      const wood=x.createLinearGradient(photoX,photoY,photoX+photoW,photoY+photoH);
      wood.addColorStop(0,"#d99a45"); wood.addColorStop(.48,"#f0cb82"); wood.addColorStop(1,"#8a4a23");
      x.fillStyle=wood; x.fillRect(photoX,photoY,photoW,photoH);
      x.strokeStyle="#ffd77b"; x.lineWidth=9; x.strokeRect(photoX,photoY,photoW,photoH);
      x.fillStyle="#fff6df";
      x.beginPath(); x.ellipse(512,515,265,82,0,0,Math.PI*2); x.fill();
      x.fillStyle="#f7ead1";
      x.beginPath(); x.ellipse(512,325,246,142,0,0,Math.PI*2); x.fill();
      const crema=x.createRadialGradient(500,292,16,512,318,228);
      crema.addColorStop(0,"#ffe8a9"); crema.addColorStop(.38,"#d98b35"); crema.addColorStop(.77,"#80410e"); crema.addColorStop(1,"#4f2108");
      x.fillStyle=crema;
      x.beginPath(); x.ellipse(512,312,219,107,0,0,Math.PI*2); x.fill();
      x.strokeStyle="rgba(255,255,255,.72)"; x.lineWidth=14;
      x.beginPath(); x.ellipse(512,318,236,126,0,0,Math.PI*2); x.stroke();
      x.strokeStyle="rgba(80,35,8,.30)"; x.lineWidth=5;
      for(let i=0;i<85;i++){ const a=Math.random()*Math.PI*2; const r=Math.random()*185; const px=512+Math.cos(a)*r; const py=312+Math.sin(a)*r*.46; x.beginPath(); x.arc(px,py,1+Math.random()*3,0,Math.PI*2); x.stroke(); }

      x.fillStyle="#fff7e3"; x.textAlign="center"; x.textBaseline="middle";
      x.font="900 108px system-ui,Segoe UI,Arial"; x.fillText("ESPRESSO",512,710);
      x.fillStyle="#ffd77b"; x.font="900 90px system-ui,Segoe UI,Arial"; x.fillText("WITH CREAM",512,810);
      x.fillStyle="#ffffff"; x.font="900 36px system-ui,Segoe UI,Arial"; x.fillText("SVR LOBBY WALL AD PLACEHOLDER",512,878);
      x.fillStyle="rgba(255,255,255,.70)"; x.font="700 24px system-ui,Segoe UI,Arial"; x.fillText("PHASE 187 • TEMPORARY IMAGE UNTIL FINAL WALL ART IS READY",512,932);
    },1024,1024);
  }

  function titleTex(){
    return canvasTex((x,c)=>{
      x.fillStyle="#050711"; x.fillRect(0,0,c.width,c.height);
      x.strokeStyle="rgba(255,215,123,.95)"; x.lineWidth=9; x.strokeRect(18,18,c.width-36,c.height-36);
      x.textAlign="center"; x.textBaseline="middle";
      x.fillStyle="#fff7e3"; x.font="900 72px system-ui,Segoe UI,Arial"; x.fillText("ABOUT SVR POKER",c.width/2,130);
      x.fillStyle="#bfffea"; x.font="800 34px system-ui,Segoe UI,Arial"; x.fillText("Mission wall • espresso placeholder art • clean one-layer lock",c.width/2,220);
    },1024,384);
  }

  function infoTex(title, lines, accent){
    return canvasTex((x,c)=>{
      x.fillStyle="#050710"; x.fillRect(0,0,c.width,c.height);
      x.strokeStyle=accent; x.lineWidth=8; x.strokeRect(16,16,c.width-32,c.height-32);
      x.textAlign="center"; x.textBaseline="middle";
      x.fillStyle="#fff"; x.font="900 54px system-ui,Segoe UI,Arial"; x.fillText(title.toUpperCase(),c.width/2,90);
      x.fillStyle="rgba(255,255,255,.9)"; x.font="31px system-ui,Segoe UI,Arial";
      lines.forEach((line,i)=>x.fillText(line,c.width/2,180+i*56));
    },720,520);
  }

  function bar(parent,x,y,z,w,h,color,opacity=.82){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    m.position.set(x,y,z); m.renderOrder=920; parent.add(m); return m;
  }
  function frame(parent,w,h,z=.055){
    bar(parent,0,h/2+.055,z,w+.22,.045,0xffd77b,.95); bar(parent,0,-h/2-.055,z,w+.22,.045,0xffd77b,.72);
    bar(parent,-w/2-.055,0,z,.045,h+.22,0x7ff5c7,.86); bar(parent,w/2+.055,0,z,.045,h+.22,0xb48cff,.86);
  }

  function isFinal(obj){ for(let p=obj;p;p=p.parent){ if(p.name==="PHASE187_SOUTH_WALL_ESPRESSO_ROOT") return true; } return false; }

  function findSouthWallAnchor(scene){
    const pts=[];
    scene.traverse((obj)=>{
      if(!obj || !obj.isMesh || isFinal(obj)) return;
      const geo=obj.geometry, p=geo?.parameters||{}, type=geo?.type||"";
      if(!/PlaneGeometry/.test(type)) return;
      let pos=new THREE.Vector3(); try{obj.getWorldPosition(pos);}catch(_e){return;}
      const w=Number(p.width||0), h=Number(p.height||0);
      if(pos.z>6.5 && Math.abs(pos.x)<5.8 && pos.y>.7 && pos.y<3.3 && w>.7 && w<2.8 && h>.7 && h<2.8) pts.push(pos.clone());
    });
    if(pts.length){ const avg=pts.reduce((a,p)=>a.add(p),new THREE.Vector3()).multiplyScalar(1/pts.length); return new THREE.Vector3(0,2.92,avg.z-.035); }
    return new THREE.Vector3(0,2.92,11.65);
  }

  function hideOld(scene){
    const rx=/PHASE18[2-6]_SOUTH|PHASE18[2-6]_ANGEL|PHASE18[2-6]_ABOUT|MISSION|HUBS|ABOUT|TOURNEY|LEADERBOARD|LEGENDS WALL|SVR LEGENDS WALL/i;
    scene.traverse((obj)=>{
      if(!obj || isFinal(obj)) return;
      const label=`${obj.name||""} ${obj.userData?.label||""} ${obj.userData?.title||""}`;
      let pos=new THREE.Vector3(); try{obj.getWorldPosition(pos);}catch(_e){pos.set(999,999,999);}
      const geo=obj.geometry, p=geo?.parameters||{}, type=geo?.type||"";
      const w=Number(p.width||0), h=Number(p.height||0);
      const southPanel=/PlaneGeometry|BoxGeometry/.test(type) && pos.z>6.5 && Math.abs(pos.x)<9.5 && pos.y>.25 && pos.y<6.9 && w<12 && h<8;
      if(rx.test(label) || southPanel){ obj.visible=false; obj.userData.phase187HiddenOldSouthLayer=true; }
    });
  }

  function build(scene){
    if(!scene) return false;
    const anchor=findSouthWallAnchor(scene);
    hideOld(scene);
    const old=scene.getObjectByName("PHASE187_SOUTH_WALL_ESPRESSO_ROOT");
    if(old){ old.visible=false; scene.remove(old); }
    const root=new THREE.Group(); root.name="PHASE187_SOUTH_WALL_ESPRESSO_ROOT"; root.position.copy(anchor); root.lookAt(0,anchor.y,0); scene.add(root);
    const back=new THREE.Mesh(new THREE.PlaneGeometry(9.1,5.7),new THREE.MeshBasicMaterial({color:0x010104,side:THREE.DoubleSide,depthWrite:true,toneMapped:false}));
    back.position.z=-.045; back.renderOrder=860; root.add(back);
    const title=new THREE.Mesh(new THREE.PlaneGeometry(7.75,.72),new THREE.MeshBasicMaterial({map:titleTex(),transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    title.position.set(0,2.38,.08); title.renderOrder=930; root.add(title);
    const art=new THREE.Mesh(new THREE.PlaneGeometry(4.2,4.2),new THREE.MeshBasicMaterial({map:espressoTex(),side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    art.name="PHASE187_ESPRESSO_PLACEHOLDER_REPLACES_WINGS"; art.position.set(0,.08,.11); art.renderOrder=950; root.add(art); frame(art,4.2,4.2,.06);
    const mission=new THREE.Mesh(new THREE.PlaneGeometry(2.22,1.38),new THREE.MeshBasicMaterial({map:infoTex("Mission",["Play-money poker","Sponsor-supported rooms","Community giveback"],"#7ff5c7"),transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    mission.position.set(-3.42,-1.88,.12); mission.renderOrder=940; root.add(mission); frame(mission,2.22,1.38,.05);
    const about=new THREE.Mesh(new THREE.PlaneGeometry(2.22,1.38),new THREE.MeshBasicMaterial({map:infoTex("About",["Scorpion Poker","PGA Training","Store & Lounge"],"#b48cff"),transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    about.position.set(3.42,-1.88,.12); about.renderOrder=940; root.add(about); frame(about,2.22,1.38,.05);
    const light=new THREE.PointLight(0xffd77b,1.3,8.5,2); light.position.set(0,.8,1.15); root.add(light);
    const status=document.getElementById("status"); if(status) status.textContent="Phase 187: espresso placeholder on south wall";
    document.querySelectorAll(".pill").forEach(p=>{ if(/PHASE-|Hands ready|BUILD:/i.test(p.textContent||"")) p.textContent=PHASE; });
    window.SVR_PHASE187_SOUTH_WALL={phase:PHASE, anchor:{x:anchor.x,y:anchor.y,z:anchor.z}, placeholder:"Espresso With Cream"};
    console.log(`[${PHASE}] loaded`, window.SVR_PHASE187_SOUTH_WALL);
    return true;
  }

  function boot(){
    const tryHook=()=>{const scene=window.SVR_GAME?.scene; if(!scene) return false; build(scene); let passes=0; const id=setInterval(()=>{passes++; hideOld(scene); const root=scene.getObjectByName("PHASE187_SOUTH_WALL_ESPRESSO_ROOT"); if(root){root.visible=true; root.traverse(o=>o.visible=true);} if(passes>60) clearInterval(id);},500); return true;};
    if(!tryHook()){let n=0; const id=setInterval(()=>{n++; if(tryHook()||n>180) clearInterval(id);},200);}
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
}
