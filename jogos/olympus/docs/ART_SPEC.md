# ORPHEUS: SONG OF OLYMPUS — Modern pixel-art overhaul (shared spec for every art module)

> Nota: as ferramentas citadas abaixo (preview.js, gameshot.js, prop.js) agora ficam em `jogos/olympus/tools/` e funcionam em qualquer computador (`cd jogos/olympus/tools && npm install && npx playwright install chromium`). Onde este texto cita uma pasta `/tmp/.../scratchpad/art`, use `jogos/olympus/tools`.

Project root: `/home/user/WebSite/jogos/olympus/` (plain browser JS, no build step, no modules — every file is an IIFE on `window.OLY`, referred to as `O`).
The game is a side-scrolling action-adventure inspired by the NES classic *The Battle of Olympus* (Greek myth: Orpheus crosses Arcadia to rescue Eurydice from Hades). The player (Brazilian teacher) said the current art "looks really bad" and asked for **beautiful, modern sprites**. Everything must be original work (no copying of the 1988 game's art).

## Art direction — "modern pixel art", not NES
Target the look of contemporary indie pixel games (Celeste, Dead Cells, Blasphemous, Owlboy, Eastward):
- **Rich hue-shifted ramps**: shadows drift toward violet/blue, highlights toward warm yellow. Use `O.PAL5` ramps (5 tones, index 0 = brightest, 4 = darkest) or build new ones with `O.makeRamp(baseHex, n)`. Never shade with pure black or plain darker grey.
- **Coloured "sel-out" outlines**: the outer silhouette uses `O.PAL5.outline` (#1b1426, deep plum) — never #000000. Interior separations use the darkest tone of the local material, not black. Where a silhouette edge is strongly lit, you may use a dark tone of the material instead of the outline colour.
- **Light from the upper-left** for every asset (consistent scene lighting). Optional thin cool **rim light** on the right/back edge of characters for depth.
- **Clean clusters, no pillow shading, no noise**: shade by form (cylinders for limbs, spheres for heads, folds for cloth). Dithering only for large soft gradients (sky, glow), never on small character parts.
- **Readable silhouettes at 1x**, strong contrast between character and background, clear faces (eyes readable), expressive poses (line of action, contrapposto), overlapping action and follow-through in animation (hair/cape/cloth lag 1–2 frames behind the body), squash & stretch on land/jump.
- **Anti-aliasing by hand** only where it helps curves (1 intermediate tone on curved outlines), never blurry.
- Palette world: Mediterranean. Whitewashed walls, terracotta roofs, blue doors, olive and cypress trees, marble temples with gold, twilight forest, warm-lit cave, divine gold light for gods.

## Resolution and scale (already implemented in the engine)
- Internal resolution **384×216** (16:9), scaled with nearest-neighbour. Tiles are **16×16**. The level is 13 rows (208 px) drawn at screen y = 8 (`O.VIEW_Y`); the HUD overlays the top.
- Character scale reference: **Orpheus ≈ 36–38 px tall** (feet to top of hair). Hitbox 12×34 standing, 12×22 crouching.
- NPC humans 34–38 px; **gods (Zeus, Hermes) 42–48 px** (bigger, divine); Hades ≈ 44 px.
- Satyr ≈ 38–42 px (hitbox 14×34). Snake ≈ 26–30×12–14 (hitbox 20×10, very low — the hero must crouch to hit it). Bat wingspan ≈ 26–32 px (hitbox 16×10). **Erymanthian Boar ≈ 64–76 px long, 44–52 px tall** (hitbox 48×32).

## Drawing toolkit (js/pix.js — read it)
`new O.Pix(w,h)` pixel grid: `set/get/rect/ellipse/ball/orb(n-tone shaded ellipse)/capsule(x0,y0,x1,y1,r0,r1,ramp)` (shaded limb), `poly(points,c)`, `line`, `stroke(x0,y0,x1,y1,r,c)`, `ditherRect`, `outline(c)`, `selout(outerColor)`, `blit(src,ox,oy)`, `canvas()`.
Helpers: `O.PAL5` (master palette), `O.makeRamp`, `O.mix(a,b,t)`, `O.shift(hex, amt)` (+ lighter/warmer, − darker/cooler), `O.bayer(x,y)`, `O.rng(seed)`, `O.hash(x,y,s)`.
You may also draw with the Canvas 2D API into `O.makeCanvas(w,h)` (imageSmoothing is off) — but keep hard pixel edges (no anti-aliased canvas paths/gradients on sprites; use them only for big soft effects like light).
Hand-authored pixel maps (arrays of strings with a legend → colours) are encouraged for faces, hair and anything that needs precise detail; combine with procedural parts as you like. **You may write any helpers inside your own file.**

## Registering art
- Each module pushes an init function: `O.ART_INITS.push(function () { ... })`. It runs at boot after the legacy sprites, before the game starts.
- `O.registerSprite(name, pixOrCanvas, { ax, ay })` — (ax, ay) is the **anchor pixel**, placed on the entity's feet point (bottom-centre of the hitbox). Default anchor = bottom-centre (last row). Flipped (facing left) and white-flash variants are generated automatically — **draw everything facing RIGHT**.
- Anchor rule: for grounded things, `ay` = the row of the outline pixel under the feet (it overlaps the ground's top pixel row), `ax` = horizontal centre of the body (not of a weapon or smear). Keep `ax` consistent across all frames of a character so it does not jitter.
- **Bats are anchored on the body centre** (engine draws bat frames at the hitbox centre).
- Legacy placeholder sprites exist under the same names; your registration overwrites them.

## Frame contracts (names are exact; `_N` = frame index starting at 0)
### Hero — owner: js/art/hero.js
| name | frames | engine timing / meaning |
|---|---|---|
| hero_idle_0..3 | 4 | breathing loop, 12 ticks/frame (60 ticks = 1 s) |
| hero_run_0..7 | 8 | run cycle, 5 ticks/frame, speed 1.5 px/tick |
| hero_jump | 1 | rising (vy < −1.2) |
| hero_peak | 1 | apex |
| hero_fall | 1 | falling |
| hero_land | 1 | landing squash (6 ticks) |
| hero_crouch | 1 | crouching (hitbox 22 tall) |
| hero_atk_0..4 | 5 | standing club swing; attack lasts 20 ticks: f0 ticks 0–3 anticipation, f1 4–6 wind-up, **f2 7–10 strike (hitbox active 7–13) — include a bold smear/arc**, f3 11–14 follow-through, f4 15–19 recover. Hitbox: 22 px in front of the body, from feet−28 to feet−14 |
| hero_catk_0..4 | 5 | crouching low strike, same timing; hitbox from feet−14 to feet (hits snakes) |
| hero_jatk_0..4 | 5 | airborne swing, same timing |
| hero_hurt | 1 | knocked back |
| hero_dead_0, hero_dead_1 | 2 | collapsing, lying on the ground |
| hero_hold | 1 | both arms raised holding an item above the head (item drawn by the engine ~8 px above the sprite top) |
| hero_lyre_0..1 | 2 | playing a golden lyre (title screen / story) |
The weapon is a **wooden club** (thick knotted olive-wood club, maybe with a bronze band). It is part of the attack frames (engine does not draw it separately). Orpheus: young Greek hero, auburn wavy hair, red headband, white short chiton with gold trim + brown belt, a **short red cloak/cape** that flows in motion, leather sandals with cross straps, bronze bracers. Friendly determined face.

### NPCs & gods — owner: js/art/npcs.js
- Idle loops `<kind>_idle_0..3` (12 ticks/frame; subtle breathing, blinking, cloth/hair sway) for kinds: **elder** (old village sage, white hair & long beard, brown wool himation, wooden staff), **merchant** (market woman with a clay jar of ambrosia, light-blue dress), **villager** (young woman, pink dress, flower in dark hair), **eurydice** (gentle young woman, golden hair, white flowing dress, flower crown), **zeus** (king of gods, 44–48 px, white hair and beard, golden laurel crown, white/gold robes, holds a crackling lightning bolt), **hermes** (messenger god, 42–46 px, winged petasos helmet, winged sandals, caduceus staff, light-blue short chiton, youthful), **hades** (lord of the underworld, 44 px, dark robes, pale grey-violet skin, crown of dark flames or iron, glowing eyes, bident).
- Also `eurydice_ghost_0..3` (translucent-looking spectral version: pale cyan/white, can be drawn with lighter palette; the story screen uses it).
- **Portraits for dialogue boxes**: `portrait_<kind>` for elder, merchant, villager, eurydice, zeus, hermes, hades, **orpheus** (48×48 each, bust shot facing right, framed-ready: no frame needed, transparent or with a soft background). These carry most of the "beautiful" impression — make them detailed and expressive.
- Optional: define `O.drawNPCAura = function (ctx, game, npc, bob) {}` to draw a divine aura behind gods (npc.x, npc.y, npc.w, npc.h are world coords; screen x = npc.x − game.cam, screen y = npc.y + O.VIEW_Y).

### Enemies — owner: js/art/enemies.js
| name | frames | notes |
|---|---|---|
| snake_move_0..3 | 4 | slithering (8 ticks/frame); low green viper with patterned back, raised head, flicking tongue |
| snake_lunge_0..1 | 2 | striking forward |
| bat_hang | 1 | hanging upside down, wings folded (anchor = body centre) |
| bat_fly_0..3 | 4 | wing flap cycle (4 ticks/frame), anchor = body centre |
| satyr_idle_0..1 | 2 | goat-legged forest brute with horns, beard, holding a crude club or spear |
| satyr_walk_0..5 | 6 | 6 ticks/frame |
| satyr_jump | 1 | |
| boar_idle_0..3 | 4 | Erymanthian Boar — huge, bristly mane, curved tusks, glowing red eye; breathing (10 ticks/frame) |
| boar_paw_0..3 | 4 | scraping the ground before charging (5 ticks/frame), snorting |
| boar_run_0..5 | 6 | full gallop charge (4 ticks/frame) — dynamic, stretched |
| boar_stun_0..3 | 4 | dazed after hitting the wall (stars are fine), 8 ticks/frame |
| rock | 1 | falling rock ~10×10 (anchor bottom-centre) |

### World — owner: js/art/world.js (tiles, decorations, props)
Override parts of `O.Tiles` (defined in js/tiles.js, keep its API): `O.Tiles.get(theme, ch, variant, extra)`, `O.Tiles.decor(type, seed) → {c: canvas, w, h}`, `O.Tiles.tuft(theme, v)`, `O.Tiles.theme(name)` (must keep a `.dirt` 3-colour array). **Better: implement `O.Tiles.getCtx(theme, ch, x, y, lvl) → canvas 16×16`** (autotiling with neighbour awareness via `lvl.tile(x,y)` / `lvl.isSolid(x,y)`) and set `O.Tiles.handlesEdges = true` to take over edges and grass tufts; optional `O.Tiles.overlay(lvl, backCtx, frontCtx)` runs after tiles are baked (extra details, drips, moss, grass overhangs).
Themes: `village` (sunny Arcadian village), `forest` (twilight/moonlit forest), `cave` (boar's den), `temple` (marble interiors of Zeus/Hermes).
Tile chars: G grass-topped earth (solid), D earth (solid), B stone/rock blocks (solid), P one-way platform (log in forest, marble slab elsewhere), X spikes (hazard), C/c/b column shaft/capital/base (background), E entablature with Greek key, M marble fill, < > pediment slopes, m interior wall, n dark doorway, H whitewashed wall, w window (with blue shutters), d door (blue; `extra`=true for the top piece), r terracotta roof, ( ) roof slope ends, k cave back-wall.
Decor types used by levels (bottom-centred on a tile unless anchor 'top'): olive, cypress, oak, bush, grass (front layer), flowers (front), amphora, rocks, fence, mushrooms, curtain (hangs from top), window (arched temple window), stalactite (hangs from top, front), crystals, pedestal. Also register sprite `statue` (marble statue of a Greek hero, ~34 px, anchor = feet; engine draws it on the pedestal).
Light props: define `O.drawLightProp(ctx, type, x, y, t, i)` for type `brazier` (bronze tripod standing on (x,y) = floor point, with animated fire), `torch` ((x,y) = wall mount point) and `crystal` (glow for a crystal cluster standing on (x,y)). Engine-side lighting (darkness, glow) is done by the sky/light module — you only draw the props and their flames.

### Sky, lighting & atmosphere — owner: js/art/sky.js
- Override `O.Tiles.background(theme) → { sky: canvas 384×216, layers: [{ c: canvas (height 216, width ≥ 768, tiles horizontally), f: parallax factor 0..1, y: optional y offset }] }` for all 4 themes. Village: bright Mediterranean day with Mount Olympus (snow, golden temple on the summit), hills with cypresses/villages, soft clouds. Forest: twilight → moonlit night, big moon, layered tree silhouettes, mist. Cave: deep warm-dark cavern layers. Temple: night sky (mostly hidden by walls).
- `O.Light = { apply(ctx, game) }` — called every frame after the world and entities are drawn (before HUD). Implement per-theme ambient darkness + light sources (use `game.lvl.def.lights` items `{type, tx, row}` → world px (tx*16+8, row*16), screen = world − game.cam, y + O.VIEW_Y; also the player `game.player` and gods). Bloom/glow with additive blending is allowed, fog layers, god rays in temples, vignette, colour grading. Keep it pixel-friendly (quantize/dither the light edges) and cheap (pre-render gradients into cached canvases; 60 fps).
- Particle look (optional): `O.FXDraw(ctx, f, x, y, game)` for effects (`f.type` in puff, star, spark, dust, bit, text; `f.t` age) and `O.AmbDraw(ctx, p, x, y, game)` for ambient particles (`p.k` in leaf, fly, ember, drip; `p.t` age). Return `false` to fall back to the engine's default drawing.

### UI — owner: js/ui.js
Define `O.UI = { drawHUD, drawDialog, drawPause, drawTitle, drawStory, drawGameOver, drawEnding, drawBanner, drawBossBar }` (each `(ctx, game[, extra])`). See js/render.js for what data each screen shows (the old versions are there as reference) and js/story.js / js/game.js for state (`game.st` hp/maxHp/olives/ambrosia/items, `game.dialog` {speaker, pages, page, chars, choice{options, sel}}, `game.state`, `game.sel`, `game.hasSave`, `game.t`, `game.page/chars/storyT` for story, `game.endT`, O.STORY, O.ENDING, O.questHint(st), O.ITEMS).
- Modern HUD overlaid on the game view (no black bar): life as a row of heart/laurel pips or a stylised bar, olives and ambrosia counters, item slots. Dialogue box with the speaker's **portrait** (`portrait_<kind>`; map speaker names ELDER→elder, MERCHANT→merchant, WOMAN→villager, ZEUS→zeus, HERMES→hermes; empty speaker = narration without portrait), name plate, typewriter text, choice cursor.
- Title screen: gorgeous key-art composition (use backgrounds from O.Tiles.background and character frames like hero_lyre_0, eurydice_idle_0), a beautiful logo "ORPHEUS" + subtitle "SONG OF OLYMPUS", menu NEW GAME / CONTINUE (CONTINUE greyed when !game.hasSave), "PRESS START" state when game.state === 'press'.
- Story scenes (5 pages: scenes orpheus, lovers, serpent, hades, oath) illustrated with the new sprites and backgrounds, text box with typewriter (`game.chars`).
- You may **override the font**: redefine `O.text(ctx, str, x, y, color, scale)` with a nicer bold pixel font (must support A–Z, 0–9 and . , ! ? ' - : / ( ) " > < + = * ^ and space; text is always upper-case). Keep glyphs ≤ 8 px wide so layouts fit (27 characters per dialogue line).
- Item/icon sprites (register them): `olive`, `ambrosia`, `pom` (pomegranate) — anchor bottom-centre, ~10–14 px; `heart`, `icon_club`, `icon_sandals`, `lyre`, `bolt`, `arrow_up`.

## File ownership (critical — agents run in parallel)
Only edit the files you own. Engine files (entities.js, game.js, render.js, levels.js, main.js, core.js, pix.js, sprites.js, tiles.js, index.html, story.js, audio.js, input.js) are owned by the lead — if you need an engine change, describe it in your final report instead of editing. Never break other modules: every edit must pass `node --check <file>`; runtime errors in your module are caught and logged, but test that your module logs **no errors**.

## How to see your work (MANDATORY — iterate visually)
Tools in `/tmp/claude-0/-home-user-WebSite/fc2b0df1-ad11-50d1-b766-105c51b3dfa1/scratchpad/art/` (run with node from that folder):
- `node preview.js <out.png> <prefix1,prefix2> [zoom=4] [bg=checker|sky|night|cave|marble]` — zoomed sheet of every registered sprite whose name starts with a prefix, red dot = anchor. Example: `node preview.js /tmp/.../art/hero_sheet.png hero_ 4 sky`.
- `node gameshot.js <out.png> <level> <tx> [row=11] [scale=3] [extraJS]` — real in-game screenshot. Levels: village, forest, den, zeus, hermes, plus special: title, story0..story4, pause, dialog, itemget, gameover, ending. `extraJS` runs inside the page with `g` = game (e.g. `"g.player.atk=10"` or `"g.enemies=[]"`).
Write your output images into that same art/ folder with your module prefix. Look at them with the Read tool (it shows images). Judge at zoom AND at 1x/3x in-game. Iterate until it genuinely looks like a polished modern indie game — compare against your mental reference of Celeste/Dead Cells/Blasphemous quality. At least 4 visual iterations are expected.

## Final report (your last message)
Return: what you built (list of registered names), the final preview image paths, known weaknesses, and any engine changes you need from the lead.
