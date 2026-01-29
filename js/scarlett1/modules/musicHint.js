export async function init(ctx){
  const { addLine } = ctx;
  let audio = null;

  const ensure = () => {
    if (audio) return;
    audio = new Audio();
    audio.loop = true;
    audio.volume = 0.6;
    // default safe stream - user can replace
    audio.src = "https://icecast.radiofrance.fr/fip-hifi.aac";
  };

  window.addEventListener("scarlett:musicOn", () => {
    try{
      ensure();
      audio.play();
      addLine("[music] on ✅");
    }catch(e){ addLine("[music] play blocked (tap screen then try)"); }
  });
  window.addEventListener("scarlett:musicOff", () => {
    if(audio){ audio.pause(); addLine("[music] off ✅"); }
  });

  addLine("[music] wired to HUD buttons ✅");
}
