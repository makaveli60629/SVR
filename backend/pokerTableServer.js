/**
 * SVR Poker — PokerTableServer (CommonJS)
 * Server-side poker table with full Texas Hold'em logic.
 * Used by backend/server.js
 */

'use strict';

const SUITS    = ['♠', '♥', '♦', '♣'];
const RANKS    = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RANK_VAL = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };

const HAND_RANKS = {
  ROYAL_FLUSH:9, STRAIGHT_FLUSH:8, FOUR_OF_A_KIND:7, FULL_HOUSE:6,
  FLUSH:5, STRAIGHT:4, THREE_OF_A_KIND:3, TWO_PAIR:2, PAIR:1, HIGH_CARD:0,
};

function createDeck() {
  const deck = [];
  for (const suit of SUITS)
    for (const rank of RANKS)
      deck.push({ rank, suit, label: rank + suit });
  return deck;
}

function shuffleDeck(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function getCombinations(arr, k) {
  const result = [];
  function combo(start, cur) {
    if (cur.length === k) { result.push([...cur]); return; }
    for (let i = start; i < arr.length; i++) { cur.push(arr[i]); combo(i+1,cur); cur.pop(); }
  }
  combo(0, []);
  return result;
}

function evalFiveCards(cards) {
  const vals     = cards.map(c => RANK_VAL[c.rank]).sort((a,b)=>b-a);
  const suits    = cards.map(c => c.suit);
  const isFlush  = suits.every(s => s === suits[0]);
  const isStraight = (() => {
    const u = [...new Set(vals)].sort((a,b)=>b-a);
    if (u.length < 5) return false;
    if (u[0]===14&&u[1]===5&&u[2]===4&&u[3]===3&&u[4]===2) return true;
    return u[0]-u[4]===4;
  })();
  const counts   = {};
  for (const v of vals) counts[v] = (counts[v]||0)+1;
  const freq     = Object.values(counts).sort((a,b)=>b-a);
  let handRank, tiebreakers;

  if (isFlush&&isStraight&&vals[0]===14&&vals[1]===13)  { handRank=HAND_RANKS.ROYAL_FLUSH;    tiebreakers=[14]; }
  else if (isFlush&&isStraight)                          { handRank=HAND_RANKS.STRAIGHT_FLUSH; tiebreakers=[vals[0]]; }
  else if (freq[0]===4) {
    const quad=+Object.keys(counts).find(k=>counts[k]===4);
    const kick=+Object.keys(counts).find(k=>counts[k]===1);
    handRank=HAND_RANKS.FOUR_OF_A_KIND; tiebreakers=[quad,kick];
  } else if (freq[0]===3&&freq[1]===2) {
    const trip=+Object.keys(counts).find(k=>counts[k]===3);
    const pair=+Object.keys(counts).find(k=>counts[k]===2);
    handRank=HAND_RANKS.FULL_HOUSE; tiebreakers=[trip,pair];
  } else if (isFlush)  { handRank=HAND_RANKS.FLUSH;          tiebreakers=vals; }
  else if (isStraight) { handRank=HAND_RANKS.STRAIGHT;       tiebreakers=[vals[0]]; }
  else if (freq[0]===3) {
    const trip=+Object.keys(counts).find(k=>counts[k]===3);
    handRank=HAND_RANKS.THREE_OF_A_KIND; tiebreakers=[trip,...vals.filter(v=>v!==trip)];
  } else if (freq[0]===2&&freq[1]===2) {
    const pairs=Object.keys(counts).filter(k=>counts[k]===2).map(Number).sort((a,b)=>b-a);
    const kick=vals.find(v=>!pairs.includes(v));
    handRank=HAND_RANKS.TWO_PAIR; tiebreakers=[...pairs,kick];
  } else if (freq[0]===2) {
    const pair=+Object.keys(counts).find(k=>counts[k]===2);
    handRank=HAND_RANKS.PAIR; tiebreakers=[pair,...vals.filter(v=>v!==pair)];
  } else {
    handRank=HAND_RANKS.HIGH_CARD; tiebreakers=vals;
  }
  return { handRank, tiebreakers };
}

function bestHand(holeCards, communityCards) {
  const all   = [...holeCards, ...communityCards];
  const combos= getCombinations(all, 5);
  let best    = null;
  for (const five of combos) {
    const r = evalFiveCards(five);
    if (!best || compareHands(r, best) > 0) best = r;
  }
  return best;
}

function compareHands(a, b) {
  if (a.handRank !== b.handRank) return a.handRank - b.handRank;
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    const d = (a.tiebreakers[i]??0) - (b.tiebreakers[i]??0);
    if (d !== 0) return d;
  }
  return 0;
}

function handName(handRank) {
  return Object.keys(HAND_RANKS).find(k => HAND_RANKS[k] === handRank) || 'UNKNOWN';
}

const STAGES = ['WAITING','PRE_FLOP','FLOP','TURN','RIVER','SHOWDOWN'];

class PokerTableServer {
  constructor({ tableId='table1', maxSeats=6, smallBlind=10, bigBlind=20 }={}) {
    this.tableId    = tableId;
    this.maxSeats   = maxSeats;
    this.smallBlind = smallBlind;
    this.bigBlind   = bigBlind;
    this.players    = [];
    this.community  = [];
    this.deck       = [];
    this.pot        = 0;
    this.stage      = 'WAITING';
    this.dealerIdx  = 0;
    this.currentIdx = 0;
    this.currentBet = 0;
    this.winners    = [];
    this.log        = [];
    this.onEvent    = null;
  }

  addPlayer({ id, name, chips=1000 }) {
    if (this.players.length >= this.maxSeats) throw new Error('Table full');
    if (this.players.find(p=>p.id===id)) throw new Error('Already seated');
    this.players.push({ id, name, chips, hand:[], bet:0, folded:false, allIn:false, active:true });
    this._emit('playerJoined', { id, name, chips });
    if (this.players.length >= 2 && this.stage === 'WAITING') this.startRound();
    return this.toPublicState();
  }

  removePlayer(id) {
    this.players = this.players.filter(p => p.id !== id);
    this._emit('playerLeft', { id });
    return this.toPublicState();
  }

  startRound() {
    if (this.players.length < 2) return;
    this.deck      = shuffleDeck(createDeck());
    this.community = [];
    this.pot       = 0;
    this.currentBet= 0;
    this.winners   = [];
    this.stage     = 'PRE_FLOP';
    for (const p of this.players) {
      p.hand=[this.deck.pop(), this.deck.pop()];
      p.bet=0; p.folded=false; p.allIn=false; p.active=true;
    }
    this._postBlinds();
    this._emit('roundStarted', this.toPublicState());
    this._log(`Round started. Dealer: ${this._dealer().name}`);
  }

  _postBlinds() {
    const n  = this.players.length;
    const sb = this.players[(this.dealerIdx+1)%n];
    const bb = this.players[(this.dealerIdx+2)%n];
    this._forceBet(sb, this.smallBlind);
    this._forceBet(bb, this.bigBlind);
    this.currentBet  = this.bigBlind;
    this.currentIdx  = (this.dealerIdx+3)%n;
    this._log(`${sb.name} posts SB ${this.smallBlind} | ${bb.name} posts BB ${this.bigBlind}`);
  }

  _forceBet(player, amount) {
    const actual = Math.min(amount, player.chips);
    player.chips-=actual; player.bet+=actual; this.pot+=actual;
    if (player.chips===0) player.allIn=true;
  }

  action(playerId, type, amount=0) {
    const p = this._currentPlayer();
    if (!p||p.id!==playerId) return { error:'Not your turn' };
    if (p.folded||p.allIn) { this._advance(); return this.toPublicState(); }

    switch (type) {
      case 'fold':  p.folded=true; this._log(`${p.name} folds`); break;
      case 'check':
        if (p.bet<this.currentBet) return { error:'Cannot check' };
        this._log(`${p.name} checks`); break;
      case 'call': {
        const toCall=this.currentBet-p.bet;
        this._forceBet(p,toCall); this._log(`${p.name} calls ${toCall}`); break;
      }
      case 'raise': {
        const raiseAmt=Math.max(amount, this.currentBet+this.bigBlind);
        this._forceBet(p, raiseAmt-p.bet);
        this.currentBet=raiseAmt; this._log(`${p.name} raises to ${raiseAmt}`); break;
      }
      case 'allin':
        this._forceBet(p, p.chips);
        if (p.bet>this.currentBet) this.currentBet=p.bet;
        this._log(`${p.name} all-in`); break;
      default: return { error:`Unknown action: ${type}` };
    }
    this._advance();
    return this.toPublicState();
  }

  _advance() {
    const notFolded = this.players.filter(p=>!p.folded);
    if (notFolded.length===1) { this._awardPot(notFolded); return; }
    const active     = this.players.filter(p=>!p.folded&&!p.allIn);
    const bettingDone= active.length===0 || active.every(p=>p.bet===this.currentBet);
    if (bettingDone) { this._nextStage(); return; }
    do { this.currentIdx=(this.currentIdx+1)%this.players.length; }
    while (this.players[this.currentIdx].folded||this.players[this.currentIdx].allIn);
    this._emit('actionRequired', { playerId:this._currentPlayer().id });
  }

  _nextStage() {
    for (const p of this.players) p.bet=0;
    this.currentBet=0;
    this.currentIdx=(this.dealerIdx+1)%this.players.length;
    const stageIdx = STAGES.indexOf(this.stage);
    const next     = STAGES[stageIdx+1];
    if (next==='FLOP')                                   this.community.push(this.deck.pop(),this.deck.pop(),this.deck.pop());
    else if (next==='TURN'||next==='RIVER')              this.community.push(this.deck.pop());
    else if (next==='SHOWDOWN'||!next)                   { this._showdown(); return; }
    this.stage=next;
    this._log(`--- ${next} --- ${this.community.map(c=>c.label).join(' ')}`);
    this._emit('stageChanged',{stage:this.stage,community:this.community.map(c=>c.label)});
  }

  _showdown() {
    this.stage='SHOWDOWN';
    const notFolded=this.players.filter(p=>!p.folded);
    const results=notFolded.map(p=>({ player:p, best:bestHand(p.hand,this.community) }));
    results.sort((a,b)=>-compareHands(a.best,b.best));
    const topScore=results[0].best;
    const winners=results.filter(r=>compareHands(r.best,topScore)===0).map(r=>r.player);
    this._awardPot(winners);
  }

  _awardPot(winners) {
    const share=Math.floor(this.pot/winners.length);
    for (const w of winners) {
      w.chips+=share;
      this.winners.push({ id:w.id, name:w.name, chips:w.chips, won:share,
        hand:w.hand.map(c=>c.label),
        handName: w.hand.length>0&&this.community.length>0
          ? handName(bestHand(w.hand,this.community).handRank) : '' });
      this._log(`🏆 ${w.name} wins ${share} chips`);
    }
    this.pot=0; this.stage='WAITING';
    this.dealerIdx=(this.dealerIdx+1)%this.players.length;
    this._emit('roundOver',{ winners:this.winners, players:this.toPublicState().players });
    const canPlay=this.players.filter(p=>p.chips>0);
    if (canPlay.length>=2) setTimeout(()=>this.startRound(),3000);
  }

  _dealer()        { return this.players[this.dealerIdx]; }
  _currentPlayer() { return this.players[this.currentIdx]; }
  _log(msg)        { this.log.push(msg); if(this.log.length>100) this.log.shift(); console.log('[SVRPoker]',msg); }
  _emit(event,data){ if (typeof this.onEvent==='function') this.onEvent(event,data); }

  toPublicState(requestingPlayerId=null) {
    return {
      tableId:   this.tableId,
      stage:     this.stage,
      pot:       this.pot,
      currentBet:this.currentBet,
      community: this.community.map(c=>c.label),
      currentPlayerId: this._currentPlayer()?.id??null,
      winners:   this.winners,
      players:   this.players.map(p=>({
        id:p.id, name:p.name, chips:p.chips, bet:p.bet,
        folded:p.folded, allIn:p.allIn, active:p.active,
        hand: (p.id===requestingPlayerId||this.stage==='SHOWDOWN')
          ? p.hand.map(c=>c.label) : p.hand.map(()=>'🂠'),
      })),
    };
  }
}

module.exports = { PokerTableServer, handName, bestHand };
