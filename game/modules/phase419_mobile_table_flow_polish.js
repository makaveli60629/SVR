/* PHASE-419-MOBILE-TABLE-FLOW-POLISH-LOCK */
const BUILD='PHASE-419-MOBILE-TABLE-FLOW-POLISH-LOCK';
const state={build:BUILD,installed:false,railMoved:false,oldTableOverlapRemoved:false,lastError:null,checkedAt:null};
const $=s=>document.querySelector(s);
function install(){
  const rail=$('#phase403FlowRail'),raise=$('#raisePanel');
  if(!rail||!raise)return false;
  let host=$('#phase419TableFlowHost');
  if(!host){
    host=document.createElement('section');host.id='phase419TableFlowHost';host.setAttribute('aria-label','Table betting flow');
    host.innerHTML='<div class="phase419-flow-title"><span>TABLE FLOW</span><strong>LEFT → RIGHT</strong></div><div class="phase419-flow-copy"></div>';
    const quick=$('#phase418QuickControls'),decision=$('#phase404DecisionStrip'),raiseHead=raise.querySelector('.raise-head');
    if(quick)quick.insertAdjacentElement('afterend',host);else if(decision)decision.insertAdjacentElement('afterend',host);else if(raiseHead)raiseHead.insertAdjacentElement('beforebegin',host);else raise.prepend(host);
  }
  const copy=host.querySelector('.phase419-flow-copy');if(copy&&rail.parentElement!==copy)copy.appendChild(rail);
  rail.classList.remove('phase418-flow-docked');rail.classList.add('phase419-flow-compact');
  const legacyLabel=rail.querySelector('.phase403-flow-label');if(legacyLabel)legacyLabel.textContent='ACTION';
  state.railMoved=rail.closest('#phase419TableFlowHost')===host;
  state.oldTableOverlapRemoved=!rail.closest('.table-wrap')&&!rail.closest('.table-surface')&&!rail.closest('.players');
  state.installed=Boolean(state.railMoved&&state.oldTableOverlapRemoved);
  state.checkedAt=new Date().toISOString();return state.installed;
}
function poll(){try{install();state.lastError=null}catch(error){state.lastError=String(error?.message||error);state.checkedAt=new Date().toISOString()}}
function qa(){poll();const rail=$('#phase403FlowRail'),host=$('#phase419TableFlowHost');return{...state,hostParent:host?.parentElement?.id||host?.parentElement?.className||null,railParent:rail?.parentElement?.className||rail?.parentElement?.id||null,insideTable:Boolean(rail?.closest('.table-wrap,.table-surface,.players')),pokerStateMutated:false,pass:Boolean(state.installed&&!state.lastError&&state.railMoved&&state.oldTableOverlapRemoved),checkedAt:new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{poll();setInterval(poll,220)},{once:true});else{poll();setInterval(poll,220)}
window.SVR_PHASE419_MOBILE_TABLE_FLOW_QA=qa;
