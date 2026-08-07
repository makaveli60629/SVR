/* PHASE-396-ANDROID-BURN-DEALER-POLISH-LOCK */
const BUILD='PHASE-396-ANDROID-BURN-DEALER-POLISH-LOCK';
const state={build:BUILD,installed:false,dealerButtonReady:false,dealerIndex:null,dealerName:null,dealerMoves:0,burnAboveCommunity:false,communityCardsEnlarged:false,lastError:null,checkedAt:null};
const $=selector=>document.querySelector(selector);
let lastDealer=null;
function ensureDealerUi(){
  const table=$('.table-surface');if(!table)return false;
  let button=$('#dealerButton');if(!button){button=document.createElement('div');button.id='dealerButton';button.className='dealer-button';button.textContent='D';button.setAttribute('aria-label','Dealer button');table.appendChild(button)}
  let readout=$('#dealerReadout');if(!readout){readout=document.createElement('div');readout.id='dealerReadout';readout.className='dealer-readout';readout.textContent='DEALER • WAITING';table.appendChild(readout)}
  state.dealerButtonReady=true;return true
}
function placeDealer(){
  const game=window.SVR_PHASE393_ANDROID_STATE,table=$('.table-surface'),button=$('#dealerButton'),readout=$('#dealerReadout');if(!game||!table||!button||!readout)return false;
  const dealer=Number(game.dealer);if(!Number.isFinite(dealer)||dealer<0)return false;const player=game.players?.[dealer];let target=dealer===0?$('#hole'):$(`[data-player="${dealer}"]`);if(!target)target=dealer===0?$('.hole-row'):null;if(!target)return false;
  document.querySelectorAll('.player-box[data-dealer]').forEach(el=>delete el.dataset.dealer);if(dealer>0){const box=$(`[data-player="${dealer}"]`);if(box)box.dataset.dealer='true'}
  const tr=table.getBoundingClientRect(),r=target.getBoundingClientRect();let x=r.left-tr.left+r.width*.5,y=r.top-tr.top-10;
  if(dealer===0){x=r.left-tr.left+Math.min(r.width*.12,48);y=r.top-tr.top-9}else{const side=x<tr.width*.5?-1:1;x+=side*Math.min(24,r.width*.12);y+=Math.min(10,r.height*.10)}
  x=Math.max(22,Math.min(tr.width-22,x));y=Math.max(25,Math.min(tr.height-34,y));button.style.left=`${x}px`;button.style.top=`${y}px`;button.dataset.dealerIndex=String(dealer);button.title=`Dealer: ${player?.name||`Seat ${dealer+1}`}`;readout.textContent=`DEALER • ${player?.name||`SEAT ${dealer+1}`}`;
  if(lastDealer!==dealer){lastDealer=dealer;state.dealerMoves++;button.animate?.([{transform:'translate(-50%,-50%) scale(.75)',opacity:.55},{transform:'translate(-50%,-50%) scale(1.18)',opacity:1},{transform:'translate(-50%,-50%) scale(1)',opacity:1}],{duration:420,easing:'ease-out'})}
  state.dealerIndex=dealer;state.dealerName=player?.name||null;return true
}
function inspectLayout(){
  const burn=$('#burnZone'),community=$('#community .card');if(burn){const style=getComputedStyle(burn),rect=burn.getBoundingClientRect(),board=$('#community')?.getBoundingClientRect();state.burnAboveCommunity=Boolean(board&&rect.bottom<=board.top+18&&style.top==='auto')}
  if(community)state.communityCardsEnlarged=community.getBoundingClientRect().width>=38;
}
function sync(){
  try{ensureDealerUi();placeDealer();inspectLayout();state.installed=Boolean(state.dealerButtonReady&&state.burnAboveCommunity);state.checkedAt=new Date().toISOString();window.SVR_PHASE396_ANDROID_STATE={...state};return state.installed}catch(error){state.lastError=String(error?.message||error);return false}
}
function qa(){sync();return{...state,dealerButton:Boolean($('#dealerButton')),dealerReadout:Boolean($('#dealerReadout')),burnZone:Boolean($('#burnZone')),communityCards:document.querySelectorAll('#community .card').length,pass:Boolean(state.installed&&state.dealerButtonReady&&state.burnAboveCommunity&&!state.lastError),checkedAt:new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setInterval(sync,120),{once:true});else setInterval(sync,120);
window.SVR_PHASE396_ANDROID_QA=qa;
