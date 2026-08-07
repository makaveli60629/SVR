/* PHASE-400-IOS-SAFARI-RUNTIME-ADAPTER-LOCK */
import {state as pokerState,sound} from './phase393_android_common.js?v=phase393';
const BUILD='PHASE-400-IPHONE-SAFARI-WEB-GAME-LOCK';
const $=s=>document.querySelector(s);
const ua=navigator.userAgent||'';
const iPadDesktop=navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1;
const query=new URLSearchParams(location.search);
const forced=query.get('platform')==='ios'||query.get('safari')==='1';
const isIOS=forced||/iPhone|iPad|iPod/i.test(ua)||iPadDesktop;
const isSafari=isIOS&&/AppleWebKit/i.test(ua)&&!/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
const qaState={build:BUILD,isIOS,isSafari,iPadDesktop,forced,installed:false,audioUnlocked:false,visualViewportReady:Boolean(window.visualViewport),safeAreaReady:true,touchReady:'ontouchstart'in window||navigator.maxTouchPoints>0,pointerReady:'PointerEvent'in window,microphoneApiReady:Boolean(navigator.mediaDevices?.getUserMedia),secureContext:Boolean(window.isSecureContext),standalone:Boolean(window.navigator.standalone||matchMedia?.('(display-mode: standalone)')?.matches),lastError:null,checkedAt:null};
function relabel(){
  if(!isIOS)return;
  document.documentElement.classList.add('svr-ios');
  if(isSafari)document.documentElement.classList.add('svr-safari');
  document.body.dataset.platform='ios';document.body.dataset.iosBuild=BUILD;
  const badge=$('.platform-badge');if(badge)badge.textContent='IPHONE • SAFARI TOUCH';
  const gateText=$('.gate-card p');if(gateText)gateText.textContent='This is the iPhone / Safari touch game using the protected SVR Poker mobile engine.';
  const brand=$('.brand-pill span');if(brand)brand.textContent='IPHONE TABLE';
  document.querySelectorAll('a[href$=".apk"],a[href*="svr-poker-android-rc2.apk"]').forEach(el=>el.classList.add('hide'));
  const gateStatus=$('#gateStatus');if(gateStatus)gateStatus.textContent='iPhone / Safari ready • touch-safe controls • safe-area layout • Safari audio and microphone compatibility.';
  if(!$('.phase400-ios-note')){const note=document.createElement('div');note.className='phase400-ios-note';note.textContent=qaState.standalone?'IPHONE APP MODE':'SAFARI READY • ADD TO HOME SCREEN OPTIONAL';document.body.appendChild(note)}
}
function updateViewport(){if(!isIOS)return;const h=window.visualViewport?.height||window.innerHeight;document.documentElement.style.setProperty('--svr-ios-vh',`${Math.max(320,h)}px`)}
function unlockAudioFromGesture(){
  if(!isIOS||qaState.audioUnlocked)return;
  try{if(pokerState.soundEnabled)sound('check');qaState.audioUnlocked=Boolean(pokerState.audioReady||!pokerState.soundEnabled);qaState.checkedAt=new Date().toISOString()}catch(error){qaState.lastError=String(error?.message||error)}
}
function installGestureUnlock(){
  if(!isIOS)return;
  const once=()=>{unlockAudioFromGesture();document.removeEventListener('touchstart',once,true);document.removeEventListener('pointerdown',once,true)};
  document.addEventListener('touchstart',once,{capture:true,passive:true});document.addEventListener('pointerdown',once,{capture:true,passive:true});
  $('#soundGate')?.addEventListener('click',unlockAudioFromGesture);$('#soundToggle')?.addEventListener('click',unlockAudioFromGesture);$('#join')?.addEventListener('click',unlockAudioFromGesture);
}
function installSafariMicHints(){
  if(!isIOS)return;
  const tune=()=>{const mic=$('#phase399MicButton');if(!mic)return false;mic.title='Tap once to allow microphone access. Then press and hold MIC to talk when multiplayer voice is connected.';mic.setAttribute('aria-label','Microphone push to talk');return true};
  tune();const timer=setInterval(()=>{if(tune())clearInterval(timer)},350);setTimeout(()=>clearInterval(timer),8000);
}
function install(){
  if(!isIOS){qaState.checkedAt=new Date().toISOString();window.SVR_PHASE400_IOS_SAFARI_STATE={...qaState};return false}
  relabel();updateViewport();installGestureUnlock();installSafariMicHints();
  window.visualViewport?.addEventListener('resize',updateViewport,{passive:true});window.addEventListener('orientationchange',()=>setTimeout(updateViewport,120),{passive:true});
  qaState.installed=true;qaState.checkedAt=new Date().toISOString();window.SVR_PHASE400_IOS_SAFARI_STATE={...qaState};return true
}
function qa(){relabel();updateViewport();qaState.audioUnlocked=Boolean(qaState.audioUnlocked||pokerState.audioReady||!pokerState.soundEnabled);qaState.checkedAt=new Date().toISOString();window.SVR_PHASE400_IOS_SAFARI_STATE={...qaState};return{...qaState,platformDataset:document.body?.dataset?.platform||null,androidLayoutPreserved:Boolean($('#table')&&$('#community')&&$('#raiseSlider')),phase399LearningReady:Boolean(window.SVR_PHASE399_LEARNING_QA),phase398BettingReady:Boolean(window.SVR_PHASE398_ANDROID_BETTING_QA),pass:Boolean(!isIOS||(qaState.installed&&qaState.touchReady&&qaState.secureContext&&$('#join')&&$('#table')))}}
window.SVR_PHASE400_IOS_SAFARI_QA=qa;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
setTimeout(qa,700);setTimeout(qa,1800);
