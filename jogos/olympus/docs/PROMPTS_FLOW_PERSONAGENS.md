# Prompts do Google Flow — personagens (base para o AutoSprite)

Prompts em inglês, estilo **2.5D**, prontos para colar no **Google Flow (modo imagem, 9:16, 4 variações)**. Gerado por `tools/prompts_personagens.js`: edite lá, não aqui.

Página com botão **Copiar** em cada prompt (e marcação do que já está pronto): https://claude.ai/artifact/4HLTmWg8VocQqpeeMMQPNd

## Como usar

1. Gere primeiro o **Orfeu (01)** em **9:16 (em pé)**, 4 variações. Escolha a de perfil de verdade (um olho só) e com o corpo inteiro.
2. Nos outros, anexe o Orfeu aprovado como **referência de estilo**: o prompt já manda copiar só o estilo, não a roupa nem o rosto.
3. Baixe só a escolhida e marque **Pronto**. Pode marcar uma de cada vez ou todas no fim: eu identifico pelo conteúdo.
4. Diga ao Claude *"importa os prontos"*. Eu tiro o magenta e subo no AutoSprite para animar. Subir é de graça; cada animação custa cerca de 5 créditos e só gero depois do seu ok.

## Checklist antes de aprovar

- Um personagem só, de corpo inteiro: cabeça e pés dentro da imagem
- Perfil de verdade: um olho e uma orelha, nariz apontando para a direita
- Olhando para a DIREITA
- Visual 2.5D estilizado: nada de pixel art nem de foto realista
- Proporção de adulto (nada de cabeção)
- Magenta chapado, sem chão nem sombra, e nada roxo ou rosa na roupa
- Mãos inteiras e o objeto certo: porrete, cajado, pote, cesta, raio, caduceu ou bidente
- Nos NPCs, o mesmo estilo do Orfeu aprovado

**Se falhar, cole no fim do prompt:** virou de frente ou mostra dois olhos → *"strict side profile facing right: exactly ONE eye and ONE ear visible, nose pointing to the right edge"*; cortou os pés ou a cabeça → *"whole body inside the frame with a margin on every side, nothing cropped"*; saiu mais de um personagem → *"ONE single character only, alone in the frame, nobody else"*; cabeça grande, cara de criança → *"stylized adult proportions, about 6.5 heads tall, not chibi, not big-headed"*; saiu pixel art ou retrô → *"stylized 3D render, soft global illumination, sharp clean details, not pixel art"*; apareceu chão ou sombra → *"no floor, no ground shadow, perfectly flat pure #FF00FF background"*.

## Herói

O Orfeu define o estilo de todos. Gere ele primeiro e só passe para os outros quando gostar.

### 01 — Orfeu · `orpheus`

proporção 9:16 · fundo magenta · GERE PRIMEIRO. No jogo: Personagem jogável · o porrete entra nos golpes, então já vem na mão.

```
[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about 6.5 heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.

[CHARACTER] Orpheus, a young Greek hero around 20 years old: slim athletic build, defined jaw, kind but determined eyes, short wavy auburn hair kept close to the head, a bright scarlet headband with two short tails fluttering behind, a white short chiton ending above the knee with a gold Greek key trim and a single shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape falling from the shoulder behind him, bronze bracers on both forearms, brown leather sandals laced up to the calves. In his right hand (the hand nearer the viewer) he holds a thick knotted olive-wood club, hanging down relaxed beside his leg, the head of the club near the knee.

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no sword, no shield, no spear, no lyre, no purple, no violet, no pink, no lilac.
```

## Pessoas da vila

Quem o Orfeu encontra em Arcádia. A Eurídice também aparece na história e como fantasma (o fantasma sai desta imagem, por código).

### 02 — Eurídice · `eurydice`

proporção 9:16 · fundo magenta. No jogo: História e final · também vira o fantasma (por código).

```
[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.

[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about 6.5 heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.

[CHARACTER] Eurydice, a gentle young Greek woman around 19: long flowing golden hair falling down her back, a small crown of white flowers, a soft kind face with a faint smile, a white ankle-length flowing dress with a thin gold belt and a gold Greek key hem, bare arms, thin leather sandals, both hands held together in front of her waist, graceful calm posture.

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no veil, no jewelry except the gold belt, no purple, no violet, no pink, no lilac.
```

### 03 — Ancião · `elder`

proporção 9:16 · fundo magenta. No jogo: ARCADIA, tile 9 · entrega o porrete e explica a missão.

```
[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.

[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about 6 heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.

[CHARACTER] The village elder of Arcadia, a wise old man around 75: long white hair and a long white beard reaching his chest, slightly hunched back, bushy white eyebrows, warm tired eyes, a brown wool himation wrapped over a lighter cream tunic, simple leather sandals. He leans on a tall gnarled wooden staff held in his right hand (the hand nearer the viewer), the staff planted on the ground in front of his feet and reaching above his head.

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no hood, no crown, no purple, no violet, no pink, no lilac.
```

### 04 — Mercadora · `merchant`

proporção 9:16 · fundo magenta. No jogo: ARCADIA, tile 25 · vende ambrosia (10 azeitonas).

```
[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.

[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about 6.5 heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.

[CHARACTER] A market merchant woman around 40: dark brown hair tied in a bun under an orange headscarf, a friendly smile, a light-blue ankle-length dress with a cream apron tied at the waist, simple leather sandals. With both hands she holds a small round clay jar filled with glowing golden ambrosia in front of her chest.

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no market stall, no table, no purple, no violet, no pink, no lilac.
```

### 05 — Moradora · `villager`

proporção 9:16 · fundo magenta. No jogo: ARCADIA, tile 44 · dá dicas da floresta.

```
[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.

[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about 6.5 heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.

[CHARACTER] A cheerful young village woman around 22: dark hair in a bun with a red flower tucked in it, bright friendly eyes, a saffron-yellow calf-length dress with a white shawl over her shoulders, simple leather sandals. She holds a small woven basket of red apples in the crook of her right arm (the arm nearer the viewer).

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no pink clothes, no purple, no violet, no pink, no lilac.
```

## Deuses

Maiores e mais imponentes que os mortais. O brilho divino em volta deles quem desenha é o jogo, por isso o prompt pede sem brilho.

### 06 — Zeus · `zeus`

proporção 9:16 · fundo magenta. No jogo: Templo de Zeus · dá a bênção (+4 de vida) e salva o jogo.

```
[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.

[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about 7 heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.

[CHARACTER] Zeus, king of the gods: a powerful, broad-shouldered old man, taller and more imposing than a mortal, long flowing white hair and a full white beard, a golden laurel crown, stern majestic eyes, white and gold robes draped over one shoulder with a deep blue sash, one muscular arm bare, golden sandals. In his right hand (the hand nearer the viewer) he raises a crackling golden lightning bolt at shoulder height, with a few small sparks close to the bolt.

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no glow around the body, no aura, no clouds, no throne, no purple, no violet, no pink, no lilac.
```

### 07 — Hermes · `hermes`

proporção 9:16 · fundo magenta. No jogo: Santuário de Hermes · dá as Sandálias de Hermes (pulo alto).

```
[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.

[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about 7 heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.

[CHARACTER] A young messenger god from ancient Greek myth: youthful, slim and light on his feet, curly brown hair under a round golden traveler's hat with two small white wings on its sides, a playful confident smile, a light-blue short chiton with gold trim, a small white cloak pinned at one shoulder, golden sandals with small white wings at the ankles. In his right hand (the hand nearer the viewer) he holds a slender golden herald's staff topped with two small wings, with two thin golden serpents coiled around it.

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no glow around the body, no aura, no clouds, no glasses, no purple, no violet, no pink, no lilac.
```

### 08 — Hades · `hades`

proporção 9:16 · fundo magenta. No jogo: História e Parte 2 · prende a alma da Eurídice.

```
[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.

[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about 7 heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.

[CHARACTER] The stern king of the underworld from ancient Greek myth: tall, regal and imposing, a pale but natural human skin tone, black wavy hair to the shoulders and a short black beard, dark serious eyes with a faint cold cyan glint, a dark iron crown with sharp pointed spikes, long black and dark steel-blue robes with iron clasps and a silver Greek key border, a dark cloak over his shoulders, dark leather sandals. In his right hand (the hand nearer the viewer) he holds a tall dark iron staff with two straight prongs at the top, planted on the ground.

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no flaming hair, no glow around the body, no smoke, no throne, no purple, no violet, no pink, no lilac.
```

### 09 — Rainha do Submundo · `queen`

proporção 9:16 · fundo magenta · novo. No jogo: Cutscene do fim da Parte 1 e Parte 7 · chora com a Canção.

```
[STYLE] Beautiful stylized 3D game character for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, portrait 9:16.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.

[POSE] ONE single character only, alone in the frame, nobody else. Full body with the whole body inside the frame and a small margin on every side: nothing cropped, from the top of the head (and anything held above it) down to the soles of the feet. Strict side view in profile, facing RIGHT: exactly ONE eye and ONE ear are visible and the nose points to the right edge of the image; if both eyes are visible, the image is wrong. Relaxed standing idle pose, weight on both feet, feet flat on one ground line near the bottom of the image. Stylized adult proportions, about 6.5 heads tall — NOT chibi, NOT big-headed. Camera at chest height, flat, no perspective, no foreshortening.

[CHARACTER] A graceful, sad young queen of the underworld from ancient Greek myth: long dark brown hair braided with small withered spring flowers, gentle green eyes, pale skin, a thin silver crown, a deep green and gold ankle-length gown, simple dark leather sandals. With both hands she holds a single wilted coral-red pomegranate blossom in front of her chest and looks down at it sadly.

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the character and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the character.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second character, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no throne, no glow around the body, no pink flowers, no purple, no violet, no pink, no lilac.
```

## Chefes e criaturas

Bases para as cutscenes e para o AutoSprite. O javali é largo, então vai em 16:9.

### 10 — Javali gigante · `boar`

proporção 16:9 · fundo magenta · novo. No jogo: Covil do Javali · chefe (a corda na presa é a 1ª corda da lira).

```
[STYLE] Beautiful stylized 3D game creature for a premium 2.5D side-scrolling platformer, rendered like a high-end animated film: soft global illumination, warm key light from the upper-left, gentle cool rim light on the back edge, hand-painted texture detail on skin, hair, cloth, leather and metal, clean strong silhouette, expressive face, high resolution, sharp clean edges, landscape 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Clothes and objects are ancient Greek: chitons, himations, leather sandals, bronze, olive wood, gold trim, Greek key (meander) patterns. Light always comes from the upper-left.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, level of detail, colors, lighting). Do not copy its character, face, clothes or objects.

[POSE] ONE single creature only, alone in the frame, nothing else. The whole body inside the frame with a small margin on every side, nothing cropped: from the snout to the tail and from the top of the mane down to the hooves. Strict side view in profile, facing RIGHT: exactly ONE eye is visible and the snout points to the right edge of the image; if both eyes are visible, the image is wrong. Standing still in an alert pose, all four hooves flat on one ground line near the bottom of the image. Camera at shoulder height, flat, no perspective, no foreshortening.

[CHARACTER] A huge mythical wild boar boss: as tall at the shoulder as a grown man and much longer than it is tall, dark reddish-brown bristly fur, a tall bristly mane rising along its spine, long curved ivory tusks, one tusk wrapped with a single thin glowing golden lyre string, small fierce red eyes, a scarred snout, a thin puff of steam at the nostrils, heavy dark hooves.

[BACKGROUND] Flat, solid, pure magenta background (#FF00FF), perfectly uniform, with no gradient, no floor, no shadow on the ground and no details. Crisp clean edge between the creature and the magenta, with no glow spilling onto it. Never use magenta, pink, purple, violet or lilac anywhere on the creature.

[NEGATIVE] no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no chibi, no big head, no second animal, no rider, no reflection, no text, no letters, no logo, no watermark, no signature, no border, no frame, no character sheet, no multiple views, no background scenery, no ground shadow, no cropped feet or head, no modern clothing, no blood, no wounds, no saddle, no purple, no violet, no pink, no lilac.
```
