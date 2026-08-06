/* PHASE-389-GAME-RUNTIME-HEALTH-VISIBILITY-LOCK */
import * as THREE from 'three';
export const BUILD='PHASE-389-GAME-RUNTIME-HEALTH-VISIBILITY-LOCK';
const state={build:BUILD,installed:false,canvasVisible:false,tableVisible:false,dealerVisible:false,duplicateDealersRemoved:0,legacySeatAuthorityLoaded:false,rendererReady:false,lastError:null,checkedAt:null};
let timer=0;
function walk(root,fn,limit=22000){const stack=root?[root]:[],seen=new Set();while(stack.length&&seen.size<limit){const object=stack.pop();if(!object||seen.has(object))continue;seen.add(object);try{fn(object)}catch{}for(const child of object.children||[])if(child&&!seen.has(child))stack.push(child)}}
function visibleBox(object){if(!object?.isObject3D||object.visible===false)return false;try{object.updateWorldMatrix?.(true,true);const box=new THREE.Box3().setFromObject(object,true);const size=box.getSize(new THREE.Vector3());return !box.isEmpty()&&size.lengthSq()>.001}catch{return false}}
function findTable(scene){return window.SVR_TABLE_AUTHORITY||window.SVR_PHASE380_ORIGINAL_TABLE||scene?.getObjectByName?.('PHASE380_ORIGINAL_UPLOADED_TABLE_GLB_AUTHORITY')||scene?.getObjectByName?.('PHASE373_VISIBLE_TABLE_GLB_AUTHORITY')||null}
function sweep(){
 try{
  const scene=window.__SVR_SCENE__;
  const renderer=window.__SVR_RENDERER__;
  const canvas=renderer?.domElement||document.querySelector('#app canvas,canvas');
  if(canvas){canvas.style.visibility='visible';canvas.style.opacity='1';canvas.style.display='block'}
  const table=findTable(scene);
  if(table){table.visible=true;walk(table,o=>{if(o?.isMesh){o.visible=true;o.frustumCulled=false}})}
  const dealers=[];
  walk(scene,o=>{if(o?.isObject3D&&/(PHASE388_AUTHORITATIVE_DEALER_MODEL|PHASE389_AUTHORITATIVE_DEALER_MODEL)/i.test(String(o.name||'')))dealers.push(o)});
  const authoritative=window.SVR_PHASE388_ERIC_AUTHORITY||dealers[dealers.length-1]||null;
  for(const dealer of dealers){if(dealer!==authoritative&&dealer.parent){dealer.parent.remove(dealer);dealer.visible=false;state.duplicateDealersRemoved++}}
  if(authoritative){authoritative.visible=true;walk(authoritative,o=>{if(o?.isMesh){o.visible=true;o.frustumCulled=false}})}
  document.body.classList.add('boot-released');
  state.canvasVisible=Boolean(canvas&&getComputedStyle(canvas).visibility!=='hidden'&&getComputedStyle(canvas).display!=='none');
  state.tableVisible=visibleBox(table);
  state.dealerVisible=visibleBox(authoritative);
  state.rendererReady=Boolean(renderer&&scene&&window.__SVR_CAMERA__);
  state.legacySeatAuthorityLoaded=Boolean(window.SVR_PHASE388_FRONT_SOUTH_STATE?.installed);
  state.installed=state.rendererReady;
  state.checkedAt=new Date().toISOString();
 }catch(error){state.lastError=String(error?.stack||error?.message||error);state.checkedAt=new Date().toISOString()}
 return state;
}
function badge(){if(new URLSearchParams(location.search).get('debug')!=='1'||document.getElementById('phase389RuntimeBadge'))return;const node=document.createElement('div');node.id='phase389RuntimeBadge';node.textContent='PHASE 389 RUNTIME';Object.assign(node.style,{position:'fixed',right:'10px',bottom:'10px',zIndex:'2147483647',padding:'6px 9px',border:'1px solid #8dffb4',borderRadius:'999px',background:'rgba(0,12,18,.88)',color:'#8dffb4',font:'800 10px system-ui'});document.body.appendChild(node)}
function install(){if(state.installed)return;sweep();badge();timer=setInterval(sweep,900);window.addEventListener('beforeunload',()=>clearInterval(timer),{once:true});window.addEventListener('svr:phase388-core-ready',sweep);window.addEventListener('svr:phase389-core-ready',sweep)}
install();
window.SVR_PHASE389_RUNTIME_SWEEP=sweep;
window.SVR_PHASE389_RUNTIME_STATE=state;
window.SVR_PHASE389_RUNTIME_QA=()=>{sweep();return{...state,pass:state.rendererReady&&state.canvasVisible&&state.tableVisible&&!state.legacySeatAuthorityLoaded,checkedAt:new Date().toISOString()}};
