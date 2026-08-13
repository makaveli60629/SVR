/* PHASE-422-QUEST-TABLE-PROP-ALIGNMENT-FLEX-LOCK */
import * as THREE from 'three';
export const BUILD='PHASE-422-QUEST-TABLE-PROP-ALIGNMENT-FLEX-LOCK';
const p=new URLSearchParams(location.search),ua=navigator.userAgent||'';
const ACTIVE=p.get('platform')==='quest'||p.get('direct')==='1'||p.get('questfix')==='1'||/Quest|Oculus|Meta Quest/i.test(ua);
const state={build:BUILD,active:ACTIVE,installed:false,cards:0,chips:0,flexCards:0,gravityReady:true,lastError:null,checkedAt:null};
const tmp=new THREE.Vector3();let scene=null,raf=0;
function bounds(o){o?.updateWorldMatrix?.(true,true);const box=new THREE.Box3().setFromObject(o,true);return{box,size:box.getSize(new THREE.Vector3()),center:box.getCenter(new THREE.Vector3())}}
function top(){const s=window.SVR_PHASE422_PLAY_SURFACE;return s?bounds(s).box.max.y:null}
function worldY(o,y){if(!o?.parent)return;o.getWorldPosition(tmp);tmp.y=y;o.parent.worldToLocal(tmp);o.position.copy(tmp)}
function isCard(o){return !!(o?.isMesh&&/^(?:P85_HAND_0_[01]|P85_COMM_\d+|PHASE341_(?:HOLE|COMMUNITY|BURN)_)/i.test(String(o.name||'')))}
function isChip(o){return !!(o?.isMesh&&(/PHASE332_YOU_|PHASE331_POT_CHIP|P85_STACK_|P85_POT_CHIP/i.test(String(o.name||''))||o.userData?.svr332))}
function ensureFlexGeometry(card){if(card.userData?.svr422FlexBase)return;card.geometry=card.geometry.clone();card.userData={...(card.userData||{}),svr422FlexBase:Float32Array.from(card.geometry.attributes.position.array)}}
function flex(card,amount){ensureFlexGeometry(card);const attr=card.geometry.attributes.position,base=card.userData.svr422FlexBase;if(!attr||!base)return;for(let i=0;i<attr.count;i++){const x=base[i*3],y=base[i*3+1],z=base[i*3+2];attr.setXYZ(i,x,y+amount*Math.pow(x/.04,2),z)}attr.needsUpdate=true;card.geometry.computeVertexNormals?.()}
function sweep(){if(!ACTIVE)return false;scene=window.__SVR_SCENE__||scene;const y=top();if(!scene||!Number.isFinite(y))return false;let cards=0,chips=0,flexed=0;scene.traverse?.(o=>{if(!o?.isMesh||o.visible===false)return;if(isCard(o)){cards++;if(o.userData?.phase334Held){flex(o,.0065);flexed++}else{if(o.userData?.svr422FlexBase)flex(o,0);worldY(o,y+.010)}}else if(isChip(o)){chips++;if(!o.userData?.held&&!o.userData?.svrHeld)worldY(o,y+.008)}});state.cards=cards;state.chips=chips;state.flexCards=flexed;state.installed=cards>=2&&chips>=1;state.checkedAt=new Date().toISOString();window.SVR_PHASE422_PROP_STATE={...state};return state.installed}
function frame(){if(!ACTIVE)return;try{sweep()}catch(e){state.lastError=String(e?.message||e)}raf=requestAnimationFrame(frame)}
export function qa(){return{...state,tabletopGravityContract:'released props rest on the true inner surface; existing phase334/phase331 hand interactions remain authoritative',cardFlexWhileHeld:true,pass:Boolean(state.installed&&!state.lastError),checkedAt:new Date().toISOString()}}
window.SVR_PHASE422_PROP_SWEEP=sweep;window.SVR_PHASE422_PROP_QA=qa;
if(ACTIVE){window.addEventListener('svr:phase396-core-ready',()=>setTimeout(sweep,700),{once:true});setTimeout(sweep,3400);raf=requestAnimationFrame(frame)}
