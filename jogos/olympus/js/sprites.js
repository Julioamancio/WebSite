/* sprites.js — original pixel art. Sources are "fill only" strings:
   UPPERCASE = material that gets automatic 3-tone shading (light on top, shadow on the back/bottom),
   lowercase = forced shadow tone of that material, K = black, k = soft dark line, * = white shine,
   & = glowing red, % = pale glow, . = transparent. A 1px black outline is added automatically. */
(function (O) {
  'use strict';

  // [light, base, shadow]
  const RAMPS = {
    S: ['#fcd8a8', '#f0a068', '#b05828'], // skin
    H: ['#d0783c', '#8c3810', '#501800'], // auburn hair
    W: ['#fcfcfc', '#d8d8e8', '#9090b0'], // white cloth
    R: ['#fc7050', '#d82800', '#881000'], // red
    Y: ['#fcf088', '#f8b800', '#a86000'], // gold
    B: ['#d89858', '#a06028', '#5c3010'], // leather / wood
    F: ['#b06840', '#703818', '#381808'], // dark fur / dark wood
    G: ['#a0e868', '#38a818', '#10600c'], // green
    E: ['#38a818', '#186c10', '#083808'], // deep green
    P: ['#b8a0fc', '#7050e0', '#382890'], // purple
    N: ['#6858b8', '#382878', '#180c40'], // night robe
    U: ['#80c0fc', '#2870e0', '#103c90'], // blue
    I: ['#d0ecfc', '#80bcf0', '#3c78c0'], // sky cloth
    A: ['#e0e0e8', '#a0a0b0', '#585870'], // stone
    V: ['#ece0fc', '#b8a8e8', '#7060a8'], // pale violet skin
    Z: ['#fcc8e8', '#f070b8', '#a03070'], // pink
    C: ['#b0fcfc', '#20c8d0', '#086878'], // cyan
    T: ['#fcfcf0', '#e8dcb0', '#a89868'], // ivory
    O: ['#b8d860', '#6c8c28', '#344814'], // olive
    M: ['#fcfcfc', '#e0dce8', '#a8a0b8'], // white hair / marble
    X: ['#fcfcfc', '#b8c0d0', '#687088'], // silver
    Q: ['#f8d078', '#c88830', '#704010']  // bronze
  };
  const FIXED = { K: '#000000', k: '#302838', '*': '#fcfcfc', '&': '#fc3800', '%': '#fcf8b0' };
  O.RAMPS = RAMPS;

  function recolor(rows, map) {
    return rows.map((r) => r.split('').map((ch) => (map[ch] !== undefined ? map[ch] : ch)).join(''));
  }
  function patch(rows, patches) {
    const out = rows.slice();
    Object.keys(patches).forEach((y) => { out[+y] = patches[y]; });
    return out;
  }

  // Source strings -> shaded, outlined Pix.
  function build(rows, opt) {
    const o = opt || {};
    const pad = o.outline === false ? 0 : 1;
    const h0 = rows.length, w0 = Math.max.apply(null, rows.map((r) => r.length));
    const src = (x, y) => (y >= 0 && y < h0 && x >= 0 && x < w0 ? rows[y][x] || '.' : '.');
    const p = new O.Pix(w0 + pad * 2, h0 + pad * 2);
    for (let y = 0; y < h0; y++) {
      for (let x = 0; x < w0; x++) {
        const ch = src(x, y);
        if (ch === '.') continue;
        let c = FIXED[ch];
        if (!c && RAMPS[ch]) {
          const r = RAMPS[ch];
          let tone = 1;
          if (o.shade !== false) {
            const up = src(x, y - 1), dn = src(x, y + 1), lf = src(x - 1, y);
            if (up !== ch && dn !== ch) tone = lf === '.' ? 2 : 1;
            else if (up !== ch) tone = 0;
            else if (lf === '.' || dn !== ch) tone = 2;
          }
          c = r[tone];
        } else if (!c && RAMPS[ch.toUpperCase()]) {
          c = RAMPS[ch.toUpperCase()][2];
        }
        if (!c) { console.warn('Unknown sprite char', ch); continue; }
        p.set(x + pad, y + pad, c);
      }
    }
    if (o.outline !== false) p.outline('#000000');
    return p;
  }

  /* ================= ORPHEUS (source 14 wide) ================= */
  const HEAD = [
    '.....HHHH.....',
    '...HHHHHHHH...',
    '..HHHHHHHHHH..',
    '.RRRRRRRRRRR..',
    '.RHHHSSSSSSS..',
    'R.HHSSSSSKSS..',
    '..HHSSSSSKSSS.',
    '..HHHSSSSSSS..',
    '...HHSSSSSsS..',
    '....HSSSSSS...',
    '......SSS.....'
  ];
  const TORSO = [
    '...WWWWWWWW...',
    '..WWWWWWWWWW..',
    '..SWWWWWWWWS..',
    '..SWWwWWWWWS..',
    '..SWWwWWWWWS..',
    '..SBBBBYBBBS..',
    '..SWWWWWWwWS..',
    '..SWWWwWWwWS..',
    '..SWWWwWWWWS..',
    '...WWWWWWWWW..'
  ];
  const TORSO_ATK = [
    '...WWWWWWWW...',
    '..WWWWWWWWWSSS',
    '..SWWWWWWWW...',
    '..SWWwWWWWW...',
    '..SWWwWWWWW...',
    '..SBBBBYBBB...',
    '..SWWWWWWwW...',
    '..SWWWwWWwW...',
    '..SWWWwWWWW...',
    '...WWWWWWWWW..'
  ];
  const LEGS = {
    stand: [
      '...SSS..SSS...',
      '...SSS..SSS...',
      '...SSS..SSS...',
      '...BSB..BSB...',
      '...SBS..SBS...',
      '...BSB..BSB...',
      '...BBB..BBB...',
      '...BBBB.BBBB..'
    ],
    walkA: [
      '...SSS..SSS...',
      '..SSS....SSS..',
      '..SSS....SSS..',
      '.BSB......BSB.',
      '.SBS......SBS.',
      '.BSB......BSB.',
      '.BBB......BBB.',
      'BBBB......BBBB'
    ],
    walkB: [
      '....SSSSS.....',
      '....SSSSS.....',
      '....SSS.SS....',
      '....BSB.BSB...',
      '....SBS..SBS..',
      '....BSB..BSB..',
      '....BBB..BBB..',
      '....BBBB.BBBB.'
    ],
    jump: [
      '...SSS.SSS....',
      '...SSSS.SSS...',
      '....SSSS.SSS..',
      '.....BSB..BSB.',
      '.....SBS..SBS.',
      '.....BBB..BBBB',
      '..............',
      '..............'
    ]
  };
  const CROUCH_TORSO = [TORSO[0], TORSO[1], TORSO[2], TORSO[5], TORSO[9]];
  const CROUCH_TORSO_ATK = [TORSO_ATK[0], TORSO_ATK[1], TORSO_ATK[2], TORSO_ATK[5], TORSO_ATK[9]];
  const CROUCH_LEGS = [
    '...SSSSSSSSS..',
    '..BSB....SSS..',
    '..BBB....BSB..',
    '.BBBB...BBBB..'
  ];
  const HERO = {
    heroStand: HEAD.concat(TORSO, LEGS.stand),
    heroWalk1: HEAD.concat(TORSO, LEGS.walkA),
    heroWalk2: HEAD.concat(TORSO, LEGS.walkB),
    heroJump: HEAD.concat(TORSO, LEGS.jump),
    heroAtk: HEAD.concat(TORSO_ATK, LEGS.stand),
    heroJumpAtk: HEAD.concat(TORSO_ATK, LEGS.jump),
    heroCrouch: HEAD.concat(CROUCH_TORSO, CROUCH_LEGS),
    heroCrouchAtk: HEAD.concat(CROUCH_TORSO_ATK, CROUCH_LEGS)
  };

  /* ================= NPC templates ================= */
  const ROBE = [
    '....MMMMM....Y',
    '..MMMMMMMMM..Y',
    '..MMMMMMMMMM.F',
    '..MMMSSSSSSS.F',
    '..MMSSSSSKSS.F',
    '..MMSSSSSKSSSF',
    '..MMMSSSSSSS.F',
    '..MMMMMMMMMM.F',
    '...MMMMMMMMM.F',
    '....MMMMMMM..F',
    '.....MMMMM...F',
    '...BBBMMMBBB.F',
    '..BBBBBMBBBBSF',
    '..BBBBBBBBBBSF',
    '..SBBBBBBBBB.F',
    '..BBYYYYYYBB.F',
    '..BBBBBBBBBB.F',
    '..BBBBbBBBBB.F',
    '..BBBBbBBBBB.F',
    '..BBBBbBBBBB.F',
    '.BBBBBbBBBBB.F',
    '.BBBBBbBBBBB.F',
    '.BBBBBbBBBBB.F',
    '.BBBBBBBBBBB.F',
    '.YYYYYYYYYYY.F',
    '..SSS...SSS..F',
    '..BBBB..BBBB.F'
  ];
  const WOMAN = [
    '.....HHHH.....',
    '...HHHHHHHH...',
    '..HHHHHHHHHH..',
    '.HHHZSSSSSSS..',
    '.HHHSSSSSKSS..',
    '.HHHSSSSSKSSS.',
    '.HHHHSSSSSS...',
    '.HHHHHSSSSs...',
    '.HHHHH.SSS....',
    '.HHHHWWWWWWW..',
    '.HHHHWWWWWWWS.',
    '.HHHHWWWWWWWS.',
    '..HHHWWWWWWWS.',
    '...YYYYYYYYYS.',
    '...WWWWWWWWW..',
    '...WWWWwWWWW..',
    '..WWWWWwWWWW..',
    '..WWWWWwWWWW..',
    '..WWWWWwWWWWW.',
    '..WWWWwWWWWWW.',
    '..WWWWwWWWWWW.',
    '.WWWWWwWWWWWW.',
    '.WWWWWwWWWWWW.',
    '.WWWWwWWWWWWWW',
    '.WWWWWWWWWWWWW',
    '..SSS...SSS...',
    '..BBBB..BBBB..'
  ];

  /* ================= enemies ================= */
  const SATYR_TOP = [
    '..T.....T.....',
    '..TT...TT.....',
    '...TFFFTFF....',
    '..FFFFFFFFF...',
    '..FFFSSSSSSS..',
    '..FFSSSSS&SS..',
    '..FFSSSSS&SSS.',
    '..FFFSSSSSSS..',
    '..FFFFFFsFFF..',
    '...FFFFFFFF...',
    '....FFFFFF....',
    '...SSSSSSSS...',
    '..SSSSSSSSSS..',
    '..SSsSSSSsSS..',
    '..SSSSSSSSSS..',
    '..SSSsSSsSSS..',
    '..SSSSSSSSSS..',
    '..SFFFFFFFFS..',
    '...FFFFFFFF...'
  ];
  const SATYR_L1 = [
    '...FFFF.FFFF..',
    '...FFFF.FFFF..',
    '....FFF..FFF..',
    '...FFF..FFF...',
    '..FFF..FFF....',
    '..FF...FF.....',
    '...FF...FF....',
    '...FF...FF....',
    '...KKK..KKK...'
  ];
  const SATYR_L2 = [
    '...FFFF.FFFF..',
    '..FFFF...FFFF.',
    '..FFF.....FFF.',
    '.FFF.....FFF..',
    'FFF.....FFF...',
    'FF.....FF.....',
    '.FF.....FF....',
    '.FF.....FF....',
    '.KKK....KKK...'
  ];

  const DATA = Object.assign({}, HERO, {
    club: [
      '.......BBBB.',
      'BBBBBBBBBBBB',
      'BBBBBBBBBBBB',
      '.......BBBB.'
    ],
    elder: ROBE,
    zeus: patch(recolor(ROBE, { B: 'W', b: 'w', F: 'Y' }), {
      0: '...Y.Y.Y.Y...Y',
      1: '..YYYYYYYYY..Y'
    }),
    hades: patch(recolor(ROBE, { M: 'N', S: 'V', B: 'P', b: 'p', Y: 'R', F: 'X' }), {
      0: '....NNNNN...XX',
      4: '..NNVVVVV&VV.X',
      5: '..NNVVVVV&VVVX'
    }),
    eurydice: recolor(WOMAN, { H: 'Y', Z: 'R' }),
    merchant: recolor(WOMAN, { H: 'F', W: 'I', w: 'i', Z: 'Y' }),
    villager: recolor(WOMAN, { H: 'N', W: 'Z', w: 'z', Z: 'W' }),
    hermes: patch(recolor(HERO.heroStand, { R: 'Y', W: 'I', w: 'i', B: 'Y' }), {
      1: 'W..HHHHHHHH...',
      2: 'WWHHHHHHHHHH..',
      3: '.WYYYYYYYYYY..',
      4: '..HHHSSSSSSS..',
      5: '..HHSSSSSKSS..'
    }),
    snake1: [
      '...........GGG..',
      '..........GGKGG.',
      '..........GGGGGR',
      '.GGG.....GGYYG.R',
      'GGYGG...GGYYG...',
      'GYYYGG.GGYYG....',
      '.GYYYGGGGYG.....',
      '..GGYYYYGG......'
    ],
    snake2: [
      '...........GGG..',
      '..........GGKGG.',
      '..........GGGGG.',
      '...GGG...GGYYG..',
      '..GGYGG.GGYYG...',
      '.GGYYYGGGYYG....',
      'GGYYGGGGYYG.....',
      'GGGG..GGGG......'
    ],
    bat1: [
      'P..............P',
      'PP............PP',
      'PPP..P....P..PPP',
      'PPPP.PPPPPP.PPPP',
      '.PPPPP&PP&PPPPP.',
      '..PPPPPPPPPPPP..',
      '....PPPPPPPP....',
      '......T..T......',
      '................',
      '................'
    ],
    bat2: [
      '................',
      '.....P....P.....',
      '.....PPPPPP.....',
      '....PP&PP&PP....',
      '..PPPPPPPPPPPP..',
      '.PPPPPPPPPPPPPP.',
      'PPPP.PPPPPP.PPPP',
      'PPP...T..T...PPP',
      'PP............PP',
      'P..............P'
    ],
    batHang: [
      '.......PP.......',
      '......PPPP......',
      '.....PPPPPP.....',
      '.....PPPPPP.....',
      '.....PPPPPP.....',
      '.....P&PP&P.....',
      '......PPPP......',
      '.......PP.......',
      '................',
      '................'
    ],
    satyr1: SATYR_TOP.concat(SATYR_L1),
    satyr2: SATYR_TOP.concat(SATYR_L2),

    /* ---------- items & icons ---------- */
    olive: ['....G.', '...GG.', '..OOO.', '.OO*OO', '.OOOOO', '.OOOOO', '..OOO.'],
    ambrosia: ['..WW..', '.YYYY.', '..YY..', '.YYYY.', 'YYYYYY', 'YY*YYY', 'YYYYYY', '.YYYY.'],
    pom: ['..R.R.', '..RRR.', '.RRRRR', 'RR*RRR', 'RRRRRR', 'RRRRRR', '.RRRR.'],
    heart: ['.RR.RR.', 'RRRRRRR', 'RR*RRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
    iconClub: ['.....BB', '....BBB', '...BBB.', '..BBB..', '.BB....', 'BB.....'],
    iconSandals: ['W......', 'WW.....', 'WWYY...', '.YYYYYY', 'YYYYYYY'],
    lyre: ['YY....YY', 'YYYYYYYY', '.YW.W.Y.', '.YW.W.Y.', '.YW.W.Y.', '.YYYYYY.', '..YYYY..'],
    bolt: ['....YYY', '...YYY.', '..YYY..', '.YYYYYY', '....YY.', '...YY..', '..YY...', '.YY....', 'Y......'],
    arrowUp: ['..WW..', '.WWWW.', 'WWWWWW', '..WW..', '..WW..'],
    rock: ['..AAAA..', '.AAAAAA.', 'AAAAAAAA', 'AAAaAAAA', 'AAAAAaAA', '.AAAAAA.', '..AAAA..']
  });

  const NO_OUTLINE = {
    flame1: ['...R....', '..RYR...', '..RYR...', '.RY%YR..', '.RY%YR..', 'RYY%YYR.', '.RYYYR..', '..RRR...'],
    flame2: ['....R...', '...RYR..', '..RYYR..', '.RY%YR..', '.RY%YYR.', 'RYY%YYR.', '.RYYYR..', '..RRR...']
  };

  /* ---------- procedural sprites ---------- */
  const BOAR_BODY = ['#b06838', '#783c18', '#3c1808'];
  const BOAR_MANE = ['#6c3818', '#40200c', '#1c0c04'];
  const BOAR_SNOUT = ['#fcc0b0', '#e08878', '#a05048'];
  function boar(phase, stunned) {
    const p = new O.Pix(48, 34);
    const legs = phase === 1 ? [[9, 0], [15, 1], [27, 0], [33, 1]] : phase === 2 ? [[11, 1], [13, 0], [29, 1], [31, 0]] : [[10, 0], [15, 0], [28, 0], [33, 0]];
    legs.forEach((l, i) => {
      const x = l[0], lift = l[1] * 2;
      p.rect(x, 22 - lift, 4, 7, BOAR_BODY[i % 2 ? 2 : 1]);
      p.rect(x, 28 - lift, 4, 2, '#1c0c04');
    });
    p.ball(22, 17, 16, 10, BOAR_BODY);
    p.ball(18, 11, 12, 6, BOAR_MANE);
    for (let x = 9; x < 30; x += 2) p.line(x, 6 + ((x >> 1) & 1), x - 2, 3 + ((x >> 1) & 1), BOAR_MANE[1]);
    p.ball(37, 18, 8, 8, BOAR_BODY);
    p.ball(43, 20, 3, 4, BOAR_SNOUT);
    p.set(44, 19, '#602828'); p.set(44, 21, '#602828');
    p.ellipse(33, 10, 2, 3, BOAR_MANE[1]);
    if (stunned) {
      p.set(38, 15, '#fcfcfc'); p.set(39, 16, '#fcfcfc'); p.set(40, 15, '#fcfcfc'); p.set(38, 17, '#fcfcfc'); p.set(40, 17, '#fcfcfc');
    } else {
      p.rect(38, 15, 2, 2, '#fc3800'); p.set(38, 15, '#fcf8b0');
    }
    const T = RAMPS.T;
    [[41, 25], [42, 24], [43, 23], [44, 22], [44, 21]].forEach((q, i) => p.set(q[0], q[1], i < 2 ? T[1] : T[0]));
    [[40, 25], [41, 24], [42, 23]].forEach((q) => p.set(q[0], q[1] + 1, T[2]));
    p.set(6, 12, BOAR_BODY[1]); p.set(5, 11, BOAR_BODY[1]); p.set(4, 12, BOAR_BODY[1]); p.set(4, 13, BOAR_BODY[1]);
    p.outline('#000000');
    return p;
  }
  function swipe() {
    const p = new O.Pix(18, 22);
    for (let a = -1.3; a <= 1.3; a += 0.02) {
      for (let r = 7; r <= 9; r++) {
        const x = 2 + Math.cos(a) * r * 1.5, y = 11 + Math.sin(a) * r;
        p.set(x, y, r === 9 ? '#f8b800' : '#fcfcfc');
      }
    }
    return p;
  }
  function brazier() {
    const p = new O.Pix(14, 14);
    const Q = RAMPS.Q;
    p.rect(1, 0, 12, 2, Q[0]); p.rect(2, 2, 10, 2, Q[1]); p.rect(3, 4, 8, 1, Q[2]);
    p.rect(6, 5, 2, 6, Q[1]); p.set(6, 5, Q[0]);
    p.line(6, 10, 2, 13, Q[2]); p.line(7, 10, 11, 13, Q[2]); p.rect(6, 11, 2, 3, Q[2]);
    p.outline('#000000');
    return p;
  }

  O.SPR = {};
  O.SPRITE_DATA = DATA;

  // Registers a sprite from a Pix or a canvas. Anchor (ax, ay) = pixel placed on the feet point
  // (default: bottom-centre). Also builds flipped and white-flash variants.
  function register(name, src, anchor) {
    const n = src instanceof O.Pix ? src.canvas() : src;
    const w = n.width, h = n.height;
    const mk = () => O.makeCanvas(w, h);
    const f = mk(), wn = mk(), wf = mk();
    const gf = f.getContext('2d');
    gf.translate(w, 0); gf.scale(-1, 1); gf.drawImage(n, 0, 0);
    const gwn = wn.getContext('2d');
    gwn.drawImage(n, 0, 0);
    gwn.globalCompositeOperation = 'source-in';
    gwn.fillStyle = '#ffffff'; gwn.fillRect(0, 0, w, h);
    const gwf = wf.getContext('2d');
    gwf.translate(w, 0); gwf.scale(-1, 1); gwf.drawImage(wn, 0, 0);
    const a = anchor || {};
    O.SPR[name] = { w, h, n, f, wn, wf, ax: a.ax !== undefined ? a.ax : Math.floor(w / 2), ay: a.ay !== undefined ? a.ay : h - 1 };
    return O.SPR[name];
  }
  O.registerSprite = register;

  O.initSprites = function () {
    Object.keys(DATA).forEach((k) => register(k, build(DATA[k])));
    Object.keys(NO_OUTLINE).forEach((k) => register(k, build(NO_OUTLINE[k], { outline: false, shade: false })));
    register('boar0', boar(0, false));
    register('boar1', boar(1, false));
    register('boar2', boar(2, false));
    register('boarStun', boar(0, true));
    register('swipe', swipe());
    register('brazier', brazier());
    // Marble statue made from the hero's silhouette.
    const statue = build(recolor(HERO.heroStand, { H: 'M', S: 'M', s: 'm', R: 'M', W: 'M', w: 'm', B: 'M', Y: 'M', K: 'm' }));
    register('statue', statue);
  };

  // Art modules push their init functions here; they run after the base sprites.
  O.ART_INITS = O.ART_INITS || [];
  // Temporary stand-ins so the engine always finds a frame; real art modules overwrite them.
  const ALIASES = {
    hero_idle: ['heroStand', 4], hero_run: [['heroWalk1', 'heroWalk1', 'heroWalk2', 'heroWalk2'], 8], hero_jump: 'heroJump', hero_peak: 'heroJump',
    hero_fall: 'heroJump', hero_land: 'heroStand', hero_crouch: 'heroCrouch', hero_atk: ['heroAtk', 5], hero_catk: ['heroCrouchAtk', 5],
    hero_jatk: ['heroJumpAtk', 5], hero_hurt: 'heroJump', hero_dead: ['heroCrouch', 2], hero_hold: 'heroStand', hero_lyre: ['heroStand', 2],
    snake_move: [['snake1', 'snake2'], 4], snake_lunge: [['snake1', 'snake2'], 2], bat_hang: 'batHang', bat_fly: [['bat1', 'bat2'], 4],
    satyr_idle: ['satyr1', 2], satyr_walk: [['satyr1', 'satyr2'], 6], satyr_jump: 'satyr2',
    boar_idle: ['boar0', 4], boar_paw: ['boar0', 4], boar_run: [['boar1', 'boar2'], 6], boar_stun: ['boarStun', 4],
    elder_idle: ['elder', 4], merchant_idle: ['merchant', 4], villager_idle: ['villager', 4], eurydice_idle: ['eurydice', 4],
    zeus_idle: ['zeus', 4], hermes_idle: ['hermes', 4], hades_idle: ['hades', 4],
    icon_club: 'iconClub', icon_sandals: 'iconSandals', arrow_up: 'arrowUp', flame: [['flame1', 'flame2'], 4]
  };
  function applyAliases() {
    Object.keys(ALIASES).forEach((base) => {
      const v = ALIASES[base];
      if (typeof v === 'string') { if (!O.SPR[base]) O.SPR[base] = O.SPR[v]; return; }
      const src = v[0], n = v[1];
      for (let i = 0; i < n; i++) {
        const nm = base + '_' + i;
        if (!O.SPR[nm]) O.SPR[nm] = O.SPR[Array.isArray(src) ? src[i % src.length] : src];
      }
    });
  }
  O.bootArt = function () {
    O.initSprites();
    O.ART_INITS.forEach((fn) => { try { fn(); } catch (e) { console.error('Art module failed', e); } });
    applyAliases();
  };
  // Draw a sprite so that its anchor lands on screen point (x, y).
  O.drawA = function (ctx, name, x, y, flip, white, alpha) {
    const s = O.SPR[name];
    if (!s) return null;
    if (s.hd) return O.HD.drawFrame(ctx, s, x, y, flip, white, alpha);
    const sx = Math.round(flip ? x - (s.w - 1 - s.ax) : x - s.ax), sy = Math.round(y - s.ay);
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    ctx.drawImage(white ? (flip ? s.wf : s.wn) : (flip ? s.f : s.n), sx, sy);
    if (alpha !== undefined) ctx.globalAlpha = 1;
    return { sx, sy, s };
  };

  O.drawSpr = function (ctx, name, x, y, flip, white) {
    const s = O.SPR[name];
    if (!s) return;
    if (s.hd) { O.HD.drawFrame(ctx, s, flip ? x + s.w - s.ax : x + s.ax, y + s.ay, flip, white); return; }
    ctx.drawImage(white ? (flip ? s.wf : s.wn) : (flip ? s.f : s.n), Math.round(x), Math.round(y));
  };
})(window.OLY);
