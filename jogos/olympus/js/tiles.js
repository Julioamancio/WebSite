/* tiles.js — procedural 16x16 NES-style tiles and parallax backgrounds per theme */
(function (O) {
  'use strict';

  const BASE = {
    grass: '#00a800', grassL: '#58d854', grassD: '#005800',
    dirt: '#ac7c00', dirtD: '#881400', dirtL: '#f8b800',
    stone: '#bcbcbc', stoneL: '#fcfcfc', stoneD: '#7c7c7c', moss: null, rocky: false,
    plat: '#bcbcbc', platL: '#fcfcfc', platD: '#7c7c7c',
    leaf: '#00a800', leafL: '#58d854', leafD: '#005800',
    trunk: '#881400', trunkD: '#503000',
    wall: '#fce0a8', wallD: '#fca044', roof: '#d82800', roofD: '#a81000',
    inner: '#7c7c7c', innerD: '#000000', innerL: '#bcbcbc'
  };
  const THEMES = {
    village: {},
    forest: {
      dirt: '#881400', dirtD: '#503000', dirtL: '#ac7c00',
      stone: '#7c7c7c', stoneL: '#bcbcbc', stoneD: '#000000', moss: '#00a800',
      plat: '#ac7c00', platL: '#f8b800', platD: '#503000',
      leaf: '#005800', leafL: '#00a800', leafD: '#000000',
      trunk: '#503000', trunkD: '#000000'
    },
    cave: {
      stone: '#881400', stoneL: '#ac7c00', stoneD: '#503000', rocky: true,
      plat: '#ac7c00', platL: '#f8b800', platD: '#503000',
      inner: '#503000', innerD: '#000000', innerL: '#881400'
    },
    temple: {}
  };
  Object.keys(THEMES).forEach((k) => { THEMES[k] = Object.assign({}, BASE, THEMES[k]); });

  const F = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  function speck(g, r, c, n) {
    for (let i = 0; i < n; i++) F(g, (r() * 16) | 0, (r() * 16) | 0, 1, 1, c);
  }
  function shaft(g) {
    F(g, 1, 0, 1, 16, '#000000'); F(g, 14, 0, 1, 16, '#000000');
    F(g, 2, 0, 12, 16, '#fcfcfc');
    F(g, 4, 0, 1, 16, '#bcbcbc'); F(g, 7, 0, 1, 16, '#bcbcbc'); F(g, 10, 0, 1, 16, '#bcbcbc');
    F(g, 12, 0, 2, 16, '#7c7c7c');
  }
  function bricks(g, T, c, cL, cD) {
    F(g, 0, 0, 16, 16, c);
    F(g, 0, 7, 16, 1, cD); F(g, 0, 15, 16, 1, cD);
    F(g, 7, 0, 1, 7, cD); F(g, 3, 8, 1, 7, cD); F(g, 11, 8, 1, 7, cD);
    F(g, 0, 0, 7, 1, cL); F(g, 8, 0, 8, 1, cL);
    F(g, 0, 8, 3, 1, cL); F(g, 4, 8, 7, 1, cL); F(g, 12, 8, 4, 1, cL);
  }

  // Clears the outside of a quarter circle so a leaf tile looks round. rx/ry: 0 = left/top, 1 = right/bottom.
  function corner(g, rx, ry) {
    const cx = rx ? 0 : 16, cy = ry ? 0 : 16;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const px = x + 0.5, py = y + 0.5;
        if (Math.hypot(px - cx, py - cy) > 16) g.clearRect(x, y, 1, 1);
        else if (Math.hypot(px - cx, py - cy) > 15) { g.fillStyle = '#000000'; g.fillRect(x, y, 1, 1); }
      }
    }
  }

  const DRAW = {
    D(g, T, r) {
      F(g, 0, 0, 16, 16, T.dirt);
      speck(g, r, T.dirtD, 14);
      speck(g, r, T.dirtL, 4);
      for (let i = 0; i < 2; i++) F(g, (r() * 13) | 0, (r() * 14) | 0, 3, 1, T.dirtD);
    },
    G(g, T, r) {
      DRAW.D(g, T, r);
      F(g, 0, 0, 16, 4, T.grass);
      for (let x = 0; x < 16; x++) {
        const h = (r() * 3) | 0;
        if (h) F(g, x, 4, 1, h, T.grass);
        F(g, x, 4 + h, 1, 1, T.grassD);
        if (r() < 0.35) F(g, x, 0, 1, 1, T.grassL);
        if (r() < 0.2) F(g, x, 1, 1, 1, T.grassL);
      }
    },
    B(g, T, r) {
      if (T.rocky) {
        F(g, 0, 0, 16, 16, T.stone);
        for (let i = 0; i < 4; i++) {
          const x = (r() * 12) | 0, y = (r() * 12) | 0;
          F(g, x, y, 4, 1, T.stoneL); F(g, x, y + 1, 1, 2, T.stoneL); F(g, x + 1, y + 3, 4, 1, T.stoneD);
        }
        F(g, 0, 15, 16, 1, T.stoneD); F(g, 15, 0, 1, 16, T.stoneD);
        speck(g, r, T.stoneD, 8);
        return;
      }
      bricks(g, T, T.stone, T.stoneL, T.stoneD);
      if (T.moss) {
        F(g, 0, 0, 16, 1, T.moss);
        for (let x = 0; x < 16; x++) if (r() < 0.4) F(g, x, 1, 1, 1 + ((r() * 2) | 0), T.moss);
      }
    },
    P(g, T) {
      F(g, 0, 0, 16, 6, T.plat);
      F(g, 0, 0, 16, 1, T.platL);
      F(g, 0, 5, 16, 1, T.platD);
      F(g, 5, 1, 1, 4, T.platD); F(g, 11, 1, 1, 4, T.platD);
      F(g, 0, 6, 16, 1, '#000000');
    },
    C(g) { shaft(g); },
    c(g) {
      shaft(g);
      F(g, 0, 0, 16, 8, '#000000');
      F(g, 0, 0, 16, 3, '#fcfcfc'); F(g, 0, 3, 16, 1, '#7c7c7c');
      F(g, 1, 4, 14, 4, '#fcfcfc');
      F(g, 1, 5, 2, 2, '#7c7c7c'); F(g, 13, 5, 2, 2, '#7c7c7c');
      F(g, 3, 7, 10, 1, '#bcbcbc');
    },
    b(g) {
      shaft(g);
      F(g, 0, 10, 16, 6, '#000000');
      F(g, 1, 10, 14, 2, '#fcfcfc'); F(g, 1, 11, 14, 1, '#bcbcbc');
      F(g, 0, 12, 16, 4, '#fcfcfc'); F(g, 0, 15, 16, 1, '#7c7c7c');
    },
    E(g) {
      F(g, 0, 0, 16, 16, '#fcfcfc');
      F(g, 0, 0, 16, 1, '#7c7c7c'); F(g, 0, 5, 16, 1, '#bcbcbc');
      F(g, 3, 1, 1, 4, '#bcbcbc'); F(g, 5, 1, 1, 4, '#bcbcbc'); F(g, 11, 1, 1, 4, '#bcbcbc'); F(g, 13, 1, 1, 4, '#bcbcbc');
      F(g, 0, 11, 16, 1, '#7c7c7c');
      for (let x = 1; x < 16; x += 4) F(g, x, 12, 2, 3, '#7c7c7c');
      F(g, 0, 15, 16, 1, '#000000');
    },
    M(g, T, r) { F(g, 0, 0, 16, 16, '#fcfcfc'); speck(g, r, '#bcbcbc', 5); },
    '<'(g) { for (let y = 0; y < 16; y++) { F(g, 15 - y, y, y + 1, 1, '#fcfcfc'); F(g, 15 - y, y, 1, 1, '#7c7c7c'); } },
    '>'(g) { for (let y = 0; y < 16; y++) { F(g, 0, y, y + 1, 1, '#fcfcfc'); F(g, y, y, 1, 1, '#7c7c7c'); } },
    m(g, T) { bricks(g, T, T.inner, T.innerL, T.innerD); },
    n(g) { F(g, 0, 0, 16, 16, '#000000'); },
    k(g, T, r) {
      // Dark cave wall: big irregular stones separated by black cracks.
      F(g, 0, 0, 16, 16, T.innerD);
      F(g, 1, 1, 8, 6, T.inner); F(g, 10, 0, 6, 8, T.inner);
      F(g, 0, 8, 5, 7, T.inner); F(g, 6, 9, 9, 6, T.inner);
      F(g, 1, 1, 8, 1, T.innerL); F(g, 10, 0, 6, 1, T.innerL); F(g, 6, 9, 9, 1, T.innerL);
      speck(g, r, T.innerD, 3);
    },
    H(g, T) {
      F(g, 0, 0, 16, 16, T.wall);
      F(g, 0, 3, 16, 1, T.wallD); F(g, 0, 7, 16, 1, T.wallD); F(g, 0, 11, 16, 1, T.wallD); F(g, 0, 15, 16, 1, T.wallD);
      F(g, 4, 0, 1, 3, T.wallD); F(g, 12, 4, 1, 3, T.wallD); F(g, 6, 8, 1, 3, T.wallD); F(g, 14, 12, 1, 3, T.wallD);
    },
    w(g, T) {
      DRAW.H(g, T);
      F(g, 3, 3, 10, 10, T.trunkD);
      F(g, 4, 4, 8, 8, '#000000');
      F(g, 7, 4, 2, 8, T.trunk); F(g, 4, 7, 8, 2, T.trunk);
    },
    d(g, T) {
      F(g, 0, 0, 16, 16, '#000000');
      F(g, 1, 0, 14, 16, T.trunk);
      F(g, 5, 0, 1, 16, T.trunkD); F(g, 10, 0, 1, 16, T.trunkD);
      F(g, 12, 8, 1, 1, '#f8b800');
    },
    r(g, T) {
      F(g, 0, 0, 16, 16, T.roof);
      for (let yy = 0; yy < 16; yy += 4) {
        const off = (yy / 4) % 2 ? 2 : 0;
        for (let x = off; x < 16; x += 4) F(g, x, yy + 3, 3, 1, T.roofD);
      }
    },
    '('(g, T) { for (let y = 0; y < 16; y++) { F(g, 15 - y, y, y + 1, 1, T.roof); F(g, 15 - y, y, 1, 1, '#000000'); } },
    ')'(g, T) { for (let y = 0; y < 16; y++) { F(g, 0, y, y + 1, 1, T.roof); F(g, y, y, 1, 1, '#000000'); } },
    T(g, T) {
      F(g, 4, 0, 8, 16, '#000000');
      F(g, 5, 0, 6, 16, T.trunk);
      F(g, 5, 0, 1, 16, T.trunkD); F(g, 10, 0, 1, 16, T.trunkD);
      F(g, 7, 3, 1, 3, T.trunkD); F(g, 8, 10, 1, 3, T.trunkD);
    },
    L(g, T, r) {
      F(g, 0, 0, 16, 16, T.leaf);
      speck(g, r, T.leafD, 16);
      for (let i = 0; i < 5; i++) {
        const x = 1 + ((r() * 13) | 0), y = 1 + ((r() * 13) | 0);
        F(g, x, y, 2, 1, T.leafL); F(g, x - 1, y + 1, 1, 1, T.leafL); F(g, x + 1, y + 1, 1, 1, T.leafD);
      }
    },
    // Rounded canopy corners: 1 top-left, 2 top-right, 3 bottom-left, 4 bottom-right
    1(g, T, r) { DRAW.L(g, T, r); corner(g, 0, 0); },
    2(g, T, r) { DRAW.L(g, T, r); corner(g, 1, 0); },
    3(g, T, r) { DRAW.L(g, T, r); corner(g, 0, 1); },
    4(g, T, r) { DRAW.L(g, T, r); corner(g, 1, 1); },
    F(g, T, r) {
      F(g, 1, 8, 14, 8, '#000000');
      F(g, 2, 9, 12, 7, T.leaf);
      F(g, 3, 7, 10, 2, '#000000'); F(g, 4, 8, 8, 2, T.leaf);
      speck(g, r, T.leafL, 0);
      [[4, 10], [9, 9], [11, 12], [6, 13]].forEach((p) => F(g, p[0], p[1], 2, 1, '#d82800'));
      F(g, 5, 11, 1, 1, T.leafL); F(g, 10, 13, 1, 1, T.leafL);
    },
    X(g) {
      for (let s = 0; s < 4; s++) {
        const bx = s * 4;
        for (let yy = 0; yy < 10; yy++) {
          const half = Math.min(2, (yy / 3) | 0);
          F(g, bx + 2 - half - (half ? 0 : 0), 6 + yy, Math.max(1, half * 2), 1, '#bcbcbc');
          F(g, bx + 2 - half, 6 + yy, 1, 1, '#fcfcfc');
        }
        F(g, bx + 2, 6, 1, 1, '#fcfcfc');
      }
      F(g, 0, 15, 16, 1, '#7c7c7c');
    }
  };

  const cache = {};
  O.Tiles = {
    theme(name) { return THEMES[name] || THEMES.village; },
    get(theme, ch) {
      const key = theme + ':' + ch;
      if (cache[key] !== undefined) return cache[key];
      const fn = DRAW[ch];
      if (!fn) { cache[key] = null; return null; }
      const c = O.makeCanvas(16, 16);
      let seed = 0;
      for (let i = 0; i < key.length; i++) seed = (seed * 31 + key.charCodeAt(i)) >>> 0;
      fn(c.getContext('2d'), O.Tiles.theme(theme), O.rng(seed || 1));
      cache[key] = c;
      return c;
    },
    parallax(theme) {
      const key = 'bg:' + theme;
      if (cache[key]) return cache[key];
      const c = O.makeCanvas(512, 208);
      const g = c.getContext('2d');
      const r = O.rng(99);
      const TAU = Math.PI * 2;
      if (theme === 'village') {
        F(g, 0, 0, 512, 208, '#3cbcfc');
        for (let x = 0; x < 512; x += 2) {
          const h = Math.round((70 + 34 * Math.sin((x / 512) * TAU * 2) + 16 * Math.sin((x / 512) * TAU * 5 + 1) + 8 * Math.sin((x / 512) * TAU * 11)) / 2) * 2;
          F(g, x, 208 - h, 2, h, '#6888fc');
          if (h > 96) F(g, x, 208 - h, 2, Math.min(8, h - 96), '#fcfcfc');
          const h2 = Math.round((40 + 10 * Math.sin((x / 512) * TAU * 3 + 2) + 6 * Math.sin((x / 512) * TAU * 7)) / 2) * 2;
          F(g, x, 208 - h2, 2, h2, '#00a844');
        }
        for (let i = 0; i < 6; i++) {
          const cx = (i * 90 + r() * 40) | 0, cy = 14 + ((r() * 40) | 0);
          F(g, cx, cy + 4, 34, 6, '#fcfcfc'); F(g, cx + 6, cy, 14, 4, '#fcfcfc'); F(g, cx + 18, cy + 2, 10, 2, '#fcfcfc');
          F(g, cx + 2, cy + 10, 30, 2, '#bcbcbc');
        }
      } else if (theme === 'forest') {
        F(g, 0, 0, 512, 208, '#0000bc');
        for (let i = 0; i < 40; i++) F(g, (r() * 512) | 0, (r() * 90) | 0, 1, 1, i % 4 ? '#6888fc' : '#fcfcfc');
        F(g, 400, 22, 16, 16, '#fce0a8'); F(g, 398, 26, 20, 8, '#fce0a8'); F(g, 404, 20, 8, 20, '#fce0a8');
        for (let x = 0; x < 512; x += 4) {
          const h = Math.round(90 + 14 * Math.sin((x / 512) * TAU * 9) + 10 * Math.sin((x / 512) * TAU * 23 + 1) + 6 * Math.sin((x / 512) * TAU * 41));
          F(g, x, 208 - h, 4, h, '#004058');
        }
      } else if (theme === 'cave') {
        F(g, 0, 0, 512, 208, '#000000');
        for (let x = 0; x < 512; x += 24) {
          const h = 10 + ((r() * 30) | 0);
          for (let y = 0; y < h; y++) F(g, x + ((y / 3) | 0) * 0 + Math.floor(y * 6 / h), y + 32, Math.max(1, 12 - Math.floor(y * 12 / h)), 1, '#1c0c00');
        }
      } else {
        F(g, 0, 0, 512, 208, '#000000');
        for (let i = 0; i < 50; i++) F(g, (r() * 512) | 0, (r() * 200) | 0, 1, 1, i % 5 ? '#7c7c7c' : '#fcfcfc');
      }
      cache[key] = c;
      return c;
    }
  };
})(window.OLY);
