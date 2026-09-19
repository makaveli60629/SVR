/* PHASE-464-ANDROID-FINAL-FIT-GUARD */
export const BUILD="PHASE-464-ANDROID-FINAL-FIT-GUARD";
const css=`
html,body{overscroll-behavior:none}
.shell{padding-bottom:max(8px,env(safe-area-inset-bottom))}
.topbar{padding-left:max(6px,env(safe-area-inset-left));padding-right:max(6px,env(safe-area-inset-right))}
.players{min-width:0}.player,.seat,.player-box{min-width:0;overflow:hidden}
.player-name,.name,.stack{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.actions{padding-bottom:max(6px,env(safe-area-inset-bottom));gap:clamp(5px,1.4vw,10px)}
.actions button{min-width:0;font-size:clamp(11px,2.8vw,16px)}
@media(max-width:520px){.featured-sponsor{transform:scale(.82);transform-origin:center}.center-pot{transform:scale(.9)}}
@media(orientation:landscape) and (max-height:560px){.topbar{min-height:42px}.turn-strip{min-height:32px}.footer{gap:4px}.footer a,.footer button{font-size:9px;padding:5px 7px}.actions button{min-height:40px}}
`;
const style=document.createElement("style");style.dataset.svrBuild=BUILD;style.textContent=css;document.head.appendChild(style);
function qa(){const burn=document.querySelectorAll(".burn-zone").length;const buttons=document.querySelectorAll(".actions button[data-a]").length;const rect=document.documentElement.getBoundingClientRect();return{build:BUILD,burnZones:burn,actionButtons:buttons,viewportWidth:Math.round(rect.width),viewportHeight:Math.round(rect.height),pass:burn===1&&buttons===4,checkedAt:new Date().toISOString()};}
window.SVR_PHASE464_ANDROID_QA=qa;requestAnimationFrame(()=>document.body.dataset.phase464Android=qa().pass?"ready":"check");
