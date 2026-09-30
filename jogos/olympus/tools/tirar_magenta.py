# Usage: python tirar_magenta.py <in.jpg|png> <out.png> [--check <preview.png>]
#        python tirar_magenta.py --batch <in1> <out1> <in2> <out2> ... [--check <sheet.png>]
# Removes the magenta background from a Flow image and crops to the subject.
# Flow rarely gives a flat #FF00FF: it paints a pink studio backdrop, darker at the edges and different
# on every image (from bright magenta to a dull mauve). So the key is the pixel's magenta HUE strength,
# (min(R,B) - G) / brightness, measured against the backdrop's own value taken from the image border.
# Dark magenta floor shadows go with the backdrop. Edges keep a soft alpha, and the pink that bleeds
# into the subject's rim is pulled back (despill).
import sys
import numpy as np
from PIL import Image

MARGIN = 8     # px of empty border kept around the subject after cropping
DARK = 60.0    # brightness floor, so near-black pixels (hair, robes) don't read as magenta by noise


def key(src):
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = np.minimum(r, b) - g
    ratio = m / np.maximum(rgb.max(axis=2), DARK)
    border = np.concatenate([ratio[:8].ravel(), ratio[-8:].ravel(), ratio[:, :8].ravel(), ratio[:, -8:].ravel()])
    bg = float(np.median(border))
    if bg < 0.25:
        raise SystemExit(f'{src}: the border is not magenta (hue strength {bg:.2f})')
    lo, hi = 0.35 * bg, 0.75 * bg
    alpha = np.clip((hi - ratio) / (hi - lo), 0.0, 1.0)

    spill = np.clip(m, 0, None) * (alpha > 0)
    out = rgb.copy()
    out[..., 0] -= spill
    out[..., 2] -= spill
    out = np.clip(out, 0, 255)

    a8 = (alpha * 255).round().astype(np.uint8)
    ys, xs = np.where(a8 > 16)
    if len(xs) == 0:
        raise SystemExit(f'{src}: nothing left after keying')
    h, w = a8.shape
    x0, x1 = max(xs.min() - MARGIN, 0), min(xs.max() + MARGIN + 1, w)
    y0, y1 = max(ys.min() - MARGIN, 0), min(ys.max() + MARGIN + 1, h)
    return Image.fromarray(np.dstack([out.astype(np.uint8), a8])[y0:y1, x0:x1], 'RGBA'), bg


def sheet(imgs, path, height=560):
    # every subject over a light and a dark ground, side by side, to judge the edges
    tiles = []
    for img in imgs:
        s = height / img.height
        im = img.resize((max(1, round(img.width * s)), height), Image.LANCZOS)
        pair = Image.new('RGB', (im.width * 2 + 12, height), (235, 238, 242))
        pair.paste((28, 30, 40), (im.width + 12, 0, im.width * 2 + 12, height))
        pair.paste(im, (0, 0), im)
        pair.paste(im, (im.width + 12, 0), im)
        tiles.append(pair)
    total = Image.new('RGB', (sum(t.width for t in tiles) + 16 * (len(tiles) - 1), height), (90, 90, 90))
    x = 0
    for t in tiles:
        total.paste(t, (x, 0))
        x += t.width + 16
    total.thumbnail((2400, 2400))
    total.save(path)


args = sys.argv[1:]
check = None
if '--check' in args:
    i = args.index('--check')
    check = args[i + 1]
    args = args[:i] + args[i + 2:]
pairs = list(zip(args[1::2], args[2::2])) if args and args[0] == '--batch' else [(args[0], args[1])]
done = []
for src, dst in pairs:
    img, bg = key(src)
    img.save(dst, optimize=True)
    done.append(img)
    print(f'{dst}: {img.width}x{img.height} (backdrop hue strength {bg:.2f})')
if check:
    sheet(done, check)
