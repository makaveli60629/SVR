/* PHASE-407-MOBILE-FIT-LOGIN-BURN-LOCK */
const BUILD='PHASE-407-MOBILE-FIT-LOGIN-BURN-LOCK';
window.SVR_PHASE407_BOARD_BURN=true;
const state={build:BUILD,installed:false,burnBesideBoard:false,oneBurn:false,userTurn:false,loginButton:false,accountMode:'loading',signedIn:false,thinking:false,lastThinkDelay:0,lastError:null};
const $=s=>document.querySelector(s);
function accountSnapshot(){try{return window.SVR_PHASE345_ACCOUNT_QA?.()?.account||window.SVR_PLAYER_ACCOUNT?.snapshot?.()||null}catch{return null}}
function ensureSingleBurn(){
  const burns=[...document.querySelectorAll('.burn-zone')],keep=burns.find(x=>x.id==='burnZone')||burns[0];
  burns.forEach(x=>{if(x!==keep)x.remove()});
  const row=$('.board-row'),label=row?.querySelector('.zone-label');
  if(keep&&row&&label&&keep.parentElement!==row)label.insertAdjacentElement('afterend',keep);
  if(keep){keep.id='burnZone';keep.classList.add('phase407-board-burn');const strong=keep.querySelector('strong');if(strong)strong.textContent='BURN'}
  state.oneBurn=document.querySelectorAll('.burn-zone').length===1;
  state.burnBesideBoard=Boolean(keep&&row&&keep.parentElement===row&&keep.previousElementSibling===label);
  return state.oneBurn&&state.burnBesideBoard;
}
function ensureAccountUi(){
  const footer=$('.footer');if(!footer)return false;
  let button=$('#phase407LoginButton');if(!button){button=document.createElement('a');button.id='phase407LoginButton';button.className='phase405-footer-button phase407-login-button';footer.appendChild(button)}
  const snap=accountSnapshot(),profile=snap?.profile||null,apiConfigured=Boolean(snap?.config?.apiBase),returnTo=encodeURIComponent(`${location.pathname}${location.search}`);
  state.accountMode=snap?.mode||'loading';state.signedIn=Boolean(profile);
  if(profile){button.textContent=`ACCOUNT • ${(profile.displayName||profile.name||'PLAYER').toUpperCase()}`;button.href='/site/profile.html?v=phase407&source=mobile-game';button.title='Signed-in player profile'}
  else{button.textContent=apiConfigured?'SIGN IN':'SIGN IN • GUEST TEST';button.href=`/site/login.html?return=${returnTo}&v=phase407`;button.title=apiConfigured?'Sign in to your SVR Poker account':'Guest play remains enabled while the secure account backend is still being configured.'}
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
function installObserver(){
  const table=$('.table-surface');if(!table||table.dataset.phase407Observer)return;table.dataset.phase407Observer='1';
  new MutationObserver(()=>ensureSingleBurn()).observe(table,{childList:true,subtree:true});
}
function poll(){try{ensureSingleBurn();ensureAccountUi();turnPolish();thinkingPolish();micPolish();installObserver();state.installed=Boolean(state.oneBurn&&state.burnBesideBoard&&state.loginButton);state.lastError=null}catch(e){state.lastError=String(e?.message||e)}}
window.addEventListener('svr:bot-thinking',e=>{state.lastThinkDelay=Number(e.detail?.delay||0)});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,260)},{once:true});else{poll();setInterval(poll,260)}
window.SVR_PHASE407_MOBILE_QA=()=>({build:BUILD,...state,actionButtons:document.querySelectorAll('.actions button').length,chipStacks:document.querySelectorAll('.phase399-chip-stack').length,voiceReady:Boolean(window.SVR_PHASE405_VOX_QA),accountBridge:Boolean(window.SVR_PHASE345_ACCOUNT_QA),guestFallbackEnabled:!state.signedIn,loginRequiredForProduction:true,liveMultiplayer:Boolean(window.SVR_PHASE399_MATCH_STATE?.authoritativeGame&&window.SVR_PHASE399_MATCH_STATE?.matched),pass:Boolean(state.installed&&!state.lastError),checkedAt:new Date().toISOString()});
