/* PHASE-407-MOBILE-BOT-THINK-PACING-LOCK */
const BUILD='PHASE-407-MOBILE-BOT-THINK-PACING-LOCK';
const MIN_THINK_MS=2200,MAX_THINK_MS=4000;
const nativeSetTimeout=window.setTimeout.bind(window);
const state={build:BUILD,installed:false,botTimersAdjusted:0,lastOriginalDelay:0,lastAdjustedDelay:0};
if(!window.SVR_PHASE407_NATIVE_SET_TIMEOUT){
  window.SVR_PHASE407_NATIVE_SET_TIMEOUT=nativeSetTimeout;
  window.setTimeout=function(handler,delay,...args){
    let adjusted=Number(delay||0),source='';
    try{source=typeof handler==='function'?Function.prototype.toString.call(handler):String(handler||'')}catch{}
    if(adjusted>=780&&adjusted<=1900&&/botDecision\s*\(/.test(source)){
      const ratio=Math.max(0,Math.min(1,(adjusted-820)/980));
      const paced=Math.round(MIN_THINK_MS+ratio*(MAX_THINK_MS-MIN_THINK_MS));
      state.botTimersAdjusted+=1;state.lastOriginalDelay=adjusted;state.lastAdjustedDelay=paced;adjusted=paced;
      window.dispatchEvent(new CustomEvent('svr:bot-thinking',{detail:{delay:adjusted}}));
    }
    return nativeSetTimeout(handler,adjusted,...args);
  };
  state.installed=true;
}
window.SVR_PHASE407_BOT_PACING_QA=()=>({build:BUILD,minThinkMs:MIN_THINK_MS,maxThinkMs:MAX_THINK_MS,...state,pass:Boolean(window.SVR_PHASE407_NATIVE_SET_TIMEOUT),checkedAt:new Date().toISOString()});
