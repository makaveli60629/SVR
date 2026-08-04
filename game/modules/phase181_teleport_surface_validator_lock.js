const LABEL='PHASE-181-TELEPORT-SURFACE-VALIDATOR-LOCK';
let patched=false,last=null;
function clamp(v,min,max){return Math.max(min,Math.min(max,v));}
function blockedByTable(x,z){const t=window.SVR_PHASE172_FLOOR_LOGO_FELT_RAIL_CLEANUP_LOCK?.felt; if(!t)return false; return Math.hypot(x-(t.center?.x||0),z-(t.center?.z||0))<1.65;}
function floorY(y){return y>2.2?3.15:0;}
function patch(){const rig=window.SVR_TELEPORT_RIG_REF||window.SVR_TELEPORT_RIG; if(!rig||patched||typeof rig.setPlayerPose!=='function')return false; const base=rig.setPlayerPose.bind(rig); rig.setPlayerPose=(x,y,z)=>{let nx=clamp(Number(x)||0,-17.5,17.5), nz=clamp(Number(z)||0,-15.8,15.8), ny=floorY(Number(y)||0); if(blockedByTable(nx,nz)){nz += nz>=0?1.8:-1.8;} last={build:LABEL,requested:{x,y,z},approved:{x:+nx.toFixed(3),y:+ny.toFixed(3),z:+nz.toFixed(3)},checkedAt:new Date().toISOString()}; window.SVR_PHASE181_LAST_TELEPORT_VALIDATION=last; return base(nx,ny,nz);}; patched=true; return true;}
function audit(){patch(); const data={build:LABEL,active:true,gameOnly:true,siteTouched:false,rigPatched:patched,bounds:{x:[-17.5,17.5],z:[-15.8,15.8]},tableBlock:true,last,checkedAt:new Date().toISOString()}; window.SVR_PHASE181_TELEPORT_SURFACE_VALIDATOR_LOCK=data; window.SVR_RUN_PHASE181_TELEPORT_AUDIT=()=>window.SVR_PHASE181_TELEPORT_SURFACE_VALIDATOR_LOCK; window.SVR_LOCKED_FINAL_BUILD=LABEL; window.SVR_LIVE_BUILD_POINTER=LABEL; return data;}
[300,900,1800,3500,7000].forEach(ms=>setTimeout(audit,ms)); setInterval(audit,4000); audit();
