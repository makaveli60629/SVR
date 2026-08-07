/* PHASE-399-ANDROID-BEST-FIVE-HAND-EVALUATOR-LOCK */
const cloneCard=c=>({r:c.r,s:c.s,v:c.v});
const straightHigh=values=>{const u=[...new Set(values)].sort((a,b)=>b-a);if(u.includes(14))u.push(1);for(let i=0;i<=u.length-5;i++)if(u[i]-u[i+4]===4)return u[i];return 0};
function scoreFive(cards){
  const values=cards.map(c=>c.v).sort((a,b)=>b-a),flush=cards.every(c=>c.s===cards[0].s),straight=straightHigh(values);
  const counts=new Map();cards.forEach(c=>counts.set(c.v,(counts.get(c.v)||0)+1));
  const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
  if(flush&&straight)return{score:[8,straight],name:straight===14?'Royal Flush':'Straight Flush'};
  if(groups[0]?.[1]===4){const q=groups[0][0],k=groups.find(x=>x[0]!==q)?.[0]||0;return{score:[7,q,k],name:'Four of a Kind'}}
  if(groups[0]?.[1]===3&&groups[1]?.[1]===2)return{score:[6,groups[0][0],groups[1][0]],name:'Full House'};
  if(flush)return{score:[5,...values],name:'Flush'};
  if(straight)return{score:[4,straight],name:'Straight'};
  if(groups[0]?.[1]===3){const t=groups[0][0],k=groups.filter(x=>x[0]!==t).map(x=>x[0]).sort((a,b)=>b-a);return{score:[3,t,...k],name:'Three of a Kind'}}
  const pairs=groups.filter(x=>x[1]===2).map(x=>x[0]).sort((a,b)=>b-a);
  if(pairs.length===2){const k=groups.find(x=>!pairs.includes(x[0]))?.[0]||0;return{score:[2,pairs[0],pairs[1],k],name:'Two Pair'}}
  if(pairs.length===1){const p=pairs[0],k=groups.filter(x=>x[0]!==p).map(x=>x[0]).sort((a,b)=>b-a);return{score:[1,p,...k],name:'Pair'}}
  return{score:[0,...values],name:'High Card'};
}
export function compareScore(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0}
function combinations(cards,count=5){
  const out=[];
  const walk=(start,pick)=>{if(pick.length===count){out.push(pick.slice());return}for(let i=start;i<=cards.length-(count-pick.length);i++){pick.push(cards[i]);walk(i+1,pick);pick.pop()}};
  walk(0,[]);return out;
}
export function evaluate(cards){
  const clean=(cards||[]).filter(Boolean);
  if(clean.length<5)return{score:[-1],name:'Incomplete Hand',bestFive:clean.map(cloneCard),usedKeys:clean.map(cardKey)};
  let best=null;
  for(const combo of combinations(clean,5)){
    const scored=scoreFive(combo);
    if(!best||compareScore(scored.score,best.score)>0)best={...scored,bestFive:combo.map(cloneCard)};
  }
  best.usedKeys=best.bestFive.map(cardKey);
  return best;
}
export function cardKey(card){return `${card?.r||''}${card?.s||''}`}
export function describePreflop(cards){
  const c=(cards||[]).filter(Boolean);if(c.length<2)return'Waiting for hole cards';
  const [a,b]=c,high=Math.max(a.v,b.v),low=Math.min(a.v,b.v),suited=a.s===b.s,pair=a.v===b.v,gap=Math.abs(a.v-b.v);
  if(pair)return`Pocket ${a.r}s`;
  if(high===14&&low>=10)return suited?'Suited Broadway':'Broadway cards';
  if(suited&&gap===1)return'Suited connectors';
  if(suited)return'Suited cards';
  if(gap===1)return'Connected cards';
  return`${a.r}${a.s} / ${b.r}${b.s}`;
}
