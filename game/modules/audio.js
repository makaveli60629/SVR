export function createAudioPlaylist({ tracks = [], onState = ()=>{} } = {}){
  let index = 0;
  let enabled = false;
  let primed = false;
  let audio = null;
  let error = "";
  let pendingStart = false;

  function current(){ return tracks[index] || null; }

  function state(){
    const track = current();
    return {
      enabled,
      primed,
      trackIndex: index,
      trackTitle: track?.title || "No Track",
      trackCount: tracks.length,
      error
    };
  }

  function emit(){ onState(state()); }

  function ensureAudio(){
    if (audio || !tracks.length) return audio;
    audio = new Audio(current().url);
    audio.loop = true;
    audio.preload = "auto";
    audio.playsInline = true;
    audio.crossOrigin = "anonymous";
    audio.volume = 0.9;
    audio.muted = true;
    audio.autoplay = false;
    audio.addEventListener("error", ()=>{
      error = "Audio load blocked or failed";
      emit();
    });
    audio.addEventListener("playing", ()=>{
      error = "";
      primed = true;
      emit();
    });
    return audio;
  }

  async function prime(){
    if (!tracks.length) return false;
    const el = ensureAudio();
    try { if (!el.src) el.src = current().url; } catch(_e) {}
    try { el.load(); } catch(_e) {}
    try{
      await el.play();
      primed = true;
      el.muted = true;
      el.pause();
      try { el.currentTime = 0; } catch(_e) {}
      error = "";
      emit();
      return true;
    }catch(_err){
      error = "Tap once to unlock audio";
      emit();
      return false;
    }
  }

  function bindUnlocks(){
    const once = async ()=>{
      const ok = await prime();
      if (ok && (pendingStart || enabled)){
        const el = ensureAudio();
        enabled = true;
        pendingStart = false;
        el.muted = false;
        try{
          await el.play();
          error = "";
        }catch(_err){
          error = "Tap once, then press Music On again";
        }
        emit();
      }
      window.removeEventListener("pointerdown", once);
      window.removeEventListener("touchstart", once);
      window.removeEventListener("keydown", once);
    };
    window.addEventListener("pointerdown", once, { passive: true });
    window.addEventListener("touchstart", once, { passive: true });
    window.addEventListener("keydown", once);
    setTimeout(()=>prime(), 60);
  }

  function loadCurrent(keepPlaying = false){
    const el = ensureAudio();
    if (!el) return;
    const wasPlaying = keepPlaying || !el.paused;
    el.src = current().url;
    el.load();
    if (primed || enabled || wasPlaying){
      el.play().then(()=>{
        el.muted = !enabled;
        error = "";
        emit();
      }).catch(()=>{
        error = "Tap once to unlock audio";
        emit();
      });
      return;
    }
    emit();
  }

  async function toggle(){
    if (!tracks.length){ emit(); return false; }
    const el = ensureAudio();
    if (!primed) await prime();
    enabled = !enabled;
    if (enabled){
      el.muted = false;
      try{
        if (!el.src) el.src = current().url;
        if (el.paused) { try { el.currentTime = 0; } catch(_e) {} }
        await el.play();
        error = "";
        pendingStart = false;
      }catch(_err){
        pendingStart = true;
        error = "Tap once to unlock audio";
      }
    }else{
      pendingStart = false;
      el.muted = true;
      el.pause();
      error = "";
    }
    emit();
    return enabled;
  }

  async function next(){
    if (!tracks.length) return;
    index = (index + 1) % tracks.length;
    loadCurrent(enabled || pendingStart);
    if ((enabled || pendingStart) && audio){
      audio.muted = !enabled;
      await audio.play().then(()=>{
        error = "";
      }).catch(()=>{
        pendingStart = true;
        error = "Tap once to unlock audio";
        emit();
      });
    }
    emit();
  }

  async function start(){
    if (!tracks.length) return false;
    enabled = true;
    pendingStart = false;
    const el = ensureAudio();
    if (!primed) await prime();
    try{
      el.muted = false;
      if (!el.src) el.src = current().url;
      await el.play();
      error = "";
      emit();
      return true;
    }catch(_err){
      pendingStart = true;
      error = "Tap once to unlock audio";
      emit();
      return false;
    }
  }

  function stop(){
    enabled = false;
    if (audio){
      audio.muted = true;
      audio.pause();
    }
    emit();
  }

  bindUnlocks();
  emit();
  return { toggle, next, start, stop, getState: state, prime };
}
