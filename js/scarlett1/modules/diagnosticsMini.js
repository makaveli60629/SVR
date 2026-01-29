export function makeLogger(el){
  const start = performance.now();
  const lines = [];
  function log(msg){
    const t = ((performance.now()-start)/1000).toFixed(3);
    const line = `[${t}] ${msg}`;
    lines.push(line);
    if (el) el.textContent = lines.slice(-18).join('\n');
    console.log(line);
  }
  function report(){
    return lines.join('\n');
  }
  return { log, report };
}
