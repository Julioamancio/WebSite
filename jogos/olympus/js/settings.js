/* settings.js — player options kept in the browser: music and sound-effect volume (0-10), fullscreen,
   and whether the HOW TO PLAY screen was already shown. F toggles fullscreen from the keyboard. */
(function (O) {
  'use strict';
  const KEY = 'orpheus_settings_v1';
  const S = O.Settings = { music: 7, sfx: 8, seenHowto: false };
  try { Object.assign(S, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* storage blocked */ }

  S.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify({ music: S.music, sfx: S.sfx, seenHowto: S.seenHowto })); } catch (e) { /* storage blocked */ }
  };
  S.apply = function () {
    const A = O.Audio;
    if (A && A.musicBus) A.musicBus.gain.value = 0.8 * (S.music / 10);
    if (A && A.sfxBus) A.sfxBus.gain.value = S.sfx / 10;
  };
  // the audio buses only exist after the first user gesture
  const init = O.Audio.init;
  O.Audio.init = function () { const r = init.apply(this, arguments); S.apply(); return r; };

  const root = document.documentElement;
  S.canFull = !!(root.requestFullscreen || root.webkitRequestFullscreen);
  S.isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  S.toggleFull = function () {
    try {
      if (S.isFull()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const p = (root.requestFullscreen || root.webkitRequestFullscreen).call(root);
      const lock = () => { if (document.body.classList.contains('touch') && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {}); };
      if (p && p.then) p.then(lock).catch(() => {}); else lock();
    } catch (e) { /* not allowed here (iPhone Safari has no fullscreen for pages) */ }
  };
  window.addEventListener('keydown', (e) => { if (e.code === 'KeyF' && !e.repeat) S.toggleFull(); });
  ['fullscreenchange', 'webkitfullscreenchange'].forEach((ev) => document.addEventListener(ev, () => window.dispatchEvent(new Event('resize'))));
})(window.OLY);
