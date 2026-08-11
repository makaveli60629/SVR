/* PHASE-408-HOLDEM-STREET-CALL-TRUTH-LOCK */
const BUILD='PHASE-408-HOLDEM-STREET-CALL-TRUTH-LOCK';
const BOT_MIN_MS=4800,BOT_MAX_MS=5400;
const priorSetTimeout=window.setTimeout.bind(window);
const state={build:BUILD,installed:false,botPacingInstalled:false,botTimersAdjusted:0,lastBotDelay:0,lastHand:0,lastBoardCount:0,boardTransitions:[],invalidBoardTransition:false,invalidBurnSequence:false,burnInline:false,oneBurn:false,callTruth:false,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
const money=n=>`$${Math.max(0,Math.round(Number(n||0))).toLocaleString()}`;
window.SVR_PHASE408_HOLDEM_TRUTH=true;

/* Phase 407 already intercepts the original ~0.82–1.8s bot timer. This second preload runs after it and before the engine, mapping the original bot timer directly to an approximately five-second visible think window. Passing the longer delay into the Phase 407 wrapper prevents a second adjustment. */
if(!window.SVR_PHASE408_NATIVE_SET_TIMEOUT){
  window.SVR_PHASE408_NATIVE_SET_TIMEOUT=priorSetTimeout;
  window.setTimeout=function(handler,delay,...args){
    let adjusted=Number(delay||0),source='';
    try{source=typeof handler==='function'?Function.prototype.toString.call(handler):String(handler||'')}catch{}
    if(adjusted>=780&&adjusted<=1900&&/botDecision\s*\(/.test(source)){
      const ratio=Math.max(0,Math.min(1,(adjusted-820)/980));
      adjusted=Math.round(BOT_MIN_MS+ratio*(BOT_MAX_MS-BOT_MIN_MS));
      state.botTimersAdjusted+=1;state.lastBotDelay=adjusted;
      window.dispatchEvent(new CustomEvent('svr:bot-thinking',{detail:{delay:adjusted,build:BUILD}}));
    }
    return priorSetTimeout(handler,adjusted,...args);
  };
  state.botPacingInstalled=true;
}

function ensureBurnInline(){
  const burns=[...document.querySelectorAll('.burn-zone')],keep=burns.find(x=>x.id==='burnZone')||burns[0],row=$('.board-row'),community=$('#community');
  burns.forEach(x=>{if(x!==keep)x.remove()});
  if(!keep||!row||!community)return false;
  keep.id='burnZone';keep.classList.add('phase408-inline-burn');
  if(keep.parentElement!==row||keep.nextElementSibling!==community)row.insertBefore(keep,community);
  const strong=keep.querySelector('strong');if(strong)strong.textContent='BURN';
  const game=window.SVR_PHASE393_ANDROID_STATE,count=Math.max(0,Number(game?.burns?.length||0)),countEl=keep.querySelector('.burn-count');
  if(countEl)countEl.textContent=String(count);
  state.oneBurn=document.querySelectorAll('.burn-zone').length===1;
  state.burnInline=keep.parentElement===row&&keep.nextElementSibling===community;
  return state.oneBurn&&state.burnInline;
}

function ensureCallTruth(){
  const raise=$('#raisePanel');if(!raise)return false;
  let strip=$('#phase408CallTruth');
  if(!strip){
    strip=document.createElement('section');strip.id='phase408CallTruth';strip.className='phase408-call-truth';strip.setAttribute('aria-label','Exact call amount breakdown');
    strip.innerHTML='<span><small>TO CALL</small><b data-call>$0</b></span><span><small>MATCH BET</small><b data-match>$0</b></span><span><small>YOU IN</small><b data-in>$0</b></span><span><small>AFTER CALL</small><b data-after>$0</b></span>';
    const decision=$('#phase404DecisionStrip');decision?.insertAdjacentElement('afterend',strip)||raise.insertAdjacentElement('afterbegin',strip);
  }
  return Boolean(strip);
}

function updateCallTruth(game){
  const hero=game?.players?.[0],strip=$('#phase408CallTruth');if(!hero||!strip)return false;
  const tableBet=Math.max(0,Number(game.currentBet||0)),already=Math.max(0,Number(hero.streetBet||0)),owed=Math.max(0,tableBet-already),exact=Math.min(Math.max(0,Number(hero.stack||0)),owed),after=already+exact;
  strip.querySelector('[data-call]').textContent=owed?money(exact):'FREE';
  strip.querySelector('[data-match]').textContent=money(tableBet);
  strip.querySelector('[data-in]').textContent=money(already);
  strip.querySelector('[data-after]').textContent=money(after);
  strip.classList.toggle('your-turn',game.activePlayer===0&&!game.handOver);
  strip.classList.toggle('short-call',exact<owed);
  strip.title=owed?`You owe ${money(owed)} to match ${money(tableBet)}. You already have ${money(already)} in this betting round.`:'Nothing to call. You may check if action is on you.';
  const callButton=$('[data-a="call"]');
  state.callTruth=Boolean(exact===Math.max(0,Math.min(Number(hero.stack||0),Number(game.currentBet||0)-Number(hero.streetBet||0)))&&(!owed||callButton?.textContent?.includes(money(exact))));
  return state.callTruth;
}

function expectedBurns(boardCount){return boardCount===0?0:boardCount===3?1:boardCount===4?2:boardCount===5?3:null}
function validTransition(from,to){return from===to||(from===0&&to===3)||(from===3&&to===4)||(from===4&&to===5)||(from===5&&to===0)}
function trackStreetTruth(game){
  if(!game)return;
  const hand=Number(game.hand||0),board=Number(game.community?.length||0),burns=Number(game.burns?.length||0);
  if(hand!==state.lastHand){state.lastHand=hand;state.lastBoardCount=0}
  if(board!==state.lastBoardCount){
    const ok=validTransition(state.lastBoardCount,board);state.boardTransitions.push({hand,from:state.lastBoardCount,to:board,burns,at:Date.now(),ok});
    if(state.boardTransitions.length>40)state.boardTransitions.splice(0,state.boardTransitions.length-40);
    if(!ok)state.invalidBoardTransition=true;
    const cards=[...document.querySelectorAll('#community .card:not(.placeholder)')];
    const newlyDealt=board===3?cards.slice(0,3):board===4?cards.slice(3,4):board===5?cards.slice(4,5):[];
    newlyDealt.forEach((card,i)=>card.animate?.([{transform:'translateY(-16px) rotateY(88deg)',opacity:.25},{transform:'translateY(0) rotateY(0deg)',opacity:1}],{duration:430,delay:i*90,easing:'ease-out'}));
    state.lastBoardCount=board;
  }
  const expected=expectedBurns(board);if(expected!==null&&burns!==expected)state.invalidBurnSequence=true;
  const label=$('.board-row .zone-label');if(label){label.textContent=board===0?'BOARD':board===3?'BOARD • FLOP':board===4?'BOARD • TURN':board===5?'BOARD • RIVER':'BOARD'}
}

function poll(){
  try{
    const game=window.SVR_PHASE393_ANDROID_STATE;
    ensureBurnInline();ensureCallTruth();if(game){trackStreetTruth(game);updateCallTruth(game)}
    const visible=[...document.querySelectorAll('#community .card')].filter(card=>getComputedStyle(card).display!=='none').length;
    const board=Number(game?.community?.length||0);
    state.installed=Boolean(state.oneBurn&&state.burnInline&&$('#phase408CallTruth')&&visible===board&&!state.invalidBoardTransition&&!state.invalidBurnSequence);
    state.lastError=null;state.checkedAt=new Date().toISOString();
  }catch(error){state.lastError=String(error?.message||error)}
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,90)},{once:true});else{poll();setInterval(poll,90)}
window.SVR_PHASE408_HOLDEM_QA=()=>{const game=window.SVR_PHASE393_ANDROID_STATE,board=Number(game?.community?.length||0),burns=Number(game?.burns?.length||0),visible=[...document.querySelectorAll('#community .card')].filter(card=>getComputedStyle(card).display!=='none').length;return{build:BUILD,botThinkMinMs:BOT_MIN_MS,botThinkMaxMs:BOT_MAX_MS,botPacingInstalled:state.botPacingInstalled,botTimersAdjusted:state.botTimersAdjusted,lastBotDelay:state.lastBotDelay,oneBurnPile:state.oneBurn,burnInlineBesideBoard:state.burnInline,communityInState:board,communityVisible:visible,undealtCommunityHidden:visible===board,expectedBurns:expectedBurns(board),actualBurns:burns,burnSequenceCorrect:expectedBurns(board)===null||expectedBurns(board)===burns,boardTransitionCorrect:!state.invalidBoardTransition,callTruth:state.callTruth,boardTransitions:[...state.boardTransitions],phase403EnginePreserved:game?.engineBuild==='PHASE-403-ANDROID-POKER-ENGINE-RELIABILITY-LOCK',pass:Boolean(state.installed&&state.botPacingInstalled&&state.callTruth&&!state.lastError),lastError:state.lastError,checkedAt:new Date().toISOString()}};
