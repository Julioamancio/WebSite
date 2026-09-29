/* levels.js — map layouts. Each level is 13 rows of 16px tiles.
   Tile legend:
     G grass (solid)   D dirt (solid)     B stone/rock (solid)   P one-way platform
     X spikes (hazard) C/c/b column shaft/capital/base (background)
     E entablature  M marble  < > pediment slopes   m inner wall   n dark doorway
     H house wall  w window  d door  r roof  ( ) roof slopes
     T tree trunk  L leaves  F bush   k cave wall   . empty
   Spawn points use {tx, row}: tile column and the floor row the hero stands on. */
(function (O) {
  'use strict';
  const ROWS = O.ROWS;

  function builder(w) {
    const t = [];
    for (let y = 0; y < ROWS; y++) t.push(new Array(w).fill('.'));
    const inside = (x, y) => x >= 0 && x < w && y >= 0 && y < ROWS;
    const b = {
      t, w,
      fill(x, y, ww, hh, ch) {
        for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (inside(i, j)) t[j][i] = ch;
        return b;
      },
      set(x, y, ch) { return b.fill(x, y, 1, 1, ch); },
      // Background decoration only fills empty cells.
      deco(x, y, ww, hh, ch) {
        for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (inside(i, j) && t[j][i] === '.') t[j][i] = ch;
        return b;
      },
      ground(x0, x1, row) {
        const r = row === undefined ? 11 : row;
        b.fill(x0, r, x1 - x0 + 1, 1, 'G');
        b.fill(x0, r + 1, x1 - x0 + 1, ROWS - r - 1, 'D');
        return b;
      },
      tree(x, floor) {
        const f = floor === undefined ? 11 : floor;
        b.deco(x, f - 3, 1, 3, 'T');
        b.deco(x - 1, f - 6, 3, 3, 'L');
        [[x - 1, f - 6, '1'], [x + 1, f - 6, '2'], [x - 1, f - 4, '3'], [x + 1, f - 4, '4']].forEach((k) => {
          if (inside(k[0], k[1]) && t[k[1]][k[0]] === 'L') t[k[1]][k[0]] = k[2];
        });
        return b;
      },
      column(x, top, bottom) {
        b.set(x, top, 'c');
        b.fill(x, top + 1, 1, bottom - top - 1, 'C');
        b.set(x, bottom, 'b');
        return b;
      },
      house(x, floor) {
        const f = floor === undefined ? 11 : floor;
        b.fill(x, f - 4, 6, 4, 'H');
        b.set(x, f - 5, '('); b.fill(x + 1, f - 5, 4, 1, 'r'); b.set(x + 5, f - 5, ')');
        b.set(x + 1, f - 6, '('); b.fill(x + 2, f - 6, 2, 1, 'r'); b.set(x + 4, f - 6, ')');
        b.fill(x + 2, f - 2, 1, 2, 'd');
        b.set(x + 4, f - 3, 'w');
        return b;
      }
    };
    return b;
  }
  O.levelBuilder = builder;

  O.LEVEL_DEFS = {
    village: {
      name: 'ARCADIA', theme: 'village', music: 'village', w: 56,
      build(b) {
        b.ground(0, 55);
        b.house(2);
        b.tree(12);
        b.house(15);
        b.deco(23, 10, 1, 1, 'F'); b.deco(27, 10, 1, 1, 'F');
        // Temple of Zeus
        b.fill(30, 10, 13, 1, 'B');
        b.fill(32, 5, 9, 5, 'm');
        b.fill(35, 6, 3, 4, 'n');
        [31, 33, 39, 41].forEach((x) => b.column(x, 5, 9));
        b.fill(30, 4, 13, 1, 'E');
        b.set(30, 3, '<'); b.fill(31, 3, 11, 1, 'M'); b.set(42, 3, '>');
        b.set(32, 2, '<'); b.fill(33, 2, 7, 1, 'M'); b.set(40, 2, '>');
        b.tree(47); b.tree(52);
        b.deco(49, 10, 1, 1, 'F');
      },
      npcs: [
        { kind: 'elder', tx: 9 },
        { kind: 'merchant', tx: 25 },
        { kind: 'villager', tx: 44 }
      ],
      exits: [
        { type: 'edge', side: 'right', to: 'forest', spawn: { tx: 1, row: 11 }, needs: 'club' },
        { type: 'door', tx: 35, ty: 6, tw: 3, th: 4, to: 'zeus', spawn: { tx: 2, row: 11 } }
      ]
    },

    zeus: {
      name: 'TEMPLE OF ZEUS', theme: 'temple', music: 'temple', w: 16,
      build(b) {
        b.fill(0, 0, 16, 11, 'm');
        b.fill(0, 0, 16, 1, 'E');
        b.fill(0, 11, 16, 2, 'B');
        b.column(3, 1, 10); b.column(12, 1, 10);
        b.fill(0, 7, 2, 4, 'n');
      },
      decor: [{ type: 'brazier', tx: 5, row: 11 }, { type: 'brazier', tx: 10, row: 11 }],
      npcs: [{ kind: 'zeus', tx: 7, row: 11, scale: 2, float: true }],
      exits: [{ type: 'door', tx: 0, ty: 7, tw: 2, th: 4, to: 'village', spawn: { tx: 36, row: 10 } }]
    },

    forest: {
      name: 'FOREST OF ARCADIA', theme: 'forest', music: 'forest', w: 112,
      build(b) {
        b.ground(0, 21); b.ground(24, 46); b.ground(50, 69); b.ground(72, 87); b.ground(90, 111);
        b.ground(28, 33, 9);
        b.fill(40, 9, 2, 2, 'B');
        b.set(48, 8, 'P');
        b.fill(56, 10, 3, 1, 'X');
        b.ground(59, 59, 9); b.ground(60, 64, 8);
        b.fill(76, 8, 3, 1, 'P'); b.fill(80, 6, 3, 1, 'P');
        b.fill(94, 10, 2, 1, 'X');
        b.fill(104, 4, 8, 7, 'B');
        b.fill(104, 8, 4, 3, 'n');
        [4, 11, 18, 26, 37, 44, 53, 67, 75, 85, 98].forEach((x) => b.tree(x, 11));
        b.tree(31, 9); b.tree(62, 8);
        b.deco(15, 10, 1, 1, 'F'); b.deco(52, 10, 1, 1, 'F'); b.deco(92, 10, 1, 1, 'F');
      },
      enemies: [
        { kind: 'snake', tx: 10 }, { kind: 'snake', tx: 26 }, { kind: 'snake', tx: 38 },
        { kind: 'snake', tx: 53 }, { kind: 'snake', tx: 66 }, { kind: 'snake', tx: 79 }, { kind: 'snake', tx: 97 },
        { kind: 'bat', tx: 20, row: 3 }, { kind: 'bat', tx: 45, row: 3 }, { kind: 'bat', tx: 63, row: 2 },
        { kind: 'bat', tx: 84, row: 3 }, { kind: 'bat', tx: 100, row: 3 },
        { kind: 'satyr', tx: 36 }, { kind: 'satyr', tx: 74 }, { kind: 'satyr', tx: 93 }
      ],
      items: [{ kind: 'pom', tx: 81, row: 6 }],
      exits: [
        { type: 'edge', side: 'left', to: 'village', spawn: { tx: 54, row: 11 } },
        { type: 'door', tx: 105, ty: 8, tw: 2, th: 3, to: 'den', spawn: { tx: 2, row: 11 } }
      ]
    },

    den: {
      name: "BOAR'S DEN", theme: 'cave', music: null, w: 20,
      build(b) {
        b.fill(0, 0, 20, 2, 'B');
        b.fill(0, 11, 20, 2, 'B');
        b.fill(0, 2, 1, 9, 'B');
        b.fill(19, 2, 1, 9, 'B');
        b.fill(1, 2, 18, 9, 'k');
        b.fill(1, 8, 2, 3, 'n');
      },
      exits: [
        { type: 'door', tx: 1, ty: 8, tw: 2, th: 3, to: 'forest', spawn: { tx: 102, row: 11 }, when: (g) => !g.bossActive },
        { type: 'door', tx: 17, ty: 8, tw: 2, th: 3, to: 'hermes', spawn: { tx: 2, row: 11 }, when: (g) => !!g.st.flags.boarDefeated }
      ],
      onEnter(g) {
        if (g.st.flags.boarDefeated) {
          g.openDenDoor();
          g.music('temple');
        } else {
          g.enemies.push(new O.Boar(14 * O.TILE, 11 * O.TILE));
          g.bossActive = true;
        }
      }
    },

    hermes: {
      name: 'SHRINE OF HERMES', theme: 'temple', music: 'temple', w: 16,
      build(b) {
        b.fill(0, 0, 16, 11, 'm');
        b.fill(0, 0, 16, 1, 'E');
        b.fill(0, 11, 16, 2, 'B');
        b.column(4, 1, 10); b.column(13, 1, 10);
        b.fill(0, 7, 2, 4, 'n');
      },
      decor: [{ type: 'brazier', tx: 6, row: 11 }, { type: 'brazier', tx: 11, row: 11 }],
      npcs: [{ kind: 'hermes', tx: 8, row: 11, scale: 2, float: true }],
      exits: [{ type: 'door', tx: 0, ty: 7, tw: 2, th: 4, to: 'den', spawn: { tx: 16, row: 11 } }]
    }
  };
})(window.OLY);
