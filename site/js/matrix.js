(function(){
  const canvas=document.getElementById("matrix"); if(!canvas) return;
  const ctx=canvas.getContext("2d");
  function resize(){canvas.width=innerWidth;canvas.height=innerHeight}
  resize(); addEventListener("resize",resize);
  const chars="SVRPOKER0123456789#$%&"; const size=16;
  let cols=Math.floor(innerWidth/size), drops=Array(cols).fill(1);
  addEventListener("resize",()=>{cols=Math.floor(innerWidth/size);drops=Array(cols).fill(1)});
  function draw(){
    ctx.fillStyle="rgba(0,0,0,.12)"; ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font=size+"px monospace";
    for(let i=0;i<drops.length;i++){
      const ch=chars[(Math.random()*chars.length)|0];
      ctx.fillStyle=Math.random()>.88?"#d6b9ff":"#8a3dff";
      ctx.fillText(ch,i*size,drops[i]*size);
      if(drops[i]*size>canvas.height&&Math.random()>.975)drops[i]=0;
      drops[i]++;
    }
    requestAnimationFrame(draw);
  }
  draw();
})();
