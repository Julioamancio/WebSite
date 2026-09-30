"""Monta as folhas finais do AutoSprite com os nomes que o motor usa.

Uso: python autosprite_montar.py <raw_dir> <escolhas.json>

escolhas.json = { "<arquivo_saida>": { "raw": "<nome da folha bruta>", "char": "<personagem>",
                                       "frames": { "<nome no motor>": <índice do quadro>, ... } } }

Para cada saída grava assets/sprites/<arquivo_saida>.png (quadros lado a lado, todos com a
mesma caixa) e <arquivo_saida>.json:
  { "image": "...png", "w": W, "h": H, "ax": AX, "ay": AY, "frames": { nome: {"x":..,"y":0} } }
ax/ay = pés do personagem (centro da sola no idle quadro 0), iguais em todos os quadros.
As folhas brutas vêm do AutoSprite reextraídas no máximo (768x768, tier turbo).
"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'sprites')
raw_dir, spec_path = sys.argv[1], sys.argv[2]
spec = json.load(open(spec_path, encoding='utf-8'))
PAD = 6
_cache = {}


def frames_of(raw):
    if raw not in _cache:
        sheet = Image.open(os.path.join(raw_dir, raw + '.png')).convert('RGBA')
        at = json.load(open(os.path.join(raw_dir, raw + '.json')))['frames']
        _cache[raw] = [sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])) for _, f in sorted(at.items(), key=lambda kv: int(kv[0]))]
    return _cache[raw]


def alpha_bbox(im, thr=40):
    return im.getchannel('A').point(lambda v: 255 if v > thr else 0).getbbox()


def feet_anchor(char, raw=None):
    """Centro da sola no quadro 0 do idle do personagem (coordenadas do quadro 768).
    `raw` escolhe outra folha de referência (ex.: as da lira, que têm outro enquadramento)."""
    if not raw:
        raw = char + '_idle' if os.path.exists(os.path.join(raw_dir, char + '_idle.png')) else char + '_walk'
    im = frames_of(raw)[0]
    bb = alpha_bbox(im)
    band = im.crop((0, bb[3] - 12, im.width, bb[3]))
    fb = alpha_bbox(band)
    return (fb[0] + fb[2]) / 2, bb[3]


for out_name, s in spec.items():
    fr = frames_of(s['raw'])
    names = list(s['frames'])
    chosen = [fr[s['frames'][n]] for n in names]
    ax0, ay0 = feet_anchor(s['char'], s.get('anchor_raw'))
    if s.get('center'):  # voadores (morcego): cada quadro centrado no mesmo ponto, âncora no centro do corpo
        b0 = alpha_bbox(chosen[0])
        ax0, ay0 = (b0[0] + b0[2]) / 2, round((b0[1] + b0[3]) / 2)
        moved = []
        for im in chosen:
            b = alpha_bbox(im)
            cv = Image.new('RGBA', im.size, (0, 0, 0, 0))
            cv.paste(im, (round(ax0 - (b[0] + b[2]) / 2), round(ay0 - (b[1] + b[3]) / 2)))
            moved.append(cv)
        chosen = moved
    if s.get('pes'):
        # no ar a física do motor é quem sobe o personagem: desce cada quadro até os pés tocarem ay0
        moved = []
        for im in chosen:
            dy = ay0 - alpha_bbox(im)[3]
            c = Image.new('RGBA', im.size, (0, 0, 0, 0))
            c.paste(im, (0, dy))
            moved.append(c)
        chosen = moved
    boxes = [alpha_bbox(im) for im in chosen]
    x0 = max(0, min(b[0] for b in boxes) - PAD)
    y0 = max(0, min(b[1] for b in boxes) - PAD)
    x1 = min(chosen[0].width, max(max(b[2] for b in boxes) + PAD, int(ax0) + 1))
    y1 = min(chosen[0].height, max(max(b[3] for b in boxes), ay0) + PAD)
    w, h = x1 - x0, y1 - y0
    sheet = Image.new('RGBA', (w * len(chosen), h), (0, 0, 0, 0))
    meta = {'image': out_name + '.png', 'w': w, 'h': h, 'ax': round(ax0 - x0), 'ay': ay0 - y0, 'frames': {}}
    # standing height on frame 0 of the raw clip (every clip starts from the base pose): hd.js scales by it
    b0 = alpha_bbox(fr[0]); meta['stand'] = b0[3] - b0[1]
    for i, (n, im) in enumerate(zip(names, chosen)):
        sheet.paste(im.crop((x0, y0, x1, y1)), (i * w, 0))
        meta['frames'][n] = {'x': i * w, 'y': 0, 'src': s['frames'][n]}
    sheet.save(os.path.join(OUT, out_name + '.png'), optimize=True)
    json.dump(meta, open(os.path.join(OUT, out_name + '.json'), 'w'), indent=1)
    print(f'{out_name}: {len(chosen)} quadros {w}x{h} ax={meta["ax"]} ay={meta["ay"]}')
