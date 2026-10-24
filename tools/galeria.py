# -*- coding: utf-8 -*-
"""Galería de fotos propias para los generadores de historias y reels (/admin-historias).
Uso: python3 tools/galeria.py carpeta_con_fotos [etiqueta]
Convierte a WebP (máx. 1600 px, calidad 82), las guarda en img/galeria/ y regenera data/galeria.json.
La etiqueta (daro, cocina, platos, mesa, eventos, cajas…) sirve para filtrar en el panel."""
import os, sys, json, re, hashlib
from PIL import Image, ImageOps
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DIR = os.path.join(ROOT, 'img', 'galeria'); MAN = os.path.join(ROOT, 'data', 'galeria.json')

def cargar():
    try: return json.load(open(MAN, encoding='utf-8'))
    except Exception: return []

def agregar(carpeta, etiqueta='general'):
    os.makedirs(DIR, exist_ok=True); man = cargar(); ya = {m['src'] for m in man}; n = 0
    for f in sorted(os.listdir(carpeta)):
        if not re.search(r'\.(jpe?g|png|webp|heic)$', f, re.I): continue
        p = os.path.join(carpeta, f)
        im = ImageOps.exif_transpose(Image.open(p)).convert('RGB'); im.thumbnail((1600, 1600))
        h = hashlib.md5(open(p, 'rb').read()).hexdigest()[:8]
        nombre = re.sub(r'[^a-z0-9]+', '-', os.path.splitext(f)[0].lower()).strip('-')[:40] + '-' + h + '.webp'
        src = '/img/galeria/' + nombre
        if src in ya: continue
        im.save(os.path.join(DIR, nombre), 'WEBP', quality=82)
        man.append({'src': src, 'tag': etiqueta, 'w': im.width, 'h': im.height}); n += 1
    json.dump(man, open(MAN, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(n, 'fotos nuevas ·', len(man), 'en total')

if __name__ == '__main__':
    if len(sys.argv) < 2: print(__doc__); sys.exit(1)
    agregar(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'general')
