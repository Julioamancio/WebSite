/* main.js — boot, screen scaling and fixed 60 FPS loop.
   HD: the canvas is 1920x1080 and every frame is drawn in game units (384x216) under a xS transform,
   so physics, levels and hitboxes keep their units while the 2.5D art keeps its resolution. */
(function (O) {
  'use strict';
  const canvas = document.getElementById('screen');
  const S = O.S || 1;
  canvas.width = O.W * S; canvas.height = O.H * S;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  // Anyone who resets the transform must come back to game units (see sky.js).
  O.baseTransform = (c) => c.setTransform(S, 0, 0, S, 0, 0);

  O.bootArt();
  let game = null;

  const isTouch = () => document.body.classList.contains('touch');
  function resize() {
    const vw = window.innerWidth;
    const vh = window.innerHeight - (isTouch() && vw < window.innerHeight ? 190 : 0);
    const s = Math.max(0.5, Math.min(vw / O.W, vh / O.H));
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
    if (game && document.hidden && game.state === 'play' && !game.dialog && !game.trans) game.state = 'pause';
  });
  resize();

  // Loading screen while the HD art arrives (drawn in game units too).
  let dots = 0;
  const loading = setInterval(() => {
    O.baseTransform(ctx);
    ctx.fillStyle = '#05060c'; ctx.fillRect(0, 0, O.W, O.H);
    O.textCenter(ctx, 'LOADING' + '...'.slice(0, (dots++ % 4)), 104, '#e3b862');
  }, 250);

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
    O.baseTransform(ctx);
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    try { game.draw(); } catch (e) { O.logOnce('draw', e); }
    requestAnimationFrame(frame);
  }

  const start = () => {
    clearInterval(loading);
    game = O.game = new O.Game(ctx);
    O.Input.bindTouch(document.getElementById('touch'));
    last = performance.now();
    requestAnimationFrame(frame);
  };
  (O.HD && O.HD.load ? O.HD.load() : Promise.resolve()).then(start, start);
})(window.OLY);
