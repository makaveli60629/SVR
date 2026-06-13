import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-181-HAND-RAY-TABLE-SELECTOR-LOCK";
const TABLES = [
  { id:"demo", name:"Demo Table", type:"Practice", seats:"6/6 bots", x:0, z:1.2, status:"OPEN" },
  { id:"cash-low", name:"Low Stakes", type:"Cash", seats:"2/6", x:-2.2, z:-1.2, status:"OPEN" },
  { id:"cash-mid", name:"Mid Stakes", type:"Cash", seats:"4/6", x:2.2, z:-1.2, status:"OPEN" },
  { id:"freeroll", name:"Freeroll", type:"Event", seats:"18 queued", x:-1.4, z:2.6, status:"QUEUE" },
  { id:"final", name:"Final Table", type:"Event", seats:"Locked", x:1.4, z:2.6, status:"PREVIEW" },
  { id:"scorpion", name:"Scorpion Room", type:"VIP", seats:"Private", x:-7.4, z:0, status:"ENTER" }
];
function makeTexture(table, selected=false, focused=false){
  const c=document.createElement("canvas"); c.width=900; c.height=420;
  const ctx=c.getContext("2d");
  ctx.fillStyle=selected?"#09241f":focused?"#101335":"#050914"; ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle=selected?"#8dffb4":focused?"#ffdf8a":"#7ffcff"; ctx.lineWidth=focused?16:10; ctx.strokeRect(18,18,c.width-36,c.height-36);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle=selected?"#8dffb4":focused?"#ffdf8a":"#7ffcff"; ctx.font="900 58px system-ui,Arial"; ctx.fillText(table.name,c.width/2,115);
  ctx.fillStyle="#fff"; ctx.font="800 36px system-ui,Arial"; ctx.fillText(`${table.type} • ${table.seats}`,c.width/2,205);
  ctx.fillStyle="#ffdf8a"; ctx.font="900 34px system-ui,Arial"; ctx.fillText(table.status,c.width/2,290);
  ctx.fillStyle="#dffcff"; ctx.font="700 24px system-ui,Arial"; ctx.fillText("GAZE + PINCH / TRIGGER / CLICK",c.width/2,350);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; return tex;
}
function faceCamera(obj){
  const cam=window.__SVR_CAMERA__;
  if(cam) obj.lookAt(cam.position.x,obj.position.y,cam.position.z);
}
function createCard(table,index){
  const group=new THREE.Group(); group.name=`PHASE181_TABLE_CARD_${table.id}`; group.userData.table=table;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(1.42,.66),new THREE.MeshBasicMaterial({map:makeTexture(table),transparent:true,side:THREE.DoubleSide}));
  mesh.name=`PHASE181_TABLE_CARD_PANEL_${table.id}`; mesh.userData.table=table;
  const a=-Math.PI/2+(index-2.5)*.25;
  group.position.set(Math.cos(a)*2.55,1.32,Math.sin(a)*2.55);
  group.add(mesh);
  return group;
}
function refreshCards(cards, selectedId, focusedId){
  cards.forEach(g=>{
    const mesh=g.children[0];
    const selected=g.userData.table.id===selectedId;
    const focused=g.userData.table.id===focusedId;
    mesh.material.map?.dispose?.();
    mesh.material.map=makeTexture(g.userData.table,selected,focused);
    mesh.material.needsUpdate=true;
    g.scale.setScalar(selected?1.18:focused?1.10:1.0);
  });
}
function moveCameraTo(table){
  const cam=window.__SVR_CAMERA__;
  const renderer=window.__SVR_RENDERER__;
  if(!cam || renderer?.xr?.isPresenting) return false;
  cam.position.set(table.x,1.45,table.z+2.2);
  cam.lookAt(table.x,1.05,table.z);
  return true;
}
function centerRayHit(raycaster, meshes){
  const cam=window.__SVR_RENDERER__?.xr?.isPresenting ? window.__SVR_RENDERER__?.xr?.getCamera(window.__SVR_CAMERA__) : window.__SVR_CAMERA__;
  if(!cam) return null;
  raycaster.setFromCamera({x:0,y:0},cam);
  return raycaster.intersectObjects(meshes,false)[0]?.object?.userData?.table || null;
}
export function installPhase180TableSelector(){
  const scene=window.__SVR_SCENE__; if(!scene) return null;
  const old=scene.getObjectByName("PHASE180_TABLE_SELECTOR_ROOT") || scene.getObjectByName("PHASE181_TABLE_SELECTOR_ROOT"); if(old) return old;
  const root=new THREE.Group(); root.name="PHASE181_TABLE_SELECTOR_ROOT";
  const cards=TABLES.map((t,i)=>createCard(t,i)); cards.forEach(c=>root.add(c));
  const raycaster=new THREE.Raycaster(); const mouse=new THREE.Vector2(); let selected="demo"; let focused="demo"; let lastFocus="";
  const meshes=cards.map(c=>c.children[0]);
  function select(id, source="api"){
    const table=TABLES.find(t=>t.id===id)||TABLES[0]; selected=table.id; focused=table.id; refreshCards(cards,selected,focused); moveCameraTo(table);
    window.SVR_PHASE181_TABLE_SELECTOR={ label:LABEL, locked:true, selected:table, focused, tables:TABLES, mode:"desktop click + center gaze + Quest select event + controller trigger event", source, checkedAt:new Date().toISOString() };
    window.SVR_PHASE180_TABLE_SELECTOR=window.SVR_PHASE181_TABLE_SELECTOR;
    console.log("[Phase181] selected table", table, source);
    return table;
  }
  function pointer(ev){
    const renderer=window.__SVR_RENDERER__; const cam=window.__SVR_CAMERA__; if(!renderer||!cam) return;
    const rect=renderer.domElement.getBoundingClientRect();
    mouse.x=((ev.clientX-rect.left)/rect.width)*2-1; mouse.y=-((ev.clientY-rect.top)/rect.height)*2+1;
    raycaster.setFromCamera(mouse,cam);
    const hit=raycaster.intersectObjects(meshes,false)[0]?.object?.userData?.table;
    if(hit) select(hit.id,"desktop-pointer");
  }
  function selectFocused(source="xr-select"){
    const hit=centerRayHit(raycaster,meshes);
    const table=hit || TABLES.find(t=>t.id===focused) || TABLES[0];
    return select(table.id,source);
  }
  function bindSession(){
    const session=window.__SVR_RENDERER__?.xr?.getSession?.();
    if(!session || session.__svrPhase181TableBound) return;
    session.__svrPhase181TableBound=true;
    session.addEventListener("select",()=>selectFocused("xr-select"));
    session.addEventListener("selectstart",()=>{ focused=(centerRayHit(raycaster,meshes)||TABLES.find(t=>t.id===focused)||TABLES[0]).id; refreshCards(cards,selected,focused); });
  }
  window.addEventListener("pointerdown",pointer);
  root.userData.tick=()=>{
    cards.forEach(faceCamera);
    bindSession();
    const hit=centerRayHit(raycaster,meshes);
    if(hit && hit.id!==lastFocus){ focused=hit.id; lastFocus=hit.id; refreshCards(cards,selected,focused); }
  };
  scene.add(root);
  window.SVR_SELECT_TABLE=select;
  window.SVR_SELECT_FOCUSED_TABLE=selectFocused;
  select("demo","boot");
  return root;
}
export function autoInstallPhase180TableSelector(){
  const start=performance.now();
  const id=setInterval(()=>{ if(window.__SVR_SCENE__){ clearInterval(id); installPhase180TableSelector(); } else if(performance.now()-start>16000) clearInterval(id); },500);
}
