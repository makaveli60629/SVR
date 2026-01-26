// Simple audio engine with graceful fallback if files missing.
export function initAudio({ Bus }) {
  let enabled = true;
  window.toggleAudio = () => {
    enabled = !enabled;
    Bus.log(enabled ? 'AUDIO: ON' : 'AUDIO: OFF');
  };

  window.playSound = async (type) => {
    if (!enabled) return;
    try {
      const audio = new Audio(`./assets/audio/${type}.mp3`);
      await audio.play();
    } catch (e) {
      // silent fallback
      Bus.log(`AUDIO missing or blocked: ${type}`);
    }
  };

  Bus.log('AUDIO ENGINE ONLINE');
}
