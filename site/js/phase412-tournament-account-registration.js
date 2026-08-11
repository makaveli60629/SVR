/* PHASE-412-TOURNAMENT-TEST-ACCOUNT-REGISTRATION-LOCK */
const BUILD='PHASE-412-TOURNAMENT-TEST-ACCOUNT-REGISTRATION-LOCK';
const KEY='svr_phase412_tournament_test_account_v1';
const params=new URLSearchParams(location.search);
const active=params.get('source')==='tournament-gate';
const state={build:BUILD,active,installed:false,registered:false,lastError:null};
function paint(){if(!active)return false;const form=document.getElementById('demoForm');if(!form)return false;const title=form.querySelector('label');const button=form.querySelector('button[type="submit"]');if(title)title.childNodes[0].textContent='Local Tournament Test Account Name';if(button)button.textContent='CREATE LOCAL TOURNAMENT TEST ACCOUNT';let note=document.getElementById('phase412TournamentAccountNote');if(!note){note=document.createElement('p');note.id='phase412TournamentAccountNote';note.className='notice';note.textContent='Tournament entry requires an account identity. Until the approved AWS account service is live, this creates a named local TEST account on this device. Guest 1 and a generic demo session do not qualify for tournament entry.';form.insertAdjacentElement('beforebegin',note)}state.installed=true;return true}
function register(detail){if(!active)return;try{const snap=detail||window.SVR_PLAYER_ACCOUNT?.snapshot?.()||window.SVR_PLAYER_ACCOUNT_STATE;if(snap?.mode!=='demo'||!snap?.profile?.playerId)return;const record={playerId:snap.profile.playerId,displayName:snap.profile.displayName||'Player',createdAt:new Date().toISOString(),scope:'play-money-tournament-test',build:BUILD};localStorage.setItem(KEY,JSON.stringify(record));state.registered=true;state.lastError=null}catch(error){state.lastError=String(error?.message||error)}}
window.addEventListener('svr:account-change',event=>register(event.detail));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{paint();setTimeout(paint,250)},{once:true});else{paint();setTimeout(paint,250)}
window.SVR_PHASE412_TOURNAMENT_REGISTRATION_QA=()=>({build:BUILD,...state,record:Boolean(localStorage.getItem(KEY)),pass:Boolean(!active||state.installed),checkedAt:new Date().toISOString()});
