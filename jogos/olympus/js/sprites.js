/* sprites.js — original pixel art (strings -> canvases).
   Each char maps to a color in O.PAL; '.' is transparent. */
(function (O) {
  'use strict';

  /* ---------- helpers ---------- */
  function recolor(rows, map) {
    return rows.map((r) => r.split('').map((ch) => (map[ch] !== undefined ? map[ch] : ch)).join(''));
  }
  function patch(rows, patches) {
    const out = rows.slice();
    Object.keys(patches).forEach((y) => { out[+y] = patches[y]; });
    return out;
  }
  function setPx(rows, x, y, ch) {
    const out = rows.slice();
    out[y] = out[y].slice(0, x) + ch + out[y].slice(x + 1);
    return out;
  }
  // Procedural grid helpers (used for the boss) with automatic black outline.
  function grid(w, h) { return Array.from({ length: h }, () => new Array(w).fill('.')); }
  function gSet(g, x, y, c) { if (y >= 0 && y < g.length && x >= 0 && x < g[0].length) g[y][x] = c; }
  function gRect(g, x, y, w, h, c) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) gSet(g, i, j, c); }
  function gEllipse(g, cx, cy, rx, ry, c) {
    for (let y = 0; y < g.length; y++) {
      for (let x = 0; x < g[0].length; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy <= 1) g[y][x] = c;
      }
    }
  }
  function gOutline(g) {
    const h = g.length, w = g[0].length;
    const out = g.map((r) => r.slice());
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (g[y][x] !== '.') continue;
        const n = (xx, yy) => yy >= 0 && yy < h && xx >= 0 && xx < w && g[yy][xx] !== '.';
        if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) out[y][x] = 'K';
      }
    }
    return out.map((r) => r.join(''));
  }

  /* ---------- ORPHEUS (16x24, faces right) ---------- */
  const HERO_TOP = [
    '................',
    '......KKKK......',
    '....KKHHHHK.....',
    '...KHHHHHHHK....',
    '...KRRRRRRRRK...',
    '...KHHSSSSKSK...',
    '...KHSSSSSKSK...',
    '...KHSSSSSSSK...',
    '....KHSSSSSK....',
    '.....KKSSKK.....'
  ];
  const HERO_BODY = [
    '....KWWWWWWK....',
    '...KSWWWWWWSK...',
    '..KSKWWWWWWKSK..',
    '..KSKWWWWWWKSK..',
    '..KSKRRRRRRKSK..',
    '...KKWWWWWWKK...',
    '....KWWwWWWK....',
    '....KWwwwwWK....'
  ];
  const HERO_BODY_ATK = [
    '....KWWWWWWKKK..',
    '...KSWWWWWWSSSK.',
    '..KSKWWWWWWKKK..',
    '..KSKWWWWWWK....',
    '..KSKRRRRRRK....',
    '...KKWWWWWWK....',
    '....KWWwWWWK....',
    '....KWwwwwWK....'
  ];
  const LEGS = {
    stand: [
      '.....KSK.KSK....',
      '.....KSK.KSK....',
      '.....KSK.KSK....',
      '.....KBK.KBK....',
      '....KBBK.KBBK...',
      '....KKKK.KKKK...'
    ],
    walk1: [
      '....KSK...KSK...',
      '...KSK.....KSK..',
      '...KSK.....KSK..',
      '..KBK.......KBK.',
      '..KBBK......KBBK',
      '..KKKK......KKKK'
    ],
    walk2: [
      '.....KSKSK......',
      '.....KSKSK......',
      '.....KSKSK......',
      '.....KBKBK......',
      '....KBBKBBK.....',
      '....KKKKKKK.....'
    ],
    jump: [
      '....KSK..KSK....',
      '....KSSK..KSK...',
      '.....KSSK..KSK..',
      '......KBK...KBK.',
      '......KBBK..KBBK',
      '.......KKK...KKK'
    ]
  };
  const HERO_CROUCH = [
    '......KKKK......',
    '....KKHHHHK.....',
    '...KHHHHHHHK....',
    '...KRRRRRRRRK...',
    '...KHHSSSSKSK...',
    '...KHSSSSSKSK...',
    '....KHSSSSSK....',
    '.....KKSSKK.....',
    '...KSWWWWWWSK...',
    '..KSKWWWWWWKSK..',
    '..KSKRRRRRRKSK..',
    '..KKWWWWWWWWKK..',
    '..KSSSSKKSSSSK..',
    '..KBBBK..KBBBK..',
    '.KBBBBK..KBBBBK.',
    '.KKKKKK..KKKKKK.'
  ];
  const HERO_CROUCH_ATK = patch(HERO_CROUCH, {
    8: '...KSWWWWWWKKK..',
    9: '..KSKWWWWWWSSSK.',
    10: '..KSKRRRRRRKKK..'
  });

  const CLUB = [
    '.........KKKK.',
    'KKKKKKKKKBBBBK',
    'BBBBBBBBBBBBBK',
    'KKKKKKKKKBBBBK',
    '.........KKKK.'
  ];

  /* ---------- ENEMIES ---------- */
  const SNAKE1 = [
    '..........KKKK..',
    '.........KGGKGK.',
    '..KKK....KGGGGKR',
    '.KGGGK..KGGYYK.R',
    'KGYYYGKKGYYGK...',
    'KGK.KGGGGYGK....',
    '.K...KGGGGK.....',
    '......KKKK......'
  ];
  const SNAKE2 = [
    '..........KKKK..',
    '.........KGGKGK.',
    '.........KGGGGKR',
    '..KKKK..KGGYYK.R',
    '.KGYYGKKGYYGK...',
    'KGGK.KGGGGGK....',
    'KGK...KGGGK.....',
    '.K.....KKK......'
  ];
  const BAT1 = [
    '.K............K.',
    'KPK..........KPK',
    'KPPK..K..K..KPPK',
    'KPPPKKPKKPKKPPPK',
    '.KPPPPPPPPPPPPK.',
    '..KPPPRPPRPPPK..',
    '...KKPPPPPPKK...',
    '.....KPWWPK.....',
    '......KKKK......',
    '................'
  ];
  const BAT2 = [
    '................',
    '......K..K......',
    '.....KPKKPK.....',
    '....KPPPPPPK....',
    '..KKPPRPPRPPKK..',
    '.KPPPPPPPPPPPPK.',
    'KPPPKPPPPPPKPPPK',
    'KPPK.KPWWPK.KPPK',
    'KPK...KKKK...KPK',
    '.K............K.'
  ];
  const BAT_HANG = [
    '.......KK.......',
    '......KPPK......',
    '.....KPPPPK.....',
    '....KPPPPPPK....',
    '....KPWPPWPK....',
    '....KPRPPRPK....',
    '....KPPPPPPK....',
    '.....KPPPPK.....',
    '......KKKK......',
    '................'
  ];
  const SATYR_TOP = [
    '...K......K.....',
    '...KwK...KwK....',
    '....KwKKKwK.....',
    '....KHHHHHK.....',
    '...KHHSSSSSK....',
    '...KHSSSSKSK....',
    '...KHSSSSSSSK...',
    '....KHHSSSSK....',
    '....KHHHHHK.....',
    '...KSKHHHKSK....',
    '..KSSSKKKSSSK...',
    '..KSKSSSSSKSK...',
    '..KSKSSSSSKSK...',
    '..KKKHHHHHKKK...',
    '....KHHHHHHK....',
    '....KHHHHHHK....',
    '....KHHKKHHK....'
  ];
  const SATYR_LEGS1 = [
    '....KHHK.KHHK...',
    '.....KHHK.KHHK..',
    '.....KHHK.KHHK..',
    '....KHHK.KHHK...',
    '....KHK..KHK....',
    '...KKKK.KKKK....',
    '...KKK..KKK.....'
  ];
  const SATYR_LEGS2 = [
    '...KHHK...KHHK..',
    '..KHHK.....KHHK.',
    '..KHHK.....KHHK.',
    '...KHHK...KHHK..',
    '...KHK.....KHK..',
    '..KKKK....KKKK..',
    '..KKK.....KKK...'
  ];

  // Erymanthian Boar (32x24) generated from shapes, then outlined.
  function boar(phase, stunned) {
    const g = grid(32, 24);
    gEllipse(g, 14, 12, 11.5, 7.5, 'H');
    gEllipse(g, 13, 7, 9, 3, 'h');
    for (let x = 6; x <= 20; x += 3) gSet(g, x, 5 + ((x / 3) % 2), 'B');
    gEllipse(g, 24, 13, 5, 5, 'H');
    gRect(g, 27, 13, 3, 4, 'S');
    gSet(g, 29, 14, 'K');
    gRect(g, 22, 6, 2, 3, 'H');
    gSet(g, 25, 11, stunned ? 'W' : 'R');
    gSet(g, 30, 15, 'W'); gSet(g, 30, 14, 'W'); gSet(g, 29, 17, 'W'); gSet(g, 28, 17, 'W');
    const legs = phase ? [6, 11, 17, 21] : [4, 12, 15, 22];
    legs.forEach((lx) => { gRect(g, lx, 18, 3, 4, 'h'); gRect(g, lx, 21, 3, 1, 'K'); });
    gSet(g, 2, 9, 'h'); gSet(g, 1, 8, 'h'); gSet(g, 1, 7, 'h');
    return gOutline(g);
  }

  /* ---------- NPCs ---------- */
  const ROBE = [
    '................',
    '......KKKK......',
    '....KKwwwwK.....',
    '...KwwwwwwwK....',
    '...KwwSSSSSK....',
    '...KwSSSSKSK....',
    '...KwSSSSSSSK...',
    '...KwWWWWWWK....',
    '....KWWWWWWK....',
    '....KWWWWWK.....',
    '...KBBKWWKBBK...',
    '..KBBBBKKBBBBK..',
    '..KBBBBBBBBSBK..',
    '..KSKBBBBBBSKK..',
    '..KKKBBBBBBBK...',
    '....KBBBBBBK....',
    '....KBBBBBBK....',
    '....KBBBBBBK....',
    '....KBBBBBBK....',
    '...KBBBBBBBBK...',
    '...KBBBBBBBBK...',
    '...KBBBBBBBBK...',
    '...KKSKKKKSKK...',
    '....KKK..KKK....'
  ];
  const WOMAN = [
    '................',
    '......KKKK......',
    '....KKHHHHK.....',
    '...KHHHHHHHK....',
    '..KHHZSSSSSK....',
    '..KHHSSSSKSK....',
    '..KHHSSSSSSSK...',
    '..KHHKSSSSSK....',
    '..KHHHKSSSK.....',
    '..KHHKWWWWWK....',
    '..KHKSWWWWWSK...',
    '..KKSKWWWWWKSK..',
    '...KSKWWWWWKSK..',
    '...KKKYYYYYKKK..',
    '....KWWWWWWWK...',
    '....KWWWWWWWK...',
    '...KWWWWWWWWK...',
    '...KWWWWWWWWK...',
    '...KWWWWWWWWWK..',
    '..KWWWWWWWWWWK..',
    '..KWWWWWWWWWWK..',
    '..KWWWWWWWWWWWK.',
    '..KKKSKKKKSKKKK.',
    '....KKK..KKK....'
  ];

  const HERO_STAND = HERO_TOP.concat(HERO_BODY, LEGS.stand);

  const DATA = {
    heroStand: HERO_STAND,
    heroWalk1: HERO_TOP.concat(HERO_BODY, LEGS.walk1),
    heroWalk2: HERO_TOP.concat(HERO_BODY, LEGS.walk2),
    heroJump: HERO_TOP.concat(HERO_BODY, LEGS.jump),
    heroAtk: HERO_TOP.concat(HERO_BODY_ATK, LEGS.stand),
    heroJumpAtk: HERO_TOP.concat(HERO_BODY_ATK, LEGS.jump),
    heroCrouch: HERO_CROUCH,
    heroCrouchAtk: HERO_CROUCH_ATK,
    club: CLUB,

    snake1: SNAKE1, snake2: SNAKE2,
    bat1: BAT1, bat2: BAT2, batHang: BAT_HANG,
    satyr1: SATYR_TOP.concat(SATYR_LEGS1),
    satyr2: SATYR_TOP.concat(SATYR_LEGS2),
    boar1: boar(0, false), boar2: boar(1, false), boarStun: boar(0, true),

    elder: ROBE,
    zeus: patch(recolor(ROBE, { B: 'W', w: 'W' }), {
      1: '....KYKYKYK.....',
      2: '...KYYYYYYK.....',
      13: '..KSKYYYYYYSKK..'
    }),
    hades: setPx(setPx(recolor(ROBE, { w: 'P', W: 'P', B: 'p', S: 'V' }), 9, 5, 'R'), 7, 3, 'P'),
    merchant: recolor(WOMAN, { H: 'h', W: 'u', Z: 'Y' }),
    villager: recolor(WOMAN, { H: 'K', W: 'Z', Z: 'W' }),
    eurydice: recolor(WOMAN, { H: 'Y', Z: 'R' }),
    hermes: patch(recolor(HERO_STAND, { R: 'Y', W: 'u', w: 'U' }), {
      2: '.WW.KKHHHHK.....',
      3: 'WWWKHHHHHHHK....'
    }),

    /* ---------- items / icons (8x8) ---------- */
    olive: [
      '....KK..',
      '...KEK..',
      '..KKKK..',
      '.KGGGGK.',
      'KGLGGGGK',
      'KGGGGGGK',
      '.KGGGGK.',
      '..KKKK..'
    ],
    ambrosia: [
      '..KKKK..',
      '.KWWWWK.',
      '..KYYK..',
      '.KYYYYK.',
      'KYYWYYYK',
      'KYYYYYYK',
      'KYYYYYYK',
      '.KKKKKK.'
    ],
    pom: [
      '...KK...',
      '..KEK...',
      '.KKRKK..',
      'KRRRRRK.',
      'KRWRRRK.',
      'KRRRRRK.',
      '.KRRRK..',
      '..KKK...'
    ],
    rock: [
      '..KKKK..',
      '.KAAAAK.',
      'KAAwAAAK',
      'KAwAAAAK',
      'KAAAAAAK',
      'KAAAAKAK',
      '.KAAAAK.',
      '..KKKK..'
    ],
    iconClub: [
      '.....KK.',
      '....KBBK',
      '...KBBBK',
      '..KBBBK.',
      '.KBBK...',
      'KBBK....',
      'KBK.....',
      '.K......'
    ],
    iconSandals: [
      'W......W',
      'WW....WW',
      '.WKKKKW.',
      '.KYYYYK.',
      'KYYYYYYK',
      'KYYYYYYK',
      'KKKKKKKK',
      '........'
    ],
    heart: [
      '.KK.KK..',
      'KRRKRRK.',
      'KRRRRRK.',
      'KRRRRRK.',
      '.KRRRK..',
      '..KRK...',
      '...K....',
      '........'
    ],
    arrowUp: [
      '...WW...',
      '..WWWW..',
      '.WWWWWW.',
      '...WW...',
      '...WW...',
      '........'
    ],
    bolt: [
      '....YYY.',
      '...YYY..',
      '..YYY...',
      '.YYYYYY.',
      '....YYY.',
      '...YYY..',
      '..YYY...',
      '.YYY....',
      '.YY.....',
      'Y.......'
    ],
    flame1: [
      '...R....',
      '..RYR...',
      '..RYR...',
      '.RYWYR..',
      '.RYWYR..',
      'RYYWYYR.',
      '.RYYYR..',
      '..RRR...'
    ],
    flame2: [
      '....R...',
      '...RYR..',
      '..RYYR..',
      '.RYWYR..',
      '.RYWYYR.',
      'RYYWYYR.',
      '.RYYYR..',
      '..RRR...'
    ],
    brazier: [
      'KKKKKKKK',
      'KYYYYYYK',
      '.KYYYYK.',
      '..KBBK..',
      '...KK...',
      '...KK...',
      '..KBBK..',
      '.KKKKKK.'
    ]
  };

  O.SPR = {};
  O.SPRITE_DATA = DATA;

  function compile(name, rows) {
    const h = rows.length;
    const w = Math.max.apply(null, rows.map((r) => r.length));
    const mk = () => O.makeCanvas(w, h);
    const n = mk(), f = mk(), wn = mk(), wf = mk();
    const gn = n.getContext('2d'), gf = f.getContext('2d'), gwn = wn.getContext('2d'), gwf = wf.getContext('2d');
    gwn.fillStyle = gwf.fillStyle = '#fcfcfc';
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const ch = rows[y][x] || '.';
        if (ch === '.') continue;
        const col = O.PAL[ch];
        if (!col) { console.warn('Unknown sprite color', ch, 'in', name); continue; }
        gn.fillStyle = gf.fillStyle = col;
        gn.fillRect(x, y, 1, 1);
        gf.fillRect(w - 1 - x, y, 1, 1);
        gwn.fillRect(x, y, 1, 1);
        gwf.fillRect(w - 1 - x, y, 1, 1);
      }
    }
    O.SPR[name] = { w, h, n, f, wn, wf };
  }

  O.initSprites = function () {
    Object.keys(DATA).forEach((k) => compile(k, DATA[k]));
  };

  // Draw a sprite. flip = mirror horizontally; white = hit flash silhouette.
  O.drawSpr = function (ctx, name, x, y, flip, white, scale) {
    const s = O.SPR[name];
    if (!s) return;
    const img = white ? (flip ? s.wf : s.wn) : (flip ? s.f : s.n);
    const k = scale || 1;
    if (k === 1) ctx.drawImage(img, Math.round(x), Math.round(y));
    else ctx.drawImage(img, Math.round(x), Math.round(y), s.w * k, s.h * k);
  };
})(window.OLY);
