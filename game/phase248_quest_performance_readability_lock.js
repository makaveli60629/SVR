import * as THREE from "three";

const BUILD = "PHASE-248-QUEST-PERFORMANCE-READABILITY-LOCK";

function waitForScene(){
  return new Promise((resolve)=>{
    let tries=0;
    const tick=()=>{
      if(window.__SVR_SCENE__ && window.__SVR_RENDERER__) return resolve({scene:window.__SVR_SCENE__, renderer:window.__SVR_RENDERER__, camera:window.__SVR_CAMERA__});
      if(++tries>360) return resolve(null);
      requestAnimationFrame(tick);
    };
    tick();
  });
}
function optimizeRenderer(renderer){
  if(!renderer) return {};
  const before={pixelRatio:renderer.getPixelRatio?.()};
  const isQuest=/Oculus|Quest|VR|Mobile|Android/i.test(navigator.userAgent||"");
  const ratio=isQuest?1.15:Math.min(window.devicePixelRatio||1,1.35);
  renderer.setPixelRatio?.(ratio);
  renderer.shadowMap.enabled=false;
  if(renderer.outputColorSpace) renderer.outputColorSpace=THREE.SRGBColorSpace;
  return {before, after:{pixelRatio:ratio, shadows:false}, isQuest};
}
function optimizeScene(scene){
  let meshes=0, lights=0, invisible=0, tonedDown=0;
  const keepLights=[];
  scene.traverse((obj)=>{
    if(obj.isMesh){
      meshes++;
      obj.frustumCulled=true;
      if(obj.material){
        const mats=Array.isArray(obj.material)?obj.material:[obj.material];
        mats.forEach((m)=>{
          if(!m) return;
          if(m.transparent && m.opacity<0.075 && /RING|GLOW|HALO|ACCENT/.test(obj.name||"")){ obj.visible=false; invisible++; }
          if(m.emissiveIntensity && m.emissiveIntensity>.35){ m.emissiveIntensity=.24; tonedDown++; }
        });
      }
    }
    if(obj.isLight){
      lights++;
      if(keepLights.length<8) keepLights.push(obj);
      else { obj.visible=false; invisible++; }
      if(obj.intensity && obj.intensity>1.2){ obj.intensity=1.0; tonedDown++; }
    }
  });
  return {meshes, lights, hiddenLowValueObjects:invisible, tonedDown};
}
function makeReadableTexture(title,sub,color="#ffd98a"){
  const c=document.createElement("canvas"); c.width=1400; c.height=460;
  const g=c.getContext("2d");
  g.fillStyle="#030711"; g.fillRect(0,0,c.width,c.height);
  g.strokeStyle=color; g.lineWidth=14; g.strokeRect(24,24,c.width-48,c.height-48);
  g.strokeStyle="rgba(255,255,255,.18)"; g.lineWidth=3; g.strokeRect(58,58,c.width-116,c.height-116);
  g.textAlign="center"; g.textBaseline="middle";
  g.fillStyle="#fff"; g.font="900 72px system-ui,Arial"; g.fillText(title.toUpperCase(),700,165);
  g.fillStyle=color; g.font="850 42px system-ui,Arial"; g.fillText(sub,700,290);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
function addReadabilityBoard(scene){
  if(scene.getObjectByName("PHASE248_READABILITY_BOARD_ROOT")) return false;
  const root=new THREE.Group(); root.name="PHASE248_READABILITY_BOARD_ROOT"; scene.add(root);
  const mat=new THREE.MeshBasicMaterial({map:makeReadableTexture("SVR LOBBY","Walk to a portal or sit at the table","#ffd98a"),transparent:true,side:THREE.DoubleSide,depthWrite:false});
  const board=new THREE.Mesh(new THREE.PlaneGeometry(5.8,1.9),mat);
  board.name="PHASE248_MAIN_READABILITY_BOARD"; board.position.set(0,2.45,-6.95); board.renderOrder=500; root.add(board);
  const signs=[[-12.8,"Wellness","Reiki room","#a77cff"],[-6.4,"PGA","Golf range","#7ffcff"],[6.4,"Store","Web store","#8dffb4"],[12.8,"Scorpion","VIP poker","#ff5b8c"]];
  signs.forEach(([x,a,b,color])=>{
    const p=new THREE.Mesh(new THREE.PlaneGeometry(2.25,.78),new THREE.MeshBasicMaterial({map:makeReadableTexture(a,b,color),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    p.name=`PHASE248_READABLE_${a.toUpperCase()}_SIGN`; p.position.set(x,3.25,-8.78); p.renderOrder=501; root.add(p);
  });
  return true;
}
function addDiagnostics(scene, renderer, stats){
  window.SVR_PHASE248_QUEST_PERFORMANCE_READABILITY={
    build:BUILD,
    active:true,
    siteTouched:false,
    renderer:stats.renderer,
    scene:stats.scene,
    readabilityBoard:stats.readabilityBoard,
    rules:["Quest pixel ratio capped", "shadows disabled", "excess lights hidden", "low-value glow reduced", "large readable boards added", "frustum culling enabled"],
    checkedAt:new Date().toISOString()
  };
  window.SVR_LOCKED_FINAL_BUILD=BUILD;
  const label=document.getElementById("svr-phase-label"); if(label) label.textContent="PHASE 248 ACTIVE • QUEST READABILITY READY";
  const status=document.getElementById("status"); if(status) status.textContent="Phase 248 Quest performance/readability active";
}
async function install(){
  const runtime=await waitForScene();
  if(!runtime?.scene) return;
  const rendererStats=optimizeRenderer(runtime.renderer);
  const sceneStats=optimizeScene(runtime.scene);
  const board=addReadabilityBoard(runtime.scene);
  addDiagnostics(runtime.scene,runtime.renderer,{renderer:rendererStats,scene:sceneStats,readabilityBoard:board});
}
install();
