import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { EricDealerModule } from '../../modules/dealer/eric_dealer_module.js?v=phase434';
import { TableCalibrationModule } from '../../modules/dealer/table_calibration_module.js?v=phase434';
import { FeltInteractionModule } from '../../modules/dealer/felt_interaction_module.js?v=phase434';
import { WristLabModule } from '../../modules/dealer/wrist_lab_module.js?v=phase434';

const BUILD='DEALER-LAB-V2.3-QUEST-CLEAN-SURFACE-HUMAN-SCALE-DEALER';
const DEALER_DEFAULTS={scale:0.0055,x:-0.10,y:0.00268026492655681,z:0.71,shoulderX:0.55,shoulderZ:-0.48,elbowX:0.36,wristZ:-0.45,speed:1.35};
const TABLE_DEFAULTS={tableY:0.62,feltDrop:0.014,innerMargin:0.125,collisionDrop:0.02,cardLift:0.0006};
const DEALER_STORAGE_KEY='svrDealerLabDealerPresetPhase434';
const FLOOR_Y=0;
const HUMAN_DEALER_HEIGHT=1.78;
const app=document.getElementById('app'),hud=document.getElementById('hud'),quickbar=document.getElementById('quickbar'),statusEl=document.getElementById('status'),presetOut=document.getElementById('presetOut'),presetInput=document.getElementById('presetInput');

const scene=new THREE.Scene();scene.background=new THREE.Color(0x030207);scene.fog=new THREE.FogExp2(0x07040c,.018);
const camera=new THREE.PerspectiveCamera(52,innerWidth/innerHeight,.01,100);camera.position.set(0,1.55,3.5);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.12;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.xr.enabled=true;app.appendChild(renderer.domElement);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.86,-.05);controls.enableDamping=true;controls.minDistance=.55;controls.maxDistance=10;controls.maxPolarAngle=Math.PI*.49;
scene.add(new THREE.HemisphereLight(0xc8b5ff,0x100717,2.35));
const keyLight=new THREE.DirectionalLight(0xfff4ea,3.4);keyLight.position.set(3.2,5.4,4);keyLight.castShadow=true;scene.add(keyLight);
const fill=new THREE.PointLight(0x6ddcff,16,9,2);fill.position.set(-2.2,2.6,2.2);scene.add(fill);
const rim=new THREE.PointLight(0xa65cff,20,10,2);rim.position.set(-2.5,3.1,-3.5);scene.add(rim);
const warm=new THREE.PointLight(0xffc36d,8,7,2);warm.position.set(2.4,1.7,-2.6);scene.add(warm);
const floor=new THREE.Mesh(new THREE.CircleGeometry(7,96),new THREE.MeshPhysicalMaterial({color:0x09060e,roughness:.58,metalness:.15,clearcoat:.15}));floor.rotation.x=-Math.PI/2;floor.position.y=-.004;floor.receiveShadow=true;scene.add(floor);
const backdrop=new THREE.Mesh(new THREE.CylinderGeometry(7,7,5,96,1,true,Math.PI*.1,Math.PI*1.8),new THREE.MeshStandardMaterial({color:0x09050f,roughness:.96,side:THREE.BackSide}));backdrop.position.y=2.1;scene.add(backdrop);

const dealer=new EricDealerModule(scene,DEALER_DEFAULTS),table=new TableCalibrationModule(scene,TABLE_DEFAULTS),interaction=new FeltInteractionModule(table),wrist=new WristLabModule(renderer,scene);

dealer.applyReadyPose=()=>{
  const leftArm=dealer.getBone('leftarm'),leftForeArm=dealer.getBone('leftforearm'),leftHand=dealer.getBone('lefthand');
  const rightArm=dealer.getBone('rightarm'),rightForeArm=dealer.getBone('rightforearm'),rightHand=dealer.getBone('righthand');
  dealer.applyDelta(leftArm,.55,.08,.48);dealer.applyDelta(leftForeArm,.88,.02,-.12);dealer.applyDelta(leftHand,.10,0,.18);
  dealer.applyDelta(rightArm,.50,-.08,-.46);dealer.applyDelta(rightForeArm,.80,-.02,.14);dealer.applyDelta(rightHand,.08,0,-.16);
};

const cardGroup=new THREE.Group();cardGroup.name='SVR_Lab_DealtCards';scene.add(cardGroup);
const activeCards=[];let cardSerial=0,debugEric=false,loadSummary={dealer:'loading',table:'loading'},lastHumanScale=null;
function makeCard(){const edge=new THREE.MeshPhysicalMaterial({color:0xfffdf8,roughness:.42,clearcoat:.1}),back=new THREE.MeshPhysicalMaterial({color:0x35134e,roughness:.36,metalness:.05});const card=new THREE.Mesh(new THREE.BoxGeometry(.063,.0025,.089),[edge,edge,edge,edge,edge,back]);card.name=`LabCard_${++cardSerial}`;card.castShadow=true;return card}
function seatTarget(index,y){const points=[[-.72,.38],[-.88,.02],[-.61,-.40],[.61,-.40],[.88,.02],[.72,.38]];const [x,z]=points[index%points.length];return new THREE.Vector3(x,y,z)}
function spawnDealCard(detail={}){const seatIndex=Number(detail.seatIndex||0),y=table.getSurfaceY(.0025),card=makeCard();const raw=Array.isArray(detail.origin)?detail.origin:null;const start=raw?new THREE.Vector3(...raw):dealer.getDealOrigin();const end=seatTarget(seatIndex,y);card.position.copy(start);card.rotation.set(0,(seatIndex-2.5)*.09,0);cardGroup.add(card);activeCards.push({card,start:start.clone(),end,born:performance.now()*.001,duration:.43});while(cardGroup.children.length>24){const old=cardGroup.children[0];cardGroup.remove(old)}}
function updateCards(now){for(let i=activeCards.length-1;i>=0;i--){const item=activeCards[i],p=Math.min(1,(now-item.born)/item.duration),s=p*p*(3-2*p);item.card.position.lerpVectors(item.start,item.end,s);item.card.position.y+=Math.sin(Math.PI*s)*.075;item.card.rotation.z=(1-s)*.13;if(p>=1){item.card.position.copy(item.end);activeCards.splice(i,1)}}}

function normalizeEricHeight(targetHeight=HUMAN_DEALER_HEIGHT){
  if(!dealer.loaded)return null;
  const box=dealer.getBounds?.();if(!box)return null;
  const current=box.getSize(new THREE.Vector3()).y;if(!Number.isFinite(current)||current<.05)return null;
  const factor=Math.max(.25,Math.min(4,targetHeight/current));
  dealer.setParams({scale:dealer.params.scale*factor});
  const grounded=dealer.groundToFloor?.(FLOOR_Y);
  const after=dealer.getBounds?.();
  lastHumanScale={targetHeight,currentHeight:current,factor,finalHeight:after?after.getSize(new THREE.Vector3()).y:null,scale:dealer.params.scale,grounded};
  writeDealerInputs(dealer.params);refreshPreset();refreshStatus();
  return lastHumanScale;
}

dealer.addEventListener('deal',e=>spawnDealCard(e.detail));dealer.addEventListener('modechange',refreshStatus);dealer.addEventListener('loaded',()=>{loadSummary.dealer='loaded';refreshStatus()});dealer.addEventListener('groundchange',refreshStatus);dealer.addEventListener('loaderror',e=>{loadSummary.dealer=`ERROR ${e.detail?.error||''}`;refreshStatus()});
interaction.addEventListener('fold',e=>{window.SVR_DEALER_LAB_LAST_INTERACTION=e.detail;refreshStatus()});interaction.addEventListener('wager',e=>{window.SVR_DEALER_LAB_LAST_INTERACTION=e.detail;refreshStatus()});
wrist.addEventListener('action',e=>{if(e.detail.action==='deal-toggle'){if(dealer.mode==='deal-loop'&&!dealer.paused)dealer.togglePause();else dealer.setMode('deal-loop')}if(e.detail.action==='toggle-guides')table.toggleGuides();syncWatch();refreshStatus()});
function syncWatch(){wrist.updateStatus(dealer.paused?'paused':dealer.mode,table.guidesVisible)}

const nativeXRButton=VRButton.createButton(renderer,{optionalFeatures:['hand-tracking','local-floor','bounded-floor']});nativeXRButton.style.left='-10000px';nativeXRButton.style.bottom='-10000px';document.body.appendChild(nativeXRButton);document.getElementById('xrBtn')?.addEventListener('click',()=>nativeXRButton.click());
renderer.xr.addEventListener('sessionstart',()=>{controls.enabled=false;table.toggleGuides(false);document.body.classList.add('preview');if(dealer.loaded)normalizeEricHeight(HUMAN_DEALER_HEIGHT);syncWatch();refreshStatus()});
renderer.xr.addEventListener('sessionend',()=>{controls.enabled=true;document.body.classList.remove('preview');refreshStatus()});
function setCameraPreset(name){if(renderer.xr.isPresenting)return;const presets={front:{p:[0,1.48,3.35],t:[0,.83,-.05]},hands:{p:[1.15,1.25,1.55],t:[-.03,.87,.48]},table:{p:[0,2.65,2.45],t:[0,.62,-.06]}};const preset=presets[name]||presets.front;camera.position.fromArray(preset.p);controls.target.fromArray(preset.t);controls.update()}
function focusEric(){if(renderer.xr.isPresenting)return false;const box=dealer.getBounds?.();if(!box)return false;const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z,.35),distance=Math.max(.8,span*2.35);camera.position.set(center.x+distance*.18,center.y+.08,center.z+distance);controls.target.copy(center);controls.update();return true}
function groundEric(shouldFocus=true){const result=dealer.groundToFloor?.(FLOOR_Y);if(result){writeDealerInputs(dealer.params);refreshPreset();refreshStatus();if(shouldFocus)setTimeout(focusEric,40)}return result}
function click(id,fn){document.getElementById(id)?.addEventListener('click',fn)}
click('frontCamBtn',()=>setCameraPreset('front'));click('handsCamBtn',()=>setCameraPreset('hands'));click('tableCamBtn',()=>setCameraPreset('table'));click('focusEricBtn',focusEric);click('focusEricBtn2',focusEric);click('groundEricBtn',()=>groundEric(true));click('groundEricBtn2',()=>groundEric(true));click('idleBtn',()=>{dealer.setMode('idle');syncWatch();refreshStatus()});click('dealOnceBtn',()=>{dealer.setMode('deal-once');syncWatch();refreshStatus()});click('dealLoopBtn',()=>{dealer.setMode('deal-loop');syncWatch();refreshStatus()});click('pauseBtn',()=>{dealer.togglePause();syncWatch();refreshStatus()});click('diagBtn',()=>{table.toggleGuides();syncWatch();refreshStatus()});click('resetEricBtn',()=>{const p=dealer.resetVisible();writeDealerInputs(p);debugEric=false;dealer.setDebugMaterial(false);normalizeEricHeight(HUMAN_DEALER_HEIGHT);focusEric();refreshPreset();refreshStatus()});click('debugEricBtn',e=>{debugEric=!debugEric;dealer.setDebugMaterial(debugEric);e.currentTarget.classList.toggle('active',debugEric);refreshStatus()});click('collapseHudBtn',e=>{hud.classList.toggle('compact');e.currentTarget.textContent=hud.classList.contains('compact')?'Expand':'Compact'});click('hideHudBtn',()=>{hud.classList.add('hidden');document.getElementById('showHudBtn').style.display='block'});click('showHudBtn',()=>window.SVR_OPEN_DEALER_ADJUSTMENTS?.());click('previewBtn',()=>{document.body.classList.add('preview');table.toggleGuides(false);syncWatch();refreshStatus()});

const dealerInputs=['dealerScale','dealerX','dealerY','dealerZ','shoulderX','shoulderZ','elbowX','wristZ','dealSpeed'],tableInputs=['tableY','feltDrop','innerMargin','collisionDrop','cardLift'];
function number(id){return Number(document.getElementById(id).value)}
function updateValueLabel(input){const label=document.querySelector(`.val[data-for="${input.id}"]`);if(!label)return;const n=Number(input.value);if(['feltDrop','innerMargin','collisionDrop','cardLift'].includes(input.id))label.textContent=`${n.toFixed(4)}m / ${(n/.0254).toFixed(2)}in`;else label.textContent=n.toFixed(input.step?.includes('0001')?4:2)}
function applyDealerInputs(){dealer.setParams({scale:number('dealerScale'),x:number('dealerX'),y:number('dealerY'),z:number('dealerZ'),shoulderX:number('shoulderX'),shoulderZ:number('shoulderZ'),elbowX:number('elbowX'),wristZ:number('wristZ'),speed:number('dealSpeed')});refreshPreset()}
function applyTableInputs(){table.setParams({tableY:number('tableY'),feltDrop:number('feltDrop'),innerMargin:number('innerMargin'),collisionDrop:number('collisionDrop'),cardLift:number('cardLift')});refreshPreset()}
for(const id of dealerInputs){const input=document.getElementById(id);if(!input)continue;input.addEventListener('input',()=>{updateValueLabel(input);applyDealerInputs();if(id==='dealerScale'&&dealer.loaded)groundEric(false)})}for(const id of tableInputs){const input=document.getElementById(id);if(!input)continue;input.addEventListener('input',()=>{updateValueLabel(input);applyTableInputs()})}
function writeDealerInputs(p){const map={dealerScale:'scale',dealerX:'x',dealerY:'y',dealerZ:'z',shoulderX:'shoulderX',shoulderZ:'shoulderZ',elbowX:'elbowX',wristZ:'wristZ',dealSpeed:'speed'};for(const [id,key] of Object.entries(map)){const input=document.getElementById(id);if(!input||p[key]==null)continue;input.value=p[key];updateValueLabel(input)}}
function writeTableInputs(p){for(const id of tableInputs){const input=document.getElementById(id);if(!input||p[id]==null)continue;input.value=p[id];updateValueLabel(input)}}
function getFullPreset(){return{build:BUILD,dealer:{...dealer.params},calibration:table.getPreset(),grounding:{floorY:FLOOR_Y,feetY:dealer.getFeetY?.(),lastGround:dealer.lastGround},humanScale:lastHumanScale,interaction:interaction.snapshot(),note:'Phase 434 lab-only lock. Quest uses one native felt surface; protective top cover is hidden; Eric is normalized to human scale.'}}
function refreshPreset(){if(presetOut)presetOut.value=JSON.stringify(getFullPreset(),null,2)}
click('savePresetBtn',()=>{table.saveLocal();localStorage.setItem(DEALER_STORAGE_KEY,JSON.stringify(dealer.params));refreshPreset()});click('resetPresetBtn',()=>{table.reset();localStorage.removeItem(DEALER_STORAGE_KEY);dealer.setParams(DEALER_DEFAULTS);writeDealerInputs(DEALER_DEFAULTS);writeTableInputs(TABLE_DEFAULTS);if(dealer.loaded)normalizeEricHeight(HUMAN_DEALER_HEIGHT);refreshPreset();refreshStatus()});click('copyPresetBtn',async()=>{refreshPreset();await navigator.clipboard.writeText(presetOut.value).catch(()=>{})});
function applyPresetObject(preset){if(preset?.dealer){dealer.setParams({...DEALER_DEFAULTS,...preset.dealer});writeDealerInputs(dealer.params)}const tp=preset?.calibration?.table||preset?.table;if(tp){table.setParams({...TABLE_DEFAULTS,...tp,cardLift:Math.min(.004,Number(tp.cardLift??TABLE_DEFAULTS.cardLift))});writeTableInputs(table.params)}if(dealer.loaded)normalizeEricHeight(HUMAN_DEALER_HEIGHT);refreshPreset();refreshStatus();setTimeout(focusEric,80)}
click('applyPresetBtn',()=>{try{applyPresetObject(JSON.parse(presetInput.value));presetInput.value='';const b=document.getElementById('applyPresetBtn');b.textContent='Applied + Human Scale ✓';setTimeout(()=>b.textContent='Apply JSON',1100)}catch{const b=document.getElementById('applyPresetBtn');b.textContent='Invalid JSON';setTimeout(()=>b.textContent='Apply JSON',1200)}});
function restore(){try{const saved=JSON.parse(localStorage.getItem(DEALER_STORAGE_KEY)||'null');dealer.setParams(saved?{...DEALER_DEFAULTS,...saved}:DEALER_DEFAULTS)}catch{dealer.setParams(DEALER_DEFAULTS)}writeDealerInputs(dealer.params);if(!table.loadLocal())table.setParams(TABLE_DEFAULTS);writeTableInputs(table.params)}
function refreshStatus(){const rig=dealer.loaded?dealer.getRigReport():null,diag=table.getDiagnostics(),feet=dealer.getFeetY?.(),line=table.getBettingLine(),height=dealer.getBounds?.()?.getSize(new THREE.Vector3()).y;statusEl.textContent=[`BUILD ${BUILD}`,`Eric: ${dealer.loaded?'LOADED':loadSummary.dealer} • ${Number.isFinite(height)?height.toFixed(2):'…'}m tall • target ${HUMAN_DEALER_HEIGHT.toFixed(2)}m`,`Dealer ready pose: ${rig?.readyPose?'ON':'…'} • deck ${rig?.deckProp?'LEFT HAND':'…'} • deal card ${rig?.dealCardProp?'RIGHT HAND':'…'}`,`Deal origin: ${rig?.dealOrigin?rig.dealOrigin.map(n=>Number(n).toFixed(2)).join(', '):'waiting'} • mode ${dealer.paused?'PAUSED':dealer.mode}`,`Eric feet Y: ${Number.isFinite(feet)?feet.toFixed(4):'…'}m • floor ${FLOOR_Y.toFixed(3)}m`,`Table: ${table.table?'GLB LOADED':'loading…'} • native felt ${diag.nativeFeltCount} • true handrest ${diag.handRestCount} • hidden cover ${diag.hiddenTopCoverCount}`,`Felt mode: ${diag.visualFeltMode} • felt Y ${diag.visualFeltY}m • card landing Y ${diag.cardLandingY}m`,`Branding: XR-clear decal • SVR center • REIKI left • reserved sponsor right`,`Bet/pass line: ${line.radiusX.toFixed(2)}m x ${line.radiusZ.toFixed(2)}m • cards=fold • chips=wager`,`Guides: ${table.guidesVisible?'ON':'OFF'} • XR ${renderer.xr.isPresenting?'ACTIVE':'screen'}`].join('\n')}

Promise.allSettled([dealer.load(),table.load()]).then(results=>{loadSummary.dealer=results[0].status==='fulfilled'?'loaded':`ERROR ${String(results[0].reason?.message||results[0].reason||'load failed')}`;loadSummary.table=results[1].status==='fulfilled'?'loaded':`ERROR ${String(results[1].reason?.message||results[1].reason||'load failed')}`;restore();if(dealer.loaded)normalizeEricHeight(HUMAN_DEALER_HEIGHT);refreshPreset();syncWatch();refreshStatus();quickbar.style.display='flex';hud.style.display='block';document.getElementById('xrHint').style.display='block';if(dealer.loaded)setTimeout(()=>setCameraPreset('front'),160)});
window.SVR_DEALER_LAB={BUILD,scene,camera,renderer,dealer,table,interaction,wrist,getPreset:getFullPreset,focusEric,groundEric,normalizeEricHeight,applyPreset:applyPresetObject,evaluateCardRelease:(payload)=>interaction.evaluateCardRelease(payload),evaluateChipRelease:(payload)=>interaction.evaluateChipRelease(payload)};
let previous=performance.now()*.001,lastStatus=0;renderer.setAnimationLoop(()=>{const now=performance.now()*.001,dt=Math.min(.05,Math.max(0,now-previous));previous=now;dealer.update(dt,now);updateCards(now);controls.update();renderer.render(scene,camera);if(now-lastStatus>.6){lastStatus=now;refreshStatus()}});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
refreshPreset();refreshStatus();
