// Usage: node cutscenes.js
// Single source for the story and the cutscenes (Flow/Veo clips of up to 8 s).
// Writes docs/cutscenes.html (published as an Artifact, for approval) and docs/CUTSCENES.md.
// Stage 3 of the Flow director pipeline: storyboard for approval. Scene prompts come after approval.
const fs = require('fs');
const path = require('path');

const DOCS = path.resolve(__dirname, '..', 'docs');

const CONCEPT = [
  ['Premissa', 'Hades leva a alma de Eurídice e quebra a lira de ouro de Orfeu. As sete cordas voam pela Grécia e o mundo começa a perder a cor. Orfeu precisa recuperar as sete cordas, uma por região, para tocar a Canção completa, abrir os portões do Submundo e trazer Eurídice de volta.'],
  ['Tom', 'Épico e mágico, com humor leve nos deuses. Nada de sangue: a morte e as lutas são mostradas com sombra, luz e cor.'],
  ['Público', 'Alunos e jogadores a partir de 10 anos. Textos em inglês simples (A2–B1), para ler na caixa do jogo.'],
  ['Formato', 'Clipes de até 8 s no Flow (Veo), 16:9, no mesmo 2.5D dos cenários e das bases: 3D estilizado, luz suave, cara de filme de animação.'],
  ['Série', 'Sete partes. Cada parte abre com um gancho da anterior e fecha com um gancho para a próxima.'],
  ['Voz', 'Sugestão: os clipes vêm só com música, ambiente e efeitos, sem fala. O Veo muda a voz de um clipe para outro, e o texto em inglês na caixa do jogo é o que ensina. Se você preferir narrador falado, eu troco.']
];

const SAGA = [
  { n: 1, regiao: 'Arcádia', deus: 'Zeus (bênção) e o deus mensageiro (sandálias aladas)', chefe: 'Javali de Erimanto', corda: 'A 1ª corda está enrolada na presa do javali. Ao voltar para a lira, a floresta recupera a cor.' },
  { n: 2, regiao: 'Ática', deus: 'Atena (escudo de bronze)', chefe: 'A Esfinge de Tebas', corda: 'A Esfinge só entrega a 2ª corda a quem responder às charadas dela, em inglês.' },
  { n: 3, regiao: 'Argólida', deus: 'Hefesto (espada forjada)', chefe: 'A Hidra de Lerna', corda: 'Cada cabeça cortada volta; a corda está presa na cabeça do meio.' },
  { n: 4, regiao: 'Mar Egeu', deus: 'Poseidon (respirar debaixo d’água)', chefe: 'Cila, o monstro do estreito', corda: 'A 4ª corda brilha no fundo do mar, entre as ruínas de um templo afundado.' },
  { n: 5, regiao: 'Creta', deus: 'Dédalo e Ariadne (o fio para não se perder)', chefe: 'O Minotauro, no Labirinto', corda: 'O Labirinto muda de forma; o fio de Ariadne mostra o caminho até a corda.' },
  { n: 6, regiao: 'Monte Olimpo', deus: 'Apolo (conserta a moldura da lira)', chefe: 'Talos, o gigante de bronze da escadaria', corda: 'Com seis cordas, a lira toca alto o bastante para ser ouvida no Submundo.' },
  { n: 7, regiao: 'Submundo', deus: 'Caronte, Cérbero e a Rainha do Submundo', chefe: 'O Rei do Submundo (Hades)', corda: 'A Canção faz Cérbero dormir e a Rainha chorar. Hades devolve a 7ª corda e Eurídice, com uma condição: na subida, Orfeu não pode olhar para trás. No jogo, andar para a esquerda na última fase faz Eurídice desaparecer. No final, as cores voltam a toda a Grécia e o casal toca a Canção sob a mesma oliveira.' }
];

// Immutable character sheets (English). Paste word for word in every scene where the character appears.
// No proper names for the underworld king and the messenger god: Flow refused those names on 29/09/2026.
const SHEETS = {
  orpheus: { label: 'ORPHEUS', base: 'orpheus.png', text: 'A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.' },
  eurydice: { label: 'EURYDICE', base: 'eurydice.png', text: 'A gentle young Greek woman around 19 years old, stylized 3D animated-film character, long straight golden-blonde hair falling down her back, a small crown of white flowers, a soft kind face with a faint smile, a white sleeveless ankle-length dress with a thin gold belt and a gold Greek key hem, thin leather sandals. Graceful and calm; often holds her hands together in front of her waist.' },
  soul: { label: "EURYDICE'S SOUL", base: 'eurydice.png', text: 'The spirit of a gentle young Greek woman around 19 years old, stylized 3D animated-film character, exactly the same face, hair, flower crown and dress as the living woman, but translucent and softly glowing pale cyan from within, with a faint trail of light at the hem of her dress. Moves slowly, as if floating.' },
  elder: { label: 'THE VILLAGE ELDER', base: 'elder.png', text: 'A wise old Greek man around 75 years old, stylized 3D animated-film character, long white hair and a long white beard reaching his chest, bushy white eyebrows, warm tired eyes, slightly hunched back, a brown wool himation wrapped over a cream tunic, simple leather sandals, leaning on a tall gnarled wooden staff. Speaks slowly and kindly.' },
  zeus: { label: 'ZEUS', base: 'zeus.png', text: 'The king of the gods, stylized 3D animated-film character, a towering broad-shouldered old man with long flowing white hair and a full white beard, a golden laurel crown, stern majestic eyes, white robes with gold trim draped over one shoulder and a deep blue sash, one muscular arm bare, golden sandals, holding a crackling golden lightning bolt in his right hand.' },
  messenger: { label: 'THE MESSENGER GOD', base: 'hermes.png', text: "A young messenger god from Greek myth, stylized 3D animated-film character, youthful and slim, curly brown hair under a round golden traveler's hat with two small white wings, a playful confident smile, a light-blue short chiton with gold trim, a small white cloak pinned at one shoulder, golden sandals with small white wings at the ankles, holding a slender golden herald's staff with two thin golden serpents coiled around it and small wings at the top. Light on his feet, always a little in motion." },
  king: { label: 'THE KING OF THE UNDERWORLD', base: 'hades.png', text: 'The stern king of the underworld from Greek myth, stylized 3D animated-film character, tall, regal and imposing, pale natural skin, black wavy shoulder-length hair and a short black beard, dark serious eyes with a faint cold cyan glint, a dark iron crown with sharp pointed spikes, long black and dark steel-blue robes with a silver Greek key border and a dark cloak, holding a tall dark iron two-pronged staff. Moves slowly and speaks coldly.' },
  queen: { label: 'THE QUEEN OF THE UNDERWORLD', base: null, text: 'A graceful, sad young queen of the underworld from Greek myth, stylized 3D animated-film character, long dark brown hair braided with small withered spring flowers, gentle green eyes, pale skin, a deep green and gold ankle-length gown with a thin silver crown, holding a single wilted pomegranate blossom in her hands.' },
  boar: { label: 'THE GIANT BOAR', base: null, text: 'A huge mythical wild boar, stylized 3D animated-film creature, as tall at the shoulder as a grown man, dark reddish-brown bristly fur, a tall bristly mane along its spine, long curved ivory tusks, one tusk wrapped with a single thin glowing golden lyre string, small fierce red eyes, a scarred snout, steam puffing from its nostrils.' }
};

// Part 1 cutscenes. Each scene is one Flow clip (up to 8 s). `anexar` = images to attach in Flow (max 3).
const CUTSCENES = [
  { id: 'CS1', title: 'A Canção de Orfeu', quando: 'Novo jogo, logo depois da tela de título',
    texto: ['Long ago, in the green hills of Arcadia, there lived a young musician named Orpheus.', 'When he played his golden lyre, rivers stopped to listen and trees began to dance.', 'And his heart belonged to the gentle Eurydice.'],
    cenas: [
      { n: '01', local: 'Colina de Arcádia com uma oliveira antiga, fim de tarde dourado, brisa leve.', chars: ['orpheus'], anexar: ['personagens/orpheus.png'],
        acao: 'Orfeu, sentado numa pedra sob a oliveira, dedilha uma lira dourada de sete cordas. Notas de luz dourada saem das cordas e flutuam. Dois cervos e um bando de passarinhos chegam e param para ouvir.',
        camera: 'Plano geral, dolly-in lento.', luz: 'Golden hour, contraluz quente, rim light suave.', audio: 'Melodia de lira suave; passarinhos; brisa.', trans: 'Dissolve.' },
      { n: '02', local: 'Mesma colina, mesma luz, logo em seguida.', chars: ['orpheus', 'eurydice'], anexar: ['personagens/orpheus.png', 'personagens/eurydice.png'],
        acao: 'Os galhos da oliveira balançam no ritmo da música e as flores se abrem viradas para Orfeu. Eurídice sobe a trilha sorrindo e senta ao lado dele.',
        camera: 'Plano médio, arco lento para a direita.', luz: 'Golden hour.', audio: 'A melodia continua; brilho sonoro das flores abrindo.', trans: 'Fade para branco.' }
    ] },
  { id: 'CS2', title: 'O Casamento', quando: 'Continua direto da CS1',
    texto: ['On a bright spring day, Orpheus and Eurydice were married under the old olive tree.'],
    cenas: [
      { n: '03', local: 'Campo florido do casamento, tarde de primavera (o mesmo do cenário 14).', chars: ['orpheus', 'eurydice', 'elder'], anexar: ['personagens/orpheus.png', 'personagens/eurydice.png', 'cenarios/historia_casamento.jpg'],
        acao: 'Orfeu e Eurídice de mãos dadas diante da oliveira enfeitada. O Ancião ergue o cajado para abençoar os dois. Pétalas brancas caem do céu.',
        camera: 'Plano médio-aberto, grua subindo devagar.', luz: 'Tarde clara de primavera.', audio: 'Lira e flauta festivas; vivas ao longe; pétalas.', trans: 'Match cut para o entardecer.' }
    ] },
  { id: 'CS3', title: 'A Serpente de Sombra', quando: 'Continua',
    texto: ['But at sunset, a serpent made of shadows crawled out of the ground...'],
    cenas: [
      { n: '04', local: 'O mesmo campo ao entardecer, guirlandas caídas na grama (cenário 15).', chars: ['eurydice'], anexar: ['personagens/eurydice.png', 'cenarios/historia_serpente.jpg'],
        acao: 'Sozinha, Eurídice pega uma guirlanda caída. Atrás dela, no capim alto e escuro, uma serpente feita de fumaça preta com dois olhos ciano se aproxima.',
        camera: 'Ângulo baixo, por dentro do capim, empurrando devagar até ela.', luz: 'Entardecer, céu violeta e laranja, sombras longas.', audio: 'Vento no capim; os grilos param; zumbido grave.', trans: 'Corte seco.' },
      { n: '05', local: 'Mesmo lugar, segundos depois.', chars: ['eurydice', 'orpheus'], anexar: ['personagens/eurydice.png', 'personagens/orpheus.png', 'cenarios/historia_serpente.jpg'],
        acao: 'A serpente de sombra dá o bote e some numa nuvem de fumaça escura no tornozelo dela. Eurídice perde o fôlego e cai devagar entre as flores; a guirlanda escapa das mãos. Ao fundo, Orfeu solta a lira e corre até ela.',
        camera: 'Plano médio, troca de foco de Eurídice para Orfeu.', luz: 'Entardecer.', audio: 'Silvo; a corda da lira vibrando ao cair; passos correndo; a música para.', trans: 'Corte seco.' }
    ] },
  { id: 'CS4', title: 'O Rei do Submundo', quando: 'Continua',
    texto: ['The serpent was sent by Hades, the King of the Underworld. He took Eurydice\'s soul down to the dark halls of Tartarus.', 'Then he broke the golden lyre. Its seven strings flew across Greece like falling stars...', '...and the colors of the world began to fade.'],
    cenas: [
      { n: '06', local: 'O campo à noite.', chars: ['king', 'soul'], anexar: ['personagens/hades.png', 'personagens/eurydice.png'],
        acao: 'O chão racha com uma luz azul e fria. O Rei do Submundo sobe devagar pela fenda. A alma de Eurídice, translúcida e brilhando, se ergue das flores e flutua até a mão aberta dele.',
        camera: 'Plano geral em contra-plongée, tilt para cima lento.', luz: 'Noite, luz azul fria vindo de baixo.', audio: 'Estrondo grave; terra rachando; coro fantasmagórico.', trans: 'Corte seco.' },
      { n: '07', local: 'Mesmo lugar.', chars: ['king', 'orpheus'], anexar: ['personagens/hades.png', 'personagens/orpheus.png'],
        acao: 'O Rei pega a lira dourada da grama e fecha a mão. As sete cordas se partem e sobem para o céu noturno, cada uma para um lado, como estrelas cadentes. Orfeu, ajoelhado, estende a mão.',
        camera: 'Close médio na lira; depois tilt para cima seguindo as cordas.', luz: 'Noite azul; rastros dourados.', audio: 'Sete notas subindo e se partindo; whoosh.', trans: 'Corte seco.' },
      { n: '08', local: 'Mesmo lugar.', chars: ['orpheus'], anexar: ['personagens/orpheus.png'],
        acao: 'A fenda se fecha. Orfeu fica sozinho, ajoelhado, segurando a moldura vazia da lira. Em volta dele, flores e grama vão ficando cinza, a cor escorrendo para longe.',
        camera: 'Pull-back lento até plano geral.', luz: 'Luar, a imagem perdendo saturação.', audio: 'Silêncio; vento; uma nota grave e triste.', trans: 'Fade para preto.' }
    ] },
  { id: 'CS5', title: 'O Juramento', quando: 'Fim da abertura; corta para o vilarejo (o jogo começa)',
    texto: ['At dawn, Orpheus made a promise:', '"I will find the seven strings. I will play our song again. And I will bring you home."'],
    cenas: [
      { n: '09', local: 'Topo da colina ao amanhecer, estrada descendo rumo ao Olimpo (cenário 16).', chars: ['orpheus'], anexar: ['personagens/orpheus.png', 'cenarios/historia_juramento.jpg'],
        acao: 'Orfeu, com a moldura vazia da lira nas costas, olha para o Monte Olimpo ao longe. Sobre a floresta, uma luzinha dourada pisca (a primeira corda). Ele fecha o punho e começa a descer a estrada.',
        camera: 'Por trás, sobre o ombro dele; depois push passando por ele rumo ao horizonte.', luz: 'Nascer do sol, dourado quente.', audio: 'Tema heroico subindo; passarinhos da manhã.', trans: 'Corte para o jogo.' }
    ] },
  { id: 'CS6', title: 'O Raio de Zeus', quando: 'Primeira vez que Orfeu entra no Templo de Zeus (antes do diálogo)',
    texto: [],
    cenas: [
      { n: '10', local: 'Interior do Templo de Zeus à noite (cenário 06).', chars: ['orpheus', 'zeus'], anexar: ['personagens/orpheus.png', 'personagens/zeus.png', 'cenarios/templo_zeus.jpg'],
        acao: 'Orfeu entra no salão. Um raio cai no altar e, no clarão, Zeus aparece flutuando acima do chão, enorme, olhando para ele.',
        camera: 'Contra-plongée por trás de Orfeu; push-in rápido no clarão.', luz: 'Templo escuro; clarão branco-dourado.', audio: 'Trovão; eco; coro crescendo.', trans: 'Corte para o diálogo.' }
    ] },
  { id: 'CS7', title: 'O Javali de Erimanto', quando: 'Entrada no Covil do Javali (antes da luta)',
    texto: ['Deep in the forest, the first string shone on the tusk of a monster.'],
    cenas: [
      { n: '11', local: 'O covil: caverna com tochas e cristais ciano (cenário 11).', chars: ['orpheus', 'boar'], anexar: ['personagens/orpheus.png', 'cenarios/caverna_fundo.jpg'],
        acao: 'Orfeu entra com o porrete. Do túnel escuro sai o javali gigante, soltando vapor pelo focinho; numa das presas brilha a corda dourada. Ele cava o chão com a pata e urra.',
        camera: 'Plano geral; push rápido até a cara do javali.', luz: 'Tochas quentes e brilho ciano dos cristais.', audio: 'Passos pesados; bufo; urro; pedras caindo.', trans: 'Cartela "THE ERYMANTHIAN BOAR" e começa a luta.' }
    ] },
  { id: 'CS8', title: 'A Primeira Corda', quando: 'Logo depois de vencer o javali',
    texto: ['The first string came home.', 'One clear note rang out, and color returned to the forest.'],
    cenas: [
      { n: '12', local: 'O covil, depois da luta.', chars: ['orpheus', 'boar'], anexar: ['personagens/orpheus.png', 'cenarios/caverna_fundo.jpg'],
        acao: 'O javali derrotado se deita e encolhe, brilhando, até virar um javalizinho inofensivo que foge correndo. A corda dourada se desenrola da presa e flutua até as mãos de Orfeu.',
        camera: 'Plano médio, órbita lenta.', luz: 'Tochas; brilho dourado vindo da corda.', audio: 'Brilho mágico; guincho do filhote; motivo de caixinha de música.', trans: 'Corte seco.' },
      { n: '13', local: 'A floresta de Arcádia à noite, cinza e sem cor.', chars: ['orpheus'], anexar: ['personagens/orpheus.png'],
        acao: 'Orfeu prende a corda na lira e toca uma nota limpa. Uma onda de luz dourada sai da lira pela floresta, e árvores e flores cinzentas voltam a ter cor. Vaga-lumes sobem.',
        camera: 'Close na mão tocando; depois pull-back rápido até plano geral.', luz: 'Noite que esquenta com a onda dourada.', audio: 'Uma nota de lira brilhante; whoosh de cor; sons da floresta voltando.', trans: 'Fade.' }
    ] },
  { id: 'CS9', title: 'O Mensageiro dos Deuses', quando: 'Entrada no Santuário de Hermes (antes do diálogo)',
    texto: [],
    cenas: [
      { n: '14', local: 'Santuário de mármore acima das nuvens (cenário 12).', chars: ['orpheus', 'messenger'], anexar: ['personagens/orpheus.png', 'personagens/hermes.png', 'cenarios/santuario_hermes.jpg'],
        acao: 'Uma rajada de vento espalha penas brancas. O deus mensageiro pousa de leve no chão de mármore, na frente de Orfeu, faz uma reverência brincalhona e estende um par de sandálias douradas com asas.',
        camera: 'Plano médio-aberto, leve contra-plongée; o deus pousa dentro do quadro.', luz: 'Raios de sol vindo do alto à esquerda.', audio: 'Rajada de vento; asas batendo; flauta leve e brincalhona.', trans: 'Corte para o diálogo.' }
    ] },
  { id: 'CS10', title: 'Fim da Parte 1', quando: 'Depois de ganhar as sandálias (substitui a tela de fim atual)',
    texto: ['With the winged sandals, Orpheus set out for Attica.', 'Far below, in the silent Underworld, the King was watching... and his Queen wept for a spring she could not see.', 'And in the darkest hall of Tartarus, Eurydice began to hum a song she had not forgotten.', 'END OF PART 1'],
    cenas: [
      { n: '15', local: 'Colinas de Arcádia de dia, com cor de novo.', chars: ['orpheus'], anexar: ['personagens/orpheus.png'],
        acao: 'Com as sandálias aladas, Orfeu corre e salta alto sobre um riacho e um muro de pedra, rumo às montanhas da Ática no horizonte.',
        camera: 'Travelling lateral acompanhando ele (enquadramento de jogo de plataforma).', luz: 'Tarde clara.', audio: 'Tema heroico; vento; bater de asas em cada pulo.', trans: 'Dissolve para o escuro.' },
      { n: '16', local: 'Salão do trono do Submundo (cenário 13).', chars: ['king', 'queen'], anexar: ['personagens/hades.png', 'cenarios/submundo.jpg'],
        acao: 'O Rei, no trono escuro, olha uma poça brilhante que mostra Orfeu correndo. Ao lado, a Rainha segura uma flor de romã murcha e olha para ela, triste; uma lágrima cai nas pétalas.',
        camera: 'Push-in lento da poça até a Rainha.', luz: 'Luz ciano fria do rio; chamas azuis.', audio: 'Drone grave; gotas; uma nota de lira bem longe.', trans: 'Corte seco.' },
      { n: '17', local: 'O salão mais fundo do Tártaro: caverna escura com correntes de luz.', chars: ['soul'], anexar: ['personagens/eurydice.png'],
        acao: 'A alma de Eurídice, brilhando, está sentada abraçando os joelhos. Ela ouve uma nota fraca, levanta a cabeça e começa a cantarolar; uma faísca dourada acende no escuro.',
        camera: 'Push-in lento até o rosto dela.', luz: 'Escuridão; brilho ciano suave vindo dela; faísca dourada.', audio: 'Silêncio; nota de lira fraca; ela cantarolando, sem palavras.', trans: 'Fade para preto e a cartela "END OF PART 1".' }
    ] }
];

const GAME_IDEAS = [
  'As cordas da lira viram item: um contador de 7 cordas no HUD, e cada chefe derrotado devolve uma.',
  'Cada região começa sem cor e volta a ter cor quando a corda dela volta. Dá para fazer com filtro de cor no motor, sem arte nova.',
  'O javali derrotado vira um filhote e foge, em vez de morrer (combina com o público infantil).',
  'Última fase: a subida do Submundo, onde andar para a esquerda (olhar para trás) faz Eurídice sumir.',
  'O Orfeu toca a lira nas cutscenes; a animação de tocar lira (AutoSprite) fica para quando a lira tiver base.'
];

// ---------- output ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const who = (keys) => keys.map((k) => SHEETS[k].label).join(', ');
const allScenes = CUTSCENES.flatMap((c) => c.cenas);
const secs = allScenes.length * 8;

function markdown() {
  const o = ['# Orpheus: Song of Olympus — história e cutscenes', '', 'Gerado por `tools/cutscenes.js`: edite lá, não aqui. Etapa 3 (storyboard) esperando aprovação do Júlio; os prompts de cada cena vêm depois.', ''];
  o.push('## Conceito', '', ...CONCEPT.map(([k, v]) => `- **${k}:** ${v}`), '');
  o.push('## A saga em 7 partes', '', ...SAGA.map((s) => `${s.n}. **${s.regiao}** · ${s.deus} · chefe: ${s.chefe}. ${s.corda}`), '');
  o.push('## Fichas dos personagens (fixas, em inglês)', '', 'Coladas palavra por palavra em toda cena em que o personagem aparece. No Flow, anexar a base de `assets/personagens/`.', '');
  for (const s of Object.values(SHEETS)) o.push(`**[CHARACTER: ${s.label}]** ${s.text}${s.base ? ` _(base: ${s.base})_` : ' _(sem base: só pelo texto)_'}`, '');
  o.push(`## Parte 1 — ${CUTSCENES.length} cutscenes, ${allScenes.length} cenas (~${Math.floor(secs / 60)} min ${secs % 60} s)`, '');
  for (const c of CUTSCENES) {
    o.push(`### ${c.id} — ${c.title}`, '', `**Quando:** ${c.quando}`, '');
    if (c.texto.length) o.push('**Texto na tela (inglês):**', '', ...c.texto.map((t) => `> ${t}`), '');
    else o.push('**Texto:** o diálogo do jogo continua depois do clipe.', '');
    o.push('| Cena | Local | Personagens | Ação | Câmera | Luz | Áudio | Transição | Anexar no Flow |', '|---|---|---|---|---|---|---|---|---|');
    for (const s of c.cenas) o.push(`| ${s.n} · 8 s | ${s.local} | ${who(s.chars)} | ${s.acao} | ${s.camera} | ${s.luz} | ${s.audio} | ${s.trans} | ${s.anexar.join(', ')} |`);
    o.push('');
  }
  o.push('## Ideias de jogo que a história traz', '', ...GAME_IDEAS.map((g) => `- ${g}`), '');
  return o.join('\n');
}

function html() {
  const sagaHtml = SAGA.map((s) => `<li class="part${s.n === 1 ? ' now' : ''}"><div class="pn">${s.n}</div><div><h3>${esc(s.regiao)}</h3><p class="meta-line">${esc(s.deus)} · chefe: <strong>${esc(s.chefe)}</strong></p><p>${esc(s.corda)}</p></div></li>`).join('');
  const sheetsHtml = Object.values(SHEETS).map((s) => `<article class="sheet"><header><h3>${esc(s.label)}</h3><span class="chip-s">${s.base ? 'base: ' + esc(s.base) : 'sem base'}</span></header><p>${esc(s.text)}</p></article>`).join('');
  const csHtml = CUTSCENES.map((c) => `
<section class="cs" id="${c.id}">
  <header class="cs-head"><div class="cs-id">${c.id}</div><div><h3>${esc(c.title)}</h3><p class="when">${esc(c.quando)}</p></div></header>
  ${c.texto.length ? `<blockquote class="script">${c.texto.map((t) => `<p>${esc(t)}</p>`).join('')}</blockquote>` : '<p class="note">Sem narração: o diálogo do jogo continua depois do clipe.</p>'}
  <div class="scenes">${c.cenas.map((s) => `
    <article class="scene">
      <div class="sn"><span>Cena</span><b>${s.n}</b><span>8 s</span></div>
      <div class="sbody">
        <p class="acao">${esc(s.acao)}</p>
        <dl>
          <div><dt>Local</dt><dd>${esc(s.local)}</dd></div>
          <div><dt>Personagens</dt><dd>${esc(who(s.chars))}</dd></div>
          <div><dt>Câmera</dt><dd>${esc(s.camera)}</dd></div>
          <div><dt>Luz</dt><dd>${esc(s.luz)}</dd></div>
          <div><dt>Áudio</dt><dd>${esc(s.audio)}</dd></div>
          <div><dt>Transição</dt><dd>${esc(s.trans)}</dd></div>
          <div class="wide"><dt>Anexar no Flow</dt><dd>${s.anexar.map((a) => `<code>${esc(a)}</code>`).join(' ')}</dd></div>
        </dl>
      </div>
    </article>`).join('')}
  </div>
</section>`).join('');
  return `<title>Cutscenes do Orpheus</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&family=Marcellus&display=swap">
<style>
/* Layout: a reading page — concept, the 7-part saga as an ordered path, fixed character sheets, then Part 1 as numbered cutscenes of 8-second scene cards. */
:root{
  --bg:#ecf0f3; --surface:#ffffff; --sunk:#f3f6f8; --ink:#14203a; --muted:#56627a; --line:#d2d9e2;
  --aegean:#1b5898; --gold:#8a5f10; --olive:#4b6a1f; --night:#1d2440; --on-night:#e9ecf6;
  --display:"Marcellus","Palatino Linotype",Georgia,serif; --body:"IBM Plex Sans",system-ui,-apple-system,"Segoe UI",sans-serif; --mono:"IBM Plex Mono",ui-monospace,Consolas,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0d1320; --surface:#151e30; --sunk:#10182a; --ink:#e5eaf2; --muted:#9ba7bc; --line:#27324a; --aegean:#74abea; --gold:#e3b862; --olive:#a4c56b; --night:#0a0f1c; --on-night:#e9ecf6; color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0d1320; --surface:#151e30; --sunk:#10182a; --ink:#e5eaf2; --muted:#9ba7bc; --line:#27324a; --aegean:#74abea; --gold:#e3b862; --olive:#a4c56b; --night:#0a0f1c; --on-night:#e9ecf6; color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg); color:var(--ink); font:15px/1.65 var(--body); margin:0}
.wrap{max-width:980px; margin:0 auto; padding-inline:20px; padding-block:0 72px}
.hero{background:var(--night); color:var(--on-night); padding-block:40px 32px}
.hero .wrap{padding-block:0}
.eyebrow{font:500 12px/1.2 var(--mono); letter-spacing:.08em; text-transform:uppercase; opacity:.75}
h1{font:400 clamp(34px,6vw,54px)/1.05 var(--display); margin:10px 0 12px; text-wrap:balance}
.hero p{margin:0; max-width:62ch; opacity:.9}
.stats{display:flex; flex-wrap:wrap; gap:8px 22px; margin-top:18px; font:500 13px/1.3 var(--mono); opacity:.85}
h2{font:400 28px/1.15 var(--display); margin:40px 0 6px; text-wrap:balance}
.sub{margin:0 0 16px; color:var(--muted); max-width:70ch}
.concept{display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,280px),1fr)); gap:12px}
.concept div{background:var(--surface); border:1px solid var(--line); border-radius:8px; padding:14px 16px; min-width:0}
.concept dt{font:500 11px/1.4 var(--mono); letter-spacing:.07em; text-transform:uppercase; color:var(--aegean)}
.concept dd{margin:4px 0 0}
ol.saga{list-style:none; margin:0; padding:0; display:grid; gap:10px}
.part{display:grid; grid-template-columns:44px minmax(0,1fr); gap:14px; background:var(--surface); border:1px solid var(--line); border-radius:8px; padding:14px 16px}
.part.now{border-color:var(--gold); box-shadow:0 0 0 1px var(--gold)}
.pn{font:400 30px/1 var(--display); color:var(--gold); text-align:center}
.part h3{margin:0; font:600 17px/1.3 var(--body)}
.part p{margin:4px 0 0}
.meta-line{color:var(--muted); font-size:14px}
.sheets{display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr)); gap:12px}
.sheet{background:var(--surface); border:1px solid var(--line); border-radius:8px; padding:14px 16px; min-width:0}
.sheet header{display:flex; flex-wrap:wrap; justify-content:space-between; gap:6px; align-items:baseline}
.sheet h3{margin:0; font:500 13px/1.3 var(--mono); letter-spacing:.05em}
.chip-s{font:500 11px/1 var(--mono); color:var(--muted); border:1px solid var(--line); border-radius:4px; padding:3px 5px}
.sheet p{margin:8px 0 0; font:13px/1.55 var(--mono); color:var(--ink); overflow-wrap:anywhere}
.cs{margin-top:28px}
.cs-head{display:grid; grid-template-columns:auto minmax(0,1fr); gap:14px; align-items:center}
.cs-id{font:500 13px/1 var(--mono); background:var(--night); color:var(--on-night); border-radius:6px; padding:8px 10px}
.cs-head h3{margin:0; font:400 24px/1.15 var(--display)}
.when{margin:2px 0 0; color:var(--muted); font-size:14px}
.script{margin:14px 0 0; padding:14px 18px; border-left:3px solid var(--gold); background:var(--surface); border-radius:0 8px 8px 0}
.script p{margin:0; font:italic 16px/1.6 var(--display)}
.script p + p{margin-top:6px}
.note{margin:12px 0 0; color:var(--muted); font-size:14px}
.scenes{display:grid; gap:10px; margin-top:12px}
.scene{display:grid; grid-template-columns:64px minmax(0,1fr); background:var(--surface); border:1px solid var(--line); border-radius:8px; overflow:hidden}
.sn{background:var(--sunk); border-right:1px solid var(--line); display:grid; align-content:center; justify-items:center; gap:2px; padding:10px 4px; font:500 11px/1.2 var(--mono); color:var(--muted)}
.sn b{font:400 26px/1 var(--display); color:var(--aegean); font-variant-numeric:tabular-nums}
.sbody{padding:12px 16px; min-width:0}
.acao{margin:0 0 10px; font-weight:500}
.sbody dl{display:grid; grid-template-columns:repeat(auto-fit,minmax(min(100%,210px),1fr)); gap:6px 18px; margin:0}
.sbody dl div{min-width:0}
.sbody .wide{grid-column:1/-1}
.sbody dt{font:500 11px/1.4 var(--mono); letter-spacing:.06em; text-transform:uppercase; color:var(--muted)}
.sbody dd{margin:0; font-size:14px; overflow-wrap:anywhere}
code{font:12.5px var(--mono); color:var(--aegean)}
ul.ideas{margin:0; padding-left:20px; display:grid; gap:6px; max-width:75ch}
.next{margin-top:36px; background:var(--surface); border:1px solid var(--gold); border-radius:8px; padding:16px 18px}
.next h2{margin:0 0 6px; font-size:22px}
.next p{margin:0}
@media (max-width:560px){.scene{grid-template-columns:minmax(0,1fr)} .sn{border-right:0; border-bottom:1px solid var(--line); grid-auto-flow:column; justify-content:start; gap:8px; padding:8px 14px}}
</style>

<div class="hero"><div class="wrap">
  <div class="eyebrow">Orpheus: Song of Olympus · roteiro e storyboard</div>
  <h1>Cutscenes do Orpheus</h1>
  <p>A história completa em sete partes e as cutscenes da Parte 1, cena por cena, para gerar no Flow (Veo) no mesmo 2.5D do jogo. Esta página é para aprovar a história: os prompts de cada cena vêm depois do seu ok.</p>
  <div class="stats"><span>${CUTSCENES.length} cutscenes</span><span>${allScenes.length} cenas de 8 s</span><span>~${Math.floor(secs / 60)} min ${secs % 60} s de vídeo</span><span>${Object.keys(SHEETS).length} fichas de personagem</span></div>
</div></div>

<div class="wrap">
  <h2>Conceito</h2>
  <dl class="concept">${CONCEPT.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>

  <h2>A saga em 7 partes</h2>
  <p class="sub">Cada parte é uma região da Grécia com um deus que ajuda, um chefe e uma corda da lira. A Parte 1 é a que já existe no jogo.</p>
  <ol class="saga">${sagaHtml}</ol>

  <h2>Fichas dos personagens</h2>
  <p class="sub">Em inglês e fixas: vão coladas palavra por palavra em toda cena em que o personagem aparece, e no Flow anexa-se a base dele. O rei do Submundo e o deus mensageiro ficam sem nome próprio, porque o Flow recusou os nomes.</p>
  <div class="sheets">${sheetsHtml}</div>

  <h2>Parte 1 — cutscenes</h2>
  <p class="sub">O texto em inglês aparece na caixa do jogo enquanto o clipe roda. A coluna "Anexar no Flow" diz quais imagens do projeto usar como ingrediente (no máximo 3).</p>
  ${csHtml}

  <h2>Ideias de jogo que a história traz</h2>
  <ul class="ideas">${GAME_IDEAS.map((g) => `<li>${esc(g)}</li>`).join('')}</ul>

  <div class="next"><h2>Próximo passo</h2><p>Aprovando a história e o storyboard (ou pedindo mudanças), eu escrevo o prompt de cada cena para o Flow, com botão Copiar e a marcação de Pronto, igual às outras páginas.</p></div>
</div>
`;
}

fs.writeFileSync(path.join(DOCS, 'cutscenes.html'), html());
fs.writeFileSync(path.join(DOCS, 'CUTSCENES.md'), markdown());
console.log(`OK: ${CUTSCENES.length} cutscenes, ${allScenes.length} cenas -> docs/cutscenes.html, docs/CUTSCENES.md`);

// ---------- stage 4: one Flow/Veo prompt per scene ----------
// The English fields of each scene live in cutscenes_prompts.json (written and cross-checked by review agents);
// the style, the reference line, the character sheets and the base negatives are fixed here, so they are identical in every clip.
const CLIPS_URL = 'https://claude.ai/artifact/9N1dVQMPKwPWXMLcMAv2Bk'; // filled in after the first publish of docs/prompts_clipes.html
const FIELDS = path.join(__dirname, 'cutscenes_prompts.json');
if (fs.existsSync(FIELDS)) {
  const { html: promptsHtml, markdown: promptsMd } = require('./prompts_flow.js');
  const F = JSON.parse(fs.readFileSync(FIELDS, 'utf8'));
  const STYLE_V = '[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.';
  const REF_V = '[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.';
  const NEG_V = 'no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore';
  const clip = (s) => {
    const f = F[s.n];
    if (!f) throw new Error(`cutscenes_prompts.json has no scene ${s.n}`);
    const audio = ['[AUDIO]', '- Dialogue: none, nobody speaks.', '- Narrator: none.',
      f.voice && !/^none\.?$/i.test(f.voice.trim()) ? `- Voice: ${f.voice}` : null,
      `- Music: ${f.music}`, `- SFX: ${f.sfx}`, `- Ambient: ${f.ambient}`].filter(Boolean).join('\n');
    return [STYLE_V, REF_V,
      '[CHARACTERS]\n' + s.chars.map((k) => `[CHARACTER: ${SHEETS[k].label}] ${SHEETS[k].text}`).join('\n'),
      `[SETTING] ${f.setting}`, `[ACTION] ${f.action}`, `[CAMERA] ${f.camera}`, `[LIGHTING] ${f.lighting}`, audio,
      `[NEGATIVE] ${NEG_V}${f.extra_negative ? ', ' + f.extra_negative.trim().replace(/\.$/, '') : ''}.`].join('\n\n');
  };
  const P = CUTSCENES.flatMap((c) => c.cenas.map((s, i) => ({
    n: s.n, sec: c.id, first: s.n === '01', title: `${c.title} · cena ${i + 1} de ${c.cenas.length}`,
    file: `cena_${s.n}`, ratio: '16:9', video: true, sum: s.acao, game: `${c.id}: ${c.quando}`,
    facts: [['Anexar no Flow', s.anexar.map((a) => 'assets/' + a).join('  +  ')], ['Quando toca', `${c.id}: ${c.quando}`]],
    text: clip(s)
  })));
  const CFG = {
    title: 'Clipes do Orpheus', url: CLIPS_URL, key: 'orpheus_clipes_prontos_v1', prompts: P,
    sections: CUTSCENES.map((c) => ({ id: c.id, name: `${c.id} · ${c.title}`, intro: c.texto.length ? `Texto na tela: ${c.texto.join(' ')}` : 'Sem narração: o diálogo do jogo continua depois do clipe.' })),
    steps: [
      'No Flow, use o modo de vídeo com **ingredientes** (imagens de referência), **16:9**, 8 segundos.',
      'Anexe as imagens da linha **Anexar no Flow**. Elas ficam em `C:\\Users\\julio\\Documents\\website\\jogos\\olympus\\assets\\` (personagens sem fundo e cenários).',
      'Gere na ordem, começando pela **cena 01**: cada prompt continua do fim da cena anterior. Baixe só o clipe escolhido e marque **Pronto**.',
      'Diga ao Claude *"importa os prontos"*: eu salvo em `assets/cutscenes/cena_NN` e o cartão muda para **No projeto**.'
    ],
    checks: [
      'Mesmo rosto, cabelo e roupa das imagens anexadas, do começo ao fim do clipe',
      'Lira no estado certo: 7 cordas até a cena 05, moldura vazia de 08 a 12, uma corda de 13 em diante',
      'Porrete só a partir da cena 10; sandálias aladas só na 15',
      'Ninguém a mais em cena e ninguém falando',
      'Nenhum texto, legenda ou logo na imagem',
      'Mãos e rostos sem deformar',
      'Hora do dia igual à das cenas vizinhas'
    ],
    fixes: [
      ['Rosto ou roupa mudou', 'keep the exact face, hair and clothes of the attached reference images in every frame, no morphing'],
      ['Apareceu texto ou legenda', 'no text, no subtitles, no letters or numbers anywhere on screen'],
      ['Apareceu gente a mais', 'only the characters described, nobody else in the scene'],
      ['Porrete na cena da lira', 'he holds only the golden lyre, no club, no weapon'],
      ['Movimento rápido ou confuso', 'slow, calm movement, one simple action, steady camera'],
      ['Saiu realista ou pixelado', 'stylized 3D animated film look, hand-painted textures, not photorealistic, not pixel art']
    ],
    lede: `${P.length} clipes de 8 segundos para as ${CUTSCENES.length} cutscenes da Parte 1, no mesmo 2.5D do jogo. Cada prompt já traz as fichas fixas dos personagens, a continuidade com a cena anterior e o áudio sem falas (o texto em inglês aparece na caixa do jogo).`,
    footer: 'Pronto = o clipe escolhido já está em Downloads. O Claude copia para <code>jogos/olympus/assets/cutscenes/</code> e muda o cartão para No projeto. Fonte: <code>jogos/olympus/tools/cutscenes.js</code> (fichas e storyboard) e <code>tools/cutscenes_prompts.json</code> (texto de cada cena).'
  };
  fs.writeFileSync(path.join(DOCS, 'prompts_clipes.html'), promptsHtml(CFG));
  fs.writeFileSync(path.join(DOCS, 'PROMPTS_FLOW_CLIPES.md'),
    '# Prompts do Google Flow (Veo) — clipes das cutscenes da Parte 1\n\nGerado por `tools/cutscenes.js` + `tools/cutscenes_prompts.json`: edite lá, não aqui.\n\n' + promptsMd('##', CFG));
  console.log(`OK: ${P.length} clipes -> docs/prompts_clipes.html, docs/PROMPTS_FLOW_CLIPES.md`);
}
