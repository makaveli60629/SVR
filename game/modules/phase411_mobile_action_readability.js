/* PHASE-411-MOBILE-ACTION-READABILITY-LOCK */
const BUILD='PHASE-411-MOBILE-ACTION-READABILITY-LOCK';
const TIERS={1:'AI 1',2:'AI 2',3:'AI 3',4:'AI 4',5:'AI 5'};
const runtime={build:BUILD,installed:false,lastTrailKey:'',lastWinnerKey:'',toasts:0,lastError:null};
const $=s=>document.querySelector(s),game=()=>window.SVR_PHASE393_ANDROID_STATE;
function kind(label=''){
  const x=String(label).toUpperCase();if(x.includes('FOLD'))return'fold';if(x.includes('ALL IN'))return'allin';if(x.includes('RAISE'))return'raise';if(x.includes('CALL'))return'call';if(x.includes('CHECK'))return'check';if(x.includes('BET'))return'bet';if(x.includes('WIN'))return'win';return'action'
}
function shortLabel(label=''){
  const x=String(label).replace(/AUTO-/gi,'').trim();
  const amount=(x.match(/\$[\d,]+/)||[])[0]||'';
  if(/ALL.?IN/i.test(x))return amount?`ALL IN ${amount}`:'ALL IN';
  if(/RAISE/i.test(x))return amount?`RAISE ${amount}`:'RAISE';
  if(/CALL/i.test(x))return amount?`CALL ${amount}`:'CALL';
  if(/CHECK/i.test(x))return'CHECK';if(/FOLD/i.test(x))return'FOLD';if(/BET/i.test(x))return amount?`BET ${amount}`:'BET';return x.slice(0,34)
}
function anchor(index){return index===0?$('.profile-pill'):$(`[data-player="${index}"]`)}
function ensureLayer(){
  let layer=$('#phase411ActionLayer');if(!layer){layer=document.createElement('div');layer.id='phase411ActionLayer';layer.className='phase411-action-layer';document.body.appendChild(layer)}
  let ticker=$('#phase411ActionTicker');if(!ticker){ticker=document.createElement('div');ticker.id='phase411ActionTicker';ticker.className='phase411-action-ticker';document.body.appendChild(ticker)}
  return{layer,ticker}
}
function show(index,name,label){
  const {layer,ticker}=ensureLayer(),a=anchor(index);if(!a)return;const r=a.getBoundingClientRect(),k=kind(label),text=shortLabel(label),toast=document.createElement('div');toast.className=`phase411-action-toast ${k}`;toast.innerHTML=`<strong>${text}</strong><span>${name}</span>`;layer.appendChild(toast);
  const w=Math.min(180,Math.max(112,r.width+22)),left=Math.max(6,Math.min(innerWidth-w-6,r.left+r.width/2-w/2)),above=r.top>86;
  toast.style.width=`${w}px`;toast.style.left=`${left}px`;toast.style.top=`${Math.max(8,above?r.top-58:r.bottom+7)}px`;
  ticker.className=`phase411-action-ticker show ${k}`;ticker.textContent=`${name} • ${text}`;runtime.toasts++;
  setTimeout(()=>toast.classList.add('out'),1250);setTimeout(()=>toast.remove(),1750);setTimeout(()=>ticker.classList.remove('show'),1450)
}
function decorateBoxes(){
  const g=game();if(!g?.players?.length)return;
  document.querySelectorAll('.player-box').forEach(box=>{const i=Number(box.dataset.player),p=g.players?.[i];if(!p)return;box.setAttribute('aria-label',`${p.name}, ${p.rank}, stack ${Math.round(p.stack||0)}, ${p.lastAction||'waiting'}`);let badge=box.querySelector('.phase411-ai-tier');if(!badge){badge=document.createElement('span');badge.className='phase411-ai-tier';box.appendChild(badge)}badge.textContent=TIERS[p.botLevel]||`AI ${i}`;const meta=box.querySelector('.player-meta strong');if(meta)meta.title=p.name});
}
function actionTrail(){
  const g=game(),trail=g?.actionTrail||[],x=trail[trail.length-1];if(!x)return;const key=`${x.hand}:${x.street}:${x.index}:${x.at}:${x.label}`;if(key===runtime.lastTrailKey)return;runtime.lastTrailKey=key;show(x.index,x.name||g.players?.[x.index]?.name||`Seat ${x.index}`,x.label)
}
function winner(){
  const g=game();if(!g?.handOver||g.lastWinner==null)return;const key=`${g.hand}:${g.lastWinner}`;if(key===runtime.lastWinnerKey)return;runtime.lastWinnerKey=key;const p=g.players?.[g.lastWinner];if(p)setTimeout(()=>show(g.lastWinner,p.name,'WINS POT'),280)
}
function poll(){try{ensureLayer();decorateBoxes();actionTrail();winner();runtime.installed=Boolean($('#phase411ActionLayer')&&$('#phase411ActionTicker'));runtime.lastError=null}catch(e){runtime.lastError=String(e?.message||e)}}
window.addEventListener('resize',decorateBoxes,{passive:true});window.visualViewport?.addEventListener('resize',decorateBoxes,{passive:true});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,90)},{once:true});else{poll();setInterval(poll,90)}
window.SVR_PHASE411_ACTION_QA=()=>({build:BUILD,installed:runtime.installed,toasts:runtime.toasts,playerBoxes:document.querySelectorAll('.player-box').length,aiBadges:document.querySelectorAll('.phase411-ai-tier').length,lastError:runtime.lastError,pass:Boolean(runtime.installed&&!runtime.lastError),checkedAt:new Date().toISOString()});
