/* PHASE-418-MOBILE-SURFACE-POLISH-LOCK | PHASE-423-MOBILE-SEAT-SPACING-POLISH | PHASE-427-LOCAL-PLAYER-RECOVERY */
const BUILD='PHASE-427-MOBILE-CREATE-PLAYER-RECOVERY';
const state={build:BUILD,flowDocked:false,quickMic:false,accountControls:false,chooserOneScreen:false,chooserAccounts:false,stackBadges:0,seatSpacing:false,cloudAccountConfigured:false,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const money=n=>`$${Math.max(0,Math.round(Number(n||0))).toLocaleString()}`;

function ensureSeatSpacing(){
  if($('#phase423-mobile-seat-spacing')){state.seatSpacing=true;return true}
  const style=document.createElement('style');style.id='phase423-mobile-seat-spacing';style.textContent=`
  .players{left:clamp(10px,2.2vw,22px)!important;right:clamp(10px,2.2vw,22px)!important}
  .player-box[data-seat="2"]{--seat-transform:translateX(-50%)}
  @media(max-width:720px){
    .player-box[data-seat="1"],.player-box[data-seat="2"],.player-box[data-seat="3"]{width:min(28.2%,118px)!important;max-width:28.2%!important}
    .player-box[data-seat="4"],.player-box[data-seat="5"]{width:min(29%,118px)!important;max-width:29%!important;top:53%!important}
    .player-box.active{animation-name:phase423SeatPulse!important}
  }
  @media(max-width:430px){
    .players{left:8px!important;right:8px!important}
    .player-box[data-seat="1"],.player-box[data-seat="2"],.player-box[data-seat="3"]{width:27.8%!important;max-width:27.8%!important;padding-inline:3px!important}
    .player-box[data-seat="4"],.player-box[data-seat="5"]{width:28.5%!important;max-width:28.5%!important;top:54%!important}
  }
  @media(orientation:landscape) and (max-height:620px){
    .players{left:14px!important;right:14px!important}
    .player-box[data-seat="1"],.player-box[data-seat="2"],.player-box[data-seat="3"]{width:min(27.5%,124px)!important;max-width:27.5%!important}
    .player-box[data-seat="4"],.player-box[data-seat="5"]{top:55%!important}
  }
  @keyframes phase423SeatPulse{from{transform:var(--seat-transform,none) scale(1)}to{transform:var(--seat-transform,none) scale(1.012)}}`;
  document.head.appendChild(style);state.seatSpacing=true;return true
}
function dockFlowRail(){const rail=$('#phase403FlowRail'),strip=$('#phase404DecisionStrip'),raise=$('#raisePanel');if(!rail||!strip||!raise)return false;if(rail.parentElement!==raise||rail.previousElementSibling!==strip)strip.insertAdjacentElement('afterend',rail);rail.classList.add('phase418-flow-docked');state.flowDocked=rail.parentElement===raise&&rail.previousElementSibling===strip;return state.flowDocked}
function accountSnapshot(){try{return window.SVR_PHASE345_ACCOUNT_QA?.()?.account||window.SVR_PLAYER_ACCOUNT?.snapshot?.()||window.SVR_PLAYER_ACCOUNT_STATE||null}catch{return null}}
function openVoice(){const sheet=$('#phase405VoiceSheet');if(sheet){sheet.classList.remove('hide');return true}const legacy=$('#phase405VoiceButton');if(legacy){legacy.click();return true}return false}
function ensureQuickControls(){
  const raise=$('#raisePanel'),flow=$('#phase403FlowRail');if(!raise)return false;
  let host=$('#phase418QuickControls');
  if(!host){host=document.createElement('div');host.id='phase418QuickControls';host.className='phase418-quick-controls';host.setAttribute('aria-label','Quick table controls');host.innerHTML='<button id="phase418QuickMic" class="phase418-quick-control mic" type="button">MIC / VOX</button><a id="phase418Profile" class="phase418-quick-control account" href="/site/profile.html?v=phase427&source=mobile-table">PROFILE</a><a id="phase418Login" class="phase418-quick-control account" href="/site/login.html?next=/game/android.html%3Fchannel%3Dstable%26v%3Dphase427">PLAYER LOGIN</a><a id="phase418Register" class="phase418-quick-control account" href="/site/login.html?mode=register&next=/game/android.html%3Fchannel%3Dstable%26v%3Dphase427">CREATE PLAYER</a>';(flow||$('#phase404DecisionStrip'))?.insertAdjacentElement('afterend',host)||raise.prepend(host)}
  const mic=$('#phase418QuickMic');if(mic&&!mic.dataset.wired){mic.dataset.wired='1';mic.addEventListener('click',()=>{if(!openVoice()){const msg=$('#tableMessage');if(msg)msg.textContent='VOICE CONTROLS ARE STILL LOADING'}})}
  const snap=accountSnapshot(),signedIn=Boolean(snap?.profile),apiConfigured=Boolean(snap?.apiConfigured||snap?.config?.apiBase),profile=$('#phase418Profile'),login=$('#phase418Login'),register=$('#phase418Register');state.cloudAccountConfigured=apiConfigured;
  if(profile)profile.hidden=!signedIn;if(login)login.hidden=signedIn;if(register)register.hidden=signedIn;
  if(signedIn&&profile){const name=snap.profile.displayName||snap.profile.name||'PLAYER';profile.textContent=`PROFILE • ${String(name).toUpperCase().slice(0,18)}`}
  if(!signedIn&&login){login.textContent='PLAYER LOGIN';login.title=apiConfigured?'Cloud player login':'Sign in to the device-local player while AWS cloud sync is pending.'}
  if(!signedIn&&register){register.textContent='CREATE PLAYER';register.title=apiConfigured?'Create cloud player':'Create a playable device-local player now; cloud sync remains pending until AWS is deployed.'}
  state.quickMic=Boolean(mic);state.accountControls=Boolean(profile&&login&&register);return state.quickMic&&state.accountControls
}
function ensureChooser(){const chooser=/\/game\/(?:android|iphone)\.html$/i.test(location.pathname),card=document.querySelector('body > .card, body > main.card');if(!chooser||!card)return false;document.body.classList.add('phase418-one-screen');state.chooserOneScreen=true;let row=$('#phase418ChooserAccounts');if(!row){row=document.createElement('div');row.id='phase418ChooserAccounts';row.className='phase418-account-row';row.innerHTML='<a href="/site/login.html?next=/game/android.html%3Fchannel%3Dstable%26v%3Dphase427">PLAYER ACCESS</a><a class="register" href="/site/login.html?mode=register&next=/game/android.html%3Fchannel%3Dstable%26v%3Dphase427">CREATE PLAYER</a><a href="/site/tournament-account.html?v=phase418">TOURNAMENT ACCOUNT</a>';const links=card.querySelector('.links');(links||card).insertAdjacentElement('afterend',row)}const tournament=card.querySelector('.mode.tournament a');if(tournament)tournament.title='Tournament entry requires a player identity; unsigned players route through Player Access.';state.chooserAccounts=Boolean(row);return true}
function ensurePlayerStacks(){const g=game();if(!g?.players?.length)return 0;let count=0;for(const player of g.players){if(player.index===0)continue;const seat=$(`[data-player="${player.index}"]`);if(!seat)continue;let badge=seat.querySelector('.phase418-stack');if(!badge){badge=document.createElement('span');badge.className='phase418-stack';const meta=seat.querySelector('.player-meta');(meta||seat).appendChild(badge)}badge.textContent=`STACK ${money(player.stack)}`;badge.setAttribute('aria-label',`${player.name} stack ${money(player.stack)}`);count++}state.stackBadges=count;return count}
function ensureVoiceLabel(){const legacy=$('#phase405VoiceButton');if(legacy)legacy.textContent='MIC / VOX'}
function poll(){try{ensureSeatSpacing();ensureChooser();dockFlowRail();ensureQuickControls();ensureVoiceLabel();ensurePlayerStacks();state.lastError=null}catch(error){state.lastError=String(error?.message||error)}state.checkedAt=new Date().toISOString()}
function qa(){poll();const tablePage=Boolean($('#raisePanel'));return{...state,flowParent:$('#phase403FlowRail')?.parentElement?.id||null,flowPrevious:$('#phase403FlowRail')?.previousElementSibling?.id||null,oneBurnPile:document.querySelectorAll('.burn-zone').length===1,voiceSheet:Boolean($('#phase405VoiceSheet')),existingVoiceClient:Boolean(window.SVR_PHASE405_VOX_QA),voicePeerConnected:Boolean(window.SVR_PHASE399_MATCH_STATE?.voiceConnected),profileRoute:'/site/profile.html',loginRoute:'/site/login.html',pokerStateMutated:false,pass:Boolean(!state.lastError&&state.seatSpacing&&(state.chooserOneScreen||!document.querySelector('body > .card, body > main.card'))&&(!tablePage||(state.flowDocked&&state.quickMic&&state.accountControls&&state.stackBadges>=5))),checkedAt:new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,180)},{once:true});else{poll();setInterval(poll,180)}
window.addEventListener('svr:account-change',poll);window.SVR_PHASE418_MOBILE_SURFACE_QA=qa;window.SVR_PHASE423_MOBILE_POLISH_QA=qa;window.SVR_PHASE427_MOBILE_ACCOUNT_QA=qa;
