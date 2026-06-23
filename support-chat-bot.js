(() => {
  const BUILD = 'PHASE-151-SMART-AI-SUPPORT-BRAIN-LOCK';
  const API_BASE = window.SVR_SERVER_API_BASE || window.SVR_API_BASE || 'https://api.svrpoker.com';
  const STORE_KEY = 'svr_support_chat_messages';
  const SESSION_KEY = 'svr_support_chat_session';
  const AI_ONLINE_LABEL = 'AI SUPPORT ONLINE';
  const CONTACT_EMAIL = 'admin@svrpoker.com';
  if (window.SVR_SUPPORT_CHAT_BOT_AI_LOADED) return;
  window.SVR_SUPPORT_CHAT_BOT_AI_LOADED = true;

  const QUICK = [
    { key:'game', label:'Game help', text:'My game goes black or movement is not working. What should I do?' },
    { key:'hub', label:'Private hubs', text:'Tell me about the hub.' },
    { key:'sponsor', label:'Sponsorship', text:'How can my business sponsor SVR Poker?' },
    { key:'partner', label:'Partnerships', text:'How do partnerships work with SVR Poker?' },
    { key:'android', label:'Android help', text:'How do I use Android Lite and avoid black screen movement?' },
    { key:'app', label:'App install', text:'How do I install the SVR app?' },
    { key:'store', label:'Store support', text:'How does the SVR store and membership work?' },
    { key:'admin', label:'Contact admin', text:'Please have admin contact me.' }
  ];

  const ANSWERS = {
    hub: {
      title:'SVR private hubs',
      keys:['hub','hubs','private hub','private hubs','room','rooms','portal','portals','storefront','lobby hub','tell me about the hub','business hub','sponsor hub'],
      text:`An SVR hub is a private branded room or storefront connected from the main lobby. The lobby stays clean and acts like a portal hallway; each hub opens a focused experience for a sponsor, partner, service, event, or VIP room.

Current hub concepts include: PGA Golf Training, Reiki / wellness, SVR Store, Scorpion VIP Room, Smoker Lounge, sponsor rooms, and future table-select rooms.

A hub can include signage, a portal pad, sponsor panels, product or service information, booking/referral flow, video or hologram content when approved, event routing, and a contact path back to SVR admin.

To request a hub, leave: business name, contact email, hub type, what users should do inside the room, media/assets you have, target launch date, and whether this is sponsorship, partnership, booking, store, service, or event focused.`
    },
    sponsor: {
      title:'Sponsorship and advertising',
      keys:['sponsor','sponsorship','advertise','advertising','ad','ads','billboard','banner','brand','placement','marketing','promote','campaign','business sponsor'],
      text:`SVR sponsorship can include lobby signage, sponsor panels, storefront placement, private hub routing, event promotion, future billboard-style ad surfaces, and branded room concepts.

Best fit: a sponsor gets visibility in the site and game lobby, then routes users to a focused page, store, contact form, private hub, or event.

To start, leave business name, contact email, industry, sponsorship goal, preferred placement, assets/logo/video, budget range if available, and whether you want a public sponsor panel or private hub.`
    },
    partner: {
      title:'Partnerships',
      keys:['partner','partnership','collaboration','affiliate','vendor','operator','booking','referral','revenue','compensation','proposal','work together','deal'],
      text:`SVR partnerships can be built around private hubs, booking/referral paths, sponsor rooms, content collaboration, store tie-ins, community events, or service routing.

Example: a service partner could have a wellness or training hub, receive leads from SVR users, and route users by location or service need. Admin reviews each partnership before public launch.

To discuss partnership, leave partner name, contact email, service area, what you offer, how users should book or contact you, desired compensation/referral structure, and whether you need a site page, room, portal, event, or storefront.`
    },
    game: {
      title:'Game and VR support',
      keys:['game','vr','quest','oculus','meta','webxr','poker','table','cards','chips','seat','dealer','teleport','controller','lobby','preview','black','screen','goes black','movement','move','walk','android lite'],
      text:`For the SVR game, use the clean test route first. On Android, use Android Lite and tap-move instead of joystick walking until the renderer is stable.

If the game goes black: press RECOVER, then RESET or LOBBY. Do not turn WALK ON until tap-move works. Test in this order: LOBBY, TABLE, STORE, PGA, REIKI, SCORPION, then WALK ON slowly.

For a bug report, leave device, browser, route used, whether it was Android Lite or Standard Game, what button/control you touched, and what happened.`
    },
    android: {
      title:'Android Lite safe mode',
      keys:['android','phone','chrome','mobile','black screen','screen black','tap move','tap-move','walk off','walk on','recover','reset','joystick','left stick'],
      text:`Android Lite is the safer mobile route. It starts with WALK OFF and gives tap-move buttons: LOBBY, TABLE, STORE, PGA, REIKI, SCORPION, RESET, and RECOVER.

Use tap-move first. If that works, turn WALK ON only for slow testing. If the screen goes black, press RECOVER, then RESET, and keep WALK OFF.

Android Lite test route: /game/android.html. Standard route is for desktop/WebXR/Quest testing.`
    },
    app: {
      title:'App install help',
      keys:['app','install','download','pwa','apk','android app','home screen','mobile app','signed','ios','chrome install','add to home screen'],
      text:`SVR currently uses a PWA install path for the site app. On Chrome, use the Download/App page, then press Install Site App. If Chrome does not show the native prompt, use the Chrome three-dot menu and choose Install app or Add to Home screen.

The signed native APK slot is prepared, but it should only be advertised after an approved signed package exists. For now, use the PWA and Android Lite route.`
    },
    store: {
      title:'Store and membership',
      keys:['store','shop','buy','merch','membership','profile','register','locker','avatar','checkout','cart','items','gear','svr store'],
      text:`The SVR Store is a preview/sandbox store path for future membership, merch, avatar items, and game-related offerings. Store links should route from the site and game lobby without blocking the main game.

For store help, leave the item, membership feature, profile issue, checkout question, or sponsor/storefront idea.`
    },
    events: {
      title:'Tournaments and events',
      keys:['tournament','tournaments','event','events','schedule','leaderboard','competition','weekly','monthly','giveaway','prize'],
      text:`SVR event concepts include weekly/monthly poker events, sponsor activations, leaderboards, giveaways, and private hub events. Public-money or prize events require admin review and compliance before launch.

For an event request, leave event name, date, format, expected players, sponsor involvement, prize idea, and whether it is public, private, or test-only.`
    },
    pga: {
      title:'PGA / Golf hub',
      keys:['pga','golf','driving range','drive range','chip','putt','golf training','lesson','academy','coach'],
      text:`The PGA hub is a golf-training sponsor concept. The lobby storefront can route users into golf practice experiences such as drive/range and chip/putt.

A golf sponsor or trainer should provide name, academy/business, service area, lesson/training offer, media assets, contact email, and whether the request is for a page, hub, event, or in-game training room.`
    },
    reiki: {
      title:'Reiki / wellness hub',
      keys:['reiki','meditation','wellness','zen','healing','therapy','relax','hologram','wellness hub'],
      text:`The Reiki / wellness hub is a private wellness-room concept inside the SVR world. It should stay approval-safe and use generic SVR placeholders unless approved partner assets are available.

A wellness partner should provide service type, service area, booking/contact method, approved media, desired room flow, and whether users should book, learn, watch a preview, or contact the provider.`
    },
    contact: {
      title:'Contact admin',
      keys:['admin','contact','owner','support','human','email','message','call me','reach out','problem','bug','issue','report'],
      text:`AI support is online. To reach admin, leave your name, email, and details in this chat. The message is saved locally and sent to SVR support when the backend is reachable. You can also email ${CONTACT_EMAIL}.

For bug reports, include page/room, device, browser, route, what you clicked, and what happened.`
    },
    status: {
      title:'Project status',
      keys:['status','current status','phase','ready','progress','launch','what is done','what works'],
      text:`SVR is in active build/polish. Recent focus areas include AI Support, PWA install, Android Lite, tap-move fallback, game stability, lobby fit/alignment, private hub routing, store links, and poker core stability.

Best testing order: public site, downloads/app install, Android Lite, lobby alignment, tap-move buttons, then standard game/Quest testing.`
    }
  };

  function sessionId(){ try{ let id=localStorage.getItem(SESSION_KEY); if(!id){ id=`svr-chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`; localStorage.setItem(SESSION_KEY,id); } return id; }catch{ return `svr-chat-${Date.now().toString(36)}`; } }
  function loadMessages(){ try{return JSON.parse(localStorage.getItem(STORE_KEY)||'[]');}catch{return [];} }
  function saveMessage(msg){ const list=loadMessages(); list.push(msg); try{localStorage.setItem(STORE_KEY,JSON.stringify(list.slice(-120)));}catch{} }
  function adminOnline(){ const p=window.SVR_ADMIN_PRESENCE; if(p&&typeof p.isOnline==='boolean')return p.isOnline; const badge=document.querySelector('.admin-status,.status-pill,[data-admin-pill]'); return /ADMIN ONLINE/i.test(String(badge?.textContent||'')); }
  function paintSupportPresence(online){ const label=online?'ADMIN ONLINE':AI_ONLINE_LABEL; document.querySelectorAll('.admin-status,[data-admin-pill],.status-pill').forEach(badge=>{ const text=String(badge.textContent||'').toUpperCase(); const isAdmin=badge.matches('.admin-status,[data-admin-pill]')||text.includes('ADMIN ONLINE')||text.includes('ADMIN OFFLINE')||text.includes(AI_ONLINE_LABEL); if(!isAdmin)return; badge.textContent=label; badge.dataset.state='online'; badge.dataset.source=online?'admin-live':'ai-support-online-fallback'; badge.classList.add('online','ai-support-online'); badge.classList.remove('offline'); badge.setAttribute('aria-label',label); badge.title=label; }); }
  function normalize(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9$@.\s/-]/g,' ').replace(/\s+/g,' ').trim(); }
  function scoreAnswer(item,q){ let score=0; const hay=` ${q} `; item.keys.forEach(key=>{ const k=normalize(key); if(!k)return; if(hay.includes(` ${k} `))score+=k.includes(' ')?12:6; else if(hay.includes(k))score+=k.includes(' ')?8:3; }); return score; }
  function siteHints(){ const links=Array.from(document.querySelectorAll('.market-links a,nav a,footer a')).slice(0,20).map(a=>(a.textContent||'').trim()).filter(Boolean); return links.length?'Site navigation I can route: '+Array.from(new Set(links)).join(', ')+'.':''; }
  function missingInfoHint(q,top){ if(/sponsor|business|advertis|partner|hub|room|booking/.test(q)) return 'Useful details to leave: name, email, business/service, desired hub or placement, assets available, and timing.'; if(/bug|black|broken|not work|issue|movement|install/.test(q)) return 'Useful details to leave: device, browser, link/route, what you clicked, and what happened.'; return top?.id==='contact'?'Leave your name, email, and details so admin can follow up.':''; }
  function smartAnswer(text){
    const q=normalize(text);
    if(!q) return 'Ask me about SVR hubs, sponsorship, partnerships, game help, Android Lite, app install, store, events, or admin support.';
    if(/^(hi|hello|hey|yo|good morning|good afternoon|good evening)\b/.test(q)) return 'Hello. I am the SVR AI Support Bot. Ask about the game, Android Lite, app install, sponsorship, partnerships, private hubs, store, events, or admin support.';
    const intentBoost=[];
    if(/tell me about (the )?hub|what.*hub|hub/.test(q)) intentBoost.push('hub');
    if(/black|screen|android|phone|walk|move|joystick/.test(q)) intentBoost.push('android','game');
    if(/sponsor|advertis|billboard|banner/.test(q)) intentBoost.push('sponsor');
    if(/partner|collab|booking|referral|compensation/.test(q)) intentBoost.push('partner');
    const ranked=Object.entries(ANSWERS).map(([id,item])=>({id,item,score:scoreAnswer(item,q)+(intentBoost.includes(id)?18:0)})).filter(r=>r.score>0).sort((a,b)=>b.score-a.score);
    if(!ranked.length){ return ['I can help with SVR game support, Android Lite, app install, sponsorship, partnerships, private hubs, store/membership, events, admin contact, and site navigation.', siteHints(), 'Try: Tell me about the hub. How can I sponsor? Why does Android go black? How do partnerships work?'].filter(Boolean).join('\n\n'); }
    const wantsMultiple=/\band\b|\balso\b|\bplus\b|\bwith\b|sponsor.*hub|partner.*hub/.test(q);
    const selected=ranked.slice(0,wantsMultiple?3:1);
    const parts=selected.map(r=>`${r.item.title}\n${r.item.text}`);
    const hint=missingInfoHint(q,selected[0]); if(hint)parts.push(`Next step\n${hint}`);
    return parts.join('\n\n');
  }

  function injectStyle(){ if(document.getElementById('svr-support-chat-style'))return; const style=document.createElement('style'); style.id='svr-support-chat-style'; style.textContent=`
    .admin-status.ai-support-online,.status-pill.ai-support-online,[data-admin-pill].ai-support-online{background:linear-gradient(135deg,rgba(141,255,180,.98),rgba(48,255,120,.90))!important;border-color:rgba(141,255,180,.90)!important;color:#021006!important;box-shadow:0 0 20px rgba(141,255,180,.38),0 12px 38px rgba(0,0,0,.30)!important;text-shadow:none!important}
    #svrSupportChatNative{position:fixed;right:max(10px,env(safe-area-inset-right));bottom:max(10px,env(safe-area-inset-bottom));z-index:2147483647;width:auto;max-width:calc(100vw - 20px);font-family:Rajdhani,system-ui,Arial;color:#fff;pointer-events:none}
    #svrSupportChatNative[open]{inset:0!important;width:100vw!important;max-width:none!important;height:100dvh!important;background:rgba(0,0,0,.84)!important;pointer-events:auto!important;box-sizing:border-box!important;padding:12px!important;overflow:hidden!important}
    #svrSupportChatNative summary{list-style:none;pointer-events:auto;float:right;border:1px solid rgba(141,255,180,.92);border-radius:999px;background:linear-gradient(135deg,rgba(141,255,180,.98),rgba(48,255,120,.92));color:#021006;font:900 11px Orbitron,system-ui,Arial;padding:9px 11px;box-shadow:0 14px 44px rgba(0,0,0,.56),0 0 18px rgba(141,255,180,.36);cursor:pointer;letter-spacing:.05em;text-transform:uppercase;user-select:none;min-height:34px;box-sizing:border-box}
    #svrSupportChatNative[open] summary{position:fixed!important;top:max(10px,env(safe-area-inset-top))!important;right:max(10px,env(safe-area-inset-right))!important;z-index:2147483647!important;margin:0!important}
    #svrSupportChatNative summary::-webkit-details-marker{display:none}#svrSupportChatNative .dot{display:inline-block;width:7px;height:7px;border-radius:50%;background:#021006;margin-right:6px;box-shadow:0 0 8px rgba(2,16,6,.45)}
    .svr-chat-native-panel{clear:both;pointer-events:auto;display:none;border:1px solid rgba(141,255,180,.45);border-radius:22px;background:rgba(3,5,14,.985);box-shadow:0 30px 100px rgba(0,0,0,.84),0 0 28px rgba(141,255,180,.16);backdrop-filter:blur(20px);overflow:hidden}
    #svrSupportChatNative[open] .svr-chat-native-panel{display:grid!important;position:fixed!important;inset:58px 12px 12px 12px!important;width:auto!important;height:auto!important;max-height:none!important;grid-template-rows:auto auto minmax(160px,1fr)!important}
    .svr-chat-head{padding:14px 74px 14px 14px;border-bottom:1px solid rgba(255,255,255,.10);background:linear-gradient(135deg,rgba(141,255,180,.13),rgba(127,252,255,.08))}.svr-chat-head strong{font-family:Orbitron,system-ui,Arial;font-size:14px;color:#bffcff;letter-spacing:.06em}.svr-chat-head span{font-size:12px;color:#8dffb4;font-weight:900}.svr-chat-mini{font-size:11px;color:#cfefff;opacity:.82;margin-top:3px}
    .svr-chat-form{display:grid;gap:9px;padding:12px;border-bottom:1px solid rgba(255,255,255,.10);background:rgba(0,0,0,.28);overflow:auto}.svr-chat-question-label{font:900 12px Orbitron,system-ui,Arial;letter-spacing:.08em;text-transform:uppercase;color:#8dffb4}.svr-chat-form textarea{width:100%;box-sizing:border-box;border:2px solid rgba(141,255,180,.72);border-radius:16px;background:rgba(0,0,0,.45);color:#fff;padding:13px;font:800 16px Rajdhani,system-ui,Arial;min-height:104px;resize:vertical;outline:none;box-shadow:0 0 20px rgba(141,255,180,.10)}.svr-chat-form textarea:focus{border-color:#8dffb4;box-shadow:0 0 26px rgba(141,255,180,.24)}.svr-chat-form input{width:100%;box-sizing:border-box;border:1px solid rgba(141,255,180,.28);border-radius:13px;background:rgba(0,0,0,.34);color:#fff;padding:10px;font:700 14px Rajdhani,system-ui,Arial}.svr-chat-form button[type="submit"]{border:1px solid rgba(141,255,180,.72);border-radius:14px;background:linear-gradient(135deg,rgba(141,255,180,.98),rgba(127,252,255,.80));color:#080812;font:900 13px Orbitron,system-ui,Arial;padding:12px;cursor:pointer;text-transform:uppercase}.svr-chat-note{font-size:12px;color:#bffcff;opacity:.86;text-align:center}.svr-chat-status{font-size:12px;color:#8dffb4;text-align:center;min-height:16px}.svr-chat-fields{display:grid;grid-template-columns:1fr 1fr;gap:8px}.svr-chat-quick{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:2px 0}.svr-chat-quick button{border:1px solid rgba(141,255,180,.30);border-radius:13px;background:rgba(255,255,255,.065);color:#fff;font-weight:800;padding:9px;cursor:pointer;min-height:38px}
    .svr-chat-body{padding:13px;overflow:auto;min-height:160px}.svr-chat-msg{margin:8px 0;padding:10px 12px;border-radius:16px;line-height:1.34;font-size:15px;white-space:pre-wrap}.svr-chat-msg.bot{background:rgba(127,252,255,.10);border:1px solid rgba(127,252,255,.20);color:#eafcff}.svr-chat-msg.user{background:rgba(255,217,138,.13);border:1px solid rgba(255,217,138,.25);color:#fff8df;margin-left:32px}.svr-chat-msg.ai{border-color:rgba(141,255,180,.38);background:rgba(141,255,180,.12)}
    @media(max-width:760px){#svrSupportChatNative[open] .svr-chat-native-panel{inset:54px 8px 8px 8px!important;grid-template-rows:auto auto minmax(120px,1fr)!important}.svr-chat-head{padding-right:68px}.svr-chat-fields{grid-template-columns:1fr}.svr-chat-quick{grid-template-columns:repeat(2,minmax(0,1fr))}.svr-chat-msg.user{margin-left:0}.svr-chat-form textarea{min-height:128px;font-size:17px}}
  `; document.head.appendChild(style); }
  function addMessage(body,who='bot'){ const wrap=document.getElementById('svrSupportChatBody'); if(!wrap)return; const msg=document.createElement('div'); msg.className=`svr-chat-msg ${who}`; msg.textContent=body; wrap.appendChild(msg); wrap.scrollTop=wrap.scrollHeight; }
  async function sendToServer(entry){ const response=await fetch(`${API_BASE}/api/messages`,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({...entry,provider:'svr-ai-support-bot'})}); const data=await response.json().catch(()=>({})); if(!response.ok||data.ok===false)throw new Error(data.error||`Message failed ${response.status}`); return data; }
  async function submit(text,name='',email=''){ const clean=String(text||'').trim(); if(!clean)return; const status=document.getElementById('svrSupportChatStatus'); const aiReply=smartAnswer(clean); const entry={name:String(name||'').trim(),email:String(email||'').trim(),subject:'SVR AI support chat',message:clean,aiReply,source:location.pathname||'svr-site',sessionId:sessionId(),build:BUILD,createdAt:new Date().toISOString()}; addMessage(clean,'user'); window.setTimeout(()=>addMessage(aiReply,'bot ai'),80); if(status)status.textContent='Saving...'; try{ await sendToServer(entry); saveMessage({...entry,sent:true}); if(status)status.textContent='Sent to SVR support.'; }catch(e){ saveMessage({...entry,sent:false,error:String(e.message||e)}); if(status)status.textContent='Saved locally. Server pending.'; } }
  function removeOldWidgets(){ document.getElementById('svrSupportChatLaunch')?.remove(); document.getElementById('svrSupportChatPanel')?.remove(); document.getElementById('svr-inline-support-chat')?.remove(); }
  function inject(){ if(document.getElementById('svrSupportChatNative'))return; removeOldWidgets(); injectStyle(); const details=document.createElement('details'); details.id='svrSupportChatNative'; details.innerHTML=`<summary><span class="dot"></span>AI Support</summary><section class="svr-chat-native-panel" aria-label="SVR AI support chat bot"><header class="svr-chat-head"><strong>SVR AI Support Bot</strong><br><span id="svrSupportAdminLine">AI SUPPORT ONLINE • smarter hub/game/support answers</span><div class="svr-chat-mini">Game • Android • Store • Sponsorship • Partnerships • Hubs</div></header><form class="svr-chat-form" id="svrSupportChatForm"><label class="svr-chat-question-label" for="svrSupportQuestionBox">Type your question here</label><textarea id="svrSupportQuestionBox" name="message" aria-label="Type your SVR support question here" placeholder="Try: Tell me about the hub. How can I sponsor? Android goes black when I move."></textarea><button type="submit">Ask AI Support</button><div class="svr-chat-quick">${QUICK.map(q=>`<button type="button" data-chat="${q.key}">${q.label}</button>`).join('')}</div><div class="svr-chat-fields"><input name="name" placeholder="Name optional" autocomplete="name"/><input name="email" placeholder="Email optional" autocomplete="email"/></div><div class="svr-chat-status" id="svrSupportChatStatus"></div><div class="svr-chat-note">AI support answers instantly. Messages are saved and sent to SVR support when available.</div></form><div class="svr-chat-body" id="svrSupportChatBody"></div></section>`; document.body.appendChild(details); details.addEventListener('toggle',()=>{ document.documentElement.classList.toggle('svr-ai-support-open',details.open); document.body.classList.toggle('svr-ai-support-open',details.open); if(details.open){ setTimeout(()=>details.querySelector('#svrSupportQuestionBox')?.focus(),120); } }); details.querySelectorAll('[data-chat]').forEach(btn=>btn.addEventListener('click',()=>{ const q=QUICK.find(x=>x.key===btn.dataset.chat); if(q){ const textarea=details.querySelector('#svrSupportQuestionBox'); if(textarea)textarea.value=q.text; details.open=true; submit(q.text); } })); details.querySelector('#svrSupportChatForm')?.addEventListener('submit',e=>{ e.preventDefault(); const data=Object.fromEntries(new FormData(e.currentTarget).entries()); submit(data.message,data.name,data.email); e.currentTarget.querySelector('textarea[name="message"]').value=''; }); addMessage('Welcome. Ask about hubs, sponsorship, partnerships, Android Lite, app install, the VR poker game, store, events, or admin support. Try: “tell me about the hub.”','bot ai'); updateAdminLine(); setInterval(updateAdminLine,5000); setInterval(removeOldWidgets,1000); }
  function updateAdminLine(){ const online=adminOnline(); const root=document.getElementById('svrSupportChatNative'); const line=document.getElementById('svrSupportAdminLine'); if(root)root.classList.remove('is-offline'); paintSupportPresence(online); if(line)line.textContent=online?'ADMIN ONLINE • live support possible':'AI SUPPORT ONLINE • smarter hub/game/support answers'; window.SVR_SUPPORT_CHAT_BOT={build:BUILD,active:true,fullPageSupport:true,smallButton:true,visibleQuestionBox:true,smartKnowledgeBase:true,smarterBrain:true,hubAnswers:true,androidHelp:true,aiSupport:true,aiSupportOnline:true,nativeDetails:true,adminOnline:online,visibleStatus:online?'ADMIN ONLINE':AI_ONLINE_LABEL,topicCount:Object.keys(ANSWERS).length,apiBase:API_BASE,safeFallback:true,checkedAt:new Date().toISOString()}; }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',inject); else inject();
})();
