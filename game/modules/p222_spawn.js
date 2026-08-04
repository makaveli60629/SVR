import * as THREE from 'three';
const BUILD='PHASE222_DIRECT_TABLE_SPAWN';
let placed=false;
function run(){
  const scene=window.__SVR_SCENE__, camera=window.__SVR_CAMERA__, renderer=window.__SVR_RENDERER__;
  if(!scene||!camera)return null;
  const root=scene.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||scene;
  root.traverse?.(o=>{const n=String(o.name||'');if(/PHASE217_|PHASE218_|PHASE219_|PHASE220_|PHASE221_|laser|pointer|ray|arc|target/i.test(n)){o.visible=false;o.traverse?.(c=>c.visible=false);}});
  const t=root.getObjectByName?.('PHASE159_ACTUAL_UPLOADED_TABLE_FBX_FLAT_SCALED')||root.getObjectByName?.('PHASE159_FBX_TABLE_FLAT_SCALE_FIX_ROOT');
  let seat=null;
  if(t){
    t.visible=true;t.position.set(0,0,0);t.traverse?.(o=>{o.visible=true;if(o.isMesh)o.frustumCulled=false;});
    t.updateMatrixWorld(true);
    const b=new THREE.Box3().setFromObject(t), s=new THREE.Vector3(), c=new THREE.Vector3();
    b.getSize(s);b.getCenter(c);
    const top=b.max.y, depth=Math.max(.8,Math.min(s.z*.40,1.7));
    const eye=new THREE.Vector3(c.x,top+1.08,c.z+depth*1.18);
    const target=new THREE.Vector3(c.x,top+.02,c.z-depth*.08);
    const rig=window.SVR_TELEPORT_RIG_REF||window.SVR_TELEPORT_RIG;
    if(renderer?.xr?.isPresenting&&rig?.setPlayerPose){if(!placed){rig.setPlayerPose(eye.x,0,eye.z);placed=true;}}
    else{camera.position.copy(eye);camera.lookAt(target);placed=true;}
    seat={x:+eye.x.toFixed(2),y:+eye.y.toFixed(2),z:+eye.z.toFixed(2)};
  }
  scene.background=new THREE.Color(0x030407);scene.fog=null;
  const out={build:BUILD,active:true,tableFound:!!t,seated:placed,seat,checkedAt:new Date().toISOString()};
  window.SVR_PHASE222_DIRECT_TABLE_SPAWN=out;window.SVR_LOCKED_FINAL_BUILD=BUILD;window.SVR_LIVE_BUILD_POINTER=BUILD;
  return out;
}
window.SVR_RUN_PHASE222_SPAWN_AUDIT=()=>run();
[300,900,1800,3200,6000].forEach(t=>setTimeout(run,t));
setInterval(run,1000);
run();
