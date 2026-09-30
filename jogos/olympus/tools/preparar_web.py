"""Gera versões leves (WebP) dos cenários do Flow para o navegador, em assets/web/.

Uso: python preparar_web.py
Camadas com fundo magenta passam pelo tirar_magenta.key (alpha suave, corta só o vazio de cima)
e são desenhadas alinhadas pela base. Tudo é reduzido para no máximo 1080 px de altura.
"""
import os, sys
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, 'assets', 'cenarios')
OUT = os.path.join(ROOT, 'assets', 'web')
os.makedirs(OUT, exist_ok=True)

import numpy as np


def key_camada(src):
    """Mesma chave do tirar_magenta.py, mas o fundo é medido só na borda de CIMA
    (nas camadas de parallax a borda de baixo é chão). Corta só o vazio de cima."""
    rgb = np.asarray(Image.open(src).convert('RGB')).astype(np.float32)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = np.minimum(r, b) - g
    ratio = m / np.maximum(rgb.max(axis=2), 60.0)
    forte = ratio[ratio > 0.25]  # fundo = mediana dos pixels claramente magenta (há folhas tocando a borda)
    if forte.size < ratio.size * 0.05:
        raise SystemExit(f'{src}: quase nada magenta na imagem')
    bg = float(np.median(forte))
    lo, hi = 0.35 * bg, 0.75 * bg
    alpha = np.clip((hi - ratio) / (hi - lo), 0.0, 1.0)
    spill = np.clip(m, 0, None) * (alpha > 0)
    out = rgb.copy()
    out[..., 0] -= spill
    out[..., 2] -= spill
    a8 = (alpha * 255).round().astype(np.uint8)
    ys = np.where(a8.max(axis=1) > 16)[0]
    y0 = max(int(ys.min()) - 8, 0)
    return Image.fromarray(np.dstack([np.clip(out, 0, 255).astype(np.uint8), a8])[y0:], 'RGBA')


CAMADAS = ['floresta_longe', 'floresta_meio', 'floresta_perto', 'vila_longe', 'vila_meio', 'vila_perto']
INTEIRAS = ['floresta_ceu', 'titulo', 'historia_casamento', 'historia_serpente', 'historia_juramento',
            'templo_zeus', 'caverna_fundo', 'santuario_hermes', 'submundo']
H = 1080


def salvar(img, nome):
    s = min(1.0, H / img.height) if img.height >= img.width else min(1.0, 1920 / img.width, H / img.height)
    if nome in CAMADAS:
        s = H / 2048  # mesma escala para todas as camadas: a altura original do quadro era 2048
    im = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
    p = os.path.join(OUT, nome + '.webp')
    im.save(p, 'WEBP', quality=86, method=6)
    print(f'{nome}.webp {im.width}x{im.height} {os.path.getsize(p) // 1024} KB')


FACHADAS = ['casa_vila', 'casa_anciao', 'barraca_mercadora', 'templo_zeus_fachada', 'entrada_caverna']
SPR_SRC = os.path.join(ROOT, 'assets', 'sprites')
SPR_OUT = os.path.join(OUT, 'sprites')
SPR_ESCALA = 0.5  # o corpo fica com ~275 px: sobra resolução para o Orfeu de ~200 px em 1080p


def fachadas():
    import importlib.util
    spec = importlib.util.spec_from_file_location('tm', os.path.join(HERE, 'tirar_magenta.py'))
    tm = importlib.util.module_from_spec(spec)
    argv, sys.argv = sys.argv, [sys.argv[0], '--batch']  # sem pares o bloco de linha de comando não faz nada
    try:
        spec.loader.exec_module(tm)
    finally:
        sys.argv = argv
    for n in FACHADAS:
        img, _ = tm.key(os.path.join(SRC, n + '.jpg'))
        s = 900 / max(img.size)
        im = img.resize((round(img.width * s), round(img.height * s)), Image.LANCZOS)
        p = os.path.join(OUT, n + '.webp')
        im.save(p, 'WEBP', quality=88, method=6)
        print(f'{n}.webp {im.width}x{im.height} {os.path.getsize(p) // 1024} KB')


def sprites():
    """Folhas finais -> WebP na metade + manifest.js (window.OLY_SPRITES), que funciona em file://."""
    import json
    os.makedirs(SPR_OUT, exist_ok=True)
    man = {}
    for f in sorted(os.listdir(SPR_SRC)):
        if not f.endswith('.json') or f == 'autosprite_ids.json':
            continue
        nome = f[:-5]
        m = json.load(open(os.path.join(SPR_SRC, f)))
        img = Image.open(os.path.join(SPR_SRC, m['image'])).convert('RGBA')
        k = SPR_ESCALA
        im = img.resize((round(img.width * k), round(img.height * k)), Image.LANCZOS)
        im.save(os.path.join(SPR_OUT, nome + '.webp'), 'WEBP', quality=90, method=4, exact=True)
        w, h = m['w'] * k, m['h'] * k
        # altura do corpo no 1º quadro (referência de escala do personagem)
        f0 = next(iter(m['frames'].values()))
        bb = img.crop((f0['x'], 0, f0['x'] + m['w'], m['h'])).getchannel('A').point(lambda v: 255 if v > 40 else 0).getbbox()
        man[nome] = {'img': 'sprites/' + nome + '.webp', 'w': round(w, 2), 'h': round(h, 2), 'ax': round(m['ax'] * k, 2),
                     'ay': round(m['ay'] * k, 2), 'body': round((m.get('stand') or (m['ay'] - bb[1])) * k, 2), 'own': 'stand' in m,
                     'frames': {n: round(v['x'] * k, 2) for n, v in m['frames'].items()}}
        print(f'{nome}.webp {im.width}x{im.height} {os.path.getsize(os.path.join(SPR_OUT, nome + ".webp")) // 1024} KB')
    with open(os.path.join(OUT, 'sprites', 'manifest.js'), 'w', encoding='utf-8') as fp:
        fp.write('/* gerado por tools/preparar_web.py — não editar */\nwindow.OLY_SPRITES = ' + json.dumps(man, separators=(',', ':')) + ';\n')


alvo = sys.argv[1:] or ['cenarios', 'fachadas', 'sprites']
if 'cenarios' in alvo:
    for n in CAMADAS:
        img = key_camada(os.path.join(SRC, n + '.jpg'))
        salvar(img, n)
    for n in INTEIRAS:
        f = os.path.join(SRC, n + '.jpg')
        if os.path.exists(f):
            salvar(Image.open(f).convert('RGB'), n)
if 'fachadas' in alvo:
    fachadas()
if 'sprites' in alvo:
    sprites()
