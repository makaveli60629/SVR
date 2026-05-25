(function(){
  'use strict';
  const MODULE = 'mod_audio';
  const root = window.SVR = window.SVR || {};
  root.modules = root.modules || {};
  const api = {
    version: '5.0-safe-phase175',
    audioListener: null,
    natureSound: null,
    customMusicSound: null,
    init(camera){
      if (!window.THREE || !camera) { console.info('[SVR]', MODULE, 'ready in dormant mode'); return; }
      this.audioListener = new THREE.AudioListener(); camera.add(this.audioListener);
      window.addEventListener('svr_reiki_room_state', e => e.detail?.active ? this.startReikiAmbiance(e.detail.customMusicUrl) : this.stopAllAudio());
    },
    startReikiAmbiance(customMusicUrl){
      if (!window.THREE || !this.audioListener) return;
      const loader = new THREE.AudioLoader();
      const loadSound = (url, volume) => {
        const sound = new THREE.Audio(this.audioListener);
        loader.load(url, buffer => { sound.setBuffer(buffer); sound.setLoop(true); sound.setVolume(volume); sound.play(); }, undefined, () => {});
        return sound;
      };
      this.natureSound = loadSound('assets/audio/nature_reiki_ambient.mp3', 0.35);
      this.customMusicSound = loadSound(customMusicUrl || 'assets/audio/default_reiki_meditation.mp3', 0.25);
    },
    stopAllAudio(){ for (const s of [this.natureSound, this.customMusicSound]) if (s?.isPlaying) s.stop(); }
  };
  root.modules[MODULE] = api;
  window.SVRAudioModule = api;
})();
