export function createAudioPlaylist({ tracks = [], onState = ()=>{} } = {}){
  const state = {
    enabled: false,
    primed: false,
    trackIndex: 0,
    trackTitle: "Lobby music disabled",
    trackCount: 0,
    error: ""
  };

  function emit(){
    try { onState({ ...state }); } catch(_e) {}
  }

  async function toggle(){
    state.enabled = false;
    emit();
    return false;
  }

  async function next(){
    state.enabled = false;
    emit();
    return false;
  }

  async function start(){
    state.enabled = false;
    emit();
    return false;
  }

  function stop(){
    state.enabled = false;
    try {
      document.querySelectorAll("audio, video").forEach((el)=>{
        el.pause();
        el.muted = true;
        el.volume = 0;
      });
    } catch(_e) {}
    emit();
  }

  function prime(){
    state.primed = false;
    emit();
    return false;
  }

  function getState(){
    return { ...state };
  }

  stop();
  return { toggle, next, start, stop, getState, prime };
}
