// js/scarlett1/modules/radio.js
import { qs } from './utils.js';

let _audio = null;
let _playing = false;

// Curated demo-safe stations. Replace/extend freely.
// (Some streams can change over time; keep your own authoritative list if needed.)
const STATIONS = [
  { id:'soma_groovesalad', name:'SomaFM: Groove Salad', url:'https://ice1.somafm.com/groovesalad-128-mp3' },
  { id:'soma_synthwave', name:'SomaFM: Synthwave', url:'https://ice1.somafm.com/synthwave-128-mp3' },
  { id:'radioparadise', name:'Radio Paradise (Main)', url:'https://stream.radioparadise.com/mp3-128' },
];

function ensureAudio() {
  if (_audio) return _audio;
  _audio = new Audio();
  _audio.crossOrigin = 'anonymous';
  _audio.loop = true;
  _audio.volume = 0.55;
  _audio.addEventListener('error', () => console.warn('[radio] stream error'));
  return _audio;
}

export const radio = {
  stations: STATIONS,
  setStationById(id) {
    const s = STATIONS.find(x => x.id === id) || STATIONS[0];
    const a = ensureAudio();
    a.src = s.url;
    console.log('[radio] station=', s.name);
    if (_playing) a.play().catch(()=>{});
    return s;
  },
  toggle() {
    const a = ensureAudio();
    if (!a.src) this.setStationById(STATIONS[0].id);
    _playing = !_playing;
    if (_playing) a.play().catch(()=>{ _playing=false; });
    else a.pause();
    return _playing;
  },
  stop() {
    if (!_audio) return;
    _playing = false;
    _audio.pause();
  },
  isPlaying() { return _playing; }
};
