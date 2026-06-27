import * as THREE from 'three';
const BUILD='PHASE-96-CLEAN-WEBSITE-THIRD-CAMERA-PREVIEW-LOCK';
let scene,camera,root,active=false,hidden3d=[],hiddenDom=[],raf=0,lastSweep=0;
const qs=new URLSearchParams(location.search);
const preview=qs.has('preview')||qs.get('cam')==='director'||qs.has('cam3')||qs.has('autocam')||String(location.search).includes('phase96');
function S(){return window.__SVR_SCENE__||window.scene||null}
function C(){return window.__SVR_CAMERA__||window.camera||null}
function R(){const s=S();return s?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||s}
function hideDom(){hiddenDom=[];const allow=['app'];document.querySelectorAll('body > *').forEach(el=>{if(allow.includes(el.id))return;if(el.tagName==='SCRIPT'||el.tagName==='STYLE')return;if(el.style.display==='none')return;hiddenDom.push([el,el.style.display,el.style.visibility,el.style.opacity]);el.style.display='none';el.style.visibility='hidden';el.style.opacity='0'});document.documentElement.classList.add('svr-clean-third-camera-preview');document.body.classList.add('svr-clean-third-camera-preview')}
function showDom(){hiddenDom.forEach(([el,d,v,o])=>{el.style.display=d;el.style.visibility=v;el.style.opacity=o});hiddenDom=[]}
function shouldHideObject(o){const n=String(o.name||'');if(!n)return false;const keep=/moon|mars|star|sky|skyline|building|city|floor|wall|ceiling|table|felt|rail|chip|card|pot|logo|chair|seat|npc|bot|eric|claudia|carla|storefront|portal|store|reiki|pga|lounge|scorpion|sponsor|runway|carpet|light|glow|planet/i;const hide=/hud|debug|audit|diagnostic|label|tag|name|text|screen|display|panel|banner|billboard|badge|notice|overlay|button|menu|ui|marker|position|phase|build|active|instructions|controls|watch|floating|prompt|sign/i;
if(hide.test(n)&&!keep.test(n))return true;
if(/PHASE9[45]_.*SIGN/i.test(n))return true;
if(/PHASE9[45]_.*LABEL/i.test(n))return true;
if(/PHASE9[45]_.*HUD/i.test(n))return true;
if(/PHASE94_ACTIVE_LABEL|PHASE95_.*SIGN|PHASE95.*HUD|P93_ACTIVE_LABEL/i.test(n))return true;
return false}
function hide3d(){const r=R();if(!r)return;hidden3d=[];r.traverse(o=>{if(o.visible!==false&&shouldHideObject(o)){hidden3d.push(o);o.visible=false}})}
function restore3d(){hidden3d.forEach(o=>{try{o.visible=true}catch(e){}});hidden3d=[]}
function findCenter(){let table=null,moon=null,mars=null,store=null;R()?.traverse(o=>{const n=String(o.name||'').toLowerCase();if(!table&&n.includes('table'))table=o;if(!moon&&n.includes('moon'))moon=o;if(!mars&&n.includes('mars'))mars=o;if(!store&&(n.includes('storefront')||n.includes('portal')||n.includes('store')))store=o});function pos(o,fallback){try{o.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(o),c=new THREE.Vector3();b.getCenter(c);return c}catch(e){return fallback}}return{table:pos(table,new THREE.Vector3(0,.85,0)),moon:pos(moon,new THREE.Vector3(-3.5,5.8,-8.5)),mars:pos(mars,new THREE.Vector3(-2.3,5.2,-9)),store:pos(store,new THREE.Vector3(3,1.4,2))}}
const path=[new THREE.Vector3(0,1.5,4.8),new THREE.Vector3(-3.15,1.65,2.65),new THREE.Vector3(-3.65,2.2,-2.6),new THREE.Vector3(-3.25,4.25,-6.25),new THREE.Vector3(0,1.55,-3.05),new THREE.Vector3(3.25,1.7,-2.65),new THREE.Vector3(3.45,1.65,2.45),new THREE.Vector3(1.2,1.5,4.65)];
function tick(t){if(!active||!camera)return;const f=(t*.000018)%1,seg=f*path.length,i=Math.floor(seg)%path.length,j=(i+1)%path.length,u=seg-i,e=u*u*(3-2*u);camera.position.lerpVectors(path[i],path[j],e);const refs=findCenter();let look=refs.table;if(i===2||i===3)look=refs.moon;if(i===5||i===6)look=refs.store;camera.lookAt(look);if(t-lastSweep>900){lastSweep=t;hideDom();hide3d()}window.SVR_PHASE96_THIRD_CAMERA={build:BUILD,active:true,clean:true,hiddenDom:hiddenDom.length,hidden3d:hidden3d.length,segment:i,checkedAt:new Date().toISOString()};raf=requestAnimationFrame(tick)}
function install(){scene=S();camera=C();root=R();if(!scene||!camera||!root)return setTimeout(install,350);active=true;hideDom();hide3d();window.SVR_LOCKED_FINAL_BUILD=BUILD;window.SVR_LIVE_BUILD_POINTER=BUILD;window.SVR_RUN_PHASE96_PREVIEW_AUDIT=()=>({build:BUILD,active,clean:true,hiddenDom:hiddenDom.length,hidden3d:hidden3d.length,hasScene:!!S(),hasCamera:!!C(),checkedAt:new Date().toISOString()});window.SVR_PHASE96_PREVIEW_ON=()=>{active=true;hideDom();hide3d();cancelAnimationFrame(raf);raf=requestAnimationFrame(tick);return window.SVR_RUN_PHASE96_PREVIEW_AUDIT()};window.SVR_PHASE96_PREVIEW_OFF=()=>{active=false;cancelAnimationFrame(raf);restore3d();showDom();return{build:BUILD,active:false}};raf=requestAnimationFrame(tick)}
if(preview)install();else window.SVR_PHASE96_PREVIEW_ON=install;
