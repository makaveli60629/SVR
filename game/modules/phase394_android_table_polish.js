/* PHASE-394-ANDROID-TABLE-PRESENTATION-POLISH-LOCK */
const BUILD='PHASE-394-ANDROID-TABLE-PRESENTATION-POLISH-LOCK';
const state={build:BUILD,installed:false,lastBurnCount:0,burnAnimations:0,featuredSponsorConfigured:false,potBelowLogo:false,communityCardsEnlarged:false,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
function configureSponsor(){
  const config=window.SVR_ANDROID_FEATURED_SPONSOR||{name:'REIKI',eyebrow:'FEATURED SPONSOR',logo:'/logo.png',href:''};
  const zone=$('#featuredSponsor');if(!zone)return false;
  const image=zone.querySelector('img'),eyebrow=zone.querySelector('small'),name=zone.querySelector('strong');
  if(image)image.src=config.logo||'/logo.png';if(eyebrow)eyebrow.textContent=config.eyebrow||'FEATURED SPONSOR';if(name)name.textContent=config.name||'SPONSOR';
  if(config.href){zone.dataset.clickable='true';zone.onclick=()=>window.open(config.href,'_blank','noopener')}else{zone.dataset.clickable='false';zone.onclick=null}
  state.featuredSponsorConfigured=true;return true;
}
function animateBurn(count){
  const deck=$('#deckCard'),slot=$('#burnSlot'),card=$('#burnCard'),label=$('#burnCount');if(!deck||!slot||!card)return;
  const a=deck.getBoundingClientRect(),b=slot.getBoundingClientRect();const ghost=deck.cloneNode(true);ghost.removeAttribute('id');ghost.classList.add('phase394-burn-ghost');
  Object.assign(ghost.style,{position:'fixed',left:`${a.left}px`,top:`${a.top}px`,width:`${a.width}px`,height:`${a.height}px`,zIndex:'9999',pointerEvents:'none',transformOrigin:'50% 50%',margin:'0'});document.body.appendChild(ghost);
  ghost.animate([
    {left:`${a.left}px`,top:`${a.top}px`,transform:'rotateY(0deg) rotateZ(0deg) scale(1)',opacity:1},
    {left:`${(a.left+b.left)/2}px`,top:`${Math.min(a.top,b.top)-18}px`,transform:'rotateY(90deg) rotateZ(-8deg) scale(1.08)',opacity:1,offset:.48},
    {left:`${b.left+(b.width-a.width)/2}px`,top:`${b.top+(b.height-a.height)/2}px`,transform:'rotateY(180deg) rotateZ(-2deg) scale(.96)',opacity:.98}
  ],{duration:520,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}).finished.finally(()=>ghost.remove());
  card.classList.remove('burn-flip');void card.offsetWidth;card.classList.add('burn-flip');if(label)label.textContent=`BURN ${count}`;state.burnAnimations++;
}
function sync(){
  try{
    const game=window.SVR_PHASE393_ANDROID_STATE;if(!game)return false;
    const count=Array.isArray(game.burns)?game.burns.length:0;
    if(count>state.lastBurnCount){for(let i=state.lastBurnCount+1;i<=count;i++)setTimeout(()=>animateBurn(i),(i-state.lastBurnCount-1)*120);state.lastBurnCount=count}
    if(count===0&&state.lastBurnCount!==0){state.lastBurnCount=0;const label=$('#burnCount');if(label)label.textContent='BURN 0'}
    state.potBelowLogo=Boolean($('#potTarget')&&$('#featuredSponsor'));
    state.communityCardsEnlarged=Boolean($('#community'));
    state.installed=Boolean(configureSponsor()&&$('#burnSlot')&&$('#burnCard')&&state.potBelowLogo&&state.communityCardsEnlarged);
    state.checkedAt=new Date().toISOString();window.SVR_PHASE394_ANDROID_POLISH_STATE={...state};return state.installed;
  }catch(error){state.lastError=String(error?.message||error);return false}
}
function qa(){return{...state,burnZone:Boolean($('#burnSlot')),featuredSponsor:Boolean($('#featuredSponsor')),potTop:getComputedStyle($('#potTarget')).top,logoTop:getComputedStyle($('.table-logo')).top,communityCardCount:document.querySelectorAll('#community .card').length,pass:Boolean(state.installed&&!state.lastError),checkedAt:new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{configureSponsor();setInterval(sync,120)},{once:true});else{configureSponsor();setInterval(sync,120)}
window.SVR_PHASE394_ANDROID_POLISH_QA=qa;
