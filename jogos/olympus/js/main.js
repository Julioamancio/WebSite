/* main.js — boot, screen scaling and fixed 60 FPS loop */
(function (O) {
  'use strict';
  const canvas = document.getElementById('screen');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  O.bootArt();
  const game = O.game = new O.Game(ctx);
  O.Input.bindTouch(document.getElementById('touch'));

  const isTouch = () => document.body.classList.contains('touch');
  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight - (isTouch() && vw < window.innerHeight ? 190 : 0);
    let s = Math.min(vw / O.W, vh / O.H);
    if (s >= 2) s = Math.floor(s);
    s = Math.max(1, s);
    canvas.style.width = Math.round(O.W * s) + 'px';
    canvas.style.height = Math.round(O.H * s) + 'px';
  }
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) document.body.classList.add('touch');
  window.addEventListener('resize', resize);
  window.addEventListener('pointerdown', (e) => {
    O.Audio.init();
    if (e.pointerType === 'touch' && !isTouch()) { document.body.classList.add('touch'); resize(); }
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && game.state === 'play' && !game.dialog && !game.trans) game.state = 'pause';
  });
  resize();

  const STEP = 1000 / 60;
  let last = performance.now(), acc = 0;
  function frame(now) {
    acc += Math.min(100, now - last);
    last = now;
    while (acc >= STEP) {
      O.Input.update();
      try { game.update(); } catch (e) { O.logOnce('update', e); }
      acc -= STEP;
    }
    try { game.draw(); } catch (e) { O.logOnce('draw', e); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})(window.OLY);
