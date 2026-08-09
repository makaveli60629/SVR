/* PHASE-405-PLATFORM-DEVICE-ALIGNMENT-LOCK */
(()=>{
  const BUILD='PHASE-405-PLATFORM-DEVICE-ALIGNMENT-LOCK';
  const ua=navigator.userAgent||'';
  const uad=navigator.userAgentData||null;
  const platform=String(uad?.platform||navigator.platform||'').toLowerCase();
  const ipadDesktop=platform==='macintel'&&navigator.maxTouchPoints>1;
  const questUa=/Quest|Oculus|OculusBrowser|Meta Quest/i.test(ua);
  const android=/Android/i.test(ua)&&!questUa;
  const ios=/iPhone|iPad|iPod/i.test(ua)||ipadDesktop;
  const mobile=Boolean(uad?.mobile||android||ios||/Mobile/i.test(ua));
  const touch=(navigator.maxTouchPoints||0)>0||'ontouchstart'in window;
  const browser=/OculusBrowser/i.test(ua)?'oculus':/SamsungBrowser/i.test(ua)?'samsung':/EdgiOS|Edg\//i.test(ua)?'edge':/CriOS|Chrome\//i.test(ua)?'chrome':/FxiOS|Firefox\//i.test(ua)?'firefox':/Safari\//i.test(ua)&&/AppleWebKit/i.test(ua)?'safari':'other';
  const device=questUa?'quest':ios?'ios':android?'android':mobile?'mobile':'desktop';
  const state={build:BUILD,device,browser,quest:questUa,android,ios,mobile,touch,ipadDesktop,standalone:Boolean(navigator.standalone||matchMedia?.('(display-mode: standalone)')?.matches),vrCapable:false,orientation:null,viewport:null,screen:null,checkedAt:null};
  const root=document.documentElement;
  function viewport(){const vv=window.visualViewport,w=Math.max(1,Math.round(vv?.width||innerWidth||screen.width||1)),h=Math.max(1,Math.round(vv?.height||innerHeight||screen.height||1));state.viewport={width:w,height:h,scale:Number(vv?.scale||1),dpr:Number(devicePixelRatio||1)};state.screen={width:Number(screen.width||0),height:Number(screen.height||0),availWidth:Number(screen.availWidth||0),availHeight:Number(screen.availHeight||0)};state.orientation=w>=h?'landscape':'portrait';root.style.setProperty('--svr-viewport-width',`${w}px`);root.style.setProperty('--svr-viewport-height',`${h}px`);root.style.setProperty('--svr-vw-unit',`${w/100}px`);root.style.setProperty('--svr-vh-unit',`${h/100}px`);root.classList.toggle('svr-landscape',state.orientation==='landscape');root.classList.toggle('svr-portrait',state.orientation==='portrait')}
  function classes(){['quest','android','ios','mobile','desktop'].forEach(x=>root.classList.toggle(`svr-platform-${x}`,device===x||(x==='mobile'&&mobile)));['oculus','samsung','edge','chrome','firefox','safari','other'].forEach(x=>root.classList.toggle(`svr-browser-${x}`,browser===x));root.classList.toggle('svr-touch',touch);root.classList.toggle('svr-standalone',state.standalone);if(questUa)root.classList.add('quest-browser');root.dataset.svrPlatform=device;root.dataset.svrBrowser=browser}
  function publish(){viewport();classes();state.checkedAt=new Date().toISOString();window.SVR_PLATFORM_DEVICE={...state};window.dispatchEvent(new CustomEvent('svr:platform-device',{detail:{...state}}));return window.SVR_PLATFORM_DEVICE}
  async function detectVr(){try{state.vrCapable=Boolean(await navigator.xr?.isSessionSupported?.('immersive-vr'));root.classList.toggle('svr-vr-capable',state.vrCapable);publish()}catch{state.vrCapable=Boolean(questUa);root.classList.toggle('svr-vr-capable',state.vrCapable)}}
  function route(){if(state.quest)return'/game/quest.html?v=phase396';if(state.ios)return'/game/iphone.html?v=phase405';if(state.android)return'/game/android.html?channel=stable&v=phase405';return'/game/camera3-showcase.html?v=phase392'}
  const style=document.createElement('style');style.id='svr-platform-alignment-style';style.textContent='html{width:100%;max-width:100%;overflow-x:hidden}body{max-width:100%;overflow-x:hidden}img,video,canvas,iframe{max-width:100%}.svr-platform-quest body,.svr-browser-oculus body{-webkit-text-size-adjust:100%;text-size-adjust:100%}.svr-platform-quest .portal,.svr-platform-quest .card,.svr-browser-oculus .portal,.svr-browser-oculus .card{max-width:calc(100vw - 24px);margin-left:auto;margin-right:auto}.svr-platform-quest input,.svr-platform-quest button,.svr-platform-quest a{touch-action:manipulation}@supports(height:100dvh){body{min-height:min(100%,100dvh)}}';document.head?.appendChild(style);
  publish();detectVr();
  window.visualViewport?.addEventListener('resize',publish,{passive:true});window.visualViewport?.addEventListener('scroll',publish,{passive:true});window.addEventListener('resize',publish,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(publish,120),{passive:true});
  window.SVR_PLATFORM_DEVICE_QA=()=>({...publish(),route:route(),pass:Boolean(state.device&&state.browser&&state.viewport?.width&&state.viewport?.height)});window.SVR_PLATFORM_GAME_ROUTE=route;
})();