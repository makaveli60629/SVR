/* PHASE-431-MOBILE-PLAY-FIT-AUTHORITY-LOCK */
const BUILD='PHASE-431-MOBILE-PLAY-FIT-AUTHORITY-LOCK';
const state={build:BUILD,installed:false,viewportHeight:0,viewportWidth:0,portrait:false,tablePage:false,chooserPage:false,chooserDirectLinks:0,footerNormalized:false,secondaryFooterLinks:0,resizeEvents:0,pokerStateMutated:false,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);

function viewport(){
  const vv=window.visualViewport;
  const h=Math.max(320,Math.round(vv?.height||window.innerHeight||document.documentElement.clientHeight||720));
  const w=Math.max(280,Math.round(vv?.width||window.innerWidth||document.documentElement.clientWidth||360));
  document.documentElement.style.setProperty('--svr431-vh',`${h}px`);
  document.documentElement.style.setProperty('--svr431-vw',`${w}px`);
  state.viewportHeight=h;state.viewportWidth=w;state.portrait=h>=w;state.resizeEvents++;
  document.body?.classList.toggle('phase431-portrait',state.portrait);
  document.body?.classList.toggle('phase431-landscape',!state.portrait);
  return {h,w};
}

function directMobileUrl(source){
  try{
    const u=new URL(source,location.href),mode=['practice','regular','tournament'].includes(String(u.searchParams.get('mode')||'').toLowerCase())?String(u.searchParams.get('mode')).toLowerCase():'regular';
    const direct=new URL('/game/android-stable-phase405.html',location.origin);direct.searchParams.set('v','phase431');direct.searchParams.set('mode',mode);direct.searchParams.set('direct','1');
    const tournament=u.searchParams.get('tournament'),slot=u.searchParams.get('slot');if(tournament)direct.searchParams.set('tournament',tournament);if(slot)direct.searchParams.set('slot',slot);
    return `${direct.pathname}${direct.search}`;
  }catch{return source}
}

function normalizeChooser(){
  if(!state.chooserPage)return false;
  let changed=0;
  document.querySelectorAll('a[href*="android-tabletop.html"]').forEach(link=>{const next=directMobileUrl(link.getAttribute('href')||link.href);if(next&&next!==link.getAttribute('href')){link.setAttribute('href',next);changed++}});
  document.querySelectorAll('a[href*="android-stable-phase405.html"]').forEach(link=>{try{const u=new URL(link.getAttribute('href')||link.href,location.href);u.searchParams.set('v','phase431');u.searchParams.set('direct','1');link.setAttribute('href',`${u.pathname}${u.search}`)}catch{}});
  state.chooserDirectLinks=Math.max(state.chooserDirectLinks,changed);return true;
}

function normalizeFooter(){
  const footer=$('.footer');if(!footer)return false;
  let secondary=0;
  footer.querySelectorAll('a').forEach(link=>{
    const href=String(link.getAttribute('href')||'');
    const primary=/\/site\/profile\.html|\/game\/tournaments\.html/.test(href);
    link.classList.toggle('phase431-primary-footer-link',primary);
    if(!primary){link.classList.add('phase431-secondary-footer-link');secondary++}
  });
  const leave=$('#leave');if(leave)leave.classList.add('phase431-primary-footer-link');
  const sound=$('#soundToggle');if(sound)sound.classList.add('phase431-primary-footer-link');
  state.secondaryFooterLinks=secondary;state.footerNormalized=true;return true;
}

function markPage(){
  const path=location.pathname;
  state.tablePage=/android-stable-phase405\.html$/i.test(path)||Boolean($('#table'));
  state.chooserPage=/\/(?:android|iphone)\.html$/i.test(path)&&Boolean(document.querySelector('body > .card,body > main.card'));
  document.body?.classList.add('phase431-play-fit');
  if(state.tablePage)document.body?.classList.add('phase431-table-page');
  if(state.chooserPage)document.body?.classList.add('phase431-chooser-page');
}

function normalizeTable(){
  if(!state.tablePage)return;
  const table=$('#table');
  if(table&&!table.classList.contains('hide'))table.setAttribute('data-phase431-visible','true');
  const quick=$('#phase418QuickControls');if(quick)quick.setAttribute('aria-label','Microphone and account shortcuts');
  const rail=$('#phase419TableFlowHost');if(rail)rail.setAttribute('data-phase431-flow','compact');
  const board=$('.board-zone');if(board)board.setAttribute('data-phase431-board','protected');
  normalizeFooter();
}

function sweep(){
  try{
    markPage();viewport();normalizeChooser();normalizeTable();
    state.installed=true;state.lastError=null;state.checkedAt=new Date().toISOString();
  }catch(error){state.lastError=String(error?.message||error);state.checkedAt=new Date().toISOString()}
  window.SVR_PHASE431_MOBILE_PLAY_STATE={...state};return window.SVR_PHASE431_MOBILE_PLAY_STATE;
}

let raf=0;
function schedule(){cancelAnimationFrame(raf);raf=requestAnimationFrame(sweep)}
function boot(){
  sweep();
  window.addEventListener('resize',schedule,{passive:true});
  window.addEventListener('orientationchange',()=>setTimeout(sweep,80),{passive:true});
  window.addEventListener('pageshow',()=>setTimeout(sweep,40),{passive:true});
  window.visualViewport?.addEventListener('resize',schedule,{passive:true});
  window.visualViewport?.addEventListener('scroll',schedule,{passive:true});
  if('ResizeObserver'in window){const ro=new ResizeObserver(schedule);ro.observe(document.documentElement);window.SVR_PHASE431_RESIZE_OBSERVER=ro}
  setTimeout(sweep,250);setTimeout(sweep,900);setTimeout(sweep,2200);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();

window.SVR_PHASE431_MOBILE_PLAY_QA=()=>{
  sweep();
  const seats=[...document.querySelectorAll('.player-box')];
  const rects=seats.map(seat=>{const r=seat.getBoundingClientRect();return{seat:seat.dataset.seat||seat.dataset.player||'',left:+r.left.toFixed(1),top:+r.top.toFixed(1),right:+r.right.toFixed(1),bottom:+r.bottom.toFixed(1),width:+r.width.toFixed(1),height:+r.height.toFixed(1)}});
  let overlaps=0;
  for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(Math.max(a.left,b.left)<Math.min(a.right,b.right)&&Math.max(a.top,b.top)<Math.min(a.bottom,b.bottom))overlaps++}
  return{...state,seatCount:seats.length,seatOverlaps:overlaps,oneBurnPile:document.querySelectorAll('.burn-zone').length===1,enginePresent:Boolean(window.SVR_PHASE403_ANDROID_ENGINE_QA),turnAuthorityPresent:Boolean(window.SVR_PHASE414_HUMAN_TURN_QA),safetyPresent:Boolean(window.SVR_PHASE404_MOBILE_SAFETY_QA),pass:Boolean(state.installed&&!state.lastError&&(!state.tablePage||(overlaps===0&&document.querySelectorAll('.burn-zone').length===1))),checkedAt:new Date().toISOString()};
};
