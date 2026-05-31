(() => {
  const layers = [
    'phase102-luxury.css?v=phase102-luxury-polish',
    'phase103-floating-menu-fix.css?v=menu-layer-fix'
  ];
  layers.forEach((href) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  });

  const ads = [
    {label:"Sponsor Sample", img:"assets/marketing/espresso-ad.svg", title:"Espresso With Cream", copy:"Sample sponsor creative for website banners and future VR building-wall placements.", href:"sponsor-event.html"},
    {label:"SVR Store", img:"assets/marketing/store-feature.svg", title:"SVR Store", copy:"Digital items, apparel concepts, sponsor products, and collectible drops.", href:"store.html"},
    {label:"Billboard Package", img:"assets/marketing/billboard-wall.svg", title:"VR Billboard", copy:"Lobby wall, private room, storefront, and event-signage placement.", href:"billboards.html"}
  ];
  document.querySelectorAll("[data-market-ad]").forEach((slot, i) => {
    const ad = ads[i % ads.length];
    slot.innerHTML = `<div class="ad-label"><span>${ad.label}</span><span>Marketing Placement</span></div><a class="ad-card" href="${ad.href}" style="display:block;text-decoration:none;color:inherit"><img src="${ad.img}" alt="${ad.title}"><h3>${ad.title}</h3><p>${ad.copy}</p></a>`;
  });
})();
