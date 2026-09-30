# ORPHEUS: SONG OF OLYMPUS — MEMÓRIA COMPLETA DO PROJETO

> **Como usar este arquivo numa sessão nova do Claude Code (local ou nuvem):**
> abra o terminal na pasta do repositório e diga ao Claude:
> **"Leia o arquivo ORPHEUS_MEMORIA_COMPLETA.md inteiro antes de qualquer coisa e continue o projeto a partir dele."**
> Este é o arquivo **mestre**. Ele reúne tudo: contexto, histórico de decisões, arquitetura, contrato de sprites, plano do AutoSprite (com prompts), plano do Google Flow (com os 21 prompts), especificação de arte, ferramentas de teste, pendências e preferências do autor.
> Os outros documentos (`jogos/olympus/CONTEXTO.md`, `docs/ART_SPEC.md`, `docs/PROMPTS_FLOW_CENARIOS.md`) são subconjuntos deste.

---

## 0. Resumo em 10 linhas

1. Jogo de navegador **"Orpheus: Song of Olympus"** — ação e aventura side-scroll inspirada em *The Battle of Olympus* (NES, 1988) e no mito de Orfeu e Eurídice.
2. Regra: **o máximo parecido sem ser plágio** — gênero, estrutura e mecânicas iguais; código, arte, música, textos e nome **originais**.
3. **Parte 1 (Arcádia) está completa e jogável**: abertura → vilarejo → Templo de Zeus → floresta → chefe Javali de Erimanto → Santuário de Hermes → fim da Parte 1.
4. Código: GitHub `julioamancio/website`, branch **`claude/keen-cray-3ygj2k`**, pasta **`jogos/olympus/`**. No PC do Júlio: `C:\Users\julio\Documents\website`.
5. Visual atual: pixel art moderna em **384×216** feita por código (módulos em `js/art/`). O Júlio **ainda acha os personagens feios**. **Direção nova (29/09/2026): nada de pixel art retrô — o jogo vai ser 2.5D bonito** (personagens e cenários com cara de 3D estilizado, luz suave, filme de animação). Isso exige o motor em alta resolução (seção 11, passo 0).
6. **Decisão atual: refazer TODOS os personagens no AutoSprite** (via MCP, localmente) e os **cenários no Google Flow**. A correção de proporção do Orfeu procedural foi **cancelada**.
7. O MCP do AutoSprite já está configurado em **`.mcp.json`** (lê a chave de `AUTOSPRITE_API_KEY`). Requer plano **Pro**.
8. A chave antiga do AutoSprite **foi exposta no chat** → **revogar e criar nova**; nunca colar chaves no chat nem gravar no repositório.
9. Jogo publicado (privado) em **https://claude.ai/artifact/9HA44jnBVMPLmLF6HnbKYg**; localmente basta abrir `jogos/olympus/index.html`.
10. Testes: `jogos/olympus/tools/regressao.js` (Playwright) — rodar depois de qualquer mudança.

---

## 1. Autor e preferências (seguir sempre)

- **Júlio**, professor de Língua Inglesa e Programação; faz jogos e apps por "vibe coding" (Claude Code, MCP, GPT, Gemini, Google Flow, Roblox Studio, Unreal C++).
- Responder em **português do Brasil**, claro, direto, completo e organizado (títulos, listas). Sem introduções desnecessárias.
- **Textos do jogo em inglês** (uso didático). Prompts para Flow/imagens/AutoSprite **em inglês**, detalhados, prontos para copiar, **com restrições negativas**, consistência visual e separação clara de elementos.
- Código **completo e funcional**; dizer arquivos e locais exatos; analisar o projeto antes de criar algo duplicado; considerar integração, salvamento, desempenho, segurança, erros e compatibilidade.
- Projetos grandes **por etapas**; se ele pedir "parte por parte", entregar só a etapa pedida e esperar.
- **Não concordar automaticamente**: apontar erros, riscos e limitações; nunca afirmar que algo foi feito sem verificar.
- Ele trabalha no **Windows** (PowerShell). Ao dar comandos, usar sintaxe do PowerShell e lembrar de **não** rodar em `C:\WINDOWS\System32`.
- Segurança: nunca pedir nem gravar chaves/senhas no chat ou no repositório; usar variáveis de ambiente.

---

## 2. Histórico do projeto e decisões (para não repetir erros)

| # | O que aconteceu | Resultado / decisão |
|---|---|---|
| 1 | v1: jogo NES 256×240, sprites 16×24 desenhados em texto, música chiptune original | Funcionou, mas o Júlio achou **feio** |
| 2 | v2: "NES caprichado", sprites 16×32 com sombreamento automático, cenários em parallax, HUD com grega | "**Ficou realmente muito ruim**" |
| 3 | Tentativa de gerar arte com IA: **Higgsfield** conectado mas **0 créditos**; **Canva/Gamma** geram imagem mas a **rede da sessão na nuvem bloqueia** o download | Inviável na nuvem |
| 4 | v3 (atual): motor refeito em **384×216 widescreen**, HUD sobreposto, câmera suave, contrato de animação por nomes; **6 agentes artistas** (Orfeu, NPCs+retratos, inimigos, mundo, céu/iluminação, interface) + **crítico independente** por módulo, até 3 rodadas | Notas finais do crítico ≈ **6–6,5/10**. Grande salto de qualidade, mas não "comercial". Integração: floresta clareada, espinhos sempre visíveis, morcegos pairando (não pendurados no céu), cobras na frente da grama, piscar de olhos |
| 5 | O Júlio pediu **AutoSprite**. Existe **MCP oficial** (`https://www.autosprite.io/api/mcp`, `Authorization: Bearer`), exige **plano Pro (US$ 29/mês)** | Na nuvem a rede bloqueia `www.autosprite.io` (403) → **trabalhar localmente** |
| 6 | O Júlio colou a chave do AutoSprite no chat | **Chave exposta: revogar e criar nova.** Não foi gravada em lugar nenhum |
| 7 | Correção de proporção do Orfeu (procedural) iniciada | **Cancelada** pelo Júlio: "vamos fazer tudo no AutoSprite" |
| 8 | Pedido de prompts para os **cenários no Google Flow** | 16 prompts prontos (seção 9) |
| 9 | 29/09/2026: página de prompts com botão Copiar + 5 fachadas de frente (casas, barraca, templo, caverna). Logo depois o Júlio disse: **"não quero pixel da época, a ideia é boneco 2,5D, platform, bem bonito"** | Prompts do Flow e estilo do AutoSprite (7.2) **reescritos em 2.5D**. Pixel art está descartada para arte nova |

Críticas registradas da v3 (úteis se algum módulo procedural continuar em uso):
- **Orfeu:** "chibi" (cabeça 12 px de 37; 1:3,1), pernas curtas, lê como criança/menina (saia rodada + cabelo volumoso + fitas vermelhas), capa rígida, braços finos, rastro do golpe fraco, agachado alto demais (29 px para hitbox de 22), some na floresta à noite.
- **NPCs:** rostos com o mesmo layout do Orfeu; raio de Zeus parece chama; retrato de Hermes simples; chamas de Hades fracas.
- **Inimigos:** padrão da cobra vira faixa escura a 1x; asas do morcego parecem mãos no zoom.
- **Mundo:** caverna escura demais ("mingau escuro"); estátua ajustada por âncora (pedestal 22 px, `levels.js` usa `lift: 12`).
- **Céu/luz:** `sky.js` embrulha (`wrap`) `drawWorld`, `drawLights`, `O.renderLevel` e `O.drawA` para conseguir ganchos; o ideal é o motor chamar `O.Light.onLevel(lvl)` após `O.renderLevel` e `O.Light.pre(ctx, game)` antes das entidades.
- **Interface:** nome do chefe em fonte pequena; `drawItemGet` duplica raios; typewriter poderia ser mais rápido.

---

## 3. Como retomar no Windows

```powershell
# 1) Pasta do projeto (NUNCA em C:\WINDOWS\System32)
cd $HOME\Documents\website
git checkout claude/keen-cray-3ygj2k
git pull

# 2) Jogar
start .\jogos\olympus\index.html

# 3) Chave NOVA do AutoSprite (depois de revogar a antiga no site do AutoSprite)
setx AUTOSPRITE_API_KEY "sua_chave_nova"
# feche e reabra o PowerShell, depois confira:
echo $env:AUTOSPRITE_API_KEY

# 4) Claude Code na pasta do repositório (o .mcp.json já tem o AutoSprite)
cd $HOME\Documents\website
claude
# dentro do Claude: aprove o servidor "autosprite" e rode /mcp para ver se está conectado
# alternativa manual, se o .mcp.json não for lido:
# claude mcp add autosprite https://www.autosprite.io/api/mcp -t http --header "Authorization: Bearer $env:AUTOSPRITE_API_KEY"

# 5) Ferramentas de teste (Node.js 18+ instalado)
cd $HOME\Documents\website\jogos\olympus\tools
npm install
npx playwright install chromium
node regressao.js
```

Para salvar o trabalho: `git add -A`, `git commit -m "mensagem"`, `git push`.


---

## 4. O jogo e onde ele está

### 4.1 O que é
- **Gênero:** ação e aventura em side-scroll (estilo Zelda II / *The Battle of Olympus*, NES 1988), com pixel art moderna.
- **Regra de ouro:** ser **o máximo parecido sem ser plágio**. Mantemos gênero, estrutura e mecânicas (que não têm direito autoral), além do mito de Orfeu (domínio público). **Todo o código, os sprites, as músicas, os textos e o nome são originais.** Nunca copiar gráficos, músicas, nomes ou diálogos do jogo de 1988 (lá a amada se chama Helene; aqui é **Eurídice**, como no mito).
- **História:** Orfeu, jovem da Arcádia, perde a amada Eurídice (picada de serpente no dia do casamento). Hades aprisiona a alma dela no Tártaro. Orfeu jura resgatá-la e percorre a Grécia recebendo dádivas dos deuses.
- **Autor do projeto:** Júlio (professor de Inglês e Programação). Textos do jogo em **inglês** (uso didático); conversa com o Claude em **português do Brasil**.

### 4.2 Onde está
| O quê | Onde |
|---|---|
| Código | GitHub `julioamancio/website`, branch **`claude/keen-cray-3ygj2k`**, pasta `jogos/olympus/` |
| Jogar no navegador (versão publicada) | https://claude.ai/artifact/9HA44jnBVMPLmLF6HnbKYg (privado; compartilhar pelo menu *Share*) |
| Jogar localmente | abrir `jogos/olympus/index.html` direto no navegador (não precisa de servidor) |
| Link no site | `portfolio.html` → card "Orpheus: Song of Olympus" |

#### Baixar para o computador
```bash
git clone https://github.com/julioamancio/website.git
cd website
git checkout claude/keen-cray-3ygj2k
# jogar: abra jogos/olympus/index.html no navegador
```

---

## 5. Estado atual e pendências
Fluxo completo testado: abertura (5 cenas) → vilarejo (Ancião entrega o **porrete**) → Templo de Zeus (**bênção**: +4 de vida máxima, salva o jogo) → Floresta da Arcádia (cobras, morcegos, sátiros, buracos, espinhos) → Covil do **Javali de Erimanto** (chefe) → Santuário de Hermes (**Sandálias de Hermes**, pulo alto) → tela "End of Part 1".

#### Histórico visual
1. **v1 NES** (256×240, sprites 16×24) — o Júlio achou feio.
2. **v2 NES caprichado** (sprites 16×32 com sombreamento) — "ficou realmente muito ruim".
3. **v3 pixel art moderna (atual)** — 384×216 widescreen, 6 módulos de arte feitos por agentes especializados + crítico independente. Notas do crítico: 6–6,5/10. Muito melhor, mas ainda não "comercial".

#### Pendências conhecidas
- **DECISÃO DO JÚLIO: todos os personagens serão refeitos no AutoSprite** (seção 6). O Júlio acha os personagens atuais feios. A correção de proporção do Orfeu procedural foi **cancelada** — não gastar tempo melhorando `js/art/hero.js`, `npcs.js` ou `enemies.js`; eles ficam só como reserva até os sprites do AutoSprite entrarem.
- Para referência: o Orfeu procedural atual é "chibi" (cabeça 12 px de 37 px de altura, pernas curtas). Os sprites do AutoSprite devem ter proporção adulta (~1:4 ou mais), ~38–41 px de altura na tela.
- Cenários: o Júlio quer gerar no **Google Flow** → prompts prontos em `docs/PROMPTS_FLOW_CENARIOS.md` (seção 7).
- Caverna um pouco escura demais.
- Espinhos da floresta têm crânios e poças de sangue — trocar por algo mais leve se o público for infantil.
- Site principal: `index.html` e `README.md` da raiz têm restos de conflito de merge (linhas com nomes de branch e `=======`).

---

## 6. Regras de jogo e arquitetura técnica

### 6.1 Controles e balanceamento
| Ação | Teclado | Controle | Celular |
|---|---|---|---|
| Andar | Setas / WASD | D-pad | D-pad na tela |
| Pular (A) | X, K, Espaço | A | A |
| Atacar (B) | Z, J | X ou B | B |
| Ataque baixo | ↓ + atacar | ↓ + ataque | ↓ + B |
| Falar / portas | ↑ | ↑ | ↑ |
| Status / pausa | Enter, P | Start | START |
| Som liga/desliga | M | — | — |

Números de balanceamento (em `js/entities.js`):
- Andar 1,5 px/quadro; gravidade 0,25; pulo 4,8 (≈ 44 px de altura) e 5,8 com sandálias (≈ 64 px); queda máx. 5.
- Orfeu: hitbox 12×34 em pé, 12×22 agachado. Ataque dura 20 quadros; o golpe acerta nos quadros 7–13, alcançando 22 px à frente (em pé: de pés−28 até pés−14; agachado: de pés−14 até os pés). **Cobra só morre com ataque agachado** (mecânica do original).
- Vida inicial 12 (+4 com a bênção de Zeus). Buraco tira 2 de vida e volta ao último chão seguro.
- Inimigos: cobra (1 HP, dano 1, dá bote), morcego (1 HP, voa em seno), sátiro (3 HP, dano 2, pula), **Javali** (16 HP; ronca, bate a pata, investe a 3,2 px/quadro, bate na parede → atordoado leva **dano dobrado**, derruba pedras do teto; dano 3 na investida).
- Economia: **azeitonas** (moeda); **ambrosia** custa 10 azeitonas (máx. 3; beber na pausa +8 vida); **romã** +4 vida.
- Salvamento: `localStorage` chave `orpheus_song_of_olympus_v1` (ao falar com Zeus, receber itens importantes, derrotar o chefe).

### 6.2 Arquitetura
JavaScript puro, sem build, sem módulos ES (cada arquivo é uma IIFE sobre `window.OLY`, chamado de `O`). Abre por `file://`.

```
jogos/olympus/
  index.html        canvas 384x216 + controles de toque; ordem dos <script> importa
  css/game.css
  js/core.js        O.W=384, O.H=216, O.TILE=16, O.ROWS=13, O.VIEW_Y=8 (mundo desenhado 8 px abaixo do topo), fonte, O.logOnce
  js/pix.js         O.Pix (grade de pixels: set, rect, ellipse, orb, capsule, poly, stroke, outline, selout, canvas), O.PAL5 (paleta mestra), O.makeRamp, O.mix, O.shift, O.bayer
  js/sprites.js     O.registerSprite(nome, PixOuCanvas, {ax, ay}); O.drawA(ctx, nome, x, y, flip, white); O.ART_INITS; O.bootArt(); sprites antigos como reserva (aliases)
  js/tiles.js       O.Tiles base (reserva)
  js/art/world.js   tiles com autotiling (O.Tiles.getCtx, handlesEdges, overlay), decoração, estátua, O.drawLightProp (braseiro/tocha/cristal)
  js/art/sky.js     O.Tiles.background(tema) (parallax), O.Light.apply (iluminação, névoa, raios, gradação de cor), estilo de partículas
  js/art/hero.js    Orfeu (rig de poses)
  js/art/npcs.js    NPCs, deuses, retratos 48x48, O.drawNPCAura
  js/art/enemies.js cobra, morcego, sátiro, javali, pedra
  js/ui.js          O.UI: HUD, diálogo com retrato, título, história, pausa, game over, final, banner, barra do chefe, fonte, ícones
  js/audio.js       chiptune (2 pulsos + triângulo + ruído), músicas originais e efeitos
  js/input.js       teclado, controle, toque
  js/levels.js      mapas (13 linhas de tiles), decoração, luzes, NPCs, inimigos, saídas
  js/story.js       TODOS os textos (abertura, diálogos, itens, final, dicas de missão)
  js/entities.js    física, Orfeu, inimigos, chefe, NPCs, itens
  js/game.js        estados, diálogos, salvamento, câmera suave, partículas de ambiente
  js/render.js      monta a cena e chama os ganchos dos módulos de arte (com try/catch — um módulo com erro não derruba o jogo)
  js/main.js        boot + loop fixo 60 FPS
  docs/ART_SPEC.md  especificação de arte (direção, escalas, contratos de quadros)
  docs/PROMPTS_FLOW_CENARIOS.md  prompts do Google Flow
  tools/            ferramentas de teste (seção 8)
```

#### Contrato de quadros (o motor procura estes nomes)
- **Orfeu:** `hero_idle_0..3`, `hero_blink`, `hero_run_0..7`, `hero_jump`, `hero_peak`, `hero_fall`, `hero_land`, `hero_crouch`, `hero_atk_0..4`, `hero_catk_0..4`, `hero_jatk_0..4`, `hero_hurt`, `hero_dead_0`, `hero_dead_1`, `hero_hold`, `hero_lyre_0..1`.
- **NPCs:** `<tipo>_idle_0..3` e `<tipo>_blink` para elder, merchant, villager, eurydice, zeus, hermes, hades; `eurydice_ghost_0..3`; retratos `portrait_<tipo>` (inclui `portrait_orpheus`).
- **Inimigos:** `snake_move_0..3`, `snake_lunge_0..1`, `bat_hang`, `bat_fly_0..3` (âncora no **centro** do corpo), `satyr_idle_0..1`, `satyr_walk_0..5`, `satyr_jump`, `boar_idle_0..3`, `boar_paw_0..3`, `boar_run_0..5`, `boar_stun_0..3`, `rock`.
- **Itens/ícones:** `olive`, `ambrosia`, `pom`, `heart`, `icon_club`, `icon_sandals`, `lyre`, `bolt`, `arrow_up`, `statue`.
- **Âncora:** `(ax, ay)` = ponto dos pés (centro da base); tudo desenhado **virado para a DIREITA** (o motor espelha). Mesmo `ax` em todos os quadros de um personagem (senão ele "treme").

### 6.3 Textos do jogo
Todos os textos (em inglês, só maiúsculas, sem acentos) estão em `jogos/olympus/js/story.js`: `O.STORY` (5 páginas da abertura: orpheus, lovers, serpent, hades, oath), `O.ITEMS` (club, blessing, sandals), `O.ENDING`, `O.questHint(st)` e `O.TALK` (diálogos de elder, merchant, villager, zeus, hermes). Caracteres permitidos: `A-Z 0-9 . , ! ? ' - : / ( ) " + =`.

### 6.4 Música e som
`jogos/olympus/js/audio.js`: motor chiptune próprio (Web Audio: 2 pulsos, triângulo, ruído). Músicas **originais**: title, village, forest, boss, temple, gameover, fanfare. Notação `NOTA+OITAVA.DURAÇÃO` (duração em semicolcheias; `-.4` = pausa). Efeitos: jump, swing, hit, kill, hurt, olive, life, blip, select, door, pause, roar, crash, rock, die, buy, bat, bosshit. Tecla **M** liga/desliga o som.

---

## 7. PRIORIDADE ATUAL — Personagens no AutoSprite (via MCP)

### 7.1 Fluxo de trabalho
> **29/09/2026 — como está sendo feito:** a imagem base de cada personagem (corpo inteiro, perfil, olhando para a direita, sobre magenta, 2.5D) é gerada pelo Júlio no **Google Flow** com os prompts de `docs/PROMPTS_FLOW_PERSONAGENS.md` (página com botão Copiar: https://claude.ai/artifact/4HLTmWg8VocQqpeeMMQPNd; fonte `tools/prompts_personagens.js`). O Claude importa de Downloads (`tools/importar_flow.js --dir personagens`), tira o magenta e sobe no AutoSprite com `upload_character` (grátis); as animações (~5 créditos cada) só depois do ok do Júlio. Cenários: 20 de 21 já estão em `assets/cenarios/` (falta o céu da vila, 03). **As 8 bases (Orfeu + 7 NPCs) já estão prontas e sem fundo em `assets/personagens/*.png`; o plano de animação, com os prompts e os nomes do motor, está em `docs/PLANO_AUTOSPRITE.md`.**
1. Conferir o MCP: `/mcp` deve mostrar `autosprite` conectado (ferramentas como `list_characters`, `create_character`, `upload_character`, pedidos de animação e de spritesheet, acompanhamento de jobs).
2. **Começar só pelo Orfeu** e mostrar ao Júlio (imagens) antes de fazer os outros.
3. Para cada personagem: criar (prompt da 7.3) → gerar as animações da 7.4 → exportar **spritesheet PNG transparente + JSON do atlas** → salvar em `jogos/olympus/assets/sprites/<nome>.png` e `<nome>.json`.
4. Criar o carregador **`jogos/olympus/js/art/autosprite.js`** (seção 7.5), incluir no `index.html` **depois** de `js/art/enemies.js`, rodar `tools/regressao.js` e tirar capturas com `tools/gameshot.js`.
5. Publicar/atualizar o link e fazer commit e push.

### 7.2 Estilo comum (colar no início de TODO prompt de personagem)
```
Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer set in mythological Ancient Greece, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face with visible eyes. ONE single character only, alone in the frame. Strict side view (profile), facing RIGHT, whole body inside the frame, nothing cropped, feet on the bottom edge. Adult heroic proportions (about 6 to 6.5 heads tall, stylized) — NOT chibi, NOT big-headed. Transparent background.
NEGATIVE: no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no background, no ground shadow, no text, no watermark, no extra characters, no weapons other than the ones described, no blur, no cropped feet or head, no modern clothing.
```

### 7.3 Personagens (descrição fixa — colar igual em todas as gerações do mesmo personagem)
| Nome do arquivo | Prompt do personagem (em inglês, depois do estilo comum) |
|---|---|
| `orpheus` | Orpheus, a young Greek hero around 20 years old, slim athletic build, defined jaw, kind but determined eyes, short wavy auburn hair kept close to the head, bright scarlet headband with two short tails, white short chiton ending above the knee with a gold trim and a single shoulder strap, brown leather belt with bronze buckle, short crimson cape falling from the left shoulder, bronze bracers, brown leather sandals laced up to the calves, holding a thick knotted olive-wood club in the right hand. |
| `eurydice` | Eurydice, a gentle young Greek woman around 19, long flowing golden hair with a small crown of white flowers, soft kind face, white ankle-length flowing dress with a thin gold belt, bare arms, barefoot or thin sandals, graceful calm posture. |
| `elder` | The village elder of Arcadia, an old wise man around 75, long white hair and a long white beard, slightly hunched, brown wool himation robe with a lighter tunic under it, leaning on a tall gnarled wooden staff, warm tired eyes. |
| `merchant` | A market merchant woman around 40, dark brown hair tied in a bun under an orange headscarf, light-blue ankle-length dress with a cream apron, holding a small clay jar of golden ambrosia, friendly smile. |
| `villager` | A young village woman around 22, dark hair in a bun with a pink flower, pink calf-length dress with a white shawl, holding a small basket of apples, cheerful posture. |
| `zeus` | Zeus, king of the gods, larger than mortals (about 1.25 times the hero's height), powerful old man with long flowing white hair and a full white beard, golden laurel crown, white and gold robes with a blue sash, raising a crackling golden lightning bolt in the right hand, stern majestic expression, faint golden divine glow. |
| `hermes` | Hermes, messenger god, youthful and slim, about 1.15 times the hero's height, winged golden petasos helmet, curly brown hair, playful grin, light-blue short chiton with gold trim, winged golden sandals, holding a golden caduceus staff with two snakes and small wings. |
| `hades` | Hades, lord of the underworld, tall and imposing (about 1.2 times the hero's height), pale grey-violet skin, dark iron crown with ghostly blue flames, glowing cyan eyes, long black and deep purple robes with iron details, holding a dark two-pronged bident, cold menacing expression. |
| `satyr` | A satyr enemy from Greek myth, muscular upper body with tan skin, curled ram horns, wild dark-brown hair and beard, goat legs with shaggy dark-brown fur and black hooves (backward-bending knees), holding a crude wooden club, aggressive grin, about the same height as the hero. |
| `snake` | A low green-olive viper enemy crawling on the ground, patterned back with dark diamonds, yellow belly, raised head with small glowing eyes and a red forked tongue, about 0.7 times the hero's height in length and only 0.3 times the hero's height tall. |
| `bat` | A cave bat enemy with purple-brown leathery wings, big ears, red glowing eyes, tiny white fangs, wingspan about 0.75 times the hero's height. |
| `boar` | The Erymanthian Boar, a huge mythical wild boar boss, about 1.75 times the hero's height in length and 1.2 times the hero's height tall, dark reddish-brown body, bristly mane rising along the spine, long curved ivory tusks, scarred snout, glowing red eye, hooves digging into the ground, steam from the nostrils. |

### 7.4 Animações necessárias → nomes que o motor usa (contrato)
O motor procura exatamente estes nomes; o carregador converte os quadros do AutoSprite para eles.

| Personagem | Animação no AutoSprite (sugestão) | Quadros | Nome no motor |
|---|---|---|---|
| orpheus | idle (breathing) | 4 | `hero_idle_0..3` (+ `hero_blink` opcional) |
| orpheus | run | 8 | `hero_run_0..7` |
| orpheus | jump (rise / apex / fall) | 3 | `hero_jump`, `hero_peak`, `hero_fall` |
| orpheus | land (squash) | 1 | `hero_land` |
| orpheus | crouch | 1 | `hero_crouch` |
| orpheus | attack with club (anticipation, wind-up, strike with smear, follow-through, recover) | 5 | `hero_atk_0..4` |
| orpheus | crouch attack (low strike) | 5 | `hero_catk_0..4` |
| orpheus | jump attack | 5 | `hero_jatk_0..4` |
| orpheus | hurt | 1 | `hero_hurt` |
| orpheus | death (fall, lying) | 2 | `hero_dead_0`, `hero_dead_1` |
| orpheus | hold item above head | 1 | `hero_hold` |
| orpheus | play lyre | 2 | `hero_lyre_0..1` |
| elder, merchant, villager, eurydice, zeus, hermes, hades | idle | 4 | `<nome>_idle_0..3` (+ `<nome>_blink`) |
| eurydice | ghost (pale, translucent look) | 4 | `eurydice_ghost_0..3` |
| snake | crawl / strike | 4 / 2 | `snake_move_0..3`, `snake_lunge_0..1` |
| bat | fly / hang | 4 / 1 | `bat_fly_0..3`, `bat_hang` (âncora no **centro** do corpo) |
| satyr | idle / walk / jump | 2 / 6 / 1 | `satyr_idle_0..1`, `satyr_walk_0..5`, `satyr_jump` |
| boar | idle / paw ground / charge run / stunned | 4 / 4 / 6 / 4 | `boar_idle_0..3`, `boar_paw_0..3`, `boar_run_0..5`, `boar_stun_0..3` |

Retratos de diálogo (`portrait_<nome>`, 48×48) continuam os procedurais de `js/art/npcs.js` (são o ponto mais elogiado da v3). Se o AutoSprite não fizer retratos, podem ser gerados no Flow depois.

### 7.5 Carregador `js/art/autosprite.js` (o que ele precisa fazer)
- Ler um manifesto (ex.: `assets/sprites/manifest.js` definindo `window.OLY_SPRITES = [{ file: 'orpheus', map: { 'idle': 'hero_idle', ... }, scale: ..., anchor: {...} }]`) — usar **.js em vez de .json** porque `fetch` de arquivo local é bloqueado em `file://`.
- Carregar os PNG com `new Image()` **antes** de criar o jogo: hoje `main.js` chama `O.bootArt()` e `new O.Game(ctx)` de forma síncrona → mudar `main.js` para esperar uma `Promise` de carregamento (com timeout e, se falhar, seguir com os sprites procedurais).
- **2.5D (29/09/2026):** com o motor em HD, reduzir **com suavização** (não vizinho mais próximo) e registrar na resolução alta; os tamanhos abaixo são em unidades do jogo (multiplicar pela escala do motor).
- Fatiar cada quadro num canvas próprio, reduzir para a escala do jogo (Orfeu com **38–41 px** de altura; NPCs humanos 35–38; Zeus ~48; Hermes ~46; Hades ~46; sátiro ~40–46; javali ~70×48; cobra ~28×12; morcego ~30 de envergadura) e chamar `O.registerSprite(nome, canvas, { ax, ay })`.
- **Âncora**: `ax` = centro horizontal do corpo (constante em todos os quadros do personagem), `ay` = linha logo abaixo da sola (pés). Morcego: âncora no centro do corpo. Tudo virado para a **direita** (o motor espelha).
- Registrar em `O.ART_INITS` para rodar depois dos módulos procedurais (sobrescreve os nomes; o que faltar continua procedural).
- Atenção: desenhar PNG local no canvas funciona em `file://`, mas **ler pixels** (`getImageData`) pode ser bloqueado ("tainted canvas"). Se precisar ler pixels, embutir as imagens como data URI no manifesto `.js` ou rodar um servidor local (`npx serve jogos/olympus`).
- Hitboxes **não mudam** (Orfeu 12×34 em pé / 12×22 agachado; cobra 20×10; morcego 16×10; sátiro 14×34; javali 48×32).

### 7.6 Mensagem pronta para colar no Claude Code local
```
Leia ORPHEUS_MEMORIA_COMPLETA.md inteiro. Use o MCP do AutoSprite para criar o Orfeu seguindo a seção 7
(estilo comum + prompt do personagem), gere as animações da tabela 7.4 e me mostre o resultado antes
de fazer os outros personagens. Depois baixe as spritesheets para jogos/olympus/assets/sprites/,
crie o carregador js/art/autosprite.js conforme a 7.5, rode tools/regressao.js e me mostre capturas do jogo.
```


---

## 8. Cenários no Google Flow

### 8.1 Plano de integração
- Prompts prontos: `docs/PROMPTS_FLOW_CENARIOS.md` (21 imagens: título, vila em 4 camadas, floresta em 4 camadas, 5 fachadas de frente, 4 interiores, 3 cenas da história).
- Salvar em `jogos/olympus/assets/cenarios/` com os nomes indicados.
- Integração: camadas com fundo **magenta #FF00FF** → remover o magenta (chroma key), reduzir para 384×216 (ou 768 de largura para camadas que rolam), quantizar a paleta, e usar em `O.Tiles.background(tema)` (`js/art/sky.js`) como `{ sky, layers: [{ c, f }] }` (f = fator de parallax: céu 0, longe ~0,08, meio ~0,25, perto ~0,5). Interiores (templos/caverna) substituem a parede de fundo (tiles `m`/`k` passam a ficar transparentes quando houver imagem).

### 8.2 Os 21 prompts
Gerados por `jogos/olympus/tools/prompts_flow.js` (edite lá e rode `node prompts_flow.js`).

Página com botão **Copiar** em cada prompt (e marcação do que já está pronto): https://claude.ai/artifact/XrdJBjQUYghg8jiKqWtXgm

#### Como usar

1. Gere primeiro o **02 — Vilarejo, camada distante**. Depois anexe a imagem aprovada dele como **referência de estilo** nas outras, **menos nos céus (03 e 07)**: ali o Flow copia a montanha e o templo.
2. Antes de gerar, troque a proporção no Flow para a do cartão: quase todos são **16:9 (deitada)**; só as casas, a barraca e a caverna são 1:1. Peça 4 variações.
3. Baixe **só a variação escolhida** (ela vai para Downloads) e marque **Pronto logo em seguida**, uma de cada vez. O Claude pega a imagem mais recente de Downloads e coloca no projeto com o nome certo.
4. Quando quiser, diga ao Claude *"importa os prontos"*. O cartão muda para **No projeto** ou mostra o que refazer.

#### Checklist antes de aprovar

- Proporção certa: 16:9 deitada nos fundos, interiores e história
- Visual 2.5D bonito: volume de 3D estilizado, luz suave e detalhe nítido; nada de pixel art nem de foto realista
- Luz vindo da esquerda e de cima
- Nenhuma pessoa, animal, texto ou moldura
- Magenta chapado, sem degradê, e nada roxo ou rosa dentro do desenho
- Camadas: bordas esquerda e direita com alturas parecidas
- Casas: vistas bem de frente, sem parede lateral nem telhado visto de cima
- Monte Olimpo com o mesmo formato no título, na vila e no juramento

**Se falhar, cole no fim do prompt:** saiu pixel art ou retrô → *"stylized 3D render, soft global illumination, sharp clean details, not pixel art"*; saiu foto realista → *"stylized animated-film look, hand-painted textures, not photorealistic"*; apareceu gente → *"empty scene, nobody"*; magenta com degradê → *"perfectly flat pure #FF00FF background, no gradient"*; casa em perspectiva → *"flat front elevation, straight-on, no perspective, no side walls"*; roxo ou rosa no desenho → *"no purple, no pink, no violet anywhere on the subject"*.

#### Fundos

Camadas que rolam atrás do jogo. As de fundo magenta viram parallax (o magenta é recortado por código); os céus são imagem cheia. Nas camadas com magenta, lilás e sombra violeta viraram azul para o recorte não comer o desenho.

##### 02 — Vilarejo — camada distante · `vila_longe`

proporção 16:9 · fundo magenta · GERE PRIMEIRO. No jogo: ARCADIA · camada longe, parallax 0,08.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[LAYER] Far parallax layer, bright afternoon. Mount Olympus as a massive snow-capped mountain range: the main peak slightly right of center reaching about 15% from the top of the image, with a tiny golden temple on the summit; secondary peaks on both sides. Rock faces in cool slate blue with sunlit cream-white snow on the left slopes and cool blue shadows on the right slopes. The base of the range fades to a lighter, opaque pale-blue tone. The mountain range touches both the left and right edges of the image at similar heights.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no clouds, no sun, no magenta inside the mountains, no purple, no violet, no pink, no lilac.
```

##### 03 — Vilarejo — céu · `vila_ceu`

proporção 16:9 · imagem cheia. No jogo: ARCADIA · céu fixo, parallax 0.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Sky only, bright Mediterranean afternoon: a smooth banded gradient from deep cobalt blue at the top to pale warm cream near the horizon, a soft glowing sun in the upper-right area, and three or four stylized fluffy cumulus clouds with cream highlights and lavender undersides floating in the middle band. The lower 40% of the image is just pale hazy sky.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no mountains, no ground, no buildings, no birds.
```

##### 04 — Vilarejo — colinas (meio) · `vila_meio`

proporção 16:9 · fundo magenta. No jogo: ARCADIA · camada do meio, parallax 0,25.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Middle parallax layer: gentle rolling green hills occupying the lower 45% of the image, dotted with tall dark cypress trees, round olive groves and a few tiny whitewashed houses with terracotta roofs; a winding dirt path and low dry-stone walls. The hills are slightly hazy (lighter and bluer than a foreground). Hill tops are lit from the upper-left. The hill line continues to both the left and right edges at similar heights.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no mountains, no sky details, no clouds, no purple, no violet, no pink, no lilac.
```

##### 05 — Vilarejo — primeiro plano · `vila_perto`

proporção 16:9 · fundo magenta. No jogo: ARCADIA · primeiro plano, parallax 0,5.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Near parallax layer: a continuous band in the bottom 30% of the image made of lush silver-green olive bushes, wild blue sage, red poppies and white daisies, and a low weathered dry-stone wall with patches of moss. Saturated colors, well defined, lit from the upper-left. The band touches both the left and right edges.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no trees taller than 30% of the image, no magenta flowers, no pink flowers, no purple, no violet, no pink, no lilac.
```

##### 07 — Floresta — céu noturno · `floresta_ceu`

proporção 16:9 · imagem cheia. No jogo: FOREST OF ARCADIA · céu fixo, parallax 0.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Night sky over a forest, just after twilight: banded gradient from deep indigo at the top through violet to a faint dusty rose glow at the horizon, a large luminous full moon with visible craters in the upper-left area surrounded by a soft glowing halo, many small twinkling stars, two thin long wisps of violet cloud. The lower 35% is the dim rose-violet horizon glow only.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no trees, no mountains, no ground.
```

##### 08 — Floresta — montanhas e pinheiros (longe) · `floresta_longe`

proporção 16:9 · fundo magenta. No jogo: FOREST OF ARCADIA · camada longe, parallax 0,08.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Far parallax layer at night: soft distant mountain ridges in dusty blue-grey, and in front of them a dense line of pine and fir tree silhouettes in misty deep navy blue with thin silver moon-rim light on their upper-left edges, an opaque band of pale blue-white mist at their base. Occupies the lower 50% of the image and touches both the left and right edges.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no moon, no stars, no bright colors, no purple, no violet, no pink, no lilac.
```

##### 09 — Floresta — árvores grandes (meio) · `floresta_meio`

proporção 16:9 · fundo magenta. No jogo: FOREST OF ARCADIA · camada do meio, parallax 0,25.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Middle parallax layer of an enchanted Arcadian forest at night: four or five large ancient oak trees with thick twisted trunks and big rounded canopies in deep blue-teal, silver moon rim light on the upper-left edges of the leaves, hanging ivy and moss, a few faint glowing mushrooms at the roots. The trunks reach the bottom edge; the canopies fill roughly the 20% to 70% height band.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no moon, no ground platforms, no paths, no purple, no violet, no pink, no lilac.
```

##### 10 — Floresta — primeiro plano · `floresta_perto`

proporção 16:9 · fundo magenta. No jogo: FOREST OF ARCADIA · primeiro plano, parallax 0,5.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Near parallax layer at night: a continuous dark band in the bottom 25% of the image made of ferns, tall grass, brambles and bushes in very dark blue-green, with thin silver rim light on the tips of the leaves. Hanging leafy branches enter from the top edge in the top 12%. The band touches both the left and right edges.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no fireflies, no tree trunks in the middle of the image, no purple, no violet, no pink, no lilac.
```

#### Casas de frente

Prédios vistos bem de frente, sobre magenta, para entrar no lugar das casas e do templo feitos de tiles. São novos: não estavam na lista de 16.

##### 17 — Casa do Ancião · `casa_anciao`

proporção 1:1 · fundo magenta · novo. No jogo: ARCADIA, tiles 2–7 (onde fica o Ancião) · 96×96 px no jogo.

```
[STYLE] Beautiful stylized 3D building asset for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, hand-painted texture detail on stone, wood, cloth and roof tiles, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), seen perfectly straight from the front as a flat elevation with no perspective, square 1:1, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[BUILDING] The front of the village elder's house in Arcadia, as one flat building facade for a side-scrolling game: a single-story whitewashed stone house, about as wide as it is tall including the roof, thick walls with a few hairline cracks and patches of bare warm stone near the base, a two-tier terracotta tile roof (the lower tier spans the full width with slightly overhanging ends, the upper tier is narrower and centered), a sturdy blue wooden door with a rounded top placed a little LEFT of center and reaching down to the baseline, one small square window with open blue shutters on the RIGHT side of the wall, a faded blue Greek key band painted just under the roof edge, a bundle of dried herbs hanging from the eaves, a clay pot with a small olive sapling next to the door.

[LAYOUT] The walls take the lower two thirds of the building and the roof the upper third. The house is centered, fills about 90% of the image width and stands on a straight flat baseline touching the bottom edge of the image. Light from the upper-left: the left side of every relief is brighter.

[BACKGROUND] Everything that is not part of the house must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient, no shadow and no details. Keep a crisp clean edge between the house and the magenta, with no glow or soft shadow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the house.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no signs, no ground, no grass, no sky, no background scenery, no trees behind the building, no perspective, no vanishing point, no visible side walls, no roof seen from above, no cast shadow on the background, no purple, no violet, no pink, no lilac.
```

##### 18 — Casa da família · `casa_vila`

proporção 1:1 · fundo magenta · novo. No jogo: ARCADIA, tiles 15–20 · 96×96 px no jogo.

```
[STYLE] Beautiful stylized 3D building asset for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, hand-painted texture detail on stone, wood, cloth and roof tiles, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), seen perfectly straight from the front as a flat elevation with no perspective, square 1:1, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[BUILDING] The front of a village family house in Arcadia, as one flat building facade for a side-scrolling game, with the same simple shape as a small single-story house but its own character: whitewashed stone walls with a warm ochre band painted along the bottom, a two-tier terracotta tile roof (the lower tier spans the full width, the upper tier is narrower and centered) with a few mismatched newer tiles, a blue wooden door with a small stone step placed a little LEFT of center and reaching down to the baseline, a small bronze door knocker, one square window with open blue shutters on the RIGHT side with a wooden flower box of red geraniums, a thin grapevine climbing from the far left of the base up to the roof edge with small green leaves and green grape bunches.

[LAYOUT] The walls take the lower two thirds of the building and the roof the upper third. The house is centered, fills about 90% of the image width and stands on a straight flat baseline touching the bottom edge of the image. Light from the upper-left: the left side of every relief is brighter.

[BACKGROUND] Everything that is not part of the house must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient, no shadow and no details. Keep a crisp clean edge between the house and the magenta, with no glow or soft shadow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the house.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no signs, no ground, no grass, no sky, no background scenery, no trees behind the building, no perspective, no vanishing point, no visible side walls, no roof seen from above, no cast shadow on the background, no purple, no violet, no pink, no lilac.
```

##### 19 — Barraca da mercadora · `barraca_mercadora`

proporção 1:1 · fundo magenta · novo. No jogo: ARCADIA, atrás da mercadora (tile 25) · cerca de 80×64 px · novo.

```
[STYLE] Beautiful stylized 3D building asset for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, hand-painted texture detail on stone, wood, cloth and roof tiles, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), seen perfectly straight from the front as a flat elevation with no perspective, square 1:1, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[BUILDING] A small open-air market stall in the village square of Arcadia, run by a seller of ambrosia, as one flat front view for a side-scrolling game: a wooden frame of four slim posts, a slanted cloth awning with wide stripes in cream and Aegean blue and a scalloped edge, a sturdy wooden counter at about half the height of the stall, on the counter a row of round clay jars of glowing golden ambrosia with cork stoppers, a woven basket of green olives and a basket of red pomegranates, two tall terracotta amphorae standing at the sides, a small bronze hanging scale under the awning. Nobody behind the counter.

[LAYOUT] The stall is centered, fills about 85% of the image width and about 80% of the image height, and stands on a straight flat baseline touching the bottom edge of the image. Light from the upper-left.

[BACKGROUND] Everything that is not part of the stall must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient, no shadow and no details. Keep a crisp clean edge between the stall and the magenta, with no glow or soft shadow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the stall.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no signs, no ground, no grass, no sky, no background scenery, no trees behind the building, no perspective, no vanishing point, no visible side walls, no roof seen from above, no cast shadow on the background, no purple, no violet, no pink, no lilac.
```

##### 20 — Templo de Zeus (fachada) · `templo_zeus_fachada`

proporção 16:9 · fundo magenta · novo. No jogo: ARCADIA, tiles 30–42 · 208×144 px no jogo · a porta central leva ao templo.

```
[STYLE] Beautiful stylized 3D building asset for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, hand-painted texture detail on stone, wood, cloth and roof tiles, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), seen perfectly straight from the front as a flat elevation with no perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[BUILDING] The exterior of the Temple of Zeus in the village of Arcadia, as one flat front facade for a side-scrolling game: a wide base of three low white marble steps spanning the full width, four tall fluted white marble columns with simple capitals (two on the left and two on the right of the entrance), a pale marble wall behind the columns, a single large dark rectangular doorway exactly in the horizontal center between the two inner columns, sitting directly on the top step and about half as tall as the columns, with a faint warm golden glow deep inside, a gold-trimmed entablature with a Greek key frieze above the columns, and a low triangular pediment on top with a golden relief of an eagle and a lightning bolt.

[LAYOUT] The temple is centered, fills about two thirds of the image height and a little more than half of the image width, and stands on a straight flat baseline touching the bottom edge of the image. Left and right of the temple there is only magenta. The doorway is filled with deep dark shadow, never magenta.

[BACKGROUND] Everything that is not part of the temple must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient, no shadow and no details. Keep a crisp clean edge between the temple and the magenta, with no glow or soft shadow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the temple.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no signs, no ground, no grass, no sky, no background scenery, no trees behind the building, no perspective, no vanishing point, no visible side walls, no roof seen from above, no cast shadow on the background, no statues, no braziers, no purple, no violet, no pink, no lilac.
```

##### 21 — Entrada da caverna (floresta) · `entrada_caverna`

proporção 1:1 · fundo magenta · novo. No jogo: FOREST OF ARCADIA, tiles 104–111 · 128×112 px no jogo · a boca leva ao covil.

```
[STYLE] Beautiful stylized 3D building asset for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, hand-painted texture detail on stone, wood, cloth and roof tiles, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), seen perfectly straight from the front as a flat elevation with no perspective, square 1:1, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[BUILDING] The entrance of the Erymanthian Boar's den at the far end of the Arcadian forest at night, as one flat side view for a side-scrolling game: a massive block of layered dark grey-brown rock with thick moss and hanging ivy along its top edge and twisted tree roots creeping over it, a wide dark cave mouth at ground level on the LEFT half of the rock (the opening is about half of the rock's width and a little less than half of its height), deep claw scratch marks on the rock around the opening, a few fallen branches at its base, cool silver-blue moonlight on the upper-left edges.

[LAYOUT] The rock fills the full width of the image and almost its full height, with a thin band of magenta above its uneven top. It stands on a straight flat baseline touching the bottom edge. The inside of the cave mouth is solid very dark brown-black, never magenta.

[BACKGROUND] Everything that is not part of the rock must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient, no shadow and no details. Keep a crisp clean edge between the rock and the magenta, with no glow or soft shadow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the rock.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no signs, no ground, no grass, no sky, no background scenery, no trees behind the building, no perspective, no vanishing point, no visible side walls, no roof seen from above, no cast shadow on the background, no boar, no bones, no skulls, no purple, no violet, no pink, no lilac.
```

#### Interiores

Fundo inteiro das salas fechadas. O centro fica livre porque o deus ou o chefe aparece ali.

##### 06 — Templo de Zeus (interior) · `templo_zeus`

proporção 16:9 · imagem cheia. No jogo: TEMPLE OF ZEUS · parede de fundo da sala.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] Interior of the Temple of Zeus at night, seen straight from the side: a grand back wall of pale lavender marble blocks with a gold Greek key frieze along the top, tall fluted marble columns near the left and right edges, crimson and gold drapes hanging between them, a large arched window in the center showing a starry night sky and a crescent moon with a soft beam of moonlight falling diagonally, carved reliefs of an eagle and lightning bolts in gold, two empty wall niches with shadowed alcoves, warm brazier glow at floor level. The floor is a simple polished marble strip in the bottom 12%.

[COMPOSITION] Keep the center of the image open and uncluttered (a god will float there). No objects on the floor between 20% and 80% of the width.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no statues of people, no perspective vanishing point, no ceiling perspective.
```

##### 11 — Covil do Javali (caverna) · `caverna_fundo`

proporção 16:9 · imagem cheia. No jogo: BOAR'S DEN · parede de fundo da sala.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] The den of a giant wild boar: a vast cavern seen from the side, with a layered rocky back wall in warm browns and deep plum shadows, huge stalactites hanging from the top and stalagmites below, two iron wall torches casting warm amber pools of light on the rock, clusters of glowing cyan crystals near the floor, scratch marks and scattered old bones along the base of the wall, a darker tunnel opening on the far right. The floor is a simple dark rock strip in the bottom 12%.

[COMPOSITION] The center of the floor area is empty (a boss fight happens there). Moody but readable: the rock surfaces lit by the torches must stay clearly visible.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no boar, no skulls in the center, no pitch-black areas covering more than 20% of the image.
```

##### 12 — Santuário de Hermes (interior) · `santuario_hermes`

proporção 16:9 · imagem cheia. No jogo: SHRINE OF HERMES · parede de fundo da sala.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] Shrine of Hermes, the messenger god, seen straight from the side: an airy open-air sanctuary of white marble with sky-blue accents, tall slender columns, three wide arches in the back wall opening onto a bright sky full of clouds far below (the shrine floats high among the clouds), golden reliefs of winged sandals, winged helmets and a caduceus staff, soft sunbeams falling diagonally from the upper-left, a few floating white feathers. The floor is a simple polished marble strip in the bottom 12%.

[COMPOSITION] Keep the center of the image open and uncluttered (a god will float there).

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no statues of people, no perspective vanishing point.
```

##### 13 — Submundo de Hades · `submundo`

proporção 16:9 · imagem cheia. No jogo: História, página 4 (Hades).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] The throne hall of Hades in the underworld, seen from the side: colossal obsidian pillars fading into darkness, a massive empty black stone throne with iron spikes in the center, ghostly blue-violet flames burning in iron braziers, the glowing river Styx flowing across the bottom of the image with a cold cyan light, faint drifting wisps of lost souls as pale mist, deep red cracks of magma in the far walls, iron chains hanging from above.

[COMPOSITION] The throne is empty and centered; keep the space in front of it clear for characters.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no skeletons, no gore, no blood.
```

#### Título e história

Tela de abertura e cenas das páginas da história.

##### 01 — Tela de título · `titulo`

proporção 16:9 · imagem cheia. No jogo: Tela de título (logo no alto, menu embaixo).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] Epic key art at sunset: the majestic snow-capped Mount Olympus rises on the right half, a tiny glowing golden temple on its summit radiating soft light rays. The low sun sits near the horizon slightly right of center, painting the sky in bands of deep violet, magenta, coral and gold. Long pink-gold cloud banks drift across the middle distance, distant hills with cypress silhouettes below them. In the left third of the foreground, a dark rocky cliff with a flat grassy top (at about 72% of the image height) and a lone windswept olive tree, empty and ready for a hero to stand on. Tiny birds far away.

[COMPOSITION] Keep the top 30% of the image as calm open sky (a logo will be placed there). Keep the lower-center area calm and dark enough for a menu. Nothing important in the top-left corner.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no lens flare, no perspective tilt, no fisheye.
```

##### 14 — Campo do casamento · `historia_casamento`

proporção 16:9 · imagem cheia. No jogo: História, página 2 (os noivos).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] A flowering meadow in Arcadia at golden hour, prepared for a wedding: a large old olive tree on the right decorated with garlands of white flowers and ribbons, a small marble altar with a bowl of fruit, fields of poppies and daisies, cypress trees and a whitewashed village on the distant hills, Mount Olympus faint on the horizon, warm golden light and long soft shadows. The grassy ground line sits at about 80% of the image height.

[COMPOSITION] The center of the ground is empty (two characters will stand there).

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain.
```

##### 15 — A serpente (entardecer) · `historia_serpente`

proporção 16:9 · imagem cheia. No jogo: História, página 3 (a serpente).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] The same flowering meadow and decorated olive tree as the wedding scene, now at ominous dusk: the sky turning from bruised violet to dim orange, long dark shadows, the flower garlands fallen on the grass, tall dark grass in the foreground where something could hide, the first stars appearing, a cold wind bending the grass. The grassy ground line sits at about 80% of the image height.

[COMPOSITION] Same framing and horizon as the wedding meadow. The center of the ground is empty.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no snake.
```

##### 16 — O juramento (amanhecer) · `historia_juramento`

proporção 16:9 · imagem cheia. No jogo: História, página 5 (o juramento).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] A grassy hilltop at dawn overlooking the vast land of Greece: the first rays of the sun rising behind the distant Mount Olympus on the right, a glowing golden temple on its summit, a winding road descending into misty valleys with cypress trees and olive groves, a sky in bands of pale gold, peach and soft blue, a sense of a long journey ahead. The hilltop ground line sits at about 80% of the image height on the left half and slopes down on the right.

[COMPOSITION] The left third of the hilltop is empty (a hero will stand there looking right).

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain.
```

---

## 9. Ferramentas de teste (`jogos/olympus/tools/`)
```bash
cd jogos/olympus/tools
npm install
npx playwright install chromium
node regressao.js                       # teste completo de jogabilidade + tempo por quadro
node gameshot.js tela.png village 8     # captura do jogo (fases: village, forest, den, zeus, hermes; telas: title, story0..story4, dialog, pause, itemget, gameover, ending)
node preview.js folha.png hero_ 4 sky   # folha ampliada de sprites (ponto vermelho = âncora)
node prop.js                            # mede a proporção do Orfeu (cabeça/tronco/pernas)
```
Resultado esperado de `regressao.js`: `standKills:false, crouchKills:true, club:true, zeus maxHp 16 saved true, boss def true door "n", end state "ending" sandals true part1 true, jump 43.7, jumpSandals 64.4`, e alguns ms por quadro.

---

## 10. Publicar / atualizar o link do jogo

- O link **https://claude.ai/artifact/9HA44jnBVMPLmLF6HnbKYg** é um *Artifact* do Claude (privado; compartilhar pelo menu **Share** da página).
- Ele é montado assim: um `orpheus.html` com `<title>Orpheus: Song of Olympus</title>`, o CSS de `css/game.css` embutido num `<style>` (mais `:root{color-scheme:dark}` e `body{background:#000}`), o trecho do `index.html` entre `<main id="wrap">` e `</noscript>`, e as mesmas tags `<script src="js/...">` do `index.html`. Os arquivos `js/**` (e futuramente `assets/**`) são publicados junto, com os mesmos caminhos.
- Numa sessão com a ferramenta de Artifact: publicar esse `orpheus.html` passando `url` = o link acima e `files` mapeando cada `js/...` (e `assets/...`) para o arquivo local. Se a sessão não tiver essa ferramenta, jogar localmente abrindo `index.html` ou publicar o repositório no GitHub Pages.
- Imagens do AutoSprite/Flow precisam ir junto em `files` (ex.: `assets/sprites/orpheus.png`).

---

## 11. Próximos passos (em ordem)
0. **Motor em HD para a arte 2.5D:** hoje o canvas é 384×216 ampliado com vizinho mais próximo (feito para pixel art); arte 2.5D nessa resolução vira borrão. Desenhar em 1920×1080 (escala 5 sobre as MESMAS unidades do jogo — física, hitboxes e fases não mudam), suavização ligada, HUD e fonte nítidos. Os sprites procedurais ficam como reserva até a arte nova entrar.
1. **AutoSprite:** configurar o MCP no computador local e gerar/integrar TODOS os personagens (seção 6) — prioridade.
2. **Flow:** gerar e integrar os cenários (seção 7).
3. Ajustes: caverna mais clara; decidir sobre crânios/sangue dos espinhos.
4. **Parte 2 — Ática:** templo de Atena (nova arma/escudo), novos inimigos (ex.: lobos, harpias), novo chefe mitológico, novas músicas. Manter o mesmo contrato de arte e os mesmos ganchos.
5. Limpar os restos de conflito de merge do `index.html`/`README.md` do site.
6. Atualizar o link publicado (Artifact) depois de cada mudança.

---

## Apêndice A — Especificação de arte completa (ART_SPEC)

> **Atenção (29/09/2026):** a direção de arte "modern pixel art" abaixo foi **substituída por 2.5D** (ver seção 0 e a 7.2). Continua valendo só para escalas, âncoras, nomes de quadros e contratos do motor.

Escrita para os agentes artistas da v3. Continua válida para escalas, âncoras, nomes de quadros e direção de arte (também para integrar AutoSprite e Flow). As ferramentas citadas ficam em `jogos/olympus/tools/`.

> Nota: as ferramentas citadas abaixo (preview.js, gameshot.js, prop.js) agora ficam em `jogos/olympus/tools/` e funcionam em qualquer computador (`cd jogos/olympus/tools && npm install && npx playwright install chromium`). Onde este texto cita uma pasta `/tmp/.../scratchpad/art`, use `jogos/olympus/tools`.

Project root: `/home/user/WebSite/jogos/olympus/` (plain browser JS, no build step, no modules — every file is an IIFE on `window.OLY`, referred to as `O`).
The game is a side-scrolling action-adventure inspired by the NES classic *The Battle of Olympus* (Greek myth: Orpheus crosses Arcadia to rescue Eurydice from Hades). The player (Brazilian teacher) said the current art "looks really bad" and asked for **beautiful, modern sprites**. Everything must be original work (no copying of the 1988 game's art).

### Art direction — "modern pixel art", not NES
Target the look of contemporary indie pixel games (Celeste, Dead Cells, Blasphemous, Owlboy, Eastward):
- **Rich hue-shifted ramps**: shadows drift toward violet/blue, highlights toward warm yellow. Use `O.PAL5` ramps (5 tones, index 0 = brightest, 4 = darkest) or build new ones with `O.makeRamp(baseHex, n)`. Never shade with pure black or plain darker grey.
- **Coloured "sel-out" outlines**: the outer silhouette uses `O.PAL5.outline` (#1b1426, deep plum) — never #000000. Interior separations use the darkest tone of the local material, not black. Where a silhouette edge is strongly lit, you may use a dark tone of the material instead of the outline colour.
- **Light from the upper-left** for every asset (consistent scene lighting). Optional thin cool **rim light** on the right/back edge of characters for depth.
- **Clean clusters, no pillow shading, no noise**: shade by form (cylinders for limbs, spheres for heads, folds for cloth). Dithering only for large soft gradients (sky, glow), never on small character parts.
- **Readable silhouettes at 1x**, strong contrast between character and background, clear faces (eyes readable), expressive poses (line of action, contrapposto), overlapping action and follow-through in animation (hair/cape/cloth lag 1–2 frames behind the body), squash & stretch on land/jump.
- **Anti-aliasing by hand** only where it helps curves (1 intermediate tone on curved outlines), never blurry.
- Palette world: Mediterranean. Whitewashed walls, terracotta roofs, blue doors, olive and cypress trees, marble temples with gold, twilight forest, warm-lit cave, divine gold light for gods.

### Resolution and scale (already implemented in the engine)
- Internal resolution **384×216** (16:9), scaled with nearest-neighbour. Tiles are **16×16**. The level is 13 rows (208 px) drawn at screen y = 8 (`O.VIEW_Y`); the HUD overlays the top.
- Character scale reference: **Orpheus ≈ 36–38 px tall** (feet to top of hair). Hitbox 12×34 standing, 12×22 crouching.
- NPC humans 34–38 px; **gods (Zeus, Hermes) 42–48 px** (bigger, divine); Hades ≈ 44 px.
- Satyr ≈ 38–42 px (hitbox 14×34). Snake ≈ 26–30×12–14 (hitbox 20×10, very low — the hero must crouch to hit it). Bat wingspan ≈ 26–32 px (hitbox 16×10). **Erymanthian Boar ≈ 64–76 px long, 44–52 px tall** (hitbox 48×32).

### Drawing toolkit (js/pix.js — read it)
`new O.Pix(w,h)` pixel grid: `set/get/rect/ellipse/ball/orb(n-tone shaded ellipse)/capsule(x0,y0,x1,y1,r0,r1,ramp)` (shaded limb), `poly(points,c)`, `line`, `stroke(x0,y0,x1,y1,r,c)`, `ditherRect`, `outline(c)`, `selout(outerColor)`, `blit(src,ox,oy)`, `canvas()`.
Helpers: `O.PAL5` (master palette), `O.makeRamp`, `O.mix(a,b,t)`, `O.shift(hex, amt)` (+ lighter/warmer, − darker/cooler), `O.bayer(x,y)`, `O.rng(seed)`, `O.hash(x,y,s)`.
You may also draw with the Canvas 2D API into `O.makeCanvas(w,h)` (imageSmoothing is off) — but keep hard pixel edges (no anti-aliased canvas paths/gradients on sprites; use them only for big soft effects like light).
Hand-authored pixel maps (arrays of strings with a legend → colours) are encouraged for faces, hair and anything that needs precise detail; combine with procedural parts as you like. **You may write any helpers inside your own file.**

### Registering art
- Each module pushes an init function: `O.ART_INITS.push(function () { ... })`. It runs at boot after the legacy sprites, before the game starts.
- `O.registerSprite(name, pixOrCanvas, { ax, ay })` — (ax, ay) is the **anchor pixel**, placed on the entity's feet point (bottom-centre of the hitbox). Default anchor = bottom-centre (last row). Flipped (facing left) and white-flash variants are generated automatically — **draw everything facing RIGHT**.
- Anchor rule: for grounded things, `ay` = the row of the outline pixel under the feet (it overlaps the ground's top pixel row), `ax` = horizontal centre of the body (not of a weapon or smear). Keep `ax` consistent across all frames of a character so it does not jitter.
- **Bats are anchored on the body centre** (engine draws bat frames at the hitbox centre).
- Legacy placeholder sprites exist under the same names; your registration overwrites them.

### Frame contracts (names are exact; `_N` = frame index starting at 0)
#### Hero — owner: js/art/hero.js
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

#### NPCs & gods — owner: js/art/npcs.js
- Idle loops `<kind>_idle_0..3` (12 ticks/frame; subtle breathing, blinking, cloth/hair sway) for kinds: **elder** (old village sage, white hair & long beard, brown wool himation, wooden staff), **merchant** (market woman with a clay jar of ambrosia, light-blue dress), **villager** (young woman, pink dress, flower in dark hair), **eurydice** (gentle young woman, golden hair, white flowing dress, flower crown), **zeus** (king of gods, 44–48 px, white hair and beard, golden laurel crown, white/gold robes, holds a crackling lightning bolt), **hermes** (messenger god, 42–46 px, winged petasos helmet, winged sandals, caduceus staff, light-blue short chiton, youthful), **hades** (lord of the underworld, 44 px, dark robes, pale grey-violet skin, crown of dark flames or iron, glowing eyes, bident).
- Also `eurydice_ghost_0..3` (translucent-looking spectral version: pale cyan/white, can be drawn with lighter palette; the story screen uses it).
- **Portraits for dialogue boxes**: `portrait_<kind>` for elder, merchant, villager, eurydice, zeus, hermes, hades, **orpheus** (48×48 each, bust shot facing right, framed-ready: no frame needed, transparent or with a soft background). These carry most of the "beautiful" impression — make them detailed and expressive.
- Optional: define `O.drawNPCAura = function (ctx, game, npc, bob) {}` to draw a divine aura behind gods (npc.x, npc.y, npc.w, npc.h are world coords; screen x = npc.x − game.cam, screen y = npc.y + O.VIEW_Y).

#### Enemies — owner: js/art/enemies.js
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

#### World — owner: js/art/world.js (tiles, decorations, props)
Override parts of `O.Tiles` (defined in js/tiles.js, keep its API): `O.Tiles.get(theme, ch, variant, extra)`, `O.Tiles.decor(type, seed) → {c: canvas, w, h}`, `O.Tiles.tuft(theme, v)`, `O.Tiles.theme(name)` (must keep a `.dirt` 3-colour array). **Better: implement `O.Tiles.getCtx(theme, ch, x, y, lvl) → canvas 16×16`** (autotiling with neighbour awareness via `lvl.tile(x,y)` / `lvl.isSolid(x,y)`) and set `O.Tiles.handlesEdges = true` to take over edges and grass tufts; optional `O.Tiles.overlay(lvl, backCtx, frontCtx)` runs after tiles are baked (extra details, drips, moss, grass overhangs).
Themes: `village` (sunny Arcadian village), `forest` (twilight/moonlit forest), `cave` (boar's den), `temple` (marble interiors of Zeus/Hermes).
Tile chars: G grass-topped earth (solid), D earth (solid), B stone/rock blocks (solid), P one-way platform (log in forest, marble slab elsewhere), X spikes (hazard), C/c/b column shaft/capital/base (background), E entablature with Greek key, M marble fill, < > pediment slopes, m interior wall, n dark doorway, H whitewashed wall, w window (with blue shutters), d door (blue; `extra`=true for the top piece), r terracotta roof, ( ) roof slope ends, k cave back-wall.
Decor types used by levels (bottom-centred on a tile unless anchor 'top'): olive, cypress, oak, bush, grass (front layer), flowers (front), amphora, rocks, fence, mushrooms, curtain (hangs from top), window (arched temple window), stalactite (hangs from top, front), crystals, pedestal. Also register sprite `statue` (marble statue of a Greek hero, ~34 px, anchor = feet; engine draws it on the pedestal).
Light props: define `O.drawLightProp(ctx, type, x, y, t, i)` for type `brazier` (bronze tripod standing on (x,y) = floor point, with animated fire), `torch` ((x,y) = wall mount point) and `crystal` (glow for a crystal cluster standing on (x,y)). Engine-side lighting (darkness, glow) is done by the sky/light module — you only draw the props and their flames.

#### Sky, lighting & atmosphere — owner: js/art/sky.js
- Override `O.Tiles.background(theme) → { sky: canvas 384×216, layers: [{ c: canvas (height 216, width ≥ 768, tiles horizontally), f: parallax factor 0..1, y: optional y offset }] }` for all 4 themes. Village: bright Mediterranean day with Mount Olympus (snow, golden temple on the summit), hills with cypresses/villages, soft clouds. Forest: twilight → moonlit night, big moon, layered tree silhouettes, mist. Cave: deep warm-dark cavern layers. Temple: night sky (mostly hidden by walls).
- `O.Light = { apply(ctx, game) }` — called every frame after the world and entities are drawn (before HUD). Implement per-theme ambient darkness + light sources (use `game.lvl.def.lights` items `{type, tx, row}` → world px (tx*16+8, row*16), screen = world − game.cam, y + O.VIEW_Y; also the player `game.player` and gods). Bloom/glow with additive blending is allowed, fog layers, god rays in temples, vignette, colour grading. Keep it pixel-friendly (quantize/dither the light edges) and cheap (pre-render gradients into cached canvases; 60 fps).
- Particle look (optional): `O.FXDraw(ctx, f, x, y, game)` for effects (`f.type` in puff, star, spark, dust, bit, text; `f.t` age) and `O.AmbDraw(ctx, p, x, y, game)` for ambient particles (`p.k` in leaf, fly, ember, drip; `p.t` age). Return `false` to fall back to the engine's default drawing.

#### UI — owner: js/ui.js
Define `O.UI = { drawHUD, drawDialog, drawPause, drawTitle, drawStory, drawGameOver, drawEnding, drawBanner, drawBossBar }` (each `(ctx, game[, extra])`). See js/render.js for what data each screen shows (the old versions are there as reference) and js/story.js / js/game.js for state (`game.st` hp/maxHp/olives/ambrosia/items, `game.dialog` {speaker, pages, page, chars, choice{options, sel}}, `game.state`, `game.sel`, `game.hasSave`, `game.t`, `game.page/chars/storyT` for story, `game.endT`, O.STORY, O.ENDING, O.questHint(st), O.ITEMS).
- Modern HUD overlaid on the game view (no black bar): life as a row of heart/laurel pips or a stylised bar, olives and ambrosia counters, item slots. Dialogue box with the speaker's **portrait** (`portrait_<kind>`; map speaker names ELDER→elder, MERCHANT→merchant, WOMAN→villager, ZEUS→zeus, HERMES→hermes; empty speaker = narration without portrait), name plate, typewriter text, choice cursor.
- Title screen: gorgeous key-art composition (use backgrounds from O.Tiles.background and character frames like hero_lyre_0, eurydice_idle_0), a beautiful logo "ORPHEUS" + subtitle "SONG OF OLYMPUS", menu NEW GAME / CONTINUE (CONTINUE greyed when !game.hasSave), "PRESS START" state when game.state === 'press'.
- Story scenes (5 pages: scenes orpheus, lovers, serpent, hades, oath) illustrated with the new sprites and backgrounds, text box with typewriter (`game.chars`).
- You may **override the font**: redefine `O.text(ctx, str, x, y, color, scale)` with a nicer bold pixel font (must support A–Z, 0–9 and . , ! ? ' - : / ( ) " > < + = * ^ and space; text is always upper-case). Keep glyphs ≤ 8 px wide so layouts fit (27 characters per dialogue line).
- Item/icon sprites (register them): `olive`, `ambrosia`, `pom` (pomegranate) — anchor bottom-centre, ~10–14 px; `heart`, `icon_club`, `icon_sandals`, `lyre`, `bolt`, `arrow_up`.

### File ownership (critical — agents run in parallel)
Only edit the files you own. Engine files (entities.js, game.js, render.js, levels.js, main.js, core.js, pix.js, sprites.js, tiles.js, index.html, story.js, audio.js, input.js) are owned by the lead — if you need an engine change, describe it in your final report instead of editing. Never break other modules: every edit must pass `node --check <file>`; runtime errors in your module are caught and logged, but test that your module logs **no errors**.

### How to see your work (MANDATORY — iterate visually)
Tools in `jogos/olympus/tools/` (run with node from that folder):
- `node preview.js <out.png> <prefix1,prefix2> [zoom=4] [bg=checker|sky|night|cave|marble]` — zoomed sheet of every registered sprite whose name starts with a prefix, red dot = anchor. Example: `node preview.js /tmp/.../art/hero_sheet.png hero_ 4 sky`.
- `node gameshot.js <out.png> <level> <tx> [row=11] [scale=3] [extraJS]` — real in-game screenshot. Levels: village, forest, den, zeus, hermes, plus special: title, story0..story4, pause, dialog, itemget, gameover, ending. `extraJS` runs inside the page with `g` = game (e.g. `"g.player.atk=10"` or `"g.enemies=[]"`).
Write your output images into that same art/ folder with your module prefix. Look at them with the Read tool (it shows images). Judge at zoom AND at 1x/3x in-game. Iterate until it genuinely looks like a polished modern indie game — compare against your mental reference of Celeste/Dead Cells/Blasphemous quality. At least 4 visual iterations are expected.

### Final report (your last message)
Return: what you built (list of registered names), the final preview image paths, known weaknesses, and any engine changes you need from the lead.


---

*Fim da memória do projeto. Ao terminar uma etapa importante, atualize este arquivo (histórico, estado, pendências) e faça commit e push.*
