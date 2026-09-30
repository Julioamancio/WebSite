# Prompts do Google Flow — cenários do jogo

Prompts em inglês, estilo **2.5D** (3D estilizado, luz suave, cara de filme de animação; nada de pixel art), prontos para colar no **Google Flow (modo imagem, 4 variações)**. Gerado por `tools/prompts_flow.js`: edite lá, não aqui.

Página com botão **Copiar** em cada prompt (e marcação do que já está pronto): https://claude.ai/artifact/XrdJBjQUYghg8jiKqWtXgm

## Como usar

1. Gere primeiro o **02 — Vilarejo, camada distante**. Depois anexe a imagem aprovada dele como **referência de estilo** nas outras, **menos nos céus (03 e 07)**: ali o Flow copia a montanha e o templo.
2. Antes de gerar, troque a proporção no Flow para a do cartão: quase todos são **16:9 (deitada)**; só as casas, a barraca e a caverna são 1:1. Peça 4 variações.
3. Baixe **só a variação escolhida** (ela vai para Downloads) e marque **Pronto logo em seguida**, uma de cada vez. O Claude pega a imagem mais recente de Downloads e coloca no projeto com o nome certo.
4. Quando quiser, diga ao Claude *"importa os prontos"*. O cartão muda para **No projeto** ou mostra o que refazer.

## Checklist antes de aprovar

- Proporção certa: 16:9 deitada nos fundos, interiores e história
- Visual 2.5D bonito: volume de 3D estilizado, luz suave e detalhe nítido; nada de pixel art nem de foto realista
- Luz vindo da esquerda e de cima
- Nenhuma pessoa, animal, texto ou moldura
- Magenta chapado, sem degradê, e nada roxo ou rosa dentro do desenho
- Camadas: bordas esquerda e direita com alturas parecidas
- Casas: vistas bem de frente, sem parede lateral nem telhado visto de cima
- Monte Olimpo com o mesmo formato no título, na vila e no juramento

**Se falhar, cole no fim do prompt:** saiu pixel art ou retrô → *"stylized 3D render, soft global illumination, sharp clean details, not pixel art"*; saiu foto realista → *"stylized animated-film look, hand-painted textures, not photorealistic"*; apareceu gente → *"empty scene, nobody"*; magenta com degradê → *"perfectly flat pure #FF00FF background, no gradient"*; casa em perspectiva → *"flat front elevation, straight-on, no perspective, no side walls"*; roxo ou rosa no desenho → *"no purple, no pink, no violet anywhere on the subject"*.

## Fundos

Camadas que rolam atrás do jogo. As de fundo magenta viram parallax (o magenta é recortado por código); os céus são imagem cheia. Nas camadas com magenta, lilás e sombra violeta viraram azul para o recorte não comer o desenho.

### 02 — Vilarejo — camada distante · `vila_longe`

proporção 16:9 · fundo magenta · GERE PRIMEIRO. No jogo: ARCADIA · camada longe, parallax 0,08.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[LAYER] Far parallax layer, bright afternoon. Mount Olympus as a massive snow-capped mountain range: the main peak slightly right of center reaching about 15% from the top of the image, with a tiny golden temple on the summit; secondary peaks on both sides. Rock faces in cool slate blue with sunlit cream-white snow on the left slopes and cool blue shadows on the right slopes. The base of the range fades to a lighter, opaque pale-blue tone. The mountain range touches both the left and right edges of the image at similar heights.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no clouds, no sun, no magenta inside the mountains, no purple, no violet, no pink, no lilac.
```

### 03 — Vilarejo — céu · `vila_ceu`

proporção 16:9 · imagem cheia. No jogo: ARCADIA · céu fixo, parallax 0.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Sky only, bright Mediterranean afternoon: a smooth banded gradient from deep cobalt blue at the top to pale warm cream near the horizon, a soft glowing sun in the upper-right area, and three or four stylized fluffy cumulus clouds with cream highlights and lavender undersides floating in the middle band. The lower 40% of the image is just pale hazy sky.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no mountains, no ground, no buildings, no birds.
```

### 04 — Vilarejo — colinas (meio) · `vila_meio`

proporção 16:9 · fundo magenta. No jogo: ARCADIA · camada do meio, parallax 0,25.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Middle parallax layer: gentle rolling green hills occupying the lower 45% of the image, dotted with tall dark cypress trees, round olive groves and a few tiny whitewashed houses with terracotta roofs; a winding dirt path and low dry-stone walls. The hills are slightly hazy (lighter and bluer than a foreground). Hill tops are lit from the upper-left. The hill line continues to both the left and right edges at similar heights.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no mountains, no sky details, no clouds, no purple, no violet, no pink, no lilac.
```

### 05 — Vilarejo — primeiro plano · `vila_perto`

proporção 16:9 · fundo magenta. No jogo: ARCADIA · primeiro plano, parallax 0,5.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Near parallax layer: a continuous band in the bottom 30% of the image made of lush silver-green olive bushes, wild blue sage, red poppies and white daisies, and a low weathered dry-stone wall with patches of moss. Saturated colors, well defined, lit from the upper-left. The band touches both the left and right edges.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no trees taller than 30% of the image, no magenta flowers, no pink flowers, no purple, no violet, no pink, no lilac.
```

### 07 — Floresta — céu noturno · `floresta_ceu`

proporção 16:9 · imagem cheia. No jogo: FOREST OF ARCADIA · céu fixo, parallax 0.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Night sky over a forest, just after twilight: banded gradient from deep indigo at the top through violet to a faint dusty rose glow at the horizon, a large luminous full moon with visible craters in the upper-left area surrounded by a soft glowing halo, many small twinkling stars, two thin long wisps of violet cloud. The lower 35% is the dim rose-violet horizon glow only.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no trees, no mountains, no ground.
```

### 08 — Floresta — montanhas e pinheiros (longe) · `floresta_longe`

proporção 16:9 · fundo magenta. No jogo: FOREST OF ARCADIA · camada longe, parallax 0,08.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Far parallax layer at night: soft distant mountain ridges in dusty blue-grey, and in front of them a dense line of pine and fir tree silhouettes in misty deep navy blue with thin silver moon-rim light on their upper-left edges, an opaque band of pale blue-white mist at their base. Occupies the lower 50% of the image and touches both the left and right edges.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no moon, no stars, no bright colors, no purple, no violet, no pink, no lilac.
```

### 09 — Floresta — árvores grandes (meio) · `floresta_meio`

proporção 16:9 · fundo magenta. No jogo: FOREST OF ARCADIA · camada do meio, parallax 0,25.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Middle parallax layer of an enchanted Arcadian forest at night: four or five large ancient oak trees with thick twisted trunks and big rounded canopies in deep blue-teal, silver moon rim light on the upper-left edges of the leaves, hanging ivy and moss, a few faint glowing mushrooms at the roots. The trunks reach the bottom edge; the canopies fill roughly the 20% to 70% height band.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no moon, no ground platforms, no paths, no purple, no violet, no pink, no lilac.
```

### 10 — Floresta — primeiro plano · `floresta_perto`

proporção 16:9 · fundo magenta. No jogo: FOREST OF ARCADIA · primeiro plano, parallax 0,5.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, one isolated parallax background layer, rendered like a high-end animated film: soft global illumination, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool blue shadows), distant elements slightly lighter and bluer, camera looking straight at the layer from the side with no strong perspective, 16:9, high resolution, sharp clean edges.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean look: whitewashed stone walls, terracotta roof tiles, blue doors and shutters, silver-green olive trees, tall dark cypress trees, white marble with gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Daylight colors: sky blue, olive green, cream, terracotta and warm stone. Night colors: deep navy, blue-teal and moon silver.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[LAYER] Near parallax layer at night: a continuous dark band in the bottom 25% of the image made of ferns, tall grass, brambles and bushes in very dark blue-green, with thin silver rim light on the tips of the leaves. Hanging leafy branches enter from the top edge in the top 12%. The band touches both the left and right edges.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details. The layer itself is fully opaque with a crisp edge against the magenta: no haze, glow, fog or soft shadow spills onto the magenta. Never use magenta, pink, purple, violet or lilac inside the layer itself.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no fireflies, no tree trunks in the middle of the image, no purple, no violet, no pink, no lilac.
```

## Casas de frente

Prédios vistos bem de frente, sobre magenta, para entrar no lugar das casas e do templo feitos de tiles. São novos: não estavam na lista de 16.

### 17 — Casa do Ancião · `casa_anciao`

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

### 18 — Casa da família · `casa_vila`

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

### 19 — Barraca da mercadora · `barraca_mercadora`

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

### 20 — Templo de Zeus (fachada) · `templo_zeus_fachada`

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

### 21 — Entrada da caverna (floresta) · `entrada_caverna`

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

## Interiores

Fundo inteiro das salas fechadas. O centro fica livre porque o deus ou o chefe aparece ali.

### 06 — Templo de Zeus (interior) · `templo_zeus`

proporção 16:9 · imagem cheia. No jogo: TEMPLE OF ZEUS · parede de fundo da sala.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] Interior of the Temple of Zeus at night, seen straight from the side: a grand back wall of pale lavender marble blocks with a gold Greek key frieze along the top, tall fluted marble columns near the left and right edges, crimson and gold drapes hanging between them, a large arched window in the center showing a starry night sky and a crescent moon with a soft beam of moonlight falling diagonally, carved reliefs of an eagle and lightning bolts in gold, two empty wall niches with shadowed alcoves, warm brazier glow at floor level. The floor is a simple polished marble strip in the bottom 12%.

[COMPOSITION] Keep the center of the image open and uncluttered (a god will float there). No objects on the floor between 20% and 80% of the width.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no statues of people, no perspective vanishing point, no ceiling perspective.
```

### 11 — Covil do Javali (caverna) · `caverna_fundo`

proporção 16:9 · imagem cheia. No jogo: BOAR'S DEN · parede de fundo da sala.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] The den of a giant wild boar: a vast cavern seen from the side, with a layered rocky back wall in warm browns and deep plum shadows, huge stalactites hanging from the top and stalagmites below, two iron wall torches casting warm amber pools of light on the rock, clusters of glowing cyan crystals near the floor, scratch marks and scattered old bones along the base of the wall, a darker tunnel opening on the far right. The floor is a simple dark rock strip in the bottom 12%.

[COMPOSITION] The center of the floor area is empty (a boss fight happens there). Moody but readable: the rock surfaces lit by the torches must stay clearly visible.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no boar, no skulls in the center, no pitch-black areas covering more than 20% of the image.
```

### 12 — Santuário de Hermes (interior) · `santuario_hermes`

proporção 16:9 · imagem cheia. No jogo: SHRINE OF HERMES · parede de fundo da sala.

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] Shrine of Hermes, the messenger god, seen straight from the side: an airy open-air sanctuary of white marble with sky-blue accents, tall slender columns, three wide arches in the back wall opening onto a bright sky full of clouds far below (the shrine floats high among the clouds), golden reliefs of winged sandals, winged helmets and a caduceus staff, soft sunbeams falling diagonally from the upper-left, a few floating white feathers. The floor is a simple polished marble strip in the bottom 12%.

[COMPOSITION] Keep the center of the image open and uncluttered (a god will float there).

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no statues of people, no perspective vanishing point.
```

### 13 — Submundo de Hades · `submundo`

proporção 16:9 · imagem cheia. No jogo: História, página 4 (Hades).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] The throne hall of Hades in the underworld, seen from the side: colossal obsidian pillars fading into darkness, a massive empty black stone throne with iron spikes in the center, ghostly blue-violet flames burning in iron braziers, the glowing river Styx flowing across the bottom of the image with a cold cyan light, faint drifting wisps of lost souls as pale mist, deep red cracks of magma in the far walls, iron chains hanging from above.

[COMPOSITION] The throne is empty and centered; keep the space in front of it clear for characters.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no skeletons, no gore, no blood.
```

## Título e história

Tela de abertura e cenas das páginas da história.

### 01 — Tela de título · `titulo`

proporção 16:9 · imagem cheia. No jogo: Tela de título (logo no alto, menu embaixo).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] Epic key art at sunset: the majestic snow-capped Mount Olympus rises on the right half, a tiny glowing golden temple on its summit radiating soft light rays. The low sun sits near the horizon slightly right of center, painting the sky in bands of deep violet, magenta, coral and gold. Long pink-gold cloud banks drift across the middle distance, distant hills with cypress silhouettes below them. In the left third of the foreground, a dark rocky cliff with a flat grassy top (at about 72% of the image height) and a lone windswept olive tree, empty and ready for a hero to stand on. Tiny birds far away.

[COMPOSITION] Keep the top 30% of the image as calm open sky (a logo will be placed there). Keep the lower-center area calm and dark enough for a menu. Nothing important in the top-left corner.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no lens flare, no perspective tilt, no fisheye.
```

### 14 — Campo do casamento · `historia_casamento`

proporção 16:9 · imagem cheia. No jogo: História, página 2 (os noivos).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] A flowering meadow in Arcadia at golden hour, prepared for a wedding: a large old olive tree on the right decorated with garlands of white flowers and ribbons, a small marble altar with a bowl of fruit, fields of poppies and daisies, cypress trees and a whitewashed village on the distant hills, Mount Olympus faint on the horizon, warm golden light and long soft shadows. The grassy ground line sits at about 80% of the image height.

[COMPOSITION] The center of the ground is empty (two characters will stand there).

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain.
```

### 15 — A serpente (entardecer) · `historia_serpente`

proporção 16:9 · imagem cheia. No jogo: História, página 3 (a serpente).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] The same flowering meadow and decorated olive tree as the wedding scene, now at ominous dusk: the sky turning from bruised violet to dim orange, long dark shadows, the flower garlands fallen on the grass, tall dark grass in the foreground where something could hide, the first stars appearing, a cold wind bending the grass. The grassy ground line sits at about 80% of the image height.

[COMPOSITION] Same framing and horizon as the wedding meadow. The center of the ground is empty.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain, no snake.
```

### 16 — O juramento (amanhecer) · `historia_juramento`

proporção 16:9 · imagem cheia. No jogo: História, página 5 (o juramento).

```
[STYLE] Beautiful stylized 3D environment art for a premium 2.5D side-scrolling platformer game, rendered like a high-end animated film: soft global illumination, warm key light with gentle bounce light, hand-painted texture detail, clean readable shapes, rich but harmonious colors (warm golden highlights, cool violet shadows), soft atmospheric depth and haze in the distance, camera looking straight at the scene from the side with no strong perspective, 16:9, high resolution, sharp details.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[REFERENCE] If a reference image is attached, use it only for the art style (rendering, brushwork, colors, lighting). Do not copy its mountains, temple, buildings or any other object into this image.

[SCENE] A grassy hilltop at dawn overlooking the vast land of Greece: the first rays of the sun rising behind the distant Mount Olympus on the right, a glowing golden temple on its summit, a winding road descending into misty valleys with cypress trees and olive groves, a sky in bands of pale gold, peach and soft blue, a sense of a long journey ahead. The hilltop ground line sits at about 80% of the image height on the left half and slopes down on the right.

[COMPOSITION] The left third of the hilltop is empty (a hero will stand there looking right).

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no frame, no pixel art, no pixelated look, no retro 8-bit or 16-bit style, no low-poly look, no photorealism, no blurry or muddy details, no film grain.
```
