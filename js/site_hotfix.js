
/* Scarlett VR Poker — Site Hotfix (non-invasive)
   Adds:
   - Red "COMING SOON / UNDER CONSTRUCTION" under Live Status
   - Single status bulb (green/orange/red) driven by game iframe load/error
   - Forces favicon to logo on pages missing it
*/

(function(){
  const LOGO_PNG = "/assets/logo.png";
  const LOGO_SVG = "/assets/logo.svg";

  function ensureFavicon(){
    const head = document.head || document.getElementsByTagName("head")[0];
    if (!head) return;

    const hasIcon = !!document.querySelector('link[rel~="icon"]');
    if (!hasIcon){
      const l1 = document.createElement("link");
      l1.rel = "icon";
      l1.type = "image/png";
      l1.href = LOGO_PNG + "?v=1";
      head.appendChild(l1);

      const l2 = document.createElement("link");
      l2.rel = "icon";
      l2.type = "image/svg+xml";
      l2.href = LOGO_SVG + "?v=1";
      head.appendChild(l2);
    }
  }

  function findLiveStatusAnchor(){
    // Try common selectors first
    const candidates = [
      document.querySelector('[data-live-status]'),
      document.querySelector('#liveStatus'),
      document.querySelector('.live-status'),
      document.querySelector('h2, h3, h4')
    ].filter(Boolean);

    // Look for text match
    for (const el of candidates){
      if ((el.textContent||"").toLowerCase().includes("live status")) return el;
    }

    // deep scan (small)
    const all = Array.from(document.querySelectorAll("h1,h2,h3,h4,div,span")).slice(0, 250);
    for (const el of all){
      const t = (el.textContent||"").toLowerCase();
      if (t.includes("live status")) return el;
    }
    return null;
  }

  function addComingSoonBadge(anchor){
    if (!anchor || anchor._svrHasBadge) return;

    const badge = document.createElement("span");
    badge.className = "svr-coming-soon";
    badge.innerHTML = '<span class="svr-dot orange" id="svrLiveDot"></span><span>COMING SOON • UNDER CONSTRUCTION</span>';
    anchor.appendChild(badge);
    anchor._svrHasBadge = true;
  }

  function wireIframeStatus(){
    const dot = document.getElementById("svrLiveDot");
    if (!dot) return;

    // Find game preview iframe (any iframe pointing to /game/)
    const iframe = Array.from(document.querySelectorAll("iframe"))
      .find(f => (f.getAttribute("src")||"").includes("/game"));

    // default = orange (booting)
    dot.classList.remove("green"); dot.classList.add("orange");

    if (!iframe) return;

    iframe.addEventListener("load", ()=>{
      dot.classList.remove("orange"); dot.classList.add("green");
    }, { once:false });

    iframe.addEventListener("error", ()=>{
      dot.classList.remove("green","orange");
      dot.classList.add("svr-dot"); // keep
      dot.classList.remove("green","orange");
      dot.style.background="#ff3b3b";
      dot.style.boxShadow="0 0 12px rgba(255,60,60,.65)";
    }, { once:false });
  }

  function inject(){
    ensureFavicon();
    const a = findLiveStatusAnchor();
    addComingSoonBadge(a);
    wireIframeStatus();
  }

  // run now + after a bit (for SPA / late render banners)
  inject();
  setTimeout(inject, 600);
  setTimeout(inject, 1800);
})();
