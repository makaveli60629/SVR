/* PHASE-429-APPROVED-ERIC-VISUAL-LOCK */
import * as THREE from 'three';

const BUILD='PHASE-429-APPROVED-ERIC-VISUAL-LOCK';
const ERIC_MODEL='/game/assets/models/eric/eric.fbx';
const ERIC_DIFFUSE='/game/assets/models/eric/rp_eric_rigged_001_dif.jpg';
const ERIC_NORMAL='/game/assets/models/eric/rp_eric_rigged_001_norm.jpg';
const ERIC_GLOSS='/game/assets/models/eric/rp_eric_rigged_001_gloss.jpg';
const appliedViewers=new WeakSet();
const state={build:BUILD,targets:0,reloaded:0,texturedMeshes:0,basePoseLocked:0,lightingLocked:0,lastError:null,checkedAt:null};

async function loadTexture(loader,url,srgb=false){const texture=await loader.loadAsync(url);if(srgb)texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;texture.needsUpdate=true;return texture}

function viewers(){
  const list=[window.SVR_PHASE389_AVATAR_STATE?.viewer,window.SVR_PHASE389_PROFILE_VIEWER,window.SVR_PHASE389_PROFILE_STATE?.viewer].filter(Boolean);
  return [...new Set(list)];
}

function ensureLighting(viewer){
  if(!viewer?.scene)return false;
  if(!viewer.scene.getObjectByName('PHASE429_ERIC_WARM_KEY')){
    const warm=new THREE.DirectionalLight(0xfff1dc,1.45);warm.name='PHASE429_ERIC_WARM_KEY';warm.position.set(-2.4,3.1,3.2);viewer.scene.add(warm);
    const face=new THREE.PointLight(0xffffff,1.15,7);face.name='PHASE429_ERIC_FACE_FILL';face.position.set(0,1.65,2.1);viewer.scene.add(face);
    const rim=new THREE.PointLight(0x9b4dff,2.0,7);rim.name='PHASE429_ERIC_PURPLE_RIM';rim.position.set(2.2,2.15,-1.3);viewer.scene.add(rim);
  }
  if(viewer.renderer){viewer.renderer.toneMappingExposure=1.08;viewer.renderer.outputColorSpace=THREE.SRGBColorSpace}
  state.lightingLocked++;return true;
}

function lockBasePose(viewer){
  try{viewer?.mixer?.stopAllAction?.()}catch{}
  if(viewer)viewer.mixer=null;
  viewer?.baseModel?.traverse?.(object=>{if(object.isSkinnedMesh&&object.skeleton?.pose)object.skeleton.pose()});
  viewer?.baseModel?.updateMatrixWorld?.(true);
  state.basePoseLocked++;
}

async function applyToViewer(viewer){
  if(!viewer||appliedViewers.has(viewer)||!viewer.baseModel)return false;
  const current=String(viewer.modelUrl||'');
  if(viewer.fallbackUsed||!current.includes('/assets/models/eric/eric.fbx')){state.reloaded++;await viewer.loadModel(new URL(ERIC_MODEL,location.origin).href,1.78)}
  const loader=new THREE.TextureLoader();
  const [diffuse,normal]=await Promise.all([loadTexture(loader,ERIC_DIFFUSE,true),loadTexture(loader,ERIC_NORMAL,false)]);
  loadTexture(loader,ERIC_GLOSS,false).catch(()=>null);
  const materials=[];let count=0;
  viewer.baseModel?.traverse?.(object=>{
    if(!object.isMesh)return;
    const material=new THREE.MeshPhysicalMaterial({map:diffuse,normalMap:normal,color:0xffffff,roughness:.48,metalness:.01,clearcoat:.05,clearcoatRoughness:.70,side:THREE.DoubleSide});
    material.userData={svrTexturedMaterial:true,svrApprovedEric:true};
    object.material=material;object.frustumCulled=false;materials.push(material);count++;
  });
  viewer.baseMaterials=materials;
  lockBasePose(viewer);ensureLighting(viewer);
  viewer.currentOutfit={...(viewer.currentOutfit||{}),modelId:'eric',top:'none',headwear:'none',eyewear:'none',shoes:'none',accessory:'none'};
  viewer.clearEquipment?.();viewer.avatarRoot?.rotation?.set?.(0,0,0);viewer.setAutoRotate?.(true);viewer.resetView?.();
  appliedViewers.add(viewer);state.targets++;state.texturedMeshes+=count;
  return count>0;
}

async function applyApprovedEric(){
  try{
    let changed=false;
    for(const viewer of viewers())changed=(await applyToViewer(viewer))||changed;
    state.lastError=null;state.checkedAt=new Date().toISOString();
    if(changed)window.dispatchEvent(new CustomEvent('svr:approved-eric-visual',{detail:{...state,model:ERIC_MODEL,diffuse:ERIC_DIFFUSE,normal:ERIC_NORMAL,gloss:ERIC_GLOSS}}));
    return state.targets>0;
  }catch(error){state.lastError=String(error?.message||error);state.checkedAt=new Date().toISOString();return false}
}

let attempts=0;const timer=setInterval(async()=>{attempts++;await applyApprovedEric();if((state.targets>0&&attempts>25)||attempts>120)clearInterval(timer)},140);
window.addEventListener('svr:phase389-profile-showroom-ready',()=>setTimeout(applyApprovedEric,30));
window.addEventListener('svr:avatar-saved',()=>setTimeout(applyApprovedEric,60));
applyApprovedEric();
window.SVR_PHASE429_APPROVED_ERIC_QA=()=>({...state,model:ERIC_MODEL,diffuse:ERIC_DIFFUSE,normal:ERIC_NORMAL,gloss:ERIC_GLOSS,pass:Boolean(state.targets>0&&state.texturedMeshes>0&&state.basePoseLocked>0&&state.lightingLocked>0&&!state.lastError),checkedAt:new Date().toISOString()});
