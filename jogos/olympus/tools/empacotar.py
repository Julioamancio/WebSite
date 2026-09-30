"""Monta o pacote do site do Orpheus para a VPS: python empacotar.py <versao> <saida.tgz>
Leva só o que o navegador usa (index, teste, css, js, assets/web e as folhas do Orfeu que o teste.html lê)
e põe ?v=<versao> nos scripts e estilos, para ninguém ficar com o JS antigo no cache."""
import hashlib, os, re, sys, tarfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ver, out = sys.argv[1], sys.argv[2]
TESTE = ['orpheus_idle', 'orpheus_run', 'orpheus_jump', 'orpheus_attack', 'orpheus_crouch', 'orpheus_jatk', 'orpheus_hurt', 'orpheus_hold']


def add_file(tar, rel, data=None):
    full = os.path.join(ROOT, rel)
    if data is None:
        tar.add(full, arcname=rel.replace(os.sep, '/'))
    else:
        import io
        ti = tarfile.TarInfo(rel.replace(os.sep, '/'))
        ti.size = len(data); ti.mtime = int(os.path.getmtime(full)); ti.mode = 0o644
        tar.addfile(ti, io.BytesIO(data))


with tarfile.open(out, 'w:gz') as tar:
    for page in ('index.html', 'teste.html'):
        html = open(os.path.join(ROOT, page), encoding='utf-8').read()
        html = re.sub(r'((?:src|href)=")((?:js|css|assets/web/sprites)/[^"?]+\.(?:js|css))"', r'\1\2?v=' + ver + '"', html)
        add_file(tar, page, html.encode('utf-8'))
    for d in ('css', 'js', os.path.join('assets', 'web')):
        for base, _, files in os.walk(os.path.join(ROOT, d)):
            for f in files:
                add_file(tar, os.path.relpath(os.path.join(base, f), ROOT))
    for n in TESTE:
        for ext in ('png', 'json'):
            add_file(tar, os.path.join('assets', 'sprites', n + '.' + ext))
h = hashlib.sha256(open(out, 'rb').read()).hexdigest()
print(f'{out} {os.path.getsize(out) / 1e6:.1f} MB sha256 {h}')
