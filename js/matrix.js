(function(){
  const c = document.getElementById('matrixBg') || document.getElementById('matrix');
  if(!c) return;
  const ctx = c.getContext('2d', { alpha: true });
  const PURPLE = '#df6bff';
  const CYAN = '#6fe0ff';

  let w=0,h=0,cols=0,font=16,drops=[],speed=[];
  const chars = '01SVRPOKERアイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function resize(){
    const dpr = Math.min(window.devicePixelRatio||1, 2);
    w = Math.floor(window.innerWidth * dpr);
    h = Math.floor(window.innerHeight * dpr);
    c.width = w; c.height = h;
    c.style.width = window.innerWidth + 'px';
    c.style.height = window.innerHeight + 'px';
    font = Math.max(13, Math.floor(15 * dpr));
    cols = Math.max(1, Math.floor(w / font));
    drops = new Array(cols).fill(0).map(()=> Math.random() * h / font);
    speed = new Array(cols).fill(0).map(()=> 0.75 + Math.random()*0.55);
  }
  window.addEventListener('resize', resize);
  resize();

  function step(){
    ctx.fillStyle = 'rgba(2,0,8,0.085)';
    ctx.fillRect(0,0,w,h);
    ctx.font = font + 'px monospace';

    for(let i=0;i<cols;i++){
      const ch = chars[(Math.random()*chars.length)|0];
      const x = i * font;
      const y = drops[i] * font;
      const head = Math.random() > 0.82;
      const color = head ? CYAN : PURPLE;

      ctx.shadowBlur = head ? 18 : 12;
      ctx.shadowColor = color;
      ctx.fillStyle = head ? 'rgba(111,224,255,0.95)' : 'rgba(223,107,255,0.88)';
      ctx.fillText(ch, x, y);

      ctx.shadowBlur = 0;
      ctx.fillStyle = head ? 'rgba(111,224,255,0.18)' : 'rgba(223,107,255,0.16)';
      ctx.fillText(ch, x + 1, y + 1);

      drops[i] += speed[i];
      if(y > h && Math.random() > 0.965) drops[i] = -Math.random() * 20;
    }
    requestAnimationFrame(step);
  }

  ctx.fillStyle = 'rgba(0,0,0,1)';
  ctx.fillRect(0,0,w,h);
  requestAnimationFrame(step);
})();
