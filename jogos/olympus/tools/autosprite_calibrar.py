"""Per-animation size calibration.

Every AutoSprite clip starts from the character's base pose (standing). The zoom of the generated video varies from
clip to clip, so one scale per character makes some animations bigger than others (the punch came out 20% taller).
This writes "stand" (standing height in sheet pixels, measured on frame 0 of the raw clip) into each final sheet
json; preparar_web.py puts it in the manifest and hd.js scales every sheet so that height is the same.

Usage: python autosprite_calibrar.py <raw_dir> <escolhas1.json> [escolhas2.json ...]   (later files win)
"""
import json, os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'assets', 'sprites')
raw_dir = sys.argv[1]
src = {}
for f in sys.argv[2:]:
    for out_name, s in json.load(open(f, encoding='utf-8')).items():
        src[out_name] = s['raw']
cache = {}


def stand_of(raw):
    if raw not in cache:
        sheet = Image.open(os.path.join(raw_dir, raw + '.png')).convert('RGBA')
        f = json.load(open(os.path.join(raw_dir, raw + '.json')))['frames']['0']
        bb = sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])).getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        cache[raw] = bb[3] - bb[1]
    return cache[raw]


for out_name, raw in sorted(src.items()):
    p = os.path.join(OUT, out_name + '.json')
    if not os.path.exists(p):
        print('sem folha:', out_name); continue
    m = json.load(open(p))
    m['stand'] = stand_of(raw)
    json.dump(m, open(p, 'w'), indent=1)
    print(f'{out_name:24} em pé = {m["stand"]} px (clipe {raw})')
