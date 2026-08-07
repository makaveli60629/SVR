(() => {
  const BUILD='PHASE-392-ANDROID-CONTINUOUS-PLAY-RANKING-LOCK';
  const SUITS=['S','H','D','C'], RANKS=['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const NAMES=['YOU','Claudia','Eric','Maya','Darius','Nova'];
  const FACES=['🧑','👩','🧔','👩🏽','👨🏾','👩🏻'];
  const $=s=>document.querySelector(s), all=s=>[...document.querySelectorAll(s)];
  const state={
    build:BUILD, joined:false, hand:0, dealer:-1, street:0, pot:0, deck:[], burns:[], community:[],
    players:[], currentBet:0, handOver:false, autoTimer:0, xp:Number(localStorage.getItem('svr392xp')||0),
    stack:Number(localStorage.getItem('svr392stack')||15000), release:null, lastWinner:null, checkedAt:null
  };
  const rankTiers=[
    {name:'ROOKIE I',min:0},{name:'ROOKIE II',min:250},{name:'BRONZE',min:600},
    {name:'SILVER',min:1200},{name:'GOLD',min:2200},{name:'PLATINUM',min:3600},
    {name:'DIAMOND',min:5500},{name:'SVR ELITE',min:8000}
  ];
  const nextThreshold=()=>rankTiers.find(t=>t.min>state.xp)?.min||Math.max(10000,state.xp+2000);
  const currentRank=()=>[...rankTiers].reverse().find(t=>state.xp>=t.min)||rankTiers[0];
  const money=n=>`$${Math.max(0,Math.round(n)).toLocaleString()}`;
  const symbol=s=>({S:'♠',H:'♥',D:'♦',C:'♣'}[s]);

  function profile(){
    try{
      const raw=JSON.parse(localStorage.getItem('svr_demo_account')||'{}');
      const name=raw?.profile?.displayName||raw?.displayName||'YOU';
      $('#userName').textContent=name;
      $('#userAvatar').textContent=(name.match(/\b\w/g)||['Y']).slice(0,2).join('').toUpperCase();
    }catch{}
  }
  function rankLabel(){
    const rank=currentRank(), next=nextThreshold(), base=rank.min, span=Math.max(1,next-base);
    $('#rankText').textContent=`${rank.name} • ${state.xp} XP`;
    $('#xpFill').style.width=`${Math.max(0,Math.min(100,(state.xp-base)/span*100))}%`;
  }
  function makeDeck(){return SUITS.flatMap((s)=>RANKS.map((r,i)=>({r,s,v:i+2})))}
  function shuffle(cards){for(let i=cards.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]]}return cards}
  function cardHtml(card,hidden=false,small=false){
    if(hidden)return `<span class="card back${small?' small':''}"><img src="/logo.png" alt="SVR"></span>`;
    const red=card.s==='H'||card.s==='D';
    return `<span class="card${red?' red':''}${small?' small':''}"><span class="rank">${card.r}</span><span class="suit">${symbol(card.s)}</span></span>`;
  }
  function renderCards(){
    $('#hole').innerHTML=state.players[0].cards.map(c=>cardHtml(c)).join('');
    $('#community').innerHTML=[0,1,2,3,4].map(i=>state.community[i]?cardHtml(state.community[i]):'<span class="card back" style="opacity:.25"><img src="/logo.png" alt=""></span>').join('');
  }
  function renderPlayers(){
    const host=$('#players'); host.textContent='';
    state.players.slice(1).forEach((p,i)=>{
      const box=document.createElement('article');
      box.className=`player-box${p.folded?' folded':''}${p.button?' button':''}${p.active?' active':''}${state.lastWinner===p.index?' winner':''}`;
      const visible=state.handOver&&!p.folded;
      box.dataset.player=String(p.index);
      box.innerHTML=`<div class="face">${FACES[p.index]}</div><div class="player-meta"><strong>${p.name}${p.button?' • D':''}</strong><span>${p.rank} • ${money(p.stack)}</span></div><div class="player-cards">${p.cards.map(c=>cardHtml(c,!visible,true)).join('')}</div>`;
      host.appendChild(box);
    });
  }
  function render(){
    $('#stack').textContent=`STACK ${money(state.players[0]?.stack??state.stack)}`;
    $('#pot').textContent=money(state.pot);
    $('#handCounter').textContent=`HAND ${state.hand}`;
    rankLabel(); renderCards(); renderPlayers();
    const call=Math.max(0,state.currentBet-(state.players[0]?.streetBet||0));
    const callButton=$('[data-a="call"]');
    callButton.textContent=call?`CALL ${money(call)}`:'CHECK';
    $('[data-a="raise"]').textContent=`RAISE ${money(Math.max(200,state.currentBet+200))}`;
    all('.actions button').forEach(b=>{b.disabled=state.handOver||state.players[0]?.folded||state.players[0]?.stack<=0;b.classList.toggle('valid',!b.disabled)});
  }
  function setStatus(text,win=false){$('#status').textContent=text;$('#status').classList.toggle('win',win)}
  function flyChips(fromEl,toEl,count=7){
    if(!fromEl||!toEl)return;
    const a=fromEl.getBoundingClientRect(),b=toEl.getBoundingClientRect();
    for(let i=0;i<count;i++){
      const chip=document.createElement('i');chip.className='chip-flight';
      chip.style.left=`${a.left+a.width/2+(Math.random()-.5)*18}px`;
      chip.style.top=`${a.top+a.height/2+(Math.random()-.5)*14}px`;
      chip.style.setProperty('--tx',`${b.left+b.width/2+(Math.random()-.5)*20}px`);
      chip.style.setProperty('--ty',`${b.top+b.height/2+(Math.random()-.5)*14}px`);
      chip.style.animationDelay=`${i*35}ms`;$('#chipLayer').appendChild(chip);setTimeout(()=>chip.remove(),1000);
    }
  }
  function confetti(){
    const colors=['#7ffcff','#ffd98a','#9b4dff','#8dffb4','#ff6289'];
    for(let i=0;i<42;i++){const p=document.createElement('i');p.className='confetti';p.style.left=`${50+(Math.random()-.5)*18}%`;p.style.top=`${42+(Math.random()-.5)*10}%`;p.style.setProperty('--c',colors[i%colors.length]);p.style.setProperty('--dx',`${(Math.random()-.5)*520}px`);p.style.setProperty('--dy',`${120+Math.random()*420}px`);p.style.animationDelay=`${Math.random()*180}ms`;$('#fxLayer').appendChild(p);setTimeout(()=>p.remove(),1800)}
  }
  function awardXp(amount,reason){
    state.xp+=amount;localStorage.setItem('svr392xp',String(state.xp));rankLabel();
    $('#winnerBanner').innerHTML+=`<div style="margin-top:5px;color:#ffd98a">+${amount} XP • ${reason}</div>`;
  }
  function post(player,amount){
    const pay=Math.max(0,Math.min(player.stack,amount));
    player.stack-=pay;player.streetBet=(player.streetBet||0)+pay;state.pot+=pay;
    if(player.index===0)state.stack=player.stack;
    return pay;
  }
  function burn(label){
    const c=state.deck.pop();if(c)state.burns.push(c);
    $('#burnLabel').textContent=`BURN ${state.burns.length} • ${label}`;
    $('#deckCard').animate([{transform:'translateX(0) rotate(0)'},{transform:'translateX(-24px) rotate(-12deg)'},{transform:'translateX(0) rotate(0)'}],{duration:420});
  }
  function reveal(count,label){
    burn(label);
    const cards=[];for(let i=0;i<count;i++){const c=state.deck.pop();if(c){state.community.push(c);cards.push(c)}}
    renderCards();
    $('#community').animate([{transform:'scale(.92)',opacity:.35},{transform:'scale(1)',opacity:1}],{duration:480});
  }
  function resetStreet(){state.currentBet=0;state.players.forEach(p=>p.streetBet=0)}
  function botRound(){
    state.players.slice(1).forEach(p=>{
      if(p.folded||p.stack<=0)return;
      const chance=Math.random();
      const need=Math.max(0,state.currentBet-p.streetBet);
      if(chance<.12&&state.street>0){p.folded=true;return}
      const extra=chance>.78?100:0;post(p,need+extra);state.currentBet=Math.max(state.currentBet,p.streetBet);
    });
  }
  function advanceStreet(){
    if(state.handOver)return;
    resetStreet();
    if(state.street===0){state.street=1;reveal(3,'FLOP');setStatus('FLOP • YOUR TURN')}
    else if(state.street===1){state.street=2;reveal(1,'TURN');setStatus('TURN • YOUR TURN')}
    else if(state.street===2){state.street=3;reveal(1,'RIVER');setStatus('RIVER • YOUR TURN')}
    else{showdown();return}
    botRound();render();
  }
  function action(type){
    if(state.handOver||state.players[0].folded)return;
    const p=state.players[0], box=$('.profile-pill');
    if(type==='fold'){p.folded=true;setStatus('YOU FOLDED');showdown();return}
    if(type==='call'){const need=Math.max(0,state.currentBet-p.streetBet);post(p,need);flyChips(box,$('#potTarget'));advanceStreet()}
    if(type==='raise'){const target=Math.max(state.currentBet+200,p.streetBet+200);post(p,target-p.streetBet);state.currentBet=p.streetBet;flyChips(box,$('#potTarget'),9);advanceStreet()}
    if(type==='allin'){post(p,p.stack);state.currentBet=Math.max(state.currentBet,p.streetBet);flyChips(box,$('#potTarget'),12);advanceStreet()}
    render();
  }
  function straightHigh(values){
    const unique=[...new Set(values)].sort((a,b)=>b-a);if(unique.includes(14))unique.push(1);
    for(let i=0;i<=unique.length-5;i++)if(unique[i]-unique[i+4]===4)return unique[i];
    return 0;
  }
  function evaluate(cards){
    const bySuit={};cards.forEach(c=>(bySuit[c.s]??=[]).push(c));
    const counts=new Map();cards.forEach(c=>counts.set(c.v,(counts.get(c.v)||0)+1));
    const groups=[...counts.entries()].sort((a,b)=>b[1]-a[1]||b[0]-a[0]);
    const flush=Object.values(bySuit).find(list=>list.length>=5);
    if(flush){const high=straightHigh(flush.map(c=>c.v));if(high)return {score:[8,high],name:high===14?'Royal Flush':'Straight Flush'}}
    if(groups[0]?.[1]===4){const quad=groups[0][0],kick=Math.max(...groups.filter(g=>g[0]!==quad).map(g=>g[0]));return{score:[7,quad,kick],name:'Four of a Kind'}}
    const trips=groups.filter(g=>g[1]>=3),pairs=groups.filter(g=>g[1]>=2);
    if(trips.length&&pairs.find(g=>g[0]!==trips[0][0]))return{score:[6,trips[0][0],pairs.find(g=>g[0]!==trips[0][0])[0]],name:'Full House'}
    if(flush){const vals=flush.map(c=>c.v).sort((a,b)=>b-a).slice(0,5);return{score:[5,...vals],name:'Flush'}}
    const straight=straightHigh(cards.map(c=>c.v));if(straight)return{score:[4,straight],name:'Straight'}
    if(trips.length){const t=trips[0][0],k=groups.filter(g=>g[0]!==t).map(g=>g[0]).sort((a,b)=>b-a).slice(0,2);return{score:[3,t,...k],name:'Three of a Kind'}}
    if(pairs.length>=2){const ps=pairs.slice(0,2).map(g=>g[0]).sort((a,b)=>b-a),k=groups.filter(g=>!ps.includes(g[0])).map(g=>g[0]).sort((a,b)=>b-a)[0];return{score:[2,...ps,k],name:'Two Pair'}}
    if(pairs.length){const p=pairs[0][0],k=groups.filter(g=>g[0]!==p).map(g=>g[0]).sort((a,b)=>b-a).slice(0,3);return{score:[1,p,...k],name:'Pair'}}
    return{score:[0,...groups.map(g=>g[0]).sort((a,b)=>b-a).slice(0,5)],name:'High Card'}
  }
  function compareScore(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const d=(a[i]||0)-(b[i]||0);if(d)return d}return 0}
  function showdown(){
    if(state.handOver)return;
    state.handOver=true;clearTimeout(state.autoTimer);
    while(state.community.length<5){if(state.community.length===0)reveal(3,'FLOP');else reveal(1,state.community.length===3?'TURN':'RIVER')}
    const contenders=state.players.filter(p=>!p.folded&&p.stack>=0);
    const results=contenders.map(p=>({p,hand:evaluate([...p.cards,...state.community])})).sort((a,b)=>compareScore(b.hand.score,a.hand.score));
    const best=results[0];const winners=results.filter(r=>compareScore(r.hand.score,best.hand.score)===0);
    const share=Math.floor(state.pot/winners.length);winners.forEach(w=>w.p.stack+=share);
    state.lastWinner=winners[0].p.index;state.players[0].stack=Math.max(0,state.players[0].stack);state.stack=state.players[0].stack;
    localStorage.setItem('svr392stack',String(state.stack));
    const names=winners.map(w=>w.p.name).join(' & ');
    $('#winnerBanner').innerHTML=`<div>${names} WIN ${money(share)}</div><div style="color:#8dffb4">${best.hand.name}</div>`;
    $('#winnerBanner').classList.remove('show');void $('#winnerBanner').offsetWidth;$('#winnerBanner').classList.add('show');
    confetti();render();
    const target=state.lastWinner===0?$('.profile-pill'):$(`[data-player="${state.lastWinner}"]`);
    flyChips($('#potTarget'),target,14);
    setStatus(`${names} WIN • ${best.hand.name}`,true);
    if(winners.some(w=>w.p.index===0))awardXp(120,'HAND WIN');else awardXp(20,'HAND COMPLETE');
    state.pot=0;render();
    if(state.players[0].stack<=0){setTimeout(()=>$('#outOverlay').classList.remove('hide'),1300);return}
    $('#next').classList.remove('hide');
    let seconds=4;
    const countdown=()=>{if(!state.handOver)return;setStatus(`NEXT HAND IN ${seconds} • ${names} WON`,true);if(seconds--<=0){startHand();return}state.autoTimer=setTimeout(countdown,1000)};
    state.autoTimer=setTimeout(countdown,1100);
  }
  function startHand(){
    clearTimeout(state.autoTimer);state.hand++;state.street=0;state.pot=0;state.community=[];state.burns=[];state.handOver=false;state.currentBet=100;state.lastWinner=null;
    state.dealer=(state.dealer+1)%6;state.deck=shuffle(makeDeck());
    state.players=NAMES.map((name,index)=>({index,name,rank:index===0?currentRank().name:['Bronze','Silver','Rookie II','Gold','Bronze'][index-1],stack:index===0?Math.max(0,state.stack):15000,cards:[state.deck.pop(),state.deck.pop()],folded:false,streetBet:0,button:index===state.dealer,active:false}));
    const sb=(state.dealer+1)%6,bb=(state.dealer+2)%6;post(state.players[sb],50);post(state.players[bb],100);state.currentBet=100;
    botRound();$('#burnLabel').textContent='DECK READY • PRE-FLOP';$('#next').classList.add('hide');setStatus('PRE-FLOP • YOUR TURN');render();
  }
  function leave(){
    clearTimeout(state.autoTimer);state.joined=false;$('#table').classList.add('hide');$('#gate').classList.remove('hide');$('#outOverlay').classList.add('hide');localStorage.setItem('svr392stack',String(Math.max(0,state.stack)));
  }
  function join(){
    state.joined=true;$('#gate').classList.add('hide');$('#table').classList.remove('hide');profile();rankLabel();startHand();
  }
  function sponsors(){
    const defaults=[{name:'SVR POKER',logo:'/logo.png'},{name:'SPONSOR OPEN',logo:'/logo.png'}];
    const list=Array.isArray(window.SVR_ANDROID_SPONSORS)&&window.SVR_ANDROID_SPONSORS.length?window.SVR_ANDROID_SPONSORS:defaults;
    let i=0;const renderSponsor=()=>{const left=list[i%list.length],right=list[(i+1)%list.length];[['#sponsorLeft',left],['#sponsorRight',right]].forEach(([sel,item])=>{const el=$(sel);el.querySelector('img').src=item.logo||'/logo.png';el.querySelector('span').textContent=item.name||'SPONSOR'});i++};
    renderSponsor();setInterval(renderSponsor,8000);
  }
  async function updates(){
    try{const r=await fetch(`/game/android-release.json?t=${Date.now()}`,{cache:'no-store'});state.release=await r.json();const seen=Number(localStorage.getItem('svr_apk_seen_version_code')||0);if(Number(state.release.apkVersionCode||0)>seen)$('#update').classList.add('update')}catch{}
  }
  function platform(){
    const ua=navigator.userAgent||'';const quest=/Quest|Oculus|Meta Quest/i.test(ua);const android=/Android/i.test(ua)&&!quest;
    if(quest){$('#platformBadge').textContent='QUEST DETECTED';$('#platformMessage').textContent='This page is the Android touch version. Use Quest / Enter VR for the spatial version.'}
    else if(!android){$('#platformBadge').textContent='MOBILE BROWSER PREVIEW';$('#platformMessage').textContent='This is the touch version. Android is recommended. Quest players should use Enter VR.'}
  }
  all('.actions button').forEach(b=>b.addEventListener('click',()=>action(b.dataset.a)));
  $('#join').addEventListener('click',join);$('#leave').addEventListener('click',leave);$('#outLeave').addEventListener('click',leave);$('#next').addEventListener('click',startHand);
  $('#restartChips').addEventListener('click',()=>{state.stack=15000;localStorage.setItem('svr392stack','15000');$('#outOverlay').classList.add('hide');startHand()});
  $('#update').addEventListener('click',()=>{const code=Number(state.release?.apkVersionCode||2);localStorage.setItem('svr_apk_seen_version_code',String(code));location.href=state.release?.apkUrl||'/downloads/svr-poker-android-rc2.apk'});
  addEventListener('beforeunload',()=>{localStorage.setItem('svr392stack',String(Math.max(0,state.stack)));localStorage.setItem('svr392xp',String(state.xp))});
  platform();profile();rankLabel();sponsors();updates();
  window.SVR_PHASE392_ANDROID_QA=()=>({build:BUILD,joined:state.joined,hand:state.hand,stack:state.stack,xp:state.xp,rank:currentRank().name,players:state.players.length,burns:state.burns.length,community:state.community.length,continuousPlay:true,leaveButton:Boolean($('#leave')),outOfChipsOverlay:Boolean($('#outOverlay')),sponsorZones:document.querySelectorAll('.sponsor-zone').length,actions:document.querySelectorAll('.actions button[data-a]').length,pass:Boolean($('#join')&&$('#leave')&&$('#potTarget')&&document.querySelectorAll('.actions button[data-a]').length===4),checkedAt:new Date().toISOString()});
})();