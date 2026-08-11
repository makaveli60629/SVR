/* PHASE-411-BOT-INDEPENDENCE-RAISE-CASCADE-GUARD-LOCK */
import {evaluate} from './phase393_android_evaluator.js?v=phase399';

const BUILD='PHASE-411-BOT-INDEPENDENCE-RAISE-CASCADE-GUARD-LOCK';
const PROFILES=Object.freeze({
  1:{name:'Claudia',level:1,label:'CONSERVATIVE',strong:.90,reraise:.02,maxRaises:1},
  2:{name:'Eric',level:2,label:'BALANCED',strong:.83,reraise:.05,maxRaises:1},
  3:{name:'Maya',level:3,label:'PRESSURE',strong:.73,reraise:.13,maxRaises:2},
  4:{name:'Darius',level:4,label:'LOOSE AGGRESSIVE',strong:.68,reraise:.19,maxRaises:2},
  5:{name:'Nova',level:5,label:'TRICKY',strong:.80,reraise:.15,maxRaises:1}
});
const runtime={build:BUILD,installed:false,strategicLocks:0,lastHand:0,lastStreet:-1,lastActor:null,lastError:null};
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function preflop(cards){
  const [a,b]=(cards||[]).filter(Boolean);if(!a||!b)return .2;
  const hi=Math.max(a.v,b.v),lo=Math.min(a.v,b.v),pair=a.v===b.v,suited=a.s===b.s,gap=Math.abs(a.v-b.v);
  let s=(hi-2)/12*.42+(lo-2)/12*.18;if(pair)s+=.31+(hi/14)*.08;if(suited)s+=.07;if(gap===1)s+=.06;else if(gap===2)s+=.03;if(hi===14&&lo>=10)s+=.11;return clamp(s,.05,.98)
}
function strength(player,g){
  const cards=[...(player?.cards||[]),...(g?.community||[])].filter(Boolean);if(cards.length<5)return preflop(player?.cards);
  try{const h=evaluate(cards),cat=Math.max(0,Number(h.score?.[0]||0)),w=[.14,.33,.48,.60,.70,.80,.89,.96,1][cat]??.14,k=clamp(Number(h.score?.[1]||0)/14)*.08;return clamp(w+k,.05,1)}catch{return preflop(player?.cards)}
}
function deterministic(g,index){
  const p=g?.players?.[index],cards=[...(p?.cards||[]),...(g?.community||[])];let n=(g?.hand||1)*7919+(g?.street||0)*1543+index*3571;
  for(const c of cards)n=(n*33+(Number(c?.v||0)*7)+String(c?.s||'').charCodeAt(0)||0)>>>0;
  n=(n^n>>>16)*2246822519>>>0;n=(n^n>>>13)*3266489917>>>0;return ((n^n>>>16)>>>0)/4294967295
}
function raiseActions(g){
  return (g?.actionTrail||[]).filter(x=>x.hand===g.hand&&x.street===g.street&&/\bRAISE\b/i.test(String(x.label||'')));
}
function apply(){
  const g=game();if(!g?.players?.length||g.handOver)return;
  const idx=g.activePlayer;if(!Number.isInteger(idx)||idx<=0)return;
  const p=g.players[idx],cfg=PROFILES[idx];if(!p||!cfg||p.folded||p.allIn||p.stack<=0)return;
  p.botLevel=cfg.level;p.botStrategy=cfg.label;p.botStyle=cfg.label;
  const raises=raiseActions(g),otherRaises=raises.filter(x=>x.index!==idx),ownRaises=raises.filter(x=>x.index===idx);
  if(!otherRaises.length)return;
  const s=strength(p,g),seed=deterministic(g,idx),latest=otherRaises[otherRaises.length-1];
  let threshold=cfg.strong;
  if(otherRaises.length>=2)threshold=Math.min(.97,threshold+.07);
  const mayBluff=seed<cfg.reraise&&otherRaises.length<2;
  const overBudget=ownRaises.length>=cfg.maxRaises;
  const shouldLock=overBudget||(!mayBluff&&s<threshold);
  if(shouldLock&&!p.raiseLocked){p.raiseLocked=true;p.phase411StrategyLock=true;runtime.strategicLocks++;runtime.lastActor=latest?.index??null}
}
function decorate(){
  const g=game();if(!g?.players?.length)return;
  for(let i=1;i<g.players.length;i++){const p=g.players[i],cfg=PROFILES[i];if(p&&cfg){p.botLevel=cfg.level;p.botStrategy=cfg.label}}
}
function poll(){try{const g=game();if(g&&(g.hand!==runtime.lastHand||g.street!==runtime.lastStreet)){runtime.lastHand=g.hand;runtime.lastStreet=g.street}decorate();apply();runtime.installed=Boolean(g?.players?.length);runtime.lastError=null}catch(e){runtime.lastError=String(e?.message||e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,70)},{once:true});else{poll();setInterval(poll,70)}
window.SVR_PHASE411_BOT_QA=()=>({build:BUILD,installed:runtime.installed,strategicLocks:runtime.strategicLocks,profiles:PROFILES,activePlayer:game()?.activePlayer,raiseCount:raiseActions(game()).length,lastError:runtime.lastError,engineUntouched:true,pass:Boolean(runtime.installed&&!runtime.lastError),checkedAt:new Date().toISOString()});
