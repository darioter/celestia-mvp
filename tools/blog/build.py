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
.cp-int{max-width:720px;margin:34px auto 0;padding:0 22px}
.cp-int>div{background:#fff;border:1px solid var(--crd);border-radius:20px;padding:24px 22px;text-align:center}
.cp-int h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:23px;color:var(--nv);margin:0 0 14px}
.cp-vot{display:flex;gap:12px;justify-content:center}
.cp-vb{display:inline-flex;align-items:center;gap:8px;border:1.5px solid var(--crd);background:#faf6ef;color:var(--nv);border-radius:999px;padding:10px 20px;font:500 15px 'DM Sans',sans-serif;cursor:pointer;transition:transform .15s,background .2s,border-color .2s}
.cp-vb svg{width:20px;height:20px}
.cp-vb:hover{transform:translateY(-2px);border-color:var(--gd)}
.cp-vb.on{background:linear-gradient(135deg,var(--gd),var(--gdl));border-color:var(--gd)}
.cp-vb.on svg{animation:cpPop .4s ease}
@keyframes cpPop{0%{transform:scale(1)}50%{transform:scale(1.35) rotate(-10deg)}100%{transform:scale(1)}}
.cp-vmsg{min-height:20px;margin:12px 0 0;font-size:14px;color:#7a6a4a}
.cp-shr{border-top:1px solid var(--crd);margin-top:18px;padding-top:16px}
.cp-shr p{font-size:14px;color:#6b6b6b;margin:0 0 12px}
.cp-shb{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.cp-sb{display:inline-flex;align-items:center;gap:7px;border:0;border-radius:999px;padding:9px 15px;font:500 14px 'DM Sans',sans-serif;cursor:pointer;color:#fff;transition:transform .15s,opacity .2s}
.cp-sb:hover{transform:translateY(-2px)}
.cp-sb svg{width:16px;height:16px;fill:currentColor}
.cp-sb.wa{background:#25d366}.cp-sb.fb{background:#1877f2}.cp-sb.x{background:#111}.cp-sb.cp{background:var(--nv)}.cp-sb.nat{background:linear-gradient(135deg,var(--gd),var(--gdl));color:var(--nv)}
@media(max-width:640px){.cp-vb{padding:10px 16px}.cp-sb span{display:none}.cp-sb{padding:11px}.cp-sb.nat span{display:inline}}
.cp-temas{max-width:1120px;margin:0 auto;padding:0 22px 70px}
.cp-temas h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:32px;color:var(--nv);text-align:center;margin:0 0 6px}
.cp-temas>p{text-align:center;color:#6b6b6b;margin:0 0 26px}
.cp-tg{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.cp-t{position:relative;text-align:left;background:#fff;border:1px solid var(--crd);border-radius:16px;padding:16px 16px 14px;font-family:'DM Sans',sans-serif;color:var(--nv);cursor:pointer;transition:transform .18s,box-shadow .18s,border-color .18s}
.cp-t:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(13,27,42,.1);border-color:var(--gd)}
.cp-t i{font-style:normal;font-size:26px;display:block;margin-bottom:6px}
.cp-t b{display:block;font-size:15.5px;font-weight:600;margin-bottom:3px}
.cp-t small{display:block;font-size:12.5px;line-height:1.45;color:#6b6b6b}
.cp-t em{position:absolute;top:12px;right:12px;font-style:normal;font-size:11px;font-weight:600;letter-spacing:.06em;background:#f3ead6;color:#7a6224;border-radius:999px;padding:3px 9px}
.cp-t.pr{cursor:default;background:#faf6ef}.cp-t.pr:hover{transform:none;box-shadow:none;border-color:var(--crd)}
.cp-t.pr em{background:transparent;border:1px dashed #c9b88f;color:#9a8a66}
.cp-t.pr i,.cp-t.pr b{opacity:.75}
.cp-t[data-cat=experiencias]{grid-column:1/-1;background:linear-gradient(145deg,#13263a,var(--nv));border-color:rgba(201,168,76,.35);color:var(--cr);display:flex;align-items:center;gap:14px}
.cp-t[data-cat=experiencias] i{margin:0}.cp-t[data-cat=experiencias] small{color:rgba(250,246,239,.7)}.cp-t[data-cat=experiencias] em{position:static;order:3;margin-left:auto}
@media(max-width:900px){.cp-tg{grid-template-columns:repeat(3,1fr)}}
@media(max-width:640px){.cp-tg{grid-template-columns:1fr 1fr;gap:10px}.cp-t{padding:14px 12px 12px}.cp-t small{font-size:12px}.cp-temas h2{font-size:27px}}
@media(max-width:900px){.cp-grid{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.cp-grid{grid-template-columns:1fr}.cp-top h1{font-size:34px}.cp-hero{min-height:380px}.cp-hero h1{font-size:31px}.cp-body h2{font-size:24px}.cp-nav a.cp-hide{display:none}.cp-hdr{padding:0 14px}.cp-body td:first-child{white-space:normal}}
'''

HEAD = '''<!doctype html>
<html lang="es" data-title-en="{title_en}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="{ogtype}"><meta property="og:title" content="{title}"><meta property="og:description" content="{desc}"><meta property="og:url" content="{url}"><meta property="og:image" content="{ogimg}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta property="og:locale" content="es_AR"><meta property="og:site_name" content="Celestia · Chef Privado">
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
<script>document.querySelectorAll('.cp-t[data-cat]').forEach(function(t){{t.addEventListener('click',function(){{var c=document.querySelector('.cp-chip[data-cat="'+t.getAttribute('data-cat')+'"]');if(c){{c.click();document.querySelector('.cp-chips').scrollIntoView({{behavior:'smooth',block:'start'}});}}}});}});document.querySelectorAll('.cp-chip').forEach(function(c){{c.addEventListener('click',function(){{var k=c.getAttribute('data-cat');document.querySelectorAll('.cp-chip').forEach(function(x){{x.classList.toggle('on',x===c);}});document.querySelectorAll('.cp-grid .cp-card').forEach(function(a){{a.classList.toggle('hide',k!=='todas'&&a.getAttribute('data-cat')!==k);}});}});}});</script>
<script>(function(){{var b=document.querySelector('.cp-int');if(!b)return;var slug=b.getAttribute('data-slug'),en=document.documentElement.classList.contains('lang-en'),k='cel_voto_'+slug,m=b.querySelector('.cp-vmsg');
function t(es,e){{return document.documentElement.classList.contains('lang-en')?e:es;}}
function tr(ev,p){{try{{window.celTrack&&celTrack(ev,p);}}catch(e){{}}}}
function marcar(v){{b.querySelectorAll('.cp-vb').forEach(function(x){{x.classList.toggle('on',x.getAttribute('data-v')===v);x.setAttribute('aria-pressed',x.getAttribute('data-v')===v);}});}}
var prev=null;try{{prev=localStorage.getItem(k);}}catch(e){{}}if(prev)marcar(prev);
b.querySelectorAll('.cp-vb').forEach(function(x){{x.addEventListener('click',function(){{var v=x.getAttribute('data-v');if(v===prev)return;marcar(v);prev=v;try{{localStorage.setItem(k,v);}}catch(e){{}}
tr('blog_voto',{{articulo:slug,voto:v}});m.textContent=v==='up'?t('¡Gracias! Si te gustó, compartila con alguien que la aproveche 👇','Thanks! If you liked it, share it with someone who will enjoy it 👇'):t('Gracias por avisar. Escribime qué te faltó y la mejoro.','Thanks for letting me know. Tell me what was missing and I will improve it.');}});}});
var url=location.origin+location.pathname,tit=document.querySelector('h1 .b-'+(en?'en':'es'));tit=tit?tit.textContent:document.title;
var nat=b.querySelector('[data-s=nativo]');if(navigator.share)nat.hidden=false;
b.querySelectorAll('.cp-sb').forEach(function(x){{x.addEventListener('click',function(){{var s=x.getAttribute('data-s'),u=url+'?utm_source='+s+'&utm_medium=compartir&utm_campaign=blog';tr('blog_compartir',{{articulo:slug,red:s}});
if(s==='nativo'){{navigator.share({{title:tit,url:u}}).catch(function(){{}});}}
else if(s==='whatsapp')window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(tit+' 👉 '+u),'_blank','noopener');
else if(s==='facebook')window.open('https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(u),'_blank','noopener,width=600,height=500');
else if(s==='x')window.open('https://twitter.com/intent/tweet?text='+encodeURIComponent(tit)+'&url='+encodeURIComponent(u),'_blank','noopener,width=600,height=500');
else if(s==='copiar'){{(navigator.clipboard?navigator.clipboard.writeText(u):Promise.reject()).then(function(){{x.querySelector('span').textContent=t('¡Copiado!','Copied!');}}).catch(function(){{prompt('',u);}});}}}});}});}})();</script>
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
    h += '<section class="cp-int" data-slug="' + a['slug'] + '"><div><h3>' + bi('¿Te sirvió esta nota?', 'Was this note useful?') + '</h3>' + '<div class="cp-vot"><button type="button" class="cp-vb" data-v="up" aria-label="Me sirvió"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0 4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7"/></svg>' + bi('Sí, me sirvió','Yes') + '</button>' + '<button type="button" class="cp-vb" data-v="down" aria-label="No me sirvió"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="transform:scaleY(-1)"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0 4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7"/></svg>' + bi('No tanto','Not really') + '</button></div>' + '<p class="cp-vmsg" aria-live="polite"></p>' + '<div class="cp-shr"><p>' + bi('¿Conocés a alguien que cocine? Recomendale esta nota', 'Know someone who cooks? Share this note') + '</p><div class="cp-shb">' + '<button type="button" class="cp-sb nat" data-s="nativo" hidden><svg viewBox="0 0 24 24"><path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7l-6.7 3.4a3 3 0 1 0 0 3.2L15 17a3 3 0 1 0 3-1z"/></svg><span>' + bi('Compartir','Share') + '</span></button>' + '<button type="button" class="cp-sb wa" data-s="whatsapp" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg><span>WhatsApp</span></button>' + '<button type="button" class="cp-sb fb" data-s="facebook" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 8V6c0-.9.6-1 1-1h3V1h-4c-4 0-5 3-5 5v2H6v4h3v11h5V12h3.6l.4-4z"/></svg><span>Facebook</span></button>' + '<button type="button" class="cp-sb x" data-s="x" aria-label="X"><svg viewBox="0 0 24 24"><path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9L1 2h7l4.8 6.4zm-1.2 18h1.9L7.1 4H5.1z"/></svg><span>X</span></button>' + '<button type="button" class="cp-sb cp" data-s="copiar" aria-label="Copiar link"><svg viewBox="0 0 24 24"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11z"/></svg><span>' + bi('Copiar link','Copy link') + '</span></button>' + '</div></div></div></section>'
    h += ('<section class="cp-ctab"><div><h3>' + bi('¿Querés que lo cocine en tu casa?', 'Want me to cook it at your home?') + '</h3><p>' +
          bi('Menús de 3 o 7 pasos, terminados en tu casa y con servicio completo en CABA y GBA.', '3- or 7-course menus, finished at your home with full service in Buenos Aires.') +
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
    def tile(k):
        c = CATS[k]; n = sum(1 for a in ARTICULOS if a['cat'] == k)
        badge = bi(f'{n} nota' + ('s' if n != 1 else ''), f'{n} note' + ('s' if n != 1 else '')) if n else bi('Pronto', 'Soon')
        attrs = f'type="button" class="cp-t" data-cat="{k}"' if n else 'type="button" class="cp-t pr" aria-disabled="true"'
        return (f'<button {attrs}><em>{badge}</em><i aria-hidden="true">{c["icono"]}</i><b>{bi(c["es"], c["en"])}</b>'
                f'<small>{bi(c.get("d_es",""), c.get("d_en",""))}</small></button>')
    h += ('<section class="cp-temas" id="temas"><h2>' + bi('Explorá por tema', 'Explore by topic') + '</h2><p>' +
          bi('Todo lo que aprendí en la escuela de cocina, ordenado para que vayas de lo básico a lo avanzado.',
             'Everything I learned at culinary school, organized from the basics to the advanced.') + '</p><div class="cp-tg">' +
          ''.join(tile(k) for k in CATS) + '</div></section>')
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
