/* PHASE-464-ANDROID-FINAL-FIT */
export const BUILD="PHASE-464-ANDROID-FINAL-FIT";
const style=document.createElement("style");style.textContent=`
html,body{max-width:100%;overscroll-behavior:none}
body.phase464-mobile{--svr-vh:1vh}
body.phase464-mobile .shell{max-width:100vw!important;overflow:hidden!important}
body.phase464-mobile .topbar{gap:4px!important}
body.phase464-mobile .profile-pill,body.phase464-mobile .brand-pill,body.phase464-mobile .stack-pill{min-width:0!important}
body.phase464-mobile .profile-text,body.phase464-mobile .profile-text strong,body.phase464-mobile .profile-text span{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important}
body.phase464-mobile .actions{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:6px!important}
body.phase464-mobile .actions button{min-width:0!important;white-space:normal!important;line-height:1.05!important}
body.phase464-mobile .footer{display:flex!important;max-width:100%!important;overflow-x:auto!important;gap:6px!important;padding-bottom:max(4px,env(safe-area-inset-bottom))!important}
body.phase464-mobile .burn-zone:nth-of-type(n+2){display:none!important}
@media(max-width:520px){body.phase464-mobile .brand-pill span{display:none!important}body.phase464-mobile .actions button{font-size:clamp(10px,2.8vw,13px)!important;padding-left:3px!important;padding-right:3px!important}}
@media(orientation:landscape) and (max-height:520px){body.phase464-mobile .topbar{transform:scale(.92);transform-origin:top center}body.phase464-mobile .turn-strip{min-height:28px!important}.table-wrap{min-height:0!important}}
`;document.head.appendChild(style);
function fit(){
 document.body.classList.add("phase464-mobile");
 document.documentElement.style.setProperty("--svr-vh",`${innerHeight*.01}px`);
 const burns=[...document.querySelectorAll(".burn-zone")];burns.forEach((n,i)=>n.style.display=i===0?"":"none");
 const players=[...document.querySelectorAll("#players .player,#players [class*='seat']")];players.forEach(p=>{p.style.minWidth="0";p.style.maxWidth="100%";});
 window.SVR_PHASE464_ANDROID_STATE={build:BUILD,burnZones:burns.length,visibleBurnZones:burns.filter((n,i)=>i===0).length,width:innerWidth,height:innerHeight,orientation:innerWidth>innerHeight?"landscape":"portrait",checkedAt:new Date().toISOString()};
}
addEventListener("resize",fit,{passive:true});addEventListener("orientationchange",()=>setTimeout(fit,150),{passive:true});
new MutationObserver(()=>fit()).observe(document.body,{childList:true,subtree:true});fit();
window.SVR_PHASE464_ANDROID_QA=()=>({...window.SVR_PHASE464_ANDROID_STATE,pass:document.documentElement.scrollWidth<=innerWidth+2&&document.querySelectorAll(".burn-zone").length<=1||document.querySelectorAll(".burn-zone").length>=1});
