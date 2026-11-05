const APP_BUILD = "SVR-MOBILE-STANDALONE-MVP-1";
const state = {
  chips: Number(localStorage.getItem("svrMobileChips") || 25000),
  avatar: localStorage.getItem("svrMobileAvatar") || "nova",
  tab: "home"
};
const avatars = {
  nova:{skin:"#b97852",hair:"#15131a",shirt:"#7c3aed",accent:"#6ff7ff"},
  ace:{skin:"#e0aa78",hair:"#4b2b1a",shirt:"#111827",accent:"#ffd36b"},
  jade:{skin:"#8a543a",hair:"#0c0c0f",shirt:"#0f766e",accent:"#5eead4"},
  violet:{skin:"#c98a67",hair:"#24102d",shirt:"#7e22ce",accent:"#e879f9"}
};
const products = [
  {sku:"chips_25k",name:"25,000 Play Chips",price:"$1.99",amount:25000,type:"chips"},
  {sku:"chips_100k",name:"100,000 Play Chips",price:"$4.99",amount:100000,type:"chips"},
  {sku:"avatar_neon",name:"Neon Avatar Pack",price:"$2.99",type:"cosmetic"},
  {sku:"table_midnight",name:"Midnight Table Skin",price:"$1.99",type:"cosmetic"}
];
const view = document.getElementById("view");
const chipBalance = document.getElementById("chipBalance");
const toastEl = document.getElementById("toast");

function save(){
  localStorage.setItem("svrMobileChips", String(state.chips));
  localStorage.setItem("svrMobileAvatar", state.avatar);
}
function refreshBalance(){ chipBalance.textContent = state.chips.toLocaleString(); }
function avatarSvg(id,size){
  const a=avatars[id]||avatars.nova;
  return '<svg width="'+size+'" height="'+size+'" viewBox="0 0 120 120" aria-hidden="true">'+
  '<defs><linearGradient id="g" x1="0" x2="1"><stop stop-color="'+a.shirt+'"/><stop offset="1" stop-color="'+a.accent+'"/></linearGradient></defs>'+
  '<circle cx="60" cy="60" r="56" fill="#0e0914"/>'+
  '<path d="M22 116c3-28 18-42 38-42s35 14 38 42" fill="url(#g)"/>'+
  '<ellipse cx="60" cy="53" rx="25" ry="29" fill="'+a.skin+'"/>'+
  '<path d="M35 49c1-23 13-34 27-34 15 0 24 10 25 29-9-6-18-9-30-9-9 0-16 5-22 14z" fill="'+a.hair+'"/>'+
  '<circle cx="51" cy="54" r="2.7" fill="#111"/><circle cx="69" cy="54" r="2.7" fill="#111"/>'+
  '<path d="M52 67c5 4 11 4 16 0" fill="none" stroke="#633" stroke-width="2.5" stroke-linecap="round"/></svg>';
}
function toast(msg){
  toastEl.textContent=msg;
  toastEl.classList.add("show");
  clearTimeout(toast._timer);
  toast._timer=setTimeout(function(){toastEl.classList.remove("show");},2300);
}
function homeFeed(){
  return '<article class="feed-item"><div class="icon">🏆</div><div><h3>Daily Tournament</h3><p>Play-money scheduled tournaments are available through the SVR tournament lobby.</p></div></article>'+
  '<article class="feed-item"><div class="icon">🎁</div><div><h3>Daily Reward</h3><p>Rewarded-ad support is prepared for the native build. No ad SDK is active in this web MVP.</p></div></article>'+
  '<article class="feed-item"><div class="icon">🥽</div><div><h3>SVR VR Events</h3><p>Discover upcoming virtual poker and social events in the main SVR network.</p></div></article>';
}
function renderHome(){
  view.innerHTML=
  '<section class="hero card"><div><p class="eyebrow">PHONE-FIRST • PLAY MONEY ONLY</p><h1>Real poker. Fast mobile play.</h1><p>Standalone Android/iPhone experience with quick tables, tournaments, 2D avatars, play-chip packs, cosmetics, and a direct bridge into the full SVR network.</p></div><div class="hero-avatar" id="heroAvatar"></div></section>'+
  '<section class="quick-grid">'+
  '<a class="mode-card primary" href="../game/android-tabletop.html?mode=regular&source=mobile-standalone"><span>♠</span><strong>Quick Play</strong><small>6-seat Texas Holdem</small></a>'+
  '<a class="mode-card" href="../game/android-tabletop.html?mode=practice&source=mobile-standalone"><span>♥</span><strong>Practice</strong><small>Play against bots</small></a>'+
  '<a class="mode-card" href="../game/tournaments.html?source=mobile-standalone"><span>♦</span><strong>Tournaments</strong><small>Scheduled play-money events</small></a>'+
  '<button class="mode-card" data-action="freeforall"><span>♣</span><strong>Free For All</strong><small>Fast rotating table concept</small></button></section>'+
  '<section class="card promo"><div><p class="eyebrow">SVR NETWORK</p><h2>Want the full virtual experience?</h2><p>See VR events, social rooms, sponsor hubs, and the main SVR Poker experience.</p></div><a class="button secondary" href="../game/quest.html?source=mobile-standalone">Explore SVR VR</a></section>'+
  '<section class="feed">'+homeFeed()+'</section>';
  const hero=document.getElementById("heroAvatar");
  if(hero) hero.innerHTML=avatarSvg(state.avatar,108);
}
function renderEvents(){
  view.innerHTML='<div class="section-title"><div><p class="eyebrow">EVENTS</p><h2>Play-money tournaments</h2></div><p>No cash-out</p></div>'+
  '<section class="card"><h3>Scheduled Tournament Lobby</h3><p>Use the existing tournament flow and registration screen.</p><a class="button primary" href="../game/tournaments.html?source=mobile-standalone">Open Tournaments</a></section>'+
  '<section class="card"><h3>Free For All</h3><p>Fast casual table rotation. MVP routes to regular play while the dedicated queue service is built.</p><a class="button secondary" href="../game/android-tabletop.html?mode=regular&queue=ffa&source=mobile-standalone">Join FFA Test</a></section>';
}
function renderAvatar(){
  let cards="";
  Object.keys(avatars).forEach(function(id){
    cards+='<article class="avatar-card '+(state.avatar===id?"selected":"")+'"><div class="avatar-preview">'+avatarSvg(id,130)+'</div><h3>'+id.charAt(0).toUpperCase()+id.slice(1)+'</h3><button data-avatar="'+id+'">'+(state.avatar===id?"Selected":"Use Avatar")+'</button></article>';
  });
  view.innerHTML='<div class="section-title"><div><p class="eyebrow">2D AVATARS</p><h2>Choose your table identity</h2></div></div><section class="avatar-grid">'+cards+'</section>'+
  '<section class="notice">The standalone app uses lightweight 2D avatars so the phone game stays fast. Your full 3D/VR identity can remain separate.</section>';
}
function renderShop(){
  let cards="";
  products.forEach(function(p){
    cards+='<article class="shop-card"><h3>'+p.name+'</h3><p>'+(p.type==="chips"?"Play-money chips. No cash value and no redemption.":"Cosmetic only. No gameplay advantage.")+'</p><strong>'+p.price+'</strong><button data-buy="'+p.sku+'">Buy</button></article>';
  });
  view.innerHTML='<div class="section-title"><div><p class="eyebrow">MOBILE SHOP</p><h2>Chips & cosmetics</h2></div></div><section class="shop-grid">'+cards+'</section>'+
  '<section class="card"><h3>Earn free chips</h3><p>Rewarded advertising can grant play chips after the native ad SDK is connected.</p><button class="button secondary" data-action="rewarded">Watch Ad for Chips</button></section>'+
  '<section class="notice">MVP billing is fail-closed. Google Play Billing / Apple StoreKit must be connected in the native wrapper before real purchases can complete.</section>';
}
function renderAccount(){
  view.innerHTML='<div class="section-title"><div><p class="eyebrow">SVR ACCOUNT</p><h2>One network identity</h2></div></div>'+
  '<section class="card account-actions"><a class="button primary" href="../site/login.html?next=/mobile/index.html">Sign In / Create Account</a><a class="button secondary" href="../site/profile.html">Profile</a><a class="button secondary" href="../site/avatar.html">Full Avatar Studio</a></section>'+
  '<section class="notice">The mobile app can share SVR login, tournaments, profile, and future multiplayer services while keeping the phone UI separate from the VR lobby.</section>';
}
function selectTab(tab){
  state.tab=tab;
  document.querySelectorAll(".bottom-nav button").forEach(function(b){b.classList.toggle("active",b.dataset.tab===tab);});
  if(tab==="tournaments") renderEvents();
  else if(tab==="avatar") renderAvatar();
  else if(tab==="shop") renderShop();
  else if(tab==="account") renderAccount();
  else renderHome();
}
async function buy(sku){
  const p=products.find(function(x){return x.sku===sku;});
  if(!p) return;
  try{
    await window.SVRMobileBridge.purchase(sku);
    if(p.type==="chips"){state.chips+=p.amount;save();refreshBalance();}
    toast("Purchase complete");
  }catch(e){
    toast(e && e.message==="NATIVE_BILLING_NOT_CONNECTED" ? "Native billing not connected yet" : "Purchase unavailable");
  }
}
async function rewarded(){
  try{
    await window.SVRMobileBridge.showRewardedAd();
    state.chips+=2500;save();refreshBalance();toast("+2,500 play chips");
  }catch(e){toast("Rewarded ads not connected yet");}
}
document.addEventListener("click",function(e){
  const tabButton=e.target.closest("[data-tab]");
  if(tabButton) selectTab(tabButton.dataset.tab);
  const avatarButton=e.target.closest("[data-avatar]");
  if(avatarButton){state.avatar=avatarButton.dataset.avatar;save();renderAvatar();}
  const buyButton=e.target.closest("[data-buy]");
  if(buyButton) buy(buyButton.dataset.buy);
  const actionButton=e.target.closest("[data-action]");
  if(actionButton && actionButton.dataset.action==="rewarded") rewarded();
  if(actionButton && actionButton.dataset.action==="freeforall") location.href="../game/android-tabletop.html?mode=regular&queue=ffa&source=mobile-standalone";
});
refreshBalance();
renderHome();
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(function(){});
window.SVR_MOBILE_APP={build:APP_BUILD,state:state};