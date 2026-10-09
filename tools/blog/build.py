# -*- coding: utf-8 -*-
"""Genera las Cápsulas de cocina: /blog/index.html, /blog/<slug>/index.html,
la franja de la landing (entre marcadores en index.html) y el sitemap.
Uso: python3 tools/blog/build.py   (desde la raíz del repo)"""
import os, re, json, html, datetime
from articulos import ARTICULOS, CATS

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://www.chefprivado.ar'
U = lambda img, w, h: f'https://images.unsplash.com/{img}?w={w}&h={h}&fit=crop&q=72&auto=format'
MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

def fecha(f, lang):
    d = datetime.date.fromisoformat(f)
    return f'{d.day} de {MESES[d.month-1]} de {d.year}' if lang == 'es' else f'{MONTHS[d.month-1]} {d.day}, {d.year}'

def texto_plano(cuerpo):
    out = []
    for b in cuerpo:
        if b[0] in ('p', 'h2', 'tip', 'dato'): out.append(b[1])
        elif b[0] in ('ul', 'ol'): out += b[1]
        elif b[0] == 'tabla': out += [' '.join(r) for r in b[2]]
    return re.sub('<[^>]+>', '', ' '.join(out))

def minutos(cuerpo):
    return max(2, round(len(texto_plano(cuerpo).split()) / 200))

def bloques(cuerpo, lang):
    tip = '✦ El toque de chef' if lang == 'es' else "✦ The chef's touch"
    dato = 'Dato' if lang == 'es' else 'Good to know'
    h = []
    for b in cuerpo:
        t = b[0]
        if t == 'p': h.append(f'<p>{b[1]}</p>')
        elif t == 'h2': h.append(f'<h2>{b[1]}</h2>')
        elif t in ('ul', 'ol'): h.append(f'<{t}>' + ''.join(f'<li>{x}</li>' for x in b[1]) + f'</{t}>')
        elif t == 'tabla':
            h.append('<div class="cp-tw"><table><thead><tr>' + ''.join(f'<th>{c}</th>' for c in b[1]) + '</tr></thead><tbody>' +
                     ''.join('<tr>' + ''.join(f'<td>{c}</td>' for c in r) + '</tr>' for r in b[2]) + '</tbody></table></div>')
        elif t == 'tip': h.append(f'<aside class="cp-tip"><span class="cp-tip-k">{tip}</span><p>{b[1]}</p></aside>')
        elif t == 'dato': h.append(f'<aside class="cp-dato"><span class="cp-dato-k">ⓘ {dato}</span><p>{b[1]}</p></aside>')
    return '\n'.join(h)

def bi(es, en, tag='span'):
    return f'<{tag} class="b-es">{es}</{tag}><{tag} class="b-en" lang="en">{en}</{tag}>'

CSS = r'''
:root{--nv:#0D1B2A;--nv2:#1a2e42;--gd:#C9A84C;--gdl:#E8C96B;--cr:#FAF6EF;--crd:#E8E0D5;--tx:#4f463b}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--cr);color:var(--tx);font-family:'DM Sans',sans-serif;font-size:16px;line-height:1.7}
a{color:inherit}
html.lang-en .b-es{display:none!important}html:not(.lang-en) .b-en{display:none!important}
html.cel-pre body{visibility:hidden}
.cp-hdr{background:var(--nv);height:64px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;position:sticky;top:0;z-index:50;border-bottom:1px solid rgba(201,168,76,.18)}
.cp-hdr img{height:36px;display:block}
.cp-nav{display:flex;align-items:center;gap:18px}
.cp-nav a{color:rgba(250,246,239,.7);text-decoration:none;font-size:13px}
.cp-nav a:hover{color:#fff}
.cp-nav .cp-cta{background:linear-gradient(135deg,var(--gd),var(--gdl));color:var(--nv);font-weight:600;padding:9px 16px;border-radius:999px}
.cp-lang{display:flex;align-items:center;gap:3px}
.cp-lang button{background:none;border:0;color:rgba(250,246,239,.45);font:500 11px 'DM Sans',sans-serif;letter-spacing:.1em;cursor:pointer;padding:4px}
.cp-lang button.on{color:var(--gdl)}.cp-lang span{color:rgba(250,246,239,.25);font-size:10px}
.cp-k{display:inline-block;font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:var(--gd)}
/* índice */
.cp-top{background:var(--nv);color:var(--cr);text-align:center;padding:64px 20px 70px;position:relative;overflow:hidden}
.cp-top::before{content:'';position:absolute;left:50%;top:-140px;transform:translateX(-50%);width:700px;height:420px;background:radial-gradient(ellipse,rgba(201,168,76,.18),transparent 65%)}
.cp-top h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:46px;line-height:1.1;margin:10px 0 12px;position:relative}
.cp-top h1 em{color:var(--gdl)}
.cp-top p{max-width:620px;margin:0 auto;color:rgba(250,246,239,.7);position:relative}
.cp-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin:-22px auto 34px;position:relative;z-index:2;padding:0 16px}
.cp-chip{background:#fff;border:1px solid var(--crd);border-radius:999px;padding:9px 16px;font:500 13px 'DM Sans',sans-serif;color:var(--nv);cursor:pointer;box-shadow:0 6px 18px rgba(13,27,42,.08)}
.cp-chip.on{background:var(--nv);color:var(--gdl);border-color:var(--nv)}
.cp-grid{max-width:1140px;margin:0 auto;padding:0 20px 80px;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
.cp-card{background:#fff;border:1px solid var(--crd);border-radius:18px;overflow:hidden;text-decoration:none;display:flex;flex-direction:column;box-shadow:0 4px 18px rgba(13,27,42,.05);transition:transform .25s,box-shadow .25s}
.cp-card:hover{transform:translateY(-4px);box-shadow:0 18px 36px rgba(13,27,42,.12)}
.cp-card-img{aspect-ratio:16/10;background:#1a2e42 center/cover no-repeat;position:relative}
.cp-card-img>span{position:absolute;left:12px;top:12px;background:rgba(13,27,42,.6);backdrop-filter:blur(6px);color:var(--cr);border:1px solid rgba(201,168,76,.5);border-radius:999px;padding:4px 10px;font-size:10.5px;letter-spacing:.1em;text-transform:uppercase}
.cp-card-b{padding:18px 20px 20px;display:flex;flex-direction:column;flex:1}
.cp-card h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;line-height:1.2;color:var(--nv);margin-bottom:8px}
.cp-card p{font-size:13.5px;line-height:1.6;color:#6B5F4F;flex:1}
.cp-card small{display:block;margin-top:12px;font-size:11.5px;color:#a08a5c;letter-spacing:.04em}
.cp-card.hide{display:none}
/* artículo */
.cp-hero{position:relative;min-height:440px;display:flex;align-items:flex-end;background:#1a2e42 center/cover no-repeat;color:var(--cr)}
.cp-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(13,27,42,.25),rgba(13,27,42,.92))}
.cp-hero-in{position:relative;z-index:1;max-width:760px;margin:0 auto;padding:0 22px 46px;width:100%}
.cp-hero h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:44px;line-height:1.12;margin:12px 0 14px}
.cp-hero p.cp-baj{font-size:17px;color:rgba(250,246,239,.82);max-width:640px}
.cp-meta{margin-top:18px;font-size:12.5px;color:rgba(250,246,239,.6);display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.cp-meta img{width:28px;height:28px;border-radius:50%;border:1px solid var(--gd);object-fit:cover}
.cp-body{max-width:720px;margin:0 auto;padding:46px 22px 20px}
.cp-body p{margin-bottom:18px;font-size:16.5px}
.cp-body h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:29px;line-height:1.2;color:var(--nv);margin:38px 0 14px}
.cp-body ul,.cp-body ol{margin:0 0 22px 0;padding-left:0;list-style:none;counter-reset:n}
.cp-body li{position:relative;padding:8px 0 8px 32px;border-bottom:1px dashed var(--crd)}
.cp-body ul li::before{content:'✦';position:absolute;left:6px;top:9px;color:var(--gd);font-size:12px}
.cp-body ol li{counter-increment:n}
.cp-body ol li::before{content:counter(n);position:absolute;left:0;top:9px;width:22px;height:22px;border-radius:50%;background:var(--nv);color:var(--gdl);font-size:12px;display:flex;align-items:center;justify-content:center}
.cp-body b{color:var(--nv)}
.cp-tw{overflow-x:auto;margin:6px 0 24px;border-radius:14px;border:1px solid var(--crd);background:#fff}
.cp-body table{width:100%;border-collapse:collapse;font-size:14px}
.cp-body th{background:var(--nv);color:var(--gdl);text-align:left;font-weight:500;font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:12px 14px}
.cp-body td{padding:11px 14px;border-top:1px solid #F0E8D6;vertical-align:top}
.cp-body td:first-child{font-family:'DM Serif Display',serif;font-size:16px;color:var(--nv);white-space:nowrap}
.cp-tip{background:var(--nv);color:rgba(250,246,239,.88);border-radius:16px;padding:20px 24px;margin:26px 0;border:1px solid rgba(201,168,76,.4);box-shadow:0 14px 30px rgba(13,27,42,.15)}
.cp-tip-k{display:block;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gdl);margin-bottom:6px}
.cp-tip p{margin:0!important;font-size:15.5px!important}
.cp-dato{background:#fff;border:1px solid var(--crd);border-left:3px solid var(--gd);border-radius:12px;padding:14px 18px;margin:20px 0}
.cp-dato-k{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#a08a5c}
.cp-dato p{margin:4px 0 0!important;font-size:14.5px!important}
.cp-ctab{max-width:720px;margin:20px auto 0;padding:0 22px}
.cp-ctab div{background:linear-gradient(145deg,#13263a,var(--nv));border-radius:20px;padding:30px 28px;color:var(--cr);text-align:center;border:1px solid rgba(201,168,76,.3)}
.cp-ctab h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:26px;margin-bottom:6px}
.cp-ctab p{color:rgba(250,246,239,.7);margin-bottom:18px}
.cp-btn{display:inline-block;background:linear-gradient(135deg,var(--gd),var(--gdl));color:var(--nv);text-decoration:none;font-weight:600;padding:13px 26px;border-radius:999px;box-shadow:0 6px 20px rgba(201,168,76,.3)}
.cp-cred{max-width:720px;margin:14px auto 0;padding:0 22px;font-size:11.5px;color:#a39a8c}
.cp-rel{max-width:1140px;margin:56px auto 0;padding:0 20px}
.cp-rel>h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:26px;color:var(--nv);margin-bottom:18px;text-align:center}
.cp-rel .cp-grid{padding:0 0 70px}
.cp-ftr{background:var(--nv);color:rgba(250,246,239,.45);text-align:center;font-size:12px;padding:26px 16px}
.cp-ftr a{color:rgba(250,246,239,.7);text-decoration:none;margin:0 8px}
@media(max-width:900px){.cp-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.cp-grid{grid-template-columns:1fr}.cp-top h1{font-size:34px}.cp-hero{min-height:380px}.cp-hero h1{font-size:31px}.cp-body h2{font-size:24px}.cp-nav a.cp-hide{display:none}.cp-hdr{padding:0 14px}.cp-body td:first-child{white-space:normal}}
'''

HEAD = '''<!doctype html>
<html lang="es" data-title-en="{title_en}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{ogtype}"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:url" content="{url}"><meta property="og:image" content="{ogimg}">
<link rel="icon" href="/favicom.jpg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<script>try{{var s=localStorage.getItem("celestia_idioma");if(s==="en"||(!s&&(navigator.language||"").toLowerCase().indexOf("en")===0)){{document.documentElement.classList.add("lang-en");}}}}catch(e){{}}</script>
<style>{css}</style>
{ld}
</head><body data-no-tr>
<header class="cp-hdr"><a href="/" aria-label="Celestia Chef Privado"><img src="/img/img-d316320d6b.webp" alt="Celestia Chef Privado"></a>
<nav class="cp-nav"><a href="/blog" class="cp-hide">{nav_caps}</a><a href="/" class="cp-hide">{nav_home}</a><div class="cp-lang"><button type="button" data-cel-lang="es">ES</button><span>|</span><button type="button" data-cel-lang="en">EN</button></div><a href="/" class="cp-cta">{nav_book}</a></nav></header>
'''
FOOT = '''<footer class="cp-ftr"><a href="/">chefprivado.ar</a>·<a href="/blog">{caps}</a>·<a href="https://www.instagram.com/celestiachefprivado/" target="_blank" rel="noopener">Instagram</a><div style="margin-top:8px">Celestia · Chef Privado · Buenos Aires © 2026</div></footer>
<script src="/js/i18n.js"></script><script src="/js/analytics.js"></script>
<script>document.querySelectorAll('.cp-chip').forEach(function(c){{c.addEventListener('click',function(){{var k=c.getAttribute('data-cat');document.querySelectorAll('.cp-chip').forEach(function(x){{x.classList.toggle('on',x===c);}});document.querySelectorAll('.cp-grid .cp-card').forEach(function(a){{a.classList.toggle('hide',k!=='todas'&&a.getAttribute('data-cat')!==k);}});}});}});</script>
</body></html>'''

def card(a):
    c = CATS[a['cat']]
    return (f'<a class="cp-card" data-cat="{a["cat"]}" href="/blog/{a["slug"]}"><div class="cp-card-img" style="background-image:url(\'{U(a["img"],640,400)}\')">'
            f'<span>{c["icono"]} {bi(c["es"], c["en"])}</span></div><div class="cp-card-b"><h3>{bi(a["es"]["titulo"], a["en"]["titulo"])}</h3>'
            f'<p>{bi(a["es"]["bajada"], a["en"]["bajada"])}</p><small>{bi(str(minutos(a["es"]["cuerpo"]))+" min de lectura", str(minutos(a["en"]["cuerpo"]))+" min read")}</small></div></a>')

NAV = dict(nav_caps=bi('Blog', 'Blog'), nav_home=bi('Inicio', 'Home'), nav_book=bi('Reservar →', 'Book →'))

def escribir(rel, contenido):
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(contenido)

def articulo(a):
    es, en, c = a['es'], a['en'], CATS[a['cat']]
    url = f'{SITE}/blog/{a["slug"]}'
    ld = '<script type="application/ld+json">' + json.dumps({
        "@context": "https://schema.org", "@type": "Article", "headline": es['titulo'], "description": es['bajada'],
        "image": U(a['img'], 1200, 630), "datePublished": a['fecha'], "inLanguage": "es-AR",
        "author": {"@type": "Person", "name": "Daro Castello"},
        "publisher": {"@type": "Organization", "name": "Celestia Chef Privado", "url": SITE},
        "mainEntityOfPage": url}, ensure_ascii=False) + '</script>'
    otros = [x for x in ARTICULOS if x['slug'] != a['slug']][:3]
    h = HEAD.format(title=html.escape(es['titulo'] + ' · Blog Celestia'), title_en=html.escape(en['titulo'] + ' · Celestia Blog'),
                    desc=html.escape(es['bajada']), url=url, ogtype='article', ogimg=U(a['img'], 1200, 630), css=CSS, ld=ld, **NAV)
    h += (f'<section class="cp-hero" style="background-image:url(\'{U(a["img"],1800,900)}\')"><div class="cp-hero-in">'
          f'<a class="cp-k" href="/blog" style="text-decoration:none">✦ {bi("Blog","Blog")} · {c["icono"]} {bi(c["es"], c["en"])}</a>'
          f'<h1>{bi(es["titulo"], en["titulo"])}</h1><p class="cp-baj">{bi(es["bajada"], en["bajada"])}</p>'
          f'<div class="cp-meta"><img src="/img/daro-avatar.webp" alt="Daro Castello"><span>{bi("Por Daro Castello","By Daro Castello")}</span>'
          f'<span>{bi(fecha(a["fecha"],"es"), fecha(a["fecha"],"en"))}</span><span>{bi(str(minutos(es["cuerpo"]))+" min de lectura", str(minutos(en["cuerpo"]))+" min read")}</span></div></div></section>')
    h += f'<article class="cp-body"><div class="b-es">{bloques(es["cuerpo"],"es")}</div><div class="b-en" lang="en">{bloques(en["cuerpo"],"en")}</div></article>'
    h += ('<section class="cp-ctab"><div><h3>' + bi('¿Querés que lo cocine en tu casa?', 'Want me to cook it at your home?') + '</h3><p>' +
          bi('Menús de 3 o 7 pasos, cocina en vivo y servicio completo en CABA y GBA.', '3- or 7-course menus, live cooking and full service in Buenos Aires.') +
          '</p><a class="cp-btn" href="/">' + bi('Reservar una experiencia →', 'Book an experience →') + '</a></div></section>')
    h += f'<p class="cp-cred">{bi("Foto de referencia", "Reference photo")}: {a["foto"]} · <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a></p>'
    h += '<section class="cp-rel"><h3>' + bi('Seguí leyendo', 'Keep reading') + '</h3><div class="cp-grid">' + ''.join(card(x) for x in otros) + '</div></section>'
    h += FOOT.format(caps=bi('Blog', 'Blog'))
    escribir(f'blog/{a["slug"]}/index.html', h)

def indice():
    url = f'{SITE}/blog'
    h = HEAD.format(title='Blog · Lo que me enseñaron en la escuela de cocina | Celestia Chef Privado', title_en='Blog · What I learned at culinary school | Celestia Private Chef',
                    desc='Lo que me enseñaron en la escuela de cocina, contado por Daro Castello: cortes, salsas madre, técnicas y recetas fáciles con toques de chef.',
                    url=url, ogtype='website', ogimg=U(ARTICULOS[0]['img'], 1200, 630), css=CSS, ld='', **NAV)
    h += ('<section class="cp-top"><span class="cp-k">✦ ' + bi('Blog', 'Blog') + '</span><h1>' +
          bi('Lo que me enseñaron en la <em>escuela de cocina</em>', 'What I learned at <em>culinary school</em>') + '</h1><p>' +
          bi('Trucos de escuela contados simple: cortes, salsas, técnicas y recetas fáciles con ese detalle que te hace ver como chef.',
             'Culinary-school tricks made simple: cuts, sauces, techniques and easy recipes with that detail that makes you look like a chef.') + '</p></section>')
    usadas = [k for k in CATS if any(a['cat'] == k for a in ARTICULOS)]
    h += '<div class="cp-chips"><button type="button" class="cp-chip on" data-cat="todas">' + bi('Todas', 'All') + '</button>' + ''.join(
        f'<button type="button" class="cp-chip" data-cat="{k}">{CATS[k]["icono"]} {bi(CATS[k]["es"], CATS[k]["en"])}</button>' for k in usadas) + '</div>'
    h += '<div class="cp-grid">' + ''.join(card(a) for a in sorted(ARTICULOS, key=lambda x: x['fecha'], reverse=True)) + '</div>'
    h += FOOT.format(caps=bi('Blog', 'Blog'))
    escribir('blog/index.html', h)

def franja_landing():
    p = os.path.join(ROOT, 'index.html'); t = open(p, encoding='utf-8').read()
    ini, fin = '<!--CAPSULAS-START-->', '<!--CAPSULAS-END-->'
    ult = sorted(ARTICULOS, key=lambda x: x['fecha'], reverse=True)[:3]
    cards = ''.join(
        f'<a class="bl-cp-c" href="/blog/{a["slug"]}"><span class="bl-cp-img" style="background-image:url(\'{U(a["img"],560,350)}\')"><i>{CATS[a["cat"]]["icono"]} {bi(CATS[a["cat"]]["es"], CATS[a["cat"]]["en"])}</i></span>'
        f'<span class="bl-cp-t">{bi(a["es"]["titulo"], a["en"]["titulo"])}</span><span class="bl-cp-m">{bi(str(minutos(a["es"]["cuerpo"]))+" min de lectura →", str(minutos(a["en"]["cuerpo"]))+" min read →")}</span></a>'
        for a in ult)
    bloque = (ini + '<div id="bl-capsulas" class="bl-sec" data-no-tr style="padding:60px 48px"><div style="text-align:center;margin-bottom:26px">'
              '<span class="bl-stag">✦ ' + bi('BLOG', 'BLOG') + '</span><span class="bl-sh" style="display:block">' + bi('Lo que me enseñaron en la escuela de cocina', 'What I learned at culinary school') +
              '</span><span class="bl-sp" style="max-width:560px;margin:0 auto;display:block">' + bi('Cortes, salsas madre y trucos de escuela contados simple, para cocinar con detalles de chef.',
              "Cuts, mother sauces and culinary-school tricks made simple, so you can cook with a chef's touch.") + '</span></div>'
              '<div class="bl-cp-g">' + cards + '</div><div style="text-align:center;margin-top:24px"><a class="bl-cp-all" href="/blog">' + bi('Ver todos los trucos →', 'See all the tricks →') + '</a></div></div>' + fin)
    if ini in t:
        t = re.sub(re.escape(ini) + '.*?' + re.escape(fin), lambda m: bloque, t, flags=re.S)
    else:
        ancla = '<div id="bl-resenas"'
        assert t.count(ancla) == 1
        t = t.replace(ancla, bloque + ancla)
    open(p, 'w', encoding='utf-8').write(t)

def sitemap():
    import sys as _s; _s.path.insert(0, os.path.join(ROOT, 'tools')); import sitemap as _sm; _sm.generar()

if __name__ == '__main__':
    for a in ARTICULOS: articulo(a)
    indice(); franja_landing(); sitemap()
    print('ok', len(ARTICULOS), 'cápsulas')
