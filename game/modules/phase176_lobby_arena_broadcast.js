import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-176-ARENA-JUMBOTRON-BROADCAST-LOCK";
const FRAMES = [
  { h:"WELCOME TO SVR POKER", p:0, a:"Lobby broadcast ready", b:[], s:[50000,50000,50000,50000,50000,50000] },
  { h:"DEMO HAND 001", p:300, a:"Blinds posted: 100 / 200", b:[], s:[49900,49800,50000,50000,50000,50000] },
  { h:"PRE-FLOP", p:900, a:"Seat 3 raises to 700", b:[], s:[49900,49800,49300,50000,50000,50000] },
  { h:"FLOP", p:2100, a:"Board: A 8 3", b:["A","8","3"], s:[49200,49800,49300,50000,50000,50000] },
  { h:"TURN", p:4100, a:"Seat 1 calls 1000", b:["A","8","3","J"], s:[48200,49800,48300,50000,50000,50000] },
  { h:"RIVER", p:7900, a:"Seat 3 bets 1900", b:["A","8","3","J","2"], s:[48200,49800,46400,50000,50000,50000] },
  { h:"HAND COMPLETE", p:7900, a:"Winner: Seat 3. Reveal only after hand ends.", b:["A","8","3","J","2"], s:[48200,49800,54300,50000,50000,50000] }
];
function media(w,h,draw){
  const c=document.createElement("canvas"); c.width=w; c.height=h;
  const ctx=c.getContext("2d"); draw(ctx,w,h);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  return { c, ctx, tex };
}
function draw(ctx,w,h,f,name){
  ctx.clearRect(0,0,w,h);
  const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#030711"); g.addColorStop(1,"#170620");
  ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle="#7ffcff"; ctx.lineWidth=14; ctx.strokeRect(26,26,w-52,h-52);
  ctx.fillStyle="rgba(127,255,242,.12)"; ctx.fillRect(48,54,w-96,76);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#7ffcff"; ctx.font="900 38px system-ui,Arial"; ctx.fillText(`${name} PUBLIC FEED`,w/2,92);
  ctx.fillStyle="#fff"; ctx.font="900 72px system-ui,Arial"; ctx.fillText(f.h,w/2,210);
  ctx.fillStyle="#ffdf8a"; ctx.font="800 42px system-ui,Arial"; ctx.fillText(`POT: ${Number(f.p||0).toLocaleString()} CHIPS`,w/2,305);
  ctx.fillStyle="#dffcff"; ctx.font="700 34px system-ui,Arial"; ctx.fillText(f.a,w/2,382);
  ctx.fillStyle="rgba(255,255,255,.08)"; ctx.fillRect(90,430,w-180,96);
  ctx.fillStyle="#fff"; ctx.font="900 42px system-ui,Arial"; ctx.fillText((f.b&&f.b.length?f.b.join("   "):"BOARD WAITING"),w/2,478);
  ctx.fillStyle="#ff8aa0"; ctx.font="800 26px system-ui,Arial"; ctx.fillText("PLAYER HANDS HIDDEN DURING ACTIVE PLAY",w/2,560);
  ctx.fillStyle="#9ffcff"; ctx.font="700 23px system-ui,Arial"; ctx.fillText((f.s||[]).map((v,i)=>`S${i+1}: ${Number(v||0).toLocaleString()}`).join("   "),w/2,620);
}
function face(obj,a,r,y){ obj.position.set(Math.cos(a)*r,y,Math.sin(a)*r); obj.lookAt(0,y-.35,0); }
function label(root,text,a,r){
  const m=media(700,220,(ctx,w,h)=>{ctx.fillStyle="rgba(0,0,0,.68)";ctx.fillRect(0,0,w,h);ctx.strokeStyle="#7ffcff";ctx.lineWidth=8;ctx.strokeRect(18,18,w-36,h-36);ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="900 42px system-ui,Arial";ctx.fillText(text,w/2,h/2);});
  const p=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.88),new THREE.MeshBasicMaterial({map:m.tex,transparent:true,side:THREE.DoubleSide}));
  p.name=`PHASE176_RING_LABEL_${text.replace(/\s+/g,"_")}`; face(p,a,r,1.25); root.add(p);
}
function screen(name,a,r){
  const h=new THREE.Group(); h.name=`PHASE176_JUMBOTRON_${name}`;
  const m=media(1400,760,(ctx,w,h)=>draw(ctx,w,h,FRAMES[0],name));
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(5.2,2.82),new THREE.MeshBasicMaterial({map:m.tex,side:THREE.DoubleSide})); panel.name=`PHASE176_JUMBOTRON_PANEL_${name}`; h.add(panel);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(5.45,3.08,.08),new THREE.MeshBasicMaterial({color:0x060913})); frame.position.z=-.06; frame.name=`PHASE176_JUMBOTRON_FRAME_${name}`; h.add(frame);
  face(h,a,r,5.15); h.userData.media=m; h.userData.name=name; return h;
}
export async function installPhase176LobbyArenaBroadcast(){
  const scene=window.__SVR_SCENE__; if(!scene) return null;
  const old=scene.getObjectByName("PHASE176_LOBBY_ARENA_BROADCAST_ROOT"); if(old) return old;
  const root=new THREE.Group(); root.name="PHASE176_LOBBY_ARENA_BROADCAST_ROOT";
  const ring=new THREE.Mesh(new THREE.TorusGeometry(6.25,.025,8,128),new THREE.MeshBasicMaterial({color:0x7ffcff,transparent:true,opacity:.52})); ring.name="PHASE176_CENTER_SPECTATOR_RING_GUIDE"; ring.rotation.x=-Math.PI/2; ring.position.y=.06; root.add(ring);
  const stage=new THREE.Mesh(new THREE.CircleGeometry(3.72,64),new THREE.MeshBasicMaterial({color:0x190a29,transparent:true,opacity:.38,side:THREE.DoubleSide})); stage.name="PHASE176_CENTER_FEATURED_TABLE_STAGE"; stage.rotation.x=-Math.PI/2; stage.position.y=.07; root.add(stage);
  label(root,"CENTER FEATURED TABLE",-Math.PI/2,4.25); label(root,"SPECTATOR WALK RING",Math.PI/2,7.05); label(root,"OUTER HUB RING",0,10.2);
  const screens=[screen("NORTH",-Math.PI/2,8.9),screen("SOUTH",Math.PI/2,8.9),screen("EAST",0,8.9),screen("WEST",Math.PI,8.9)]; screens.forEach(s=>root.add(s));
  const cam=new THREE.Mesh(new THREE.ConeGeometry(.22,.72,24),new THREE.MeshBasicMaterial({color:0xffdf8a,transparent:true,opacity:.72})); cam.name="PHASE176_PUBLIC_BROADCAST_CAMERA_MARKER"; cam.position.set(0,3.8,4.6); cam.rotation.x=Math.PI; root.add(cam);
  scene.add(root);
  let last=-1;
  root.userData.tick=(t)=>{const i=Math.floor((t%(FRAMES.length*4))/4)%FRAMES.length;if(i!==last){last=i;screens.forEach(sc=>{const m=sc.userData.media;draw(m.ctx,m.c.width,m.c.height,FRAMES[i],sc.userData.name);m.tex.needsUpdate=true;});}};
  window.SVR_PHASE176_BROADCAST={label:LABEL,locked:true,arena:"outer hub ring / spectator ring / center table",jumbotrons:4,feedPolicy:"public table info only during active play",replayFrames:FRAMES.length,checkedAt:new Date().toISOString()};
  console.log("[Phase176] lobby arena broadcast installed");
  return root;
}
export function autoInstallPhase176LobbyArenaBroadcast(){
  const start=performance.now();
  const id=setInterval(async()=>{if(window.__SVR_SCENE__){clearInterval(id);await installPhase176LobbyArenaBroadcast();}else if(performance.now()-start>16000)clearInterval(id);},500);
}
