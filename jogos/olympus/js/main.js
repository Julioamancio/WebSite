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
  // Desktop: the picture fills the window. Touch: the controls never cover the picture —
  // landscape puts them in columns left and right of it (START / fullscreen in a strip below),
  // portrait puts the picture on top and the controls underneath.
  const place = (el, css) => { if (el) Object.assign(el.style, { left: '', right: '', top: '', bottom: '', transform: '' }, css); };
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight, cs = canvas.style;
    if (!isTouch()) {
      const s = Math.max(0.5, Math.min(vw / O.W, vh / O.H));
      cs.width = Math.round(O.W * s) + 'px'; cs.height = Math.round(O.H * s) + 'px'; cs.marginTop = '';
      return;
    }
    const T = document.getElementById('touch');
    const pad = Math.round(O.clamp(Math.min(vw, vh) * 0.3, 96, 150)), ab = Math.round(pad * 1.06);
    T.style.setProperty('--pad', pad + 'px'); T.style.setProperty('--ab', ab + 'px');
    const dpad = T.querySelector('.dpad'), abx = T.querySelector('.ab'), mid = T.querySelector('.mid');
    let w, h, top;
    if (vw >= vh) {
      const side = Math.max(pad, ab) + 24, strip = 46;
      const s = Math.min((vw - 2 * side) / O.W, (vh - strip) / O.H);
      w = O.W * s; h = O.H * s; top = Math.max(4, (vh - strip - h) / 2);
      const cy = top + h / 2;
      place(dpad, { left: Math.round((side - pad) / 2) + 'px', top: Math.round(cy - pad / 2) + 'px' });
      place(abx, { right: Math.round((side - ab) / 2) + 'px', top: Math.round(cy - ab / 2) + 'px' });
      place(mid, { left: '50%', bottom: '6px', transform: 'translateX(-50%)' });
    } else {
      const s = vw / O.W;
      w = vw; h = O.H * s; top = 8;
      const cy = top + h + (vh - top - h - 50) / 2;
      place(dpad, { left: '14px', top: Math.round(cy - pad / 2) + 'px' });
      place(abx, { right: '14px', top: Math.round(cy - ab / 2) + 'px' });
      place(mid, { left: '50%', bottom: '14px', transform: 'translateX(-50%)' });
    }
    cs.width = Math.round(w) + 'px'; cs.height = Math.round(h) + 'px'; cs.marginTop = Math.round(top) + 'px';
  }
  const fsBtn = document.querySelector('#touch .fs');
  if (fsBtn) fsBtn.addEventListener('click', (e) => { e.preventDefault(); O.Settings.toggleFull(); });
  if (!O.Settings.canFull) document.body.classList.add('nofs');
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
