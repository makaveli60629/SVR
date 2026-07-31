(() => {
  const CAMERA3 = '../game/camera3.html?v=phase339';
  function routeCamera3(){
    document.querySelectorAll('iframe[src*="cam=director"],iframe[src*="autocam=1"]').forEach((frame)=>{
      if(frame.dataset.svrCamera3Routed==='1') return;
      frame.dataset.svrCamera3Routed='1';
      frame.src=CAMERA3;
      frame.loading=frame.id==='svrLiveGameFrame'?'eager':'lazy';
      frame.setAttribute('allow','autoplay; fullscreen');
    });
    document.querySelectorAll('a[href*="cam=director"],a[href*="autocam=1"]').forEach((link)=>{link.href=CAMERA3;});
  }
  routeCamera3();
  new MutationObserver(routeCamera3).observe(document.documentElement,{subtree:true,childList:true});

  const canvas=document.getElementById('binary-rain');
  if(!canvas) return;
  const ctx=canvas.getContext('2d',{alpha:true});
  let width=0,height=0,dpr=1,size=12,drops=[],last=0;
  function resize(){dpr=Math.min(2,window.devicePixelRatio||1);width=innerWidth;height=innerHeight;canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';ctx.setTransform(dpr,0,0,dpr,0,0);size=Math.max(10,Math.min(13,Math.round(width/120)));drops=Array.from({length:Math.ceil(width/size)+2},()=>-Math.random()*height/size);ctx.font=`700 ${size}px Orbitron,monospace`;ctx.textBaseline='top'}
  function frame(ts){const dt=Math.min(.05,(ts-(last||ts))/1000);last=ts;ctx.fillStyle='rgba(0,0,0,.22)';ctx.fillRect(0,0,width,height);for(let i=0;i<drops.length;i++){drops[i]+=18*dt;const y=drops[i]*size;ctx.fillStyle='rgba(170,90,255,.38)';ctx.fillText(Math.random()<.5?'0':'1',i*size,y);if(y>height+size)drops[i]=-Math.random()*30}requestAnimationFrame(frame)}
  resize();addEventListener('resize',resize);requestAnimationFrame(frame);
  window.SVR_CAMERA3_SITE_ROUTE={build:'PHASE-339-CAMERA3-SITE-ROUTE',route:CAMERA3,active:true};
})();
