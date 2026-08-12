/* PHASE-418-MOBILE-SURFACE-POLISH-LOCK */
const BUILD='PHASE-418-MOBILE-SURFACE-POLISH-LOCK';
const state={build:BUILD,flowDocked:false,quickMic:false,accountControls:false,stackBadges:0,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const money=n=>`$${Math.max(0,Math.round(Number(n||0))).toLocaleString()}`;

function dockFlowRail(){
  const rail=$('#phase403FlowRail'),strip=$('#phase404DecisionStrip'),raise=$('#raisePanel');
  if(!rail||!strip||!raise)return false;
  if(rail.parentElement!==raise||rail.previousElementSibling!==strip)strip.insertAdjacentElement('afterend',rail);
  rail.classList.add('phase418-flow-docked');
  state.flowDocked=rail.parentElement===raise&&rail.previousElementSibling===strip;
  return state.flowDocked;
}
function accountSnapshot(){
  try{return window.SVR_PHASE345_ACCOUNT_QA?.()?.account||window.SVR_PLAYER_ACCOUNT?.snapshot?.()||window.SVR_PLAYER_ACCOUNT_STATE||null}catch{return null}
}
function openVoice(){
  const sheet=$('#phase405VoiceSheet');
  if(sheet){sheet.classList.remove('hide');return true}
  const legacy=$('#phase405VoiceButton');
  if(legacy){legacy.click();return true}
  return false;
}
function ensureQuickControls(){
  const raise=$('#raisePanel'),flow=$('#phase403FlowRail');if(!raise)return false;
  let host=$('#phase418QuickControls');
  if(!host){
    host=document.createElement('div');host.id='phase418QuickControls';host.className='phase418-quick-controls';host.setAttribute('aria-label','Quick table controls');
    host.innerHTML='<button id="phase418QuickMic" class="phase418-quick-control mic" type="button">MIC / VOX</button><a id="phase418Profile" class="phase418-quick-control account" href="/site/profile.html?v=phase418&source=mobile-table">PROFILE</a><a id="phase418Login" class="phase418-quick-control account" href="/site/login.html?next=/game/android.html%3Fchannel%3Dstable%26v%3Dphase418">SIGN IN</a><a id="phase418Register" class="phase418-quick-control account" href="/site/register.html?next=/game/android.html%3Fchannel%3Dstable%26v%3Dphase418">CREATE ACCOUNT</a>';
    (flow||$('#phase404DecisionStrip'))?.insertAdjacentElement('afterend',host)||raise.prepend(host);
  }
  const mic=$('#phase418QuickMic');if(mic&&!mic.dataset.wired){mic.dataset.wired='1';mic.addEventListener('click',()=>{if(!openVoice()){const msg=$('#tableMessage');if(msg)msg.textContent='VOICE CONTROLS ARE STILL LOADING'}})}
  const snap=accountSnapshot(),signedIn=Boolean(snap?.profile),profile=$('#phase418Profile'),login=$('#phase418Login'),register=$('#phase418Register');
  if(profile)profile.hidden=!signedIn;if(login)login.hidden=signedIn;if(register)register.hidden=signedIn;
  if(signedIn&&profile){const name=snap.profile.displayName||snap.profile.name||'PLAYER';profile.textContent=`PROFILE • ${String(name).toUpperCase().slice(0,18)}`}
  state.quickMic=Boolean(mic);state.accountControls=Boolean(profile&&login&&register);return state.quickMic&&state.accountControls;
}
function ensurePlayerStacks(){
  const g=game();if(!g?.players?.length)return 0;let count=0;
  for(const player of g.players){
    if(player.index===0)continue;const seat=$(`[data-player="${player.index}"]`);if(!seat)continue;
    let badge=seat.querySelector('.phase418-stack');if(!badge){badge=document.createElement('span');badge.className='phase418-stack';const meta=seat.querySelector('.player-meta');(meta||seat).appendChild(badge)}
    badge.textContent=`STACK ${money(player.stack)}`;badge.setAttribute('aria-label',`${player.name} stack ${money(player.stack)}`);count++;
  }
  state.stackBadges=count;return count;
}
function ensureVoiceLabel(){const legacy=$('#phase405VoiceButton');if(legacy)legacy.textContent='MIC / VOX'}
function poll(){
  try{dockFlowRail();ensureQuickControls();ensureVoiceLabel();ensurePlayerStacks();state.lastError=null}catch(error){state.lastError=String(error?.message||error)}
  state.checkedAt=new Date().toISOString();
}
function qa(){poll();return{...state,flowParent:$('#phase403FlowRail')?.parentElement?.id||null,flowPrevious:$('#phase403FlowRail')?.previousElementSibling?.id||null,oneBurnPile:document.querySelectorAll('.burn-zone').length===1,voiceSheet:Boolean($('#phase405VoiceSheet')),existingVoiceClient:Boolean(window.SVR_PHASE405_VOX_QA),profileRoute:'/site/profile.html',loginRoute:'/site/login.html',registerRoute:'/site/register.html',pokerStateMutated:false,pass:Boolean(state.flowDocked&&state.quickMic&&state.accountControls&&state.stackBadges>=5&&!state.lastError),checkedAt:new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,180)},{once:true});else{poll();setInterval(poll,180)}
window.addEventListener('svr:account-change',poll);
window.SVR_PHASE418_MOBILE_SURFACE_QA=qa;
