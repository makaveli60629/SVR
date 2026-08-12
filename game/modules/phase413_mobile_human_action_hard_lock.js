/* PHASE-413-MOBILE-HUMAN-ACTION-HARD-LOCK */
import {legalRaiseWindow} from './phase398_android_raise_rules.js?v=phase398';

const BUILD='PHASE-413-MOBILE-HUMAN-ACTION-HARD-LOCK';
const USER=0;
const state={build:BUILD,installed:false,userDecisionOpen:false,strictButtons:false,syntheticRescues:0,blockedStaleClicks:0,blockedDuplicateClicks:0,lastSynthetic:null,lastAccepted:null,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const buttons=()=>[...document.querySelectorAll('.actions button[data-a]')];
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
let clickLock=null;
let releaseLock=null;

function strictUserTurn(g){
  const user=g?.players?.[USER];
  return Boolean(
    g&&user&&
    Number(g.activePlayer)===USER&&
    !g.handOver&&
    !user.folded&&
    !user.allIn&&
    Number(user.stack||0)>0&&
    user.active===true&&
    user.acted===false
  );
}

function legalRaise(g,user){
  try{
    return Boolean(legalRaiseWindow({
      currentBet:Number(g.currentBet||0),
      lastFullRaiseSize:Number(g.lastFullRaiseSize||100),
      streetBet:Number(user.streetBet||0),
      stack:Number(user.stack||0),
      raiseLocked:Boolean(user.raiseLocked)
    }).canRaise);
  }catch{return false}
}

function actionTrailLength(g){return Array.isArray(g?.actionTrail)?g.actionTrail.length:0}
function contextKey(g,type=''){return `${Number(g?.hand||0)}|${Number(g?.street||0)}|${type}`}
function actionButtonFromEvent(event){
  const path=typeof event.composedPath==='function'?event.composedPath():[];
  return path.find(node=>node?.matches?.('.actions button[data-a]'))||event.target?.closest?.('.actions button[data-a]')||null;
}

function syncButtons(){
  const g=game(),user=g?.players?.[USER],open=strictUserTurn(g),host=$('.actions');
  state.userDecisionOpen=open;
  if(host){host.style.pointerEvents='auto';host.style.touchAction='manipulation';host.style.position='relative';host.style.zIndex='120'}
  for(const button of buttons()){
    button.style.pointerEvents='auto';button.style.touchAction='manipulation';button.style.userSelect='none';button.style.webkitUserSelect='none';
    const type=button.dataset.a;
    const enabled=open&&(type!=='raise'||legalRaise(g,user));
    button.disabled=!enabled;
    button.setAttribute('aria-disabled',enabled?'false':'true');
    button.classList.toggle('phase413-action-ready',enabled);
  }
  document.body.classList.toggle('phase413-human-decision-open',open);
  state.strictButtons=Boolean(buttons().length===4&&buttons().every(button=>button.disabled===!(open&&(button.dataset.a!=='raise'||legalRaise(g,user)))));
  if(!open&&clickLock)clickLock=null;
  return open;
}

function acceptClickCapture(event){
  const button=actionButtonFromEvent(event);if(!button)return;
  const type=button.dataset.a;
  if(type==='allin')return; // Phase 404 owns the protected double-tap ALL IN path.
  const g=game();syncButtons();
  if(!strictUserTurn(g)||button.disabled){
    state.blockedStaleClicks+=1;
    event.preventDefault();event.stopImmediatePropagation();return;
  }
  const key=contextKey(g,type),now=Date.now();
  if(clickLock?.key===key&&now-clickLock.at<350){
    state.blockedDuplicateClicks+=1;
    event.preventDefault();event.stopImmediatePropagation();return;
  }
  clickLock={key,at:now,trail:actionTrailLength(g)};
  state.lastAccepted={type,hand:g.hand,street:g.street,source:event.isTrusted?'browser-click':'synthetic-click',at:new Date().toISOString()};
  queueMicrotask(syncButtons);
}

function scheduleReleaseFallback(event){
  const button=actionButtonFromEvent(event);if(!button)return;
  const type=button.dataset.a;
  if(type==='allin'){syncButtons();return}
  const g=game();syncButtons();
  if(!strictUserTurn(g)||button.disabled)return;
  const key=contextKey(g,type),now=Date.now();
  if(releaseLock?.key===key&&now-releaseLock.at<180)return;
  releaseLock={key,at:now};
  const before=actionTrailLength(g),hand=Number(g.hand),street=Number(g.street);
  setTimeout(()=>{
    const current=game();syncButtons();
    if(!strictUserTurn(current)||button.disabled)return;
    if(Number(current.hand)!==hand||Number(current.street)!==street)return;
    if(actionTrailLength(current)!==before)return;
    state.syntheticRescues+=1;
    state.lastSynthetic={type,hand,street,at:new Date().toISOString()};
    button.click();
  },90);
}

function bind(){
  if(document.documentElement.dataset.phase413HumanAction==='1')return;
  document.documentElement.dataset.phase413HumanAction='1';
  document.addEventListener('click',acceptClickCapture,true);
  document.addEventListener('pointerdown',event=>{if(actionButtonFromEvent(event))syncButtons()},true);
  document.addEventListener('pointerup',scheduleReleaseFallback,true);
  document.addEventListener('pointercancel',()=>{releaseLock=null},true);
  document.addEventListener('touchstart',event=>{if(actionButtonFromEvent(event))syncButtons()},{capture:true,passive:true});
  document.addEventListener('touchend',scheduleReleaseFallback,{capture:true,passive:true});
  state.installed=true;
}

function poll(){
  try{bind();syncButtons();state.lastError=null;state.checkedAt=new Date().toISOString()}
  catch(error){state.lastError=String(error?.message||error);state.checkedAt=new Date().toISOString()}
}

window.addEventListener('svr:user-turn-restored',()=>{clickLock=null;releaseLock=null;setTimeout(syncButtons,0)});
window.addEventListener('svr:bot-thinking',()=>syncButtons());
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,30)},{once:true});else{poll();setInterval(poll,30)}

window.SVR_PHASE413_HUMAN_ACTION_QA=()=>{
  const g=game(),user=g?.players?.[USER];syncButtons();
  return {...state,activePlayer:g?.activePlayer??null,userActive:user?.active??null,userActed:user?.acted??null,hand:g?.hand??null,street:g?.street??null,actionButtons:buttons().length,phase404AllInPreserved:true,phase410BaselinePresent:Boolean(window.SVR_PHASE410_MOBILE_INPUT_QA),pass:Boolean(state.installed&&state.strictButtons&&!state.lastError),checkedAt:new Date().toISOString()};
};
