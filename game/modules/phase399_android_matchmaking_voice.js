/* PHASE-399-ANDROID-MATCHMAKING-VOICE-READY-LOCK */
const BUILD='PHASE-399-ANDROID-MATCHMAKING-VOICE-READY-LOCK';
const MATCH_TIMEOUT_MS=8000;
const STUN_SERVERS=[{urls:'stun:stun.l.google.com:19302'}];
const state={build:BUILD,mode:'idle',configured:false,searching:false,matched:false,authoritativeGame:false,roomId:null,peerId:null,playerId:null,socketState:'closed',peerState:'closed',gameChannelReady:false,micPermission:false,micReady:false,talking:false,voiceConnected:false,noiseSuppressionRequested:true,echoCancellationRequested:true,autoGainControlRequested:true,proximityVolume:1,lastError:null,checkedAt:null};
let socket=null,peer=null,gameChannel=null,localStream=null,remoteAudio=null,searchTimer=0,startedForJoin=false;
const $=s=>document.querySelector(s);
const game=()=>window.SVR_PHASE393_ANDROID_STATE;
function playerId(){const key='svr399_match_player_id';let id=localStorage.getItem(key);if(!id){id=`android-${Math.random().toString(36).slice(2,9)}-${Date.now().toString(36)}`;localStorage.setItem(key,id)}return id}
function endpoint(){const p=new URLSearchParams(location.search),direct=String(window.SVR_ANDROID_MATCHMAKING_WS_URL||'').trim(),query=String(p.get('matchWs')||'').trim();return direct||query}
function setStatus(text,kind='fallback'){const el=$('#phase399MatchStatus');if(!el)return;el.textContent=text;el.classList.remove('live','fallback');if(kind)el.classList.add(kind)}
function syncState(){state.playerId=playerId();state.configured=Boolean(endpoint());state.socketState=socket?.readyState===WebSocket.OPEN?'open':socket?.readyState===WebSocket.CONNECTING?'connecting':'closed';state.peerState=peer?.connectionState||'closed';state.gameChannelReady=gameChannel?.readyState==='open';state.voiceConnected=Boolean(remoteAudio&&peer?.connectionState==='connected');state.checkedAt=new Date().toISOString();window.SVR_PHASE399_MATCH_STATE={...state};return window.SVR_PHASE399_MATCH_STATE}
function fallback(reason='NO MATCH FOUND'){clearTimeout(searchTimer);state.searching=false;state.matched=false;state.authoritativeGame=false;state.mode='fallback-bots';state.roomId=null;state.peerId=null;setStatus(`BOTS • ${reason}`,'fallback');syncState()}
function send(msg){try{if(socket?.readyState===WebSocket.OPEN){socket.send(JSON.stringify({...msg,playerId:playerId(),client:'android',ts:Date.now()}));return true}}catch(error){state.lastError=String(error?.message||error)}return false}
function signal(payload){if(!state.roomId)return false;return send({type:'signal',roomId:state.roomId,peerId:state.peerId,payload})}
async function ensureMic(){
  if(localStream)return localStream;
  try{
    localStream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
    state.micPermission=true;state.micReady=true;localStream.getAudioTracks().forEach(t=>t.enabled=false);syncState();return localStream;
  }catch(error){state.lastError=`Microphone: ${String(error?.message||error)}`;state.micPermission=false;state.micReady=false;setStatus('MIC BLOCKED • BOTS CONTINUE','fallback');syncState();throw error}
}
function stopTalking(){state.talking=false;localStream?.getAudioTracks().forEach(t=>t.enabled=false);const b=$('#phase399MicButton');if(b){b.classList.remove('talking');b.textContent=state.micReady?'MIC READY':'MIC'}syncState()}
async function startTalking(){
  try{await ensureMic();localStream.getAudioTracks().forEach(t=>t.enabled=true);state.talking=true;const b=$('#phase399MicButton');if(b){b.classList.add('talking');b.textContent='TALKING'}syncState()}catch{}
}
function applyProximity(distance=0){const d=Math.max(0,Number(distance||0)),volume=Math.max(.08,Math.min(1,1-d/9));state.proximityVolume=volume;if(remoteAudio)remoteAudio.volume=volume;syncState();return volume}
function wireGameChannel(channel){gameChannel=channel;gameChannel.onopen=()=>{state.gameChannelReady=true;syncState()};gameChannel.onclose=()=>{state.gameChannelReady=false;syncState()};gameChannel.onmessage=event=>{try{const msg=JSON.parse(event.data);window.dispatchEvent(new CustomEvent('svr-phase399-peer-game-message',{detail:msg}))}catch{}}}
async function ensurePeer(offerer=false){
  if(peer)return peer;peer=new RTCPeerConnection({iceServers:STUN_SERVERS});
  try{await ensureMic();localStream.getTracks().forEach(track=>peer.addTrack(track,localStream))}catch{}
  peer.ontrack=event=>{remoteAudio||=Object.assign(document.createElement('audio'),{autoplay:true,playsInline:true});remoteAudio.srcObject=event.streams[0];remoteAudio.volume=state.proximityVolume;remoteAudio.play?.().catch(()=>{});document.body.appendChild(remoteAudio);syncState()};
  peer.onicecandidate=event=>{if(event.candidate)signal({candidate:event.candidate})};
  peer.onconnectionstatechange=()=>{if(['failed','disconnected','closed'].includes(peer.connectionState)&&state.matched)fallback('PLAYER DISCONNECTED');syncState()};
  peer.ondatachannel=event=>wireGameChannel(event.channel);
  if(offerer)wireGameChannel(peer.createDataChannel('svr-game'));
  if(offerer){await peer.setLocalDescription(await peer.createOffer());signal({description:peer.localDescription})}
  syncState();return peer;
}
async function handleSignal(payload){
  try{
    const p=await ensurePeer(false);
    if(payload?.description){await p.setRemoteDescription(payload.description);if(payload.description.type==='offer'){await p.setLocalDescription(await p.createAnswer());signal({description:p.localDescription})}}
    if(payload?.candidate)await p.addIceCandidate(payload.candidate);
  }catch(error){state.lastError=`WebRTC: ${String(error?.message||error)}`;syncState()}
}
async function handleMessage(raw){
  let msg;try{msg=JSON.parse(raw)}catch{return}
  if(msg.type==='waiting'){state.mode='searching';setStatus('SEARCHING FOR PLAYER…','');syncState();return}
  if(msg.type==='matched'||msg.type==='match_found'){
    clearTimeout(searchTimer);state.searching=false;state.matched=true;state.roomId=msg.roomId||msg.room||null;state.peerId=msg.peerId||msg.opponentId||null;state.authoritativeGame=Boolean(msg.authoritativeGame||msg.gameSyncReady);state.mode=state.authoritativeGame?'multiplayer':'peer-ready';
    setStatus(state.authoritativeGame?'PLAYER FOUND • MULTIPLAYER READY':'PLAYER FOUND • WAITING FOR GAME SYNC',state.authoritativeGame?'live':'');
    if(state.roomId)window.SVR_PHASE399_SET_SPONSOR_ROOM?.(state.roomId);await ensurePeer(Boolean(msg.offerer));syncState();return
  }
  if(msg.type==='signal'){await handleSignal(msg.payload||msg);return}
  if(msg.type==='game_sync_ready'){state.authoritativeGame=true;state.mode='multiplayer';setStatus('MULTIPLAYER • LIVE PLAYER','live');syncState();return}
  if(msg.type==='ticket_hand'){state.ticketHand=Number(msg.hand||0);syncState();return}
  if(msg.type==='voice_distance'){applyProximity(msg.distance);return}
  if(msg.type==='peer_left'||msg.type==='match_cancelled'){fallback('PLAYER LEFT');return}
  window.dispatchEvent(new CustomEvent('svr-phase399-match-message',{detail:msg}));
}
function disconnect(){clearTimeout(searchTimer);try{socket?.close()}catch{}try{peer?.close()}catch{}try{gameChannel?.close()}catch{}socket=null;peer=null;gameChannel=null;state.matched=false;state.searching=false;state.authoritativeGame=false;state.mode='bots';stopTalking();fallback('MATCH ENDED');return true}
function startMatchmaking(){
  const url=endpoint();state.configured=Boolean(url);if(!url){fallback('NO MATCH SERVER');return syncState()}if(!/^wss:\/\//i.test(url)){state.lastError='Matchmaking endpoint must use wss://';fallback('INVALID MATCH SERVER');return syncState()}
  if(socket&&(socket.readyState===WebSocket.OPEN||socket.readyState===WebSocket.CONNECTING))return syncState();
  state.mode='searching';state.searching=true;setStatus('SEARCHING FOR PLAYER…','');syncState();
  try{
    socket=new WebSocket(url);socket.onopen=()=>{send({type:'find_match',game:'svr-holdem-6max',voice:true,preferredSeats:2});searchTimer=setTimeout(()=>{send({type:'cancel_match'});fallback('NO PLAYER • BOT TABLE')},MATCH_TIMEOUT_MS);syncState()};
    socket.onmessage=event=>handleMessage(event.data);socket.onerror=()=>{state.lastError='matchmaking socket error';fallback('MATCH SERVER ERROR')};socket.onclose=()=>{if(state.searching||state.matched)fallback('MATCH SERVER CLOSED');else syncState()};
  }catch(error){state.lastError=String(error?.message||error);fallback('MATCH CONNECT FAILED')}
  return syncState();
}
function sendPeerGameMessage(message){try{if(gameChannel?.readyState==='open'){gameChannel.send(JSON.stringify(message));return true}}catch(error){state.lastError=String(error?.message||error)}return false}
function ensureUi(){
  const brand=$('.brand-pill'),footer=$('.footer');if(!brand||!footer)return false;
  if(!$('#phase399MatchStatus'))brand.insertAdjacentHTML('beforeend','<span id="phase399MatchStatus" class="phase399-match-status fallback">BOTS • MATCH CHECK PENDING</span>');
  if(!$('#phase399MicButton')){const mic=document.createElement('button');mic.id='phase399MicButton';mic.type='button';mic.className='phase399-footer-button phase399-mic';mic.textContent='MIC';mic.title='Push and hold to talk when a peer voice connection is available.';mic.addEventListener('pointerdown',event=>{event.preventDefault();startTalking()});['pointerup','pointercancel','pointerleave'].forEach(type=>mic.addEventListener(type,stopTalking));mic.addEventListener('click',async()=>{if(!state.micReady){try{await ensureMic();mic.textContent='MIC READY';toast('Microphone ready with noise suppression. Hold MIC to talk when connected.')}catch{}}});footer.appendChild(mic)}
  return true;
}
function toast(text){const el=$('#tableMessage');if(el){const old=el.textContent;el.textContent=text;setTimeout(()=>{if(el.textContent===text)el.textContent=old},2400)}}
function poll(){
  ensureUi();const g=game();if(g?.joined&&!startedForJoin){startedForJoin=true;startMatchmaking()}if(!g?.joined&&startedForJoin){startedForJoin=false;disconnect()}syncState();
}
function qa(){poll();return{...state,matchTimeoutMs:MATCH_TIMEOUT_MS,botFallback:true,wssRequired:true,webrtcVoiceReady:typeof RTCPeerConnection!=='undefined',noiseSuppressionRequested:true,pushToTalk:Boolean($('#phase399MicButton')),proximityVoiceControl:true,productionMatchServerConfigured:Boolean(endpoint()),liveMultiplayer:Boolean(state.mode==='multiplayer'&&state.authoritativeGame),pass:Boolean($('#phase399MatchStatus')&&$('#phase399MicButton')&&!state.lastError?.includes('syntax')),checkedAt:new Date().toISOString()}}
window.SVR_PHASE399_START_MATCHMAKING=startMatchmaking;window.SVR_PHASE399_DISCONNECT_MATCH=disconnect;window.SVR_PHASE399_SEND_PEER_GAME_MESSAGE=sendPeerGameMessage;window.SVR_PHASE399_SET_VOICE_DISTANCE=applyProximity;window.SVR_PHASE399_MATCH_QA=qa;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',poll,{once:true});else poll();
setInterval(poll,500);
