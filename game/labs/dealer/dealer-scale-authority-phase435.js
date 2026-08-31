const BUILD='DEALER-LAB-V2.4-QUEST-MANUAL-ERIC-SCALE-LOCK';
const APPROVED=Object.freeze({scale:0.0047,x:-0.10,z:0.71,floorY:0});
let enforcing=false;

function lab(){return window.SVR_DEALER_LAB||null}
function updateScaleControl(value){
  const input=document.getElementById('dealerScale');
  if(input){input.value=String(value);input.dispatchEvent(new Event('change',{bubbles:false}))}
  const label=document.querySelector('.val[data-for="dealerScale"]');
  if(label)label.textContent=Number(value).toFixed(4);
}
function enforce(reason='manual-scale-lock'){
  const runtime=lab(),dealer=runtime?.dealer;
  if(!dealer?.loaded||enforcing)return null;
  const current=Number(dealer.params?.scale||0);
  if(Math.abs(current-APPROVED.scale)<1e-7 && Math.abs(Number(dealer.params?.x)-APPROVED.x)<1e-7 && Math.abs(Number(dealer.params?.z)-APPROVED.z)<1e-7){
    updateScaleControl(APPROVED.scale);
    return {build:BUILD,reason,scale:current,unchanged:true};
  }
  enforcing=true;
  try{
    dealer.setParams({scale:APPROVED.scale,x:APPROVED.x,z:APPROVED.z});
    const grounded=dealer.groundToFloor?.(APPROVED.floorY)||null;
    updateScaleControl(APPROVED.scale);
    const result={build:BUILD,reason,scale:dealer.params.scale,x:dealer.params.x,z:dealer.params.z,grounded};
    window.SVR_DEALER_SCALE_AUTHORITY_LAST=result;
    return result;
  }finally{enforcing=false}
}
function attach(){
  const runtime=lab();
  if(!runtime?.dealer||!runtime?.renderer)return false;
  runtime.dealer.addEventListener('loaded',()=>setTimeout(()=>enforce('dealer-loaded'),0));
  runtime.dealer.addEventListener('groundchange',()=>{
    if(!enforcing&&Math.abs(Number(runtime.dealer.params?.scale||0)-APPROVED.scale)>1e-7)setTimeout(()=>enforce('blocked-auto-normalize'),0);
  });
  runtime.renderer.xr.addEventListener('sessionstart',()=>setTimeout(()=>enforce('xr-session-start'),0));
  setTimeout(()=>enforce('phase435-attach'),0);
  window.SVR_DEALER_SCALE_AUTHORITY=Object.freeze({BUILD,APPROVED,enforce});
  return true;
}
let attempts=0;
const timer=setInterval(()=>{
  attempts+=1;
  if(attach()||attempts>80)clearInterval(timer);
},100);
