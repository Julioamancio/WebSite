"""Cria o quadro de olho fechado (<nome>_blink) a partir do idle_0 de uma folha montada.

Uso: python autosprite_piscar.py <folha> <nome_blink> x0 y0 x1 y1 [preview.png]
  <folha>  = assets/sprites/<folha>.png/.json (saída do autosprite_montar.py)
  x0..y1   = caixa do olho dentro do quadro 0 (pixels da folha)
Pinta a pele por cima do olho (interpolando a pele logo acima e logo abaixo de cada coluna)
e desenha a linha dos cílios; acrescenta o quadro no fim da folha e no JSON. Não gasta crédito.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPR = os.path.join(ROOT, 'assets', 'sprites')
folha, nome = sys.argv[1], sys.argv[2]
x0, y0, x1, y1 = map(int, sys.argv[3:7])
prev = sys.argv[7] if len(sys.argv) > 7 else None
meta = json.load(open(os.path.join(SPR, folha + '.json')))
sheet = Image.open(os.path.join(SPR, folha + '.png')).convert('RGBA')
w, h = meta['w'], meta['h']
first = next(iter(meta['frames'].values()))
fr = sheet.crop((first['x'], 0, first['x'] + w, h))
px = fr.load()
lid = fr.copy()
lp = lid.load()
for x in range(x0, x1 + 1):
    top, bot = px[x, y0 - 1], px[x, y1 + 1]
    for y in range(y0, y1 + 1):
        t = (y - y0 + 1) / (y1 - y0 + 2)
        lp[x, y] = tuple(round(top[i] * (1 - t) + bot[i] * t) for i in range(3)) + (px[x, y][3],)
# máscara elíptica suave só na área do olho
mask = Image.new('L', fr.size, 0)
ImageDraw.Draw(mask).ellipse((x0, y0, x1, y1), fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(0.8))
out = Image.composite(lid, fr, mask)
# cílios: arco fino na parte de baixo do olho
d = ImageDraw.Draw(out)
ly = y0 + round((y1 - y0) * 0.62)
d.line([(x0 + 1, ly - 1), ((x0 + x1) // 2, ly + 1), (x1, ly)], fill=(92, 50, 38, 255), width=2, joint='curve')
meta['frames'] = {k: v for k, v in meta['frames'].items() if k != nome}
n = len(meta['frames'])
new = Image.new('RGBA', (w * (n + 1), h), (0, 0, 0, 0))
for i, (k, v) in enumerate(meta['frames'].items()):
    new.paste(sheet.crop((v['x'], 0, v['x'] + w, h)), (i * w, 0))
    v['x'] = i * w
new.paste(out, (n * w, 0))
meta['frames'][nome] = {'x': n * w, 'y': 0, 'src': 'idle_0 + pálpebra pintada'}
new.save(os.path.join(SPR, folha + '.png'), optimize=True)
json.dump(meta, open(os.path.join(SPR, folha + '.json'), 'w'), indent=1)
if prev:
    bx = (max(0, x0 - 40), max(0, y0 - 30), min(w, x1 + 40), min(h, y1 + 30))
    a, b = fr.crop(bx), out.crop(bx)
    s = 6
    p = Image.new('RGBA', (a.width * s * 2 + 10, a.height * s), (235, 235, 235, 255))
    p.alpha_composite(a.resize((a.width * s, a.height * s), Image.LANCZOS), (0, 0))
    p.alpha_composite(b.resize((b.width * s, b.height * s), Image.LANCZOS), (a.width * s + 10, 0))
    p.save(prev)
print(folha, '+', nome)
