/* PHASE-392-MARKET-ADS-NO-DUPLICATE-NAV-LOCK */
(() => {
  const BUILD = 'PHASE-392-MARKET-ADS-NO-DUPLICATE-NAV-LOCK';
  const layers = [
    'phase102-luxury.css?v=phase392',
    'phase104-alignment-polish.css?v=phase392',
    'store-alignment-fix.css?v=phase392',
    'site-android-readiness.css?v=phase392'
  ];
  const ads = [
    {label:'SVR Store', img:'assets/marketing/store-feature.svg', title:'SVR Store', copy:'Digital items, apparel concepts, sponsor products, and collectible drops.', href:'store.html?v=phase392'},
    {label:'Billboard Package', img:'assets/marketing/billboard-wall.svg', title:'VR Billboard', copy:'Lobby wall, private room, storefront, and event-signage placement.', href:'billboards.html?v=phase392'},
    {label:'Android + Quest', img:'assets/marketing/mobile-vr.svg', title:'Two Platform Experiences', copy:'Android touch play and a dedicated Meta Quest spatial version.', href:'membership.html?v=phase392'}
  ];
  function styles(){layers.forEach(href=>{if(document.querySelector(`link[href="${href}"]`))return;const link=document.createElement('link');link.rel='stylesheet';link.href=href;document.head.appendChild(link)})}
  function wireAds(){document.querySelectorAll('[data-market-ad]').forEach((slot,index)=>{const ad=ads[index%ads.length];slot.innerHTML=`<div class="ad-label"><span>${ad.label}</span><span>Marketing Placement</span></div><a class="ad-card" href="${ad.href}" style="display:block;text-decoration:none;color:inherit"><img loading="lazy" decoding="async" src="${ad.img}" alt="${ad.title}"><h3>${ad.title}</h3><p>${ad.copy}</p></a>`})}
  function boot(){styles();wireAds();window.SVR_PHASE392_MARKET_ADS={build:BUILD,vibezHeroInjected:false,floatingMenuInjected:false,sliderAuthority:'phase392-site-polish',checkedAt:new Date().toISOString()}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();