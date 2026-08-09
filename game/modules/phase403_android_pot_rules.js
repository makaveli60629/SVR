/* PHASE-403-ANDROID-SIDE-POT-RULES-LOCK */
export const POT_RULES_BUILD='PHASE-403-ANDROID-SIDE-POT-RULES-LOCK';

const cleanAmount=value=>Math.max(0,Math.round(Number(value||0)));

export function buildSidePots(contributions,totalPot=null){
  const rows=(contributions||[]).map(row=>({
    index:Number(row.index),
    amount:cleanAmount(row.amount),
    folded:Boolean(row.folded)
  })).filter(row=>Number.isInteger(row.index));
  const levels=[...new Set(rows.map(row=>row.amount).filter(Boolean))].sort((a,b)=>a-b);
  const pots=[];
  let previous=0;
  for(const cap of levels){
    const participants=rows.filter(row=>row.amount>=cap);
    const amount=(cap-previous)*participants.length;
    if(amount>0){
      const eligible=participants.filter(row=>!row.folded).map(row=>row.index);
      pots.push({
        cap,
        amount,
        participantIndexes:participants.map(row=>row.index),
        eligibleIndexes:eligible,
        type:eligible.length?'pot':'refund'
      });
    }
    previous=cap;
  }
  const tracked=pots.reduce((sum,pot)=>sum+pot.amount,0);
  const requested=totalPot==null?tracked:cleanAmount(totalPot);
  const delta=requested-tracked;
  if(delta>0){
    if(pots.length){pots[0].amount+=delta;pots[0].untrackedRemainder=(pots[0].untrackedRemainder||0)+delta}
    else{
      const eligible=rows.filter(row=>!row.folded).map(row=>row.index);
      pots.push({cap:0,amount:delta,participantIndexes:rows.map(row=>row.index),eligibleIndexes:eligible,type:eligible.length?'pot':'refund',untrackedRemainder:delta});
    }
  }
  return{
    pots:pots.map((pot,index)=>({...pot,label:index===0?'MAIN POT':`SIDE POT ${index}`})),
    tracked,
    requested,
    delta,
    balanced:delta===0
  };
}

export function orderedWinnersLeftOfDealer(winnerIndexes,dealer,seatOrder){
  const order=Array.isArray(seatOrder)&&seatOrder.length?seatOrder:[0,1,2,3,4,5];
  const winners=new Set((winnerIndexes||[]).map(Number));
  const pos=order.indexOf(Number(dealer));
  const rotated=pos<0?[...order]:Array.from({length:order.length},(_,step)=>order[(pos+step+1)%order.length]);
  return rotated.filter(index=>winners.has(index));
}

export function splitPotAmount(amount,winnerIndexes,dealer,seatOrder){
  const total=cleanAmount(amount),ordered=orderedWinnersLeftOfDealer(winnerIndexes,dealer,seatOrder);
  if(!ordered.length)return{share:0,remainder:total,payouts:{},orderedWinners:[]};
  const share=Math.floor(total/ordered.length),remainder=total-share*ordered.length,payouts={};
  ordered.forEach(index=>{payouts[index]=share});
  for(let chip=0;chip<remainder;chip++){
    const index=ordered[chip%ordered.length];payouts[index]=(payouts[index]||0)+1;
  }
  return{share,remainder,payouts,orderedWinners:ordered};
}

export function sumPotAmounts(pots){return(pots||[]).reduce((sum,pot)=>sum+cleanAmount(pot.amount),0)}
