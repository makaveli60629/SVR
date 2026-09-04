const CURRENT_WEB_CODE=10000;
const els={check:document.querySelector('#checkUpdate'),status:document.querySelector('#updateStatus'),result:document.querySelector('#updateResult'),list:document.querySelector('#tournamentList'),download:document.querySelector('#appDownload')};
const setResult=(message,kind='ok')=>{els.result.hidden=false;els.result.textContent=message;els.result.style.borderColor=kind==='warn'?'#ffd98a':'#8dffb4'};
const device=()=>/Android/i.test(navigator.userAgent)?'android':(/iPhone|iPad|iPod/i.test(navigator.userAgent)?'ios':'web');

async function refreshServiceWorker(){
  if(!('serviceWorker'in navigator))return false;
  const registration=await navigator.serviceWorker.getRegistration();
  if(!registration)return false;
  await registration.update();
  return Boolean(registration.waiting||registration.installing);
}

async function checkForUpdate({silent=false}={}){
  els.check.disabled=true;els.check.textContent='Checking…';
  try{
    const response=await fetch(`/update/app-v1-release.json?t=${Date.now()}`,{cache:'no-store'});
    if(!response.ok)throw new Error(`release check ${response.status}`);
    const release=await response.json(),webUpdate=Number(release.web.versionCode)>CURRENT_WEB_CODE;
    const swUpdate=await refreshServiceWorker().catch(()=>false);
    const platform=device(),native=release.platforms?.[platform];
    if(webUpdate||swUpdate){setResult(`Version ${release.productVersion} is ready. Finish your hand, then refresh to apply it.`,'warn');return release}
    if(platform==='android'&&native?.updateAvailable){setResult(`Android ${native.versionName} is available. Use Download the App when you are ready.`,'warn');return release}
    if(!silent)setResult(`You are current: SVR Poker ${release.productVersion}. Updates are checked safely and never interrupt a hand.`);
    localStorage.setItem('svr_last_update_check',new Date().toISOString());
    return release;
  }catch(error){if(!silent)setResult('The update service could not be reached. Your current game remains available.','warn');console.warn(error)}
  finally{els.check.disabled=false;els.check.textContent='Check for Update'}
}

async function loadTournaments(){
  try{const response=await fetch(`/game/data/tournaments-v1.json?t=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw new Error('schedule unavailable');const data=await response.json();els.list.replaceChildren(...data.tournaments.slice(0,3).map(item=>{const article=document.createElement('article');article.className='tournament';const copy=document.createElement('div');const name=document.createElement('strong');name.textContent=item.name;const meta=document.createElement('small');meta.textContent=`${item.scheduleLabel} • ${item.entryLabel}`;const note=document.createElement('span');note.textContent=item.description;copy.append(name,meta,note);const link=document.createElement('a');link.href=item.href;link.textContent=item.actionLabel;article.append(copy,link);return article}))}catch{els.list.innerHTML='<p class="status">Schedule is temporarily unavailable. The regular table is still open.</p>'}
}

els.check.addEventListener('click',()=>checkForUpdate());
els.download.addEventListener('click',()=>localStorage.setItem('svr_android_downloaded_version','2'));
if('serviceWorker'in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
loadTournaments();
setTimeout(()=>checkForUpdate({silent:true}),2500);
