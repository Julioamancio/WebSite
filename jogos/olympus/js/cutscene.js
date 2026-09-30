/* cutscene.js — cinematic cutscenes drawn by the engine with the HD art (Flow scenery + AutoSprite frames).
   Story and shot list: docs/CUTSCENES.md (tools/cutscenes.js). English text appears in the letterbox bar.
   A cutscene is a list of shots; each shot has a background (a Flow image with a moving camera, a parallax level
   or darkness), actors (animated sprite frames that move, rise, sink, glow) and timed effects.
   Controls: A/B = next shot, START = skip the whole cutscene. */
(function (O) {
  'use strict';
  const W = O.W, H = O.H, FLOOR = 11 * O.TILE + O.VIEW_Y, BAR = 24, DT = 1 / 60;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v), lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const win = (t, a, b) => clamp((t - a) / Math.max(0.0001, b - a), 0, 1); // 0..1 progress of t inside [a, b]
  const SC = () => O.S || 1;

  /* ================= SHOTS ================= */
  // Image coordinates are fractions of the square Flow image; `units` shots use game units (x, feet y).
  const HERO = (s, x, y, o) => Object.assign({ s, x, y }, o || {});
  // Camera centred at x with zoom z, placed so a figure standing on ground line gy has its feet just above the letterbox.
  const C = (x, gy, z) => [x, gy - 64 / (W * (z || 1)), z || 1];
  const CS = {
    cs1: [
      { bg: 'titulo', dur: 10, cam: [C(0.45, 0.535, 1.0), C(0.28, 0.535, 1.35)], music: 'title', fadeIn: 1.2,
        actors: [HERO('lyre_play', 0.25, 0.535, { n: 8, fps: 7, sc: 0.7 })],
        fx: [{ k: 'notes', x: 0.268, y: 0.49, t0: 1 }, { k: 'birds', t0: 2 }],
        text: [[0.8, 'Long ago, in the green hills of Arcadia, there lived a young musician named Orpheus.'],
               [5.2, 'When he played his golden lyre, rivers stopped to listen and trees began to dance.']] },
      { bg: 'titulo', dur: 8, cam: C(0.28, 0.535, 1.4), fadeOut: 1.2,
        actors: [HERO('lyre_play', 0.25, 0.535, { n: 8, fps: 7, sc: 0.7 }),
                 HERO('eurydice_walk', [0.45, 0.305], 0.535, { n: 8, fps: 10, sc: 0.7, flip: true, move: [0.3, 4.3], t1: 4.3 }),
                 HERO('eurydice_idle', 0.305, 0.535, { n: 4, fps: 4, sc: 0.7, flip: true, t0: 4.3 })],
        fx: [{ k: 'notes', x: 0.268, y: 0.49 }, { k: 'hearts', x: 0.285, y: 0.47, t0: 4.6 }],
        text: [[1, 'And his heart belonged to the gentle Eurydice.']] }
    ],
    cs2: [
      { bg: 'historia_casamento', dur: 9, cam: [C(0.48, 0.745, 1.25), C(0.5, 0.745, 1.4)], music: 'village', fadeIn: 1, fadeOut: 1,
        actors: [HERO('lyre_play', 0.44, 0.745, { n: 8, fps: 4, sc: 0.95 }),
                 HERO('eurydice_idle', 0.5, 0.745, { n: 4, fps: 4, flip: true, sc: 0.95 }),
                 HERO('elder_talk', 0.575, 0.74, { n: 6, fps: 6, flip: true, sc: 0.9 })],
        fx: [{ k: 'petals', t0: 1 }],
        text: [[1, 'On a bright spring day, Orpheus and Eurydice were married under the old olive tree.']] }
    ],
    cs3: [
      { bg: 'historia_serpente', dur: 7, cam: [C(0.42, 0.705, 1.1), C(0.38, 0.705, 1.3)], music: null, fadeIn: 1,
        actors: [HERO('eurydice_idle', 0.33, 0.705, { n: 4, fps: 3, flip: true })],
        fx: [{ k: 'night', a: 0.25 }, { k: 'serpent', x: [0.78, 0.4], y: 0.71, t0: 1.5, t1: 7 }],
        text: [[0.8, 'But at sunset, a serpent made of shadows crawled out of the ground...']] },
      { bg: 'historia_serpente', dur: 6.5, cam: C(0.42, 0.705, 1.3), fadeOut: 1,
        actors: [HERO('eurydice_idle', 0.33, 0.705, { n: 4, fps: 3, flip: true, sink: [1.2, 4.5] }),
                 HERO('lyre_drop', [0.62, 0.42], 0.705, { n: 28, fps: 9, once: true, loopFrom: 18, flip: true, move: [2.9, 6.2], t0: 0.4 })],
        fx: [{ k: 'night', a: 0.3 }, { k: 'serpent', x: 0.4, y: 0.71, t0: 0, t1: 0.6 }, { k: 'puff', x: 0.345, y: 0.7, t0: 0.6 }],
        sfx: [[0.6, 'hurt']] }
    ],
    cs4: [
      { bg: 'historia_serpente', dur: 7.5, cam: C(0.42, 0.71, 1.2), music: null, fadeIn: 0.8,
        actors: [HERO('hades_idle', 0.47, 0.71, { n: 4, fps: 3, flip: true, rise: [1, 3.4] }),
                 HERO('eurydice_idle', [0.33, 0.43], [0.71, 0.6], { n: 4, fps: 3, ghost: true, move: [3, 6.8], t0: 2.6, alpha: 0.85 })],
        fx: [{ k: 'night', a: 0.62 }, { k: 'crack', x: [0.3, 0.55], y: 0.712, t0: 0.3 }],
        sfx: [[0.4, 'crash']],
        text: [[0.6, "The serpent was sent by Hades, the King of the Underworld. He took Eurydice's soul down to the dark halls of Tartarus."]] },
      { bg: 'historia_serpente', dur: 7, cam: C(0.42, 0.71, 1.35),
        actors: [HERO('hades_talk', 0.47, 0.71, { n: 6, fps: 5, flip: true }),
                 HERO('lyre_kneel', 0.3, 0.71, { n: 28, fps: 8, once: true })],
        fx: [{ k: 'night', a: 0.62 }, { k: 'crack', x: [0.3, 0.55], y: 0.712, t0: -9 }, { k: 'strings', x: 0.318, y: 0.64, t0: 2.4 }],
        sfx: [[2.4, 'swing']],
        text: [[1.4, 'Then he broke the golden lyre. Its seven strings flew across Greece like falling stars...']] },
      { bg: 'historia_serpente', dur: 6.5, cam: [C(0.42, 0.71, 1.35), C(0.42, 0.71, 1.0)], fadeOut: 1.3,
        actors: [HERO('hades_idle', 0.47, 0.71, { n: 4, fps: 3, flip: true, sink: [0.2, 2.2] }),
                 HERO('lyre_kneel_27', 0.3, 0.71, {})],
        fx: [{ k: 'night', a: 0.55 }, { k: 'crack', x: [0.3, 0.55], y: 0.712, t0: -9, close: [2, 3.2] }, { k: 'desat', a: [0, 1], t0: 1.5, t1: 5.5 }],
        text: [[2, '...and the colors of the world began to fade.']] }
    ],
    cs5: [
      { bg: 'historia_juramento', dur: 11, cam: [C(0.28, 0.6, 1.3), C(0.42, 0.625, 1.1)], music: 'title', fadeIn: 1.2, fadeOut: 1.4,
        actors: [HERO('lyre_play_0', 0.2, 0.6, { t1: 3.4 }),
                 HERO('lyre_walk', [0.2, 0.4], [0.6, 0.625], { n: 16, fps: 10, move: [3.4, 11], t0: 3.4 })],
        fx: [{ k: 'desat', a: [0.55, 0.3], t0: 0, t1: 10 }, { k: 'spark', x: 0.64, y: 0.62, t0: 1 }],
        text: [[0.6, 'At dawn, Orpheus made a promise:'], [3.6, '"I will find the seven strings. I will play our song again. And I will bring you home."']] }
    ],
    zeus: [
      { bg: 'templo_zeus', dur: 6, cam: [C(0.5, 0.93, 1.0), C(0.52, 0.93, 1.15)], music: 'temple', fadeIn: 0.6, fadeOut: 0.6,
        actors: [HERO('hero_walk', [0.1, 0.32], 0.93, { n: 8, fps: 10, move: [0, 2.4], t1: 2.4 }),
                 HERO('hero_idle', 0.32, 0.93, { n: 4, fps: 4, t0: 2.4 }),
                 HERO('zeus_idle', 0.63, 0.915, { n: 4, fps: 3, flip: true, t0: 2.9, fadeIn: 0.5, aura: '255,214,130', sc: 1 })],
        fx: [{ k: 'lightning', x: 0.63, t0: 2.8 }],
        sfx: [[2.8, 'crash']] }
    ],
    boar: [
      { bg: 'caverna_fundo', dur: 7.5, cam: [C(0.5, 0.81, 1.0), C(0.6, 0.81, 1.2)], music: null, fadeIn: 0.6, fadeOut: 0.6,
        actors: [HERO('hero_idle', 0.28, 0.81, { n: 4, fps: 4 }),
                 HERO('boar_run', [1.05, 0.72], 0.81, { n: 6, fps: 12, flip: true, move: [0.4, 2.4], t1: 2.4, id: 'boarA', sc: 1.25 }),
                 HERO('boar_paw', 0.72, 0.81, { n: 4, fps: 6, flip: true, t0: 2.4, id: 'boarB', sc: 1.25 })],
        fx: [{ k: 'steam', actor: 'boarB', t0: 2.4 }, { k: 'glint', actor: 'boarA' }, { k: 'glint', actor: 'boarB' },
             { k: 'title', text: 'THE ERYMANTHIAN BOAR', t0: 4.2, t1: 7.4 }],
        sfx: [[2.5, 'roar'], [0.6, 'rock']],
        text: [[0.5, 'Deep in the forest, the first string shone on the tusk of a monster.']] }
    ],
    string1: [
      { bg: 'caverna_fundo', dur: 7, cam: C(0.52, 0.81, 1.15), music: 'fanfare', fadeIn: 0.5,
        actors: [HERO('hero_idle', 0.32, 0.81, { n: 4, fps: 4 }),
                 HERO('boar_stun', 0.64, 0.81, { n: 4, fps: 5, flip: true, sc: [1.25, 0.35], scaleWin: [0.6, 3.2], glow: [0.6, 3.2], t1: 3.3, id: 'boarS' }),
                 HERO('boar_run', [0.64, 1.1], 0.81, { n: 6, fps: 14, sc: 0.35, move: [3.3, 5.3], t0: 3.3 })],
        fx: [{ k: 'glint', actor: 'boarS' }, { k: 'fly', x: [0.6, 0.345], y: [0.745, 0.73], t0: 3.2, t1: 6 }],
        sfx: [[3.3, 'bat']],
        text: [[3.3, 'The first string came home.']] },
      { bg: 'level:forest', pan: [300, 340], dur: 8, fadeOut: 1,
        actors: [HERO('lyre_play', 180, FLOOR, { n: 8, fps: 6, units: true })],
        fx: [{ k: 'desat', a: 1, t0: 0, t1: 1.4 }, { k: 'wave', x: 190, y: 150, t0: 1.4, t1: 5.5, units: true },
             { k: 'bignote', x: 196, y: 150, t0: 1.3, units: true }, { k: 'fireflies', t0: 2.5 }],
        sfx: [[1.3, 'select']],
        text: [[1, 'One clear note rang out, and color returned to the forest.']] }
    ],
    hermes: [
      { bg: 'santuario_hermes', dur: 7, cam: [C(0.5, 0.86, 1.0), C(0.52, 0.86, 1.1)], music: 'temple', fadeIn: 0.6, fadeOut: 0.6,
        actors: [HERO('hero_idle', 0.3, 0.86, { n: 4, fps: 4 }),
                 HERO('hermes_idle', 0.62, [0.45, 0.86], { n: 4, fps: 6, flip: true, move: [0.6, 2.6], t1: 3, aura: '170,215,255' }),
                 HERO('hermes_talk', 0.62, 0.86, { n: 6, fps: 7, flip: true, t0: 3, aura: '170,215,255' })],
        fx: [{ k: 'feathers', t0: 0 }, { k: 'spark', x: 0.585, y: 0.78, t0: 4 }],
        sfx: [[2.6, 'jump']] }
    ],
    end: [
      { bg: 'level:village', pan: [0, 520], dur: 7, music: 'title', fadeIn: 0.8,
        actors: [HERO('run', 176, FLOOR, { units: true, runner: true, sc: 1.35 })],
        text: [[0.6, 'With the winged sandals, Orpheus set out for Attica.']] },
      { bg: 'submundo', dur: 8.5, cam: [C(0.5, 0.83, 1.0), C(0.42, 0.83, 1.2)], music: null, fadeIn: 0.8,
        actors: [HERO('hades_idle', 0.38, 0.83, { n: 4, fps: 3 })],
        fx: [{ k: 'pool', x: 0.58, y: 0.85 }, { k: 'tear', x: 0.64, y: 0.55, t0: 5 }],
        text: [[0.6, 'Far below, in the silent Underworld, the King was watching...'], [4.2, '...and his Queen wept for a spring she could not see.']] },
      { bg: 'dark', dur: 10, fadeIn: 1, fadeOut: 1.5,
        actors: [HERO('eurydice_idle', 192, 176, { n: 4, fps: 2, units: true, ghost: true, alpha: 0.9 })],
        fx: [{ k: 'hum', x: 200, y: 120, t0: 2, units: true }, { k: 'spark', x: 222, y: 150, t0: 4, units: true },
             { k: 'title', text: 'END OF PART 1', t0: 6.5, t1: 10, y: 62 }],
        text: [[0.8, 'And in the darkest hall of Tartarus, Eurydice began to hum a song she had not forgotten.']] }
    ]
  };

  /* ================= ENGINE ================= */
  const Cut = O.Cutscene = { data: CS };
  let st = null; // { shots, i, t, done, parts, rng }

  Cut.available = () => !!(O.HD && O.HD.on && O.SPR.lyre_play_0 && O.SPR.lyre_play_0.hd);
  Cut.start = function (g, names, done) {
    const shots = [];
    names.forEach((n) => (CS[n] || []).forEach((s) => shots.push(s)));
    if (!shots.length || !Cut.available()) { if (done) done(); return false; }
    st = { shots, i: 0, t: 0, done, parts: [], prevState: g.state };
    g.state = 'cut';
    enterShot(g);
    return true;
  };
  function enterShot(g) {
    const s = st.shots[st.i];
    st.t = 0; st.parts = []; st.fired = {};
    if (s.music !== undefined) g.music(s.music);
  }
  function finish(g) {
    const d = st.done;
    st = null;
    g.state = 'play';
    if (d) d();
  }
  Cut.update = function (g) {
    if (!st) { g.state = 'play'; return; }
    const I = g.I, s = st.shots[st.i];
    if (I.pressed.start) { g.trans = { t: 0, dir: 1, cb: () => finish(g) }; return; }
    st.t += DT;
    (s.sfx || []).forEach(([t, n], k) => { if (!st.fired[k] && st.t >= t) { st.fired[k] = 1; g.sfx(n); } });
    stepParticles(s);
    if (st.t >= s.dur || ((I.pressed.jump || I.pressed.attack) && st.t > 0.8)) {
      st.i++;
      if (st.i >= st.shots.length) finish(g); else enterShot(g);
    }
  };

  /* ----- camera & projection ----- */
  function camAt(s, u) {
    const c = s.cam || [0.5, 0.5, 1], a = Array.isArray(c[0]) ? c[0] : c, b = Array.isArray(c[0]) ? c[1] : c, e = ease(u);
    const cam = { x: lerp(a[0], b[0], e), y: lerp(a[1], b[1], e), z: lerp(a[2] || 1, b[2] || 1, e) };
    const im = O.HD.img[s.bg];
    if (im) {
      const sc = (W / im.width) * cam.z, hw = W / 2 / sc / im.width, hh = H / 2 / sc / im.height;
      cam.x = clamp(cam.x, hw, 1 - hw); cam.y = clamp(cam.y, hh, 1 - hh); cam.s = sc; cam.im = im;
    }
    return cam;
  }
  function P(s, cam, x, y, units) {
    if (units || !cam.im) return { x, y, k: 1 };
    const im = cam.im;
    return { x: W / 2 + (x - cam.x) * im.width * cam.s, y: H / 2 + (y - cam.y) * im.height * cam.s, k: cam.z };
  }
  const vAt = (v, u) => (Array.isArray(v) ? lerp(v[0], v[1], ease(u)) : v);

  /* ----- drawing ----- */
  Cut.draw = function (c, g) {
    if (!st) return;
    const s = st.shots[st.i], t = st.t, u = t / s.dur;
    c.save();
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const cam = drawBg(c, g, s, u, t);
    // effects that sit behind the actors
    (s.fx || []).forEach((f) => { if (BEHIND[f.k]) BEHIND[f.k](c, s, f, cam, t); });
    const pos = {};
    (s.actors || []).forEach((a) => { const p = drawActor(c, s, a, cam, t); if (a.id && p) pos[a.id] = p; });
    (s.fx || []).forEach((f) => { if (FRONT[f.k]) FRONT[f.k](c, s, f, cam, t, pos); });
    drawParticles(c);
    (s.fx || []).forEach((f) => { if (GRADE[f.k]) GRADE[f.k](c, s, f, cam, t); });
    // letterbox, text, fades
    c.fillStyle = '#000'; c.fillRect(0, 0, W, BAR); c.fillRect(0, H - BAR, W, BAR);
    drawText(c, s, t);
    c.font = '4px Georgia, serif'; c.fillStyle = 'rgba(200,200,215,0.55)'; c.textAlign = 'right'; c.textBaseline = 'middle';
    c.fillText('START: SKIP   A: NEXT', W - 6, BAR / 2);
    let fade = 0;
    if (s.fadeIn) fade = Math.max(fade, 1 - t / s.fadeIn);
    if (s.fadeOut) fade = Math.max(fade, 1 - (s.dur - t) / s.fadeOut);
    if (fade > 0) { c.fillStyle = 'rgba(0,0,0,' + clamp(fade, 0, 1) + ')'; c.fillRect(0, 0, W, H); }
    c.restore();
  };

  const fakeLvl = {};
  function outdoorLevel(id) {
    if (fakeLvl[id]) return fakeLvl[id];
    fakeLvl[id] = { id, theme: id, w: 400, h: O.ROWS, def: {}, tile: (x, y) => (y === 11 ? 'G' : y > 11 && y < O.ROWS ? 'D' : '.') };
    return fakeLvl[id];
  }
  function drawBg(c, g, s, u, t) {
    if (s.bg === 'dark') {
      const gr = c.createRadialGradient(W / 2, H * 0.6, 10, W / 2, H * 0.6, W * 0.6);
      gr.addColorStop(0, '#16223a'); gr.addColorStop(0.5, '#0a0f1e'); gr.addColorStop(1, '#020308');
      c.fillStyle = gr; c.fillRect(0, 0, W, H);
      c.strokeStyle = 'rgba(120,200,255,0.12)'; c.lineWidth = 0.6;
      for (let i = 0; i < 5; i++) { // faint chains of light
        const x = 40 + i * 76 + Math.sin(t * 0.3 + i) * 3;
        c.beginPath(); for (let y = 0; y < H; y += 6) c.lineTo(x + Math.sin(y * 0.1 + i) * 2, y); c.stroke();
      }
      return { units: true };
    }
    if (s.bg.indexOf('level:') === 0) {
      const id = s.bg.slice(6), cam = lerp(s.pan[0], s.pan[1], u);
      const fg = { lvl: outdoorLevel(id), cam, t: g.t };
      O.HD.drawBackground(c, fg);
      O.HD.drawGround(c, fg);
      return { units: true, cam };
    }
    const cam = camAt(s, u);
    if (cam.im) c.drawImage(cam.im, W / 2 - cam.x * cam.im.width * cam.s, H / 2 - cam.y * cam.im.height * cam.s, cam.im.width * cam.s, cam.im.height * cam.s);
    return cam;
  }

  function frameName(a, t) {
    if (!a.n) return a.s;
    const lt = t - (a.t0 || 0);
    let i = Math.floor(lt * (a.fps || 8));
    if (a.once) { if (i >= a.n) i = a.loopFrom !== undefined ? a.loopFrom + ((i - a.n) % (a.n - a.loopFrom)) : a.n - 1; }
    else i = ((i % a.n) + a.n) % a.n;
    return a.s + '_' + i;
  }
  const ghostCv = document.createElement('canvas');
  function drawActor(c, s, a, cam, t) {
    if (a.t0 !== undefined && t < a.t0) return null;
    if (a.t1 !== undefined && t >= a.t1) return null;
    if (a.runner) return drawRunner(c, a, t);
    const e = O.SPR[frameName(a, t)];
    if (!e || !e.hd) return null;
    const mu = a.move ? win(t, a.move[0], a.move[1]) : 0;
    const p = P(s, cam, vAt(a.x, mu), vAt(a.y, mu), a.units || cam.units);
    let k = (a.scaleWin ? vAt(a.sc, win(t, a.scaleWin[0], a.scaleWin[1])) : (a.sc || 1)) * p.k;
    let alpha = a.alpha || 1;
    if (a.fadeIn) alpha *= win(t, a.t0 || 0, (a.t0 || 0) + a.fadeIn);
    let dy = 0, clipY = null;
    if (a.rise) { dy = (1 - ease(win(t, a.rise[0], a.rise[1]))) * e.h * k * 1.05; clipY = p.y; }
    if (a.sink) { dy = ease(win(t, a.sink[0], a.sink[1])) * e.h * k * 1.05; clipY = p.y; }
    if (a.aura) {
      const R = e.h * k * 0.95, cx = p.x, cy = p.y - e.h * k * 0.55;
      const gr = c.createRadialGradient(cx, cy, 1, cx, cy, R);
      gr.addColorStop(0, 'rgba(' + a.aura + ',' + 0.5 * alpha + ')'); gr.addColorStop(1, 'rgba(' + a.aura + ',0)');
      c.save(); c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.fill(); c.restore();
    }
    c.save();
    if (clipY !== null) { c.beginPath(); c.rect(0, 0, W, clipY + 0.5); c.clip(); }
    if (!a.ghost && !a.units && !cam.units && !a.rise && !a.sink) O.HD.shadow(c, p.x, p.y, 11 * k, 0.28 * alpha);
    if (a.ghost) {
      const S = SC(), w = Math.ceil(e.w * k * S) + 4, h = Math.ceil(e.h * k * S) + 4;
      ghostCv.width = w; ghostCv.height = h;
      const gx = ghostCv.getContext('2d');
      gx.imageSmoothingEnabled = true;
      gx.save(); if (a.flip) { gx.translate(w, 0); gx.scale(-1, 1); }
      gx.drawImage(e.img, e.sx, 0, e.sw, e.sh, 2, 2, e.w * k * S, e.h * k * S); gx.restore();
      gx.globalCompositeOperation = 'source-atop'; gx.fillStyle = 'rgba(150,235,255,0.72)'; gx.fillRect(0, 0, w, h);
      const x = p.x - (a.flip ? e.w - e.ax : e.ax) * k, y = p.y + dy - e.ay * k, bob = Math.sin(t * 1.6) * 1.2;
      c.globalAlpha = alpha * (0.75 + Math.sin(t * 2.3) * 0.08);
      c.globalCompositeOperation = 'lighter';
      c.drawImage(ghostCv, x - 2 / S, y + bob - 2 / S, w / S, h / S);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = alpha * 0.35;
      c.drawImage(ghostCv, x - 2 / S, y + bob - 2 / S, w / S, h / S);
    } else {
      c.translate(p.x, p.y + dy); c.scale(k, k);
      O.HD.drawFrame(c, e, 0, 0, !!a.flip, false, alpha);
      if (a.glow) {
        const gk = Math.sin(win(t, a.glow[0], a.glow[1]) * Math.PI * 6) * 0.5 + 0.5, gi = win(t, a.glow[0], a.glow[1]);
        c.globalCompositeOperation = 'lighter'; c.globalAlpha = gi * (0.12 + gk * 0.28);
        c.drawImage(e.white(!!a.flip), a.flip ? -(e.w - e.ax) : -e.ax, -e.ay, e.w, e.h);
      }
    }
    c.restore();
    return { x: p.x, y: p.y + dy, k, e, flip: !!a.flip };
  }
  // End of Part 1: Orpheus runs and leaps with the winged sandals while the world scrolls.
  function drawRunner(c, a, t) {
    const ph = (t * 0.9) % 1, air = ph > 0.55, jy = air ? Math.sin((ph - 0.55) / 0.45 * Math.PI) * 30 : 0;
    const vy = air ? Math.cos((ph - 0.55) / 0.45 * Math.PI) : 0;
    const name = air ? (vy > 0.35 ? 'hero_jump' : vy < -0.35 ? 'hero_fall' : 'hero_peak') : 'hero_run_' + (Math.floor(t * 14) % 8);
    const e = O.SPR[name];
    if (!e) return null;
    const k = a.sc || 1;
    if (!air) O.HD.shadow(c, a.x, a.y, 11 * k, 0.3);
    c.save(); c.translate(a.x, a.y - jy); c.scale(k, k); O.HD.drawFrame(c, e, 0, 0, false, false); c.restore();
    if (air) { // winged-sandal sparkle trail
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 5; i++) { const px = a.x - 4 - i * 5, py = a.y - jy - 2 + i * 1.5; c.fillStyle = 'rgba(255,230,140,' + (0.5 - i * 0.09) + ')'; c.beginPath(); c.arc(px, py, 1.4 - i * 0.2, 0, 7); c.fill(); }
      c.restore();
    }
    return null;
  }

  /* ----- text ----- */
  function wrap(c, text, max) {
    const words = text.split(' '), lines = [];
    let line = '';
    words.forEach((w) => { const tr = line ? line + ' ' + w : w; if (c.measureText(tr).width > max && line) { lines.push(line); line = w; } else line = tr; });
    if (line) lines.push(line);
    return lines;
  }
  function drawText(c, s, t) {
    const items = s.text || [];
    let cur = null;
    items.forEach((it) => { if (t >= it[0]) cur = it; });
    if (!cur) return;
    const shown = cur[1].slice(0, Math.floor((t - cur[0]) * 34));
    c.font = 'italic 6.4px Georgia, "Times New Roman", serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const lines = wrap(c, cur[1], W - 60), full = wrap(c, shown, W - 60);
    const y0 = H - BAR / 2 - (lines.length - 1) * 4;
    full.forEach((l, i) => {
      c.fillStyle = 'rgba(0,0,0,0.8)'; c.fillText(l, W / 2 + 0.4, y0 + i * 8 + 0.4);
      c.fillStyle = '#f4e7c6'; c.fillText(l, W / 2, y0 + i * 8);
    });
  }

  /* ----- particles ----- */
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function stepParticles(s) {
    const t = st.t, parts = st.parts;
    (s.fx || []).forEach((f) => {
      if (f.t0 !== undefined && t < f.t0) return;
      if (f.t1 !== undefined && t > f.t1 && f.k !== 'serpent') return;
      const sp = SPAWN[f.k];
      if (sp) sp(f, parts, t, s);
    });
    for (const p of parts) { p.age += DT; p.x += p.vx * DT; p.y += p.vy * DT; if (p.g) p.vy += p.g * DT; if (p.spin) p.r += p.spin * DT; }
    st.parts = parts.filter((p) => p.age < p.life);
  }
  const SPAWN = {
    notes(f, parts) { if (Math.random() < 0.05) parts.push({ k: 'note', src: f, age: 0, life: 3.2, x: 0, y: 0, vx: rnd(6, 12), vy: rnd(-12, -7), g: 0, ch: Math.random() < 0.5 ? '♪' : '♫', col: '255,220,120' }); },
    hum(f, parts) { if (Math.random() < 0.04) parts.push({ k: 'note', src: f, age: 0, life: 3, x: rnd(-6, 6), y: 0, vx: rnd(-4, 4), vy: rnd(-10, -6), ch: '♪', col: '150,235,255' }); },
    hearts(f, parts) { if (Math.random() < 0.03) parts.push({ k: 'note', src: f, age: 0, life: 2.5, x: rnd(-4, 4), y: 0, vx: rnd(-3, 3), vy: rnd(-9, -6), ch: '♥', col: '255,150,170' }); },
    petals(f, parts) { if (Math.random() < 0.5) parts.push({ k: 'petal', age: 0, life: 9, x: rnd(-20, W + 20), y: -5, vx: rnd(-6, 2), vy: rnd(8, 14), r: rnd(0, 6), spin: rnd(-2, 2) }); },
    feathers(f, parts) { if (Math.random() < 0.08) parts.push({ k: 'feather', age: 0, life: 9, x: rnd(0, W), y: -6, vx: rnd(-4, 4), vy: rnd(5, 9), r: rnd(0, 6), spin: rnd(-1, 1) }); },
    fireflies(f, parts) { if (parts.length < 40 && Math.random() < 0.4) parts.push({ k: 'fly', age: 0, life: 6, x: rnd(0, W), y: rnd(90, 190), vx: rnd(-3, 3), vy: rnd(-6, -2) }); },
    birds(f, parts) { if (parts.filter((p) => p.k === 'bird').length < 5 && Math.random() < 0.01) { const y = rnd(40, 90); for (let i = 0; i < 3; i++) parts.push({ k: 'bird', age: 0, life: 20, x: -10 - i * 7, y: y + i * 3, vx: rnd(14, 18), vy: 0, ph: rnd(0, 6) }); } }
  };
  function drawParticles(c) {
    const s = st.shots[st.i];
    c.save();
    for (const p of st.parts) {
      const a = Math.min(1, p.age * 2, (p.life - p.age) * 1.5);
      if (p.k === 'note') {
        const f = p.src, base = P(s, st.lastCam || {}, f.x, f.y, f.units || (st.lastCam && st.lastCam.units));
        const x = base.x + p.x + p.vx * 0 + Math.sin(p.age * 3) * 2, y = base.y + p.y;
        c.font = '7px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.globalCompositeOperation = 'lighter';
        const gr = c.createRadialGradient(x, y, 0, x, y, 6); gr.addColorStop(0, 'rgba(' + p.col + ',' + 0.4 * a + ')'); gr.addColorStop(1, 'rgba(' + p.col + ',0)');
        c.fillStyle = gr; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill();
        c.globalCompositeOperation = 'source-over'; c.fillStyle = 'rgba(' + p.col + ',' + a + ')'; c.fillText(p.ch, x, y);
      } else if (p.k === 'petal') {
        c.save(); c.translate(p.x + Math.sin(p.age * 2 + p.r) * 4, p.y); c.rotate(p.r); c.fillStyle = 'rgba(255,252,245,' + a + ')';
        c.beginPath(); c.ellipse(0, 0, 1.8, 1, 0, 0, 7); c.fill(); c.restore();
      } else if (p.k === 'feather') {
        c.save(); c.translate(p.x + Math.sin(p.age * 1.5 + p.r) * 6, p.y); c.rotate(Math.sin(p.age * 1.3 + p.r) * 0.8); c.fillStyle = 'rgba(255,255,255,' + 0.9 * a + ')';
        c.beginPath(); c.ellipse(0, 0, 4, 1.1, 0, 0, 7); c.fill(); c.strokeStyle = 'rgba(200,210,230,' + a + ')'; c.lineWidth = 0.3; c.beginPath(); c.moveTo(-4, 0); c.lineTo(4, 0); c.stroke(); c.restore();
      } else if (p.k === 'fly') {
        const gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 5); gr.addColorStop(0, 'rgba(230,255,150,' + a + ')'); gr.addColorStop(1, 'rgba(200,255,120,0)');
        c.globalCompositeOperation = 'lighter'; c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, 5, 0, 7); c.fill(); c.globalCompositeOperation = 'source-over';
      } else if (p.k === 'bird') {
        const w = Math.sin(p.age * 9 + p.ph) * 1.6; c.strokeStyle = 'rgba(40,20,40,' + 0.8 * a + ')'; c.lineWidth = 0.6;
        c.beginPath(); c.moveTo(p.x - 3, p.y - w); c.lineTo(p.x, p.y); c.lineTo(p.x + 3, p.y - w); c.stroke();
      } else if (p.k === 'steam') {
        const r = 2 + p.age * 6; c.fillStyle = 'rgba(230,230,240,' + 0.35 * a + ')'; c.beginPath(); c.arc(p.x, p.y, r, 0, 7); c.fill();
      }
    }
    c.restore();
  }

  /* ----- effects ----- */
  const BEHIND = {
    crack(c, s, f, cam, t) {
      const a = win(t, f.t0, f.t0 + 1.2) * (f.close ? 1 - win(t, f.close[0], f.close[1]) : 1);
      if (a <= 0) return;
      const p0 = P(s, cam, f.x[0], f.y), p1 = P(s, cam, f.x[1], f.y), w = p1.x - p0.x, cx = (p0.x + p1.x) / 2;
      c.save(); c.globalCompositeOperation = 'lighter';
      // cold light rising from the crack: a soft elliptical glow, no hard edges
      c.save(); c.translate(cx, p0.y); c.scale(1, 2.2);
      const beam = c.createRadialGradient(0, 0, 0, 0, 0, w * 0.55);
      beam.addColorStop(0, 'rgba(150,215,255,' + 0.55 * a + ')'); beam.addColorStop(0.45, 'rgba(90,160,255,' + 0.22 * a + ')'); beam.addColorStop(1, 'rgba(60,120,255,0)');
      c.fillStyle = beam; c.beginPath(); c.arc(0, 0, w * 0.55, Math.PI, 0); c.fill(); c.restore();
      // the jagged crack itself
      const r = O.rng(11), pts = [];
      for (let i = 0; i <= 18; i++) pts.push([p0.x + (w * i) / 18, p0.y + (r() - 0.5) * 3.2 * a]);
      [[3.2, 'rgba(90,170,255,' + 0.35 * a + ')'], [1.4, 'rgba(180,235,255,' + a + ')'], [0.5, 'rgba(255,255,255,' + a + ')']].forEach(([lw, col]) => {
        c.strokeStyle = col; c.lineWidth = lw * Math.max(0.3, a); c.lineJoin = 'round';
        c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
      });
      c.restore();
    },
    pool(c, s, f, cam, t) {
      const p = P(s, cam, f.x, f.y), rx = 58 * cam.z, ry = 11 * cam.z;
      c.save();
      const gr = c.createRadialGradient(p.x, p.y, 1, p.x, p.y, rx);
      gr.addColorStop(0, 'rgba(120,230,255,0.85)'); gr.addColorStop(0.7, 'rgba(40,140,200,0.6)'); gr.addColorStop(1, 'rgba(20,60,120,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(p.x, p.y, rx, ry, 0, 0, 7); c.fill();
      c.beginPath(); c.ellipse(p.x, p.y, rx * 0.8, ry * 0.8, 0, 0, 7); c.clip();
      const e = O.SPR['hero_run_' + (Math.floor(t * 12) % 8)];
      if (e) { c.globalAlpha = 0.75; c.translate(p.x + Math.sin(t * 0.6) * 8, p.y + ry * 0.55); c.scale(0.45 * cam.z, 0.32 * cam.z); O.HD.drawFrame(c, e, 0, 0, false, false); }
      c.restore();
    }
  };
  const FRONT = {
    serpent(c, s, f, cam, t) {
      const on = t >= f.t0 && (f.t1 === undefined || t <= f.t1 + 0.4);
      if (!on) return;
      const u = win(t, f.t0, f.t1 === undefined ? f.t0 + 1 : f.t1), hx = vAt(f.x, u), p = P(s, cam, hx, f.y);
      const fade = f.t1 !== undefined && t > f.t1 ? 1 - (t - f.t1) / 0.4 : Math.min(1, (t - f.t0) * 1.5);
      c.save();
      const z = cam.z, seg = (i) => ({ x: p.x + i * 5 * z, y: p.y - 3 * z + Math.sin(t * 5 - i * 0.65) * 2.4 * z - (i < 2 ? (2 - i) * 2.2 * z : 0) });
      // a cold violet rim so the smoke body reads against the dark grass, then the smoke itself
      for (let pass = 0; pass < 2; pass++) {
        for (let i = 16; i >= 0; i--) {
          const q = seg(i), r = (4.2 - i * 0.16) * z * (pass ? 1 : 1.5);
          const gr = c.createRadialGradient(q.x, q.y, 0, q.x, q.y, r);
          if (pass) { gr.addColorStop(0, 'rgba(6,2,14,' + 0.95 * fade + ')'); gr.addColorStop(0.7, 'rgba(20,8,36,' + 0.8 * fade + ')'); gr.addColorStop(1, 'rgba(20,8,36,0)'); }
          else { gr.addColorStop(0.5, 'rgba(150,110,230,' + 0.35 * fade + ')'); gr.addColorStop(1, 'rgba(150,110,230,0)'); }
          c.fillStyle = gr; c.beginPath(); c.arc(q.x, q.y, r, 0, 7); c.fill();
        }
      }
      for (let i = 0; i < 6; i++) { // wisps trailing off the body
        const q = seg(4 + i * 2), ly = q.y - ((t * 8 + i * 5) % 12) * z;
        c.fillStyle = 'rgba(40,20,70,' + 0.35 * fade * (1 - ((t * 8 + i * 5) % 12) / 12) + ')'; c.beginPath(); c.arc(q.x, ly, 1.6 * z, 0, 7); c.fill();
      }
      c.globalCompositeOperation = 'lighter';
      const h = seg(0);
      [[-1.3, -1], [1.1, -1]].forEach(([dx, dy]) => {
        const x = h.x + dx * z, y = h.y + dy * z, gr = c.createRadialGradient(x, y, 0, x, y, 3.2 * z);
        gr.addColorStop(0, 'rgba(190,255,255,' + fade + ')'); gr.addColorStop(0.3, 'rgba(60,220,255,' + 0.7 * fade + ')'); gr.addColorStop(1, 'rgba(0,200,255,0)');
        c.fillStyle = gr; c.beginPath(); c.arc(x, y, 3.2 * z, 0, 7); c.fill();
      });
      c.restore();
    },
    puff(c, s, f, cam, t) {
      const u = win(t, f.t0, f.t0 + 1.4);
      if (u <= 0 || u >= 1) return;
      const p = P(s, cam, f.x, f.y);
      c.save();
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 7, r = (4 + u * 14) * cam.z, x = p.x + Math.cos(a) * r * 0.6, y = p.y - 4 + Math.sin(a) * r * 0.35 - u * 6;
        c.fillStyle = 'rgba(10,6,18,' + 0.55 * (1 - u) + ')'; c.beginPath(); c.arc(x, y, (3 + u * 5) * cam.z, 0, 7); c.fill();
      }
      c.restore();
    },
    strings(c, s, f, cam, t) {
      const lt = t - f.t0;
      if (lt < 0 || lt > 4) return;
      const p = P(s, cam, f.x, f.y);
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) {
        // each string curves away on its own arc, like a falling star shot upward
        const ang = -Math.PI / 2 + (i - 3) * 0.36, sp = 62 + ((i * 37) % 7) * 7, d = lt * sp, bend = (i - 3) * 0.06 * lt;
        const hx = p.x + Math.cos(ang + bend) * d, hy = p.y + Math.sin(ang + bend) * d;
        const tail = Math.min(d, 46);
        const tx = hx - Math.cos(ang + bend * 0.5) * tail, ty = hy - Math.sin(ang + bend * 0.5) * tail;
        [[4.5, 0.22], [1.8, 0.7], [0.7, 1]].forEach(([lw, al]) => {
          const gr = c.createLinearGradient(tx, ty, hx, hy);
          gr.addColorStop(0, 'rgba(255,190,70,0)'); gr.addColorStop(1, 'rgba(255,' + (al > 0.9 ? 250 : 215) + ',' + (al > 0.9 ? 220 : 120) + ',' + al + ')');
          c.strokeStyle = gr; c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(tx, ty); c.lineTo(hx, hy); c.stroke();
        });
        const hg = c.createRadialGradient(hx, hy, 0, hx, hy, 7); hg.addColorStop(0, 'rgba(255,252,230,1)'); hg.addColorStop(0.3, 'rgba(255,220,120,0.6)'); hg.addColorStop(1, 'rgba(255,200,80,0)');
        c.fillStyle = hg; c.beginPath(); c.arc(hx, hy, 7, 0, 7); c.fill();
      }
      if (lt < 0.4) { c.fillStyle = 'rgba(255,240,190,' + (0.4 - lt) + ')'; c.fillRect(0, 0, W, H); }
      c.restore();
    },
    spark(c, s, f, cam, t) {
      if (t < (f.t0 || 0)) return;
      const p = P(s, cam, f.x, f.y, f.units), k = 0.6 + Math.sin(t * 4) * 0.4, R = 7 + k * 5;
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R); gr.addColorStop(0, 'rgba(255,245,200,' + (0.6 + k * 0.4) + ')'); gr.addColorStop(0.3, 'rgba(255,210,90,0.45)'); gr.addColorStop(1, 'rgba(255,190,60,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, R, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,250,220,' + 0.7 * k + ')'; c.lineWidth = 0.5;
      c.beginPath(); c.moveTo(p.x - R, p.y); c.lineTo(p.x + R, p.y); c.moveTo(p.x, p.y - R); c.lineTo(p.x, p.y + R); c.stroke();
      c.restore();
    },
    fly(c, s, f, cam, t) { // the golden string floating from the tusk to Orpheus
      if (t < f.t0 || t > f.t1 + 0.3) return;
      const u = ease(win(t, f.t0, f.t1)), p = P(s, cam, vAt(f.x, u), vAt(f.y, u) - Math.sin(u * Math.PI) * 0.06);
      c.save(); c.globalCompositeOperation = 'lighter';
      c.strokeStyle = 'rgba(255,225,130,0.95)'; c.lineWidth = 0.8; c.beginPath();
      for (let i = 0; i <= 10; i++) { const x = p.x - 7 + i * 1.4, y = p.y + Math.sin(t * 8 + i) * 1.2; if (i) c.lineTo(x, y); else c.moveTo(x, y); }
      c.stroke();
      const gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, 10); gr.addColorStop(0, 'rgba(255,230,150,0.55)'); gr.addColorStop(1, 'rgba(255,200,80,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, 10, 0, 7); c.fill();
      c.restore();
    },
    glint(c, s, f, cam, t, pos) {
      const a = pos[f.actor];
      if (!a) return;
      const dir = a.flip ? -1 : 1, x = a.x + dir * a.e.w * a.k * 0.36, y = a.y - a.e.h * a.k * 0.3, k = 0.5 + Math.sin(t * 5) * 0.5;
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(x, y, 0, x, y, 6); gr.addColorStop(0, 'rgba(255,240,170,' + (0.5 + k * 0.5) + ')'); gr.addColorStop(1, 'rgba(255,200,80,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,215,100,0.9)'; c.lineWidth = 0.5; c.beginPath(); c.ellipse(x, y, 3, 1.4, 0.4, 0, 7); c.stroke();
      c.restore();
    },
    steam(c, s, f, cam, t, pos) {
      const a = pos[f.actor];
      if (!a || t < (f.t0 || 0)) return;
      if (Math.random() < 0.12) {
        const dir = a.flip ? -1 : 1;
        st.parts.push({ k: 'steam', age: 0, life: 1.2, x: a.x + dir * a.e.w * a.k * 0.42, y: a.y - a.e.h * a.k * 0.28, vx: dir * 10, vy: -6 });
      }
    },
    lightning(c, s, f, cam, t) {
      const lt = t - f.t0;
      if (lt < 0 || lt > 0.7) return;
      const p = P(s, cam, f.x, 0.93);
      c.save();
      c.fillStyle = 'rgba(255,255,255,' + Math.max(0, 0.9 - lt * 1.6) + ')'; c.fillRect(0, 0, W, H);
      c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,245,200,' + (1 - lt / 0.7) + ')'; c.lineWidth = 2; c.shadowColor = '#fff2b0'; c.shadowBlur = 20 * SC();
      c.beginPath(); let x = p.x + 10, y = BAR; c.moveTo(x, y);
      const r = O.rng(7);
      while (y < p.y - 20) { y += 10 + r() * 8; x += (r() - 0.5) * 18; c.lineTo(x, y); }
      c.lineTo(p.x, p.y - 20); c.stroke();
      c.restore();
    },
    bignote(c, s, f, cam, t) {
      const lt = t - f.t0;
      if (lt < 0 || lt > 3) return;
      const p = P(s, cam, f.x, f.y, f.units), a = Math.min(1, lt * 3) * (1 - lt / 3);
      c.save(); c.globalCompositeOperation = 'lighter';
      const R = 12 + lt * 20, gr = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, R);
      gr.addColorStop(0, 'rgba(255,240,180,' + a + ')'); gr.addColorStop(1, 'rgba(255,200,90,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(p.x, p.y, R, 0, 7); c.fill();
      c.globalCompositeOperation = 'source-over'; c.font = '14px Georgia, serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = 'rgba(255,236,160,' + a + ')'; c.fillText('♪', p.x, p.y - lt * 10);
      c.restore();
    },
    tear(c, s, f, cam, t) {
      const lt = t - f.t0;
      if (lt < 0 || lt > 2.5) return;
      const p = P(s, cam, f.x, f.y), y = p.y + lt * lt * 14;
      c.save(); c.globalCompositeOperation = 'lighter';
      const gr = c.createRadialGradient(p.x, y, 0, p.x, y, 4); gr.addColorStop(0, 'rgba(190,240,255,0.9)'); gr.addColorStop(1, 'rgba(120,200,255,0)');
      c.fillStyle = gr; c.beginPath(); c.arc(p.x, y, 4, 0, 7); c.fill(); c.restore();
    },
    title(c, s, f, cam, t) {
      if (t < f.t0 || t > f.t1) return;
      const a = Math.min(1, (t - f.t0) * 1.5, (f.t1 - t) * 1.5);
      c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 15px Georgia, "Times New Roman", serif';
      const ty = f.y || H / 2, gr = c.createLinearGradient(0, ty - 10, 0, ty + 10);
      gr.addColorStop(0, '#fff3c4'); gr.addColorStop(0.5, '#f0c050'); gr.addColorStop(1, '#a8701c');
      c.globalAlpha = a; c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillText(f.text, W / 2 + 0.8, ty + 0.8);
      c.fillStyle = gr; c.fillText(f.text, W / 2, ty);
      c.fillStyle = 'rgba(240,192,80,' + 0.8 * a + ')'; const w = c.measureText(f.text).width / 2 + 10;
      c.fillRect(W / 2 - w, ty + 11, w * 2, 0.6); c.fillRect(W / 2 - w, ty - 12, w * 2, 0.6);
      c.restore();
    }
  };
  const wave = document.createElement('canvas');
  const GRADE = {
    night(c, s, f) { c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = 'rgba(60,70,150,' + f.a + ')'; c.fillRect(0, 0, W, H); c.restore(); },
    desat(c, s, f, cam, t) {
      if (!Array.isArray(f.a) && ((f.t0 !== undefined && t < f.t0) || (f.t1 !== undefined && t > f.t1))) return;
      const a = Array.isArray(f.a) ? lerp(f.a[0], f.a[1], ease(win(t, f.t0 || 0, f.t1 || s.dur))) : f.a;
      if (a <= 0.001) return;
      c.save(); c.globalCompositeOperation = 'saturation'; c.fillStyle = 'rgba(128,128,128,' + a + ')'; c.fillRect(0, 0, W, H); c.restore();
    },
    wave(c, s, f, cam, t) {
      const S = SC(); wave.width = W * S / 2; wave.height = H * S / 2;
      const g = wave.getContext('2d'), k = wave.width / W;
      g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, wave.width, wave.height);
      const R = ease(win(t, f.t0, f.t1)) * 460;
      if (R > 0) {
        const p = P(s, cam, f.x, f.y, f.units), gr = g.createRadialGradient(p.x * k, p.y * k, Math.max(0, R - 40) * k, p.x * k, p.y * k, R * k);
        g.globalCompositeOperation = 'destination-out'; gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(0, 0, wave.width, wave.height); g.globalCompositeOperation = 'source-over';
        // the golden front of the wave
        c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,220,130,' + 0.35 * (1 - R / 460) + ')'; c.lineWidth = 6;
        c.beginPath(); c.arc(p.x, p.y, Math.max(1, R - 20), 0, 7); c.stroke(); c.restore();
      }
      if (t < f.t1) { c.save(); c.globalCompositeOperation = 'saturation'; c.drawImage(wave, 0, 0, W, H); c.restore(); }
    }
  };
  // Test hook (tools/cutshot.js): jump to shot i at time t, simulating the particles on the way.
  Cut.seek = function (i, t) {
    if (!st) return;
    st.i = Math.min(i, st.shots.length - 1); st.t = 0; st.parts = []; st.fired = {};
    const s = st.shots[st.i];
    while (st.t < t) { st.t += DT; stepParticles(s); }
  };

  // Cutscenes that start by themselves the first time a place is reached (flags are saved with the game).
  Cut.onLevel = function (g) {
    const id = g.lvl.id, f = g.st.flags;
    const talk = (kind) => () => { const n = g.npcs.find((x) => x.kind === kind); if (n && O.TALK[kind]) { g.talking = n; O.TALK[kind](g); } };
    if (id === 'zeus' && !f.cs_zeus) { f.cs_zeus = 1; Cut.start(g, ['zeus'], talk('zeus')); }
    else if (id === 'den' && !f.boarDefeated && !f.cs_boar) { f.cs_boar = 1; Cut.start(g, ['boar']); }
    else if (id === 'hermes' && !f.cs_hermes) { f.cs_hermes = 1; Cut.start(g, ['hermes'], talk('hermes')); }
  };

  // keep the camera of the frame for particles that follow scene points
  const baseDraw = Cut.draw;
  Cut.draw = function (c, g) {
    if (st) { const s = st.shots[st.i]; st.lastCam = s.bg.indexOf('level:') === 0 || s.bg === 'dark' ? { units: true } : camAt(s, st.t / s.dur); }
    baseDraw(c, g);
  };
})(window.OLY);
