# -*- coding: utf-8 -*-
"""Genera sitemap.xml completo (www) a partir de las páginas publicadas. Lo llaman los builders de blog, aprende y servicios."""
import os, glob, datetime
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SITE = 'https://www.chefprivado.ar'
SERVICIOS = ['cena-romantica-en-casa', 'menu-degustacion-7-pasos', 'chef-semanal', 'eventos-corporativos']

def generar():
    hoy = datetime.date.today().isoformat()
    urls = [(SITE + '/', '1.0', 'weekly')]
    urls += [(f'{SITE}/{s}', '0.9', 'monthly') for s in SERVICIOS if os.path.exists(os.path.join(ROOT, s, 'index.html'))]
    if os.path.exists(os.path.join(ROOT, 'aprende', 'index.html')): urls.append((SITE + '/aprende', '0.8', 'monthly'))
    if os.path.exists(os.path.join(ROOT, 'blog', 'index.html')): urls.append((SITE + '/blog', '0.7', 'weekly'))
    for p in sorted(glob.glob(os.path.join(ROOT, 'blog', '*', 'index.html'))):
        urls.append((f'{SITE}/blog/{os.path.basename(os.path.dirname(p))}', '0.6', 'monthly'))
    x = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    x += ''.join(f'  <url>\n    <loc>{u}</loc>\n    <lastmod>{hoy}</lastmod>\n    <changefreq>{c}</changefreq>\n    <priority>{pr}</priority>\n  </url>\n' for u, pr, c in urls)
    x += '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8').write(x)
    return len(urls)

if __name__ == '__main__':
    print('sitemap', generar(), 'urls')
