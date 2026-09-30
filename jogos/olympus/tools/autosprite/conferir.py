"""python conferir.py raw/<nome>  -> <nome>_conf.png (contato) + métricas por quadro."""
import json, sys
from PIL import Image, ImageDraw
base = sys.argv[1]
sheet = Image.open(base + '.png').convert('RGBA')
atlas = json.load(open(base + '.json'))
fr = atlas['frames']
keys = sorted(fr, key=lambda k: int(k))
frames, stats = [], []
for k in keys:
    f = fr[k]
    im = sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h']))
    a = im.getchannel('A').point(lambda v: 255 if v > 40 else 0)
    bb = a.getbbox()
    frames.append(im)
    stats.append(bb)
    # componentes: colunas vazias no meio do bbox indicam objeto separado
print('quadro  esq  topo  dir  base  altura largura')
hs = []
for k, bb in zip(keys, stats):
    if bb:
        hs.append(bb[3] - bb[1])
        print(f'{k:>5} {bb[0]:>5} {bb[1]:>5} {bb[2]:>5} {bb[3]:>5} {bb[3]-bb[1]:>6} {bb[2]-bb[0]:>6}')
    else:
        print(f'{k:>5} VAZIO')
if hs: print('altura min/max', min(hs), max(hs), 'variação %.1f%%' % (100 * (max(hs) - min(hs)) / max(hs)))
# contato
W = 192; cols = 8; rows = (len(frames) + cols - 1) // cols
S = frames[0].size[0]
out = Image.new('RGB', (cols * W, rows * (W + 16)), (40, 40, 48))
d = ImageDraw.Draw(out)
for i, (im, bb) in enumerate(zip(frames, stats)):
    bg = Image.new('RGBA', im.size, (0, 0, 0, 0))
    ch = Image.new('RGBA', im.size)
    cd = ImageDraw.Draw(ch)
    for y in range(0, S, 48):
        for x in range(0, S, 48):
            cd.rectangle((x, y, x + 47, y + 47), fill=(200, 200, 200) if (x // 48 + y // 48) % 2 else (235, 235, 235))
    ch.alpha_composite(im)
    t = ch.convert('RGB').resize((W, W), Image.LANCZOS)
    x0, y0 = (i % cols) * W, (i // cols) * (W + 16)
    out.paste(t, (x0, y0 + 16))
    d.text((x0 + 3, y0 + 2), f'{keys[i]}  h={bb[3]-bb[1] if bb else 0}', fill=(255, 255, 0))
    # linha do chão de referência (base do quadro 0)
    if stats[0]:
        gy = y0 + 16 + int(stats[0][3] * W / S)
        d.line((x0, gy, x0 + W, gy), fill=(255, 0, 0))
out.save(base + '_conf.png')
# zoom da cabeça (para piscada): recorta faixa superior de cada quadro
if stats[0]:
    bb0 = stats[0]; hh = bb0[3] - bb0[1]
    box = (bb0[0] + int((bb0[2] - bb0[0]) * 0.35), bb0[1], bb0[2], bb0[1] + int(hh * 0.14))
    heads = [f.crop(box) for f in frames]
    hw, hh2 = heads[0].size
    sc = 110 / hh2
    hw2, hh3 = int(hw * sc), 110
    hc = 8
    ho = Image.new('RGB', (hc * hw2, ((len(heads) + hc - 1) // hc) * (hh3 + 14)), (40, 40, 48))
    hd = ImageDraw.Draw(ho)
    for i, h in enumerate(heads):
        b = Image.new('RGBA', h.size, (220, 220, 220, 255)); b.alpha_composite(h)
        x0, y0 = (i % hc) * hw2, (i // hc) * (hh3 + 14)
        ho.paste(b.convert('RGB').resize((hw2, hh3), Image.LANCZOS), (x0, y0 + 14))
        hd.text((x0 + 3, y0 + 1), keys[i], fill=(255, 255, 0))
    ho.save(base + '_rosto.png')
