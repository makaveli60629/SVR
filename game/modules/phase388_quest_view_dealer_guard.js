/* PHASE-388-QUEST-VIEW-DEALER-GUARD */
import * as THREE from 'three';
export const BUILD='PHASE-388-QUEST-VIEW-DEALER-GUARD';
const p=new URLSearchParams(location.search),ACTIVE=p.get('platform')==='quest'||p.get('direct')==='1'||/Quest|Oculus|Meta Quest/i.test(navigator.userAgent||'');
const state={build:BUILD,active:ACTIVE,installed:false,dealerNamesSanitized:0,darkHeadQuadsHidden:0,legacyLogoObjectsHidden:0,lastError:null,checkedAt:null};
let scene,camera,renderer,timer=0,raf=0,last=0;
const a=new THREE.Vector3(),b=new THREE.Vector3();
function walk(root,fn,limit=24000){const stack=root?[root]:[],seen=new Set();while(stack.length&&seen.size<limit){const o=stack.pop();if(!o||seen.has(o))continue;seen.add(o);try{fn(o)}catch{}for(const c of o.children||[])if(c&&!seen.has(c))stack.push(c)}}
function activeCamera(){const c=renderer?.xr?.isPresenting?renderer.xr.getCamera(camera):camera;return c?.cameras?.[0]||c||camera}
function inside(o,r){for(let x=o;x;x=x.parent)if(x===r)return true;return false}
function materialDark(m){if(!m)return false;const c=m.color||new THREE.Color(0,0,0),lum=.2126*c.r+.7152*c.g+.0722*c.b;return lum<.16&&Number(m.opacity??1)>.45}
function planar(o){if(!o?.isMesh||!o.geometry)return false;const box=new THREE.Box3().setFromObject(o,true),s=box.getSize(new THREE.Vector3());const dims=[s.x,s.y,s.z].sort((x,y)=>x-y);return dims[0]<.08&&dims[2]>.18}
function attached(o,head){for(let x=o?.parent;x;x=x.parent)if(x===head||x===camera)return true;return false}
function sanitizeDealer(){const root=window.SVR_PHASE388_ERIC_AUTHORITY;if(!root?.isObject3D)return 0;let count=0;walk(root,o=>{const n=String(o.name||'');if(/eric/i.test(n)){o.name=n.replace(/eric/ig,'dealer');count++}o.userData={...(o.userData||{}),svrPhase388DealerDescendant:true}},12000);state.dealerNamesSanitized=Math.max(state.dealerNamesSanitized,count);return count}
function hideLegacyLogo(){let count=0;walk(scene,o=>{if(!o?.isObject3D||o===window.SVR_PHASE388_ERIC_AUTHORITY)return;const n=String(o.name||'');if(/(PHASE167_.*(FELT|LOGO)|PHASE384_.*(FELT|LOGO)|PHASE386_.*(FELT|LOGO)|PASSLINE.*LOGO|YELLOW.*(LOGO|SQUARE))/i.test(n)){o.visible=false;count++}},20000);state.legacyLogoObjectsHidden=Math.max(state.legacyLogoObjectsHidden,count);return count}
function clearView(){const head=activeCamera();if(!head||!scene)return 0;head.getWorldPosition(a);let count=0;walk(scene,o=>{if(!o?.isMesh||inside(o,window.SVR_PHASE388_ERIC_AUTHORITY))return;const n=String(o.name||'');if(/(hand|controller|watch|card|table|logo|button|avatar|dealer|moon|mars|earth|star)/i.test(n))return;o.getWorldPosition?.(b);const near=b.distanceTo(a)<.72;const mats=Array.isArray(o.material)?o.material:[o.material];const named=/(overlay|vignette|comfort|visor|fade|film|black[_ -]?(square|quad|panel)|debug[_ -]?(screen|quad|panel))/i.test(n);if((attached(o,head)||near)&&(named||(planar(o)&&mats.some(materialDark)))){o.visible=false;o.userData={...(o.userData||{}),svrPhase388HeadOverlayRemoved:true};count++}},22000);state.darkHeadQuadsHidden=Math.max(state.darkHeadQuadsHidden,count);return count}
function sweep(){scene=window.__SVR_SCENE__||scene;camera=window.__SVR_CAMERA__||camera;renderer=window.__SVR_RENDERER__||renderer;if(!scene||!camera)return false;sanitizeDealer();hideLegacyLogo();clearView();state.checkedAt=new Date().toISOString();return true}
function frame(t=0){if(!ACTIVE||!state.installed)return;if(t-last>240){last=t;sweep()}raf=requestAnimationFrame(frame)}
function install(){if(!ACTIVE||state.installed)return;state.installed=true;timer=setInterval(sweep,700);raf=requestAnimationFrame(frame);window.addEventListener('beforeunload',()=>{clearInterval(timer);cancelAnimationFrame(raf)},{once:true});sweep()}
install();
window.SVR_PHASE388_VIEW_GUARD_SWEEP=sweep;window.SVR_PHASE388_VIEW_GUARD_QA=()=>({...state,pass:state.installed,checkedAt:new Date().toISOString()});window.SVR_PHASE388_VIEW_GUARD_STATE=state;
