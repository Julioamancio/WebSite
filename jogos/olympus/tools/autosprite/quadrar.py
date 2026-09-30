"""Centraliza cada base num quadrado transparente: figura = 72% da altura, pés em 90%."""
from PIL import Image
import sys
SRC = r'C:\Users\julio\Documents\website\jogos\olympus\assets\personagens'
for n in sys.argv[1:]:
    im = Image.open(fr'{SRC}\{n}.png').convert('RGBA')
    bb = im.getchannel('A').point(lambda v: 255 if v > 10 else 0).getbbox()
    fig = im.crop(bb)
    fw, fh = fig.size
    S = round(fh / 0.72)
    S = max(S, round(fw / 0.9))
    can = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    x = (S - fw) // 2
    y = round(S * 0.90) - fh
    can.alpha_composite(fig, (x, y))
    can.save(fr'{SRC}\{n}_sq.png')
    print(n, 'fig', fw, fh, '-> canvas', S)
