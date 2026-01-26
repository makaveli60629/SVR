export function initRadio() {
  const audio = new Audio("https://streaming.radio.co/s6c0d0f0d0/listen");
  audio.crossOrigin = "anonymous";
  audio.loop = true;
  audio.volume = 0.25;

  let armed = false;
  function arm() {
    if (armed) return;
    armed = true;
    // attempt to prime (some browsers allow after user gesture)
    audio.play().then(() => audio.pause()).catch(() => {});
  }
  document.addEventListener('pointerdown', arm, { once: true });

  window.toggleRadio = () => {
    if (audio.paused) {
      audio.play().catch(() => {});
      console.log("SCARLET_RADIO: PLAY");
    } else {
      audio.pause();
      console.log("SCARLET_RADIO: PAUSE");
    }
  };
}
