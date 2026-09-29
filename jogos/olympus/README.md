# Orpheus: Song of Olympus — Parte 1 (Arcádia)

Jogo de ação e aventura em side-scroll, em pixel art no estilo NES (256×240), inspirado no clássico de 8 bits *The Battle of Olympus* e no mito grego de Orfeu e Eurídice.

É um tributo feito por fã: **todo o código, os sprites, as músicas e os textos são originais**. Nenhum gráfico, música, nome ou diálogo do jogo de 1988 foi copiado. O que se aproveita do original é o gênero, a estrutura e as mecânicas, que não são protegidos por direito autoral, além do mito, que é de domínio público.

## Como jogar

Abra `jogos/olympus/index.html` no navegador. Não precisa de servidor nem de instalar nada.

| Ação | Teclado | Controle | Celular |
|---|---|---|---|
| Andar | Setas / WASD | D-pad / analógico | D-pad na tela |
| Pular (A) | X, K ou Espaço | A | A |
| Atacar (B) | Z ou J | X ou B | B |
| Ataque baixo | Segurar ↓ + atacar | ↓ + ataque | ↓ + B |
| Falar / entrar em portas | ↑ | ↑ | ↑ |
| Status / pausa | Enter ou P | Start | START |
| Ligar e desligar o som | M | — | — |

## Conteúdo da Parte 1

- Abertura em 5 cenas contando a história (Orfeu, Eurídice, a serpente, Hades e o juramento).
- **Vilarejo da Arcádia**: o Ancião entrega o porrete, a mercadora vende ambrosia em troca de 10 azeitonas e uma moradora dá dicas.
- **Templo de Zeus**: Zeus explica a missão e aumenta a vida máxima. Falar com ele de novo salva o jogo e restaura a vida.
- **Floresta da Arcádia**: cobras (só morrem com ataque baixo), morcegos, sátiros, buracos, espinhos e plataformas.
- **Covil do Javali de Erimanto** (chefe): ele investe contra o jogador, bate na parede, fica atordoado (e leva dano dobrado) e derruba pedras do teto.
- **Santuário de Hermes**: entrega as Sandálias de Hermes (pulo alto) e mostra a tela de fim da Parte 1.
- HUD com barra de vida, azeitonas, ambrosia e itens. Tela de status com a dica da missão atual.
- Salvamento automático no navegador (`localStorage`) ao falar com Zeus, ao receber itens importantes e ao derrotar o chefe.

## Estrutura dos arquivos

```
jogos/olympus/
  index.html        Página do jogo (canvas + controles de toque)
  css/game.css      Layout, escala pixel-perfect e controles de celular
  js/core.js        Paleta NES, utilitários e fonte bitmap
  js/pix.js         Motor de pixel art (sombreamento, dithering, contornos)
  js/sprites.js     Todos os sprites (texto -> imagem com sombreamento automático)
  js/tiles.js       Tiles 16×16 com variações, decoração e cenários em parallax
  js/audio.js       Motor chiptune (2 pulsos + triângulo + ruído), músicas e efeitos
  js/input.js       Teclado, controle e toque
  js/levels.js      Mapas das fases
  js/story.js       TODOS os textos: abertura, diálogos, itens e final
  js/entities.js    Física, Orfeu, inimigos, chefe, NPCs e itens coletáveis
  js/game.js        Estados do jogo, diálogos, salvamento e lógica
  js/render.js      Tudo o que aparece na tela: fases, luzes, partículas, HUD, título
  js/main.js        Inicialização e loop a 60 FPS
```

## Como editar

- **Textos e diálogos**: `js/story.js`. Use apenas letras sem acento, números e `. , ! ? ' - : / ( ) " + =`.
- **Fases**: `js/levels.js`. A legenda dos tiles está no topo do arquivo.
- **Sprites**: `js/sprites.js`. Cada letra MAIÚSCULA é um material com sombreamento automático (por exemplo `S` pele, `H` cabelo, `W` tecido branco); a letra minúscula força a sombra; `K` é preto e `.` é transparente. O contorno preto é adicionado sozinho.
- **Decoração das fases**: lista `decor` de cada fase em `js/levels.js` (oliveiras, ciprestes, carvalhos, ânforas, cortinas, janelas, cristais etc.).
- **Músicas**: `js/audio.js`. Notas no formato `NOTA+OITAVA.DURAÇÃO` (duração em semicolcheias), por exemplo `E4.2` ou `-.4` (pausa).
