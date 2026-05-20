/* SVR Phase 87 — Hand Result Evaluator
   Deterministic standard-card evaluator scaffold. Designed to be replaced/extended
   without changing table UI contracts.
*/
(function(){
  'use strict';

  const RANK_VALUE = {
    '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'T':10,
    'J':11,'Q':12,'K':13,'A':14
  };

  function normalizeCard(card){
    if(!card) return null;
    if(typeof card === 'string'){
      const m = card.trim().match(/^(10|[2-9TJQKA])([SHDC♠♥♦♣])$/i);
      if(!m) return null;
      return { rank: m[1].toUpperCase(), suit: m[2].toUpperCase(), value: RANK_VALUE[m[1].toUpperCase()] };
    }
    const rank = String(card.rank || '').toUpperCase();
    return { ...card, rank, value: RANK_VALUE[rank] || Number(card.value) || 0 };
  }

  function counts(cards, key){
    const map = new Map();
    cards.forEach(c => map.set(c[key], (map.get(c[key]) || 0) + 1));
    return map;
  }

  function isStraight(values){
    const uniq = Array.from(new Set(values)).sort((a,b)=>b-a);
    if(uniq.includes(14)) uniq.push(1);
    for(let i=0;i<=uniq.length-5;i++){
      const slice = uniq.slice(i,i+5);
      if(slice[0]-slice[4] === 4) return slice[0];
    }
    return 0;
  }

  function evaluate(cardsInput){
    const cards = (cardsInput || []).map(normalizeCard).filter(Boolean);
    if(cards.length < 5){
      return { rank: 0, name: 'Incomplete Hand', high: 0, cards };
    }

    const values = cards.map(c=>c.value).filter(Boolean);
    const rankCounts = counts(cards, 'value');
    const suitCounts = counts(cards, 'suit');
    const flushSuit = Array.from(suitCounts.entries()).find(([,n]) => n >= 5)?.[0];
    const flushCards = flushSuit ? cards.filter(c=>c.suit===flushSuit) : [];
    const straightHigh = isStraight(values);
    const straightFlushHigh = flushSuit ? isStraight(flushCards.map(c=>c.value)) : 0;

    if(straightFlushHigh){
      return { rank: straightFlushHigh === 14 ? 10 : 9, name: straightFlushHigh === 14 ? 'Royal Flush' : 'Straight Flush', high: straightFlushHigh, cards };
    }

    const groups = Array.from(rankCounts.entries()).sort((a,b)=> b[1]-a[1] || b[0]-a[0]);
    const four = groups.find(([,n])=>n===4);
    if(four) return { rank: 8, name: 'Four of a Kind', high: four[0], cards };

    const trips = groups.filter(([,n])=>n===3);
    const pairs = groups.filter(([,n])=>n===2);
    if(trips.length && (pairs.length || trips.length > 1)){
      return { rank: 7, name: 'Full House', high: trips[0][0], cards };
    }

    if(flushSuit) return { rank: 6, name: 'Flush', high: Math.max(...flushCards.map(c=>c.value)), cards };
    if(straightHigh) return { rank: 5, name: 'Straight', high: straightHigh, cards };
    if(trips.length) return { rank: 4, name: 'Three of a Kind', high: trips[0][0], cards };
    if(pairs.length >= 2) return { rank: 3, name: 'Two Pair', high: pairs[0][0], cards };
    if(pairs.length === 1) return { rank: 2, name: 'Pair', high: pairs[0][0], cards };
    return { rank: 1, name: 'High Card', high: Math.max(...values), cards };
  }

  function compare(a,b){
    if(a.rank !== b.rank) return a.rank - b.rank;
    return (a.high || 0) - (b.high || 0);
  }

  function chooseWinner(entries){
    const evaluated = (entries || []).map(e => ({ ...e, result: evaluate([...(e.cards || []), ...(e.community || [])]) }));
    evaluated.sort((a,b)=>compare(b.result, a.result));
    const winner = evaluated[0] || null;
    window.dispatchEvent(new CustomEvent('svr:table:result:evaluated', { detail: { winner, evaluated }}));
    return { winner, evaluated };
  }

  window.SVRHandResultEvaluator = {
    evaluate,
    compare,
    chooseWinner,
    normalizeCard
  };
})();
