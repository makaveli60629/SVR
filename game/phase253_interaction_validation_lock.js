import * as THREE from "three";
const BUILD="PHASE-253-INTERACTION-VALIDATION-LOCK";
const ZONES={wellness:{x:-12.8,z:-7.9,r:1.45},pga:{x:-6.4,z:-7.9,r:1.45},play:{x:0,z:-2.7,r:1.55},store:{x:6.4,z:-7.9,r:1.45},scorpion:{x:12.8,z:-7.9,r:1.45},seat:{x:0,z:3.55,r:1.35}};
function waitScene(){return new Promise(r=>{let n=0;const t=()=>{if(window.__SVR_SCENE__)return r(window.__SVR_SCENE__);if(++n>360)return r(null);requestAnimationFrame(t)};t()})}
function glow(c,o=.38){return new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending})}
function root(scene){let g=scene.getObjectByName("PHASE253_INTERACTION_VALIDATION_ROOT");if(!g){g=new THREE.Group();g.name="PHASE253_INTERACTION_VALIDATION_ROOT";scene.add(g)}return g}
function addRing(scene,k,z){const color=k==="seat"||k==="store"?0x8dffb4:k==="play"?0xffd98a:0x7ffcff;const ring=new THREE.Mesh(new THREE.RingGeometry(z.r,z.r+.08,96),glow(color,.34));ring.name="PHASE253_ZONE_"+k.toUpperCase();ring.rotation.x=-Math.PI/2;ring.position.set(z.x,.29,z.z);root(scene).add(ring)}
function pos(){return window.__SVR_CAMERA__?.position||{x:0,z:0}}
function dist(p,z){const dx=p.x-z.x,dz=p.z-z.z;return Math.sqrt(dx*dx+dz*dz)}
function scan(){const p=pos();let near=null;for(const [k,z] of Object.entries(ZONES)){if(dist(p,z)<=z.r){near=k;break}}window.SVR_PHASE253_INTERACTION_STATE={near,position:{x:+p.x.toFixed(2),z:+p.z.toFixed(2)},updatedAt:new Date().toISOString()};const s=document.getElementById("status");if(s&&near)s.textContent=near==="seat"?"Open seat zone ready":"Portal zone ready: "+near;}
function setup(){window.SVR_CONFIRM_INTERACTION=()=>{const n=window.SVR_PHASE253_INTERACTION_STATE?.near;if(!n)return false;if(n==="seat"||n==="play"){window.dispatchEvent(new CustomEvent("svr:join-table",{detail:{source:BUILD}}));return true}return !!window.SVR_OPEN_PORTAL?.(n)};}
async function install(){const scene=await waitScene();if(!scene||scene.getObjectByName("PHASE253_INTERACTION_VALIDATION_ROOT"))return;Object.entries(ZONES).forEach(([k,z])=>addRing(scene,k,z));setup();setInterval(scan,350);window.SVR_PHASE253_INTERACTION_VALIDATION={build:BUILD,active:true,siteTouched:false,zones:Object.keys(ZONES),confirmHelper:"SVR_CONFIRM_INTERACTION",checkedAt:new Date().toISOString()};window.SVR_LOCKED_FINAL_BUILD=BUILD;const l=document.getElementById("svr-phase-label");if(l)l.textContent="PHASE 253 ACTIVE • INTERACTION VALIDATION";const s=document.getElementById("status");if(s)s.textContent="Phase 253 interaction validation active"}
install();
