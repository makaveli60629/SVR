/* PHASE-407-MOBILE-FIT-LOGIN-BURN-LOCK | Phase 408 inline burn compatible | Phase 409 turn/fit layer | Phase 410 human input layer | Phase 411 tournament/bot/action layer */
const BUILD='PHASE-407-MOBILE-FIT-LOGIN-BURN-LOCK';
const state={build:BUILD,installed:false,burnBesideBoard:false,oneBurn:false,userTurn:false,loginButton:false,accountMode:'loading',signedIn:false,thinking:false,lastThinkDelay:0,phase409Layer:false,phase410Layer:false,phase411Layer:false,lastError:null};
const $=s=>document.querySelector(s);
function accountSnapshot(){try{return window.SVR_PHASE345_ACCOUNT_QA?.()?.account||window.SVR_PLAYER_ACCOUNT?.snapshot?.()||null}catch{return null}}
function ensureSingleBurn(){
  const burns=[...document.querySelectorAll('.burn-zone')],keep=burns.find(x=>x.id==='burnZone')||burns[0],table=$('.table-surface'),label=$('.board-row .zone-label');
  burns.forEach(x=>{if(x!==keep)x.remove()});
  if(window.SVR_PHASE408_HOLDEM_TRUTH&&keep&&label){
    const row=label.closest('.board-row'),community=$('#community');
    if(row&&community){
      keep.id='burnZone';keep.classList.add('phase407-board-burn','phase408-inline-burn');
      if(keep.parentElement!==row||keep.nextElementSibling!==community)row.insertBefore(keep,community);
      const strong=keep.querySelector('strong');if(strong)strong.textContent='BURN';
      state.oneBurn=document.querySelectorAll('.burn-zone').length===1;
      state.burnBesideBoard=keep.parentElement===row&&keep.nextElementSibling===community;
      return state.oneBurn&&state.burnBesideBoard;
    }
  }
  if(keep&&table&&keep.parentElement!==table)table.appendChild(keep);
  if(keep){keep.id='burnZone';keep.classList.add('phase407-board-burn');const strong=keep.querySelector('strong');if(strong)strong.textContent='BURN'}
  if(keep&&table&&label){
    const tr=table.getBoundingClientRect(),lr=label.getBoundingClientRect(),left=Math.max(6,lr.right-tr.left+5),top=Math.max(6,lr.top-tr.top+(lr.height/2)-14);
    keep.style.setProperty('--svr407-burn-left',`${Math.round(left)}px`);keep.style.setProperty('--svr407-burn-top',`${Math.round(top)}px`);
  }
  state.oneBurn=document.querySelectorAll('.burn-zone').length===1;
  state.burnBesideBoard=Boolean(keep&&table&&label&&keep.parentElement===table&&keep.style.getPropertyValue('--svr407-burn-left'));
  return state.oneBurn&&state.burnBesideBoard;
}
function ensureAccountUi(){
  const footer=$('.footer');if(!footer)return false;
  let button=$('#phase407LoginButton');if(!button){button=document.createElement('a');button.id='phase407LoginButton';button.className='phase405-footer-button phase407-login-button';footer.appendChild(button)}
  const snap=accountSnapshot(),profile=snap?.profile||null,apiConfigured=Boolean(snap?.config?.apiBase),returnTo=encodeURIComponent(`${location.pathname}${location.search}`);
  state.accountMode=snap?.mode||'loading';state.signedIn=Boolean(profile);
  if(profile){button.textContent=`ACCOUNT • ${(profile.displayName||profile.name||'PLAYER').toUpperCase()}`;button.href='/site/profile.html?v=phase411&source=mobile-game';button.title='Signed-in player profile'}
  else{button.textContent=apiConfigured?'SIGN IN':'SIGN IN • GUEST TEST';button.href=`/site/login.html?return=${returnTo}&v=phase411`;button.title=apiConfigured?'Sign in to your SVR Poker account':'Guest play remains enabled while the secure account backend is still being configured.'}
  const userName=$('#userName');if(profile&&userName)userName.textContent=profile.displayName||profile.name||userName.textContent;
  state.loginButton=true;return true;
}
function turnPolish(){
  const strip=$('.turn-strip'),status=$('#status'),game=window.SVR_PHASE393_ANDROID_STATE;if(!strip||!status)return;
  const userTurn=Boolean(game&&game.activePlayer===0&&!game.handOver);state.userTurn=userTurn;strip.classList.toggle('phase407-user-turn',userTurn);strip.classList.toggle('phase407-bot-turn',Boolean(game&&game.activePlayer!==0&&!game.handOver));
}
function thinkingPolish(){
  const game=window.SVR_PHASE393_ANDROID_STATE,active=game?.activePlayer,thinking=Number.isInteger(active)&&active>0&&!game?.handOver;
  state.thinking=thinking;document.body.classList.toggle('phase407-bot-thinking',thinking);
  const player=thinking?game.players?.[active]:null,el=$('#tableMessage');if(thinking&&player&&el&&!/thinking/i.test(el.textContent||''))el.dataset.phase407Thinking=`${player.name} thinking…`;
}
function micPolish(){const b=$('#phase406QuickMic');if(b&&!/VOX/.test(b.textContent||''))b.textContent='MIC / VOX'}
function ensurePhase409Layer(){
  let link=document.querySelector('link[href*="phase409_mobile_player_box_fit.css"]');if(!link){link=document.createElement('link');link.rel='stylesheet';link.href='/game/styles/phase409_mobile_player_box_fit.css?v=phase409';link.dataset.phase409PlayerFit='1';document.head.appendChild(link)}
  let script=document.querySelector('script[src*="phase409_mobile_player_turn_guard.js"]');if(!window.SVR_PHASE409_PLAYER_TURN_QA&&!script){script=document.createElement('script');script.type='module';script.src='/game/modules/phase409_mobile_player_turn_guard.js?v=phase409';script.dataset.phase409TurnGuard='1';document.body.appendChild(script)}
  state.phase409Layer=Boolean(link&&(script||window.SVR_PHASE409_PLAYER_TURN_QA));return state.phase409Layer
}
function ensurePhase410Layer(){
  let link=document.querySelector('link[href*="phase410_mobile_human_input_lock.css"]');if(!link){link=document.createElement('link');link.rel='stylesheet';link.href='/game/styles/phase410_mobile_human_input_lock.css?v=phase410';link.dataset.phase410HumanInput='1';document.head.appendChild(link)}
  let script=document.querySelector('script[src*="phase410_mobile_human_input_lock.js"]');if(!window.SVR_PHASE410_MOBILE_INPUT_QA&&!script){script=document.createElement('script');script.type='module';script.src='/game/modules/phase410_mobile_human_input_lock.js?v=phase410';script.dataset.phase410HumanInput='1';document.body.appendChild(script)}
  state.phase410Layer=Boolean(link&&(script||window.SVR_PHASE410_MOBILE_INPUT_QA));return state.phase410Layer
}
function addStyle(href,key){let link=document.querySelector(`link[href*="${key}"]`);if(!link){link=document.createElement('link');link.rel='stylesheet';link.href=href;link.dataset.phase411='1';document.head.appendChild(link)}return link}
function addModule(src,key,qa){let script=document.querySelector(`script[src*="${key}"]`);if(!window[qa]&&!script){script=document.createElement('script');script.type='module';script.src=src;script.dataset.phase411='1';document.body.appendChild(script)}return script||window[qa]}
function ensurePhase411Layer(){
  const actionStyle=addStyle('/game/styles/phase411_mobile_action_readability.css?v=phase411','phase411_mobile_action_readability.css');
  const tournamentStyle=addStyle('/game/styles/phase411_tournament_flow.css?v=phase411','phase411_tournament_flow.css');
  const tournament=addModule('/game/modules/phase411_tournament_field_rotation.js?v=phase411','phase411_tournament_field_rotation.js','SVR_PHASE411_TOURNAMENT_QA');
  const bots=addModule('/game/modules/phase411_bot_independence_guard.js?v=phase411','phase411_bot_independence_guard.js','SVR_PHASE411_BOT_QA');
  const actions=addModule('/game/modules/phase411_mobile_action_readability.js?v=phase411','phase411_mobile_action_readability.js','SVR_PHASE411_ACTION_QA');
  document.querySelectorAll('a[href*="tournaments.html"]').forEach(a=>{try{const u=new URL(a.href,location.href);u.searchParams.set('v','phase411');a.href=u.pathname+u.search}catch{}});
  state.phase411Layer=Boolean(actionStyle&&tournamentStyle&&tournament&&bots&&actions);return state.phase411Layer
}
function poll(){try{ensurePhase409Layer();ensurePhase410Layer();ensurePhase411Layer();ensureSingleBurn();ensureAccountUi();turnPolish();thinkingPolish();micPolish();state.installed=Boolean(state.oneBurn&&state.burnBesideBoard&&state.loginButton&&state.phase409Layer&&state.phase410Layer&&state.phase411Layer);state.lastError=null}catch(e){state.lastError=String(e?.message||e)}}
window.addEventListener('svr:bot-thinking',e=>{state.lastThinkDelay=Number(e.detail?.delay||0)});
window.addEventListener('resize',()=>setTimeout(ensureSingleBurn,60),{passive:true});
window.visualViewport?.addEventListener('resize',()=>setTimeout(ensureSingleBurn,60),{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,260)},{once:true});else{poll();setInterval(poll,260)}
window.SVR_PHASE407_MOBILE_QA=()=>({build:BUILD,...state,actionButtons:document.querySelectorAll('.actions button').length,chipStacks:document.querySelectorAll('.phase399-chip-stack').length,voiceReady:Boolean(window.SVR_PHASE405_VOX_QA),accountBridge:Boolean(window.SVR_PHASE345_ACCOUNT_QA),guestFallbackEnabled:!state.signedIn,loginRequiredForProduction:true,phase408InlineBurnCompatible:true,phase409TurnGuard:Boolean(window.SVR_PHASE409_PLAYER_TURN_QA),phase410HumanInput:Boolean(window.SVR_PHASE410_MOBILE_INPUT_QA),phase411Tournament:Boolean(window.SVR_PHASE411_TOURNAMENT_QA),phase411BotIndependence:Boolean(window.SVR_PHASE411_BOT_QA),phase411ActionReadability:Boolean(window.SVR_PHASE411_ACTION_QA),liveMultiplayer:Boolean(window.SVR_PHASE399_MATCH_STATE?.authoritativeGame&&window.SVR_PHASE399_MATCH_STATE?.matched),pass:Boolean(state.installed&&!state.lastError),checkedAt:new Date().toISOString()});
