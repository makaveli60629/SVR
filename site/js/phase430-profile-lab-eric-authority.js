/* PHASE-430-PROFILE-DEALER-LAB-ERIC-AUTHORITY-LOCK */
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EricDealerModule } from '../../game/modules/dealer/eric_dealer_module.js';
import { account } from './phase345-demo-activity-persistence.js?v=phase418';

const BUILD='PHASE-430-PROFILE-DEALER-LAB-ERIC-AUTHORITY-LOCK';
const canvas=document.getElementById('profileShowroomCanvas');
const stage=document.getElementById('profileShowroom');
const statusNode=document.getElementById('showroomStatus');
const retryButton=document.getElementById('showroomRetry');
const modePill=document.getElementById('modePill');
const nameNode=document.getElementById('showroomAvatarName');
const outfitNode=document.getElementById('showroomOutfit');
const state={build:BUILD,ready:false,loading:false,loadError:null,rotating:true,frames:0,dealer:null,scene:null,camera:null,renderer:null,controls:null,checkedAt:null};
let raf=0;
let resizeObserver=null;
let clock=null;

function setStatus(message,type=''){
  if(statusNode)statusNode.textContent=message;
  stage?.classList.toggle('eric-load-error',type==='error');
  if(retryButton)retryButton.hidden=type!=='error';
  if(modePill){
    modePill.textContent=type==='ok'?'LAB ERIC LIVE':type==='error'?'ERIC ERROR':'LOADING ERIC';
    modePill.classList.toggle('phase430-eric-live',type==='ok');
  }
}

function disposeObject(root){
  root?.traverse?.(object=>{
    object.geometry?.dispose?.();
    const materials=Array.isArray(object.material)?object.material:[object.material];
    for(const material of materials.filter(Boolean)){
      for(const value of Object.values(material))if(value?.isTexture)value.dispose?.();
      material.dispose?.();
    }
  });
}

function clearRuntime(){
  cancelAnimationFrame(raf);
  resizeObserver?.disconnect?.();
  resizeObserver=null;
  if(state.dealer){
    disposeObject(state.dealer.group);
    disposeObject(state.dealer.propGroup);
    state.scene?.remove?.(state.dealer.group);
    state.scene?.remove?.(state.dealer.propGroup);
  }
  state.controls?.dispose?.();
  state.renderer?.dispose?.();
  state.dealer=null;state.controls=null;state.renderer=null;state.scene=null;state.camera=null;
}

function createRoom(){
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x030207);
  scene.fog=new THREE.FogExp2(0x07040c,0.012);
  const camera=new THREE.PerspectiveCamera(44,1,0.01,100);
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:false});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.12;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;

  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enableDamping=true;
  controls.enablePan=false;
  controls.minDistance=.65;
  controls.maxDistance=8;
  controls.maxPolarAngle=Math.PI*.70;

  scene.add(new THREE.HemisphereLight(0xc8b5ff,0x100717,2.35));
  const key=new THREE.DirectionalLight(0xfff4ea,3.4);key.position.set(3.2,5.4,4.0);key.castShadow=true;scene.add(key);
  const fill=new THREE.PointLight(0x6ddcff,16,9,2);fill.position.set(-2.2,2.6,2.2);scene.add(fill);
  const rim=new THREE.PointLight(0xa65cff,25,10,2);rim.position.set(-2.5,3.1,-3.5);scene.add(rim);
  const warm=new THREE.PointLight(0xffc36d,9,7,2);warm.position.set(2.4,1.7,-2.6);scene.add(warm);

  const floor=new THREE.Mesh(new THREE.CircleGeometry(3.0,64),new THREE.MeshPhysicalMaterial({color:0x09060e,roughness:.58,metalness:.15,clearcoat:.08}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.004;floor.receiveShadow=true;scene.add(floor);

  state.scene=scene;state.camera=camera;state.renderer=renderer;state.controls=controls;
  return {scene,camera,renderer,controls};
}

function dealerBounds(){
  if(!state.dealer?.group)return null;
  state.dealer.group.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(state.dealer.group,true);
  return box.isEmpty()?null:box;
}

function centerAndGround(){
  const dealer=state.dealer;if(!dealer)return;
  dealer.groundToFloor?.(0);
  let box=dealerBounds();if(!box)return;
  const center=box.getCenter(new THREE.Vector3());
  dealer.params.x-=center.x;
  dealer.params.z-=center.z;
  dealer.applyTransform();
  dealer.groundToFloor?.(0);
}

function frameEric(mode='full'){
  const box=dealerBounds();if(!box||!state.camera||!state.controls)return;
  const size=box.getSize(new THREE.Vector3());
  const center=box.getCenter(new THREE.Vector3());
  const camera=state.camera,controls=state.controls;
  if(mode==='face'){
    const target=new THREE.Vector3(center.x,box.min.y+size.y*.84,center.z);
    const distance=Math.max(.58,size.y*.34);
    camera.position.set(target.x,target.y+.015,target.z+distance);
    controls.target.copy(target);
  }else if(mode==='upper'){
    const target=new THREE.Vector3(center.x,box.min.y+size.y*.66,center.z);
    const distance=Math.max(1.0,size.y*.72);
    camera.position.set(target.x,target.y+.03,target.z+distance);
    controls.target.copy(target);
  }else{
    const vFov=THREE.MathUtils.degToRad(camera.fov);
    const aspect=Math.max(.5,camera.aspect||1);
    const hFov=2*Math.atan(Math.tan(vFov/2)*aspect);
    const distance=Math.max(size.y/(2*Math.tan(vFov/2)),size.x/(2*Math.tan(hFov/2)),.8)*1.24;
    camera.position.set(center.x,center.y+size.y*.02,center.z+distance);
    controls.target.copy(center);
  }
  camera.near=.01;camera.far=100;camera.updateProjectionMatrix();controls.update();
}

function resize(){
  if(!state.renderer||!state.camera||!canvas)return;
  const host=canvas.parentElement||stage;
  const rect=host?.getBoundingClientRect?.();
  const width=Math.max(1,Math.floor(rect?.width||canvas.clientWidth||innerWidth));
  const height=Math.max(1,Math.floor(rect?.height||canvas.clientHeight||420));
  state.renderer.setSize(width,height,false);
  state.camera.aspect=width/height;state.camera.updateProjectionMatrix();
}

async function syncProfileLabels(){
  try{
    await account.bootstrap();
    const snapshot=account.snapshot();const profile=snapshot.profile;
    if(nameNode)nameNode.textContent=profile?.displayName||'SVR Player';
    if(outfitNode)outfitNode.textContent='Eric • Dealer Lab textures • approved lighting';
    if(modePill&&state.ready)modePill.title=snapshot.mode==='api'?'Database account':'Device-local account';
  }catch{}
}

async function loadEric(force=false){
  if(!canvas||state.loading)return false;
  state.loading=true;state.ready=false;state.loadError=null;setStatus('Loading the exact Dealer Lab Eric FBX, textures and lighting…');
  try{
    if(force)clearRuntime();
    if(!state.scene)createRoom();
    const dealer=new EricDealerModule(state.scene,{scale:.0157,x:0,y:0,z:0,shoulderX:.55,shoulderZ:-.48,elbowX:.36,wristZ:-.45,speed:1.35});
    dealer.propGroup.visible=false;
    state.dealer=dealer;
    await dealer.load();
    dealer.propGroup.visible=false;
    dealer.setMode('idle');
    centerAndGround();
    resize();frameEric('full');
    clock=new THREE.Clock();
    state.ready=true;state.loadError=null;state.checkedAt=new Date().toISOString();
    setStatus('Dealer Lab Eric loaded with the approved FBX, real texture maps and lab lighting.','ok');
    await syncProfileLabels();
    const animate=()=>{
      if(!state.renderer||!state.scene||!state.camera)return;
      const dt=Math.min(clock?.getDelta?.()||0,.05);
      state.dealer?.mixer?.update?.(dt);
      if(state.rotating&&state.dealer?.group)state.dealer.group.rotation.y+=dt*.22;
      state.controls?.update?.();state.renderer.render(state.scene,state.camera);state.frames++;
      raf=requestAnimationFrame(animate);
    };
    resizeObserver=new ResizeObserver(()=>{resize();if(state.frames<8)frameEric('full')});
    resizeObserver.observe(stage||canvas);
    animate();
    window.dispatchEvent(new CustomEvent('svr:phase430-profile-eric-ready',{detail:qa()}));
    return true;
  }catch(error){
    state.loadError=String(error?.message||error);state.checkedAt=new Date().toISOString();
    setStatus(`Eric failed to load: ${state.loadError}. No substitute avatar was used.`,'error');
    return false;
  }finally{state.loading=false}
}

function qa(){
  const rig=state.dealer?.loaded?state.dealer.getRigReport?.():null;
  return {build:BUILD,ready:state.ready,realEricLoaded:Boolean(state.dealer?.loaded),fallbackAvatarUsed:false,model:rig?.model||null,diffuse:rig?.diffuse||null,normal:rig?.normal||null,gloss:rig?.gloss||null,idleMixer:Boolean(state.dealer?.mixer),frames:state.frames,lastError:state.loadError,pass:Boolean(state.ready&&state.dealer?.loaded&&!state.loadError),checkedAt:new Date().toISOString()};
}

document.getElementById('showroomRotate')?.addEventListener('click',event=>{state.rotating=!state.rotating;event.currentTarget.textContent=state.rotating?'Pause Rotation':'Resume Rotation'});
document.getElementById('showroomReset')?.addEventListener('click',()=>frameEric('full'));
document.getElementById('showroomUpper')?.addEventListener('click',()=>frameEric('upper'));
document.getElementById('showroomFace')?.addEventListener('click',()=>frameEric('face'));
retryButton?.addEventListener('click',()=>void loadEric(true));
document.getElementById('showroomFullscreen')?.addEventListener('click',async()=>{try{if(!document.fullscreenElement)await stage?.requestFullscreen?.();else await document.exitFullscreen?.();setTimeout(()=>{resize();frameEric('full')},80)}catch(error){state.loadError=String(error?.message||error)}});
window.addEventListener('svr:account-change',()=>void syncProfileLabels());
window.SVR_PHASE389_PROFILE_RETRY=()=>loadEric(true);
window.SVR_PHASE430_PROFILE_ERIC_QA=qa;
window.addEventListener('pagehide',clearRuntime,{once:true});
void syncProfileLabels();
void loadEric();
