/* PHASE-406-MOBILE-ULTIMATE-GAMEPLAY-POLISH-LOCK | Phase 408 inline burn compatible */
const BUILD='PHASE-406-MOBILE-ULTIMATE-GAMEPLAY-POLISH-LOCK';
const ARCHIVE='svr405_tournament_archive',RESULTS='svr401_reiki_first50_results',PAYOUT_LEDGER='svr406_play_chip_payouts';
const PAYOUTS=Object.freeze({1:100000,2:50000,3:25000});
const QUICK_RULES=[
  ['11. Board Can Play','Your best five may use all five community cards. A hole card does not have to play.'],
  ['12. Tie / Kicker Rule','Compare the exact best five cards. A card outside the best five does not break a tie.']
];
const FACE_COLORS={Claudia:['#7b284b','#ff9bc2'],Eric:['#184a6a','#6bd7ff'],Maya:['#5d2f88','#d2a0ff'],Darius:['#6b3d12','#ffd26a'],Nova:['#174f3d','#8dffb4']};
const state={build:BUILD,installed:false,burnMoved:false,handHelper:false,board:false,payout:null,faces:0,mic:false,lastWinHand:0,lastError:null};
const $=s=>document.querySelector(s),money=n=>`$${Math.max(0,Math.round(Number(n||0))).toLocaleString()}`,game=()=>window.SVR_PHASE393_ANDROID_STATE;
function parse(key,fallback){try{return JSON.parse(localStorage.getItem(key)||JSON.stringify(fallback))}catch{return fallback}}
function write(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true}catch{return false}}
function toast(text){const el=$('#tableMessage');if(!el)return;const old=el.textContent;el.textContent=text;setTimeout(()=>{if(el.textContent===text)el.textContent=old},2400)}
function relocateBurn(){
  const burns=[...document.querySelectorAll('.burn-zone')],table=$('.table-surface');if(!table||!burns.length)return false;
  const keep=burns.find(x=>x.id==='burnZone')||burns[0];burns.forEach(x=>{if(x!==keep)x.remove()});keep.id='burnZone';keep.classList.add('phase406-side-burn');
  if(window.SVR_PHASE408_HOLDEM_TRUTH){const row=$('.board-row'),community=$('#community');if(row&&community){keep.classList.add('phase408-inline-burn');if(keep.parentElement!==row||keep.nextElementSibling!==community)row.insertBefore(keep,community);state.burnMoved=document.querySelectorAll('.burn-zone').length===1&&keep.parentElement===row&&keep.nextElementSibling===community;return state.burnMoved}}
  if(keep.parentElement!==table)table.appendChild(keep);state.burnMoved=document.querySelectorAll('.burn-zone').length===1&&keep.parentElement===table;return state.burnMoved;
}
function enhanceHands(){
  const sheet=$('#phase405HandsSheet'),button=$('#phase405HandsButton');if(!sheet)return false;
  const head=sheet.querySelector('.phase405-sheet-head h2');if(head)head.textContent='Poker Hand Helper • 10 Ranks + 2 Quick Rules';
  const grid=sheet.querySelector('.phase405-hands');if(!grid)return false;
  if(!sheet.querySelector('.phase406-helper-intro'))grid.insertAdjacentHTML('beforebegin','<p class="phase406-helper-intro"><strong>Quick check:</strong> Texas Hold’em has 10 ranked hand categories. The final two cards below are rule reminders, not extra hand ranks. Use HIDE whenever you are done.</p>');
  QUICK_RULES.forEach(([name,desc],index)=>{if(grid.querySelector(`[data-phase406-rule="${index}"]`))return;grid.insertAdjacentHTML('beforeend',`<article class="phase405-hand phase406-extra-hand" data-phase406-rule="${index}"><strong>${name}</strong><span>${desc}</span></article>`)});
  if(button)button.textContent='HAND GUIDE';state.handHelper=grid.querySelectorAll('.phase405-hand').length===12;return state.handHelper;
}
function enhanceProfiles(){
  let count=0;document.querySelectorAll('.player-box').forEach(box=>{const name=box.querySelector('.player-meta strong')?.textContent?.trim()||'',face=box.querySelector('.face');if(!face)return;const colors=FACE_COLORS[name]||['#253b58','#7f43b7'];face.classList.add('phase406-face');face.style.background=`linear-gradient(135deg,${colors[0]},${colors[1]})`;face.title=`Tap for ${name||'player'} profile`;face.setAttribute('aria-label',`Open ${name||'player'} profile`);count++});
  const sheet=$('#phase405ProfileSheet'),data=sheet?.querySelector('.phase405-profile-data');if(data&&!sheet.querySelector('.phase406-profile-edit'))data.insertAdjacentHTML('beforeend','<a class="phase406-profile-edit" href="/site/profile.html?v=phase406&deploy=phase406">EDIT PHOTO / PROFILE</a>');state.faces=count;return count>0;
}
function resultTime(row){const value=row?.completedAt||row?.startedAt||0;const t=Date.parse(value);return Number.isFinite(t)?t:0}
function currentPlayerResult(){const r=parse(RESULTS,null);if(!r?.completedAt)return null;return{slotId:`played-${r.completedAt}`,source:'local-play',name:r.name||'REIKI FIRST 50',completedAt:r.completedAt,champion:r.champion?.name||r.champion||'Winner',prizePlayChips:Number(r.prizePlayChips||100000),userPlace:r.placements?.find(x=>x.isUser)?.place||null,raw:r}}
function rollingResults(){
  try{window.SVR_PHASE405_TOURNAMENT_SCHEDULE?.()}catch{}
  const cutoff=Date.now()-24*60*60*1000,rows=parse(ARCHIVE,[]).filter(Boolean).map(row=>({...row,prizePlayChips:Number(row.prizePlayChips||100000)}));
  const current=currentPlayerResult();if(current)rows.push(current);
  const seen=new Set();return rows.filter(row=>resultTime(row)>=cutoff).sort((a,b)=>resultTime(b)-resultTime(a)).filter(row=>{const key=`${row.slotId||''}|${row.completedAt||''}|${row.champion||''}`;if(seen.has(key))return false;seen.add(key);return true}).slice(0,12)
}
function payoutLedger(){return parse(PAYOUT_LEDGER,[])}
function maybeAwardPlayChips(){
  const current=currentPlayerResult(),r=current?.raw,user=r?.placements?.find(x=>x.isUser),place=Number(user?.place||0);if(!r||!place||!PAYOUTS[place])return null;
  const reward=PAYOUTS[place],id=`${r.completedAt}|${user.name||'YOU'}|${place}`,ledger=payoutLedger();if(ledger.some(x=>x.id===id)){state.payout=ledger.find(x=>x.id===id);return state.payout}
  let added=reward;if(place===1&&r.prizeAwarded)added=0;
  if(added>0){const base=Math.max(0,Number(localStorage.getItem('svr393stack')||15000));localStorage.setItem('svr393stack',String(base+added))}
  const entry={id,completedAt:r.completedAt,place,rewardPlayChips:reward,addedNow:added,playMoneyOnly:true,noCashValue:true,source:'phase406-local-tournament-test'};ledger.push(entry);write(PAYOUT_LEDGER,ledger.slice(-60));state.payout=entry;
  if(added>0)toast(`TOURNAMENT PAYOUT • ${money(added)} PLAY CHIPS • NO CASH VALUE`);return entry
}
function boardMarkup(){
  const rows=rollingResults();if(!rows.length)return'<div class="phase406-empty">No tournament result has completed in the last 24 hours on this device yet.</div>';
  return `<div class="phase406-24h-grid">${rows.map(row=>{const source=row.source==='local-play'?'PLAYED':'BOT TEST',when=new Date(resultTime(row)).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}),prize=Number(row.prizePlayChips||100000);return`<article class="phase406-result-row"><small>${when}<br>${source}</small><div><strong>${row.champion||'Winner'}</strong><span>${row.name||'REIKI FIVE-HOUR TEST'}</span></div><span class="phase406-prize">${prize.toLocaleString()}<br>PLAY CHIPS</span></article>`}).join('')}</div>`
}
function renderBoard(){const host=$('#phase406BoardHost');if(host)host.innerHTML=boardMarkup();const payout=$('#phase406PayoutNote'),entry=maybeAwardPlayChips();if(payout)payout.textContent=entry?`Your saved placement payout: #${entry.place} • ${money(entry.rewardPlayChips)} play chips${entry.addedNow?' added to regular play stack':''} • NO CASH VALUE.`:'Prototype payout tiers: 1st 100,000 • 2nd 50,000 • 3rd 25,000 play chips • NO CASH VALUE.'}
function ensureBoard(){
  if(!$('#phase406TournamentBoard'))document.body.insertAdjacentHTML('beforeend','<section id="phase406TournamentBoard" class="phase405-sheet hide"><div class="phase405-sheet-head"><h2>Last 24 Hours • Tournament Winners</h2><button data-close406board>HIDE</button></div><div id="phase406BoardHost"></div><p id="phase406PayoutNote" class="phase406-payout-note"></p><p class="phase405-note">This board is local to this browser/device until the secure multiplayer tournament backend is live. Bot-test rows are clearly labeled.</p></section>');
  document.querySelectorAll('[data-close406board]').forEach(b=>b.onclick=()=>$('#phase406TournamentBoard')?.classList.add('hide'));
  const footer=$('.footer');if(footer&&!$('#phase406BoardButton')){const b=document.createElement('button');b.id='phase406BoardButton';b.type='button';b.className='phase405-footer-button';b.textContent='24H BOARD';b.onclick=()=>{renderBoard();$('#phase406TournamentBoard')?.classList.remove('hide')};footer.appendChild(b)}
  renderBoard();state.board=Boolean($('#phase406BoardButton')&&$('#phase406TournamentBoard'));return state.board
}
function ensureMic(){
  const footer=$('.footer');if(!footer)return false;if(!$('#phase406QuickMic')){const b=document.createElement('button');b.id='phase406QuickMic';b.type='button';b.className='phase405-footer-button phase406-quick-mic';b.onclick=()=>{const current=localStorage.getItem('svr405_voice_mode')||'ptt',target=current==='vox'?'mute':'vox';$('#phase405VoiceButton')?.click();document.querySelector(`[data-voice405="${target}"]`)?.click();setTimeout(()=>$('#phase405VoiceSheet')?.classList.add('hide'),120);toast(target==='vox'?(window.SVR_PHASE399_MATCH_STATE?.voiceConnected?'MIC / VOX ON':'MIC READY • NO LIVE PEER YET'):'MIC MUTED')};footer.appendChild(b)}
  const b=$('#phase406QuickMic'),mode=localStorage.getItem('svr405_voice_mode')||'ptt';if(b){b.textContent=mode==='vox'?'MIC • VOX':'MIC';b.classList.toggle('active',mode==='vox')}state.mic=Boolean(b);return state.mic
}
function deviceChip(){const gate=$('#gateStatus');if(!gate||$('#phase406DeviceChip'))return;gate.insertAdjacentHTML('beforebegin','<div id="phase406DeviceChip" class="phase406-device-chip">PHONE / TABLET GAME • NOT VR • PLAY-MONEY TEST</div>')}
function winPulse(){const g=game();if(!g?.handOver||g.hand===state.lastWinHand)return;const won=(g.lastPotBreakdown||[]).some(p=>p.type==='pot'&&(p.winnerIndexes||[]).includes(0))||g.lastWinner===0;if(!won)return;state.lastWinHand=g.hand;const table=$('.table-surface');table?.classList.remove('phase406-win-pulse');void table?.offsetWidth;table?.classList.add('phase406-win-pulse');setTimeout(()=>table?.classList.remove('phase406-win-pulse'),1450)}
function poll(){try{relocateBurn();enhanceHands();enhanceProfiles();ensureBoard();ensureMic();deviceChip();winPulse();state.installed=Boolean(state.burnMoved&&state.handHelper&&state.board&&state.mic);state.lastError=null}catch(e){state.lastError=String(e?.message||e)}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,450)},{once:true});else{poll();setInterval(poll,450)}
window.SVR_PHASE406_OPEN_24H_BOARD=()=>{renderBoard();$('#phase406TournamentBoard')?.classList.remove('hide')};
window.SVR_PHASE406_MOBILE_QA=()=>({build:BUILD,installed:state.installed,oneBurnPile:document.querySelectorAll('.burn-zone').length===1,burnParent:$('#burnZone')?.parentElement?.className||null,burnMoved:state.burnMoved,phase408InlineBurnCompatible:true,handHelperCards:document.querySelectorAll('#phase405HandsSheet .phase405-hand').length,handHelper:state.handHelper,board:state.board,last24Hours:rollingResults().length,payout:state.payout||maybeAwardPlayChips(),profileFaces:state.faces,profileEdit:Boolean($('.phase406-profile-edit')),quickMic:state.mic,voiceMode:localStorage.getItem('svr405_voice_mode')||'ptt',livePeer:Boolean(window.SVR_PHASE399_MATCH_STATE?.voiceConnected),playMoneyOnly:true,noCashValue:true,lastError:state.lastError,pass:Boolean(state.installed&&!state.lastError),checkedAt:new Date().toISOString()});
