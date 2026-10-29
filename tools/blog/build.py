# -*- coding: utf-8 -*-
"""Genera las Cápsulas de cocina: /blog/index.html, /blog/<slug>/index.html,
la franja de la landing (entre marcadores en index.html) y el sitemap.
Uso: python3 tools/blog/build.py   (desde la raíz del repo)"""
import os, re, json, html, datetime
from articulos import ARTICULOS, CATS

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://www.chefprivado.ar'
def U(img, w, h):
    if img.startswith('/'): return SITE + img
    if img.startswith('http'): return f'{img}?auto=compress&cs=tinysrgb&w={w}&h={h}&fit=crop'  # Pexels
    return f'https://images.unsplash.com/{img}?w={w}&h={h}&fit=crop&q=72&auto=format'
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

def claves(a):
    """Texto liviano para el buscador del blog: títulos, bajadas, tema, subtítulos, ingredientes y negritas (ES y EN)."""
    import unicodedata
    partes = [a['cat'], CATS[a['cat']]['es'], CATS[a['cat']]['en']]
    for l in ('es', 'en'):
        d = a[l]; partes += [d['titulo'], d['bajada']]
        for b in d['cuerpo']:
            if b[0] == 'h2': partes.append(b[1])
            elif b[0] == 'tabla': partes += [r[0] for r in b[2]]
            txt = b[1] if isinstance(b[1], str) else ' '.join(b[1]) if b[0] in ('ul', 'ol') else ''
            partes += re.findall(r'<strong>(.*?)</strong>', txt)
    t = re.sub('<[^>]+>', ' ', ' '.join(partes)).lower()
    t = ''.join(c for c in unicodedata.normalize('NFD', t) if unicodedata.category(c) != 'Mn')
    return html.escape(' '.join(dict.fromkeys(re.findall(r'[a-z0-9]+', t))), quote=True)

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

TTS_JS = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tts.js'), encoding='utf-8').read()
TTS_INDICE = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tts_indice.js'), encoding='utf-8').read()

LANG = 'es'  # 'en' genera las páginas /en/... solo en inglés
def L(es, en): return en if LANG == 'en' else es
def bi(es, en, tag='span'):
    if LANG == 'en': return f'<{tag} class="b-en" lang="en">{en}</{tag}>'
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
.cp-hero{position:relative;min-height:440px;display:flex;align-items:flex-end;padding-top:76px;background:#1a2e42 center/cover no-repeat;color:var(--cr)}
.cp-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(13,27,42,.25),rgba(13,27,42,.92))}
.cp-tts{max-width:720px;margin:26px auto 0;padding:0 22px;position:relative;z-index:30}
.cp-tts>div{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid var(--crd);border-radius:18px;padding:10px 12px;box-shadow:0 10px 26px rgba(13,27,42,.06)}
.cp-tts.sonando{position:sticky;top:74px}
.cp-tts.sonando>div{border-color:var(--gd);box-shadow:0 14px 30px rgba(13,27,42,.16)}
.tts-play{display:inline-flex;align-items:center;gap:9px;border:0;border-radius:999px;background:var(--nv);color:var(--cr);font:600 15px 'DM Sans',sans-serif;padding:11px 18px 11px 14px;cursor:pointer;min-height:44px}
.tts-play i{width:26px;height:26px;border-radius:50%;background:var(--gdl);color:var(--nv);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:12px}
.tts-play small{opacity:.65;font-weight:400;font-size:13px}
.tts-b{min-width:44px;min-height:44px;border-radius:999px;border:1px solid var(--crd);background:#fff;color:var(--nv);font:600 14px 'DM Sans',sans-serif;cursor:pointer;padding:0 12px}
.tts-b[aria-pressed=true]{background:var(--nv);color:var(--gdl);border-color:var(--nv)}
.tts-sep{flex:1}
.tts-lbl{font-size:12px;color:var(--mut)}
.tts-on{background:rgba(232,201,106,.25)!important;box-shadow:0 0 0 8px rgba(232,201,106,.25);border-radius:6px;transition:background .3s}
.cp-body{zoom:var(--cpz,1)}
.cp-tts button:focus-visible,.cp-volver:focus-visible,.cp-fin a:focus-visible{outline:3px solid var(--gd);outline-offset:2px}
@media(max-width:640px){.cp-tts{padding:0 14px}.tts-sep{display:none}.tts-play{flex:1 1 100%;justify-content:center}}
.cp-volver{position:absolute;top:18px;left:max(18px,calc((100% - 760px)/2 + 22px));z-index:2;display:inline-flex;align-items:center;gap:8px;background:rgba(13,27,42,.6);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(232,201,106,.55);color:var(--cr);text-decoration:none;font:600 14px 'DM Sans',sans-serif;padding:10px 16px 10px 13px;border-radius:999px;transition:background .2s}
.cp-volver:hover{background:rgba(13,27,42,.85)}
.cp-volver b{color:var(--gdl);font-size:17px;line-height:1}
.cp-mf{max-width:720px;margin:34px auto 0;padding:24px 26px;border-radius:22px;background:var(--nv);color:var(--cr);box-sizing:border-box}.cp-mf>span{font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--gdl)}.cp-mf b{display:block;font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;line-height:1.2;margin:8px 0}.cp-mf p{opacity:.78;margin:0 0 14px}.cp-mf a{display:inline-block;background:var(--gdl);color:var(--nv);font-weight:700;text-decoration:none;padding:11px 20px;border-radius:999px}@media(max-width:760px){.cp-mf{margin:30px 16px 0;width:auto}}
.cp-fin{max-width:720px;margin:30px auto 0;padding:0 22px;display:flex;gap:10px;flex-wrap:wrap}
.cp-fin a{flex:1 1 220px;display:flex;align-items:center;justify-content:center;gap:8px;text-decoration:none;font:600 15px 'DM Sans',sans-serif;padding:14px 18px;border-radius:999px;border:1px solid var(--nv);color:var(--nv)}
.cp-fin a.pri{background:var(--nv);color:var(--gdl)}
.cp-flot{position:fixed;left:16px;bottom:18px;z-index:40;display:inline-flex;align-items:center;gap:7px;background:var(--nv);color:var(--cr);text-decoration:none;font:600 13.5px 'DM Sans',sans-serif;padding:11px 16px 11px 13px;border-radius:999px;box-shadow:0 10px 26px rgba(13,27,42,.35);border:1px solid rgba(232,201,106,.5);opacity:0;transform:translateY(12px);pointer-events:none;transition:opacity .25s,transform .25s}
.cp-flot.on{opacity:1;transform:none;pointer-events:auto}
.cp-flot b{color:var(--gdl);font-size:16px;line-height:1}
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
/* ════ Feed estilo Instagram ════ */
.ig-prof{max-width:1100px;margin:0 auto;padding:44px 22px 18px}
.ig-pin{display:grid;grid-template-columns:156px minmax(0,1fr);grid-template-rows:auto auto;column-gap:56px;row-gap:4px;align-items:end;max-width:860px;margin:0 auto}
.ig-av{grid-row:1/3;align-self:center}
.ig-bio{grid-column:2;align-self:start}
.ig-av{flex:none;width:156px;height:156px;border-radius:50%;padding:4px;background:conic-gradient(from 210deg,var(--gd),var(--gdl),#f3e2a8,var(--gd));display:block}
.ig-av img{width:100%;height:100%;border-radius:50%;object-fit:cover;border:4px solid var(--cr);display:block;background:#1a2e42}
.ig-pi{flex:1;min-width:0}
.ig-un{display:flex;align-items:center;flex-wrap:wrap;gap:12px 16px}
.ig-un .ig-user{font:500 21px 'DM Sans',sans-serif;color:var(--nv);display:inline-flex;align-items:center;gap:6px}
.ig-un .ig-user svg{width:18px;height:18px}
.ig-follow{display:inline-flex;align-items:center;gap:7px;background:var(--nv);color:var(--gdl);text-decoration:none;font:600 13.5px 'DM Sans',sans-serif;padding:8px 16px;border-radius:9px}
.ig-follow.alt{background:#fff;color:var(--nv);border:1px solid var(--crd)}
.ig-stats{display:flex;flex-wrap:wrap;gap:6px 30px;list-style:none;margin:16px 0 10px;font-size:15px;color:var(--nv)}.ig-stats li{white-space:nowrap}
.ig-stats b{font-weight:600}
.ig-bio h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;line-height:1.2;color:var(--nv);margin:0 0 4px}
.ig-bio h1 em{color:#a08a5c}
.ig-bio p{font-size:14.5px;line-height:1.55;color:var(--tx);max-width:520px}
.ig-bio b{color:var(--nv);font-weight:600}
.ig-hl{max-width:1100px;margin:22px auto 0!important;padding:4px 22px 18px!important;display:flex;flex-wrap:nowrap!important;justify-content:flex-start!important;gap:18px!important;overflow-x:auto;scrollbar-width:none;border-bottom:1px solid var(--crd);z-index:auto!important}
.ig-hl::-webkit-scrollbar{display:none}
.ig-hl .cp-chip,.ig-hl .ig-g{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:7px;width:86px;background:none!important;border:0!important;box-shadow:none!important;padding:0!important;border-radius:0!important;font:500 12px/1.25 'DM Sans',sans-serif;color:var(--nv)!important;cursor:pointer;text-align:center}
.ig-hl .ig-ring{width:72px;height:72px;border-radius:50%;padding:3px;background:var(--crd);display:block;transition:background .2s,transform .2s}
.ig-hl .ig-ring i{display:flex;align-items:center;justify-content:center;width:100%;height:100%;border-radius:50%;border:3px solid var(--cr);background:#1a2e42 center/cover no-repeat;font-style:normal;font-size:24px;color:var(--gdl)}
.ig-hl .ig-ring i.ic{background:var(--nv)}
.ig-hl button:hover .ig-ring{transform:scale(1.05)}
.ig-hl .on .ig-ring{background:conic-gradient(from 210deg,var(--gd),var(--gdl),#f3e2a8,var(--gd))}
.ig-hl .on{font-weight:600!important}
.ig-hl .lb{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;max-width:86px;min-height:2.5em;overflow:hidden;white-space:normal;overflow-wrap:break-word;hyphens:auto;line-height:1.25}
.ig-q{max-width:1100px;margin:16px auto 0;padding:0 22px;display:flex;align-items:center;gap:12px}
.ig-q label{flex:1;position:relative;display:block}
.ig-q svg{position:absolute;left:14px;top:50%;width:18px;height:18px;margin-top:-9px;fill:none;stroke:#8a7b62;stroke-width:2;stroke-linecap:round;pointer-events:none}
.ig-q input{width:100%;box-sizing:border-box;border:1px solid var(--crd);background:#fff;border-radius:12px;padding:12px 40px 12px 42px;font:400 15px 'DM Sans',sans-serif;color:var(--nv);outline:none;-webkit-appearance:none;appearance:none}
.ig-q input:focus{border-color:var(--gd);box-shadow:0 0 0 3px rgba(201,168,76,.2)}
.ig-q input::-webkit-search-cancel-button{display:none}
.ig-q .x{position:absolute;right:8px;top:50%;margin-top:-15px;width:30px;height:30px;border:0;border-radius:50%;background:#f3ead6;color:var(--nv);cursor:pointer;font-size:13px}
.ig-q small{flex:none;font-size:12.5px;color:#8a7b62;min-width:70px;text-align:right}
.ig.qhide{display:none}
@media(max-width:640px){.ig-q{padding:0 16px;margin-top:12px}.ig-q small{display:none}}
.ig-nube{max-width:1100px;margin:14px auto 4px;padding:0 22px}
.ig-nube-h{display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:4px}
.ig-nube-h h2{font:600 11px 'DM Sans',sans-serif;letter-spacing:.16em;text-transform:uppercase;color:#a08a5c;margin:0}
.ig-nube-h small{font-size:11.5px;color:#a99c86}
.ig-nube-c{display:flex;flex-wrap:wrap;align-items:baseline;gap:2px 12px;padding:0}
.ig-nube:not(.todo) .ig-t.x{display:none}
.ig-t{border:0;background:none;cursor:pointer;padding:2px 4px;border-radius:8px;font-family:'DM Serif Display',serif;line-height:1.15;color:var(--nv);transition:color .15s,background .15s,transform .15s}
.ig-t{position:relative}
.ig-t::after{content:'';position:absolute;left:4px;right:4px;bottom:0;height:1.5px;background:linear-gradient(90deg,var(--gd),var(--gdl));transform:scaleX(0);transform-origin:left;transition:transform .25s ease}
.ig-t:hover{color:#8a6418;background:#faf3e3;transform:translateY(-2px)}
.ig-t:hover::after{transform:scaleX(1)}
/* entrada escalonada, como los chips y globitos del sitio */
.ig-nube.anim .ig-t{opacity:0;transform:translateY(8px) scale(.92)}
.ig-nube.anim.in .ig-t{animation:nbIn .5s cubic-bezier(.2,1.4,.4,1) both;animation-delay:calc(var(--i,0) * 45ms)}
@keyframes nbIn{from{opacity:0;transform:translateY(8px) scale(.92)}to{opacity:1;transform:none}}
/* los más buscados flotan apenas y brillan en dorado */
.ig-nube.in .ig-t.s5,.ig-nube.in .ig-t.s4{background-image:linear-gradient(100deg,#8a6418 0%,#8a6418 40%,#E8C96B 50%,#8a6418 60%,#8a6418 100%);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent}
.ig-nube.in .ig-t.s5{animation:nbIn .5s cubic-bezier(.2,1.4,.4,1) both,nbFloat 4.5s ease-in-out infinite,nbShine 6s linear infinite;animation-delay:calc(var(--i,0) * 45ms),calc(var(--i,0) * 45ms + .6s),calc(var(--i,0) * 300ms)}
.ig-nube.in .ig-t.s4{animation:nbIn .5s cubic-bezier(.2,1.4,.4,1) both,nbShine 7s linear infinite;animation-delay:calc(var(--i,0) * 45ms),calc(var(--i,0) * 350ms)}
.ig-nube.in .ig-t.s5:hover,.ig-nube.in .ig-t.s4:hover{-webkit-text-fill-color:#8a6418;background-image:none;background-color:#faf3e3}
.ig-t.on,.ig-nube.in .ig-t.on{-webkit-text-fill-color:var(--gdl);background-image:none;background-color:var(--nv)}
@keyframes nbFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes nbShine{0%,70%{background-position:100% 0}100%{background-position:-150% 0}}
.ig-nube-h h2 i{display:inline-block;font-style:normal;color:var(--gd);margin-right:5px;animation:nbTw 3s ease-in-out infinite}
@keyframes nbTw{0%,100%{transform:scale(1);opacity:.8}50%{transform:scale(1.25) rotate(20deg);opacity:1}}
@media(prefers-reduced-motion:reduce){.ig-nube .ig-t,.ig-nube-h h2 i{animation:none!important;opacity:1!important;transform:none!important}}
.ig-t.on{background:var(--nv);color:var(--gdl)}
.ig-t:focus-visible{outline:3px solid var(--gd);outline-offset:2px}
.ig-t.s1{font-size:13.5px;color:#9a8d78}.ig-t.s2{font-size:15px;color:#6f6250}.ig-t.s3{font-size:17px}.ig-t.s4{font-size:19.5px;color:#8a6418}.ig-t.s5{font-size:22px;color:#8a6418}
.ig-nube-mas{display:none}
.ig-nube:not(.todo) .ig-nube-mas{display:inline-block;border:0;background:none;padding:2px 4px;font:600 12.5px 'DM Sans',sans-serif;color:#8a6418;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
@media(max-width:640px){.ig-nube{padding:0 16px}.ig-nube-h small{display:none}.ig-nube-c{gap:0 10px}.ig-t.s4{font-size:18px}.ig-t.s5{font-size:20px}}
.ig-tabs{max-width:1100px;margin:0 auto;display:flex;justify-content:center;gap:46px;font:600 11.5px 'DM Sans',sans-serif;letter-spacing:.14em;text-transform:uppercase;color:#a08a5c}
.ig-tabs span{display:inline-flex;align-items:center;gap:7px;padding:14px 0;border-top:1px solid transparent;margin-top:-1px}
.ig-tabs span.on{color:var(--nv);border-top-color:var(--nv)}
.ig-vacio{grid-column:1/-1;text-align:center;padding:40px 10px;color:#8a7b62;font-size:15px}
.cp-grid.ig-feed{max-width:1100px;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px;align-items:start;padding-top:8px}
.ig{background:#fff;border:1px solid var(--crd);border-radius:14px;overflow:hidden;display:flex;flex-direction:column}
.ig.hide{display:none}
.ig-h{display:flex;align-items:center;gap:10px;padding:11px 12px}
.ig-h img{width:34px;height:34px;border-radius:50%;object-fit:cover;padding:2px;background:conic-gradient(var(--gd),var(--gdl),var(--gd))}
.ig-h div{flex:1;min-width:0;line-height:1.2}
.ig-h b{display:block;font:600 13.5px 'DM Sans',sans-serif;color:var(--nv)}
.ig-h small{display:block;font-size:12px;color:#7d715f;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ig-h .ig-k{font-size:11px;color:#a08a5c;letter-spacing:.06em;white-space:nowrap}
.ig-img{display:block;aspect-ratio:4/5;background:#1a2e42 center/cover no-repeat;position:relative;text-decoration:none;overflow:hidden}
.ig-img::after{content:'';position:absolute;inset:0;background:linear-gradient(to top,rgba(13,27,42,.55),transparent 38%);opacity:.9}
.ig-img .ig-ttl{position:absolute;left:16px;right:16px;bottom:14px;z-index:1;color:#fff;font-family:'DM Serif Display',serif;font-size:21px;line-height:1.15;text-shadow:0 2px 10px rgba(0,0,0,.35)}
.ig-img .ig-pill{position:absolute;top:12px;right:12px;z-index:1;background:rgba(13,27,42,.62);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:#fff;font:600 11px 'DM Sans',sans-serif;border-radius:999px;padding:4px 9px}
.ig-heart{position:absolute;left:50%;top:50%;z-index:2;width:90px;height:90px;margin:-45px 0 0 -45px;color:#fff;opacity:0;transform:scale(.4);pointer-events:none;filter:drop-shadow(0 4px 14px rgba(0,0,0,.35))}
.ig-heart.go{animation:igHeart .9s ease both}
@keyframes igHeart{0%{opacity:0;transform:scale(.4)}20%{opacity:1;transform:scale(1.1)}40%{transform:scale(.95)}70%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(1)}}
.ig-a{display:flex;align-items:center;gap:4px;padding:6px 8px 0}
.ig-a button,.ig-a a.ig-b{width:40px;height:40px;display:inline-flex;align-items:center;justify-content:center;border:0;background:none;color:var(--nv);cursor:pointer;border-radius:10px;padding:0;text-decoration:none}
.ig-a button:hover,.ig-a a.ig-b:hover{background:#f6f0e4}
.ig-a svg{width:24px;height:24px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.ig-a .ig-like.on{color:#e0245e}.ig-a .ig-like.on svg{fill:currentColor;animation:cpPop .4s ease}
.ig-a .ig-save.on svg{fill:currentColor}
.ig-a .sp{flex:1}
.ig-a .cp-esc{position:static!important;transform:none!important;width:auto!important;height:34px!important;min-height:34px;padding:3px 11px 3px 4px!important;margin-left:4px;border-radius:999px!important;border:1px solid var(--crd)!important;background:var(--cr)!important;gap:6px;font-size:12px!important}
.ig-a .cp-esc.on{background:var(--gdl)!important;border-color:var(--gd)!important}
.ig-c{padding:4px 14px 14px;font-size:14px;line-height:1.5;color:var(--tx)}
.ig-likes{font-size:13px;font-weight:600;color:var(--nv);margin:2px 0 4px;min-height:0}
.ig-c h3{display:inline;font:600 14px 'DM Sans',sans-serif;color:var(--nv)}
.ig-c h3 a{text-decoration:none}
.ig-c .ig-u{font-weight:600;color:var(--nv);margin-right:4px}
.ig-c p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin-top:2px}
.ig-c .ig-tags{display:block;color:#7b6420;font-size:13px;margin-top:4px}
.ig-more{display:inline-block;margin-top:6px;color:#8a7b62;font-size:13.5px;text-decoration:none}
.ig-more:hover{color:var(--nv)}
.ig-c time{display:block;margin-top:6px;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:#a99c86}
.ig a:focus-visible,.ig button:focus-visible,.ig-hl button:focus-visible{outline:3px solid var(--gd);outline-offset:2px}
.cp-rel .cp-grid.ig-feed{padding:0 0 70px}
@media(max-width:1020px){.cp-grid.ig-feed{grid-template-columns:repeat(2,minmax(0,1fr))}.ig-pin{column-gap:34px}}
@media(max-width:640px){
 .ig-prof{padding:22px 16px 6px}.ig-pin{grid-template-columns:86px minmax(0,1fr);grid-template-rows:auto;gap:6px 20px;align-items:center}.ig-av{grid-row:auto}
 .ig-av{width:86px;height:86px;padding:3px}.ig-av img{border-width:3px}
 .ig-un .ig-user{font-size:17px}.ig-follow{padding:7px 12px;font-size:12.5px}
 .ig-stats{gap:16px;margin:10px 0 0;font-size:13px}
 .ig-bio{grid-column:1/-1;margin-top:10px}.ig-bio h1{font-size:20px}.ig-bio p{font-size:13.5px}
 .ig-hl{padding:4px 16px 14px!important;gap:12px!important;margin-top:12px!important}
 .ig-hl .cp-chip,.ig-hl .ig-g{width:74px}.ig-hl .ig-ring{width:62px;height:62px}.ig-hl .lb{max-width:74px;font-size:11px}
 .cp-grid.ig-feed{grid-template-columns:1fr;gap:0;padding:0 0 60px}
 .ig{border-radius:0;border-left:0;border-right:0;border-top:0}
 .ig-tabs{gap:30px}
}
'''

HEAD = '''<!doctype html>
<html lang="es" data-title-en="{title_en}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<link rel="canonical" href="{url}">
{alt}
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
<script>document.querySelectorAll('.cp-t[data-cat]').forEach(function(t){{t.addEventListener('click',function(){{var c=document.querySelector('.cp-chip[data-cat="'+t.getAttribute('data-cat')+'"]');if(c){{c.click();document.querySelector('.cp-chips').scrollIntoView({{behavior:'smooth',block:'start'}});}}}});}});document.querySelectorAll('.cp-chip').forEach(function(c){{c.addEventListener('click',function(){{var k=c.getAttribute('data-cat');document.querySelectorAll('.cp-chip').forEach(function(x){{x.classList.toggle('on',x===c);}});document.querySelectorAll('.cp-grid .cp-card').forEach(function(a){{a.classList.toggle('hide',k!=='todas'&&a.getAttribute('data-cat')!==k);}});}});}});(function(){{var h=decodeURIComponent(location.hash.slice(1)),c=h&&document.querySelector('.cp-chip[data-cat="'+h+'"]');if(c){{c.click();setTimeout(function(){{document.querySelector('.cp-chips').scrollIntoView({{block:'start'}});}},60);}}}})();</script>
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

SVG_LIKE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"/></svg>'
SVG_COM = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 16.4A9 9 0 1 0 17.3 20l3.7 1-1-3.6z"/></svg>'
SVG_SHR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 3 10 13.5M21.5 3 15 21l-5-7.5L2.5 9z"/></svg>'
SVG_SAVE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 21 12 16l-7 5V4.5A1.5 1.5 0 0 1 6.5 3h11A1.5 1.5 0 0 1 19 4.5z"/></svg>'
SVG_OK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#C9A84C" d="M12 1.5l2.6 1.9 3.2-.1 1 3 2.6 1.9-1 3 1 3-2.6 1.9-1 3-3.2-.1L12 22.5l-2.6-1.9-3.2.1-1-3-2.6-1.9 1-3-1-3 2.6-1.9 1-3 3.2.1z"/><path d="M8 12.2l2.6 2.6L16.2 9" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>'

LOG_JS = "<script>(function(){if(!/chefprivado\\.ar$/.test(location.hostname))return;var U='https://qolpnuscpmzqeacshfvu.supabase.co/rest/v1/blog_eventos',K='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbHBudXNjcG16cWVhY3NoZnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjQ3OTQsImV4cCI6MjA5MTM0MDc5NH0.BJOz5Gwkeb1NqID_gkGKD5YlymifMtOwaf8iQMaBCx8',lang=document.documentElement.classList.contains('lang-en')?'en':'es';function sl(p){var m=String(p||'').match(/\\/blog\\/([a-z0-9-]+)/);return m?m[1]:(/^[a-z0-9-]{3,120}$/.test(p||'')?p:null);}function log(t,s,q){try{fetch(U,{method:'POST',keepalive:true,headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({tipo:t,slug:s||null,termino:q||null,lang:lang})}).catch(function(){});}catch(e){}}var M={blog_like:'like',blog_guardar:'guardar',blog_compartir:'compartir',blog_escuchar:'escuchar',blog_voto:'voto'},o=window.celTrack;window.celTrack=function(ev,p){p=p||{};try{if(M[ev])log(M[ev],sl(p.articulo));else if(ev==='blog_buscar'&&p.q)log('busqueda',null,String(p.q).slice(0,40));}catch(e){}if(o)return o.apply(this,arguments);};var b=document.querySelector('.cp-int[data-slug]');if(b){var s=b.getAttribute('data-slug'),k='cel_vista_'+s;try{if(!sessionStorage.getItem(k)){sessionStorage.setItem(k,'1');log('vista',s);}}catch(e){log('vista',s);}}})();</script>"

def pie():
    return FOOT.format(caps=bi('Blog', 'Blog')).replace('<script src="/js/analytics.js"></script>', '<script src="/js/analytics.js"></script>' + LOG_JS, 1)

def card(a):
    c = CATS[a['cat']]; es, en = a['es'], a['en']; url = f'/blog/{a["slug"]}'
    tag_es = '#' + re.sub(r'[^a-z0-9]', '', c['es'].lower().replace('á','a').replace('é','e').replace('í','i').replace('ó','o').replace('ú','u').replace('ñ','n'))
    tag_en = '#' + re.sub(r'[^a-z0-9]', '', c['en'].lower())
    tit = html.escape(es['titulo'])
    return (f'<article class="cp-card ig" data-cat="{a["cat"]}" data-slug="{a["slug"]}" data-q="{claves(a)}">'
            f'<header class="ig-h"><img src="/img/daro-avatar.webp" alt="" loading="lazy" width="34" height="34"><div><b>celestiachefprivado</b>'
            f'<small>{c["icono"]} {bi(c["es"], c["en"])}</small></div><span class="ig-k">{bi(fecha_corta(a["fecha"],"es"), fecha_corta(a["fecha"],"en"))}</span></header>'
            f'<a class="ig-img" href="{url}" style="background-image:url(\'{U(a["img"],720,900)}\')" aria-label="{tit}">'
            f'<span class="ig-pill">{bi(str(minutos(es["cuerpo"]))+" min", str(minutos(en["cuerpo"]))+" min")}</span>'
            f'<span class="ig-ttl" aria-hidden="true">{bi(es["titulo"], en["titulo"])}</span>'
            f'<svg class="ig-heart" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 20.5s-7.5-4.6-9.3-9.3C1.4 7.9 3.6 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.4 0 5.6 3.4 4.3 6.7-1.8 4.7-9.3 9.3-9.3 9.3z"/></svg></a>'
            f'<div class="ig-a"><button type="button" class="ig-like" aria-pressed="false" aria-label="Me gusta: {tit}">{SVG_LIKE}</button>'
            f'<a class="ig-b" href="{url}#cp-int" aria-label="Opinar sobre: {tit}">{SVG_COM}</a>'
            f'<button type="button" class="ig-shr" aria-label="Compartir: {tit}">{SVG_SHR}</button>'
            f'<button type="button" class="cp-esc" data-slug="{a["slug"]}" hidden aria-pressed="false" aria-label="Escuchar la nota: {tit}"><i aria-hidden="true">▶</i><span>Escuchar</span></button>'
            f'<span class="sp"></span><button type="button" class="ig-save" aria-pressed="false" aria-label="Guardar: {tit}">{SVG_SAVE}</button></div>'
            f'<div class="ig-c"><div class="ig-likes" aria-live="polite"></div><span class="ig-u">celestiachefprivado</span>'
            f'<h3><a href="{url}">{bi(es["titulo"], en["titulo"])}</a></h3>'
            f'<p>{bi(es["bajada"], en["bajada"])}</p><span class="ig-tags">{bi(tag_es + " #escueladecocina #chefprivado", tag_en + " #culinaryschool #privatechef")}</span>'
            f'<a class="ig-more" href="{url}">{bi("Leer la nota completa", "Read the full note")}</a></div></article>')

def fecha_corta(f, lang):
    y, m, d = map(int, f.split('-'))
    return f'{d} {MESES[m-1][:3]}' if lang == 'es' else f'{MONTHS[m-1][:3]} {d}'

NAV = dict(nav_caps=bi('Blog', 'Blog'), nav_home=bi('Inicio', 'Home'), nav_book=bi('Reservar →', 'Book →'))

def alternos(ruta):
    """hreflang: misma página en español (ruta) y en inglés (/en + ruta)."""
    es_u = SITE + ruta; en_u = SITE + '/en' + (ruta if ruta != '/' else '')
    return (f'<link rel="alternate" hreflang="es" href="{es_u}"><link rel="alternate" hreflang="en" href="{en_u}">'
            f'<link rel="alternate" hreflang="x-default" href="{es_u}">')

def a_ingles(h, ruta):
    """Ajusta una página generada para servirla en /en: idioma fijo, enlaces internos y locale."""
    h = h.replace('<html lang="es"', f'<html lang="en" class="lang-en" data-lang-fijo="en" data-alt-es="{ruta}"', 1)
    h = h.replace('content="es_AR"', 'content="en_US"')
    h = re.sub(r'href="/blog(?=[/"#?])', 'href="/en/blog', h)
    h = h.replace('href="/"', 'href="/en"')
    return h

def escribir(rel, contenido):
    if LANG == 'en':
        ruta = '/' + rel[:-len('index.html')].rstrip('/')
        contenido = a_ingles(contenido, ruta); rel = 'en/' + rel
    p = os.path.join(ROOT, rel); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(contenido)

def articulo(a):
    es, en, c = a['es'], a['en'], CATS[a['cat']]
    url = SITE + L('', '/en') + f'/blog/{a["slug"]}'
    ld = '<script type="application/ld+json">' + json.dumps({
        "@context": "https://schema.org", "@type": "Article", "headline": L(es['titulo'], en['titulo']), "description": L(es['bajada'], en['bajada']),
        "image": U(a['img'], 1200, 630), "datePublished": a['fecha'], "inLanguage": L("es-AR", "en"),
        "author": {"@type": "Person", "name": "Daro Castello"},
        "publisher": {"@type": "Organization", "name": "Celestia Chef Privado", "url": SITE},
        "mainEntityOfPage": url}, ensure_ascii=False) + '</script>'
    otros = [x for x in ARTICULOS if x['slug'] != a['slug']][:3]
    h = HEAD.format(title=html.escape(L(es['titulo'] + ' · Blog Celestia', en['titulo'] + ' · Celestia Blog')), title_en=html.escape(en['titulo'] + ' · Celestia Blog'),
                    desc=html.escape(L(es['bajada'], en['bajada'])), url=url, alt=alternos(f'/blog/{a["slug"]}'), ogtype='article', ogimg=U(a['img'], 1200, 630), css=CSS, ld=ld, **NAV)
    h += (f'<section class="cp-hero" style="background-image:url(\'{U(a["img"],1800,900)}\')"><a class="cp-volver" href="/blog"><b>←</b>{bi("Todas las notas","All notes")}</a><div class="cp-hero-in">'
          f'<a class="cp-k" href="/blog" style="text-decoration:none">✦ {bi("Blog","Blog")} · {c["icono"]} {bi(c["es"], c["en"])}</a>'
          f'<h1>{bi(es["titulo"], en["titulo"])}</h1><p class="cp-baj">{bi(es["bajada"], en["bajada"])}</p>'
          f'<div class="cp-meta"><img src="/img/daro-avatar.webp" alt="Daro Castello"><span>{bi("Por Daro Castello","By Daro Castello")}</span>'
          f'<span>{bi(fecha(a["fecha"],"es"), fecha(a["fecha"],"en"))}</span><span>{bi(str(minutos(es["cuerpo"]))+" min de lectura", str(minutos(en["cuerpo"]))+" min read")}</span></div></div></section>')
    mn_es, mn_en = str(minutos(es["cuerpo"])) + ' min', str(minutos(en["cuerpo"])) + ' min'
    h += (f'<section class="cp-tts" id="cp-tts" data-min="{mn_es}" data-min-en="{mn_en}" aria-label="Escuchar la nota y tamaño de letra"><div>'
          f'<button type="button" class="tts-play" id="tts-play" aria-pressed="false"><i aria-hidden="true">▶</i>{bi("Escuchar la nota","Listen to this note")} <small>{mn_es}</small></button>'
          f'<button type="button" class="tts-b" id="tts-stop" hidden aria-label="Detener lectura">■</button>'
          f'<button type="button" class="tts-b" id="tts-vel" aria-label="Velocidad de lectura">1×</button>'
          f'<span class="tts-sep"></span><span class="tts-lbl">{bi("Letra","Text")}</span>'
          f'<button type="button" class="tts-b" data-fs="-1" aria-label="Achicar la letra">A−</button>'
          f'<button type="button" class="tts-b" data-fs="1" aria-label="Agrandar la letra" style="font-size:17px">A+</button>'
          '</div></section>')
    h += f'<article class="cp-body"><div class="b-es">{bloques(es["cuerpo"],"es")}</div><div class="b-en" lang="en">{bloques(en["cuerpo"],"en")}</div></article>'
    if a['cat'] in ('trastienda', 'seguridad'):
        h += ('<aside class="cp-mf"><span>✦ Celestia Management</span><b>' + bi('¿Tenés un restaurante, café o emprendimiento gastronómico?', 'Do you run a restaurant, café or food business?') + '</b>'
              '<p>' + bi('Te ayudo con carta, costos, procesos, equipo y marca. Primer diagnóstico sin costo.', 'I help with menu, costs, processes, team and brand. First diagnosis free.') + '</p>'
              '<a href="/management?utm_source=blog&utm_medium=nota&utm_campaign=' + a['slug'][:40] + '">' + bi('Conocer la consultoría →', 'See the consulting →') + '</a></aside>')
    h += (f'<nav class="cp-fin" aria-label="Volver"><a class="pri" href="/blog">← {bi("Volver a todas las notas","Back to all notes")}</a>'
          f'<a href="/blog#{a["cat"]}">{c["icono"]} {bi("Más de " + c["es"], "More " + c["en"])}</a></nav>')
    h += f'<a class="cp-flot" id="cp-flot" href="/blog"><b>←</b>{bi("Blog","Blog")}</a><script>(function(){{var f=document.getElementById("cp-flot");addEventListener("scroll",function(){{var e=document.querySelector(".cp-fin");f.classList.toggle("on",scrollY>520&&(!e||e.getBoundingClientRect().top>innerHeight));}},{{passive:true}});}})();</script>'
    h += '<section class="cp-int" data-slug="' + a['slug'] + '"><div><h3>' + bi('¿Te sirvió esta nota?', 'Was this note useful?') + '</h3>' + '<div class="cp-vot"><button type="button" class="cp-vb" data-v="up" aria-label="Me sirvió"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0 4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7"/></svg>' + bi('Sí, me sirvió','Yes') + '</button>' + '<button type="button" class="cp-vb" data-v="down" aria-label="No me sirvió"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="transform:scaleY(-1)"><path d="M7 10v11H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3zm0 0 4-8a3 3 0 0 1 3 3v4h5.5a2 2 0 0 1 2 2.3l-1.4 8A2 2 0 0 1 18.1 21H7"/></svg>' + bi('No tanto','Not really') + '</button></div>' + '<p class="cp-vmsg" aria-live="polite"></p>' + '<div class="cp-shr"><p>' + bi('¿Conocés a alguien que cocine? Recomendale esta nota', 'Know someone who cooks? Share this note') + '</p><div class="cp-shb">' + '<button type="button" class="cp-sb nat" data-s="nativo" hidden><svg viewBox="0 0 24 24"><path d="M18 16a3 3 0 0 0-2.4 1.2l-6.7-3.4a3 3 0 0 0 0-1.6l6.7-3.4A3 3 0 1 0 15 7l-6.7 3.4a3 3 0 1 0 0 3.2L15 17a3 3 0 1 0 3-1z"/></svg><span>' + bi('Compartir','Share') + '</span></button>' + '<button type="button" class="cp-sb wa" data-s="whatsapp" aria-label="WhatsApp"><svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg><span>WhatsApp</span></button>' + '<button type="button" class="cp-sb fb" data-s="facebook" aria-label="Facebook"><svg viewBox="0 0 24 24"><path d="M14 8V6c0-.9.6-1 1-1h3V1h-4c-4 0-5 3-5 5v2H6v4h3v11h5V12h3.6l.4-4z"/></svg><span>Facebook</span></button>' + '<button type="button" class="cp-sb x" data-s="x" aria-label="X"><svg viewBox="0 0 24 24"><path d="M18.2 2h3.4l-7.4 8.5L23 22h-6.8l-5.3-7-6.1 7H1.4l7.9-9L1 2h7l4.8 6.4zm-1.2 18h1.9L7.1 4H5.1z"/></svg><span>X</span></button>' + '<button type="button" class="cp-sb cp" data-s="copiar" aria-label="Copiar link"><svg viewBox="0 0 24 24"><path d="M16 1H4a2 2 0 0 0-2 2v14h2V3h12zm3 4H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm0 16H8V7h11z"/></svg><span>' + bi('Copiar link','Copy link') + '</span></button>' + '</div></div></div></section>'
    h += ('<section class="cp-ctab"><div><h3>' + bi('¿Querés que lo cocine en tu casa?', 'Want me to cook it at your home?') + '</h3><p>' +
          bi('Menús de 3 o 7 pasos, terminados en tu casa y con servicio completo en CABA y GBA.', '3- or 7-course menus, finished at your home with full service in Buenos Aires.') +
          '</p><a class="cp-btn" href="/">' + bi('Reservar una experiencia →', 'Book an experience →') + '</a></div></section>')
    if 'pexels.com' in a['img']:
        h += f'<p class="cp-cred">{bi("Foto de referencia", "Reference photo")}: <a href="https://www.pexels.com" target="_blank" rel="noopener">Pexels</a></p>'
    else:
        h += f'<p class="cp-cred">{bi("Foto de referencia", "Reference photo")}: {a["foto"]} · <a href="https://unsplash.com" target="_blank" rel="noopener">Unsplash</a></p>'
    h += '<section class="cp-rel"><h3>' + bi('Seguí leyendo', 'Keep reading') + '</h3><div class="cp-grid ig-feed">' + ''.join(card(x) for x in otros) + '</div></section>'
    h += TTS_JS + IG_JS
    h += pie()
    escribir(f'blog/{a["slug"]}/index.html', h)

# Interacciones de los posts: me gusta (doble toque en la foto), guardar, compartir y filtro «Guardadas».
# Todo queda en el navegador de cada lector (no hay contadores inventados).
IG_JS = """<script>(function(){
var H=document.documentElement;function T(es,en){return H.classList.contains('lang-en')?en:es;}
function tr(ev,p){try{window.celTrack&&celTrack(ev,p||{});}catch(e){}}
function lee(k){try{return JSON.parse(localStorage.getItem(k)||'[]')||[];}catch(e){return[];}}
function graba(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}}
var likes=lee('cel_blog_likes'),guard=lee('cel_blog_guardadas');
function pinta(c){var s=c.getAttribute('data-slug'),l=likes.indexOf(s)>=0,g=guard.indexOf(s)>=0,bl=c.querySelector('.ig-like'),bg=c.querySelector('.ig-save'),lk=c.querySelector('.ig-likes');
 bl.classList.toggle('on',l);bl.setAttribute('aria-pressed',l);bg.classList.toggle('on',g);bg.setAttribute('aria-pressed',g);
 if(lk)lk.innerHTML=l?'<span class="b-es">Te gusta esta nota</span><span class="b-en">You like this note</span>':'';}
function like(c,forzar){var s=c.getAttribute('data-slug'),i=likes.indexOf(s);if(i>=0&&forzar)return;if(i>=0)likes.splice(i,1);else{likes.push(s);tr('blog_like',{articulo:'/blog/'+s});}graba('cel_blog_likes',likes);pinta(c);}
document.querySelectorAll('.ig').forEach(function(c){var s=c.getAttribute('data-slug');pinta(c);
 c.querySelector('.ig-like').addEventListener('click',function(){like(c);});
 c.querySelector('.ig-save').addEventListener('click',function(){var i=guard.indexOf(s);if(i>=0)guard.splice(i,1);else{guard.push(s);tr('blog_guardar',{articulo:'/blog/'+s});}graba('cel_blog_guardadas',guard);pinta(c);cuenta();});
 c.querySelector('.ig-shr').addEventListener('click',function(){var t=(c.querySelector('h3 .b-'+(H.classList.contains('lang-en')?'en':'es'))||{}).textContent||document.title,u=location.origin+'/blog/'+s+'?utm_source=compartir&utm_medium=feed&utm_campaign=blog';tr('blog_compartir',{articulo:'/blog/'+s,red:'feed'});
  if(navigator.share)navigator.share({title:t,url:u}).catch(function(){});else window.open('https://api.whatsapp.com/send?text='+encodeURIComponent(t+' 👉 '+u),'_blank','noopener');});
 var im=c.querySelector('.ig-img'),tm=0,hz=c.querySelector('.ig-heart');
 im.addEventListener('click',function(e){if(e.ctrlKey||e.metaKey||e.shiftKey||e.button)return;var n=Date.now();if(n-tm<320){e.preventDefault();clearTimeout(im._t);like(c,true);hz.classList.remove('go');void hz.offsetWidth;hz.classList.add('go');tm=0;return;}tm=n;e.preventDefault();im._t=setTimeout(function(){location.href=im.getAttribute('href');},330);});
});
var g=document.querySelector('.ig-g'),feed=document.querySelector('.ig-feed'),vacio=null;
function cuenta(){var n=document.querySelector('.ig-g .ig-n');if(n)n.textContent=guard.length?' ('+guard.length+')':'';}
cuenta();
if(g)g.addEventListener('click',function(){document.querySelectorAll('.ig-hl .cp-chip').forEach(function(x){x.classList.remove('on');});g.classList.add('on');
 var n=0;document.querySelectorAll('.ig-feed .ig').forEach(function(c){var ok=guard.indexOf(c.getAttribute('data-slug'))>=0;c.classList.toggle('hide',!ok);if(ok)n++;});
 if(!vacio){vacio=document.createElement('div');vacio.className='ig-vacio';feed.appendChild(vacio);}vacio.textContent=n?'':T('Todavía no guardaste notas. Tocá 🔖 en cualquier post para tenerla a mano.','You haven’t saved any notes yet. Tap 🔖 on any post to keep it handy.');vacio.style.display=n?'none':'';});
document.querySelectorAll('.ig-hl .cp-chip').forEach(function(x){x.addEventListener('click',function(){if(g)g.classList.remove('on');if(vacio)vacio.style.display='none';});});
var q=document.getElementById('ig-buscar'),qx=document.getElementById('ig-bx'),qn=document.getElementById('ig-bn'),qv=null,qt=0;
function nrm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');}
function buscar(){var t=nrm(q.value).trim(),ps=t.split(' ').filter(function(w){return w&&['de','la','el','en','y','a','del','los','las','the','of','and','in'].indexOf(w)<0;}),n=0,cards=document.querySelectorAll('.ig-feed .ig');
 cards.forEach(function(c){var d=c.getAttribute('data-q')||'',ok=ps.every(function(w){return d.indexOf(w)>=0;});c.classList.toggle('qhide',!ok);if(ok&&!c.classList.contains('hide'))n++;});
 qx.hidden=!t;qn.textContent=t?(n+' '+T(n===1?'nota':'notas',n===1?'note':'notes')):'';
 if(!qv){qv=document.createElement('div');qv.className='ig-vacio';feed.appendChild(qv);}
 qv.style.display=(t&&!n)?'':'none';qv.textContent=T('No encontré notas con «'+q.value.trim()+'». Probá con otra palabra o mirá los temas de arriba.','No notes found for “'+q.value.trim()+'”. Try another word or browse the topics above.');
 clearTimeout(qt);if(t.length>2)qt=setTimeout(function(){tr('blog_buscar',{q:t,resultados:n});},1200);}
if(q){q.addEventListener('input',function(){var on=document.querySelector('.ig-hl .on'),td=document.querySelector('.ig-hl .cp-chip[data-cat=todas]');if(q.value.trim()&&on&&on!==td&&td)td.click();buscar();});qx.addEventListener('click',function(){q.value='';buscar();q.focus();});
 document.querySelectorAll('.ig-hl button').forEach(function(x){x.addEventListener('click',function(){setTimeout(buscar,0);});});
 document.addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement!==q&&!/input|textarea/i.test((document.activeElement||{}).tagName||'')){e.preventDefault();q.focus();}});
 try{var u=new URLSearchParams(location.search).get('q');if(u){q.value=u;buscar();}}catch(e){}}
})();</script>"""


# ── Nube "Lo más buscado": cada término es una búsqueda del blog. Su tamaño sale de datos reales:
#    búsquedas en Google (Search Console, 28 días al 27/10/2026) + lo que más leen, guardan, comparten y escuchan
#    los lectores en el blog (tabla blog_eventos, últimos 90 días) + lo que más se busca en el buscador del blog.
STOP = {'de', 'la', 'el', 'en', 'y', 'a', 'del', 'los', 'las', 'the', 'of', 'and', 'in'}
NUBE = [  # (español, inglés, búsqueda, impresiones en Google)
    ('Chef privado', 'Private chef', 'chef privado', 45), ('Ceviche', 'Ceviche', 'ceviche', 74),
    ('Salsas madre', 'Mother sauces', 'salsas madre', 17), ('Masas quebradas', 'Shortcrust pastry', 'quebradas', 10),
    ('Puré', 'Mashed potatoes', 'pure', 5), ('Sushi', 'Sushi', 'sushi', 4), ('Food cost', 'Food cost', 'food cost', 4),
    ('Vino', 'Wine', 'vino', 2), ('Pan casero', 'Homemade bread', 'pan casero', 2), ('Menú degustación', 'Tasting menu', 'degustacion', 2),
    ('Maridaje', 'Pairing', 'maridaje', 1), ('Prime cost', 'Prime cost', 'prime cost', 1), ('Punto de equilibrio', 'Break-even', 'equilibrio', 1),
    ('Pasta fresca', 'Fresh pasta', 'pasta fresca', 0), ('Ñoquis', 'Gnocchi', 'noquis', 0), ('Risotto', 'Risotto', 'risotto', 0),
    ('Merengue', 'Meringue', 'merengue', 0), ('Tiramisú', 'Tiramisu', 'tiramisu', 0), ('Mousse', 'Mousse', 'mousse', 0),
    ('Masa bomba', 'Choux pastry', 'choux', 0), ('Crema pastelera', 'Pastry cream', 'crema pastelera', 0),
    ('Focaccia', 'Focaccia', 'focaccia', 0), ('Medialunas', 'Croissants', 'medialunas', 0), ('Scones', 'Scones', 'scones', 0),
    ('Empanadas', 'Empanadas', 'empanadas', 0), ('Arepas', 'Arepas', 'arepas', 0), ('Feijoada', 'Feijoada', 'feijoada', 0),
    ('Causa limeña', 'Causa limeña', 'causa', 0), ('Lomo saltado', 'Lomo saltado', 'lomo saltado', 0), ('Osobuco', 'Osso buco', 'osobuco', 0),
    ('Ojo de bife', 'Rib eye', 'ojo de bife', 0), ('Punto de la carne', 'Meat doneness', 'punto carne', 0), ('Pescado', 'Fish', 'pescado', 0),
    ('Huevo', 'Eggs', 'huevo', 0), ('Especias', 'Spices', 'especias', 0), ('Emplatado', 'Plating', 'emplatar', 0),
    ('Espumantes', 'Sparkling wine', 'espumantes', 0), ('Cerveza', 'Beer', 'cerveza', 0), ('Quesos', 'Cheese', 'quesos', 0),
    ('Nutrición', 'Nutrition', 'nutricion', 0), ('Vegetariano', 'Vegetarian', 'vegetariana', 0), ('Etiquetas', 'Food labels', 'etiqueta', 0),
    ('Chef semanal', 'Weekly chef', 'chef semanal', 0), ('Cóctel en casa', 'Cocktail party', 'coctel', 0), ('Poner la mesa', 'Table setting', 'mesa', 0),
    ('Cocina francesa', 'French cooking', 'francesa', 0), ('Manipulación de alimentos', 'Food safety', 'manipulacion', 0),
]

def nube_html():
    import math
    qs = [claves(a) for a in ARTICULOS]
    out = []
    for es_, en_, q, seed in NUBE:
        import unicodedata
        lab = ''.join(c for c in unicodedata.normalize('NFD', L(es_, en_).lower()) if unicodedata.category(c) != 'Mn')
        w = [x for x in re.findall(r'[a-z0-9]+', lab) if x not in STOP]
        n = sum(1 for d in qs if all(x in d for x in w))
        if not n: continue
        nivel = 1 + min(4, int(math.log2(1 + seed + n)))  # tamaño inicial (sin JS): Google + cantidad de notas
        out.append((seed + n, f'<button type="button" class="ig-t s{nivel}" data-q="{q}" data-seed="{seed}" data-n="{n}">{L(es_, en_)}</button>'))
    top = set(id(x) for x in sorted(out, key=lambda x: -x[0])[:12])
    out = [b if id(x) in top else b.replace('class="ig-t ', 'class="ig-t x ') for x in out for b in [x[1]]]
    return ('<section class="ig-nube" aria-labelledby="ig-nube-t"><div class="ig-nube-h"><h2 id="ig-nube-t"><i aria-hidden="true">✦</i>' + L('Lo más buscado', 'Most searched') + '</h2>'
            '<small id="ig-nube-s">' + L('Según Google y lo que más leen, guardan y comparten los lectores', 'Based on Google and what readers read, save and share most') + '</small></div>'
            '<div class="ig-nube-c" id="ig-nube-c">' + ''.join(out) +
            '<button type="button" class="ig-nube-mas" id="ig-nube-mas" onclick="this.closest(\'.ig-nube\').classList.add(\'todo\')">' + L('+ más temas', '+ more topics') + '</button></div></section>')

NUBE_JS = """<script>(function(){
var c=document.getElementById('ig-nube-c'),q=document.getElementById('ig-buscar');if(!c||!q)return;
var H=document.documentElement;function T(es,en){return H.classList.contains('lang-en')?en:es;}
function nrm(s){return (s||'').toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'');}
var cards=[].slice.call(document.querySelectorAll('.ig-feed .ig'));
var STOP={de:1,la:1,el:1,en:1,y:1,a:1,del:1,los:1,las:1,the:1,of:1,and:1,'in':1};
function notas(term){var w=nrm(term).split(/[^a-z0-9]+/).filter(function(x){return x&&!STOP[x];});return cards.filter(function(k){var d=k.getAttribute('data-q')||'';return w.every(function(x){return d.indexOf(x)>=0;});});}
function pintar(datos){
 var N=(datos&&datos.notas)||{},B=(datos&&datos.busquedas)||[],P={vista:1,like:3,guardar:3,compartir:4,escuchar:2,voto:2};
 function pts(slug){var o=N[slug]||{},t=0;for(var k in o)t+=(P[k]||1)*o[k];return t;}
 var bs=c.querySelectorAll('.ig-t'),ya={};
 [].forEach.call(bs,function(b){ya[b.getAttribute('data-q')]=1;});
 B.forEach(function(x){var t=nrm(x.t).trim();if(!t||ya[t]||!notas(t).length)return;ya[t]=1;var b=document.createElement('button');b.type='button';b.className='ig-t';b.setAttribute('data-q',t);b.setAttribute('data-seed','0');b.textContent=x.t.charAt(0).toUpperCase()+x.t.slice(1);c.appendChild(b);});
 var lista=[].map.call(c.querySelectorAll('.ig-t'),function(b){var t=b.textContent,ns=notas(t),s=0;ns.forEach(function(k){s+=pts(k.getAttribute('data-slug'));});
   var busq=0;B.forEach(function(x){if(nrm(x.t).indexOf(t)>=0)busq+=x.n;});
   return {b:b,w:(+b.getAttribute('data-seed')||0)+s/Math.sqrt(Math.max(1,ns.length))+busq*5,n:ns.length};});
 var orden=lista.slice().sort(function(a,b){return b.w-a.w;}),L=orden.length;
 orden.forEach(function(x,i){var r=i/L,niv=x.w<=0?1:r<.08?5:r<.22?4:r<.45?3:2;x.b.className='ig-t s'+niv+(i>=12?' x':'');x.b.title=T(x.n+(x.n===1?' nota':' notas'),x.n+(x.n===1?' note':' notes'));});
 // mezcla estable: grandes repartidos en la nube
 lista.sort(function(a,b){return (a.b.textContent.length*7+a.w)%5-(b.b.textContent.length*7+b.w)%5;}).forEach(function(x){c.appendChild(x.b);});
 var mas=document.getElementById('ig-nube-mas');if(mas)c.appendChild(mas);
 [].forEach.call(c.querySelectorAll('.ig-t'),function(b,i){b.style.setProperty('--i',i);});
}
c.addEventListener('click',function(e){var b=e.target.closest('.ig-t');if(!b)return;q.value=b.textContent.trim();q.dispatchEvent(new Event('input'));
 [].forEach.call(c.querySelectorAll('.ig-t'),function(x){x.classList.toggle('on',x===b);});
 var f=document.querySelector('.ig-tabs');if(f)f.scrollIntoView({behavior:'smooth',block:'start'});
 try{window.celTrack&&celTrack('blog_buscar',{q:nrm(b.textContent.trim()),resultados:notas(b.textContent).length,origen:'nube'});}catch(_){}});
q.addEventListener('input',function(){if(!q.value)[].forEach.call(c.querySelectorAll('.ig-t'),function(x){x.classList.remove('on');});});
var sec=c.closest('.ig-nube');
if(sec&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){sec.classList.add('anim');
 var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){sec.classList.add('in');io.disconnect();}},{threshold:.2});io.observe(sec);}
else if(sec)sec.classList.add('in');
document.getElementById('ig-nube-mas')&&document.getElementById('ig-nube-mas').addEventListener('click',function(){[].forEach.call(c.querySelectorAll('.ig-t.x'),function(b,i){b.style.setProperty('--i',i);b.style.animation='none';void b.offsetWidth;b.style.animation='';});});
pintar(null);
try{fetch('https://qolpnuscpmzqeacshfvu.supabase.co/rest/v1/rpc/blog_nube',{method:'POST',headers:{apikey:'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbHBudXNjcG16cWVhY3NoZnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjQ3OTQsImV4cCI6MjA5MTM0MDc5NH0.BJOz5Gwkeb1NqID_gkGKD5YlymifMtOwaf8iQMaBCx8',Authorization:'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbHBudXNjcG16cWVhY3NoZnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjQ3OTQsImV4cCI6MjA5MTM0MDc5NH0.BJOz5Gwkeb1NqID_gkGKD5YlymifMtOwaf8iQMaBCx8','Content-Type':'application/json'},body:'{"dias":90}'})
 .then(function(r){return r.ok?r.json():null;}).then(function(d){if(d)pintar(d);}).catch(function(){});}catch(e){}
})();</script>"""

def indice():
    url = SITE + L('', '/en') + '/blog'
    h = HEAD.format(title=L('Blog · Lo que me enseñaron en la escuela de cocina | Celestia Chef Privado', 'Blog · What I learned at culinary school | Celestia Private Chef in Buenos Aires'), title_en='Blog · What I learned at culinary school | Celestia Private Chef',
                    desc=L('Lo que me enseñaron en la escuela de cocina, contado por Daro Castello: cortes, salsas madre, técnicas y recetas fáciles con toques de chef.',
                           'What I learned at culinary school, told by private chef Daro Castello in Buenos Aires: knife cuts, mother sauces, techniques and easy recipes with a chef\'s touch.'),
                    url=url, alt=alternos('/blog'), ogtype='website', ogimg=U(ARTICULOS[0]['img'], 1200, 630), css=CSS, ld='', **NAV)
    orden = sorted(ARTICULOS, key=lambda x: x['fecha'], reverse=True)
    usadas = [k for k in CATS if any(a['cat'] == k for a in ARTICULOS)]
    # Perfil
    h += ('<section class="ig-prof"><div class="ig-pin"><span class="ig-av"><img src="/img/daro-castello.webp" alt="Daro Castello, chef de Celestia" width="148" height="148"></span>'
          '<div class="ig-pi"><div class="ig-un"><span class="ig-user">celestiachefprivado ' + SVG_OK + '</span>'
          '<a class="ig-follow" href="https://www.instagram.com/celestiachefprivado/" target="_blank" rel="noopener">' + bi('Seguir en Instagram', 'Follow on Instagram') + '</a>'
          '<a class="ig-follow alt" href="/">' + bi('Reservar', 'Book') + '</a></div>'
          f'<ul class="ig-stats"><li><b>{len(ARTICULOS)}</b> {bi("notas","notes")}</li><li><b>{len(usadas)}</b> {bi("temas","topics")}</li><li><b>3 y 7</b> {bi("pasos","courses")}</li></ul></div>'
          '<div class="ig-bio"><h1>' + bi('Lo que me enseñaron en la <em>escuela de cocina</em>', 'What I learned at <em>culinary school</em>') + '</h1><p><b>Daro Castello · ' + bi('Chef privado', 'Private chef') + '</b><br>' +
          bi('Trucos de escuela contados simple: cortes, salsas, técnicas y recetas fáciles con ese detalle que te hace ver como chef. 📍 Buenos Aires',
             'Culinary-school tricks made simple: cuts, sauces, techniques and easy recipes with that detail that makes you look like a chef. 📍 Buenos Aires') + '</p></div></div></section>')
    # Destacadas (filtran por tema)
    def ult(k): return next(a for a in orden if a['cat'] == k)
    hl = ('<button type="button" class="cp-chip on" data-cat="todas"><span class="ig-ring"><i class="ic" aria-hidden="true">✦</i></span><span class="lb">' + bi('Todas', 'All') + '</span></button>' +
          '<button type="button" class="ig-g"><span class="ig-ring"><i class="ic" aria-hidden="true">🔖</i></span><span class="lb">' + bi('Guardadas', 'Saved') + '<b class="ig-n"></b></span></button>' +
          ''.join(f'<button type="button" class="cp-chip" data-cat="{k}" title="{html.escape(CATS[k]["es"])}"><span class="ig-ring"><i style="background-image:url(\'{U(ult(k)["img"],160,160)}\')" aria-hidden="true"></i></span>'
                  f'<span class="lb">{bi(CATS[k]["es"], CATS[k]["en"])}</span></button>' for k in usadas))
    h += '<nav class="cp-chips ig-hl" aria-label="' + 'Temas del blog' + '">' + hl + '</nav>'
    h += ('<div class="ig-q" role="search"><label><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>'
          '<input type="search" id="ig-buscar" autocomplete="off" placeholder="' + L('Buscar notas, recetas, técnicas…', 'Search notes, recipes, techniques…') + '" aria-label="' + L('Buscar en el blog', 'Search the blog') + '">'
          '<button type="button" class="x" id="ig-bx" hidden aria-label="' + L('Borrar búsqueda', 'Clear search') + '">✕</button></label><small id="ig-bn" aria-live="polite"></small></div>')
    h += nube_html()
    h += '<div class="ig-tabs" aria-hidden="true"><span class="on">▦ ' + bi('Publicaciones', 'Posts') + '</span></div>'
    h += '<div class="cp-grid ig-feed">' + ''.join(card(a) for a in orden) + '</div>'
    h += TTS_INDICE + IG_JS + NUBE_JS
    h += pie()
    escribir('blog/index.html', h)

def globo_hero():
    """Globo tipo historia de Instagram en el hero de la home: lleva al blog y muestra la última nota."""
    p = os.path.join(ROOT, 'index.html'); t = open(p, encoding='utf-8').read()
    ini, fin = '<!--BLOG-GLOBO-START-->', '<!--BLOG-GLOBO-END-->'
    a = sorted(ARTICULOS, key=lambda x: x['fecha'], reverse=True)[0]
    css = ('<style>'
      '#beta-landing .bl-glo{position:absolute;top:26px;right:52px;z-index:8;display:flex;flex-direction:column;align-items:center;gap:6px;text-decoration:none;color:#FAF6EF;font-family:"DM Sans",sans-serif}'
      '#beta-landing .bl-glo-r{position:relative;width:78px;height:78px;border-radius:50%;padding:3px;display:block}'
      '#beta-landing .bl-glo-r::before{content:"";position:absolute;inset:0;border-radius:50%;background:conic-gradient(from 0deg,#C9A84C,#E8C96B,#fff3c4,#E8C96B,#C9A84C);animation:blGloG 3.2s linear infinite}'
      '#beta-landing .bl-glo-r i{position:relative;display:block;width:100%;height:100%;border-radius:50%;border:3px solid #0D1B2A;background:#1a2e42 center/cover no-repeat;box-shadow:0 10px 28px rgba(0,0,0,.4)}'
      '#beta-landing .bl-glo-r b{position:absolute;right:-6px;top:-4px;z-index:2;background:#E8C96B;color:#0D1B2A;font:700 9.5px/1 "DM Sans",sans-serif;letter-spacing:.06em;text-transform:uppercase;padding:4px 7px;border-radius:999px;border:2px solid #0D1B2A;box-shadow:0 4px 10px rgba(0,0,0,.3)}'
      '#beta-landing .bl-glo-l{font:600 12.5px "DM Sans",sans-serif;letter-spacing:.04em;background:rgba(13,27,42,.55);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);border:1px solid rgba(232,201,107,.45);padding:4px 11px;border-radius:999px}'
      '#beta-landing .bl-glo-t{position:absolute;right:calc(100% + 12px);top:8px;width:230px;padding:11px 13px;border-radius:14px;background:rgba(13,27,42,.88);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);border:1px solid rgba(232,201,107,.4);font-size:12.5px;line-height:1.4;color:rgba(250,246,239,.85);opacity:0;transform:translateX(6px);transition:opacity .25s,transform .25s;pointer-events:none;text-align:left}'
      '#beta-landing .bl-glo-t small{display:block;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#E8C96B;margin-bottom:3px}'
      '#beta-landing .bl-glo:hover .bl-glo-t,#beta-landing .bl-glo:focus-visible .bl-glo-t{opacity:1;transform:none}'
      '#beta-landing .bl-glo:hover .bl-glo-r i{transform:scale(1.04)}#beta-landing .bl-glo-r i{transition:transform .25s}'
      '#beta-landing .bl-glo:focus-visible{outline:3px solid #E8C96B;outline-offset:4px;border-radius:14px}'
      '@keyframes blGloG{to{transform:rotate(360deg)}}'
      '@media(max-width:900px){#beta-landing .bl-glo{top:16px;right:16px}#beta-landing .bl-glo-r{width:62px;height:62px}#beta-landing .bl-glo-l{font-size:11.5px;padding:3px 9px}#beta-landing .bl-glo-t{display:none}}'
      '@media(prefers-reduced-motion:reduce){#beta-landing .bl-glo-r::before{animation:none}}'
      '</style>')
    html_ = (f'<a class="bl-glo" href="/blog?utm_source=home&amp;utm_medium=globo_hero&amp;utm_campaign=blog" data-no-tr aria-label="Blog: {html.escape(a["es"]["titulo"])}">'
             f'<span class="bl-glo-r"><i style="background-image:url(\'{U(a["img"],200,200)}\')"></i><b hidden data-f="{a["fecha"]}">{bi("Nuevo","New")}</b></span>'
             f'<span class="bl-glo-l">✦ Blog</span>'
             f'<span class="bl-glo-t"><small>{bi("Última nota","Latest note")}</small>{bi(a["es"]["titulo"], a["en"]["titulo"])}</span></a>')
    js = "<script>(function(){var b=document.querySelector('#beta-landing .bl-glo b[data-f]');if(b&&Date.now()-new Date(b.getAttribute('data-f')+'T12:00:00')<1814400000)b.hidden=false;})();</script>"
    bloque = ini + css + html_ + js + fin
    if ini in t:
        t = re.sub(re.escape(ini) + '.*?' + re.escape(fin), lambda m: bloque, t, flags=re.S)
    else:
        ancla = '<div class="bl-hero">'
        assert t.count(ancla) == 1
        t = t.replace(ancla, ancla + bloque)
    open(p, 'w', encoding='utf-8').write(t)

def llms():
    """llms.txt: resumen para asistentes de IA. Conserva la cabecera escrita a mano y regenera FAQ y notas del blog."""
    p = os.path.join(ROOT, 'llms.txt'); t = open(p, encoding='utf-8').read()
    cab = t.split('\n## Preguntas frecuentes')[0].rstrip() + '\n'
    faq = [
        ('¿Cuánto cuesta un chef privado en Buenos Aires con Celestia?', 'Menú de 3 pasos desde $480.000 y menú de 7 pasos desde $720.000 para 2 personas, todo incluido (servicio, asistentes e ingredientes). El valor crece según la cantidad de comensales; fines de semana +10% sobre el servicio. Detalle en https://www.chefprivado.ar/blog/cuanto-cuesta-un-chef-privado-en-buenos-aires'),
        ('¿Qué incluye el servicio?', 'Diseño del menú, compra de ingredientes, preproducción en la cocina de Daro, terminación y emplatado en la casa del cliente, servicio en mesa con asistentes y la cocina limpia al terminar. No incluye bebidas ni vajilla (se puede cotizar alquiler).'),
        ('¿Para cuántas personas?', 'De 2 a 12 personas con reserva online. Más de 12 se trata como evento a medida, con una reunión previa.'),
        ('¿Con cuánta anticipación hay que reservar?', 'Mínimo 48 horas. Las fechas de fin de semana y fiestas se ocupan antes.'),
        ('¿En qué zonas trabaja?', 'CABA y Gran Buenos Aires, con traslado incluido. Resto del país con traslado a cotizar.'),
        ('¿Cómo se reserva y se paga?', 'Online en chefprivado.ar, sin crear cuenta. Se confirma con una seña por transferencia y el resto se abona el día del servicio.'),
        ('¿Quién cocina?', 'Daro Castello, chef formado en la Escuela Argentina de Gastronomía (EAG). Cocina él en cada servicio.'),
    ]
    out = cab + '\n## Preguntas frecuentes\n' + ''.join(f'- **{q}** {a}\n' for q, a in faq)
    out += '\n## Notas del blog (técnicas de escuela de cocina, recetas y gestión gastronómica)\n'
    for k, c in CATS.items():
        notas = sorted([a for a in ARTICULOS if a['cat'] == k], key=lambda x: x['fecha'], reverse=True)
        if not notas: continue
        out += f'\n### {c["es"]}\n' + ''.join(f'- [{a["es"]["titulo"]}]({SITE}/blog/{a["slug"]}): {a["es"]["bajada"]}\n' for a in notas)
    open(p, 'w', encoding='utf-8').write(out)

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

def secciones(cuerpo, limpio):
    """Para los reels: cada h2 con una frase corta que lo resume."""
    out = []
    for k, b in enumerate(cuerpo):
        if b[0] != 'h2': continue
        txt = ''
        for nb in cuerpo[k + 1:k + 3]:
            if nb[0] == 'p': txt = limpio(nb[1]); break
            if nb[0] in ('ul', 'ol') and nb[1]: txt = limpio(nb[1][0]); break
            if nb[0] in ('tip', 'dato'): txt = limpio(nb[1]); break
            if nb[0] == 'tabla' and nb[2]: txt = ' · '.join(limpio(c) for c in nb[2][0][:2]); break
        frase = re.split(r'(?<=[.!?])\s+', txt)[0] if txt else ''
        if len(frase) > 170: frase = frase[:167].rsplit(' ', 1)[0] + '…'
        out.append({'h2': limpio(b[1]), 'texto': frase})
    return out

def base_historias():
    """Base de contenido para el generador de historias de Instagram (admin-historias.html)."""
    limpio = lambda t: re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', '', t))).strip()
    notas = []
    for a in sorted(ARTICULOS, key=lambda x: x['fecha'], reverse=True):
        es = a['es']; c = CATS[a['cat']]
        notas.append({
            'slug': a['slug'], 'cat': c['es'], 'icono': c['icono'], 'titulo': es['titulo'], 'bajada': es['bajada'],
            'img': U(a['img'], 1080, 1920), 'img_sq': U(a['img'], 800, 800), 'foto': a['foto'], 'url': f'{SITE}/blog/{a["slug"]}',
            'tips': [limpio(b[1]) for b in es['cuerpo'] if b[0] == 'tip'],
            'datos': [limpio(b[1]) for b in es['cuerpo'] if b[0] == 'dato'],
            'secciones': secciones(es['cuerpo'], limpio),
        })
    p = os.path.join(ROOT, 'data', 'historias-base.json'); os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(json.dumps({'notas': notas}, ensure_ascii=False, indent=1))

# ── Home en inglés (/en): mismo index.html con el texto estático ya traducido (diccionario de js/i18n.js),
#    así lo leen en inglés los buscadores y los asistentes de IA que no ejecutan JavaScript.
#    Lo dinámico (calendario, reserva, precios) lo sigue traduciendo i18n.js con el idioma fijo en inglés.
def _dic_i18n():
    t = open(os.path.join(ROOT, 'js', 'i18n.js'), encoding='utf-8').read()
    i = t.index('var D=') + 6; j = t.index(';\nvar MES', i)
    return json.loads(t[i:j])

def _tr_factory(D):
    MES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
    MON = ['January','February','March','April','May','June','July','August','September','October','November','December']
    RX = [
        (r'^(\d+) personas?$', lambda m: m[1] + (' guest' if m[1] == '1' else ' guests')),
        (r'^(\d+) a (\d+) personas$', lambda m: f'{m[1]} to {m[2]} guests'),
        (r'^(\d+) pasos$', lambda m: m[1] + ' courses'),
        (r'^Menú (\d+) · (\d+) pasos$', lambda m: f'Menu {m[1]} · {m[2]} courses'),
        (r'^desde (\$[\d.,]+)$', lambda m: 'from ' + m[1]),
        (r'^~?(\$[\d.,]+) por persona$', lambda m: '~' + m[1] + ' per person'),
    ]
    def tr(s):
        if s is None: return None
        s = re.sub(r'\s+', ' ', s).strip()
        if not s: return None
        if s in D: return D[s]
        for rx, f in RX:
            m = re.match(rx, s, re.I)
            if m: return f(m)
        p = re.match(r'^([^0-9A-Za-zÁÉÍÓÚáéíóúÑñ¿¡$~+(“"]+)(.+)$', s)
        if p:
            r2 = tr(p[2])
            if r2 is not None: return p[1] + r2
        if ' · ' in s:
            parts = s.split(' · '); out = [tr(x) for x in parts]
            if any(x is not None for x in out): return ' · '.join(o if o is not None else x for o, x in zip(out, parts))
        return None
    return tr

def _traducir_html(src, tr):
    from html.parser import HTMLParser
    import html as H
    lineas = src.split('\n'); base = [0]
    for ln in lineas[:-1]: base.append(base[-1] + len(ln) + 1)
    VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
    RAW = {'script','style','noscript','textarea','title'}
    cambios = []
    class P(HTMLParser):
        def __init__(s_):
            super().__init__(convert_charrefs=True); s_.pila = []
        def off(s_):
            l, c = s_.getpos(); return base[l - 1] + c
        def salta(s_):
            return any(t in RAW or nt for t, nt in s_.pila)
        def handle_starttag(s_, tag, attrs):
            d = dict(attrs); nt = 'data-no-tr' in d
            if not s_.salta() and not nt:
                raw = s_.get_starttag_text(); nuevo = raw
                for a in ('placeholder', 'aria-label', 'title', 'alt', 'data-eyebrow'):
                    v = d.get(a)
                    if v and '${' not in v and "'+" not in v:
                        r = tr(H.unescape(v))
                        if r is not None:
                            nuevo = re.sub(r'(\s' + re.escape(a) + r'=)(["\'])' + re.escape(v) + r'\2', lambda m: m[1] + m[2] + H.escape(r, quote=True) + m[2], nuevo, count=1)
                if nuevo != raw: cambios.append((s_.off(), len(raw), nuevo))
            if tag not in VOID: s_.pila.append((tag, nt))
        def handle_startendtag(s_, tag, attrs):
            s_.handle_starttag(tag, attrs)
            if tag not in VOID and s_.pila and s_.pila[-1][0] == tag: s_.pila.pop()
        def handle_endtag(s_, tag):
            for k in range(len(s_.pila) - 1, -1, -1):
                if s_.pila[k][0] == tag: del s_.pila[k:]; break
        def handle_data(s_, data):
            if s_.salta() or not data.strip(): return
            o = s_.off(); k = src.find('<', o); raw = src[o:(k if k >= 0 else len(src))]
            if '${' in raw or "'+" in raw or H.unescape(raw) != data: return
            r = tr(data)
            if r is None: return
            lead = re.match(r'^\s*', raw)[0]; trail = re.search(r'\s*$', raw)[0]
            cambios.append((o, len(raw), lead + H.escape(r, quote=False) + trail))
    pr = P(); pr.feed(src); pr.close()
    out = src
    for o, n, nuevo in sorted(cambios, key=lambda x: -x[0]):
        out = out[:o] + nuevo + out[o + n:]
    return out, len(cambios)

def home_en():
    p = os.path.join(ROOT, 'index.html'); t = open(p, encoding='utf-8').read()
    # hreflang en la home en español (idempotente)
    ini, fin = '<!--HREFLANG-START-->', '<!--HREFLANG-END-->'
    bloque = ini + alternos('/') + fin
    if ini in t: t = re.sub(re.escape(ini) + '.*?' + re.escape(fin), lambda m: bloque, t, flags=re.S)
    else:
        a = '<link rel="canonical" href="https://www.chefprivado.ar/">'; assert t.count(a) == 1; t = t.replace(a, a + '\n' + bloque)
    open(p, 'w', encoding='utf-8').write(t)
    en, n = _traducir_html(t, _tr_factory(_dic_i18n()))
    TIT = 'Private Chef in Buenos Aires · Celestia | Daro Castello'
    DES = 'Private dining experiences at your home in Buenos Aires. 3- and 7-course tasting menus designed and cooked by chef Daro Castello in CABA and Greater Buenos Aires. Book your date.'
    OGD = 'Fine dining at your home, designed and cooked by private chef Daro Castello. 3- and 7-course menus in Buenos Aires.'
    reps = [
        (r'<html lang="es">', '<html lang="en" class="lang-en" data-lang-fijo="en" data-alt-es="/">'),
        (r'<title>Chef Privado en Buenos Aires · Celestia \| Daro Castello</title>', f'<title>{TIT}</title>'),
        (r'<meta name="description" content="[^"]*">', f'<meta name="description" content="{DES}">'),
        (r'<link rel="canonical" href="https://www.chefprivado.ar/">', '<link rel="canonical" href="https://www.chefprivado.ar/en">'),
        (r'<meta property="og:url" content="https://www.chefprivado.ar/">', '<meta property="og:url" content="https://www.chefprivado.ar/en">'),
        (r'<meta property="og:title" content="[^"]*">', '<meta property="og:title" content="Private Chef in Buenos Aires · Celestia">'),
        (r'<meta property="og:description" content="[^"]*">', f'<meta property="og:description" content="{OGD}">'),
        (r'<meta property="og:locale" content="es_AR">', '<meta property="og:locale" content="en_US">'),
        (r'<meta name="twitter:title" content="[^"]*">', '<meta name="twitter:title" content="Private Chef in Buenos Aires · Celestia">'),
        (r'<meta name="twitter:description" content="[^"]*">', f'<meta name="twitter:description" content="{OGD}">'),
        (r'<meta name="keywords" content="[^"]*">', '<meta name="keywords" content="private chef Buenos Aires, personal chef Buenos Aires, private dinner at home Buenos Aires, tasting menu at home, chef for events Buenos Aires, private chef Argentina">'),
    ]
    for a, b in reps:
        en, k = re.subn(a, lambda m: b, en, count=1); assert k == 1, a
    en = re.sub(r'href="/blog(?=[/"#?])', 'href="/en/blog', en)
    en = en.replace('href="/"', 'href="/en"')
    os.makedirs(os.path.join(ROOT, 'en'), exist_ok=True)
    open(os.path.join(ROOT, 'en', 'index.html'), 'w', encoding='utf-8').write(en)
    return n


if __name__ == '__main__':
    for a in ARTICULOS: articulo(a)
    indice(); franja_landing(); globo_hero(); llms()
    LANG = 'en'
    NAV.update(nav_caps=bi('Blog', 'Blog'), nav_home=bi('Inicio', 'Home'), nav_book=bi('Reservar →', 'Book →'))
    for a in ARTICULOS: articulo(a)
    indice()
    LANG = 'es'
    print('home en inglés:', home_en(), 'textos traducidos')
    sitemap(); base_historias()
    print('ok', len(ARTICULOS), 'cápsulas')
