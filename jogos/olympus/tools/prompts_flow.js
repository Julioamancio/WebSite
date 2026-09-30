// Usage: node prompts_flow.js
// Single source for the Google Flow scenery prompts. Writes:
//   docs/prompts_flow.html          page with a Copy button per prompt (published as an Artifact)
//   docs/PROMPTS_FLOW_CENARIOS.md   Markdown mirror
//   ORPHEUS_MEMORIA_COMPLETA.md     section 8.2 is replaced with the same prompts
// Edit the prompts HERE, never in the generated files.
const fs = require('fs');
const path = require('path');

const PAGE_URL = 'https://claude.ai/artifact/XrdJBjQUYghg8jiKqWtXgm'; // Artifact built from docs/prompts_flow.html
const ROOT = path.resolve(__dirname, '..', '..', '..');
const DOCS = path.resolve(__dirname, '..', 'docs');

// ---------- fixed blocks ----------
// Art direction (29/09/2026): beautiful 2.5D — stylized 3D render, NOT retro pixel art.
const STYLE_SCENE = '[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.';
// Magenta-keyed images: no violet/lilac anywhere and nothing soft spilling onto the magenta, or the chroma key eats the art.
const STYLE_LAYER = '[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.';
const styleAsset = (ratio) => `[STYLE] Beautiful stylized 3D building asset for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, hand-painted texture detail on stone, wood, cloth and roof tiles, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), seen perfectly straight from the front as a flat elevation with no perspective, ${ratio}, high resolution, sharp clean edges.`;

const WORLD_SCENE = '[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.';
const WORLD_KEY = '[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.';

const bgLayer = '[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.';
const bgAsset = (what) => `[BACKGROUND] Everything that is not part of the ${what} must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient, no shadow and no details. Keep a crisp clean edge between the ${what} and the magenta, with no glow or soft shadow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the ${what}.`;

const NEG_BASE = 'no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain';
const negScene = (extra) => `[NEGATIVE] ${NEG_BASE}${extra ? ', ' + extra : ''}.`;
const negLayer = (extra) => `[NEGATIVE] ${NEG_BASE}${extra ? ', ' + extra : ''}, no purple, no violet, no pink, no lilac.`;
const negAsset = (extra) => `[NEGATIVE] ${NEG_BASE}, no signs, no ground, no grass, no sky, no background scenery, no trees behind the building, no perspective, no vanishing point, no visible side walls, no roof seen from above, no cast shadow on the background${extra ? ', ' + extra : ''}, no purple, no violet, no pink, no lilac.`;

const scene = (body, extra) => [STYLE_SCENE, WORLD_SCENE, ...body, negScene(extra)].join('\n\n');
const layer = (body, extra) => [STYLE_LAYER, WORLD_KEY, body, bgLayer, negLayer(extra)].join('\n\n');
const asset = (ratio, what, body, extra) => [styleAsset(ratio), WORLD_KEY, ...body, bgAsset(what), negAsset(extra)].join('\n\n');

// ---------- sections ----------
const SECTIONS = [
  { id: 'fundos', name: 'Fundos', intro: 'Camadas que rolam atrás do jogo. As de fundo magenta viram parallax (o magenta é recortado por código); os céus são imagem cheia. Nas camadas com magenta, lilás e sombra violeta viraram azul para o recorte não comer o desenho.' },
  { id: 'casas', name: 'Casas de frente', intro: 'Prédios vistos bem de frente, sobre magenta, para entrar no lugar das casas e do templo feitos de tiles. São novos: não estavam na lista de 16.' },
  { id: 'interiores', name: 'Interiores', intro: 'Fundo inteiro das salas fechadas. O centro fica livre porque o deus ou o chefe aparece ali.' },
  { id: 'historia', name: 'Título e história', intro: 'Tela de abertura e cenas das páginas da história.' }
];

// ---------- prompts ----------
const P = [
  // Fundos
  { n: '02', sec: 'fundos', first: true, title: 'Vilarejo — camada distante', file: 'vila_longe.png', ratio: '16:9', key: true,
    sum: 'Monte Olimpo nevado com o templo dourado no pico, sobre magenta.',
    game: 'ARCADIA · camada longe, parallax 0,08',
    text: layer('[LAYER] Far parallax layer, bright afternoon. Mount Olympus as a massive snow-capped mountain range: the main peak slightly right of center reaching about 15% from the top of the image, with a tiny golden temple on the summit; secondary peaks on both sides. Rock faces in cool slate blue with sunlit cream-white snow on the left slopes and cool blue shadows on the right slopes. The base of the range fades to a lighter, opaque pale-blue tone. The mountain range touches both the left and right edges of the image at similar heights.',
      'no clouds, no sun, no magenta inside the mountains') },
  { n: '03', sec: 'fundos', title: 'Vilarejo — céu', file: 'vila_ceu.png', ratio: '16:9',
    sum: 'Céu azul de tarde com sol e nuvens. Imagem cheia, sem magenta.',
    game: 'ARCADIA · céu fixo, parallax 0',
    text: scene(['[LAYER] Sky only, bright Mediterranean afternoon: a smooth banded gradient from deep cobalt blue at the top to pale warm cream near the horizon, a soft glowing sun in the upper-right area, and three or four stylized fluffy cumulus clouds with cream highlights and lavender undersides floating in the middle band. The lower 40% of the image is just pale hazy sky.'],
      'no mountains, no ground, no buildings, no birds') },
  { n: '04', sec: 'fundos', title: 'Vilarejo — colinas (meio)', file: 'vila_meio.png', ratio: '16:9', key: true,
    sum: 'Colinas verdes com ciprestes, oliveiras e casinhas, sobre magenta.',
    game: 'ARCADIA · camada do meio, parallax 0,25',
    text: layer('[LAYER] Middle parallax layer: gentle rolling green hills occupying the lower 45% of the image, dotted with tall dark cypress trees, round olive groves and a few tiny whitewashed houses with terracotta roofs; a winding dirt path and low dry-stone walls. The hills are slightly hazy (lighter and bluer than a foreground). Hill tops are lit from the upper-left. The hill line continues to both the left and right edges at similar heights.',
      'no mountains, no sky details, no clouds') },
  { n: '05', sec: 'fundos', title: 'Vilarejo — primeiro plano', file: 'vila_perto.png', ratio: '16:9', key: true,
    sum: 'Faixa de arbustos, flores e muro de pedra na frente da cena, sobre magenta.',
    game: 'ARCADIA · primeiro plano, parallax 0,5',
    text: layer('[LAYER] Near parallax layer: a continuous band in the bottom 30% of the image made of lush silver-green olive bushes, wild blue sage, red poppies and white daisies, and a low weathered dry-stone wall with patches of moss. Saturated colors, well defined, lit from the upper-left. The band touches both the left and right edges.',
      'no trees taller than 30% of the image, no magenta flowers, no pink flowers') },
  { n: '07', sec: 'fundos', title: 'Floresta — céu noturno', file: 'floresta_ceu.png', ratio: '16:9',
    sum: 'Céu noturno com lua cheia e estrelas. Imagem cheia, sem magenta.',
    game: 'FOREST OF ARCADIA · céu fixo, parallax 0',
    text: scene(['[LAYER] Night sky over a forest, just after twilight: banded gradient from deep indigo at the top through violet to a faint dusty rose glow at the horizon, a large luminous full moon with visible craters in the upper-left area surrounded by a soft glowing halo, many small twinkling stars, two thin long wisps of violet cloud. The lower 35% is the dim rose-violet horizon glow only.'],
      'no trees, no mountains, no ground') },
  { n: '08', sec: 'fundos', title: 'Floresta — montanhas e pinheiros (longe)', file: 'floresta_longe.png', ratio: '16:9', key: true,
    sum: 'Serras e fileira de pinheiros ao luar, sobre magenta.',
    game: 'FOREST OF ARCADIA · camada longe, parallax 0,08',
    text: layer('[LAYER] Far parallax layer at night: soft distant mountain ridges in dusty blue-grey, and in front of them a dense line of pine and fir tree silhouettes in misty deep navy blue with thin silver moon-rim light on their upper-left edges, an opaque band of pale blue-white mist at their base. Occupies the lower 50% of the image and touches both the left and right edges.',
      'no moon, no stars, no bright colors') },
  { n: '09', sec: 'fundos', title: 'Floresta — árvores grandes (meio)', file: 'floresta_meio.png', ratio: '16:9', key: true,
    sum: 'Carvalhos antigos com hera e cogumelos brilhando, sobre magenta.',
    game: 'FOREST OF ARCADIA · camada do meio, parallax 0,25',
    text: layer('[LAYER] Middle parallax layer of an enchanted Arcadian forest at night: four or five large ancient oak trees with thick twisted trunks and big rounded canopies in deep blue-teal, silver moon rim light on the upper-left edges of the leaves, hanging ivy and moss, a few faint glowing mushrooms at the roots. The trunks reach the bottom edge; the canopies fill roughly the 20% to 70% height band.',
      'no moon, no ground platforms, no paths') },
  { n: '10', sec: 'fundos', title: 'Floresta — primeiro plano', file: 'floresta_perto.png', ratio: '16:9', key: true,
    sum: 'Samambaias embaixo e galhos pendurados no alto, sobre magenta.',
    game: 'FOREST OF ARCADIA · primeiro plano, parallax 0,5',
    text: layer('[LAYER] Near parallax layer at night: a continuous dark band in the bottom 25% of the image made of ferns, tall grass, brambles and bushes in very dark blue-green, with thin silver rim light on the tips of the leaves. Hanging leafy branches enter from the top edge in the top 12%. The band touches both the left and right edges.',
      'no fireflies, no tree trunks in the middle of the image') },

  // Casas de frente
  { n: '17', sec: 'casas', isNew: true, title: 'Casa do Ancião', file: 'casa_anciao.png', ratio: '1:1', key: true,
    sum: 'Casa caiada com telhado de dois andares, porta azul à esquerda e janela à direita.',
    game: 'ARCADIA, tiles 2–7 (onde fica o Ancião) · 96×96 px no jogo',
    text: asset('square 1:1', 'house', [
      "[BUILDING] The front of the village elder's house in Arcadia, as one flat building facade for a side-scrolling game: a single-story whitewashed stone house, about as wide as it is tall including the roof, thick walls with a few hairline cracks and patches of bare warm stone near the base, a two-tier terracotta tile roof (the lower tier spans the full width with slightly overhanging ends, the upper tier is narrower and centered), a sturdy blue wooden door with a rounded top placed a little LEFT of center and reaching down to the baseline, one small square window with open blue shutters on the RIGHT side of the wall, a faded blue Greek key band painted just under the roof edge, a bundle of dried herbs hanging from the eaves, a clay pot with a small olive sapling next to the door.",
      '[LAYOUT] The walls take the lower two thirds of the building and the roof the upper third. The house is centered, fills about 90% of the image width and stands on a straight flat baseline touching the bottom edge of the image. Light from the upper-left: the left side of every relief is brighter.'
    ]) },
  { n: '18', sec: 'casas', isNew: true, title: 'Casa da família', file: 'casa_vila.png', ratio: '1:1', key: true,
    sum: 'Mesma forma da casa do Ancião, com faixa ocre, gerânios na janela e parreira.',
    game: 'ARCADIA, tiles 15–20 · 96×96 px no jogo',
    text: asset('square 1:1', 'house', [
      '[BUILDING] The front of a village family house in Arcadia, as one flat building facade for a side-scrolling game, with the same simple shape as a small single-story house but its own character: whitewashed stone walls with a warm ochre band painted along the bottom, a two-tier terracotta tile roof (the lower tier spans the full width, the upper tier is narrower and centered) with a few mismatched newer tiles, a blue wooden door with a small stone step placed a little LEFT of center and reaching down to the baseline, a small bronze door knocker, one square window with open blue shutters on the RIGHT side with a wooden flower box of red geraniums, a thin grapevine climbing from the far left of the base up to the roof edge with small green leaves and green grape bunches.',
      '[LAYOUT] The walls take the lower two thirds of the building and the roof the upper third. The house is centered, fills about 90% of the image width and stands on a straight flat baseline touching the bottom edge of the image. Light from the upper-left: the left side of every relief is brighter.'
    ]) },
  { n: '19', sec: 'casas', isNew: true, title: 'Barraca da mercadora', file: 'barraca_mercadora.png', ratio: '1:1', key: true,
    sum: 'Barraca de toldo listrado com jarros de ambrosia. Hoje a mercadora não tem barraca: é um elemento novo.',
    game: 'ARCADIA, atrás da mercadora (tile 25) · cerca de 80×64 px · novo',
    text: asset('square 1:1', 'stall', [
      '[BUILDING] A small open-air market stall in the village square of Arcadia, run by a seller of ambrosia, as one flat front view for a side-scrolling game: a wooden frame of four slim posts, a slanted cloth awning with wide stripes in cream and Aegean blue and a scalloped edge, a sturdy wooden counter at about half the height of the stall, on the counter a row of round clay jars of glowing golden ambrosia with cork stoppers, a woven basket of green olives and a basket of red pomegranates, two tall terracotta amphorae standing at the sides, a small bronze hanging scale under the awning. Nobody behind the counter.',
      '[LAYOUT] The stall is centered, fills about 85% of the image width and about 80% of the image height, and stands on a straight flat baseline touching the bottom edge of the image. Light from the upper-left.'
    ]) },
  { n: '20', sec: 'casas', isNew: true, title: 'Templo de Zeus (fachada)', file: 'templo_zeus_fachada.png', ratio: '16:9', key: true,
    sum: 'Frente do templo com quatro colunas e a porta escura no centro, que é a entrada da fase.',
    game: 'ARCADIA, tiles 30–42 · 208×144 px no jogo · a porta central leva ao templo',
    text: asset('16:9', 'temple', [
      '[BUILDING] The exterior of the Temple of Zeus in the village of Arcadia, as one flat front facade for a side-scrolling game: a wide base of three low white marble steps spanning the full width, four tall fluted white marble columns with simple capitals (two on the left and two on the right of the entrance), a pale marble wall behind the columns, a single large dark rectangular doorway exactly in the horizontal center between the two inner columns, sitting directly on the top step and about half as tall as the columns, with a faint warm golden glow deep inside, a gold-trimmed entablature with a Greek key frieze above the columns, and a low triangular pediment on top with a golden relief of an eagle and a lightning bolt.',
      '[LAYOUT] The temple is centered, fills about two thirds of the image height and a little more than half of the image width, and stands on a straight flat baseline touching the bottom edge of the image. Left and right of the temple there is only magenta. The doorway is filled with deep dark shadow, never magenta.'
    ], 'no statues, no braziers') },
  { n: '21', sec: 'casas', isNew: true, title: 'Entrada da caverna (floresta)', file: 'entrada_caverna.png', ratio: '1:1', key: true,
    sum: 'Rocha com musgo e a boca da caverna à esquerda, que é a entrada do covil do Javali.',
    game: 'FOREST OF ARCADIA, tiles 104–111 · 128×112 px no jogo · a boca leva ao covil',
    text: asset('square 1:1', 'rock', [
      "[BUILDING] The entrance of the Erymanthian Boar's den at the far end of the Arcadian forest at night, as one flat side view for a side-scrolling game: a massive block of layered dark grey-brown rock with thick moss and hanging ivy along its top edge and twisted tree roots creeping over it, a wide dark cave mouth at ground level on the LEFT half of the rock (the opening is about half of the rock's width and a little less than half of its height), deep claw scratch marks on the rock around the opening, a few fallen branches at its base, cool silver-blue moonlight on the upper-left edges.",
      '[LAYOUT] The rock fills the full width of the image and almost its full height, with a thin band of magenta above its uneven top. It stands on a straight flat baseline touching the bottom edge. The inside of the cave mouth is solid very dark brown-black, never magenta.'
    ], 'no boar, no bones, no skulls') },

  // Interiores
  { n: '06', sec: 'interiores', title: 'Templo de Zeus (interior)', file: 'templo_zeus.png', ratio: '16:9',
    sum: 'Salão de mármore à noite com janela em arco e cortinas. Centro livre para Zeus.',
    game: 'TEMPLE OF ZEUS · parede de fundo da sala',
    text: scene(['[SCENE] Interior of the Temple of Zeus at night, seen straight from the side: a grand back wall of pale lavender marble blocks with a gold Greek key frieze along the top, tall fluted marble columns near the left and right edges, crimson and gold drapes hanging between them, a large arched window in the center showing a starry night sky and a crescent moon with a soft beam of moonlight falling diagonally, carved reliefs of an eagle and lightning bolts in gold, two empty wall niches with shadowed alcoves, warm brazier glow at floor level. The floor is a simple polished marble strip in the bottom 12%.',
      '[COMPOSITION] Keep the center of the image open and uncluttered (a god will float there). No objects on the floor between 20% and 80% of the width.'],
      'no statues of people, no perspective vanishing point, no ceiling perspective') },
  { n: '11', sec: 'interiores', title: 'Covil do Javali (caverna)', file: 'caverna_fundo.png', ratio: '16:9',
    sum: 'Caverna com tochas e cristais, clara o bastante para ler a luta com o chefe.',
    game: "BOAR'S DEN · parede de fundo da sala",
    text: scene(['[SCENE] The den of a giant wild boar: a vast cavern seen from the side, with a layered rocky back wall in warm browns and deep plum shadows, huge stalactites hanging from the top and stalagmites below, two iron wall torches casting warm amber pools of light on the rock, clusters of glowing cyan crystals near the floor, scratch marks and scattered old bones along the base of the wall, a darker tunnel opening on the far right. The floor is a simple dark rock strip in the bottom 12%.',
      '[COMPOSITION] The center of the floor area is empty (a boss fight happens there). Moody but readable: the rock surfaces lit by the torches must stay clearly visible.'],
      'no boar, no skulls in the center, no pitch-black areas covering more than 20% of the image') },
  { n: '12', sec: 'interiores', title: 'Santuário de Hermes (interior)', file: 'santuario_hermes.png', ratio: '16:9',
    sum: 'Santuário branco e azul acima das nuvens. Centro livre para Hermes.',
    game: 'SHRINE OF HERMES · parede de fundo da sala',
    text: scene(['[SCENE] Shrine of Hermes, the messenger god, seen straight from the side: an airy open-air sanctuary of white marble with sky-blue accents, tall slender columns, three wide arches in the back wall opening onto a bright sky full of clouds far below (the shrine floats high among the clouds), golden reliefs of winged sandals, winged helmets and a caduceus staff, soft sunbeams falling diagonally from the upper-left, a few floating white feathers. The floor is a simple polished marble strip in the bottom 12%.',
      '[COMPOSITION] Keep the center of the image open and uncluttered (a god will float there).'],
      'no statues of people, no perspective vanishing point') },
  { n: '13', sec: 'interiores', title: 'Submundo de Hades', file: 'submundo.png', ratio: '16:9',
    sum: 'Salão do trono vazio de Hades com o rio Estige. Usado na história.',
    game: 'História, página 4 (Hades)',
    text: scene(['[SCENE] The throne hall of Hades in the underworld, seen from the side: colossal obsidian pillars fading into darkness, a massive empty black stone throne with iron spikes in the center, ghostly blue-violet flames burning in iron braziers, the glowing river Styx flowing across the bottom of the image with a cold cyan light, faint drifting wisps of lost souls as pale mist, deep red cracks of magma in the far walls, iron chains hanging from above.',
      '[COMPOSITION] The throne is empty and centered; keep the space in front of it clear for characters.'],
      'no skeletons, no gore, no blood') },

  // Título e história
  { n: '01', sec: 'historia', title: 'Tela de título', file: 'titulo.png', ratio: '16:9',
    sum: 'Arte de abertura ao pôr do sol com o Olimpo e o penhasco onde o herói fica.',
    game: 'Tela de título (logo no alto, menu embaixo)',
    text: scene(['[SCENE] Epic key art at sunset: the majestic snow-capped Mount Olympus rises on the right half, a tiny glowing golden temple on its summit radiating soft light rays. The low sun sits near the horizon slightly right of center, painting the sky in bands of deep violet, magenta, coral and gold. Long pink-gold cloud banks drift across the middle distance, distant hills with cypress silhouettes below them. In the left third of the foreground, a dark rocky cliff with a flat grassy top (at about 72% of the image height) and a lone windswept olive tree, empty and ready for a hero to stand on. Tiny birds far away.',
      '[COMPOSITION] Keep the top 30% of the image as calm open sky (a logo will be placed there). Keep the lower-center area calm and dark enough for a menu. Nothing important in the top-left corner.'],
      'no lens flare, no perspective tilt, no fisheye') },
  { n: '14', sec: 'historia', title: 'Campo do casamento', file: 'historia_casamento.png', ratio: '16:9',
    sum: 'Campo florido preparado para o casamento, na luz dourada do fim da tarde.',
    game: 'História, página 2 (os noivos)',
    text: scene(['[SCENE] A flowering meadow in Arcadia at golden hour, prepared for a wedding: a large old olive tree on the right decorated with garlands of white flowers and ribbons, a small marble altar with a bowl of fruit, fields of poppies and daisies, cypress trees and a whitewashed village on the distant hills, Mount Olympus faint on the horizon, warm golden light and long soft shadows. The grassy ground line sits at about 80% of the image height.',
      '[COMPOSITION] The center of the ground is empty (two characters will stand there).']) },
  { n: '15', sec: 'historia', title: 'A serpente (entardecer)', file: 'historia_serpente.png', ratio: '16:9',
    sum: 'O mesmo campo ao anoitecer, com as guirlandas caídas na grama.',
    game: 'História, página 3 (a serpente)',
    text: scene(['[SCENE] The same flowering meadow and decorated olive tree as the wedding scene, now at ominous dusk: the sky turning from bruised violet to dim orange, long dark shadows, the flower garlands fallen on the grass, tall dark grass in the foreground where something could hide, the first stars appearing, a cold wind bending the grass. The grassy ground line sits at about 80% of the image height.',
      '[COMPOSITION] Same framing and horizon as the wedding meadow. The center of the ground is empty.'],
      'no snake') },
  { n: '16', sec: 'historia', title: 'O juramento (amanhecer)', file: 'historia_juramento.png', ratio: '16:9',
    sum: 'Colina ao amanhecer com a estrada que desce rumo ao Olimpo.',
    game: 'História, página 5 (o juramento)',
    text: scene(['[SCENE] A grassy hilltop at dawn overlooking the vast land of Greece: the first rays of the sun rising behind the distant Mount Olympus on the right, a glowing golden temple on its summit, a winding road descending into misty valleys with cypress trees and olive groves, a sky in bands of pale gold, peach and soft blue, a sense of a long journey ahead. The hilltop ground line sits at about 80% of the image height on the left half and slopes down on the right.',
      '[COMPOSITION] The left third of the hilltop is empty (a hero will stand there looking right).']) }
];

// Every prompt except the first gets this, because Flow copies objects from an attached reference image.
const REF = '[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.';
for (const p of P) if (!p.first) p.text = p.text.replace(/(\[WORLD\][^\n]*)/, '$1\n\n' + REF);
const base = (file) => file.replace(/\.\w+$/, '');

const STEPS = [
  'Gere primeiro o **02 — Vilarejo, camada distante**. Depois anexe a imagem aprovada dele como **referência de estilo** nas outras, **menos nos céus (03 e 07)**: ali o Flow copia a montanha e o templo.',
  'Antes de gerar, troque a proporção no Flow para a do cartão: quase todos são **16:9 (deitada)**; só as casas, a barraca e a caverna são 1:1. Peça 4 variações.',
  'Baixe **só a variação escolhida** (ela vai para Downloads) e marque **Pronto logo em seguida**, uma de cada vez. O Claude pega a imagem mais recente de Downloads e coloca no projeto com o nome certo.',
  'Quando quiser, diga ao Claude *"importa os prontos"*. O cartão muda para **No projeto** ou mostra o que refazer.'
];
const CHECKS = [
  'Proporção certa: 16:9 deitada nos fundos, interiores e história',
  'Visual 2.5D bonito: volume de 3D estilizado, luz suave e detalhe nítido; nada de pixel art nem de foto realista',
  'Luz vindo da esquerda e de cima',
  'Nenhuma pessoa, animal, texto ou moldura',
  'Magenta chapado, sem degradê, e nada roxo ou rosa dentro do desenho',
  'Camadas: bordas esquerda e direita com alturas parecidas',
  'Casas: vistas bem de frente, sem parede lateral nem telhado visto de cima',
  'Monte Olimpo com o mesmo formato no título, na vila e no juramento'
];
const FIXES = [
  ['Saiu pixel art ou retrô', 'stylized 3D render, soft global illumination, sharp clean details, not pixel art'], ['Saiu foto realista', 'stylized animated-film look, hand-painted textures, not photorealistic'],
  ['Apareceu gente', 'empty scene, nobody'],
  ['Magenta com degradê', 'perfectly flat pure #FF00FF background, no gradient'],
  ['Casa em perspectiva', 'flat front elevation, straight-on, no perspective, no side walls'],
  ['Roxo ou rosa no desenho', 'no purple, no pink, no violet anywhere on the subject']
];

const RATIO = { "16:9": "16:9 (deitada)", "1:1": "1:1 (quadrada)", "9:16": "9:16 (em pé)" };
const CFG = {
  title: "Cenários do Orpheus", url: PAGE_URL, key: "orpheus_flow_prontos_v1",
  prompts: P, sections: SECTIONS, steps: STEPS, checks: CHECKS, fixes: FIXES,
  lede: `${P.length} prompts em inglês no estilo 2.5D: 3D estilizado com luz suave e cara de filme de animação, nada de pixel art. Cada um é completo sozinho: copie e cole direto no Flow. Marque o que já ficou pronto para acompanhar o que falta.`,
  footer: "Pronto = a imagem escolhida já está em Downloads. O Claude lê as marcações, copia a imagem para <code>jogos/olympus/assets/cenarios/</code> e muda o cartão para No projeto. Fonte dos prompts: <code>jogos/olympus/tools/prompts_flow.js</code>, que também gera <code>docs/PROMPTS_FLOW_CENARIOS.md</code>."
};

// ---------- Markdown ----------
function markdown(h, c = CFG) { // h = heading prefix for sections ('##' in docs, '####' in the master file)
  const out = [];
  if (c.url) out.push(`Página com botão **Copiar** em cada prompt (e marcação do que já está pronto): ${c.url}`, '');
  out.push(`${h} Como usar`, '', ...c.steps.map((s, i) => `${i + 1}. ${s}`), '');
  out.push(`${h} Checklist antes de aprovar`, '', ...c.checks.map((c) => `- ${c}`), '');
  out.push('**Se falhar, cole no fim do prompt:** ' + c.fixes.map(([k, v]) => `${k.toLowerCase()} → *"${v}"*`).join('; ') + '.', '');
  for (const s of c.sections) {
    out.push(`${h} ${s.name}`, '', s.intro, '');
    for (const p of c.prompts.filter((x) => x.sec === s.id)) {
      const tags = [`proporção ${p.ratio}`, p.key ? 'fundo magenta' : 'imagem cheia', p.isNew ? 'novo' : null, p.first ? 'GERE PRIMEIRO' : null].filter(Boolean).join(' · ');
      out.push(`${h}# ${p.n} — ${p.title} · \`${base(p.file)}\``, '', `${tags}. No jogo: ${p.game}.`, '', '```', p.text, '```', '');
    }
  }
  return out.join('\n');
}

// ---------- HTML ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/`(.+?)`/g, '<code>$1</code>');

function card(p) {
  const tags = [`<span class="tag">${p.ratio}</span>`,
    p.key ? '<span class="tag"><i class="sw"></i>magenta</span>' : '<span class="tag">cheia</span>',
    p.isNew ? '<span class="tag new">novo</span>' : ''].join('');
  return `
<article class="card${p.first ? ' is-first' : ''}" id="p${p.n}" data-sec="${p.sec}" data-id="${p.n}">
  <div class="meta"><div class="num">${p.n}</div><div class="tags">${tags}</div></div>
  <div class="main">
    <div class="head"><h3>${esc(p.title)}</h3>${p.first ? '<span class="flag">Gere primeiro</span>' : ''}<span class="state" hidden></span></div>
    <p class="sum">${esc(p.sum)}</p>
    <p class="nota" hidden></p>
    <dl class="facts">
      <div><dt>Nome no projeto</dt><dd><code class="fname">${esc(base(p.file))}</code></dd></div>
      <div><dt>No jogo</dt><dd>${esc(p.game)}</dd></div>
    </dl>
    <pre class="prompt" tabindex="0" aria-label="Prompt ${p.n}">${esc(p.text)}</pre>
    <div class="actions">
      <button class="btn primary" type="button" data-copy="prompt">Copiar prompt</button>
      <span class="ratio">Proporção no Flow: <strong>${RATIO[p.ratio] || p.ratio}</strong></span>
      <label class="done"><input type="checkbox" id="done-${p.n}"> Pronto</label>
    </div>
  </div>
</article>`;
}

function html(c = CFG) {
  const count = (id) => c.prompts.filter((p) => p.sec === id).length;
  const chips = [`<button class="chip" type="button" data-filter="all" aria-pressed="true">Todos <span>${c.prompts.length}</span></button>`]
    .concat(c.sections.map((s) => `<button class="chip" type="button" data-filter="${s.id}" aria-pressed="false">${esc(s.name)} <span>${count(s.id)}</span></button>`)).join('');
  const sections = c.sections.map((s) => `
<section class="sec" data-sec="${s.id}">
  <div class="sec-head"><h2>${esc(s.name)}</h2><p>${esc(s.intro)}</p></div>
  ${c.prompts.filter((p) => p.sec === s.id).map(card).join('\n')}
</section>`).join('\n');
  const meander = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='12' shape-rendering='crispEdges'%3E%3Cpath d='M0 11H16M10 11V1H2V8H6V4' fill='none' stroke='%23000' stroke-width='2'/%3E%3C/svg%3E\")";
  return `<title>${esc(c.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Marcellus&display=swap">
<style>
/* Layout: one reading column of prompt cards; each card has a narrow meta rail (number, ratio, key) beside the prompt; stacks on phones. */
:root{
  --bg:#ecf0f3; --surface:#ffffff; --sunk:#f3f6f8; --ink:#14203a; --muted:#56627a; --line:#d2d9e2;
  --aegean:#1b5898; --on-aegean:#ffffff; --gold:#8a5f10; --olive:#4b6a1f; --terra:#a4431f; --key:#ff00ff;
  --display:"Marcellus","Palatino Linotype",Georgia,serif; --body:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0d1320; --surface:#151e30; --sunk:#10182a; --ink:#e5eaf2; --muted:#9ba7bc; --line:#27324a; --aegean:#74abea; --on-aegean:#0a1220; --gold:#e3b862; --olive:#a4c56b; --terra:#f08a64; color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0d1320; --surface:#151e30; --sunk:#10182a; --ink:#e5eaf2; --muted:#9ba7bc; --line:#27324a; --aegean:#74abea; --on-aegean:#0a1220; --gold:#e3b862; --olive:#a4c56b; --terra:#f08a64; color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg); color:var(--ink); font:15px/1.6 var(--body); margin:0}
.wrap{max-width:980px; margin:0 auto; padding-inline:20px; padding-block:0 64px}
.meander{height:12px; background:var(--aegean); -webkit-mask:${meander} repeat-x 0 0/16px 12px; mask:${meander} repeat-x 0 0/16px 12px}
header.top{padding-block:28px 8px; display:grid; gap:10px}
.eyebrow{font:500 12px/1.2 var(--mono); letter-spacing:.08em; text-transform:uppercase; color:var(--muted)}
h1{font:700 clamp(30px,5vw,44px)/1.05 var(--display); margin:0; text-wrap:balance; letter-spacing:.01em}
.lede{margin:0; max-width:62ch; color:var(--muted)}
.progress{display:flex; flex-wrap:wrap; align-items:center; gap:12px; margin-top:6px}
.px-row{display:flex; flex-wrap:wrap; gap:3px}
.px{width:11px; height:11px; border:2px solid var(--aegean); background:transparent}
.px.on{background:var(--olive); border-color:var(--olive)}
.progress b{font:700 16px/1 var(--display)}
.guide{display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr)); gap:14px; margin-block:22px 8px}
.panel{background:var(--surface); border:1px solid var(--line); border-radius:8px; padding:16px 18px; min-width:0}
.panel h2{font:700 17px/1.2 var(--display); margin:0 0 8px}
.panel ol,.panel ul{margin:0; padding-left:20px; display:grid; gap:6px}
.fixes{display:flex; flex-wrap:wrap; gap:8px; margin-top:4px}
.fix{display:inline-flex; align-items:baseline; gap:6px; font:13px/1.3 var(--body); background:var(--sunk); color:var(--ink); border:1px solid var(--line); border-radius:6px; padding:7px 10px; cursor:pointer; text-align:left}
.fix code{font:12px var(--mono); color:var(--aegean)}
.fix:hover{border-color:var(--aegean)}
.bar{position:sticky; top:env(safe-area-inset-top,0px); z-index:5; background:var(--bg); padding-block:12px; display:flex; flex-wrap:wrap; gap:8px; align-items:center; border-bottom:1px solid var(--line)}
.chip{font:500 14px/1 var(--body); color:var(--ink); background:var(--surface); border:1px solid var(--line); border-radius:999px; padding:8px 13px; cursor:pointer}
.chip span{font:12px var(--mono); color:var(--muted); margin-left:3px}
.chip[aria-pressed="true"]{background:var(--aegean); border-color:var(--aegean); color:var(--on-aegean)}
.chip[aria-pressed="true"] span{color:var(--on-aegean)}
.hide-done{margin-left:auto; display:inline-flex; align-items:center; gap:7px; font-size:14px; color:var(--muted); cursor:pointer}
.sec{display:grid; gap:14px; margin-top:30px}
.sec-head h2{font:700 24px/1.1 var(--display); margin:0 0 4px}
.sec-head p{margin:0; color:var(--muted); max-width:70ch}
.card{display:grid; grid-template-columns:76px minmax(0,1fr); background:var(--surface); border:1px solid var(--line); border-radius:8px; overflow:hidden}
.card.is-first{border-color:var(--gold); box-shadow:0 0 0 1px var(--gold)}
.meta{background:var(--sunk); border-right:1px solid var(--line); padding:16px 10px; display:grid; align-content:start; justify-items:center; gap:10px}
.num{font:700 30px/1 var(--display); color:var(--aegean); font-variant-numeric:tabular-nums}
.tags{display:grid; gap:5px; justify-items:center}
.tag{display:inline-flex; align-items:center; gap:4px; font:500 11px/1 var(--mono); color:var(--muted); border:1px solid var(--line); border-radius:4px; padding:4px 5px; background:var(--surface); white-space:nowrap}
.tag.new{color:var(--olive); border-color:var(--olive)}
.sw{display:inline-block; width:8px; height:8px; background:var(--key)}
.main{padding:16px 18px; display:grid; gap:10px; min-width:0}
.head{display:flex; flex-wrap:wrap; align-items:center; gap:8px 10px}
.head h3{margin:0; font:600 18px/1.25 var(--body); text-wrap:balance}
.flag{font:500 11px/1 var(--mono); letter-spacing:.06em; text-transform:uppercase; color:var(--gold); border:1px solid var(--gold); border-radius:4px; padding:4px 6px}
.state{font:500 11px/1 var(--mono); letter-spacing:.06em; text-transform:uppercase; border:1px solid; border-radius:4px; padding:4px 6px}
.state.aguardando{color:var(--gold)} .state.no_projeto{color:var(--olive)} .state.refazer{color:var(--terra)}
.nota{margin:0; padding:8px 12px; border-left:3px solid var(--terra); background:var(--sunk); font-size:14px}
.nota.no_projeto{border-left-color:var(--olive)} .nota.aguardando{border-left-color:var(--gold)}
.ratio{font-size:13px; color:var(--muted)}
.ratio strong{color:var(--ink); font-weight:600}
.mode{font-size:13px; color:var(--muted)}
.px.wait{background:var(--gold); border-color:var(--gold)}
.sum{margin:0}
.facts{display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr)); gap:6px 18px; margin:0}
.facts div{min-width:0}
.facts dt{font:500 11px/1.4 var(--mono); letter-spacing:.06em; text-transform:uppercase; color:var(--muted)}
.facts dd{margin:0; font-size:14px; overflow-wrap:anywhere}
code{font:13px var(--mono)}
.fname{color:var(--aegean)}
.prompt{margin:0; white-space:pre-wrap; overflow-wrap:anywhere; max-height:14em; overflow:auto; font:12.5px/1.55 var(--mono); background:var(--sunk); color:var(--ink); border:1px solid var(--line); border-radius:6px; padding:12px 14px}
.actions{display:flex; flex-wrap:wrap; gap:8px; align-items:center}
.btn{font:500 14px/1 var(--body); padding:10px 14px; border-radius:6px; border:1px solid var(--line); background:var(--surface); color:var(--ink); cursor:pointer}
.btn:hover{border-color:var(--aegean)}
.btn.primary{background:var(--aegean); border-color:var(--aegean); color:var(--on-aegean)}
.done{margin-left:auto; display:inline-flex; align-items:center; gap:7px; font-weight:500; cursor:pointer}
.done input,.hide-done input{width:17px; height:17px; accent-color:var(--olive)}

.card.is-done .num{color:var(--olive)}
.card.is-done .prompt,.card.is-done .sum{opacity:.6}
:focus-visible{outline:2px solid var(--aegean); outline-offset:2px}
.toast{position:fixed; left:50%; bottom:calc(20px + env(safe-area-inset-bottom,0px)); transform:translate(-50%,12px); background:var(--ink); color:var(--bg); font:500 14px/1.3 var(--body); padding:10px 16px; border-radius:6px; opacity:0; pointer-events:none; transition:opacity .15s, transform .15s; max-width:calc(100% - 32px)}
.toast.show{opacity:1; transform:translate(-50%,0)}
footer.note{margin-top:36px; color:var(--muted); font-size:14px}
@media (max-width:620px){
  .card{grid-template-columns:minmax(0,1fr)}
  .meta{border-right:0; border-bottom:1px solid var(--line); display:flex; justify-content:flex-start; align-items:center; padding:10px 16px}
  .tags{display:flex; flex-wrap:wrap}
  .done,.hide-done{margin-left:0}
}
@media (prefers-reduced-motion: reduce){.toast{transition:none}}
</style>

<div class="meander" aria-hidden="true"></div>
<div class="wrap">
  <header class="top">
    <div class="eyebrow">Orpheus: Song of Olympus · Google Flow</div>
    <h1>${esc(c.title)}</h1>
    <p class="lede">${c.lede}</p>
    <div class="progress"><div class="px-row" id="pxrow" aria-hidden="true">${c.prompts.map(() => '<i class="px"></i>').join('')}</div><span><b id="done-n">0</b> de ${c.prompts.length} no projeto · <span id="wait-n">0</span> esperando o Claude</span><span class="mode" id="mode">Conectando…</span></div>
  </header>

  <div class="guide">
    <div class="panel"><h2>Como usar</h2><ol>${c.steps.map((s) => `<li>${inline(s)}</li>`).join('')}</ol></div>
    <div class="panel"><h2>Antes de aprovar</h2><ul>${c.checks.map((c) => `<li>${esc(c)}</li>`).join('')}</ul></div>
  </div>
  <div class="panel">
    <h2>Se falhar, cole no fim do prompt</h2>
    <div class="fixes">${c.fixes.map(([k, v]) => `<button class="fix" type="button" data-text="${esc(v)}">${esc(k)}: <code>${esc(v)}</code></button>`).join('')}</div>
  </div>

  <div class="bar" role="toolbar" aria-label="Filtrar prompts">${chips}<label class="hide-done"><input type="checkbox" id="hide-done"> Esconder prontos</label></div>
  ${sections}

  <footer class="note">${c.footer}</footer>
</div>
<div class="toast" id="toast" role="status" aria-live="polite"></div>

<script>
(function () {
  var KEY = '${c.key}';
  var LABEL = { aguardando: 'Pronto · falta importar', no_projeto: 'No projeto', refazer: 'Refazer' };
  var cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
  var marks = {}; // card id -> { status, file, marcadoEm, nota, origem }
  var db = null;  // shared store: Claude reads the marks there and writes back the status

  // Until (or unless) the shared store answers, marks live in this browser only.
  function loadLocal() {
    var m = {};
    try {
      var s = JSON.parse(localStorage.getItem(KEY) || '{}') || {};
      Object.keys(s).forEach(function (k) { m[k] = typeof s[k] === 'object' && s[k] ? s[k] : { status: 'aguardando' }; });
    } catch (e) {}
    return m;
  }
  function saveLocal() { try { localStorage.setItem(KEY, JSON.stringify(marks)); } catch (e) {} }
  marks = loadLocal();

  var toastEl = document.getElementById('toast'), toastT;
  function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove('show'); }, 1800); }
  function selectEl(el) { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); }
  function copy(text, el, label) {
    function fallback() { if (el) { selectEl(el); toast('Texto selecionado: aperte Ctrl+C'); } }
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(function () { toast(label + ' copiado'); }, fallback);
      else fallback();
    } catch (e) { fallback(); }
  }

  cards.forEach(function (c) {
    var id = c.getAttribute('data-id');
    var pre = c.querySelector('.prompt'), fname = c.querySelector('.fname'), box = c.querySelector('input[type=checkbox]');
    c.querySelector('[data-copy=prompt]').addEventListener('click', function () { copy(pre.textContent, pre, 'Prompt ' + id); });
    box.addEventListener('change', function () {
      var on = box.checked;
      var body = { file: fname.textContent, status: 'aguardando', marcadoEm: new Date().toISOString() };
      if (!db) { if (on) marks[id] = body; else delete marks[id]; saveLocal(); render(); return; }
      box.disabled = true;
      var ref = db.collection('prontos').doc(id);
      (on ? ref.set(body) : ref.delete()).then(function () {
        box.disabled = false;
        toast(on ? 'Marcado: o Claude vai buscar a imagem em Downloads' : 'Desmarcado');
      }, function (e) {
        box.disabled = false; box.checked = !on;
        toast(e && e.code === 'invalid_argument' ? 'Sem permissão para marcar nesta página' : 'Não salvou. Tente de novo.');
      });
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('.fix'), function (b) {
    b.addEventListener('click', function () { copy(b.getAttribute('data-text'), b.querySelector('code'), 'Trecho'); });
  });

  var filter = 'all', hideDone = document.getElementById('hide-done');
  try { filter = localStorage.getItem(KEY + '_f') || 'all'; hideDone.checked = localStorage.getItem(KEY + '_h') === '1'; } catch (e) {}
  var chips = Array.prototype.slice.call(document.querySelectorAll('.chip'));
  if (!chips.some(function (b) { return b.getAttribute('data-filter') === filter; })) filter = 'all';
  chips.forEach(function (b) {
    b.addEventListener('click', function () { filter = b.getAttribute('data-filter'); try { localStorage.setItem(KEY + '_f', filter); } catch (e) {} render(); });
  });
  hideDone.addEventListener('change', function () { try { localStorage.setItem(KEY + '_h', hideDone.checked ? '1' : '0'); } catch (e) {} render(); });

  function render() {
    var done = 0, wait = 0;
    cards.forEach(function (c) {
      var m = marks[c.getAttribute('data-id')], st = m && m.status;
      var box = c.querySelector('input[type=checkbox]'), stEl = c.querySelector('.state'), nota = c.querySelector('.nota');
      if (st === 'no_projeto') done++; else if (st === 'aguardando') wait++;
      var marked = st === 'aguardando' || st === 'no_projeto';
      if (!box.disabled) box.checked = marked;
      stEl.hidden = !LABEL[st]; stEl.className = 'state ' + (st || ''); stEl.textContent = LABEL[st] || '';
      var txt = m && m.nota ? String(m.nota) : '';
      nota.hidden = !txt; nota.className = 'nota ' + (st || ''); nota.textContent = txt;
      c.classList.toggle('is-done', marked);
      c.hidden = (filter !== 'all' && c.getAttribute('data-sec') !== filter) || (hideDone.checked && marked);
    });
    Array.prototype.forEach.call(document.querySelectorAll('.sec'), function (s) {
      s.hidden = !s.querySelector('.card:not([hidden])');
    });
    chips.forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === filter)); });
    document.getElementById('done-n').textContent = done;
    document.getElementById('wait-n').textContent = wait;
    Array.prototype.forEach.call(document.querySelectorAll('.px'), function (p, i) {
      p.classList.toggle('on', i < done); p.classList.toggle('wait', i >= done && i < done + wait);
    });
  }
  render();

  var modeEl = document.getElementById('mode');
  var LOCAL = 'Marcações só neste navegador: o Claude não vê';
  var cl = window.claude;
  if (cl && typeof cl.use === 'function') {
    cl.use('db').then(function (d) {
      if (!d) { modeEl.textContent = LOCAL; return; }
      db = d;
      modeEl.textContent = 'Conectado: o Claude vê o que você marca';
      d.collection('prontos').onSnapshot(function (snap) {
        var m = {};
        snap.docs.forEach(function (doc) { if (doc.exists) m[doc.id] = doc.data(); });
        marks = m; render();
      }, function () { db = null; marks = loadLocal(); modeEl.textContent = LOCAL; render(); });
    }, function () { modeEl.textContent = LOCAL; });
  } else modeEl.textContent = LOCAL;
})();
</script>
`;
}

module.exports = { html, markdown, esc, base, RATIO };
if (require.main !== module) return;

// ---------- write ----------
fs.writeFileSync(path.join(DOCS, 'prompts_flow.html'), html());
fs.writeFileSync(path.join(DOCS, 'PROMPTS_FLOW_CENARIOS.md'),
  '# Prompts do Google Flow — cenários do jogo\n\nPrompts em inglês, estilo **2.5D** (3D estilizado, luz suave, cara de filme de animação; nada de pixel art), prontos para colar no **Google Flow (modo imagem, 4 variações)**. Gerado por `tools/prompts_flow.js`: edite lá, não aqui.\n\n' + markdown('##'));

const masterPath = path.join(ROOT, 'ORPHEUS_MEMORIA_COMPLETA.md');
if (fs.existsSync(masterPath)) {
  let m = fs.readFileSync(masterPath, 'utf8');
  const crlf = m.includes('\r\n'); // Windows checkouts get CRLF
  if (crlf) m = m.replace(/\r\n/g, '\n');
  const a = m.search(/^### 8\.2 .*$/m), b = m.indexOf('\n---\n\n## 9.');
  if (a >= 0 && b > a) {
    m = m.slice(0, a) + `### 8.2 Os ${P.length} prompts\nGerados por \`jogos/olympus/tools/prompts_flow.js\` (edite lá e rode \`node prompts_flow.js\`).\n\n` + markdown('####') + m.slice(b);
    m = m.replace('plano do Google Flow (com os 16 prompts)', `plano do Google Flow (com os ${P.length} prompts)`)
      .replace(/\(16 imagens: título, vila em 4 camadas, templo de Zeus, floresta em 4 camadas, caverna, santuário de Hermes, submundo, 3 cenas da história\)/,
        `(${P.length} imagens: título, vila em 4 camadas, floresta em 4 camadas, 5 fachadas de frente, 4 interiores, 3 cenas da história)`);
    fs.writeFileSync(masterPath, crlf ? m.replace(/\n/g, '\r\n') : m);
  } else console.warn('ORPHEUS_MEMORIA_COMPLETA.md: section 8.2 not found, left untouched');
}
console.log(`OK: ${P.length} prompts -> docs/prompts_flow.html, docs/PROMPTS_FLOW_CENARIOS.md, ORPHEUS_MEMORIA_COMPLETA.md`);
