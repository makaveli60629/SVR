const HAND_NAMES=['High Card','Pair','Two Pair','Trips','Straight','Flush','Full House','Quads','Straight Flush'];
function combinations(a,k){const out=[];function r(s,p){if(p.length===k){out.push(p.slice());return}for(let i=s;i<a.length;i++){p.push(a[i]);r(i+1,p);p.pop()}}r(0,[]);return out}
export function compareScores(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0}
export function score5(cards){
 const v=cards.map(c=>c.v).sort((a,b)=>b-a),counts=new Map();for(const x of v)counts.set(x,(counts.get(x)||0)+1);
 const u=[...new Set(v)].sort((a,b)=>b-a);if(u.includes(14))u.push(1);let sh=0;for(let i=0;i<=u.length-5;i++){const w=u.slice(i,i+5);if(w[0]-w[4]===4){sh=w[0];break}}
 const flush=cards.every(c=>c.s===cards[0].s),g=[...counts.entries()].map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count||b.value-a.value);
 if(sh&&flush)return[8,sh];if(g[0].count===4)return[7,g[0].value,...g.filter(x=>x.count===1).map(x=>x.value)];if(g[0].count===3&&g[1]?.count===2)return[6,g[0].value,g[1].value];if(flush)return[5,...v];if(sh)return[4,sh];if(g[0].count===3)return[3,g[0].value,...g.filter(x=>x.count===1).map(x=>x.value).sort((a,b)=>b-a)];
 if(g[0].count===2&&g[1]?.count===2){const p=g.filter(x=>x.count===2).map(x=>x.value).sort((a,b)=>b-a),k=g.filter(x=>x.count===1).map(x=>x.value).sort((a,b)=>b-a)[0]||0;return[2,p[0],p[1],k]}
 if(g[0].count===2)return[1,g[0].value,...g.filter(x=>x.count===1).map(x=>x.value).sort((a,b)=>b-a)];return[0,...v]
}
export function best7(cards){let best=null;for(const c of combinations(cards,5)){const s=score5(c);if(!best||compareScores(s,best)>0)best=s}return best||[0]}
export function handName(score){return HAND_NAMES[score?.[0]||0]}
export function buildSidePots(players){
 const levels=[...new Set(players.map(p=>p.contributed).filter(v=>v>0))].sort((a,b)=>a-b),pots=[];let prev=0;
 for(const level of levels){const contributors=players.filter(p=>p.contributed>=level),amount=(level-prev)*contributors.length,eligible=contributors.filter(p=>!p.folded&&p.hand?.length===2).map(p=>p.id);if(amount>0)pots.push({amount,cap:level,eligible,winners:[]});prev=level}
 return pots
}
export function settlePots(players,community,dealer){
 const scores=new Map(players.filter(p=>!p.folded&&p.hand?.length===2).map(p=>[p.id,best7([...p.hand,...community])]));
 const pots=buildSidePots(players),payouts=new Map();
 for(const pot of pots){let best=null,w=[];for(const id of pot.eligible){const s=scores.get(id);if(!best||compareScores(s,best)>0){best=s;w=[id]}else if(compareScores(s,best)===0)w.push(id)}if(!w.length)continue;
  const share=Math.floor(pot.amount/w.length);let rem=pot.amount-share*w.length;w.sort((a,b)=>((a-dealer+players.length)%players.length)-((b-dealer+players.length)%players.length));for(const id of w){const award=share+(rem-->0?1:0);payouts.set(id,(payouts.get(id)||0)+award)}pot.winners=w.slice();pot.hand=handName(best)
 }
 return{pots,payouts,scores}
}
