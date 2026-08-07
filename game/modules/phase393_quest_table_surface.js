/* PHASE-393-QUEST-TABLE-SURFACE-CALIBRATION-LOCK */
import * as THREE from 'three';
export const BUILD='PHASE-393-QUEST-TABLE-SURFACE-CALIBRATION-LOCK';
export const TARGET_TABLE_WIDTH=3.35,TARGET_TABLE_TOP=.98,TARGET_TABLE_BOTTOM=-.08,TARGET_FELT_RECESS=.11;
export const state={build:BUILD,installed:false,tableCalibrated:false,tableWidth:null,tableDepth:null,tableTop:null,tableBottom:null,baseLinesBuried:false,blackCoversDisabled:0,feltReady:false,feltTop:null,feltSource:null,cardsRaised:false,cardRoot:null,lastError:null,checkedAt:null};
let scene=null,table=null,felt=null,cardRoot=null;
const v1=new THREE.Vector3(),v2=new THREE.Vector3(),q1=new THREE.Quaternion();
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
function walk(root,fn,limit=26000){const stack=root?[root]:[],seen=new Set();while(stack.length&&seen.size<limit){const object=stack.pop();if(!object||seen.has(object))continue;seen.add(object);try{fn(object)}catch{}for(const child of object.children||[])if(child&&!seen.has(child))stack.push(child)}return seen.size}
function inside(object,root){for(let current=object;current;current=current.parent)if(current===root)return true;return false}
export function bounds(object){object?.updateWorldMatrix?.(true,true);const box=new THREE.Box3().setFromObject(object,true);return{box,size:box.getSize(new THREE.Vector3()),center:box.getCenter(new THREE.Vector3())}}
const valid=info=>Boolean(info&&!info.box.isEmpty()&&info.size.x>.01&&info.size.y>.01&&info.size.z>.01);
function labels(object){const list=Array.isArray(object?.material)?object.material:[object?.material];return `${object?.name||''} ${list.map(m=>m?.name||'').join(' ')}`.toLowerCase()}
function setWorldPosition(object,position){if(!object?.parent){object?.position.copy(position);return}object.parent.updateWorldMatrix?.(true,false);object.position.copy(object.parent.worldToLocal(position.clone()))}
function moveWorld(object,delta){object.getWorldPosition(v1);setWorldPosition(object,v1.add(delta))}
export function getTable(){return window.SVR_TABLE_AUTHORITY||window.SVR_PHASE380_ORIGINAL_TABLE||scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')||table||null}
export function getFelt(){return felt}
function calibrateTable(){
  table=getTable()||table;if(!table)return false;let info=bounds(table);if(!valid(info))return false;
  if(!table.userData?.svrPhase393Calibrated){
    const width=Math.max(info.size.x,info.size.z),uniform=clamp(TARGET_TABLE_WIDTH/Math.max(width,.001),.82,1.55);
    table.scale.multiplyScalar(uniform);table.updateWorldMatrix?.(true,true);info=bounds(table);
    const targetHeight=TARGET_TABLE_TOP-TARGET_TABLE_BOTTOM,vertical=clamp(targetHeight/Math.max(info.size.y,.001),.55,2.4);
    table.scale.y*=vertical;table.userData={...(table.userData||{}),svrPhase393Calibrated:true,svrPhase393Build:BUILD};table.updateWorldMatrix?.(true,true);
  }
  info=bounds(table);moveWorld(table,new THREE.Vector3(0,TARGET_TABLE_BOTTOM-info.box.min.y,0));table.updateWorldMatrix?.(true,true);info=bounds(table);
  state.tableWidth=+Math.max(info.size.x,info.size.z).toFixed(3);state.tableDepth=+Math.min(info.size.x,info.size.z).toFixed(3);state.tableTop=+info.box.max.y.toFixed(3);state.tableBottom=+info.box.min.y.toFixed(3);
  state.tableCalibrated=Math.abs(info.box.max.y-TARGET_TABLE_TOP)<.07;state.baseLinesBuried=info.box.min.y<=-.045;return state.tableCalibrated;
}
function disableOldCovers(){
  if(!scene||!table)return 0;const tableInfo=bounds(table),remove=[];
  walk(scene,object=>{
    if(!object?.isMesh||object===felt||inside(object,felt))return;const text=labels(object);
    const named=/PHASE390_RECESSED_BRANDED_PLAYING_SURFACE|PHASE388_OFFICIAL_SITE_LOGO_FELT|PHASE386_PROFESSIONAL_SVR_FELT|PHASE384_PROFESSIONAL_SVR_FELT|TOP[_ -]?COVER|TABLE[_ -]?COVER/i.test(object.name||'');
    let suspicious=false;
    if(inside(object,table)){
      let info;try{info=bounds(object)}catch{return}
      const large=info.size.x>tableInfo.size.x*.72&&info.size.z>tableInfo.size.z*.58;
      const flat=info.size.y<Math.max(.12,tableInfo.size.y*.14),nearTop=info.box.max.y>tableInfo.box.max.y-.18;
      const surfaceName=/overlay|cover|topfelt|tabletop|playing surface|polotno|felt|cloth|baize|object002|object003/.test(text);
      const protectedRail=/rail|handrest|armrest|padding|leather|trim|rim|edge/.test(text);
      suspicious=large&&flat&&nearTop&&surfaceName&&!protectedRail;
    }
    if(named||suspicious)remove.push(object);
  });
  for(const object of remove){object.visible=false;object.userData={...(object.userData||{}),svrPhase393BlackCoverDisabled:true};if(!inside(object,table)||/PHASE39/i.test(object.name||''))object.removeFromParent?.()}
  state.blackCoversDisabled=Math.max(state.blackCoversDisabled,remove.length);return remove.length;
}
function feltTexture(){
  const canvas=document.createElement('canvas');canvas.width=1536;canvas.height=768;const ctx=canvas.getContext('2d');
  const gradient=ctx.createRadialGradient(768,370,60,768,390,850);gradient.addColorStop(0,'#5d1b75');gradient.addColorStop(.45,'#351052');gradient.addColorStop(1,'#0d351f');ctx.fillStyle=gradient;ctx.fillRect(0,0,1536,768);
  ctx.globalAlpha=.13;ctx.fillStyle='#a677c7';ctx.font='52px serif';for(let y=40;y<768;y+=76)for(let x=20;x<1536;x+=82)ctx.fillText(['♠','♥','♣','♦'][((x/82+y/76)|0)%4],x,y);ctx.globalAlpha=1;
  ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(768,384,690,300,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='#d8b85c';ctx.lineWidth=6;ctx.beginPath();ctx.ellipse(768,384,646,258,0,0,Math.PI*2);ctx.stroke();
  const image=new Image();const texture=new THREE.CanvasTexture(canvas);image.onload=()=>{const scale=Math.min(330/image.width,250/image.height),w=image.width*scale,h=image.height*scale;ctx.drawImage(image,768-w/2,384-h/2,w,h);texture.needsUpdate=true};image.src='/logo.png?v=phase393';texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;return texture;
}
function ensureFelt(){
  table=getTable()||table;if(!scene||!table)return false;const info=bounds(table);if(!valid(info))return false;
  if(!felt?.parent){
    const shape=new THREE.Shape();shape.absellipse(0,0,1,.48,0,Math.PI*2,false,0);
    felt=new THREE.Mesh(new THREE.ShapeGeometry(shape,96),new THREE.MeshStandardMaterial({map:feltTexture(),color:0xffffff,roughness:.92,metalness:0,emissive:0x08020d,emissiveIntensity:.18,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2}));
    felt.name='PHASE393_VISIBLE_RECESSED_INNER_FELT';felt.userData={svrPhase393VisibleInnerFelt:true,build:BUILD};felt.rotation.x=-Math.PI/2;scene.add(felt);
  }
  table.getWorldQuaternion(q1);felt.quaternion.copy(q1).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),-Math.PI/2));
  const width=Math.max(info.size.x,info.size.z),depth=Math.min(info.size.x,info.size.z);felt.scale.set(width*.405,depth*.84,1);
  const position=info.center.clone();position.y=info.box.max.y-TARGET_FELT_RECESS;setWorldPosition(felt,position);felt.visible=true;felt.updateWorldMatrix?.(true,true);
  const feltInfo=bounds(felt);state.feltTop=+feltInfo.box.max.y.toFixed(3);state.feltSource='generated-inner-ellipse';state.feltReady=true;window.SVR_PHASE393_VISIBLE_FELT=felt;return true;
}
function findCardRoot(){return scene?.getObjectByName?.('PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT')||window.SVR_PHASE341_PRESENTATION_ROOT||cardRoot||null}
function raiseCards(){
  cardRoot=findCardRoot()||cardRoot;if(!cardRoot||!state.feltReady)return false;const info=bounds(cardRoot);if(!valid(info))return false;
  const target=(state.feltTop||TARGET_TABLE_TOP-TARGET_FELT_RECESS)+.018;
  if(!Number.isFinite(cardRoot.userData?.svrPhase393LowestOffset))cardRoot.userData={...(cardRoot.userData||{}),svrPhase393LowestOffset:info.box.min.y-cardRoot.position.y};
  const delta=target-info.box.min.y;moveWorld(cardRoot,new THREE.Vector3(0,delta,0));cardRoot.visible=true;
  walk(cardRoot,object=>{object.visible=true;if(object.isMesh){object.frustumCulled=false;object.renderOrder=Math.max(object.renderOrder||0,9393)}});
  state.cardsRaised=true;state.cardRoot=cardRoot.name||'PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT';return true;
}
export function sweep(sourceScene){
  try{scene=sourceScene||window.__SVR_SCENE__||scene;table=getTable()||table;if(!scene||!table)return false;calibrateTable();disableOldCovers();ensureFelt();raiseCards();state.installed=Boolean(state.tableCalibrated&&state.feltReady);state.checkedAt=new Date().toISOString();window.SVR_PHASE393_TABLE_SURFACE_STATE={...state};return state.installed}catch(error){state.lastError=String(error?.stack||error?.message||error);return false}
}
export function qa(){const tableInfo=table?bounds(table):null,feltInfo=felt?bounds(felt):null;return{...state,liveTableTop:valid(tableInfo)?+tableInfo.box.max.y.toFixed(3):null,liveTableBottom:valid(tableInfo)?+tableInfo.box.min.y.toFixed(3):null,liveFeltTop:valid(feltInfo)?+feltInfo.box.max.y.toFixed(3):null,pass:Boolean(state.installed&&state.tableCalibrated&&state.baseLinesBuried&&state.feltReady&&state.cardsRaised&&!state.lastError),checkedAt:new Date().toISOString()}}
