
const hud=document.getElementById("hud");
let lines=["Scarlett1 Spine booting…"];
export function log(m){
  lines.push(String(m));
  if(lines.length>16)lines.shift();
  hud.textContent=lines.join("\n");
}
export function setTop(m){
  lines[0]=String(m);
  hud.textContent=lines.join("\n");
}
export function showError(e){
  setTop("BOOT ERROR (check console)");
  log(e?.message||String(e));
  if(e?.stack) log(e.stack.split("\n").slice(0,6).join(" | "));
}
