const hud=document.getElementById("hud");
let lines=[];
export function log(m){lines.push(m);if(lines.length>14)lines.shift();hud.textContent=lines.join("\n")}
export function setTop(m){lines[0]=m;hud.textContent=lines.join("\n")}
