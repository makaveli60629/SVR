/* PHASE-389-ANDROID-RESPONSIVE-TABLE-LAYOUT-LOCK */
export const BUILD='PHASE-389-ANDROID-RESPONSIVE-TABLE-LAYOUT-LOCK';
const state={build:BUILD,installed:false,orientation:null,viewportHeight:0,updates:0,actionsVisible:false,tableVisible:false,lastError:null,checkedAt:null};
const root=document.documentElement;
const body=document.body;
function update(){
  try{
    const viewport=window.visualViewport;
    const width=Math.max(1,viewport?.width||window.innerWidth||screen.width||1);
    const height=Math.max(1,viewport?.height||window.innerHeight||screen.height||1);
    const landscape=width>height;
    root.style.setProperty('--svr389-vh',`${height*.01}px`);
    body.classList.toggle('svr389-landscape',landscape);
    body.classList.toggle('svr389-portrait',!landscape);
    body.dataset.androidLayout=landscape?'landscape':'portrait';
    const shell=document.querySelector('.shell');
    const table=document.querySelector('.table-surface');
    if(table&&!document.getElementById('phase389LayoutBadge')){
      const badge=document.createElement('div');
      badge.id='phase389LayoutBadge';
      badge.textContent='PHASE 389 RESPONSIVE TABLE';
      table.appendChild(badge);
    }
    const call=document.querySelector('[data-a="call"]');
    if(call)call.setAttribute('aria-label','Check or call the current bet');
    document.querySelectorAll('.actions button').forEach((button)=>button.setAttribute('aria-live','polite'));
    state.orientation=landscape?'landscape':'portrait';
    state.viewportHeight=height;
    state.actionsVisible=Boolean(document.querySelector('.actions'));
    state.tableVisible=Boolean(table);
    state.installed=Boolean(shell&&table&&state.actionsVisible);
    state.updates++;
    state.checkedAt=new Date().toISOString();
  }catch(error){state.lastError=String(error?.message||error);state.checkedAt=new Date().toISOString()}
}
const observer=new MutationObserver(()=>update());
observer.observe(body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.visualViewport?.addEventListener('resize',update,{passive:true});
window.visualViewport?.addEventListener('scroll',update,{passive:true});
window.addEventListener('resize',update,{passive:true});
window.addEventListener('orientationchange',()=>setTimeout(update,80),{passive:true});
window.addEventListener('beforeunload',()=>observer.disconnect(),{once:true});
update();
window.SVR_PHASE389_ANDROID_LAYOUT_STATE=state;
window.SVR_PHASE389_ANDROID_LAYOUT_QA=()=>({...state,pass:state.installed&&state.actionsVisible&&state.tableVisible,checkedAt:new Date().toISOString()});
