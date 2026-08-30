/* PHASE-429-APPROVED-ERIC-VISUAL-LOCK */
import * as THREE from 'three';

const BUILD='PHASE-429-APPROVED-ERIC-VISUAL-LOCK';
const ERIC_MODEL='/game/assets/models/eric/eric.fbx';
const ERIC_DIFFUSE='/game/assets/models/eric/rp_eric_rigged_001_dif.jpg';
const ERIC_NORMAL='/game/assets/models/eric/rp_eric_rigged_001_norm.jpg';
const ERIC_GLOSS='/game/assets/models/eric/rp_eric_rigged_001_gloss.jpg';
const state={build:BUILD,applied:false,reloaded:false,texturedMeshes:0,basePoseLocked:false,lightingLocked:false,lastError:null,checkedAt:null};

async function loadTexture(loader,url,srgb=false){
  const texture=await loader.loadAsync(url);
  if(srgb)texture.colorSpace=THREE.SRGBColorSpace;
  texture.anisotropy=4;
  texture.needsUpdate=true;
  return texture;
}

function ensureLighting(viewer){
  if(!viewer?.scene)return false;
  if(!viewer.scene.getObjectByName('PHASE429_ERIC_WARM_KEY')){
    const warm=new THREE.DirectionalLight(0xfff1dc,1.45);warm.name='PHASE429_ERIC_WARM_KEY';warm.position.set(-2.4,3.1,3.2);viewer.scene.add(warm);
    const face=new THREE.PointLight(0xffffff,1.15,7);face.name='PHASE429_ERIC_FACE_FILL';face.position.set(0,1.65,2.1);viewer.scene.add(face);
    const rim=new THREE.PointLight(0x9b4dff,2.0,7);rim.name='PHASE429_ERIC_PURPLE_RIM';rim.position.set(2.2,2.15,-1.3);viewer.scene.add(rim);
  }
  if(viewer.renderer){viewer.renderer.toneMappingExposure=1.08;viewer.renderer.outputColorSpace=THREE.SRGBColorSpace}
  state.lightingLocked=true;return true;
}

function lockBasePose(viewer){
  try{viewer?.mixer?.stopAllAction?.()}catch{}
  if(viewer)viewer.mixer=null;
  viewer?.baseModel?.traverse?.(object=>{if(object.isSkinnedMesh&&object.skeleton?.pose)object.skeleton.pose()});
  viewer?.baseModel?.updateMatrixWorld?.(true);
  state.basePoseLocked=true;
}

async function applyApprovedEric(){
  const avatarState=window.SVR_PHASE389_AVATAR_STATE;
  const viewer=avatarState?.viewer;
  if(!viewer||state.applied)return false;
  try{
    const current=String(viewer.modelUrl||'');
    if(viewer.fallbackUsed||!current.includes('/assets/models/eric/eric.fbx')){
      state.reloaded=true;
      await viewer.loadModel(new URL(ERIC_MODEL,location.origin).href,1.78);
    }
    const loader=new THREE.TextureLoader();
    const [diffuse,normal]=await Promise.all([
      loadTexture(loader,ERIC_DIFFUSE,true),
      loadTexture(loader,ERIC_NORMAL,false)
    ]);
    /* Fetch gloss as an availability check so the approved lab texture set stays authoritative. */
    loadTexture(loader,ERIC_GLOSS,false).catch(()=>null);
    const materials=[];
    let count=0;
    viewer.baseModel?.traverse?.(object=>{
      if(!object.isMesh)return;
      const material=new THREE.MeshPhysicalMaterial({
        map:diffuse,
        normalMap:normal,
        color:0xffffff,
        roughness:.48,
        metalness:.01,
        clearcoat:.05,
        clearcoatRoughness:.70,
        side:THREE.DoubleSide
      });
      material.userData={svrTexturedMaterial:true,svrApprovedEric:true};
      object.material=material;
      object.frustumCulled=false;
      materials.push(material);count++;
    });
    viewer.baseMaterials=materials;
    lockBasePose(viewer);
    ensureLighting(viewer);
    viewer.currentOutfit={...(viewer.currentOutfit||{}),modelId:'eric',top:'none',headwear:'none',eyewear:'none',shoes:'none',accessory:'none'};
    viewer.clearEquipment?.();
    viewer.resetView?.();
    state.texturedMeshes=count;
    state.applied=count>0;
    state.lastError=null;
    state.checkedAt=new Date().toISOString();
    window.dispatchEvent(new CustomEvent('svr:approved-eric-visual',{detail:{...state,model:ERIC_MODEL,diffuse:ERIC_DIFFUSE,normal:ERIC_NORMAL,gloss:ERIC_GLOSS}}));
    return state.applied;
  }catch(error){state.lastError=String(error?.message||error);state.checkedAt=new Date().toISOString();return false}
}

let attempts=0;
const timer=setInterval(async()=>{
  attempts++;
  const done=await applyApprovedEric();
  if(done||attempts>100)clearInterval(timer);
},120);
applyApprovedEric();
window.SVR_PHASE429_APPROVED_ERIC_QA=()=>({...state,model:ERIC_MODEL,diffuse:ERIC_DIFFUSE,normal:ERIC_NORMAL,gloss:ERIC_GLOSS,pass:Boolean(state.applied&&state.texturedMeshes>0&&state.basePoseLocked&&state.lightingLocked&&!state.lastError),checkedAt:new Date().toISOString()});
