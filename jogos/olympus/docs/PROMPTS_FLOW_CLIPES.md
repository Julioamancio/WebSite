# Prompts do Google Flow (Veo) — clipes das cutscenes da Parte 1

Gerado por `tools/cutscenes.js` + `tools/cutscenes_prompts.json`: edite lá, não aqui.

Página com botão **Copiar** em cada prompt (e marcação do que já está pronto): https://claude.ai/artifact/9N1dVQMPKwPWXMLcMAv2Bk

## Como usar

1. No Flow, use o modo de vídeo com **ingredientes** (imagens de referência), **16:9**, 8 segundos.
2. Anexe as imagens da linha **Anexar no Flow**. Elas ficam em `C:\Users\julio\Documents\website\jogos\olympus\assets\` (personagens sem fundo e cenários).
3. Gere na ordem, começando pela **cena 01**: cada prompt continua do fim da cena anterior. Baixe só o clipe escolhido e marque **Pronto**.
4. Diga ao Claude *"importa os prontos"*: eu salvo em `assets/cutscenes/cena_NN` e o cartão muda para **No projeto**.

## Checklist antes de aprovar

- Mesmo rosto, cabelo e roupa das imagens anexadas, do começo ao fim do clipe
- Lira no estado certo: 7 cordas até a cena 05, moldura vazia de 08 a 12, uma corda de 13 em diante
- Porrete só a partir da cena 10; sandálias aladas só na 15
- Ninguém a mais em cena e ninguém falando
- Nenhum texto, legenda ou logo na imagem
- Mãos e rostos sem deformar
- Hora do dia igual à das cenas vizinhas

**Se falhar, cole no fim do prompt:** rosto ou roupa mudou → *"keep the exact face, hair and clothes of the attached reference images in every frame, no morphing"*; apareceu texto ou legenda → *"no text, no subtitles, no letters or numbers anywhere on screen"*; apareceu gente a mais → *"only the characters described, nobody else in the scene"*; porrete na cena da lira → *"he holds only the golden lyre, no club, no weapon"*; movimento rápido ou confuso → *"slow, calm movement, one simple action, steady camera"*; saiu realista ou pixelado → *"stylized 3D animated film look, hand-painted textures, not photorealistic, not pixel art"*.

## CS1 · A Canção de Orfeu

Texto na tela: Long ago, in the green hills of Arcadia, there lived a young musician named Orpheus. When he played his golden lyre, rivers stopped to listen and trees began to dance. And his heart belonged to the gentle Eurydice.

### 01 — A Canção de Orfeu · cena 1 de 2 · `cena_01`

proporção 16:9 · imagem cheia · GERE PRIMEIRO. No jogo: CS1: Novo jogo, logo depois da tela de título.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.

[SETTING] A green hill in Arcadia with an ancient, wide olive tree at the top, late golden afternoon, a light breeze moving the grass and wildflowers. ORPHEUS sits on a smooth grey rock under the olive tree, holding a golden lyre with seven strings on his lap.

[ACTION] ORPHEUS gently plucks the seven strings of the golden lyre. Small glowing golden notes of light drift out of the strings and float slowly through the air. Two deer step out from the trees and stop to listen, and a flock of small birds lands on the olive branches, turning their heads toward the music. He keeps playing, calm and smiling.

[CAMERA] Wide shot of the hill and the olive tree, slow dolly-in toward ORPHEUS; steady, smooth movement.

[LIGHTING] Golden hour, warm backlight from the low sun behind the tree, soft rim light on his hair and the lyre, long soft shadows.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: A soft, warm solo lyre melody, gentle and tender.
- SFX: Light chirping of the birds landing, a faint magical shimmer as each note of light appears.
- Ambient: Soft breeze through grass and olive leaves.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no club, no weapon in his hands, only the golden lyre, no other people.
```

### 02 — A Canção de Orfeu · cena 2 de 2 · `cena_02`

proporção 16:9 · imagem cheia. No jogo: CS1: Novo jogo, logo depois da tela de título.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.
[CHARACTER: EURYDICE] A gentle young Greek woman around 19 years old, stylized 3D animated-film character, long straight golden-blonde hair falling down her back, a small crown of white flowers, a soft kind face with a faint smile, a white sleeveless ankle-length dress with a thin gold belt and a gold Greek key hem, thin leather sandals. Graceful and calm; often holds her hands together in front of her waist.

[SETTING] The same hill in Arcadia a moment later, the same late golden light. ORPHEUS is still sitting on the grey rock under the ancient olive tree playing the golden seven-string lyre; the golden notes of light still float around him and the deer are still listening at the edge of the trees.

[ACTION] The branches of the olive tree sway to the rhythm of the music and the wildflowers around the rock open their petals, turning toward ORPHEUS. EURYDICE walks up the dirt path of the hill, smiling, and sits down on the rock beside him. He keeps playing and looks at her with a warm smile.

[CAMERA] Medium shot, slow arc to the right around the two of them; steady and smooth.

[LIGHTING] Golden hour, warm sunlight from behind, gentle glow on their faces.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: The same soft lyre melody continues, a little warmer and fuller.
- SFX: A delicate sparkling sound as the flowers open, soft footsteps on the path.
- Ambient: Breeze, distant birdsong.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no club, no weapon, no other people.
```

## CS2 · O Casamento

Texto na tela: On a bright spring day, Orpheus and Eurydice were married under the old olive tree.

### 03 — O Casamento · cena 1 de 1 · `cena_03`

proporção 16:9 · imagem cheia. No jogo: CS2: Continua direto da CS1.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.
[CHARACTER: EURYDICE] A gentle young Greek woman around 19 years old, stylized 3D animated-film character, long straight golden-blonde hair falling down her back, a small crown of white flowers, a soft kind face with a faint smile, a white sleeveless ankle-length dress with a thin gold belt and a gold Greek key hem, thin leather sandals. Graceful and calm; often holds her hands together in front of her waist.
[CHARACTER: THE VILLAGE ELDER] A wise old Greek man around 75 years old, stylized 3D animated-film character, long white hair and a long white beard reaching his chest, bushy white eyebrows, warm tired eyes, slightly hunched back, a brown wool himation wrapped over a cream tunic, simple leather sandals, leaning on a tall gnarled wooden staff. Speaks slowly and kindly.

[SETTING] Some days later, a bright spring afternoon in a wide flowered meadow beside the same kind of ancient olive tree, now decorated with white flower garlands and ribbons. ORPHEUS, with his golden seven-string lyre hanging on his back, and EURYDICE stand in front of the tree facing each other; THE VILLAGE ELDER stands beside them leaning on his tall wooden staff.

[ACTION] ORPHEUS and EURYDICE hold hands and smile at each other. THE VILLAGE ELDER slowly raises his wooden staff above them in a blessing. White flower petals begin to fall gently from the sky around the three of them.

[CAMERA] Medium-wide shot, a crane slowly rising upward as the petals fall; steady and smooth.

[LIGHTING] Clear spring afternoon, soft bright sunlight, gentle warm tones.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: Festive lyre and flute wedding tune, joyful and light.
- SFX: The soft rustle of falling petals.
- Ambient: Distant cheerful cheering of a crowd far away, birds, light breeze.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no club, no weapon, no crowd visible in frame, no fourth person.
```

## CS3 · A Serpente de Sombra

Texto na tela: But at sunset, a serpent made of shadows crawled out of the ground...

### 04 — A Serpente de Sombra · cena 1 de 2 · `cena_04`

proporção 16:9 · imagem cheia. No jogo: CS3: Continua.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: EURYDICE] A gentle young Greek woman around 19 years old, stylized 3D animated-film character, long straight golden-blonde hair falling down her back, a small crown of white flowers, a soft kind face with a faint smile, a white sleeveless ankle-length dress with a thin gold belt and a gold Greek key hem, thin leather sandals. Graceful and calm; often holds her hands together in front of her waist.

[SETTING] The same wedding meadow at dusk, a few hours later: the white flower garlands have fallen onto the grass and the celebration is over. EURYDICE is alone in the meadow; the tall grass at the edge of the meadow is dark and still.

[ACTION] EURYDICE bends down and picks up a fallen white flower garland, looking at it with a soft smile. Behind her, deep in the tall dark grass, a serpent made of black smoke with two glowing cyan eyes slides slowly toward her, unseen by her.

[CAMERA] Low angle from inside the tall grass, slowly pushing forward toward her back; steady.

[LIGHTING] Dusk, violet and orange sky, long dark shadows across the meadow, the serpent's eyes glowing cyan.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: The music fades into a low, tense drone.
- SFX: A soft hiss and the rustle of the serpent moving through the grass.
- Ambient: Wind in the tall grass; the crickets suddenly go silent.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no real snake, the serpent is made only of black smoke, no other people.
```

### 05 — A Serpente de Sombra · cena 2 de 2 · `cena_05`

proporção 16:9 · imagem cheia. No jogo: CS3: Continua.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: EURYDICE] A gentle young Greek woman around 19 years old, stylized 3D animated-film character, long straight golden-blonde hair falling down her back, a small crown of white flowers, a soft kind face with a faint smile, a white sleeveless ankle-length dress with a thin gold belt and a gold Greek key hem, thin leather sandals. Graceful and calm; often holds her hands together in front of her waist.
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.

[SETTING] Seconds later, the same meadow at dusk. EURYDICE stands holding the fallen white garland, the black smoke serpent with cyan eyes right behind her in the grass. ORPHEUS stands in the background at the far edge of the meadow, holding his golden seven-string lyre.

[ACTION] The smoke serpent lunges and vanishes in a puff of dark smoke at her ankle. EURYDICE gasps softly, the garland slips from her hands, and she sinks slowly and gently down among the flowers, lying still with her eyes closed. In the background, ORPHEUS drops his golden lyre onto the grass and runs toward her.

[CAMERA] Medium shot on EURYDICE, rack focus to ORPHEUS running in the background; steady.

[LIGHTING] Dusk, violet and orange sky, soft dim light.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: The melody stops abruptly; a single low, sad note.
- SFX: A short hiss, the puff of smoke, the lyre strings vibrating as it hits the grass, running footsteps.
- Ambient: Wind in the grass, silence of the evening.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no wound, no bite marks, no blood, she simply sinks down gently, no club, no weapon.
```

## CS4 · O Rei do Submundo

Texto na tela: The serpent was sent by Hades, the King of the Underworld. He took Eurydice's soul down to the dark halls of Tartarus. Then he broke the golden lyre. Its seven strings flew across Greece like falling stars... ...and the colors of the world began to fade.

### 06 — O Rei do Submundo · cena 1 de 3 · `cena_06`

proporção 16:9 · imagem cheia. No jogo: CS4: Continua.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: THE KING OF THE UNDERWORLD] The stern king of the underworld from Greek myth, stylized 3D animated-film character, tall, regal and imposing, pale natural skin, black wavy shoulder-length hair and a short black beard, dark serious eyes with a faint cold cyan glint, a dark iron crown with sharp pointed spikes, long black and dark steel-blue robes with a silver Greek key border and a dark cloak, holding a tall dark iron two-pronged staff. Moves slowly and speaks coldly.
[CHARACTER: EURYDICE'S SOUL] The spirit of a gentle young Greek woman around 19 years old, stylized 3D animated-film character, exactly the same face, hair, flower crown and dress as the living woman, but translucent and softly glowing pale cyan from within, with a faint trail of light at the hem of her dress. Moves slowly, as if floating.

[SETTING] Night has fallen over the same meadow. The golden seven-string lyre lies on the grass where it was dropped. Among the flowers where EURYDICE fell, the ground is quiet and dark under a deep blue night sky.

[ACTION] The ground cracks open with a cold blue light. THE KING OF THE UNDERWORLD rises slowly out of the glowing crack. EURYDICE'S SOUL, translucent and glowing pale cyan, rises gently from the flowers and floats slowly toward him, coming to rest above his open hand.

[CAMERA] Wide low-angle shot, slow tilt upward following the king as he rises; steady.

[LIGHTING] Night, cold blue light shining up from the crack below, the soul glowing soft cyan.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: A ghostly, distant choir, low and cold.
- SFX: A deep rumble and the sound of earth cracking.
- Ambient: Night wind, no crickets.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no body lying on the ground, no second copy of the woman, no fire hair, no grey or blue skin on the king.
```

### 07 — O Rei do Submundo · cena 2 de 3 · `cena_07`

proporção 16:9 · imagem cheia. No jogo: CS4: Continua.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: THE KING OF THE UNDERWORLD] The stern king of the underworld from Greek myth, stylized 3D animated-film character, tall, regal and imposing, pale natural skin, black wavy shoulder-length hair and a short black beard, dark serious eyes with a faint cold cyan glint, a dark iron crown with sharp pointed spikes, long black and dark steel-blue robes with a silver Greek key border and a dark cloak, holding a tall dark iron two-pronged staff. Moves slowly and speaks coldly.
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.

[SETTING] The same meadow at night, a moment later. The glowing crack is still open behind THE KING OF THE UNDERWORLD; the soul has already vanished into the light of the crack. The golden seven-string lyre lies on the grass at his feet. ORPHEUS kneels on the grass a few steps away.

[ACTION] THE KING OF THE UNDERWORLD picks up the golden lyre from the grass and closes his hand around it. The seven strings snap one by one and shoot up into the night sky, each flying in a different direction like falling stars with golden trails. ORPHEUS, still kneeling, reaches out his hand toward the strings.

[CAMERA] Medium close-up on the lyre in the king's hand, then a tilt upward following the seven golden strings into the sky; steady.

[LIGHTING] Blue night light, cold blue glow from the crack, bright golden trails of the strings.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: Seven rising lyre notes, each one breaking off.
- SFX: Strings snapping, whooshes as the strings fly away.
- Ambient: Night wind.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no fire hair, no grey or blue skin on the king, no club, no weapon in the young man's hands.
```

### 08 — O Rei do Submundo · cena 3 de 3 · `cena_08`

proporção 16:9 · imagem cheia. No jogo: CS4: Continua.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.

[SETTING] The same meadow at night, moments later. THE KING OF THE UNDERWORLD has gone down into the glowing blue crack, which is starting to close. ORPHEUS kneels alone on the grass, holding the empty golden frame of the lyre with no strings.

[ACTION] The blue crack in the ground closes completely and the light disappears. ORPHEUS stays kneeling alone, holding the empty lyre frame against his chest. Around him, the flowers and grass slowly lose their color and turn grey, the color draining away across the meadow.

[CAMERA] Slow pull-back from a medium shot to a wide shot of him alone in the meadow; steady.

[LIGHTING] Pale moonlight, the image gradually losing its saturation until almost grey.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: Silence, then one low, sad note.
- SFX: The soft grinding of the crack closing.
- Ambient: Cold wind across the empty meadow.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no strings on the lyre frame, no club, no weapon, no other people.
```

## CS5 · O Juramento

Texto na tela: At dawn, Orpheus made a promise: "I will find the seven strings. I will play our song again. And I will bring you home."

### 09 — O Juramento · cena 1 de 1 · `cena_09`

proporção 16:9 · imagem cheia. No jogo: CS5: Fim da abertura; corta para o vilarejo (o jogo começa).

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.

[SETTING] Dawn after that long night. On the top of the hill, the meadow around him still looks faded and greyish, but the sunrise sky is warm gold. ORPHEUS stands with the empty golden lyre frame, without strings, strapped on his back; a road winds down the hill toward Mount Olympus far away on the horizon.

[ACTION] ORPHEUS looks toward Mount Olympus in the distance. Above the far forest, a tiny golden light blinks, like a spark. He closes his fist with determination and begins to walk down the road.

[CAMERA] Over-the-shoulder shot from behind him, then a slow push past him toward the horizon; steady.

[LIGHTING] Sunrise, warm golden light on the horizon, soft cool shadows on the faded grass.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: A heroic theme slowly rising.
- SFX: A tiny chime as the golden light blinks, footsteps on the dirt road.
- Ambient: Morning birdsong, light wind.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no strings on the lyre frame, no club, no weapon in his hands, no other people.
```

## CS6 · O Raio de Zeus

Sem narração: o diálogo do jogo continua depois do clipe.

### 10 — O Raio de Zeus · cena 1 de 1 · `cena_10`

proporção 16:9 · imagem cheia. No jogo: CS6: Primeira vez que Orfeu entra no Templo de Zeus (antes do diálogo).

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.
[CHARACTER: ZEUS] The king of the gods, stylized 3D animated-film character, a towering broad-shouldered old man with long flowing white hair and a full white beard, a golden laurel crown, stern majestic eyes, white robes with gold trim draped over one shoulder and a deep blue sash, one muscular arm bare, golden sandals, holding a crackling golden lightning bolt in his right hand.

[SETTING] Some days later, night, inside a grand marble temple hall with tall columns and a stone altar at the far end. ORPHEUS enters holding a wooden club in his right hand, the empty golden lyre frame strapped on his back.

[ACTION] ORPHEUS walks into the hall and stops. A bolt of lightning strikes the stone altar in a flash of white and gold light, and in the flash ZEUS appears, huge, floating above the floor with the crackling golden lightning bolt in his right hand, looking down at ORPHEUS.

[CAMERA] Low angle from behind ORPHEUS, fast push-in toward the flash at the altar.

[LIGHTING] Dark temple lit by a few braziers, then a bright white-gold flash and a golden glow around ZEUS.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: A choir swelling, grand and solemn.
- SFX: Thunder crack, long echo in the stone hall.
- Ambient: Quiet temple, faint fire crackle from the braziers.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no strings on the lyre frame, no other gods, no other people.
```

## CS7 · O Javali de Erimanto

Texto na tela: Deep in the forest, the first string shone on the tusk of a monster.

### 11 — O Javali de Erimanto · cena 1 de 1 · `cena_11`

proporção 16:9 · imagem cheia. No jogo: CS7: Entrada no Covil do Javali (antes da luta).

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.
[CHARACTER: THE GIANT BOAR] A huge mythical wild boar, stylized 3D animated-film creature, as tall at the shoulder as a grown man, dark reddish-brown bristly fur, a tall bristly mane along its spine, long curved ivory tusks, one tusk wrapped with a single thin glowing golden lyre string, small fierce red eyes, a scarred snout, steam puffing from its nostrils.

[SETTING] Later, in a deep forest cave lit by wall torches and glowing cyan crystals. ORPHEUS walks in holding the wooden club in his right hand, the empty golden lyre frame strapped on his back; a dark tunnel opens at the far end of the cave.

[ACTION] Out of the dark tunnel comes THE GIANT BOAR, steam puffing from its nostrils; a thin golden lyre string glows around one of its tusks. The boar scrapes the ground with its front hoof and roars. ORPHEUS raises his club, ready.

[CAMERA] Wide shot of the cave, then a fast push-in to the boar's face and the glowing string on its tusk.

[LIGHTING] Warm flickering torchlight and cold cyan glow from the crystals, a golden glint on the tusk.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: A tense, driving drum rhythm building up.
- SFX: Heavy hoofsteps, snorting, a loud roar, small stones falling.
- Ambient: Echoing cave, dripping water.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no blood, no other animals, no other people.
```

## CS8 · A Primeira Corda

Texto na tela: The first string came home. One clear note rang out, and color returned to the forest.

### 12 — A Primeira Corda · cena 1 de 2 · `cena_12`

proporção 16:9 · imagem cheia. No jogo: CS8: Logo depois de vencer o javali.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.
[CHARACTER: THE GIANT BOAR] A huge mythical wild boar, stylized 3D animated-film creature, as tall at the shoulder as a grown man, dark reddish-brown bristly fur, a tall bristly mane along its spine, long curved ivory tusks, one tusk wrapped with a single thin glowing golden lyre string, small fierce red eyes, a scarred snout, steam puffing from its nostrils.

[SETTING] The same torchlit cave right after the fight. THE GIANT BOAR is tired and lies down on the cave floor, unhurt, the golden string still glowing on its tusk. ORPHEUS stands a few steps away holding his wooden club, the empty golden lyre frame on his back.

[ACTION] THE GIANT BOAR glows softly and shrinks down until it becomes a small, harmless, cute piglet that squeaks and runs away into the tunnel. The golden string unwinds from the tusk and floats slowly through the air into ORPHEUS's open left hand.

[CAMERA] Medium shot, slow orbit around them; steady.

[LIGHTING] Torchlight, a warm golden glow coming from the floating string.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: A gentle music-box motif.
- SFX: A magical shimmer as the boar shrinks, a small squeak of the piglet, soft sparkle of the string.
- Ambient: Quiet cave, torches crackling.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no blood, no wounds, no dead animal, no other people.
```

### 13 — A Primeira Corda · cena 2 de 2 · `cena_13`

proporção 16:9 · imagem cheia. No jogo: CS8: Logo depois de vencer o javali.

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.

[SETTING] Later that night, in the forest of Arcadia, where the trees and flowers are all grey and colorless. ORPHEUS kneels holding the golden lyre frame and the single glowing golden string; his wooden club lies on the ground beside him.

[ACTION] ORPHEUS ties the golden string onto the lyre, so the lyre now has ONE string, and plucks it once. A clear note rings out and a wave of golden light spreads from the lyre across the forest; the grey trees and flowers turn green and colorful again as the wave passes, and fireflies rise into the air.

[CAMERA] Close-up on his hand plucking the single string, then a fast pull-back to a wide shot of the forest regaining its color.

[LIGHTING] Grey moonlit night that turns warm and colorful as the golden wave passes.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: One bright, clear lyre note, then a warm swell.
- SFX: A whoosh of color spreading, a soft sparkle of fireflies.
- Ambient: Forest sounds returning: crickets, leaves, a night bird.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, the lyre has only one string, no seven strings, no other people.
```

## CS9 · O Mensageiro dos Deuses

Sem narração: o diálogo do jogo continua depois do clipe.

### 14 — O Mensageiro dos Deuses · cena 1 de 1 · `cena_14`

proporção 16:9 · imagem cheia. No jogo: CS9: Entrada no Santuário de Hermes (antes do diálogo).

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.
[CHARACTER: THE MESSENGER GOD] A young messenger god from Greek myth, stylized 3D animated-film character, youthful and slim, curly brown hair under a round golden traveler's hat with two small white wings, a playful confident smile, a light-blue short chiton with gold trim, a small white cloak pinned at one shoulder, golden sandals with small white wings at the ankles, holding a slender golden herald's staff with two thin golden serpents coiled around it and small wings at the top. Light on his feet, always a little in motion.

[SETTING] Some days later, a clear bright day at a white marble sanctuary high above the clouds. ORPHEUS stands on the marble floor with his wooden club lowered at his side and the golden lyre with a single string strapped on his back.

[ACTION] A gust of wind scatters white feathers across the marble floor. THE MESSENGER GOD lands lightly on the floor in front of ORPHEUS, makes a playful bow, and holds out a pair of golden sandals with small white wings.

[CAMERA] Medium-wide shot from a slight low angle; the god lands inside the frame; steady.

[LIGHTING] Bright clear daylight, sunbeams coming from the upper left, soft white clouds below.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: A light, playful flute tune.
- SFX: A gust of wind, flapping of small wings as he lands.
- Ambient: High wind above the clouds.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no other gods, no other people, the lyre has only one string.
```

## CS10 · Fim da Parte 1

Texto na tela: With the winged sandals, Orpheus set out for Attica. Far below, in the silent Underworld, the King was watching... and his Queen wept for a spring she could not see. And in the darkest hall of Tartarus, Eurydice began to hum a song she had not forgotten. END OF PART 1

### 15 — Fim da Parte 1 · cena 1 de 3 · `cena_15`

proporção 16:9 · imagem cheia. No jogo: CS10: Depois de ganhar as sandálias (substitui a tela de fim atual).

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: ORPHEUS] A young Greek hero around 20 years old, stylized 3D animated-film character, slim athletic build, defined jaw, kind but determined brown eyes, short wavy auburn hair, a bright scarlet headband tied at the back with two long tails, a white short sleeveless chiton ending above the knee with a gold Greek key trim and a brown leather shoulder strap, a brown leather belt with a round bronze buckle, a short crimson cape hanging from his shoulders, bronze bracers on both forearms, brown leather sandals laced up to the calves. Calm, brave posture; moves lightly and decisively.

[SETTING] Later the same clear day, the green hills of Arcadia, full of color again, a small stream and a low stone wall ahead, the mountains of Attica on the horizon. ORPHEUS now wears the golden winged sandals, the wooden club in his right hand and the golden lyre with a single string on his back.

[ACTION] ORPHEUS runs to the right across the hills and, with the winged sandals, leaps high over the stream and then over the stone wall, the small wings on his sandals flapping on each jump, heading toward the mountains on the horizon.

[CAMERA] Side tracking shot moving right with him, like a platform game framing; smooth.

[LIGHTING] Clear bright afternoon, rich saturated colors.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: A heroic adventure theme.
- SFX: Wind rushing, a flap of small wings on each jump, footsteps on grass, a splash of the stream below.
- Ambient: Open hills, birds, breeze.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no other people, no flying horse.
```

### 16 — Fim da Parte 1 · cena 2 de 3 · `cena_16`

proporção 16:9 · imagem cheia. No jogo: CS10: Depois de ganhar as sandálias (substitui a tela de fim atual).

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: THE KING OF THE UNDERWORLD] The stern king of the underworld from Greek myth, stylized 3D animated-film character, tall, regal and imposing, pale natural skin, black wavy shoulder-length hair and a short black beard, dark serious eyes with a faint cold cyan glint, a dark iron crown with sharp pointed spikes, long black and dark steel-blue robes with a silver Greek key border and a dark cloak, holding a tall dark iron two-pronged staff. Moves slowly and speaks coldly.
[CHARACTER: THE QUEEN OF THE UNDERWORLD] A graceful, sad young queen of the underworld from Greek myth, stylized 3D animated-film character, long dark brown hair braided with small withered spring flowers, gentle green eyes, pale skin, a deep green and gold ankle-length gown with a thin silver crown, holding a single wilted pomegranate blossom in her hands.

[SETTING] Far below, in the dark throne hall of the underworld: black stone, blue flames and a glowing cyan river. THE KING OF THE UNDERWORLD sits on his dark throne, looking into a round glowing pool of water beside it. THE QUEEN OF THE UNDERWORLD stands next to the throne.

[ACTION] In the glowing pool, a small moving image shows a young hero with a red headband running across green hills. THE QUEEN OF THE UNDERWORLD holds a wilted pomegranate blossom in her hands and looks at it sadly; a single tear falls onto its petals.

[CAMERA] Slow push-in from the glowing pool to the queen's face; steady.

[LIGHTING] Cold cyan light from the river and the pool, blue flames, deep shadows.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Music: A low dark drone with one very distant lyre note.
- SFX: Soft water drops, the tear landing on the petals.
- Ambient: Deep echoing hall, faint crackle of blue flames.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no fire hair, no grey or blue skin on the king, no other people.
```

### 17 — Fim da Parte 1 · cena 3 de 3 · `cena_17`

proporção 16:9 · imagem cheia. No jogo: CS10: Depois de ganhar as sandálias (substitui a tela de fim atual).

```
[STYLE] Stylized 3D animated film, premium 2.5D game cinematic, soft global illumination, hand-painted textures, rich harmonious colors, gentle depth of field, smooth natural motion, 16:9.

[REFERENCE] The attached images show the exact look of the characters and, when included, of the place: keep faces, hair, clothes and colors identical to them.

[CHARACTERS]
[CHARACTER: EURYDICE'S SOUL] The spirit of a gentle young Greek woman around 19 years old, stylized 3D animated-film character, exactly the same face, hair, flower crown and dress as the living woman, but translucent and softly glowing pale cyan from within, with a faint trail of light at the hem of her dress. Moves slowly, as if floating.

[SETTING] Deeper still, the darkest hall of the underworld: a black cavern crossed by thin chains of faint light. EURYDICE'S SOUL sits alone on the stone floor, hugging her knees, glowing soft pale cyan.

[ACTION] EURYDICE'S SOUL hears a faint distant note, slowly lifts her head, and begins to hum softly with her lips closed. A tiny golden spark lights up in the darkness in front of her.

[CAMERA] Slow push-in to her face; steady.

[LIGHTING] Near darkness, soft cyan glow from her body, a small warm golden spark.

[AUDIO]
- Dialogue: none, nobody speaks.
- Narrator: none.
- Voice: EURYDICE'S SOUL hums a soft wordless melody with her lips closed, a gentle female humming, no words.
- Music: Silence, then a faint, distant lyre note.
- SFX: A tiny chime as the golden spark appears.
- Ambient: Deep, quiet cavern with a very faint echo.

[NEGATIVE] no morphing, no character blending, no extra characters, no duplicated people, no text on screen, no subtitles, no title cards, no watermark, no logo, no distorted hands, no face changing between frames, no camera shake, no pixel art, no photorealism, no blood, no gore, no other people, no king, no chains on her.
```
