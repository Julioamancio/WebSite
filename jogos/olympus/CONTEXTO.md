# Orpheus: Song of Olympus — contexto completo do projeto

Documento de continuidade: tudo o que é preciso para retomar o jogo em **outro computador** ou numa **nova sessão do Claude Code** (local ou na nuvem). Leia inteiro antes de mexer no jogo.

---

## 1. O que é o jogo

- **Gênero:** ação e aventura em side-scroll (estilo Zelda II / *The Battle of Olympus*, NES 1988), com pixel art moderna.
- **Regra de ouro:** ser **o máximo parecido sem ser plágio**. Mantemos gênero, estrutura e mecânicas (que não têm direito autoral), além do mito de Orfeu (domínio público). **Todo o código, os sprites, as músicas, os textos e o nome são originais.** Nunca copiar gráficos, músicas, nomes ou diálogos do jogo de 1988 (lá a amada se chama Helene; aqui é **Eurídice**, como no mito).
- **História:** Orfeu, jovem da Arcádia, perde a amada Eurídice (picada de serpente no dia do casamento). Hades aprisiona a alma dela no Tártaro. Orfeu jura resgatá-la e percorre a Grécia recebendo dádivas dos deuses.
- **Autor do projeto:** Júlio (professor de Inglês e Programação). Textos do jogo em **inglês** (uso didático); conversa com o Claude em **português do Brasil**.

## 2. Onde está

| O quê | Onde |
|---|---|
| Código | GitHub `julioamancio/website`, branch **`claude/keen-cray-3ygj2k`**, pasta `jogos/olympus/` |
| Jogar no navegador (versão publicada) | https://claude.ai/artifact/9HA44jnBVMPLmLF6HnbKYg (privado; compartilhar pelo menu *Share*) |
| Jogar localmente | abrir `jogos/olympus/index.html` direto no navegador (não precisa de servidor) |
| Link no site | `portfolio.html` → card "Orpheus: Song of Olympus" |

### Baixar para o computador
```bash
git clone https://github.com/julioamancio/website.git
cd website
git checkout claude/keen-cray-3ygj2k
# jogar: abra jogos/olympus/index.html no navegador
```

## 3. Estado atual (Parte 1 — Arcádia: COMPLETA e jogável)

Fluxo completo testado: abertura (5 cenas) → vilarejo (Ancião entrega o **porrete**) → Templo de Zeus (**bênção**: +4 de vida máxima, salva o jogo) → Floresta da Arcádia (cobras, morcegos, sátiros, buracos, espinhos) → Covil do **Javali de Erimanto** (chefe) → Santuário de Hermes (**Sandálias de Hermes**, pulo alto) → tela "End of Part 1".

### Histórico visual
1. **v1 NES** (256×240, sprites 16×24) — o Júlio achou feio.
2. **v2 NES caprichado** (sprites 16×32 com sombreamento) — "ficou realmente muito ruim".
3. **v3 pixel art moderna (atual)** — 384×216 widescreen, 6 módulos de arte feitos por agentes especializados + crítico independente. Notas do crítico: 6–6,5/10. Muito melhor, mas ainda não "comercial".

### Pendências conhecidas
- **DECISÃO DO JÚLIO: todos os personagens serão refeitos no AutoSprite** (seção 6). O Júlio acha os personagens atuais feios. A correção de proporção do Orfeu procedural foi **cancelada** — não gastar tempo melhorando `js/art/hero.js`, `npcs.js` ou `enemies.js`; eles ficam só como reserva até os sprites do AutoSprite entrarem.
- Para referência: o Orfeu procedural atual é "chibi" (cabeça 12 px de 37 px de altura, pernas curtas). Os sprites do AutoSprite devem ter proporção adulta (~1:4 ou mais), ~38–41 px de altura na tela.
- Cenários: o Júlio quer gerar no **Google Flow** → prompts prontos em `docs/PROMPTS_FLOW_CENARIOS.md` (seção 7).
- Caverna um pouco escura demais.
- Espinhos da floresta têm crânios e poças de sangue — trocar por algo mais leve se o público for infantil.
- Site principal: `index.html` e `README.md` da raiz têm restos de conflito de merge (linhas com nomes de branch e `=======`).

## 4. Controles e regras de jogo

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

## 5. Arquitetura técnica

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

### Contrato de quadros (o motor procura estes nomes)
- **Orfeu:** `hero_idle_0..3`, `hero_blink`, `hero_run_0..7`, `hero_jump`, `hero_peak`, `hero_fall`, `hero_land`, `hero_crouch`, `hero_atk_0..4`, `hero_catk_0..4`, `hero_jatk_0..4`, `hero_hurt`, `hero_dead_0`, `hero_dead_1`, `hero_hold`, `hero_lyre_0..1`.
- **NPCs:** `<tipo>_idle_0..3` e `<tipo>_blink` para elder, merchant, villager, eurydice, zeus, hermes, hades; `eurydice_ghost_0..3`; retratos `portrait_<tipo>` (inclui `portrait_orpheus`).
- **Inimigos:** `snake_move_0..3`, `snake_lunge_0..1`, `bat_hang`, `bat_fly_0..3` (âncora no **centro** do corpo), `satyr_idle_0..1`, `satyr_walk_0..5`, `satyr_jump`, `boar_idle_0..3`, `boar_paw_0..3`, `boar_run_0..5`, `boar_stun_0..3`, `rock`.
- **Itens/ícones:** `olive`, `ambrosia`, `pom`, `heart`, `icon_club`, `icon_sandals`, `lyre`, `bolt`, `arrow_up`, `statue`.
- **Âncora:** `(ax, ay)` = ponto dos pés (centro da base); tudo desenhado **virado para a DIREITA** (o motor espelha). Mesmo `ax` em todos os quadros de um personagem (senão ele "treme").

## 6. Personagens no AutoSprite (plano)

O AutoSprite tem servidor MCP oficial: `https://www.autosprite.io/api/mcp`, autenticação `Authorization: Bearer <chave>`. **API/MCP exige o plano Pro (US$ 29/mês).**

### Configurar no computador local
1. **Segurança:** a chave que foi colada no chat da sessão na nuvem ficou exposta — **revogue-a no AutoSprite e crie uma nova**. Nunca cole chaves no chat nem no repositório.
2. Crie a variável de ambiente com a chave nova:
   - Windows (PowerShell): `setx AUTOSPRITE_API_KEY "sua_chave_nova"` (feche e reabra o terminal)
   - macOS/Linux: adicione `export AUTOSPRITE_API_KEY="sua_chave_nova"` no `~/.zshrc` ou `~/.bashrc`
3. O arquivo **`.mcp.json` na raiz do repositório já configura o servidor** lendo essa variável. Ao abrir `claude` na pasta do repositório, aprove o servidor `autosprite` quando perguntado. (Alternativa manual: `claude mcp add autosprite https://www.autosprite.io/api/mcp -t http --header "Authorization: Bearer $AUTOSPRITE_API_KEY"`.)
4. Confira com `/mcp` dentro do Claude Code.

### Como integrar os sprites gerados
- Criar cada personagem no AutoSprite (Orfeu, Eurídice, Ancião, Mercadora, Moradora, Zeus, Hermes, Hades, Sátiro, Cobra, Morcego, Javali) com as animações do contrato (seção 5). Exportar **PNG transparente + JSON do atlas**.
- Salvar em `jogos/olympus/assets/sprites/<personagem>.png` + `.json`.
- Criar um carregador (ex.: `js/art/autosprite.js`) que: carrega as imagens **antes** de `O.bootArt()` (hoje o boot é síncrono — é preciso esperar o `onload` das imagens em `main.js` antes de criar `O.Game`), fatia pelo JSON e chama `O.registerSprite('hero_run_0', canvas, {ax, ay})` com os nomes do contrato; se um quadro faltar, o sprite atual (procedural) continua como reserva.
- Escala: Orfeu com ~38–41 px de altura na tela de 384×216 (reduzir com vizinho mais próximo). Hitboxes não mudam.
- Observação: por `file://` o navegador pode bloquear leitura de pixels de PNG externos (canvas "tainted"). Para desenhar basta `drawImage` (funciona); se precisar de `getImageData`, rode um servidor local simples (`npx serve jogos/olympus`) ou embuta as imagens como data URI.

### Mensagem pronta para colar no Claude Code local
```
Leia jogos/olympus/CONTEXTO.md e jogos/olympus/docs/ART_SPEC.md. Use o MCP do AutoSprite para criar
TODOS os personagens do jogo (Orfeu, Eurídice, Ancião, Mercadora, Moradora, Zeus, Hermes, Hades,
Sátiro, Cobra, Morcego e o Javali de Erimanto), em pixel art moderna, estilo Grécia antiga, virados
para a direita, com as animações do contrato de quadros da seção 5. Comece só pelo Orfeu e me mostre
o resultado antes de fazer os outros. Depois baixe as spritesheets para jogos/olympus/assets/sprites/,
crie o carregador js/art/autosprite.js que registra os quadros com os nomes do contrato, rode
tools/regressao.js e me mostre capturas do jogo.
```

## 7. Cenários no Google Flow (plano)

- Prompts prontos: `docs/PROMPTS_FLOW_CENARIOS.md` (16 imagens: título, vila em 4 camadas, templo de Zeus, floresta em 4 camadas, caverna, santuário de Hermes, submundo, 3 cenas da história).
- Salvar em `jogos/olympus/assets/cenarios/` com os nomes indicados.
- Integração: camadas com fundo **magenta #FF00FF** → remover o magenta (chroma key), reduzir para 384×216 (ou 768 de largura para camadas que rolam), quantizar a paleta, e usar em `O.Tiles.background(tema)` (`js/art/sky.js`) como `{ sky, layers: [{ c, f }] }` (f = fator de parallax: céu 0, longe ~0,08, meio ~0,25, perto ~0,5). Interiores (templos/caverna) substituem a parede de fundo (tiles `m`/`k` passam a ficar transparentes quando houver imagem).

## 8. Ferramentas de teste (`jogos/olympus/tools/`)

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

## 9. Próximos passos sugeridos (em ordem)
1. **AutoSprite:** configurar o MCP no computador local e gerar/integrar TODOS os personagens (seção 6) — prioridade.
2. **Flow:** gerar e integrar os cenários (seção 7).
3. Ajustes: caverna mais clara; decidir sobre crânios/sangue dos espinhos.
4. **Parte 2 — Ática:** templo de Atena (nova arma/escudo), novos inimigos (ex.: lobos, harpias), novo chefe mitológico, novas músicas. Manter o mesmo contrato de arte e os mesmos ganchos.
5. Limpar os restos de conflito de merge do `index.html`/`README.md` do site.
6. Atualizar o link publicado (Artifact) depois de cada mudança.

## 10. Preferências do Júlio (seguir sempre)
- Responder em **português do Brasil**, claro, direto e organizado; prompts/falas do jogo em **inglês**.
- Entregar código **completo e funcional**, dizendo arquivos e locais exatos; analisar o que já existe antes de criar coisas novas.
- Em projetos grandes, trabalhar **por etapas**; quando ele pedir "parte por parte", entregar só a etapa pedida.
- Prompts para Flow/imagens: detalhados, prontos para copiar, com **restrições negativas**, consistência visual e separação clara entre elementos.
- **Não concordar automaticamente:** apontar erros, riscos e limitações; não afirmar que algo foi feito sem verificar.
- Nunca pedir nem gravar chaves/senhas no chat ou no repositório.
