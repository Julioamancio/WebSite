# Plano do AutoSprite — animações dos personagens

Escrito em 29/09/2026. O Júlio autorizou gerar "as versões de animação que precisa de cada personagem".
Regra da casa (erros já pagos no Valmora): **primeiro UMA animação de teste (idle do Orfeu), mostrar ao Júlio, e só então o resto.**

## Entrada
- As 8 bases já estão prontas, sem fundo (PNG transparente), em `jogos/olympus/assets/personagens/`:
  `orpheus.png`, `eurydice.png`, `elder.png`, `merchant.png`, `villager.png`, `zeus.png`, `hermes.png`, `hades.png`.
  Todas de perfil, olhando para a DIREITA, corpo inteiro, estilo 2.5D. O original do Flow (JPG com magenta) fica ao lado.
- Subir cada uma com `upload_character` — **grátis** e mantém o mesmo personagem. Não recriar por prompt.

## Custos (tabela anotada no Valmora)
- `generate_spritesheet`: **~5 créditos por animação**. `regenerate_*`: 0 (só recorta o vídeo que já existe).
- Depois de gerar, **sempre reextrair no máximo**: `frameSize: 0`, `maxFrames: 0`, `compression: "none"` (senão a folha sai borrada).
- A resposta pode vir trocada quando dois pedidos rodam juntos: conferir em `list_jobs` antes de reenviar.
- Estimativa deste plano: 8 animações do Orfeu + 7 idles = **15 animações ≈ 75 créditos** (mais refações).

## Travas em TODO prompt de animação (colar no início)
```
ONE single character only, alone in the frame, nobody else. Strict side view, facing RIGHT in every frame, never turning toward the camera. Same character, same clothes, same colors, same size and same head size in every frame; feet on the same ground line except while airborne. Whole body inside the frame, nothing cropped. Camera flat and still: no perspective, no zoom, no camera movement, no background.
```
Só no Orfeu, acrescentar (o motor NÃO desenha a arma: o porrete faz parte do sprite):
```
He holds the same wooden club in his right hand in every frame; nothing else is held; no motion trail, no slash effect, no particles.
```

## Orfeu — 8 animações
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

## NPCs e deuses — 1 idle cada (7 animações)
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

- O fantasma da Eurídice (`eurydice_ghost_0..3`) sai do idle dela **por código** (tom ciano claro e transparência) — não gastar crédito.
- Inimigos (cobra, morcego, sátiro, javali) ainda não têm base: fazer os prompts do Flow deles depois.

## Saída
- Salvar cada folha em `jogos/olympus/assets/sprites/<nome>_<animação>.png` + o JSON do atlas.
- Âncora: `ax` = centro do corpo (igual em todos os quadros do personagem), `ay` = linha logo abaixo da sola. Tudo virado para a direita (o motor espelha).
- Integrar no jogo só depois do motor em HD (passo 0 da seção 11 do `ORPHEUS_MEMORIA_COMPLETA.md`).
