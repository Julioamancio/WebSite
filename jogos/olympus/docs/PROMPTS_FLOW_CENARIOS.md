# Prompts do Google Flow — cenários do jogo

Prompts em inglês, prontos para colar no **Google Flow (modo imagem, proporção 16:9, 4 variações)**.

## Como usar

1. Gere primeiro o **02 (vila_longe)**. Quando gostar, adicione essa imagem como **referência/ingrediente** em todas as outras gerações — é isso que mantém o estilo consistente.
2. Os blocos **[STYLE]**, **[WORLD]** e **[NEGATIVE]** são fixos: nunca altere entre um prompt e outro.
3. Camadas com **fundo magenta (#FF00FF)** viram parallax: o magenta é removido por código.
4. Salve com o **nome de arquivo indicado** em `jogos/olympus/assets/cenarios/` (crie a pasta).
5. Depois peça ao Claude: *"integra os cenários do Flow"* — ele recorta o magenta, reduz para 384×216 e encaixa nas camadas de parallax (`js/art/sky.js`).

## Checklist antes de aprovar

- Pixels nítidos e visíveis (não parece pintura borrada nem 3D)?
- Luz vindo da esquerda/cima em todas as imagens?
- Nenhum personagem, animal, texto ou moldura?
- Magenta chapado e uniforme, sem degradê?
- Bordas esquerda e direita com alturas parecidas (o código acerta a emenda, mas ajuda)?
- Monte Olimpo com o mesmo formato no título, na vila e no juramento?

**Se falhar:** borrado/realista → repita no fim *"pixel art, crisp pixels, visible pixel grid"*; apareceu pessoa → *"empty scene, nobody"*; magenta com degradê → *"perfectly flat pure #FF00FF, no gradient"*.

## 01 — Tela de título · `titulo.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[SCENE] Epic key art at sunset: the majestic snow-capped Mount Olympus rises on the right half, a tiny glowing golden temple on its summit radiating soft light rays. The low sun sits near the horizon slightly right of center, painting the sky in bands of deep violet, magenta, coral and gold. Long pink-gold cloud banks drift across the middle distance, distant hills with cypress silhouettes below them. In the left third of the foreground, a dark rocky cliff with a flat grassy top (at about 72% of the image height) and a lone windswept olive tree, empty and ready for a hero to stand on. Tiny birds far away.

[COMPOSITION] Keep the top 30% of the image as calm open sky (a logo will be placed there). Keep the lower-center area calm and dark enough for a menu. Nothing important in the top-left corner.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no lens flare, no perspective tilt, no fisheye.
```

## 02 — Vilarejo — camada distante (GERE PRIMEIRO e use como referência nas outras) · `vila_longe.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[LAYER] Far parallax layer, bright afternoon. Mount Olympus as a massive snow-capped mountain range: the main peak slightly right of center reaching about 15% from the top of the image, with a tiny golden temple on the summit; secondary peaks on both sides. Rock faces in lavender-blue with sunlit cream-white snow on the left slopes and cool blue shadows on the right slopes. Soft bluish haze at the base. The mountain range touches both the left and right edges of the image at similar heights.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no clouds, no sun, no magenta inside the mountains.
```

## 03 — Vilarejo — céu · `vila_ceu.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[LAYER] Sky only, bright Mediterranean afternoon: a smooth banded gradient from deep cobalt blue at the top to pale warm cream near the horizon, a soft glowing sun in the upper-right area, and three or four stylized fluffy cumulus clouds with cream highlights and lavender undersides floating in the middle band. The lower 40% of the image is just pale hazy sky.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no mountains, no ground, no buildings, no birds.
```

## 04 — Vilarejo — colinas (meio) · `vila_meio.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[LAYER] Middle parallax layer: gentle rolling green hills occupying the lower 45% of the image, dotted with tall dark cypress trees, round olive groves and a few tiny whitewashed houses with terracotta roofs; a winding dirt path and low dry-stone walls. The hills are slightly hazy (lighter and bluer than a foreground). Hill tops are lit from the upper-left. The hill line continues to both the left and right edges at similar heights.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no mountains, no sky details, no clouds.
```

## 05 — Vilarejo — primeiro plano · `vila_perto.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[LAYER] Near parallax layer: a continuous band in the bottom 30% of the image made of lush silver-green olive bushes, wild lavender, red poppies and white daisies, and a low weathered dry-stone wall with patches of moss. Saturated colors, well defined, lit from the upper-left. The band touches both the left and right edges.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no trees taller than 30% of the image, no magenta flowers.
```

## 06 — Templo de Zeus (interior) · `templo_zeus.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[SCENE] Interior of the Temple of Zeus at night, seen straight from the side: a grand back wall of pale lavender marble blocks with a gold Greek key frieze along the top, tall fluted marble columns near the left and right edges, crimson and gold drapes hanging between them, a large arched window in the center showing a starry night sky and a crescent moon with a soft beam of moonlight falling diagonally, carved reliefs of an eagle and lightning bolts in gold, two empty wall niches with shadowed alcoves, warm brazier glow at floor level. The floor is a simple polished marble strip in the bottom 12%.

[COMPOSITION] Keep the center of the image open and uncluttered (a god will float there). No objects on the floor between 20% and 80% of the width.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no statues of people, no perspective vanishing point, no ceiling perspective.
```

## 07 — Floresta — céu noturno · `floresta_ceu.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[LAYER] Night sky over a forest, just after twilight: banded gradient from deep indigo at the top through violet to a faint dusty rose glow at the horizon, a large luminous full moon with visible craters in the upper-left area surrounded by a soft dithered halo, many small twinkling stars, two thin long wisps of violet cloud. The lower 35% is the dim rose-violet horizon glow only.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no trees, no mountains, no ground.
```

## 08 — Floresta — montanhas e pinheiros (longe) · `floresta_longe.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[LAYER] Far parallax layer at night: soft distant mountain ridges in muted dusty mauve, and in front of them a dense line of pine and fir tree silhouettes in misty indigo with thin silver moon-rim light on their upper-left edges, a band of pale mist at their base. Occupies the lower 50% of the image and touches both the left and right edges.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no moon, no stars, no bright colors.
```

## 09 — Floresta — árvores grandes (meio) · `floresta_meio.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[LAYER] Middle parallax layer of an enchanted Arcadian forest at night: four or five large ancient oak trees with thick twisted trunks and big rounded canopies in deep blue-teal, silver moon rim light on the upper-left edges of the leaves, hanging ivy and moss, a few faint glowing mushrooms at the roots. The trunks reach the bottom edge; the canopies fill roughly the 20% to 70% height band.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no moon, no ground platforms, no paths.
```

## 10 — Floresta — primeiro plano · `floresta_perto.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[LAYER] Near parallax layer at night: a continuous dark band in the bottom 25% of the image made of ferns, tall grass, brambles and bushes in very dark blue-green, with thin silver rim light on the tips of the leaves. Hanging leafy branches enter from the top edge in the top 12%. The band touches both the left and right edges.

[BACKGROUND] Everything that is sky / empty space must be a flat, solid, pure magenta color (#FF00FF), perfectly uniform, with no gradient and no details.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no fireflies, no tree trunks in the middle of the image.
```

## 11 — Covil do Javali (caverna) · `caverna_fundo.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[SCENE] The den of a giant wild boar: a vast cavern seen from the side, with a layered rocky back wall in warm browns and deep plum shadows, huge stalactites hanging from the top and stalagmites below, two iron wall torches casting warm amber pools of light on the rock, clusters of glowing cyan crystals near the floor, scratch marks and scattered old bones along the base of the wall, a darker tunnel opening on the far right. The floor is a simple dark rock strip in the bottom 12%.

[COMPOSITION] The center of the floor area is empty (a boss fight happens there). Moody but readable: the rock surfaces lit by the torches must stay clearly visible.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no boar, no skulls in the center, no pitch-black areas covering more than 20% of the image.
```

## 12 — Santuário de Hermes (interior) · `santuario_hermes.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[SCENE] Shrine of Hermes, the messenger god, seen straight from the side: an airy open-air sanctuary of white marble with sky-blue accents, tall slender columns, three wide arches in the back wall opening onto a bright sky full of clouds far below (the shrine floats high among the clouds), golden reliefs of winged sandals, winged helmets and a caduceus staff, soft sunbeams falling diagonally from the upper-left, a few floating white feathers. The floor is a simple polished marble strip in the bottom 12%.

[COMPOSITION] Keep the center of the image open and uncluttered (a god will float there).

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no statues of people, no perspective vanishing point.
```

## 13 — Submundo de Hades (história) · `submundo.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[SCENE] The throne hall of Hades in the underworld, seen from the side: colossal obsidian pillars fading into darkness, a massive empty black stone throne with iron spikes in the center, ghostly blue-violet flames burning in iron braziers, the glowing river Styx flowing across the bottom of the image with a cold cyan light, faint drifting wisps of lost souls as pale mist, deep red cracks of magma in the far walls, iron chains hanging from above.

[COMPOSITION] The throne is empty and centered; keep the space in front of it clear for characters.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no skeletons, no gore, no blood.
```

## 14 — História — campo do casamento · `historia_casamento.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[SCENE] A flowering meadow in Arcadia at golden hour, prepared for a wedding: a large old olive tree on the right decorated with garlands of white flowers and ribbons, a small marble altar with a bowl of fruit, fields of poppies and daisies, cypress trees and a whitewashed village on the distant hills, Mount Olympus faint on the horizon, warm golden light and long soft shadows. The grassy ground line sits at about 80% of the image height.

[COMPOSITION] The center of the ground is empty (two characters will stand there).

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain.
```

## 15 — História — a serpente (entardecer) · `historia_serpente.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[SCENE] The same flowering meadow and decorated olive tree as the wedding scene, now at ominous dusk: the sky turning from bruised violet to dim orange, long dark shadows, the flower garlands fallen on the grass, tall dark grass in the foreground where something could hide, the first stars appearing, a cold wind bending the grass. The grassy ground line sits at about 80% of the image height.

[COMPOSITION] Same framing and horizon as the wedding meadow. The center of the ground is empty.

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain, no snake.
```

## 16 — História — o juramento (amanhecer) · `historia_juramento.png`

```
[STYLE] Modern high-detail pixel art game background for a 2D side-scrolling action-adventure, crisp hard-edged pixels with a clearly visible pixel grid (as if drawn at 384x216 and upscaled 5x), limited harmonious palette with hue-shifted shading (warm yellow highlights, cool violet shadows), clean pixel clusters, subtle ordered dithering only in skies and glows, atmospheric perspective, strict orthographic side view, 16:9.

[WORLD] Mythological Ancient Greece, region of Arcadia. Mediterranean landscape: whitewashed stone houses with terracotta roofs and blue doors, silver-green olive trees, tall dark cypress trees, white marble temples with fluted columns and gold accents, Greek key (meander) ornaments. Light always comes from the upper-left. Sunny scenes use sky blue, olive green, cream and terracotta; night scenes use indigo, violet and moon silver; underground scenes use warm amber torchlight against deep plum shadows.

[SCENE] A grassy hilltop at dawn overlooking the vast land of Greece: the first rays of the sun rising behind the distant Mount Olympus on the right, a glowing golden temple on its summit, a winding road descending into misty valleys with cypress trees and olive groves, a sky in bands of pale gold, peach and soft blue, a sense of a long journey ahead. The hilltop ground line sits at about 80% of the image height on the left half and slopes down on the right.

[COMPOSITION] The left third of the hilltop is empty (a hero will stand there looking right).

[NEGATIVE] no characters, no people, no animals, no creatures, no text, no letters, no logo, no UI, no watermark, no signature, no border, no blur, no soft airbrush gradients, no photorealism, no 3D render look, no smeared anti-aliasing, no film grain.
```
