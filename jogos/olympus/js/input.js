/* input.js — keyboard, gamepad and touch controls unified into NES-style actions */
(function (O) {
  'use strict';

  const KEYMAP = {
    ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
    KeyX: 'jump', KeyK: 'jump', Space: 'jump',
    KeyZ: 'attack', KeyJ: 'attack',
    Enter: 'start', KeyP: 'start', Escape: 'start'
  };
  const ACTIONS = ['left', 'right', 'up', 'down', 'jump', 'attack', 'start'];

  const I = O.Input = { down: {}, pressed: {}, kb: {}, touch: {}, pad: {}, latch: {}, prev: {} };
  ACTIONS.forEach((a) => { I.down[a] = I.pressed[a] = I.kb[a] = I.touch[a] = I.pad[a] = I.latch[a] = I.prev[a] = false; });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyM' && !e.repeat) O.Audio.toggleMute();
    const a = KEYMAP[e.code];
    if (!a) return;
    e.preventDefault();
    O.Audio.init();
    if (!e.repeat) I.latch[a] = true;
    I.kb[a] = true;
  });
  window.addEventListener('keyup', (e) => {
    const a = KEYMAP[e.code];
    if (a) { I.kb[a] = false; e.preventDefault(); }
  });
  window.addEventListener('blur', () => { ACTIONS.forEach((a) => { I.kb[a] = false; I.touch[a] = false; }); });

  function pollPad() {
    ACTIONS.forEach((a) => { I.pad[a] = false; });
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (let i = 0; i < pads.length; i++) {
      const p = pads[i];
      if (!p) continue;
      const b = (n) => !!(p.buttons[n] && p.buttons[n].pressed);
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      I.pad.left = I.pad.left || b(14) || ax < -0.5;
      I.pad.right = I.pad.right || b(15) || ax > 0.5;
      I.pad.up = I.pad.up || b(12) || ay < -0.5;
      I.pad.down = I.pad.down || b(13) || ay > 0.5;
      I.pad.jump = I.pad.jump || b(0);
      I.pad.attack = I.pad.attack || b(2) || b(1);
      I.pad.start = I.pad.start || b(9);
    }
  }

  // Called once per fixed update step.
  I.update = function () {
    pollPad();
    ACTIONS.forEach((a) => {
      const cur = I.kb[a] || I.touch[a] || I.pad[a];
      I.pressed[a] = (cur && !I.prev[a]) || I.latch[a];
      I.down[a] = cur || I.latch[a];
      I.prev[a] = cur;
      I.latch[a] = false;
    });
  };

  // On-screen controls: 8-direction D-pad + A/B/START buttons.
  I.bindTouch = function (root) {
    if (!root) return;
    const dpad = root.querySelector('.dpad');
    const setDir = (dx, dy) => {
      ['left', 'right', 'up', 'down'].forEach((k) => { I.touch[k] = false; });
      if (Math.hypot(dx, dy) < 12) return;
      const sector = (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8;
      const map = [['right'], ['right', 'down'], ['down'], ['down', 'left'], ['left'], ['left', 'up'], ['up'], ['up', 'right']];
      map[sector].forEach((k) => { if (!I.prev[k]) I.latch[k] = true; I.touch[k] = true; });
    };
    const fromEvent = (e) => {
      const r = dpad.getBoundingClientRect();
      setDir(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    };
    dpad.addEventListener('pointerdown', (e) => { e.preventDefault(); dpad.setPointerCapture(e.pointerId); fromEvent(e); });
    dpad.addEventListener('pointermove', (e) => { if (dpad.hasPointerCapture(e.pointerId)) fromEvent(e); });
    const release = () => setDir(0, 0);
    dpad.addEventListener('pointerup', release);
    dpad.addEventListener('pointercancel', release);

    root.querySelectorAll('button[data-k]').forEach((btn) => {
      const k = btn.dataset.k;
      btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        O.Audio.init();
        I.touch[k] = true; I.latch[k] = true;
        btn.classList.add('on');
      });
      const up = () => { I.touch[k] = false; btn.classList.remove('on'); };
      btn.addEventListener('pointerup', up);
      btn.addEventListener('pointerleave', up);
      btn.addEventListener('pointercancel', up);
    });
  };
})(window.OLY);
