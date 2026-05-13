
(function(){
  const canvas = document.getElementById('matrix');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  const secretPhrases = ['I LOVE SHY','I LOVE SCARLETT'];
  let secretQueue = [];
  let frame = 0;
  function size(){ canvas.width = innerWidth; canvas.height = innerHeight; }
  size(); addEventListener('resize', size);
  const font = 15;
  let columns = Math.floor(canvas.width / font);
  let drops = Array.from({length: columns}, () => Math.floor(Math.random()*canvas.height/font));
  function refill(){
    columns = Math.floor(canvas.width / font);
    drops = Array.from({length: columns}, () => Math.floor(Math.random()*canvas.height/font));
  }
  addEventListener('resize', refill);
  function seedSecret(){
    const phrase = secretPhrases[Math.floor(Math.random()*secretPhrases.length)];
    secretQueue = phrase.split('').filter(ch => ch !== ' ');
  }
  function draw(){
    frame++;
    ctx.fillStyle = 'rgba(2,0,8,0.075)';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.font = font + 'px monospace';
    if(frame % 260 === 0) seedSecret();
    for(let i=0;i<drops.length;i++){
      let text = Math.random() > 0.5 ? '1' : '0';
      let secret = false;
      if(secretQueue.length && Math.random() > 0.985){ text = secretQueue.shift(); secret = true; }
      ctx.fillStyle = secret ? '#fff7ff' : (Math.random() > .965 ? '#55f7ff' : '#b56cff');
      ctx.shadowBlur = secret ? 18 : 8;
      ctx.shadowColor = secret ? '#ff4fd8' : '#9d4edd';
      ctx.fillText(text, i*font, drops[i]*font);
      if(drops[i]*font > canvas.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
    ctx.shadowBlur = 0;
    requestAnimationFrame(draw);
  }
  draw();
})();
