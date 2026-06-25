import * as THREE from 'three';
const LABEL='PHASE-201-MASTER-RUNTIME-AUDIT-PANEL-LOCK';
let scene,camera,renderer,started=false,panel;
function iso(){return new Date().toISOString();}
function get(fn){try{return typeof fn==='function'?fn():null;}catch(e){return {error:String(e.message||e)}}}
function collect(){const audits={
 boot:window.SVR_PHASE200_BOOT||window.SVR_PHASE199_BOOT||null,
 table199:get(window.SVR_RUN_PHASE199_TABLE_AUDIT),
 clean200:get(window.SVR_RUN_PHASE200_AUDIT),
 input193:get(window.SVR_RUN_PHASE193_INPUT_AUDIT),
 rooms195:get(window.SVR_RUN_PHASE195_AUDIT),
 sky196:get(window.SVR_RUN_PHASE196_AUDIT),
 dup198:get(window.SVR_RUN_PHASE198_AUDIT)
};
const status={
 tableFound:!!audits.table199?.fbxFound||!!audits.clean200?.table?.found,
 oneLogo:(audits.clean200?.logo?.count||audits.dup198?.logo?.found||0)<=1 || !!audits.clean200?.logo?.kept,
 oneMoon:(audits.clean200?.moon?.moons||audits.dup198?.moon?.moonsFound||0)<=1 || !!audits.clean200?.moon?.kept,
 marsVisible:(audits.clean200?.moon?.mars||audits.dup198?.moon?.marsFound||0)>0,
 teleportFix:!!audits.input193?.lock?.active,
 roomsReady:!!audits.rooms195?.active,
 cleanBoot:!!audits.boot?.cleanBoot,
 siteTouched:false
};
return {build:LABEL,status,audits,href:location.href,ua:navigator.userAgent,checkedAt:iso()};}
function makePanel(){if(panel)return panel;panel=document.createElement('div');panel.id='phase201AuditPanel';panel.style.cssText='position:fixed;right:12px;top:12px;z-index:2147482500;max-width:360px;background:rgba(0,0,0,.62);border:1px solid #7ffcff;border-radius:12px;color:#fff;font:12px system-ui;padding:10px;pointer-events:auto;backdrop-filter:blur(4px)';panel.innerHTML='<b>SVR Phase 201 Audit</b><div id="phase201Rows"></div><button id="phase201Copy" style="margin-top:8px;border:1px solid #7ffcff;background:#111;color:#fff;border-radius:8px;padding:6px 8px">Copy Audit</button><button id="phase201Hide" style="margin-left:6px;border:1px solid #777;background:#111;color:#fff;border-radius:8px;padding:6px 8px">Hide</button>';document.body.appendChild(panel);document.getElementById('phase201Hide').onclick=()=>panel.style.display='none';document.getElementById('phase201Copy').onclick=async()=>{const txt=JSON.stringify(collect(),null,2);try{await navigator.clipboard.writeText(txt);}catch(e){console.log(txt);} };return panel;}
function render(){const data=collect();const p=makePanel();const rows=document.getElementById('phase201Rows');if(rows){const s=data.status;rows.innerHTML=`<div>Table: <b style="color:${s.tableFound?'#7CFF9B':'#ff6b6b'}">${s.tableFound?'FOUND':'MISSING'}</b></div><div>Logo: <b>${s.oneLogo?'ONE':'CHECK DUPLICATE'}</b></div><div>Moon: <b>${s.oneMoon?'ONE':'CHECK DUPLICATE'}</b></div><div>Mars: <b>${s.marsVisible?'VISIBLE':'CHECK'}</b></div><div>Teleport: <b>${s.teleportFix?'LOCKED':'CHECK'}</b></div><div>Rooms: <b>${s.roomsReady?'READY':'CHECK'}</b></div><div>Boot: <b>${s.cleanBoot?'CLEAN':'LEGACY'}</b></div>`;}window.SVR_PHASE201_MASTER_RUNTIME_AUDIT=data;return data;}
function install(){scene=window.__SVR_SCENE__;camera=window.__SVR_CAMERA__;renderer=window.__SVR_RENDERER__;if(!scene||!camera||!renderer)return false;render();window.SVR_RUN_PHASE201_MASTER_AUDIT=()=>render();window.SVR_PHASE201_COPY_AUDIT=()=>JSON.stringify(render(),null,2);window.SVR_LOCKED_FINAL_BUILD=LABEL;window.SVR_LIVE_BUILD_POINTER=LABEL;if(!started){started=true;setInterval(render,1500);}return true;}
[500,1200,2600,5200,9000,13000].forEach(ms=>setTimeout(install,ms));install();
