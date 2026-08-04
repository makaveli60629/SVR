import * as THREE from 'three';
const BUILD='PHASE-94-ANDROID-LOBBY-CINEMATIC-PREVIEW-LOCK';
let scene,camera,renderer,root,kit,active=false,hidden=[],last=0;
const isMobile=/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent||'');
const params=new URLSearchParams(location.search);
const shouldRun=isMobile||params.has('preview')||params.has('cam3')||String(location.search).includes('phase94');
function S(){return window.__SVR_SCENE__||window.scene||null}
function C(){return window.__SVR_CAMERA__||window.camera||null}
function R(){return window.__SVR_RENDERER__||window.renderer||null}
function Root(){const s=S();return s?.getObjectByName?.('PHASE200_ORDERED_GRAND_LOBBY_ROOT')||s}
function mat(c,e=0){return new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:e,roughness:.65,metalness:.08,side:THREE.DoubleSide})}
function textTex(lines,bg='#050008',stroke='#7ffcff'){const can=document.createElement('canvas');can.width=768;can.height=256;const g=can.getContext('2d');g.fillStyle=bg;g.fillRect(0,0,768,256);g.strokeStyle=stroke;g.lineWidth=9;g.strokeRect(10,10,748,236);g.fillStyle='#fff';g.font='900 46px system-ui';g.textAlign='center';g.textBaseline='middle';String(lines).split('\n').forEach((l,i,a)=>g.fillText(l,384,128+(i-(a.length-1)/2)*58,720));const t=new THREE.CanvasTexture(can);t.colorSpace=THREE.SRGBColorSpace;return t}
function makePanel(name,text,x,y,z,w=2.1,h=.7){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:textTex(text),transparent:true,side:THREE.DoubleSide,depthWrite:false}));p.name=name;p.position.set(x,y,z);p.rotation.y=Math.atan2(x,z);kit.add(p);return p}
function logoTex(){const can=document.createElement('canvas');can.width=512;can.height=512;const g=can.getContext('2d');g.fillStyle='#050508';g.fillRect(0,0,512,512);const grd=g.createRadialGradient(256,256,20,256,256,250);grd.addColorStop(0,'#7ffcff');grd.addColorStop(.35,'#bd00ff');grd.addColorStop(1,'#090012');g.fillStyle=grd;g.beginPath();g.arc(256,256,238,0,Math.PI*2);g.fill();g.strokeStyle='#ffd98a';g.lineWidth=18;g.stroke();g.fillStyle='#fff';g.font='900 86px system-ui';g.textAlign='center';g.textBaseline='middle';g.fillText('SVR',256,220);g.font='900 46px system-ui';g.fillText('POKER',256,302);const t=new THREE.CanvasTexture(can);t.colorSpace=THREE.SRGBColorSpace;return t}
function findTable(){let best=null;Root()?.traverse?.(o=>{const n=String(o.name||'').toLowerCase();if(!best&&n.includes('table')&&o.isObject3D)best=o});return best}
function bounds(o){try{o.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(o),s=new THREE.Vector3(),c=new THREE.Vector3();b.getSize(s);b.getCenter(c);return{b,s,c,top:b.max.y}}catch(e){return null}}
function buildFallbacks(){if(kit)kit.parent?.remove(kit);kit=new THREE.Group();kit.name='PHASE94_ANDROID_CINEMATIC_PREVIEW_ROOT';Root().add(kit);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(.75,32,16),mat(0xdfe8ff,.28));moon.name='PHASE94_PREVIEW_MOON';moon.position.set(-3.8,6.4,-8.8);kit.add(moon);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(.32,24,12),mat(0xff6b42,.18));mars.name='PHASE94_PREVIEW_MARS';mars.position.set(-2.5,5.9,-9.7);kit.add(mars);
  makePanel('PHASE94_REIKI_STOREFRONT','REIKI HUB\nPREVIEW PORTAL',-3.15,1.65,-2.75,1.55,.58);
  makePanel('PHASE94_PGA_STOREFRONT','PGA GOLF\nTRAINING HUB',3.15,1.65,-2.75,1.55,.58);
  makePanel('PHASE94_LOUNGE_STOREFRONT','SVR LOUNGE\nCOMING PREVIEW',-3.2,1.65,2.05,1.55,.58);
  makePanel('PHASE94_STORE_STOREFRONT','SVR STORE\nMEMBER GEAR',3.2,1.65,2.05,1.55,.58);
  makePanel('PHASE94_ACTIVE_LABEL','ANDROID PREVIEW MODE\nCAMERA 3 CINEMATIC',0,2.65,-3.65,2.8,.7);
  const t=findTable();let y=.82,x=0,z=0;if(t){const b=bounds(t);if(b){x=b.c.x;y=b.top+.035;z=b.c.z}}
  const logo=new THREE.Mesh(new THREE.CircleGeometry(.42,64),new THREE.MeshBasicMaterial({map:logoTex(),transparent:true,side:THREE.DoubleSide,depthWrite:false}));logo.name='PHASE94_TABLE_SVR_LOGO_PLATE';logo.position.set(x,y,z);logo.rotation.x=-Math.PI/2;kit.add(logo);
  const glow=new THREE.Mesh(new THREE.RingGeometry(.46,.5,64),new THREE.MeshBasicMaterial({color:0xffd98a,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));glow.name='PHASE94_TABLE_LOGO_GOLD_RING';glow.position.set(x,y+.008,z);glow.rotation.x=-Math.PI/2;kit.add(glow);
}
function hideClutter(){hidden=[];const keep=/table|logo|moon|mars|store|storefront|portal|reiki|pga|lounge|svr|chair|npc|bot|eric|claudia|carla/i;const hide=/display|screen|panel|audit|diagnostic|debug|hud|label|banner|billboard|floating|overlay|notice|text/i;Root()?.traverse?.(o=>{const n=String(o.name||'');if(o!==kit&&!kit?.children?.includes(o)&&hide.test(n)&&!keep.test(n)&&o.visible!==false){hidden.push(o);o.visible=false}})}
function restore(){hidden.forEach(o=>{try{o.visible=true}catch(e){}});hidden=[]}
const path=[new THREE.Vector3(0,1.55,4.4),new THREE.Vector3(-2.8,1.65,2.4),new THREE.Vector3(-3.4,2.0,-2.7),new THREE.Vector3(-3.4,4.5,-6.4),new THREE.Vector3(0,1.55,-2.6),new THREE.Vector3(3.2,1.75,-2.5),new THREE.Vector3(3.2,1.7,2.1),new THREE.Vector3(0,1.5,3.8)];
const look=[new THREE.Vector3(0,.9,0),new THREE.Vector3(-3,1.4,1.8),new THREE.Vector3(-3.5,5.8,-8.5),new THREE.Vector3(-3.5,6.1,-9.2),new THREE.Vector3(0,.85,0),new THREE.Vector3(3,1.4,-2.8),new THREE.Vector3(3,1.3,2.0),new THREE.Vector3(0,.9,0)];
function camTick(now){if(!active||!camera)return;const t=((now*.000035)%1)*path.length;const i=Math.floor(t)%path.length;const j=(i+1)%path.length;const f=t-i;const ease=f*f*(3-2*f);camera.position.lerpVectors(path[i],path[j],ease);const target=new THREE.Vector3().lerpVectors(look[i],look[j],ease);camera.lookAt(target);window.SVR_PHASE94_CAMERA3={build:BUILD,active:true,index:i,next:j,phone:isMobile,hidden:hidden.length,checkedAt:new Date().toISOString()};requestAnimationFrame(camTick)}
function addHud(){let el=document.getElementById('phase94PreviewHud');if(!el){el=document.createElement('div');el.id='phase94PreviewHud';el.style.cssText='position:fixed;right:10px;top:10px;z-index:9999;padding:10px 12px;border:1px solid #7ffcff;border-radius:12px;background:rgba(0,0,0,.72);color:#fff;font:700 12px system-ui;max-width:230px';document.body.appendChild(el)}el.innerHTML='PHASE 94 ANDROID PREVIEW<br>Camera 3 cinematic active<br>Displays hidden: '+hidden.length;}
function install(){scene=S();camera=C();renderer=R();root=Root();if(!scene||!camera||!root)return setTimeout(install,350);buildFallbacks();hideClutter();addHud();active=true;window.SVR_LOCKED_FINAL_BUILD=BUILD;window.SVR_LIVE_BUILD_POINTER=BUILD;window.SVR_PHASE94_PREVIEW_ON=()=>{active=true;hideClutter();requestAnimationFrame(camTick);return window.SVR_PHASE94_CAMERA3};window.SVR_PHASE94_PREVIEW_OFF=()=>{active=false;restore();return{build:BUILD,active:false}};window.SVR_RUN_PHASE94_PREVIEW_AUDIT=()=>({build:BUILD,active,phone:isMobile,hidden:hidden.length,hasScene:!!S(),hasCamera:!!C(),hasKit:!!kit,checkedAt:new Date().toISOString()});requestAnimationFrame(camTick)}
if(shouldRun)install();else window.SVR_PHASE94_PREVIEW_ON=install;
