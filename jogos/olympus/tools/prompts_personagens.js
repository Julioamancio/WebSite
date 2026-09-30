// Usage: node prompts_personagens.js
// Single source for the Google Flow prompts of the characters' base images (hero + NPCs).
// Each base is a full-body side view on magenta; it is keyed and uploaded to AutoSprite (upload is free) to be animated.
// Writes docs/prompts_personagens.html (published as an Artifact) and docs/PROMPTS_FLOW_PERSONAGENS.md.
// Edit the prompts HERE, never in the generated files.
const fs = require('fs');
const path = require('path');
const { html, markdown } = require('./prompts_flow.js');

const PAGE_URL = 'https://claude.ai/artifact/4HLTmWg8VocQqpeeMMQPNd'; // Artifact built from docs/prompts_personagens.html
const DOCS = path.resolve(__dirname, '..', 'docs');

// ---------- fixed blocks ----------
const STYLE = '[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.';
const WORLD = '[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.';
const REF = '[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.';
const pose = (heads) => `[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about ${heads} heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.`;
const BG = '[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.';
const NEG = (extra) => `[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing${extra ? ', ' + extra : ''}, no purple, no violet, no pink, no lilac.`;
const char = (heads, body, extra, first) => [STYLE, WORLD, first ? null : REF, pose(heads), body, BG, NEG(extra)].filter(Boolean).join('\n\n');
// Four-legged creatures: wide frame and their own pose block (the human one talks about heads tall and standing on two feet).
const CREATURE_POSE = '[POSE] ONE single creature only, alone in the frame, nothing else. The whole body inside the frame with a small margin on every side, nothing cropped: from the snout to the tail and from the top of the mane down to the hooves. Strict side view in profile, facing RIGHT: exactly ONE eye is visible and the snout points to the right edge of the image; if both eyes are visible, the image is wrong. Standing still in an alert pose, all four hooves flat on one ground line near the bottom of the image. Camera at shoulder height, flat, no perspective, no foreshortening.';
const creature = (body, extra) => [STYLE.replace('portrait 9:16', 'landscape 16:9').replace('game character', 'game creature'), WORLD, REF, CREATURE_POSE, body, BG.replace(/character/g, 'creature'), NEG(extra).replace('no second character', 'no second animal, no rider')].join('\n\n');

const SECTIONS = [
  { id: 'heroi', name: 'Herói', intro: 'O Orfeu define o estilo de todos. Gere ele primeiro e só passe para os outros quando gostar.' },
  { id: 'vila', name: 'Pessoas da vila', intro: 'Quem o Orfeu encontra em Arcádia. A Eurídice também aparece na história e como fantasma (o fantasma sai desta imagem, por código).' },
  { id: 'deuses', name: 'Deuses', intro: 'Maiores e mais imponentes que os mortais. O brilho divino em volta deles quem desenha é o jogo, por isso o prompt pede sem brilho.' },
  { id: 'criaturas', name: 'Chefes e criaturas', intro: 'Bases para as cutscenes e para o AutoSprite. O javali é largo, então vai em 16:9.' }
];

const P = [
  { n: '01', sec: 'heroi', first: true, title: 'Orfeu', file: 'orpheus', ratio: '9:16', key: true,
    sum: 'Herói de 20 anos, cabelo ruivo curto, faixa vermelha, túnica branca, capa carmim e o porrete de oliveira na mão.',
    game: 'Personagem jogável · o porrete entra nos golpes, então já vem na mão',
    text: char('6.5', "[CHARACTER] Orpheus, a young Greek hero around 20 years old: slim athletic build, defined jaw, kind but determined eyes, short wavy auburn hair kept close to the head, a bright scarlet headband with two short tails fluttering behind, a white short chiton ending above the knee with a gold Greek key trim and a single shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape falling from the shoulder behind him, bronze bracers on both forearms, brown leather sandals laced up to the calves. In his right hand (the hand nearer the viewer) he holds a thick knotted olive-wood club, hanging down relaxed beside his leg, the head of the club near the knee.",
      'no sword, no shield, no spear, no lyre', true) },

  { n: '02', sec: 'vila', title: 'Eurídice', file: 'eurydice', ratio: '9:16', key: true,
    sum: 'Jovem de 19 anos, cabelo dourado comprido, coroa de flores brancas e vestido branco até os pés.',
    game: 'História e final · também vira o fantasma (por código)',
    text: char('6.5', '[CHARACTER] Eurydice, a gentle young Greek woman around 19: long flowing golden hair falling down her back, a small crown of white flowers, a soft kind face with a faint smile, a white ankle-length flowing dress with a thin gold belt and a gold Greek key hem, bare arms, thin leather sandals, both hands held together in front of her waist, graceful calm posture.',
      'no veil, no jewelry except the gold belt') },
  { n: '03', sec: 'vila', title: 'Ancião', file: 'elder', ratio: '9:16', key: true,
    sum: 'Sábio de 75 anos, cabelo e barba brancos compridos, manto marrom, apoiado num cajado torto.',
    game: 'ARCADIA, tile 9 · entrega o porrete e explica a missão',
    text: char('6', '[CHARACTER] The village elder of Arcadia, a wise old man around 75: long white hair and a long white beard reaching his chest, slightly hunched back, bushy white eyebrows, warm tired eyes, a brown wool himation wrapped over a lighter cream tunic, simple leather sandals. He leans on a tall gnarled wooden staff held in his right hand (the hand nearer the viewer), the staff planted on the ground in front of his feet and reaching above his head.',
      'no hood, no crown') },
  { n: '04', sec: 'vila', title: 'Mercadora', file: 'merchant', ratio: '9:16', key: true,
    sum: 'Mulher de 40 anos, lenço laranja, vestido azul-claro e avental, segurando um pote de ambrosia.',
    game: 'ARCADIA, tile 25 · vende ambrosia (10 azeitonas)',
    text: char('6.5', '[CHARACTER] A market merchant woman around 40: dark brown hair tied in a bun under an orange headscarf, a friendly smile, a light-blue ankle-length dress with a cream apron tied at the waist, simple leather sandals. With both hands she holds a small round clay jar filled with glowing golden ambrosia in front of her chest.',
      'no market stall, no table') },
  { n: '05', sec: 'vila', title: 'Moradora', file: 'villager', ratio: '9:16', key: true,
    sum: 'Moça de 22 anos, flor vermelha no coque, vestido amarelo-açafrão e xale branco, com uma cesta de maçãs.',
    game: 'ARCADIA, tile 44 · dá dicas da floresta',
    text: char('6.5', '[CHARACTER] A cheerful young village woman around 22: dark hair in a bun with a red flower tucked in it, bright friendly eyes, a saffron-yellow calf-length dress with a white shawl over her shoulders, simple leather sandals. She holds a small woven basket of red apples in the crook of her right arm (the arm nearer the viewer).',
      'no pink clothes') },

  { n: '06', sec: 'deuses', title: 'Zeus', file: 'zeus', ratio: '9:16', key: true,
    sum: 'Rei dos deuses: cabelo e barba brancos, coroa de louros dourada, mantos branco e ouro, raio dourado erguido.',
    game: 'Templo de Zeus · dá a bênção (+4 de vida) e salva o jogo',
    text: char('7', '[CHARACTER] Zeus, king of the gods: a powerful, broad-shouldered old man, taller and more imposing than a mortal, long flowing white hair and a full white beard, a golden laurel crown, stern majestic eyes, white and gold robes draped over one shoulder with a deep blue sash, one muscular arm bare, golden sandals. In his right hand (the hand nearer the viewer) he raises a crackling golden lightning bolt at shoulder height, with a few small sparks close to the bolt.',
      'no glow around the body, no aura, no clouds, no throne') },
  { n: '07', sec: 'deuses', title: 'Hermes', file: 'hermes', ratio: '9:16', key: true,
    sum: 'Mensageiro dos deuses: jovem, chapéu dourado com asas, túnica azul-clara, sandálias aladas e bastão com serpentes.',
    game: 'Santuário de Hermes · dá as Sandálias de Hermes (pulo alto)',
    // No proper name here: Flow refused the prompt that said "Hermes" (29/09/2026).
    text: char('7', "[CHARACTER] A young messenger god from ancient Greek myth: youthful, slim and light on his feet, curly brown hair under a round golden traveler's hat with two small white wings on its sides, a playful confident smile, a light-blue short chiton with gold trim, a small white cloak pinned at one shoulder, golden sandals with small white wings at the ankles. In his right hand (the hand nearer the viewer) he holds a slender golden herald's staff topped with two small wings, with two thin golden serpents coiled around it.",
      'no glow around the body, no aura, no clouds, no glasses') },
  { n: '08', sec: 'deuses', title: 'Hades', file: 'hades', ratio: '9:16', key: true,
    sum: 'Rei do submundo: alto, cabelo e barba curta pretos, coroa de ferro pontuda, mantos pretos e cajado de duas pontas.',
    game: 'História e Parte 2 · prende a alma da Eurídice',
    // No proper name, and no grey skin + blue flaming hair: that is a famous film villain, and Flow refused it (29/09/2026).
    text: char('7', '[CHARACTER] The stern king of the underworld from ancient Greek myth: tall, regal and imposing, a pale but natural human skin tone, black wavy hair to the shoulders and a short black beard, dark serious eyes with a faint cold cyan glint, a dark iron crown with sharp pointed spikes, long black and dark steel-blue robes with iron clasps and a silver Greek key border, a dark cloak over his shoulders, dark leather sandals. In his right hand (the hand nearer the viewer) he holds a tall dark iron staff with two straight prongs at the top, planted on the ground.',
      'no flaming hair, no glow around the body, no smoke, no throne') },
  { n: '09', sec: 'deuses', isNew: true, title: 'Rainha do Submundo', file: 'queen', ratio: '9:16', key: true,
    sum: 'Rainha jovem e triste: tranças castanhas com flores murchas, coroa fina de prata, vestido verde e ouro, flor de romã murcha nas mãos.',
    game: 'Cutscene do fim da Parte 1 e Parte 7 · chora com a Canção',
    // No proper name (Persephone): Flow refuses named myth figures in character prompts. The blossom is coral-red, never pink (magenta key).
    text: char('6.5', '[CHARACTER] A graceful, sad young queen of the underworld from ancient Greek myth: long dark brown hair braided with small withered spring flowers, gentle green eyes, pale skin, a thin silver crown, a deep green and gold ankle-length gown, simple dark leather sandals. With both hands she holds a single wilted coral-red pomegranate blossom in front of her chest and looks down at it sadly.',
      'no throne, no glow around the body, no pink flowers') },
  { n: '10', sec: 'criaturas', isNew: true, title: 'Javali gigante', file: 'boar', ratio: '16:9', key: true,
    sum: 'Chefe da Parte 1: javali enorme, pelo castanho-avermelhado, crina eriçada, presas de marfim e a corda dourada enrolada numa presa.',
    game: 'Covil do Javali · chefe (a corda na presa é a 1ª corda da lira)',
    text: creature('[CHARACTER] A huge mythical wild boar boss: as tall at the shoulder as a grown man and much longer than it is tall, dark reddish-brown bristly fur, a tall bristly mane rising along its spine, long curved ivory tusks, one tusk wrapped with a single thin glowing golden lyre string, small fierce red eyes, a scarred snout, a thin puff of steam at the nostrils, heavy dark hooves.',
      'no blood, no wounds, no saddle') }
];

const STEPS = [
  'Gere primeiro o **Orfeu (01)** em **9:16 (em pé)**, 4 variações. Escolha a de perfil de verdade (um olho só) e com o corpo inteiro.',
  'Nos outros, anexe o Orfeu aprovado como **referência de estilo**: o prompt já manda copiar só o estilo, não a roupa nem o rosto.',
  'Baixe só a escolhida e marque **Pronto**. Pode marcar uma de cada vez ou todas no fim: eu identifico pelo conteúdo.',
  'Diga ao Claude *"importa os prontos"*. Eu tiro o magenta e subo no AutoSprite para animar. Subir é de graça; cada animação custa cerca de 5 créditos e só gero depois do seu ok.'
];
const CHECKS = [
  'Um personagem só, de corpo inteiro: cabeça e pés dentro da imagem',
  'Perfil de verdade: um olho e uma orelha, nariz apontando para a direita',
  'Olhando para a DIREITA',
  'Visual 2.5D estilizado: nada de pixel art nem de foto realista',
  'Proporção de adulto (nada de cabeção)',
  'Magenta chapado, sem chão nem sombra, e nada roxo ou rosa na roupa',
  'Mãos inteiras e o objeto certo: porrete, cajado, pote, cesta, raio, caduceu ou bidente',
  'Nos NPCs, o mesmo estilo do Orfeu aprovado'
];
const FIXES = [
  ['Virou de frente ou mostra dois olhos', 'strict side profile facing right: exactly ONE eye and ONE ear visible, nose pointing to the right edge'],
  ['Cortou os pés ou a cabeça', 'whole body inside the frame with a margin on every side, nothing cropped'],
  ['Saiu mais de um personagem', 'ONE single character only, alone in the frame, nobody else'],
  ['Cabeça grande, cara de criança', 'stylized adult proportions, about 6.5 heads tall, not chibi, not big-headed'],
  ['Saiu pixel art ou retrô', 'stylized 3D render, soft global illumination, sharp clean details, not pixel art'],
  ['Apareceu chão ou sombra', 'no floor, no ground shadow, perfectly flat pure #FF00FF background']
];

const CFG = {
  title: 'Personagens do Orpheus', url: PAGE_URL, key: 'orpheus_personagens_prontos_v1',
  prompts: P, sections: SECTIONS, steps: STEPS, checks: CHECKS, fixes: FIXES,
  lede: `${P.length} prompts em inglês para a imagem base do herói e dos NPCs, no mesmo estilo 2.5D dos cenários: corpo inteiro, de perfil, olhando para a direita, sobre magenta. Essa base vai para o AutoSprite, que faz as animações.`,
  footer: 'Pronto = a imagem escolhida já está em Downloads. O Claude copia para <code>jogos/olympus/assets/personagens/</code>, tira o magenta e muda o cartão para No projeto. Fonte dos prompts: <code>jogos/olympus/tools/prompts_personagens.js</code>, que também gera <code>docs/PROMPTS_FLOW_PERSONAGENS.md</code>.'
};

fs.writeFileSync(path.join(DOCS, 'prompts_personagens.html'), html(CFG));
fs.writeFileSync(path.join(DOCS, 'PROMPTS_FLOW_PERSONAGENS.md'),
  '# Prompts do Google Flow — personagens (base para o AutoSprite)\n\nPrompts em inglês, estilo **2.5D**, prontos para colar no **Google Flow (modo imagem, 9:16, 4 variações)**. Gerado por `tools/prompts_personagens.js`: edite lá, não aqui.\n\n' + markdown('##', CFG));
console.log(`OK: ${P.length} prompts -> docs/prompts_personagens.html, docs/PROMPTS_FLOW_PERSONAGENS.md`);
