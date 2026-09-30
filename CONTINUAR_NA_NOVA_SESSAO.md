# CONTINUAR NA NOVA SESSÃO — Orpheus: AutoSprite, clipes e bases

> **Para o Júlio:** feche o app do Claude inteiro (inclusive o ícone perto do relógio), abra de novo, crie uma sessão na pasta `C:\Users\julio\Documents\website`, aprove o servidor **autosprite** quando pedir e mande:
> **"Leia CONTINUAR_NA_NOVA_SESSAO.md inteiro e execute na ordem."**
>
> **Para o Claude da nova sessão:** este arquivo é o ponto de partida. Converse em português do Brasil; textos do jogo e prompts em inglês. O arquivo mestre do projeto é `ORPHEUS_MEMORIA_COMPLETA.md` (leia as seções 0, 6 e 7 também). Escrito em 29/09/2026.

---

## 1. Primeiro passo: confirmar que o AutoSprite conectou

### 1.1 Como o MCP está configurado (já está no repo, não precisa mexer)
Arquivo `.mcp.json` na raiz do repo:
```json
{
  "mcpServers": {
    "autosprite": {
      "type": "http",
      "url": "https://www.autosprite.io/api/mcp",
      "headers": {
        "Authorization": "Bearer ${AUTOSPRITE_API_KEY}"
      }
    }
  }
}
```
- A chave vem da variável de ambiente do Windows **`AUTOSPRITE_API_KEY`**, que o Júlio gravou com `setx` em 29/09/2026.
- **A chave NUNCA vai para arquivo, commit ou chat.** Este repo vai para o GitHub. Não use `claude mcp add` com a chave (grava em texto puro no `~/.claude.json`).
- Por que a sessão antiga não conseguia: um servidor MCP só carrega **quando a sessão nasce**, e o app precisa ter sido aberto **depois** do `setx` para enxergar a variável. A sessão de 29/09 nasceu na pasta Downloads, antes do `setx`.

### 1.2 Checagem (a nova sessão faz)
1. `ToolSearch` com `autosprite` → devem aparecer ferramentas `mcp__autosprite__...` (criar/subir personagem, gerar spritesheet, listar jobs...).
2. Se não aparecerem: `session_connectors_status` (ferramenta `mcp__ccd_connectors__session_connectors_status`).
   - `autosprite` ausente → a sessão não foi aberta na pasta do repo, ou o servidor não foi aprovado. Peça ao Júlio para abrir a sessão em `Documents\website` e aprovar.
   - `autosprite` com `failed`/401 → o app não foi reiniciado depois do `setx`. Peça para fechar e abrir o app de novo. Para conferir sem mostrar a chave: `[Environment]::GetEnvironmentVariable('AUTOSPRITE_API_KEY','User')` só deve dizer se existe (nunca imprima o valor).
3. `git pull` na branch **`claude/keen-cray-3ygj2k`** (repo `julioamancio/website`, que o GitHub diz ter mudado para `Julioamancio/WebSite`; o push redireciona).
4. Git neste PC não tem nome/e-mail configurado: commitar com `git -c user.name="Claude" -c user.email="noreply@anthropic.com" commit ...` (é o autor de todos os commits da branch). Terminar a mensagem com `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

---

## 2. Tarefa 1 — Animações no AutoSprite (AUTORIZADO pelo Júlio)

O Júlio pediu: *"vai para o AutoSprite fazer as versões de animação que precisa de cada personagem"* e *"acrescenta a animação de falar"*. Isso cobre o plano inteiro abaixo (22 animações, ~110 créditos).

**Ordem de execução:**
1. `upload_character` dos 8 PNGs (grátis) — ver 2.1. Não recriar personagem por prompt.
2. **Teste:** só o **idle do Orfeu** (~5 créditos). Reextrair no máximo, montar uma folha de conferência e **mostrar a imagem ao Júlio**.
3. Se o teste estiver bom (perfil de verdade, mesmo tamanho em todos os quadros, porrete na mão, sem segundo personagem), **gerar o resto do plano sem perguntar de novo**. Se não estiver, corrigir o prompt e refazer só o teste.
4. Salvar cada folha em `jogos/olympus/assets/sprites/<nome>_<animação>.png` + JSON do atlas.
5. Atualizar este arquivo (marcar o que foi feito), `ORPHEUS_MEMORIA_COMPLETA.md` (histórico) e fazer commit + push.

**Lições pagas no Valmora (outro jogo do Júlio, mesma conta AutoSprite):**
- `generate_spritesheet` custa **~5 créditos por animação**. `regenerate_single_spritesheet`/`regenerate_spritesheet` custa **0** (só recorta de novo o vídeo que já existe: serve para qualidade, não para mudar o movimento). `pad_character` custa 1 (arma cortada na borda). `first_frame_quality: "pro"` custa +3.
- **Sempre reextrair no máximo depois de gerar:** `frameSize: 0`, `maxFrames: 0`, `compression: "none"`. Sem isso a folha sai borrada.
- Travas obrigatórias no prompt (cada uma nasceu de um erro pago): personagem único, corpo inteiro, câmera parada e plana, mesmo tamanho em todos os quadros.
- Animações `custom` às vezes **começam com ~10 quadros de outra pose**: cortar antes de montar.
- Pedir `BLINKS ONCE in the middle of the clip` quando quiser piscada; senão, `eyes open, no blinking`.
- A resposta do `generate_spritesheet` **pode vir trocada** se dois pedidos rodam juntos: conferir em `list_jobs` antes de reenviar; baixar pelo `sourceVideoId`.
- `list_spritesheets` aceita `limit` no máximo 50. A API cai às vezes (timeout): tentar de novo antes de concluir que falhou.
- Diferença do Valmora: **aqui o motor NÃO desenha a arma** — o porrete do Orfeu tem que estar no sprite. E aqui é tudo de perfil (side-scroller): nada de direções isométricas.
- Antes de qualquer chamada que gasta crédito: reler o prompt procurando (1) o que o jogo desenha por cima, (2) as travas, (3) se dá para validar com uma geração só.

### 2.1 As 8 bases (prontas, sem fundo, de perfil, olhando para a direita)
`jogos/olympus/assets/personagens/`: `orpheus.png`, `eurydice.png`, `elder.png`, `merchant.png`, `villager.png`, `zeus.png`, `hermes.png`, `hades.png` (o JPG original do Flow, com magenta, fica ao lado).
Faltam as bases da **Rainha do Submundo** (`queen`) e do **Javali** (`boar`): o Júlio gera no Flow (tarefa 4). Quando chegarem, entram no AutoSprite também (o javali precisa das animações da seção 6.2 do mestre: idle, paw, run, stun).

### 2.2 O plano completo (cópia de `jogos/olympus/docs/PLANO_AUTOSPRITE.md`)

### Plano do AutoSprite — animações dos personagens

Escrito em 29/09/2026. O Júlio autorizou gerar "as versões de animação que precisa de cada personagem".
Regra da casa (erros já pagos no Valmora): **primeiro UMA animação de teste (idle do Orfeu), mostrar ao Júlio, e só então o resto.**

#### Entrada
- As 8 bases já estão prontas, sem fundo (PNG transparente), em `jogos/olympus/assets/personagens/`:
  `orpheus.png`, `eurydice.png`, `elder.png`, `merchant.png`, `villager.png`, `zeus.png`, `hermes.png`, `hades.png`.
  Todas de perfil, olhando para a DIREITA, corpo inteiro, estilo 2.5D. O original do Flow (JPG com magenta) fica ao lado.
- Subir cada uma com `upload_character` — **grátis** e mantém o mesmo personagem. Não recriar por prompt.

#### Custos (tabela anotada no Valmora)
- `generate_spritesheet`: **~5 créditos por animação**. `regenerate_*`: 0 (só recorta o vídeo que já existe).
- Depois de gerar, **sempre reextrair no máximo**: `frameSize: 0`, `maxFrames: 0`, `compression: "none"` (senão a folha sai borrada).
- A resposta pode vir trocada quando dois pedidos rodam juntos: conferir em `list_jobs` antes de reenviar.
- Estimativa deste plano: 8 animações do Orfeu + 7 idles + 7 de falar = **22 animações ≈ 110 créditos** (mais refações).

#### Travas em TODO prompt de animação (colar no início)
```
ONE single character only, alone in the frame, nobody else. Strict side view, facing RIGHT in every frame, never turning toward the camera. Same character, same clothes, same colors, same size and same head size in every frame; feet on the same ground line except while airborne. Whole body inside the frame, nothing cropped. Camera flat and still: no perspective, no zoom, no camera movement, no background.
```
Só no Orfeu, acrescentar (o motor NÃO desenha a arma: o porrete faz parte do sprite):
```
He holds the same wooden club in his right hand in every frame; nothing else is held; no motion trail, no slash effect, no particles.
```

#### Orfeu — 8 animações
| # | Animação | Prompt (depois das travas) | Quadros → nomes no motor |
|---|---|---|---|
| 1 | idle (TESTE) | Breathing idle: stands relaxed, chest rising and falling gently, cape and headband tails swaying slightly. Eye open; he BLINKS ONCE in the middle of the clip. | 4 → `hero_idle_0..3` + 1 com olho fechado → `hero_blink` |
| 2 | corrida | Running in place toward the right (treadmill run, he does not leave the frame): a full energetic run cycle, arms pumping, the club swinging with the right arm, cape flowing behind. | 8 → `hero_run_0..7` |
| 3 | pulo | A full jump in place: bends the knees to take off, rises with knees tucked, reaches the top, falls with legs reaching down, lands with a small squash. | `hero_jump` (subindo), `hero_peak` (topo), `hero_fall` (caindo), `hero_land` (aterrissando) |
| 4 | golpe em pé | Standing club attack: brief anticipation, winds the club back over his shoulder, strikes forward and down in front of him at chest-to-waist height, follow-through, returns to the idle pose. | 5 → `hero_atk_0..4` (o golpe acerta no quadro 2) |
| 5 | agachar + golpe baixo | Crouches low (knees bent, body lowered to about two thirds of his height), then from the crouch swings the club forward low along the ground, and stays crouched. | 1º quadro agachado → `hero_crouch`; 5 → `hero_catk_0..4` (é o golpe que mata a cobra) |
| 6 | golpe no ar | Already in the air with legs tucked, swings the club forward in a wide arc in front of him, then lands. | 5 → `hero_jatk_0..4` |
| 7 | dano + morte | Gets hit from the front: recoils backward, then collapses to his knees and falls onto his back, lying still. | `hero_hurt`, `hero_dead_0` (caindo), `hero_dead_1` (deitado) |
| 8 | erguer item | Raises his left arm high above his head, open palm up, as if lifting a small treasure to the sky, proud; keeps the club in his right hand down at his side; holds the pose. | 1 → `hero_hold` (o motor desenha o item ~8 px acima da cabeça) |
| — | lira (depois) | Precisa de uma lira que a base não tem; fica para depois (só a tela de título usa). | `hero_lyre_0..1` |

#### NPCs e deuses — 1 idle cada (7 animações)
Todos: `<nome>_idle_0..3` (4 quadros) + um quadro com olho fechado → `<nome>_blink`.
| Personagem | Prompt (depois das travas) |
|---|---|
| eurydice | Calm breathing idle, long golden hair and white dress swaying gently, hands together in front of her waist. BLINKS ONCE in the middle of the clip. |
| elder | Calm breathing idle of an old man leaning on his tall wooden staff, the staff stays planted on the ground in his right hand, beard moving slightly. BLINKS ONCE in the middle of the clip. |
| merchant | Calm breathing idle, holding the clay jar of golden ambrosia with both hands in front of her chest in every frame, friendly small head nod. BLINKS ONCE in the middle of the clip. |
| villager | Calm breathing idle, holding the basket of apples in the crook of her right arm in every frame, slight cheerful sway. BLINKS ONCE in the middle of the clip. |
| zeus | Majestic breathing idle, the lightning bolt stays raised in his right hand in every frame and crackles slightly, robes and beard stir gently. BLINKS ONCE in the middle of the clip. |
| hermes | Light, bouncy idle on his toes, the small wings on his hat and sandals flutter, the golden staff stays in his right hand in every frame. BLINKS ONCE in the middle of the clip. |
| hades | Cold, still idle, the dark robes and cloak stir slightly as if in a cold wind, the tall staff stays planted in his right hand in every frame. BLINKS ONCE in the middle of the clip. |

#### NPCs e deuses — animação de FALAR (7 animações, pedido do Júlio em 29/09)
Toca enquanto a caixa de diálogo do NPC está aberta (o motor precisa trocar `idle` por `talk` durante o diálogo — fazer na integração).
Todos: `<nome>_talk_0..5` (6 quadros, em loop). Travas de sempre + no fim: `Mouth moving as if talking, clear lip movement, no sound effects drawn, no speech bubble, no text.`
| Personagem | Prompt (depois das travas) |
|---|---|
| eurydice | Talking gently to someone in front of her, soft smile, one hand rising a little from her waist as she speaks, then returning. |
| elder | Talking wisely and slowly, nodding, his free hand gesturing forward as he explains, the staff stays planted in his right hand in every frame. |
| merchant | Talking cheerfully like a market seller, lifting the clay jar of ambrosia a little to show it, then lowering it; the jar stays in her hands in every frame. |
| villager | Chatting with a friendly smile, tilting her head, the basket stays in the crook of her right arm in every frame. |
| zeus | Speaking with authority, chin raised, his free hand opening in a commanding gesture, the lightning bolt stays raised in his right hand in every frame. |
| hermes | Speaking quickly and playfully, grinning, bouncing lightly on his toes, pointing forward with his free hand, the staff stays in his right hand in every frame. |
| hades | Speaking coldly and slowly, narrowing his eyes, his free hand closing into a fist, the staff stays planted in his right hand in every frame. |

- O fantasma da Eurídice (`eurydice_ghost_0..3`) sai do idle dela **por código** (tom ciano claro e transparência) — não gastar crédito.
- Inimigos (cobra, morcego, sátiro, javali) ainda não têm base: fazer os prompts do Flow deles depois.

#### Saída
- Salvar cada folha em `jogos/olympus/assets/sprites/<nome>_<animação>.png` + o JSON do atlas.
- Âncora: `ax` = centro do corpo (igual em todos os quadros do personagem), `ay` = linha logo abaixo da sola. Tudo virado para a direita (o motor espelha).
- Integrar no jogo só depois do motor em HD (passo 0 da seção 11 do `ORPHEUS_MEMORIA_COMPLETA.md`).

---

## 3. Tarefa 2 — Clipes das cutscenes (Flow/Veo)

- História e storyboard **aprovados pelo Júlio** em 29/09: `jogos/olympus/docs/CUTSCENES.md` (página https://claude.ai/artifact/SKtiuantjcQfUvb8dEodVc). Fonte: `jogos/olympus/tools/cutscenes.js` (conceito, saga das 7 cordas, **fichas fixas dos personagens**, 10 cutscenes, 17 cenas de 8 s).
- Os prompts de cada cena estavam sendo escritos por agentes na sessão antiga. **Se `jogos/olympus/tools/cutscenes_prompts.json` existir**: rode `node jogos/olympus/tools/cutscenes.js` → gera `docs/prompts_clipes.html` e `docs/PROMPTS_FLOW_CLIPES.md`; publique `docs/prompts_clipes.html` como Artifact com `capabilities: {db: {}}` (título "Clipes do Orpheus"), ponha o link em `CLIPS_URL` no `cutscenes.js`, rode de novo e mande o link ao Júlio.
- **Se não existir**, escreva o `cutscenes_prompts.json` você mesmo: um objeto `{ "01": {...}, ..., "17": {...} }`, cada cena com `setting, action, camera, lighting, music, sfx, ambient, voice, extra_negative` em inglês. O `cutscenes.js` já monta o resto (estilo fixo, fichas coladas na íntegra, negativos). Regras:
  1. Personagens só pelo rótulo da ficha em maiúsculas: ORPHEUS, EURYDICE, EURYDICE'S SOUL, THE VILLAGE ELDER, ZEUS, THE MESSENGER GOD, THE KING OF THE UNDERWORLD, THE QUEEN OF THE UNDERWORLD, THE GIANT BOAR. **Nunca** escrever Hades, Hermes, Persephone, Hercules, Pegasus (o Flow recusou "Hades" e "Hermes"). O rei não tem cabelo de fogo nem pele cinza/azul (vilão de filme famoso).
  2. `setting` começa com o estado final da cena anterior (posição, objetos, hora do dia).
  3. Um acontecimento principal por clipe de 8 s; no máximo 3 personagens; nada de sangue (a morte da Eurídice é ela afundando devagar nas flores).
  4. Estado dos objetos: cenas 01-04 lira dourada de 7 cordas; 05 ele larga a lira; 06 a lira na grama; 07 o Rei pega a lira e as cordas voam como estrelas cadentes; 08 moldura vazia na mão; 09 moldura vazia nas costas, sem porrete; 10-12 porrete na mão e moldura nas costas; 12 a corda sai da presa e vai para a mão dele; 13 ele prende a corda (lira com UMA corda), porrete no chão ao lado; 14 porrete abaixado, lira de uma corda nas costas, o deus mensageiro oferece sandálias aladas douradas; 15 ele usa as sandálias aladas; 16 a poça mostra o Orfeu correndo; 17 a alma da Eurídice sozinha.
  5. Horário: 01-02 fim de tarde dourado; 03 tarde de primavera; 04-05 entardecer; 06-08 noite; 09 amanhecer; 10 templo à noite; 11-12 caverna com tochas; 13 floresta à noite; 14-15 dia claro; 16-17 Submundo.
  6. Áudio: **ninguém fala e não há narrador** (o texto em inglês aparece na caixa do jogo). `voice` = "none", exceto na cena 17 (a alma cantarola sem palavras). Música, efeitos e ambiente separados. Nada de texto na tela.
- Depois que o Júlio gerar os clipes: ele baixa, marca **Pronto** na página, e você importa com `node jogos/olympus/tools/importar_flow.js --marks <arquivo.json> --dir cutscenes` (aceita `.mp4`). Se ele marcar tudo de uma vez depois de baixar tudo, a regra de horário não funciona: identifique cada arquivo pelo conteúdo e passe `origem` explícita.

---

## 4. Tarefa 3 — Bases da Rainha e do Javali (o Júlio gera no Flow)
- Estão na página **Personagens do Orpheus**: https://claude.ai/artifact/4HLTmWg8VocQqpeeMMQPNd (cartões **09 Rainha do Submundo**, 9:16, e **10 Javali gigante**, 16:9). Fonte: `jogos/olympus/tools/prompts_personagens.js`.
- Quando ele disser que baixou: ler a coleção `prontos` da página com `ArtifactData` (`list`), importar com `importar_flow.js --dir personagens`, tirar o magenta com `python jogos/olympus/tools/tirar_magenta.py --batch <in> <out> ... --check <folha.png>`, olhar a folha de conferência, gravar o status do cartão (`no_projeto` ou `refazer` + `nota`) e subir no AutoSprite.

---

## 5. Onde está tudo

| O quê | Onde |
|---|---|
| Arquivo mestre | `ORPHEUS_MEMORIA_COMPLETA.md` |
| Cenários (20 de 21; falta o céu da vila, 03) | `jogos/olympus/assets/cenarios/` · página https://claude.ai/artifact/XrdJBjQUYghg8jiKqWtXgm |
| Personagens (8 bases prontas) | `jogos/olympus/assets/personagens/` · página https://claude.ai/artifact/4HLTmWg8VocQqpeeMMQPNd |
| História e storyboard | `jogos/olympus/docs/CUTSCENES.md` · página https://claude.ai/artifact/SKtiuantjcQfUvb8dEodVc |
| Plano do AutoSprite | `jogos/olympus/docs/PLANO_AUTOSPRITE.md` |
| Geradores de página/prompts | `jogos/olympus/tools/prompts_flow.js` (cenários + template), `prompts_personagens.js`, `cutscenes.js` |
| Importar de Downloads | `jogos/olympus/tools/importar_flow.js` (regra: imagem mais nova antes da marcação; ou `origem` explícita) |
| Tirar magenta | `jogos/olympus/tools/tirar_magenta.py` (o Flow pinta fundo rosa com degradê; a chave é a força do matiz magenta medida na borda) |
| Testes do jogo | `cd jogos/olympus/tools && npm install && npx playwright install chromium && node regressao.js` |

As páginas marcam **Pronto** num banco do Artifact (coleção `prontos`, id = número do cartão, `{file, status, marcadoEm, nota, origem}`; status `aguardando` → `no_projeto` ou `refazer`). Leia e escreva com a ferramenta `ArtifactData` (escrita em documento existente exige `if_version`).

## 6. O que vem depois (nesta ordem)
1. **Motor em HD** (passo 0 da seção 11 do mestre): hoje o jogo é 384×216 com vizinho mais próximo, feito para pixel art. Desenhar em 1920×1080 (escala 5 sobre as mesmas unidades; física, hitboxes e fases não mudam), suavização ligada, HUD e fonte nítidos. Sem isso a arte 2.5D vira borrão.
2. Integrar cenários, sprites do AutoSprite (carregador `js/art/autosprite.js`, seção 7.5 do mestre; trocar `idle` por `talk` durante o diálogo) e os clipes (tocar `<video>` com a caixa de texto em inglês por cima).
3. Ideias de jogo aprovadas junto com a história: contador de 7 cordas no HUD; região sem cor até a corda voltar; javali vira filhote e foge; última fase "não olhe para trás".
4. Pendências: céu da vila (03) em 16:9 sem referência; a lira do Orfeu (base + animação `hero_lyre`); bases dos inimigos (cobra, morcego, sátiro).

## 7. Preferências do Júlio (seguir sempre)
- **Estilo 2.5D bonito** (3D estilizado, luz suave, filme de animação). **Nada de pixel art** retrô.
- Prompts de imagem/vídeo em inglês, **cada um completo sozinho**, entregues numa página com botão **Copiar** em cada um (e marcação de Pronto).
- Pronto na página = a imagem/o clipe **já está em Downloads**: você busca, importa e marca.
- Crédito é dinheiro dele: teste com uma geração antes de lote de um tipo novo; conferir travas antes de mandar gerar.
- Windows + PowerShell; nunca rodar comandos em `C:\WINDOWS\System32`.
- Não concordar automaticamente; apontar riscos; nunca dizer que fez sem verificar.


---

## ESTADO EM 30/09/2026 (madrugada) — beta publicada

- **Jogo no ar (beta 2.5D): https://orpheus.destruitor.com.br** (teste só do Orfeu: /teste.html). Detalhes na linha 11 da seção 2 do ORPHEUS_MEMORIA_COMPLETA.md.
- Tarefa 1 (AutoSprite): **FEITA**, e ampliada — Orfeu completo, idle + falar dos 7 NPCs, inimigos (cobra, morcego, sátiro, javali) e 4 animações com a lira. Sem o MCP carregado, o cliente em `jogos/olympus/tools/autosprite/lib.mjs` fala com a API lendo AUTOSPRITE_API_KEY do ambiente.
- Tarefa 2 (clipes do Flow): o Flow parou; as cutscenes foram feitas **no próprio motor** (`js/cutscene.js`). A página dos 17 prompts continua pronta: https://claude.ai/artifact/9N1dVQMPKwPWXMLcMAv2Bk — se um dia os clipes vierem, podem substituir as cenas.
- Tarefa 3 (Rainha e Javali no Flow): o javali foi criado direto no AutoSprite; a Rainha ainda não tem base (na cutscene final ela só aparece no texto).
- Publicar de novo: `python jogos/olympus/tools/empacotar.py <versao> <saida.tgz>` e seguir o roteiro da memória `orpheus-vps` (upload por HTTP; SSH desta rede trava acima de ~20 KB).
- Pendências conhecidas da beta: HUD e fonte da caixa de diálogo ainda são pixel; céu da vila é um degradê (falta o cenário 03); a Rainha não tem sprite; botões de toque um pouco em cima da arte no celular.

## PARADA EM 30/09/2026 (Júlio desligou o PC) — commit 629c234, NÃO publicado

- Feito localmente: `js/hdui.js` (HUD, diálogo, banner, barra do chefe, status, game over e ícones em HD; fontes Cinzel/Marcellus) e a correção do glitch dos NPCs (a piscada antiga, pixelada, aparecia no meio da animação; `hd.js` agora troca qualquer quadro pixel que sobrar pelo HD).
- Falta antes de publicar: (1) o banner com o nome da área e o título "GAME OVER" não apareceram nas capturas do Playwright (no navegador do app o GAME OVER desenha; investigar com `tools/gameshot.js`); (2) rodar `node regressao.js` e `node fps.js`; (3) empacotar e publicar (memória `orpheus-vps`).
- O site no ar ainda é a beta 5c1f9c7 (com o glitch da piscada dos NPCs).
## 30/09/2026 (tarde) — RESOLVIDO e publicado (commit 27f4575, pacote b20260930c)

- Interface em HD no ar; glitch da piscada dos NPCs corrigido e conferido (400 quadros simulados sem nenhum quadro pixelado).
- O "banner/GAME OVER sumido" era: (a) captura cedo demais no Chromium sem GPU (usar `g.update=function(){this.t++}` no gameshot para congelar); (b) defeito real no game over, que reiniciava a animação quando o jogo pulava mais de 2 passos entre desenhos (aparelho lento) — corrigido.
- Desempenho: filtro de canvas a cada quadro custava ~10 fps; ícones cinza agora são calculados uma vez. `tools/fps_partes.js` mede o custo de cada parte. Resultado: 60 fps em todas as fases.
- Pendências menores: céu da vila (cenário 03), sprite da Rainha, botões de toque sobre a arte no celular.
## 30/09/2026 (fim da tarde) — publicado b20260930d (commit c7eeaab+)

- Celular: controles em colunas fora da arte; botões ⚔ (troca de arma), START e ⛶ (tela cheia) numa faixa embaixo.
- Título: NEW GAME / CONTINUE / OPTIONS / HOW TO PLAY. Pausa: RESUME / OPTIONS / HOW TO PLAY. OPTIONS: música, efeitos, tela cheia (js/settings.js, salvo no navegador). HOW TO PLAY aparece sozinho na 1ª partida.
- Armas: tabela O.WEAPONS em js/entities.js (punhos desde o início, clava do Ancião; C/Q/Y troca). Arma nova = 1 linha + folhas com prefixo próprio (ex.: 'hero_s_' para espada). O AutoSprite desenha a arma no personagem: cada arma precisa do próprio conjunto (~6 animações).
- Inimigos atacam com aviso: sátiro (clava, 2), cobra (enrola e dá o bote, 2), javali (investida curta de presas, 3). Cobra maior, morcego menor.
- Lições do AutoSprite: tipo "attack" inventou um escudo no Orfeu sem arma (usar "custom" + "NO shield"); duas vezes um job "succeeded" sem vídeo ("Video has no URL") — tem que pedir de novo; erros 502 passageiros — `tools/autosprite/insistir.mjs` tenta a cada 3 min.
- Créditos AutoSprite restantes: ~482.
- Testes: `node regressao.js` (local) e `node regressao_online.js` (site publicado) cobrem soco, alcance, troca de arma e golpes dos inimigos.

## 30/09/2026 (noite) — publicado b20260930f (commit 1bb1b12)
- Soco baixo e dano/morte SEM arma refeitos no AutoSprite (orpheus_p_lowpunch2, orpheus_p_hurt; montagem tools/autosprite/escolhas_soco6.json). Player.wf() escolhe o quadro pela arma; a tela de morte usa o mesmo mapeamento.
- Sátiro não cai mais no buraco: safeJump simula o arco do pulo, groundAhead olha o chão, empurrão só desliza com chão. Testes satyrGap/satyrWideGap/satyrKnockEdge + tools/estresse_satiro.js.
- Regressão local e online verdes, 60 fps em todas as fases.
- PENDENTE: prompts de áudio entregues em https://claude.ai/artifact/5YwkW4zDS5iRG6Vf88HcTk (9 músicas Suno, 21 efeitos + 3 ambientes ElevenLabs). Quando o Julio baixar em Downloads\orpheus-audio com os nomes music_*.mp3 / sfx_*.mp3 / amb_*.mp3: converter para leve (OGG/Opus ou MP3 menor), trocar o chiptune do audio.js por arquivos (loop com emenda, jingles cortados em ~4 s e ~8 s), ligar sons novos (punch no soco, hiss no bote da cobra, satyr no golpe do sátiro, underworld/ending nas cutscenes, ambientes por fase), respeitar volumes das Opções.