const CURRENT_WEB_CODE=Number(document.body.dataset.appVersionCode||0);
const KEYS={lastCheck:'svr_last_update_check',dismissed:'svr_dismissed_update_code',android:'svr_android_downloaded_version'};
const els={check:document.querySelector('#checkUpdate'),status:document.querySelector('#updateStatus'),result:document.querySelector('#updateResult'),message:document.querySelector('#updateMessage'),actions:document.querySelector('#updateActions'),apply:document.querySelector('#applyUpdate'),dismiss:document.querySelector('#dismissUpdate'),list:document.querySelector('#tournamentList'),download:document.querySelector('#appDownload')};
let pendingRelease=null;
const platform=()=>/Android/i.test(navigator.userAgent)?'android':(/iPhone|iPad|iPod/i.test(navigator.userAgent)?'ios':'web');
const show=(message,{kind='ok',actions=false}={})=>{els.result.hidden=false;els.message.textContent=message;els.result.style.borderColor=kind==='warn'?'#ffd98a':'#8dffb4';els.actions.hidden=!actions};

async function serviceWorkerUpdate(){
  if(!('serviceWorker'in navigator))return false;
  const registration=await navigator.serviceWorker.getRegistration()||await navigator.serviceWorker.register('/sw.js');
  await registration.update();
  return Boolean(registration.waiting||registration.installing);
}

async function checkForUpdate({silent=false,ignoreInterval=false}={}){
  const previous=Date.parse(localStorage.getItem(KEYS.lastCheck)||'');
  if(silent&&!ignoreInterval&&Number.isFinite(previous)&&Date.now()-previous<21600000)return null;
  els.check.disabled=true;els.check.textContent='Checking…';
  try{
    const response=await fetch(`/update/app-v1-release.json?t=${Date.now()}`,{cache:'no-store'});
    if(!response.ok)throw new Error(`release check ${response.status}`);
    const release=await response.json(),native=release.platforms?.[platform()],dismissed=Number(localStorage.getItem(KEYS.dismissed)||0);
    const availableCode=Math.max(Number(release.web.versionCode)||0,Number(native?.versionCode)||0);
    const webUpdate=Number(release.web.versionCode)>CURRENT_WEB_CODE;
    const swUpdate=await serviceWorkerUpdate().catch(()=>false);
    const nativeUpdate=platform()==='android'&&native?.updateAvailable===true;
    const mandatory=release.mandatory===true||CURRENT_WEB_CODE<Number(release.minimumSupportedWebVersionCode||0);
    localStorage.setItem(KEYS.lastCheck,new Date().toISOString());
    if(webUpdate||swUpdate||nativeUpdate){
      pendingRelease={release,native,availableCode,nativeUpdate};
      if(!mandatory&&silent&&dismissed===availableCode)return release;
      const target=nativeUpdate?`Android ${native.versionName}`:`SVR Poker ${release.productVersion}`;
      show(`${target} is ready. Finish your hand, then apply the update.`,{kind:'warn',actions:true});
      els.dismiss.hidden=mandatory;
      return release;
    }
    pendingRelease=null;
    if(!silent)show(`You are current: SVR Poker ${release.productVersion}. No reinstall is needed.`);
    return release;
  }catch(error){if(!silent)show('The update service could not be reached. Your current game remains available.',{kind:'warn'});console.warn(error);return null}
  finally{els.check.disabled=false;els.check.textContent='Check for Update'}
}

function applyUpdate(){
  if(!pendingRelease)return;
  if(pendingRelease.nativeUpdate&&pendingRelease.native?.url){location.assign(pendingRelease.native.url);return}
  navigator.serviceWorker?.getRegistration?.().then(registration=>registration?.waiting?.postMessage({type:'SKIP_WAITING'})).finally(()=>location.reload());
}

function dismissUpdate(){
  if(!pendingRelease)return;
  localStorage.setItem(KEYS.dismissed,String(pendingRelease.availableCode));
  els.result.hidden=true;pendingRelease=null;
}

async function loadTournaments(){
  try{const response=await fetch(`/game/data/tournaments-v1.json?t=${Date.now()}`,{cache:'no-store'});if(!response.ok)throw new Error('schedule unavailable');const data=await response.json();els.list.replaceChildren(...data.tournaments.slice(0,3).map(item=>{const article=document.createElement('article');article.className='tournament';const copy=document.createElement('div'),name=document.createElement('strong'),meta=document.createElement('small'),note=document.createElement('span'),link=document.createElement('a');name.textContent=item.name;meta.textContent=`${item.scheduleLabel} • ${item.entryLabel}`;note.textContent=item.description;link.href=item.href;link.textContent=item.actionLabel;copy.append(name,meta,note);article.append(copy,link);return article}))}catch{els.list.innerHTML='<p class="status">Schedule is temporarily unavailable. The regular table is still open.</p>'}
}

els.check.addEventListener('click',()=>checkForUpdate({ignoreInterval:true}));
els.apply.addEventListener('click',applyUpdate);
els.dismiss.addEventListener('click',dismissUpdate);
els.download.addEventListener('click',()=>localStorage.setItem(KEYS.android,'2'));
loadTournaments();
checkForUpdate({silent:true});
