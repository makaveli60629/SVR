/* PHASE-397-ANDROID-ACTION-BUTTON-GUARD-LOCK | PHASE-398-ANDROID-RAISE-CONTROL-GUARD-LOCK */
import {CHIP_STEP,callAmount,legalRaiseWindow,roundToChip} from './phase398_android_raise_rules.js?v=phase398';
const BUILD='PHASE-398-ANDROID-RAISE-CONTROL-GUARD-LOCK';
const $=s=>document.querySelector(s);
const money=n=>`$${Math.max(0,Math.round(n||0)).toLocaleString()}`;
const state={build:BUILD,installed:false,checkCallCorrect:false,raiseGuardCorrect:false,sliderCorrect:false,raiseToLabelCorrect:false,lastError:null,checkedAt:null};
function sync(){
  try{
    const game=window.SVR_PHASE393_ANDROID_STATE,user=game?.players?.[0];
    if(!game||!user)return false;
    const fold=$('[data-a="fold"]'),call=$('[data-a="call"]'),raise=$('[data-a="raise"]'),allin=$('[data-a="allin"]'),slider=$('#raiseSlider'),amount=$('#raiseAmount'),panel=$('#raisePanel');
    if(!fold||!call||!raise||!allin||!slider||!amount)return false;
    const canAct=game.activePlayer===0&&!game.handOver&&!user.folded&&!user.allIn&&user.stack>0;
    const need=Math.max(0,game.currentBet-(user.streetBet||0));
    const exactCall=callAmount(game.currentBet,user.streetBet,user.stack);
    const window=legalRaiseWindow({currentBet:game.currentBet,lastFullRaiseSize:game.lastFullRaiseSize||100,streetBet:user.streetBet,stack:user.stack,raiseLocked:user.raiseLocked});
    const canRaise=canAct&&window.canRaise;
    let target=roundToChip(Number(game.raiseTarget||window.min));
    target=Math.max(window.min,Math.min(window.max,target));
    game.raiseTarget=target;
    slider.min=String(window.min);slider.max=String(Math.max(window.min,window.max));slider.step=String(CHIP_STEP);slider.value=String(target);slider.disabled=!canRaise;
    panel?.classList.toggle('disabled',!canRaise);
    amount.textContent=`TO ${money(target)}`;
    call.textContent=need?(exactCall<need?`ALL-IN CALL ${money(exactCall)}`:`CALL ${money(exactCall)}`):'CHECK';
    raise.textContent=game.currentBet===0?`BET ${money(target)}`:`RAISE TO ${money(target)}`;
    fold.disabled=!canAct;call.disabled=!canAct;raise.disabled=!canRaise;allin.disabled=!canAct;
    fold.classList.toggle('valid',canAct);call.classList.toggle('valid',canAct);raise.classList.toggle('valid',canRaise);allin.classList.toggle('valid',canAct);
    if(user.raiseLocked&&canAct)raise.title='A short all-in did not reopen raising. CALL or FOLD.';
    else if(!canRaise&&canAct)raise.title=`A full raise requires at least ${money(window.min)} total. ALL IN remains separate.`;
    else raise.removeAttribute('title');
    state.checkCallCorrect=call.textContent===(need?(exactCall<need?`ALL-IN CALL ${money(exactCall)}`:`CALL ${money(exactCall)}`):'CHECK');
    state.raiseGuardCorrect=raise.disabled===!canRaise;
    state.sliderCorrect=Number(slider.min)===window.min&&Number(slider.step)===CHIP_STEP&&Number(slider.value)===target;
    state.raiseToLabelCorrect=game.currentBet===0?raise.textContent.startsWith('BET '):raise.textContent.startsWith('RAISE TO ');
    state.installed=true;state.checkedAt=new Date().toISOString();window.SVR_PHASE398_ANDROID_ACTION_STATE={...state};return true;
  }catch(error){state.lastError=String(error?.message||error);return false}
}
function qa(){sync();return{...state,pass:Boolean(state.installed&&state.checkCallCorrect&&state.raiseGuardCorrect&&state.sliderCorrect&&state.raiseToLabelCorrect&&!state.lastError),checkedAt:new Date().toISOString()}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setInterval(sync,80),{once:true});else setInterval(sync,80);
window.SVR_PHASE397_ANDROID_ACTION_QA=qa;window.SVR_PHASE398_ANDROID_ACTION_QA=qa;