/* PHASE-397-ANDROID-ACTION-BUTTON-GUARD-LOCK */
const BUILD='PHASE-397-ANDROID-ACTION-BUTTON-GUARD-LOCK';
const MIN_RAISE=100;
const $=s=>document.querySelector(s);
const money=n=>`$${Math.max(0,Math.round(n||0)).toLocaleString()}`;
const state={build:BUILD,installed:false,checkCallCorrect:false,raiseGuardCorrect:false,lastError:null,checkedAt:null};
function sync(){
  try{
    const game=window.SVR_PHASE393_ANDROID_STATE,user=game?.players?.[0];
    if(!game||!user)return false;
    const fold=$('[data-a="fold"]'),call=$('[data-a="call"]'),raise=$('[data-a="raise"]'),allin=$('[data-a="allin"]');
    if(!fold||!call||!raise||!allin)return false;
    const canAct=game.activePlayer===0&&!game.handOver&&!user.folded&&!user.allIn&&user.stack>0;
    const need=Math.max(0,game.currentBet-(user.streetBet||0));
    const max=(user.streetBet||0)+user.stack;
    const canRaise=canAct&&max>=game.currentBet+MIN_RAISE;
    call.textContent=need?`CALL ${money(Math.min(need,user.stack))}`:'CHECK';
    fold.disabled=!canAct;call.disabled=!canAct;raise.disabled=!canRaise;allin.disabled=!canAct;
    fold.classList.toggle('valid',canAct);call.classList.toggle('valid',canAct);raise.classList.toggle('valid',canRaise);allin.classList.toggle('valid',canAct);
    if(!canRaise&&canAct)raise.title='A full minimum raise is not available. Use CALL/CHECK or ALL IN.';else raise.removeAttribute('title');
    state.checkCallCorrect=call.textContent===(need?`CALL ${money(Math.min(need,user.stack))}`:'CHECK');
    state.raiseGuardCorrect=raise.disabled===!canRaise;
    state.installed=true;state.checkedAt=new Date().toISOString();window.SVR_PHASE397_ANDROID_ACTION_STATE={...state};return true;
  }catch(error){state.lastError=String(error?.message||error);return false}
}
function qa(){sync();return{...state,pass:Boolean(state.installed&&state.checkCallCorrect&&state.raiseGuardCorrect&&!state.lastError),checkedAt:new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setInterval(sync,80),{once:true});else setInterval(sync,80);
window.SVR_PHASE397_ANDROID_ACTION_QA=qa;
