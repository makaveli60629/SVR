import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { SVRAvatarViewer } from '../../../site/js/phase346-avatar-viewer.js?v=phase442';

export const BUILD='PHASE-442-AVATAR-LAB-REAL-GEOMETRY-MOTION-LOCK';
const canvas=document.getElementById('avatarCanvas'),status=document.getElementById('status');
const viewer=new SVRAvatarViewer({canvas,autoRotate:true});
let catalog=null,motionAction=null,motion='idle',loadingMotion=false;
const ui=Object.fromEntries(['model','palette','top','headwear','eyewear','shoes','accessory','reset','save'].map(id=>[id,document.getElementById(id)]));
const models={
  eric:{url:'/game/assets/models/eric/eric.fbx',height:1.78,motions:'/game/assets/models/eric/locomotion/'},
  claudia:{url:'/game/assets/models/claudia/claudia.fbx',height:1.70,motions:'/game/assets/models/claudia/locomotion/'}
};
const ids=['model','palette','top','headwear','eyewear','shoes','accessory'];
const read=()=>({schemaVersion:2,modelId:ui.model.value,palette:ui.palette.value,top:ui.top.value,headwear:ui.headwear.value,eyewear:ui.eyewear.value,shoes:ui.shoes.value,accessory:ui.accessory.value});
function report(extra='') { const q=viewer.audit(); status.textContent=`${BUILD}\n${ui.model.value.toUpperCase()} • ${motion.toUpperCase()}\ntextured=${q.texturesPreserved} wardrobe=${q.equipmentObjects}\nfps=${q.fps||'warming'} ${extra}`; }
async function playMotion(name){
  if(loadingMotion)return; if(name==='sitting'&&ui.model.value==='claudia'){name='idle'}
  loadingMotion=true; try{
    const base=models[ui.model.value],asset=await new FBXLoader().loadAsync(`${base.motions}${name}.fbx?v=phase442`);
    if(!asset.animations?.length)throw new Error('clip missing');
    if(!viewer.mixer){const THREE=await import('three');viewer.mixer=new THREE.AnimationMixer(viewer.baseModel)}
    motionAction?.fadeOut?.(.18); motionAction=viewer.mixer.clipAction(asset.animations[0],viewer.baseModel);motionAction.reset().fadeIn(.18).play();
    motion=name; document.querySelectorAll('[data-motion]').forEach(b=>b.classList.toggle('active',b.dataset.motion===name));report('motion ready');
  }catch(e){report(`motion error: ${e.message}`)}finally{loadingMotion=false}
}
async function loadAvatar(){const base=models[ui.model.value];await viewer.loadModel(base.url,base.height);viewer.applyOutfit(read());await playMotion('idle');report('ready')}
ids.slice(1).forEach(id=>document.getElementById(id).addEventListener('change',()=>{viewer.applyOutfit(read());report('outfit fitted')}));
ui.model.addEventListener('change',loadAvatar);document.querySelectorAll('[data-motion]').forEach(b=>b.addEventListener('click',()=>playMotion(b.dataset.motion)));
ui.reset.addEventListener('click',()=>viewer.resetView());ui.save.addEventListener('click',()=>{localStorage.setItem('svrPlayerAvatarV2',JSON.stringify(read()));window.dispatchEvent(new CustomEvent('svr:avatar-saved',{detail:read()}));report('saved locally')});
(async()=>{catalog=await fetch('/site/data/avatar-catalog.json?v=phase442',{cache:'no-store'}).then(r=>r.json());viewer.catalog=catalog;const saved=JSON.parse(localStorage.getItem('svrPlayerAvatarV2')||'null');if(saved)for(const id of ids)if(saved[id]&&document.getElementById(id))document.getElementById(id).value=saved[id];await loadAvatar();setInterval(report,1200);window.SVR_AVATAR_LAB={build:BUILD,viewer,playMotion,qa:()=>({...viewer.audit(),motion,outfit:read(),pass:viewer.audit().pass&&Boolean(motionAction)})}})().catch(e=>{status.textContent=`Avatar Lab failed: ${e.message}`});
