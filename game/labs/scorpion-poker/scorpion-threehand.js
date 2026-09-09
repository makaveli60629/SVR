import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { createCore } from '../../modules/core_scene.js';
import { buildPhase195CleanLobbyWorld } from '../../modules/phase195_clean_lobby_world.js';
import { createTeleportRig } from '../../modules/movement_phase228.js?v=phase169-locomotion-polish';
import { TableCalibrationModule } from '../../modules/dealer/table_calibration_module.js?v=phase434';
import { EricDealerModule } from '../../modules/dealer/eric_dealer_module.js?v=phase444';

const BUILD='PHASE-436-SCORPION-THREE-HAND-ERIC-DEALER-TEST';
const DEALER_PARAMS={scale:0.0047,x:0,y:0,z:-1.02,shoulderX:0.55,shoulderZ:-0.48,elbowX:0.36,wristZ:-0.45,speed:0.82};
const TABLE_PARAMS={tableY:0.62,feltDrop:0.014,innerMargin:0.125,collisionDrop:0.02,cardLift:0.0006};
const app=document.getElementById('app');
const status=document.getElementById('status');
const startBtn=document.getElementById('startHandBtn');
const resetBtn=document.getElementById('resetBtn');
const vrMount=document.getElementById('vrMount');

function say(text){if(status)status.textContent=text}
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms))}
function shuffledDeck(){
  const suits=['♠','♥','♦','♣'],ranks=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const deck=[];for(const suit of suits)for(const rank of ranks)deck.push({rank,suit,red:suit==='♥'||suit==='♦'});
  for(let i=deck.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]]}
  return deck;
}
function cardTexture(card,faceUp=true){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=360;const c=canvas.getContext('2d');
  if(!faceUp){
    c.fillStyle='#180923';c.fillRect(0,0,256,360);c.strokeStyle='#9c5cff';c.lineWidth=14;c.strokeRect(12,12,232,336);
    c.fillStyle='#f3e8ff';c.font='900 56px system-ui';c.textAlign='center';c.fillText('SVR',128,170);c.font='800 30px system-ui';c.fillText('POKER',128,215);
  }else{
    c.fillStyle='#fffdf8';c.fillRect(0,0,256,360);c.strokeStyle='#d9d6d1';c.lineWidth=6;c.strokeRect(5,5,246,350);
    c.fillStyle=card.red?'#d82942':'#11131a';c.textAlign='left';c.font='900 58px system-ui';c.fillText(card.rank,22,70);c.font='700 58px system-ui';c.fillText(card.suit,22,132);
    c.textAlign='center';c.font='800 116px system-ui';c.fillText(card.suit,128,250);
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t;
}
function makeCard(card,faceUp=true){
  const mat=new THREE.MeshBasicMaterial({map:cardTexture(card,faceUp),side:THREE.DoubleSide,transparent:false});
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(.102,.144),mat);mesh.rotation.x=-Math.PI/2;mesh.renderOrder=20;mesh.userData.card=card;return mesh;
}
function makeNameSprite(name,sub){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=180;const c=canvas.getContext('2d');
  c.fillStyle='rgba(5,3,10,.86)';c.fillRect(8,8,496,164);c.strokeStyle='#9c5cff';c.lineWidth=7;c.strokeRect(8,8,496,164);
  c.fillStyle='#fff';c.textAlign='center';c.font='900 55px system-ui';c.fillText(name,256,78);c.fillStyle='#c9b2e8';c.font='700 30px system-ui';c.fillText(sub,256,130);
  const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const spr=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));spr.scale.set(1.1,.39,1);return spr;
}
function makeBot(name,accent){
  const g=new THREE.Group();g.name=`SCORPION_BOT_${name}`;
  const dark=new THREE.MeshStandardMaterial({color:0x17131d,roughness:.7});const trim=new THREE.MeshStandardMaterial({color:accent,roughness:.45,metalness:.12});
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.19,.52,6,12),dark);torso.position.y=.92;g.add(torso);
  const head=new THREE.Mesh(new THREE.SphereGeometry(.16,20,16),new THREE.MeshStandardMaterial({color:0xb88970,roughness:.78}));head.position.y=1.39;g.add(head);
  const shoulder=new THREE.Mesh(new THREE.BoxGeometry(.55,.12,.18),trim);shoulder.position.y=1.16;g.add(shoulder);
  for(const x of [-.15,.15]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.075,.44,5,10),dark);leg.position.set(x,.48,.13);leg.rotation.x=Math.PI/2.7;g.add(leg)}
  const tag=makeNameSprite(name,'BOT • $5,000');tag.position.set(0,1.82,0);g.add(tag);return g;
}

const {scene,camera,renderer}=createCore({containerId:'app'});
renderer.xr.enabled=true;
scene.userData._camera=camera;
window.__SVR_SCORPION_SCENE__=scene;
window.__SVR_SCORPION_RENDERER__=renderer;
window.__SVR_SCORPION_CAMERA__=camera;

say('Loading the real Scorpion Room…');
const world=await buildPhase195CleanLobbyWorld(scene,{renderer,log:()=>{}});
const scorpion=world.sceneTargets?.scorpion;
if(!scorpion?.pos||!scorpion?.look)throw new Error('Scorpion Room target unavailable.');

const center=new THREE.Vector3(scorpion.look.x,0,scorpion.look.z);
const spawn=new THREE.Vector3(scorpion.pos.x,0,scorpion.pos.z);
const towardPlayer=spawn.clone().sub(center).setY(0).normalize();
const roomRoot=new THREE.Group();roomRoot.name='PHASE436_SCORPION_POKER_ROOT';roomRoot.position.copy(center);roomRoot.rotation.y=Math.atan2(towardPlayer.x,towardPlayer.z);scene.add(roomRoot);

camera.position.set(spawn.x,1.55,spawn.z);camera.lookAt(scorpion.look.x,.86,scorpion.look.z);
const tp=createTeleportRig({scene,renderer,camera,roomClamp:world.roomClamp,log:()=>{}});

const table=new TableCalibrationModule(scene,TABLE_PARAMS);await table.load();roomRoot.add(table.group);table.group.position.set(0,0,0);table.group.rotation.set(0,0,0);table.toggleGuides(false);
const dealer=new EricDealerModule(scene,DEALER_PARAMS);await dealer.load();roomRoot.add(dealer.group);dealer.setParams(DEALER_PARAMS);dealer.groundToFloor(0);
dealer.applyReadyPose=()=>{
  const la=dealer.getBone('leftarm'),lf=dealer.getBone('leftforearm'),lh=dealer.getBone('lefthand');
  const ra=dealer.getBone('rightarm'),rf=dealer.getBone('rightforearm'),rh=dealer.getBone('righthand');
  dealer.applyDelta(la,.55,.08,.48);dealer.applyDelta(lf,.88,.02,-.12);dealer.applyDelta(lh,.10,0,.18);
  dealer.applyDelta(ra,.50,-.08,-.46);dealer.applyDelta(rf,.80,-.02,.14);dealer.applyDelta(rh,.08,0,-.16);
};

const botLeft=makeBot('NOVA',0x7bd5ff);botLeft.position.set(-1.02,0,.05);botLeft.rotation.y=-Math.PI/2*.72;roomRoot.add(botLeft);
const botRight=makeBot('MAYA',0xd58cff);botRight.position.set(1.02,0,.05);botRight.rotation.y=Math.PI/2*.72;roomRoot.add(botRight);
const playerTag=makeNameSprite('YOU','PLAYER • $5,000');playerTag.position.set(0,.95,1.28);roomRoot.add(playerTag);

const cardGroup=new THREE.Group();cardGroup.name='PHASE436_SCORPION_CARDS';scene.add(cardGroup);
const activeFlights=[];let handRunning=false,currentTarget=null,currentCard=null,currentFaceUp=true;
const localTargets={
  you:[new THREE.Vector3(-.10,table.getSurfaceY()+.002,.60),new THREE.Vector3(.10,table.getSurfaceY()+.002,.60)],
  nova:[new THREE.Vector3(-.67,table.getSurfaceY()+.002,.05),new THREE.Vector3(-.55,table.getSurfaceY()+.002,.05)],
  maya:[new THREE.Vector3(.55,table.getSurfaceY()+.002,.05),new THREE.Vector3(.67,table.getSurfaceY()+.002,.05)],
  board:[new THREE.Vector3(-.24,table.getSurfaceY()+.002,-.18),new THREE.Vector3(-.12,table.getSurfaceY()+.002,-.18),new THREE.Vector3(0,table.getSurfaceY()+.002,-.18),new THREE.Vector3(.14,table.getSurfaceY()+.002,-.18),new THREE.Vector3(.28,table.getSurfaceY()+.002,-.18)]
};
function worldTarget(local){return roomRoot.localToWorld(local.clone())}
function clearCards(){for(const child of [...cardGroup.children]){child.material?.map?.dispose?.();child.material?.dispose?.();child.geometry?.dispose?.();cardGroup.remove(child)}activeFlights.length=0}
function flyCard(origin,target,card,faceUp){
  const mesh=makeCard(card,faceUp);mesh.position.copy(origin);mesh.rotation.x=-Math.PI/2;cardGroup.add(mesh);
  return new Promise(resolve=>activeFlights.push({mesh,start:origin.clone(),end:target.clone(),born:performance.now()/1000,duration:.42,resolve}));
}
dealer.addEventListener('deal',async event=>{
  if(!currentTarget||!currentCard)return;
  const origin=Array.isArray(event.detail?.origin)?new THREE.Vector3(...event.detail.origin):dealer.getDealOrigin();
  const target=currentTarget;const card=currentCard;const face=currentFaceUp;
  currentTarget=currentCard=null;
  await flyCard(origin,target,card,face);
});
async function dealerCard(card,target,faceUp=true){
  currentCard=card;currentTarget=target;currentFaceUp=faceUp;dealer.setMode('deal-once');
  const start=performance.now();while(currentCard&&performance.now()-start<1800)await sleep(35);await sleep(520);
}
async function runHand(){
  if(handRunning)return;handRunning=true;startBtn.disabled=true;clearCards();
  try{
    const deck=shuffledDeck();const holes={you:[deck.pop(),deck.pop()],nova:[deck.pop(),deck.pop()],maya:[deck.pop(),deck.pop()]};
    say('Eric is dealing • YOU + NOVA + MAYA');
    const order=[['you',0],['nova',0],['maya',0],['you',1],['nova',1],['maya',1]];
    for(const [seat,i] of order)await dealerCard(holes[seat][i],worldTarget(localTargets[seat][i]),seat==='you');
    deck.pop();say('Pre-flop complete • bots check/call • dealing FLOP');await sleep(700);
    for(let i=0;i<3;i++)await dealerCard(deck.pop(),worldTarget(localTargets.board[i]),true);
    deck.pop();say('FLOP • NOVA checks • MAYA checks • dealing TURN');await sleep(850);
    await dealerCard(deck.pop(),worldTarget(localTargets.board[3]),true);
    deck.pop();say('TURN • three-handed test continues • dealing RIVER');await sleep(850);
    await dealerCard(deck.pop(),worldTarget(localTargets.board[4]),true);
    say('RIVER complete • Eric dealer animation + 3-handed table verified');
  }finally{dealer.setMode('idle');handRunning=false;startBtn.disabled=false}
}

startBtn.addEventListener('click',runHand);resetBtn.addEventListener('click',()=>{dealer.setMode('idle');clearCards();say('Scorpion table reset • ready for a new hand')});
const nativeXR=VRButton.createButton(renderer,{optionalFeatures:['local-floor','bounded-floor','hand-tracking']});nativeXR.style.position='static';nativeXR.style.width='100%';nativeXR.style.margin='0';nativeXR.style.background='#211132';nativeXR.style.border='1px solid #8c5bd0';nativeXR.style.borderRadius='12px';nativeXR.style.padding='12px';vrMount.appendChild(nativeXR);
renderer.xr.addEventListener('sessionstart',async()=>{await tp.onSessionStart?.();tp.setPlayerPose?.(spawn.x,0,spawn.z);setTimeout(()=>{if(!handRunning)runHand()},1400);say('Oculus active • spawned in Scorpion Room • Eric preparing the deal')});
renderer.xr.addEventListener('sessionend',()=>say('XR ended • Scorpion three-hand test ready'));

let prev=performance.now()/1000;
renderer.setAnimationLoop(()=>{
  const now=performance.now()/1000,dt=Math.min(.05,Math.max(0,now-prev));prev=now;
  if(!renderer.xr.isPresenting){camera.position.lerp(new THREE.Vector3(spawn.x,1.55,spawn.z),.035);camera.lookAt(scorpion.look.x,.86,scorpion.look.z)}
  scene.userData._camera=renderer.xr.isPresenting?renderer.xr.getCamera(camera):camera;
  scene.userData._tickWorld?.(dt);
  dealer.update(dt,now);
  for(let i=activeFlights.length-1;i>=0;i--){const f=activeFlights[i],p=Math.min(1,(now-f.born)/f.duration),s=p*p*(3-2*p);f.mesh.position.lerpVectors(f.start,f.end,s);f.mesh.position.y+=Math.sin(Math.PI*s)*.07;if(p>=1){f.mesh.position.copy(f.end);activeFlights.splice(i,1);f.resolve?.()}}
  renderer.render(scene,camera);
});

say('Scorpion Room ready • exactly YOU + NOVA + MAYA • Eric is the house dealer');
window.SVR_SCORPION_THREE_HAND={BUILD,scene,camera,renderer,world,table,dealer,runHand,clearCards,playerCount:3,botCount:2};
