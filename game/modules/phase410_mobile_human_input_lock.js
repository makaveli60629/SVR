/* PHASE-410-MOBILE-HUMAN-INPUT-LOCK */
import {legalRaiseWindow} from './phase398_android_raise_rules.js?v=phase398';

const BUILD='PHASE-410-MOBILE-HUMAN-INPUT-LOCK';
const USER=0;
const state={build:BUILD,installed:false,userTurn:false,buttonsUnlocked:false,pointerFallbacks:0,lastPointerAction:null,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const buttons=()=>[...document.querySelectorAll('.actions button[data-a]')];
const game=()=>window.SVR_PHASE393_ANDROID_STATE;

function canUserAct(g){
  const user=g?.players?.[USER];
  return Boolean(g&&user&&g.activePlayer===USER&&!g.handOver&&!user.folded&&!user.allIn&&Number(user.stack||0)>0);
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

function unlockButtons(){
  const g=game(),user=g?.players?.[USER];
  const active=canUserAct(g);
  state.userTurn=active;
  const host=document.querySelector('.actions');
  if(host){host.style.pointerEvents='auto';host.style.touchAction='manipulation';host.style.position='relative';host.style.zIndex='90'}
  for(const button of buttons()){
    button.style.pointerEvents='auto';
    button.style.touchAction='manipulation';
    button.style.userSelect='none';
    button.style.webkitUserSelect='none';
    if(!active)continue;
    const type=button.dataset.a;
    if(type==='raise')button.disabled=!legalRaise(g,user);
    else button.disabled=false;
    button.setAttribute('aria-disabled',button.disabled?'true':'false');
  }
  state.buttonsUnlocked=Boolean(active&&buttons().filter(b=>b.dataset.a!=='raise').every(b=>!b.disabled));
  document.body.classList.toggle('phase410-human-turn',active);
  return active;
}

function trailLength(g){return Array.isArray(g?.actionTrail)?g.actionTrail.length:0}

function schedulePointerFallback(button,before){
  if(button.dataset.a==='allin')return;
  const type=button.dataset.a;
  setTimeout(()=>{
    const g=game();
    if(!canUserAct(g))return;
    if(trailLength(g)!==before)return;
    unlockButtons();
    if(button.disabled)return;
    state.pointerFallbacks+=1;
    state.lastPointerAction={type,hand:g.hand,street:g.street,at:new Date().toISOString()};
    button.click();
  },140);
}

function bindButton(button){
  if(button.dataset.phase410Bound==='1')return;
  button.dataset.phase410Bound='1';
  button.addEventListener('pointerdown',()=>{unlockButtons()},{passive:true});
  button.addEventListener('pointerup',()=>{
    const g=game();
    if(!canUserAct(g)||button.disabled)return;
    schedulePointerFallback(button,trailLength(g));
  },{passive:true});
  if(!('PointerEvent' in window))button.addEventListener('touchstart',()=>unlockButtons(),{passive:true});
}

function install(){
  for(const button of buttons())bindButton(button);
  state.installed=buttons().length===4;
  return state.installed;
}

function poll(){
  try{
    install();
    unlockButtons();
    state.lastError=null;
    state.checkedAt=new Date().toISOString();
  }catch(error){
    state.lastError=String(error?.message||error);
    state.checkedAt=new Date().toISOString();
  }
}

window.addEventListener('svr:user-turn-restored',()=>{
  const g=game();
  if(!g)return;
  try{clearInterval(g.turnInterval)}catch{}
  try{clearTimeout(g.botTimer)}catch{}
  g.turnInterval=null;g.botTimer=null;
  g.turnSeconds=15;
  unlockButtons();
  const clock=$('#turnClock');if(clock)clock.textContent='15';
  const tick=setInterval(()=>{
    const current=game();
    if(!canUserAct(current)){clearInterval(tick);return}
    current.turnSeconds=Math.max(0,Number(current.turnSeconds||0)-1);
    if(clock)clock.textContent=String(current.turnSeconds);
    if(current.turnSeconds<=0){
      clearInterval(tick);
      const user=current.players?.[USER],owed=Math.max(0,Number(current.currentBet||0)-Number(user?.streetBet||0));
      const auto=owed>0?document.querySelector('.actions button[data-a="fold"]'):document.querySelector('.actions button[data-a="call"]');
      unlockButtons();auto?.click();
    }
  },1000);
  g.turnInterval=tick;
});

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,60)},{once:true});else{poll();setInterval(poll,60)}
window.SVR_PHASE410_MOBILE_INPUT_QA=()=>({
  ...state,
  actionButtons:buttons().length,
  activePlayer:game()?.activePlayer??null,
  hand:game()?.hand??null,
  street:game()?.street??null,
  nonRaiseButtonsEnabled:buttons().filter(b=>b.dataset.a!=='raise').every(b=>!b.disabled),
  pass:Boolean(state.installed&&!state.lastError),
  checkedAt:new Date().toISOString()
});
