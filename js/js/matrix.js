
const canvas=document.getElementById("matrix");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

const letters="SVRPOKER01♠♣♥♦".split("");
const font=14;
const columns=canvas.width/font;
const drops=[];

for(let x=0;x<columns;x++)drops[x]=1;

function draw(){
ctx.fillStyle="rgba(0,0,0,0.05)";
ctx.fillRect(0,0,canvas.width,canvas.height);

ctx.fillStyle="#b26cff";
ctx.font=font+"px monospace";

for(let i=0;i<drops.length;i++){
const text=letters[Math.floor(Math.random()*letters.length)];
ctx.fillText(text,i*font,drops[i]*font);

if(drops[i]*font>canvas.height && Math.random()>0.975)drops[i]=0;

drops[i]++;
}
}

setInterval(draw,33);
