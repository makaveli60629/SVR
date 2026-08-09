/* PHASE-404-ANDROID-MOBILE-DECISION-SAFETY-LOCK */
const BUILD='PHASE-404-ANDROID-MOBILE-DECISION-SAFETY-LOCK';
const ALL_IN_CONFIRM_MS=2600;
const STORAGE='svr404_android_session';
const state={build:BUILD,installed:false,armedUntil:0,armTimer:0,wakeLock:null,wakeLockSupported:'wakeLock'in navigator,lastHand:0,lastCompletedHand:0,session:null,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const money=n=>`$${Math.max(0,Math.round(Number(n||0))).toLocaleString()}`;
const now=()=>Date.now();
function blankSession(){return{build:BUILD,startedAt:new Date().toISOString(),handsStarted:0,handsCompleted:0,potsWon:0,mainPotsWon:0,sidePotsWon:0,showdowns:0,folds:0,allIns:0,biggestPot:0,totalPotWon:0,lastHand:null}}
function loadSession(){try{const saved=JSON.parse(sessionStorage.getItem(STORAGE)||'null');if(saved?.build===BUILD)return saved}catch{}return blankSession()}
function saveSession(){if(!state.session)state.session=blankSession();sessionStorage.setItem(STORAGE,JSON.stringify(state.session));return state.session}
function resetAllInArm(reason=''){
  clearTimeout(state.armTimer);state.armTimer=0;state.armedUntil=0;
  const button=$('.actions button[data-a="allin"]');if(button){button.classList.remove('phase404-allin-armed');button.textContent='ALL IN'}
  if(reason)document.body.dataset.phase404AllInReset=reason;
}
function armAllIn(event,button){
  const g=game();if(!g||g.activePlayer!==0||g.handOver||g.players?.[0]?.folded)return;
  const t=now();
  if(state.armedUntil>t){resetAllInArm('confirmed');state.session.allIns+=1;saveSession();return}
  event.preventDefault();event.stopImmediatePropagation();
  state.armedUntil=t+ALL_IN_CONFIRM_MS;button.classList.add('phase404-allin-armed');button.textContent='CONFIRM ALL IN';
  const msg=$('#tableMessage');if(msg)msg.textContent='ALL IN ARMED • TAP CONFIRM ALL IN AGAIN';
  navigator.vibrate?.([25,35,25]);
  clearTimeout(state.armTimer);state.armTimer=setTimeout(()=>resetAllInArm('expired'),ALL_IN_CONFIRM_MS+80);
}
/* Capture runs before the Phase 403 engine's button click listener. */
document.addEventListener('click',event=>{
  const button=event.target?.closest?.('.actions button[data-a]');if(!button)return;
  if(button.dataset.a==='allin'){armAllIn(event,button);return}
  if(state.armedUntil)resetAllInArm('other-action');
},{capture:true});
function potOdds(call,pot){const c=Math.max(0,Number(call||0)),p=Math.max(0,Number(pot||0));return c>0?c/Math.max(1,p+c)*100:0}
function minimumRaiseTo(g,hero){const current=Math.max(0,Number(g.currentBet||0)),size=Math.max(1,Number(g.lastFullRaiseSize||g.tableBigBlind||100));return Math.min(Number(hero.streetBet||0)+Number(hero.stack||0),current>0?current+size:size)}
function ensureUi(){
  if(state.installed)return true;const raise=$('#raisePanel'),footer=$('.footer');if(!raise||!footer)return false;
  raise.insertAdjacentHTML('afterbegin','<section id="phase404DecisionStrip" class="phase404-decision-strip" aria-label="Current poker decision information"><span><small>POT</small><b data-pot>$0</b></span><span><small>CALL</small><b data-call>FREE</b></span><span><small>POT ODDS</small><b data-odds>0%</b></span><span><small>STACK</small><b data-stack>$0</b></span><span><small>MIN RAISE</small><b data-min>-</b></span></section>');
  const button=document.createElement('button');button.id='phase404SessionButton';button.type='button';button.className='phase404-footer-button';button.textContent='SESSION';button.addEventListener('click',openSession);footer.appendChild(button);
  document.body.insertAdjacentHTML('beforeend','<section id="phase404SessionSheet" class="phase404-sheet hide" aria-label="Playtest session report"><div class="phase404-sheet-head"><h2>Playtest Session</h2><button type="button" data-close-phase404>✕</button></div><div class="phase404-stats"></div><div class="phase404-sheet-actions"><button type="button" data-copy-phase404>COPY TEST REPORT</button><button type="button" data-reset-phase404>RESET SESSION</button></div><p class="phase404-note">This report stays on this device unless you copy and share it. It contains gameplay QA data, viewport and browser information, not account passwords or payment data.</p></section>');
  $('[data-close-phase404]')?.addEventListener('click',()=>$('#phase404SessionSheet')?.classList.add('hide'));
  $('[data-copy-phase404]')?.addEventListener('click',copyReport);
  $('[data-reset-phase404]')?.addEventListener('click',()=>{state.session=blankSession();saveSession();renderSession();});
  state.installed=true;return true;
}
function updateDecision(g){const strip=$('#phase404DecisionStrip'),hero=g?.players?.[0];if(!strip||!hero)return;const call=Math.max(0,Number(g.currentBet||0)-Number(hero.streetBet||0)),odds=potOdds(Math.min(call,hero.stack),g.pot),min=minimumRaiseTo(g,hero);strip.querySelector('[data-pot]').textContent=money(g.pot);strip.querySelector('[data-call]').textContent=call?money(Math.min(call,hero.stack)):'FREE';strip.querySelector('[data-odds]').textContent=call?`${odds.toFixed(1)}%`:'0%';strip.querySelector('[data-stack]').textContent=money(hero.stack);strip.querySelector('[data-min]').textContent=g.activePlayer===0&&!g.handOver?money(min):'-';strip.classList.toggle('your-turn',g.activePlayer===0&&!g.handOver);strip.classList.toggle('allin-armed',state.armedUntil>now())}
function totalBreakdownPot(g){return(g?.lastPotBreakdown||[]).reduce((sum,p)=>sum+Math.max(0,Number(p.amount||0)),0)}
function observeHand(g){
  if(!state.session)state.session=loadSession();
  if(g.hand>0&&g.hand!==state.lastHand){state.lastHand=g.hand;state.session.handsStarted+=1;resetAllInArm('new-hand');saveSession()}
  if(g.handOver&&g.hand>0&&g.hand!==state.lastCompletedHand){
    state.lastCompletedHand=g.hand;state.session.handsCompleted+=1;
    const breakdown=g.lastPotBreakdown||[],pot=totalBreakdownPot(g),won=breakdown.filter(p=>p.type==='pot'&&(p.winnerIndexes||[]).includes(0));
    if(Object.keys(g.lastShowdownHands||{}).length)state.session.showdowns+=1;
    if(won.length){state.session.potsWon+=won.length;state.session.mainPotsWon+=won.filter(p=>p.label==='MAIN POT').length;state.session.sidePotsWon+=won.filter(p=>String(p.label||'').startsWith('SIDE POT')).length;state.session.totalPotWon+=won.reduce((sum,p)=>sum+Math.max(0,Number(p.amount||0)),0)}
    state.session.biggestPot=Math.max(state.session.biggestPot,pot);
    const userActions=(g.actionTrail||[]).filter(a=>a.hand===g.hand&&a.index===0);state.session.folds+=userActions.filter(a=>/FOLD/.test(a.label)).length;
    state.session.lastHand={hand:g.hand,pot,winnerNames:[...new Set(breakdown.flatMap(p=>p.winnerNames||[]))],userWonPot:won.length>0,pots:breakdown.map(p=>({label:p.label,amount:p.amount,winnerNames:p.winnerNames,type:p.type})),at:new Date().toISOString()};saveSession();
  }
}
async function requestWakeLock(){if(!state.wakeLockSupported||state.wakeLock)return;try{state.wakeLock=await navigator.wakeLock.request('screen');state.wakeLock.addEventListener?.('release',()=>{state.wakeLock=null})}catch(error){document.body.dataset.phase404WakeLockError=String(error?.name||'unavailable')}}
function manageWakeLock(g){if(g?.joined&&!document.hidden)requestWakeLock();else if(state.wakeLock){state.wakeLock.release?.().catch?.(()=>{});state.wakeLock=null}}
function sessionReport(){const g=game(),qa={engine:window.SVR_PHASE403_ANDROID_ENGINE_QA?.()||null,clarity:window.SVR_PHASE403_TABLE_CLARITY_QA?.()||null,betting:window.SVR_PHASE398_ANDROID_BETTING_QA?.()||null,tournament:window.SVR_PHASE401_TOURNAMENT_QA?.()||null};return{build:BUILD,createdAt:new Date().toISOString(),session:state.session||loadSession(),current:{hand:g?.hand||0,street:g?.street??null,joined:Boolean(g?.joined),mode:new URLSearchParams(location.search).get('mode')||'regular'},device:{userAgent:navigator.userAgent,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio||1},orientation:screen.orientation?.type||null},qa}}
function renderSession(){const host=$('#phase404SessionSheet .phase404-stats'),s=state.session||loadSession();if(!host)return;const mins=Math.max(0,Math.floor((Date.now()-Date.parse(s.startedAt))/60000));host.innerHTML=`<article><small>HANDS</small><b>${s.handsCompleted}/${s.handsStarted}</b></article><article><small>POTS WON</small><b>${s.potsWon}</b></article><article><small>MAIN / SIDE</small><b>${s.mainPotsWon} / ${s.sidePotsWon}</b></article><article><small>SHOWDOWNS</small><b>${s.showdowns}</b></article><article><small>BIGGEST POT</small><b>${money(s.biggestPot)}</b></article><article><small>PLAY TIME</small><b>${mins}m</b></article>`}
function openSession(){renderSession();$('#phase404SessionSheet')?.classList.remove('hide')}
async function copyReport(){const report=JSON.stringify(sessionReport(),null,2);try{await navigator.clipboard.writeText(report);const b=$('[data-copy-phase404]');if(b){const old=b.textContent;b.textContent='COPIED';setTimeout(()=>b.textContent=old,1300)}}catch{const sheet=$('#phase404SessionSheet');if(sheet){const box=document.createElement('textarea');box.className='phase404-report-box';box.value=report;sheet.appendChild(box);box.select()}}}
function qa(){const g=game();return{build:BUILD,installed:state.installed,decisionStrip:Boolean($('#phase404DecisionStrip')),decisionStripInsideRaisePanel:Boolean($('#raisePanel > #phase404DecisionStrip')),allInDoubleTapGuard:true,allInConfirmMs:ALL_IN_CONFIRM_MS,sessionReport:Boolean($('#phase404SessionSheet')),copyTestReport:true,wakeLockSupported:state.wakeLockSupported,wakeLockHeld:Boolean(state.wakeLock),engineBuild:g?.engineBuild||null,phase403EnginePreserved:g?.engineBuild==='PHASE-403-ANDROID-POKER-ENGINE-RELIABILITY-LOCK',lastError:state.lastError,pass:Boolean(state.installed&&$('#raisePanel > #phase404DecisionStrip')&&$('#phase404SessionSheet')&&!state.lastError),checkedAt:new Date().toISOString()}}
function poll(){try{if(!ensureUi())return;const g=game();if(!g)return;updateDecision(g);observeHand(g);manageWakeLock(g);state.checkedAt=new Date().toISOString()}catch(error){state.lastError=String(error?.message||error)}}
state.session=loadSession();document.addEventListener('visibilitychange',()=>{if(document.hidden)resetAllInArm('hidden');manageWakeLock(game())});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{ensureUi();setInterval(poll,120)},{once:true});else{ensureUi();setInterval(poll,120)}
window.SVR_PHASE404_MOBILE_SAFETY_QA=qa;window.SVR_PHASE404_SESSION_REPORT=sessionReport;window.SVR_PHASE404_RESET_SESSION=()=>{state.session=blankSession();saveSession();return state.session};
