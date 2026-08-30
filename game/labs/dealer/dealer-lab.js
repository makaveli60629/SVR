import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { EricDealerModule } from '../../modules/dealer/eric_dealer_module.js';
import { TableCalibrationModule } from '../../modules/dealer/table_calibration_module.js';
import { WristLabModule } from '../../modules/dealer/wrist_lab_module.js';

const BUILD = 'DEALER-LAB-V2-UI-TABLE-ERIC-VISIBILITY';
const DEALER_DEFAULTS = { scale:0.0145,x:0,y:1.34,z:-1.67,shoulderX:-0.34,shoulderZ:-0.48,elbowX:-0.48,wristZ:-0.26,speed:1.05 };
const TABLE_DEFAULTS = { tableY:1.1,feltDrop:0.036,innerMargin:0.06,collisionDrop:0.03,cardLift:0.002 };
const app = document.getElementById('app');
const hud = document.getElementById('hud');
const quickbar = document.getElementById('quickbar');
const statusEl = document.getElementById('status');
const presetOut = document.getElementById('presetOut');
const presetInput = document.getElementById('presetInput');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x030207);
scene.fog = new THREE.FogExp2(0x07040c, 0.018);
const camera = new THREE.PerspectiveCamera(52, innerWidth / innerHeight, 0.01, 100);
camera.position.set(0, 1.65, 4.15);
const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;
app.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.02, -0.15);
controls.enableDamping = true;
controls.minDistance = 0.55;
controls.maxDistance = 10;
controls.maxPolarAngle = Math.PI * 0.49;

scene.add(new THREE.HemisphereLight(0xc8b5ff, 0x100717, 2.35));
const keyLight = new THREE.DirectionalLight(0xfff4ea, 3.4); keyLight.position.set(3.2,5.4,4.0); keyLight.castShadow = true; scene.add(keyLight);
const fill = new THREE.PointLight(0x6ddcff, 16, 9, 2); fill.position.set(-2.2,2.6,2.2); scene.add(fill);
const rim = new THREE.PointLight(0xa65cff, 25, 10, 2); rim.position.set(-2.5,3.1,-3.5); scene.add(rim);
const warm = new THREE.PointLight(0xffc36d, 9, 7, 2); warm.position.set(2.4,1.7,-2.6); scene.add(warm);

const floor = new THREE.Mesh(new THREE.CircleGeometry(7,96),new THREE.MeshPhysicalMaterial({color:0x09060e,roughness:0.58,metalness:0.15,clearcoat:0.15}));
floor.rotation.x = -Math.PI/2; floor.position.y = -0.004; floor.receiveShadow = true; scene.add(floor);
const halo = new THREE.Mesh(new THREE.RingGeometry(2.0,5.8,96),new THREE.MeshBasicMaterial({color:0x4d2473,transparent:true,opacity:0.11,side:THREE.DoubleSide}));
halo.rotation.x = -Math.PI/2; halo.position.y = 0.004; scene.add(halo);
const backdrop = new THREE.Mesh(new THREE.CylinderGeometry(7,7,5,96,1,true,Math.PI*0.1,Math.PI*1.8),new THREE.MeshStandardMaterial({color:0x09050f,roughness:0.96,metalness:0.02,side:THREE.BackSide}));
backdrop.position.y = 2.1; scene.add(backdrop);

const dealer = new EricDealerModule(scene, DEALER_DEFAULTS);
const table = new TableCalibrationModule(scene, TABLE_DEFAULTS);
const wrist = new WristLabModule(renderer, scene);

const cardGroup = new THREE.Group(); cardGroup.name='SVR_Lab_DealtCards'; scene.add(cardGroup);
const activeCards=[]; let cardSerial=0; let debugEric=false; let loadSummary={dealer:'loading',table:'loading'};
function makeCard(){const mats=[0,1,2,3,4].map(()=>new THREE.MeshPhysicalMaterial({color:0xfffdf8,roughness:.42,clearcoat:.1}));mats.push(new THREE.MeshPhysicalMaterial({color:0x35134e,roughness:.36,metalness:.05}));const card=new THREE.Mesh(new THREE.BoxGeometry(.063,.0025,.089),mats);card.name=`LabCard_${++cardSerial}`;card.castShadow=true;return card}
function seatTarget(index,y){const points=[[-.80,.42],[-.98,-.03],[-.66,-.52],[.66,-.52],[.98,-.03],[.80,.42]];const [x,z]=points[index%points.length];return new THREE.Vector3(x,y,z)}
function spawnDealCard(seatIndex){const y=table.getSurfaceY(),card=makeCard(),start=new THREE.Vector3(.02,y+.20,-.78),end=seatTarget(seatIndex,y+.004);card.position.copy(start);card.rotation.set(0,(seatIndex-2.5)*.09,0);cardGroup.add(card);activeCards.push({card,start,end,born:performance.now()*.001,duration:.43});while(cardGroup.children.length>24)cardGroup.remove(cardGroup.children[0])}
function updateCards(now){for(let i=activeCards.length-1;i>=0;i--){const item=activeCards[i],p=Math.min(1,(now-item.born)/item.duration),s=p*p*(3-2*p);item.card.position.lerpVectors(item.start,item.end,s);item.card.position.y+=Math.sin(Math.PI*s)*.11;item.card.rotation.z=(1-s)*.16;if(p>=1)activeCards.splice(i,1)}}

dealer.addEventListener('deal',e=>spawnDealCard(e.detail.seatIndex)); dealer.addEventListener('modechange',refreshStatus); dealer.addEventListener('loaded',()=>{loadSummary.dealer='loaded';setTimeout(focusEric,120);refreshStatus()}); dealer.addEventListener('loaderror',e=>{loadSummary.dealer=`ERROR ${e.detail?.error||''}`;refreshStatus()});
wrist.addEventListener('action',e=>{if(e.detail.action==='deal-toggle'){if(dealer.mode==='deal-loop'&&!dealer.paused)dealer.togglePause();else dealer.setMode('deal-loop')}if(e.detail.action==='toggle-guides')table.toggleGuides();syncWatch();refreshStatus()});
function syncWatch(){wrist.updateStatus(dealer.paused?'paused':dealer.mode,table.guidesVisible)}

const nativeXRButton=VRButton.createButton(renderer,{optionalFeatures:['hand-tracking','local-floor','bounded-floor']});nativeXRButton.style.left='-10000px';nativeXRButton.style.bottom='-10000px';document.body.appendChild(nativeXRButton);document.getElementById('xrBtn').addEventListener('click',()=>nativeXRButton.click());renderer.xr.addEventListener('sessionstart',()=>{controls.enabled=false;refreshStatus()});renderer.xr.addEventListener('sessionend',()=>{controls.enabled=true;refreshStatus()});
function setCameraPreset(name){if(renderer.xr.isPresenting)return;const presets={front:{p:[0,1.65,4.15],t:[0,1.05,-.15]},hands:{p:[1.55,1.52,1.55],t:[.08,1.03,-.70]},table:{p:[0,3.15,2.85],t:[0,.92,-.10]}};const preset=presets[name]||presets.front;camera.position.fromArray(preset.p);controls.target.fromArray(preset.t);controls.update()}
function focusEric(){if(renderer.xr.isPresenting)return false;const box=dealer.getBounds?.();if(!box){camera.position.set(0,1.65,3.3);controls.target.set(dealer.params.x,dealer.params.y,dealer.params.z);controls.update();return false}const center=box.getCenter(new THREE.Vector3()),size=box.getSize(new THREE.Vector3()),span=Math.max(size.x,size.y,size.z,.45),distance=Math.max(1.0,span*2.25);camera.position.set(center.x+distance*.15,center.y+Math.min(.35,size.y*.08),center.z+distance);controls.target.copy(center);controls.update();return true}

function click(id,fn){document.getElementById(id)?.addEventListener('click',fn)}
click('frontCamBtn',()=>setCameraPreset('front'));click('handsCamBtn',()=>setCameraPreset('hands'));click('tableCamBtn',()=>setCameraPreset('table'));click('focusEricBtn',focusEric);click('focusEricBtn2',focusEric);
click('idleBtn',()=>{dealer.setMode('idle');syncWatch();refreshStatus()});click('dealOnceBtn',()=>{dealer.setMode('deal-once');syncWatch();refreshStatus()});click('dealLoopBtn',()=>{dealer.setMode('deal-loop');syncWatch();refreshStatus()});click('pauseBtn',()=>{dealer.togglePause();syncWatch();refreshStatus()});click('diagBtn',()=>{table.toggleGuides();syncWatch();refreshStatus()});
click('resetEricBtn',()=>{const p=dealer.resetVisible();writeDealerInputs(p);debugEric=false;dealer.setDebugMaterial(false);focusEric();refreshPreset();refreshStatus()});click('debugEricBtn',e=>{debugEric=!debugEric;dealer.setDebugMaterial(debugEric);e.currentTarget.classList.toggle('active',debugEric);refreshStatus()});
click('collapseHudBtn',e=>{hud.classList.toggle('compact');e.currentTarget.textContent=hud.classList.contains('compact')?'Expand':'Compact'});click('hideHudBtn',()=>{hud.classList.add('hidden');document.getElementById('showHudBtn').style.display='block'});click('showHudBtn',()=>{document.body.classList.remove('preview');hud.classList.remove('hidden');hud.style.display='block';document.getElementById('showHudBtn').style.display='none'});click('previewBtn',()=>{document.body.classList.add('preview');table.toggleGuides(false);syncWatch();refreshStatus()});

document.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='h'&&!['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)){hud.classList.toggle('hidden');document.getElementById('showHudBtn').style.display=hud.classList.contains('hidden')?'block':'none'}});

const dealerInputs=['dealerScale','dealerX','dealerY','dealerZ','shoulderX','shoulderZ','elbowX','wristZ','dealSpeed'];const tableInputs=['tableY','feltDrop','innerMargin','collisionDrop','cardLift'];
function number(id){return Number(document.getElementById(id).value)}
function updateValueLabel(input){const label=document.querySelector(`.val[data-for="${input.id}"]`);if(!label)return;const n=Number(input.value);if(['feltDrop','innerMargin','collisionDrop','cardLift'].includes(input.id))label.textContent=`${n.toFixed(3)}m / ${(n/.0254).toFixed(2)}in`;else label.textContent=n.toFixed(input.step?.includes('0001')?4:2)}
function applyDealerInputs(){dealer.setParams({scale:number('dealerScale'),x:number('dealerX'),y:number('dealerY'),z:number('dealerZ'),shoulderX:number('shoulderX'),shoulderZ:number('shoulderZ'),elbowX:number('elbowX'),wristZ:number('wristZ'),speed:number('dealSpeed')});refreshPreset()}
function applyTableInputs(){table.setParams({tableY:number('tableY'),feltDrop:number('feltDrop'),innerMargin:number('innerMargin'),collisionDrop:number('collisionDrop'),cardLift:number('cardLift')});refreshPreset()}
for(const id of dealerInputs){const input=document.getElementById(id);updateValueLabel(input);input.addEventListener('input',()=>{updateValueLabel(input);applyDealerInputs()})}for(const id of tableInputs){const input=document.getElementById(id);updateValueLabel(input);input.addEventListener('input',()=>{updateValueLabel(input);applyTableInputs()})}
function writeDealerInputs(p){const map={dealerScale:'scale',dealerX:'x',dealerY:'y',dealerZ:'z',shoulderX:'shoulderX',shoulderZ:'shoulderZ',elbowX:'elbowX',wristZ:'wristZ',dealSpeed:'speed'};for(const [id,key] of Object.entries(map)){if(p[key]==null)continue;const input=document.getElementById(id);input.value=p[key];updateValueLabel(input)}}
function writeTableInputs(p){const map={tableY:'tableY',feltDrop:'feltDrop',innerMargin:'innerMargin',collisionDrop:'collisionDrop',cardLift:'cardLift'};for(const [id,key] of Object.entries(map)){if(p[key]==null)continue;const input=document.getElementById(id);input.value=p[key];updateValueLabel(input)}}
function getFullPreset(){return{build:BUILD,dealer:{...dealer.params},calibration:table.getPreset(),note:'Lab-only preset. Promote values to production only after visual approval.'}}
function refreshPreset(){presetOut.value=JSON.stringify(getFullPreset(),null,2)}
click('savePresetBtn',()=>{table.saveLocal();localStorage.setItem('svrDealerLabDealerPresetV2',JSON.stringify(dealer.params));refreshPreset()});click('resetPresetBtn',()=>{table.reset();localStorage.removeItem('svrDealerLabDealerPresetV2');dealer.setParams(DEALER_DEFAULTS);writeDealerInputs(DEALER_DEFAULTS);writeTableInputs(TABLE_DEFAULTS);refreshPreset();refreshStatus()});click('copyPresetBtn',async()=>{refreshPreset();await navigator.clipboard.writeText(presetOut.value).catch(()=>{})});
function applyPresetObject(preset){if(preset?.dealer){dealer.setParams({...DEALER_DEFAULTS,...preset.dealer});writeDealerInputs(dealer.params)}const tablePreset=preset?.calibration?.table||preset?.table;if(tablePreset){table.setParams({...TABLE_DEFAULTS,...tablePreset});writeTableInputs(table.params)}refreshPreset();refreshStatus();setTimeout(focusEric,80)}
click('applyPresetBtn',()=>{try{const preset=JSON.parse(presetInput.value);applyPresetObject(preset);presetInput.value='';document.getElementById('applyPresetBtn').textContent='Applied ✓';setTimeout(()=>document.getElementById('applyPresetBtn').textContent='Apply JSON',1000)}catch(error){document.getElementById('applyPresetBtn').textContent='Invalid JSON';setTimeout(()=>document.getElementById('applyPresetBtn').textContent='Apply JSON',1200)}});
function restore(){try{const saved=JSON.parse(localStorage.getItem('svrDealerLabDealerPresetV2')||localStorage.getItem('svrDealerLabDealerPresetV1')||'null');if(saved){dealer.setParams(saved);writeDealerInputs(dealer.params)}}catch{}table.loadLocal();writeTableInputs(table.params)}
function refreshStatus(){const rig=dealer.loaded?dealer.getRigReport():null;statusEl.textContent=[`BUILD ${BUILD}`,`Eric model: ${dealer.loaded?'VISIBLE / LOADED':loadSummary.dealer}`,`Eric texture: ${rig?.textured?'REAL JPG MATERIALS':'waiting'}`,`Idle FBX: ${rig?.mixer?'ACTIVE':dealer.loaded?'procedural fallback':'waiting'}`,`Rig bones: ${rig?.boneCount??'…'}`,`Eric debug: ${debugEric?'ON':'OFF'}`,`Mode: ${dealer.paused?'PAUSED':dealer.mode}`,`Table: ${table.table?'GLB + POLISHED FELT/RAIL':'loading…'}`,`Table target: Y ${table.params.tableY.toFixed(3)}m • felt drop ${(table.params.feltDrop/.0254).toFixed(2)}in`, `Guides: ${table.guidesVisible?'ON':'OFF'}`,`Card plane Y: ${table.getSurfaceY().toFixed(3)}m`,`XR: ${renderer.xr.isPresenting?'ACTIVE':'screen'}`,`Watch: ${wrist.mountedTo?'LEFT XR INPUT':'waiting for XR'}`].join('\n')}

Promise.allSettled([dealer.load(),table.load()]).then(results=>{loadSummary.dealer=results[0].status==='fulfilled'?'loaded':`ERROR ${String(results[0].reason?.message||results[0].reason||'load failed')}`;loadSummary.table=results[1].status==='fulfilled'?'loaded':`ERROR ${String(results[1].reason?.message||results[1].reason||'load failed')}`;restore();refreshPreset();syncWatch();refreshStatus();quickbar.style.display='flex';hud.style.display='block';document.getElementById('xrHint').style.display='block';if(dealer.loaded)setTimeout(focusEric,160)});
window.SVR_DEALER_LAB={BUILD,scene,camera,renderer,dealer,table,wrist,getPreset:getFullPreset,focusEric,applyPreset:applyPresetObject};
let previous=performance.now()*.001,lastStatus=0;renderer.setAnimationLoop(()=>{const now=performance.now()*.001,dt=Math.min(.05,Math.max(0,now-previous));previous=now;dealer.update(dt,now);updateCards(now);controls.update();renderer.render(scene,camera);if(now-lastStatus>.6){lastStatus=now;refreshStatus()}});
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7))});
refreshPreset();refreshStatus();
