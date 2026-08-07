/* PHASE-393-QUEST-TABLE-ERIC-SEAT-CALIBRATION-LOCK */
import {sweep as sweepTable,qa as tableQa,state as tableState} from './phase393_quest_table_surface.js?v=phase393';
import {sweep as sweepEric,qa as ericQa,animate,seatUser,requestSeat,shouldSeat,state as ericState} from './phase393_quest_eric_seat.js?v=phase393';
export const BUILD='PHASE-393-QUEST-TABLE-ERIC-SEAT-CALIBRATION-LOCK';
const params=new URLSearchParams(location.search),ua=navigator.userAgent||'';
const platform=String(window.SVR_PLATFORM||params.get('platform')||document.body?.dataset?.platform||(/Quest|Oculus|Meta Quest/i.test(ua)?'quest':'desktop')).toLowerCase();
const ACTIVE=platform==='quest'||params.get('direct')==='1'||params.get('questfix')==='1'||platform==='camera3';
const state={build:BUILD,platform,active:ACTIVE,installed:false,lastReason:null,lastError:null,checkedAt:null};
let timer=0,raf=0,renderer=null;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function sweep(reason='interval'){
  if(!ACTIVE)return false;
  try{
    const scene=window.__SVR_SCENE__,camera=window.__SVR_CAMERA__;renderer=window.__SVR_RENDERER__||renderer;
    const tableOk=sweepTable(scene),ericOk=sweepEric(scene,renderer,camera);
    state.installed=Boolean(tableOk&&ericOk);state.lastReason=reason;state.checkedAt=new Date().toISOString();
    window.SVR_PHASE393_QUEST_STATE={...state,table:{...tableState},eric:{...ericState}};return state.installed;
  }catch(error){state.lastError=String(error?.stack||error?.message||error);return false}
}
function frame(time){if(!ACTIVE)return;try{animate(time);if(shouldSeat())seatUser('bounded-frame')}catch(error){state.lastError=String(error?.message||error)}raf=requestAnimationFrame(frame)}
function qa(){const table=tableQa(),eric=ericQa(),result={...state,table,eric,pass:Boolean(state.installed&&table.pass&&eric.pass&&!state.lastError),checkedAt:new Date().toISOString()};window.SVR_PHASE393_QUEST_STATE=result;return result}
async function install(){
  if(!ACTIVE||state.installed)return;const started=performance.now();
  while(performance.now()-started<30000){if(window.__SVR_SCENE__&&window.__SVR_CAMERA__&&(window.SVR_TABLE_AUTHORITY||window.SVR_PHASE380_ORIGINAL_TABLE)&&(window.SVR_PHASE391_ERIC_AUTHORITY||window.SVR_PHASE388_ERIC_AUTHORITY))break;await wait(100)}
  requestSeat(16000);await sweep('install');for(const delay of [150,400,850,1500,2600,4500,8000,12000])setTimeout(()=>void sweep(`bounded-${delay}`),delay);
  if(!timer)timer=setInterval(()=>void sweep('interval'),700);if(!raf)raf=requestAnimationFrame(frame);
  renderer?.xr?.addEventListener?.('sessionstart',()=>{requestSeat(17000);setTimeout(()=>seatUser('xr-session-start'),250)});
  window.dispatchEvent(new CustomEvent('svr:phase393-quest-calibrated'));
}
window.SVR_PHASE393_QUEST_SWEEP=sweep;window.SVR_PHASE393_QUEST_QA=qa;window.SVR_PHASE393_SEAT_USER=()=>{requestSeat(5000);return seatUser('manual')};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>void install(),{once:true});else void install();
