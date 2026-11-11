# -*- coding: utf-8 -*-
"""Páginas por servicio (SEO + links desde redes): /cena-romantica-en-casa, /menu-degustacion-7-pasos, /chef-semanal, /eventos-corporativos.
Los precios se leen de index.html (TARIFAS y MP_PRECIOS) para que siempre coincidan con la reserva.
Uso: python3 tools/servicios/build.py"""
import os, re, sys, json
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'blog'))
from build import CSS, HEAD, FOOT, bi, ROOT, SITE, escribir

IDX = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
def dic(txt): return {int(k): int(v) for k, v in re.findall(r'(\d+):(\d+)', txt)}
def tarifa(menu):
    b = re.search(r'\n  %d: \{[^}]*?servicio:\s*\{([^}]*)\},\s*ingredientes:\s*\{([^}]*)\}' % menu, IDX)
    return dic(b.group(1)), dic(b.group(2))
VALOR_ASIST = int(re.search(r'const VALOR_ASISTENTE = (\d+)', IDX).group(1))
RECARGO = float(re.search(r'const RECARGO_FINDE = ([\d.]+)', IDX).group(1))
def asist(p): return 2 if p >= 9 else (1 if p >= 3 else 0)
def total(menu, p, finde=False):
    s, i = tarifa(menu); return round(s[p] * (1 + RECARGO if finde else 1)) + i[p] + asist(p) * VALOR_ASIST
mp = re.search(r"const MP_PJ = \{ basico: (\d+), completo: (\d+) \}", IDX)
MP_PJ = {'basico': int(mp.group(1)), 'completo': int(mp.group(2))}
COMPRAS = int(re.search(r'const MP_COMPRAS = (\d+)', IDX).group(1))
MULT = {'1-2': .8, '3-4': 1.0, '5-6': 1.25}
def mpp(pp, j, c='basico'): return round(MP_PJ[c] * int(j) * MULT[pp] / 1000) * 1000
f = lambda n: '$' + f'{n:,}'.replace(',', '.')

EXTRA_CSS = r'''
.sv-hero{position:relative;min-height:520px;display:flex;align-items:flex-end;background:#1a2e42 center/cover no-repeat;color:var(--cr)}
.sv-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(100deg,rgba(13,27,42,.95) 0%,rgba(13,27,42,.75) 45%,rgba(13,27,42,.2) 100%)}
.sv-hero-in{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:0 24px 56px;width:100%}
.sv-hero h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:48px;line-height:1.08;margin:12px 0 14px;max-width:680px}
.sv-hero h1 em{color:var(--gdl)}
.sv-hero p.sv-sub{font-size:17.5px;color:rgba(250,246,239,.82);max-width:600px}
.sv-price{display:inline-flex;align-items:baseline;gap:8px;margin-top:20px;padding:10px 16px;border-radius:14px;background:rgba(13,27,42,.6);border:1px solid rgba(201,168,76,.45)}
.sv-price b{font-family:'DM Serif Display',serif;font-weight:400;font-size:26px;color:var(--gdl)}
.sv-price span{font-size:13px;color:rgba(250,246,239,.7)}
.sv-btns{display:flex;gap:12px;flex-wrap:wrap;margin-top:22px}
.sv-ghost{display:inline-block;border:1px solid rgba(250,246,239,.35);color:var(--cr);text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:500}
.sv-ghost:hover{border-color:var(--gdl);color:var(--gdl)}
.sv-trust{display:flex;gap:18px;flex-wrap:wrap;margin-top:18px;font-size:13px;color:rgba(250,246,239,.7)}
.sv-trust a{color:var(--gdl);text-decoration:none}
.sv-wrap{max-width:1100px;margin:0 auto;padding:56px 24px 10px}
.sv-sec{margin-bottom:54px}
.sv-sec>h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:32px;color:var(--nv);margin:6px 0 10px}
.sv-sec>p.sv-lead{max-width:720px;color:#6B5F4F;margin-bottom:22px}
.sv-inc{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.sv-inc div{background:#fff;border:1px solid var(--crd);border-radius:16px;padding:18px 18px 16px}
.sv-inc i{font-style:normal;font-size:22px}
.sv-inc b{display:block;font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--nv);margin:6px 0 4px}
.sv-inc div>span{font-size:14px;color:#6B5F4F;line-height:1.55;display:block}
.sv-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;counter-reset:s}
.sv-steps div{position:relative;background:var(--nv);color:rgba(250,246,239,.8);border-radius:16px;padding:22px 18px 18px;counter-increment:s;font-size:14px;line-height:1.55}
.sv-steps div::before{content:counter(s);display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,var(--gd),var(--gdl));color:var(--nv);font-weight:700;margin-bottom:10px}
.sv-steps b{display:block;color:var(--cr);font-family:'DM Serif Display',serif;font-weight:400;font-size:18px;margin-bottom:4px}
.sv-tw{overflow-x:auto;border-radius:16px;border:1px solid var(--crd);background:#fff}
.sv-tw table{width:100%;border-collapse:collapse;font-size:14.5px}
.sv-tw th{background:var(--nv);color:var(--gdl);text-align:left;font-weight:500;font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:12px 16px}
.sv-tw td{padding:12px 16px;border-top:1px solid #F0E8D6}
.sv-tw td:first-child{color:var(--nv);font-weight:500}
.sv-note{font-size:13px;color:#8a7a62;margin-top:10px}
.sv-menu{background:#fff;border:1px solid var(--crd);border-radius:18px;padding:24px 26px;max-width:720px}
.sv-menu h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--nv);margin-bottom:12px}
.sv-menu ol{list-style:none;counter-reset:m}
.sv-menu li{counter-increment:m;position:relative;padding:9px 0 9px 36px;border-top:1px dashed var(--crd)}
.sv-menu li:first-child{border-top:0}
.sv-menu li::before{content:counter(m);position:absolute;left:0;top:9px;width:24px;height:24px;border-radius:50%;background:var(--nv);color:var(--gdl);font-size:12px;display:flex;align-items:center;justify-content:center}
.sv-menu small{display:block;margin-top:12px;color:#8a7a62;font-size:13px}
.sv-faq details{background:#fff;border:1px solid var(--crd);border-radius:14px;padding:14px 18px;margin-bottom:10px;max-width:820px}
.sv-faq summary{cursor:pointer;font-weight:600;color:var(--nv);list-style:none}
.sv-faq summary::after{content:'+';float:right;color:var(--gd);font-size:20px;line-height:1}
.sv-faq details[open] summary::after{content:'–'}
.sv-faq p{margin-top:10px;color:#5d5346;font-size:15px}
.sv-more{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.sv-more a{display:block;background:#fff;border:1px solid var(--crd);border-radius:16px;padding:18px;text-decoration:none;transition:transform .2s,box-shadow .2s}
.sv-more a:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(13,27,42,.1)}
.sv-more b{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--nv);display:block}
.sv-more a>span{font-size:13.5px;color:#6B5F4F}
@media(max-width:900px){.sv-inc,.sv-more{grid-template-columns:1fr 1fr}.sv-steps{grid-template-columns:1fr 1fr}}
@media(max-width:640px){.sv-hero{min-height:0;padding-top:110px}.sv-hero::after{background:linear-gradient(to bottom,rgba(13,27,42,.35),rgba(13,27,42,.95) 55%)}.sv-hero h1{font-size:34px}.sv-inc,.sv-more,.sv-steps{grid-template-columns:1fr}.sv-sec>h2{font-size:26px}}
'''
WA = 'https://wa.me/5491160410607?text='
from urllib.parse import quote
GOOGLE = 'https://g.page/r/CWYAy7Wn5FfhEBM'

def tabla_exp(menu):
    filas = ''.join(f'<tr><td>{p} {bi("personas","guests")}</td><td>{f(total(menu,p))}</td><td>{f(total(menu,p,True))}</td></tr>' for p in (2, 4, 6, 8, 10, 12))
    return ('<div class="sv-tw"><table><thead><tr><th>' + bi('Comensales', 'Guests') + '</th><th>' + bi('Lunes a viernes (almuerzo)', 'Mon–Fri (lunch)') +
            '</th><th>' + bi('Vie noche, sáb y dom', 'Fri night, Sat & Sun') + '</th></tr></thead><tbody>' + filas + '</tbody></table></div>')

def tabla_mp():
    filas = ''
    for pp, lab, lab_en in (('1-2', '1 a 2 personas', '1–2 people'), ('3-4', '3 a 4 personas', '3–4 people'), ('5-6', '5 a 6 personas', '5–6 people')):
        filas += f'<tr><td>{bi(lab, lab_en)}</td><td>{f(mpp(pp,"1"))}</td><td>{f(mpp(pp,"2"))}</td></tr>'
    return ('<div class="sv-tw"><table><thead><tr><th>' + bi('Personas', 'People') + '</th><th>' + bi('1 jornada · ~4 días de comida', '1 session · ~4 days of food') + '</th><th>' +
            bi('2 jornadas · toda la semana', '2 sessions · the whole week') + '</th></tr></thead><tbody>' + filas + '</tbody></table></div>')

VCAL_PRECIOS = None
def vcal_precios():
    mult = {2: .8, 3: 1.0, 4: 1.0, 5: 1.25, 6: 1.25, 7: 1.5, 8: 1.5, 9: 1.75, 10: 1.75, 11: 2.0, 12: 2.0}
    return {p: {'j': round(MP_PJ['basico'] * mult[p] / 1000) * 1000, 'n3': [total(1, p), total(1, p, True)], 'n7': [total(2, p), total(2, p, True)]} for p in range(2, 13)}
def VCAL():
    return VCAL_TPL.replace('__PRECIOS__', json.dumps(vcal_precios())).replace('__ANON__', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbHBudXNjcG16cWVhY3NoZnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjQ3OTQsImV4cCI6MjA5MTM0MDc5NH0.BJOz5Gwkeb1NqID_gkGKD5YlymifMtOwaf8iQMaBCx8')
VCAL_TPL = r'''<section class="sv-sec vc" id="calendario"><span class="cp-k">✦ <span class="b-es">Temporada de verano</span><span class="b-en" lang="en">Summer season</span></span>
<h2><span class="b-es">Elegí tus días de vacaciones</span><span class="b-en" lang="en">Pick your holiday dates</span></h2>
<p class="vc-sub"><span class="b-es">Elegí qué buscan y tocá los días: te muestro al instante cuántas jornadas de cocina son y el estimado. Con chef dedicado, cada semana lleva 1 día de descanso: 7 días son 6 jornadas y una quincena, 13.</span><span class="b-en" lang="en">Choose what you need and tap the days: you will instantly see how many cooking sessions it takes and the estimate. With a dedicated chef, each week includes 1 rest day: 7 days are 6 sessions and a fortnight, 13.</span></p>
<div class="vcc" data-no-tr>
 <div class="vcc-top"><div class="vcc-g"><span id="vc-l-mod"></span><div class="vc-ch" data-k="mod"></div></div>
  <div class="vcc-g"><span id="vc-l-pp"></span><div class="vc-ch vc-pp" data-k="pp"></div></div></div>
 <div class="vcc-meses" id="vc-meses"></div>
 <div class="vcc-leg"><span><i class="lg-on"></i><b id="vc-lg1"></b></span><span class="lg-g"><i class="lg-gw"></i><b id="vc-lg4"></b></span><span class="lg-g"><i class="lg-gq"></i><b id="vc-lg5"></b></span><span><i class="lg-oc"></i><b id="vc-lg2"></b></span><span><i class="lg-fs"></i><b id="vc-lg3"></b></span></div>
 <div class="vcc-res" id="vc-res"></div>
 <div class="vcc-ft"><div class="vcc-g"><span id="vc-l-dest"></span><div class="vc-ch" data-k="dest"></div><input id="vc-otro" type="text" hidden></div>
  <button type="button" class="vc-go" id="vc-go"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Z"/></svg><span id="vc-go-t"></span></button></div>
 <p class="vc-n" id="vc-n"></p>
</div></section>
<style>
.vc-sub{color:var(--mut);max-width:680px;margin:-4px 0 18px}
.vcc{background:linear-gradient(160deg,#0f2235,#0D1B2A 60%);color:#FAF6EF;border:1px solid rgba(201,168,76,.45);border-radius:22px;padding:22px;box-shadow:0 24px 50px rgba(13,27,42,.25);font-family:'DM Sans',sans-serif}
.vcc-top{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}@media(max-width:760px){.vcc-top{grid-template-columns:1fr}}
.vcc-g>span{display:block;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:#E8C96B;margin-bottom:7px}
.vc-ch{display:flex;flex-wrap:wrap;gap:6px}
.vc-ch button{border:1px solid rgba(250,246,239,.2);background:rgba(250,246,239,.05);color:#FAF6EF;border-radius:999px;padding:7px 13px;font:500 13px 'DM Sans',sans-serif;cursor:pointer;transition:all .15s}
.vc-ch button:hover{border-color:#E8C96B}
.vc-pp button{min-width:36px;padding:7px 0}
.vc-ch button.on{background:linear-gradient(135deg,#C9A84C,#E8C96B);color:#0D1B2A;border-color:transparent;font-weight:700}
.vcc-meses{display:grid;grid-template-columns:1fr 1fr;gap:22px;padding:16px 0;border-top:1px solid rgba(250,246,239,.12);border-bottom:1px solid rgba(250,246,239,.12)}
@media(max-width:760px){.vcc-meses{grid-template-columns:1fr}}
.vc-mes h3{font:400 22px 'DM Serif Display',serif;margin:0 0 10px;color:#FAF6EF}
.vc-dn,.vc-gr{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.vc-dn span{font-size:10.5px;letter-spacing:.1em;color:rgba(250,246,239,.5);text-align:center;padding-bottom:4px}
.vc-d{position:relative;aspect-ratio:1/.7;border:0;background:rgba(250,246,239,.07);border-radius:11px;font:600 14px 'DM Sans',sans-serif;color:#FAF6EF;cursor:pointer;transition:background .15s,transform .15s;padding:0}
.vc-d:hover{background:rgba(201,168,76,.25)}
.vc-d.fs::after{content:'';position:absolute;left:50%;bottom:5px;width:4px;height:4px;margin-left:-2px;border-radius:50%;background:rgba(232,201,107,.75)}
.vc-d.pa{opacity:.28;cursor:default;background:transparent}
.vc-d.oc{background:transparent;color:rgba(250,246,239,.35);text-decoration:line-through;cursor:not-allowed;outline:1px dashed rgba(250,246,239,.15)}
.vc-d.in{background:rgba(201,168,76,.24);border-radius:6px}
.vc-d.on{background:linear-gradient(135deg,#C9A84C,#E8C96B);color:#0D1B2A;box-shadow:0 0 0 2px rgba(232,201,107,.35)}
.vc-d.on::after{background:#0D1B2A}
.vc-d.in.oc{color:#f3b8a6;outline-color:#f3b8a6}
.vc-e{visibility:hidden}
.vc-d.gw{background:rgba(201,168,76,var(--g));color:#FAF6EF}
.vc-d.gq{background:rgba(110,180,214,var(--g));color:#FAF6EF}
.vc-d.gw.oc,.vc-d.gq.oc{color:rgba(250,246,239,.45)}
.vc-d[data-tag]::before{content:attr(data-tag);position:absolute;top:-7px;right:-4px;font:700 9px/1 'DM Sans',sans-serif;letter-spacing:.04em;padding:3px 5px;border-radius:999px;background:#E8C96B;color:#0D1B2A;white-space:nowrap;z-index:1}
.vc-d.gq[data-tag]::before{background:#8ccbe6}
.vc-d.gw[data-tag]{box-shadow:inset 0 0 0 2px #E8C96B}.vc-d.gq[data-tag]{box-shadow:inset 0 0 0 2px #8ccbe6}
.lg-gw{background:linear-gradient(90deg,rgba(201,168,76,.45),rgba(201,168,76,.15))}.lg-gq{width:18px!important;background:linear-gradient(90deg,rgba(110,180,214,.4),rgba(110,180,214,.1))}.lg-gw{width:18px!important}
.vcc-leg .lg-g{display:none}.vcc-leg.guia .lg-g{display:flex}
.vr-tip{font-size:12.5px;color:rgba(250,246,239,.75);margin-top:6px}.vr-tip b{color:#E8C96B}.vr-tip i{font-style:normal;color:#8ccbe6;font-weight:700}
.vcc-leg{display:flex;flex-wrap:wrap;gap:16px;font-size:12px;color:rgba(250,246,239,.65);margin:12px 0 4px}
.vcc-leg span{display:flex;align-items:center;gap:6px}.vcc-leg i{width:12px;height:12px;border-radius:4px;display:inline-block}
.lg-on{background:linear-gradient(135deg,#C9A84C,#E8C96B)}.lg-oc{outline:1px dashed rgba(250,246,239,.4)}.lg-fs{width:6px!important;height:6px!important;border-radius:50%!important;background:#E8C96B}
.vcc-res{margin:14px 0;padding:16px;border-radius:16px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.3)}
.vr-h{font:400 21px 'DM Serif Display',serif;margin-bottom:2px}.vr-s{font-size:13px;color:#E8C96B}
.vr-rows{margin-top:10px;display:grid;gap:4px;font-size:14px}.vr-rows div{display:flex;justify-content:space-between;gap:12px}
.vr-rows .tt{border-top:1px solid rgba(250,246,239,.18);padding-top:8px;margin-top:4px;font-weight:700;font-size:16px}.vr-rows .tt b{font:400 26px 'DM Serif Display',serif;color:#E8C96B}
.vr-rows .dc{color:#7fd9a3}
.vr-ref{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:12px}@media(max-width:560px){.vr-ref{grid-template-columns:1fr}}
.vr-ref div{background:rgba(250,246,239,.05);border-radius:12px;padding:9px 11px;font-size:12px;color:rgba(250,246,239,.7)}.vr-ref b{display:block;font-size:15px;color:#FAF6EF}
.vr-n{font-size:12px;color:rgba(250,246,239,.6);margin-top:10px;line-height:1.5}
.vr-w{color:#f3b8a6;font-size:12.5px;margin-top:6px}
.vcc-ft{display:grid;grid-template-columns:1fr 280px;gap:16px;align-items:end}@media(max-width:760px){.vcc-ft{grid-template-columns:1fr}}
#vc-otro{width:100%;margin-top:8px;border:1px solid rgba(250,246,239,.25);background:rgba(250,246,239,.06);color:#FAF6EF;border-radius:10px;padding:9px 11px;font:14px 'DM Sans',sans-serif;box-sizing:border-box}
.vc-go{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;padding:14px;border:0;border-radius:999px;background:#25D366;color:#fff;font:700 15px 'DM Sans',sans-serif;cursor:pointer;box-shadow:0 10px 24px rgba(37,211,102,.3)}
.vc-n{font-size:11.5px;color:rgba(250,246,239,.5);margin:12px 0 0;text-align:center}
</style>
<script>(function(){
var SU='https://qolpnuscpmzqeacshfvu.supabase.co',SK='__ANON__',WA='5491160410607',P=__PRECIOS__;
var EN=function(){return document.documentElement.classList.contains('lang-en');};
var $=function(n){return '$'+Math.round(n).toLocaleString('es-AR');};
var T={es:{dest:'Destino',pp:'Personas',mod:'Qué buscan',go:'Consultar por WhatsApp',n:'Reservar no tiene costo. Te confirmo disponibilidad, traslado y alojamiento antes de la seña.',D:['Costa Atlántica','Sierras','Otro destino'],otro:'¿Dónde? (ciudad o barrio)',
  M:['Chef todos los días','Una noche especial','Un encuentro grande'],dn:['L','M','M','J','V','S','D'],lg:['Tu elección','Ocupado','Fin de semana','Una semana','Quincena'],tip:'Tocá el día de salida: hasta el <b>día 7</b> es una semana; hasta el <i>día 15</i>, una quincena.',
  pick1:'Tocá el día de llegada y el de salida',pick2:'Tocá el día de la cena',j:'jornada',js:'jornadas',d:'día',ds:'días',hs:'Chef dedicado: ~6–7 hs de cocina por jornada, con almuerzo y cena del día. 1 día de descanso por semana.',
  pj:'Jornal de chef',sub:'Subtotal',desc:'día de descanso',descs:'días de descanso',tot:'Estimado honorarios',rd:'Por día',rs:'Semana · 7 días (6 jornadas)',rq:'Quincena · 15 días (13 jornadas)',
  extra:'Más viáticos: traslado, alojamiento, compras e ingredientes al costo según el destino. Te paso el total antes de la seña.',n3:'Menú de 3 pasos',n7:'Degustación de 7 pasos',sem:'entre semana',fin:'fin de semana',
  noche:'Mismo valor que en Buenos Aires, todo incluido (servicio, asistentes e ingredientes), más los viáticos según el destino.',enc:'Fiesta, reunión de amigos o de equipo: armo una propuesta a medida según invitados y lugar.',amed:'A medida',warn:'Algunos días ya están tomados: lo vemos juntos.',
  mx:'Más de 12 personas: propuesta a medida.'},
 en:{dest:'Destination',pp:'Guests',mod:'What you need',go:'Ask on WhatsApp',n:'Booking is free. I confirm availability, travel and lodging before the deposit.',D:['Atlantic coast','Hills','Other destination'],otro:'Where? (town or area)',
  M:['Chef every day','One special night','A bigger gathering'],dn:['M','T','W','T','F','S','S'],lg:['Your pick','Taken','Weekend','One week','Fortnight'],tip:'Tap your departure day: up to <b>day 7</b> is one week; up to <i>day 15</i>, a fortnight.',
  pick1:'Tap your arrival and departure days',pick2:'Tap the day of the dinner',j:'session',js:'sessions',d:'day',ds:'days',hs:'Dedicated chef: ~6–7 hours of cooking per session, with lunch and dinner of the day. 1 rest day per week.',
  pj:'Chef day rate',sub:'Subtotal',desc:'rest day',descs:'rest days',tot:'Estimated fee',rd:'Per day',rs:'Week · 7 days (6 sessions)',rq:'Fortnight · 15 days (13 sessions)',
  extra:'Plus travel costs: transport, lodging, shopping and ingredients at cost depending on the destination. You get the total before the deposit.',n3:'3-course menu',n7:'7-course tasting',sem:'weekday',fin:'weekend',
  noche:'Same price as in Buenos Aires, all included (service, assistants and ingredients), plus travel costs depending on the destination.',enc:'A party or a gathering of friends or team: I prepare a tailor-made proposal for your guests and place.',amed:'Tailor-made',warn:'Some days are already taken: we will sort it out together.',
  mx:'More than 12 guests: tailor-made proposal.'}};
var t=function(){return T[EN()?'en':'es'];};
var hoy=new Date();hoy.setHours(12,0,0,0);
var anio=hoy.getMonth()>=2?hoy.getFullYear()+1:hoy.getFullYear();
var MESES=[[anio,0],[anio,1]],OC={},a=null,b=null,sel={mod:0,pp:4,dest:0};
var iso=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
var lab=function(k,o){return new Date(k+'T12:00:00').toLocaleDateString(EN()?'en-US':'es-AR',o||{weekday:'short',day:'numeric',month:'long'});};
var esFin=function(k){var w=new Date(k+'T12:00:00').getDay();return w===5||w===6||w===0;};
function rango(){if(!a)return [];var r=[],d=new Date(a+'T12:00:00'),e=new Date((b||a)+'T12:00:00');while(d<=e){r.push(iso(d));d.setDate(d.getDate()+1);}return r;}
function pintar(){
  var L=t(),h='',min=new Date(hoy);min.setDate(min.getDate()+2);var mk=iso(min);
  MESES.forEach(function(m){var d1=new Date(m[0],m[1],1,12),n=new Date(m[0],m[1]+1,0).getDate(),off=(d1.getDay()+6)%7,mt=d1.toLocaleDateString(EN()?'en-US':'es-AR',{month:'long',year:'numeric'});
    h+='<div class="vc-mes"><h3>'+mt.charAt(0).toUpperCase()+mt.slice(1)+'</h3><div class="vc-dn">'+L.dn.map(function(x){return '<span>'+x+'</span>';}).join('')+'</div><div class="vc-gr">';
    for(var i=0;i<off;i++)h+='<button class="vc-d vc-e" tabindex="-1" aria-hidden="true"></button>';
    for(var d=1;d<=n;d++){var k=iso(new Date(m[0],m[1],d,12)),c='vc-d';
      if(k<mk)c+=' pa';else if(OC[k])c+=' oc';if(esFin(k))c+=' fs';
      if(a&&b&&k>a&&k<b)c+=' in';if(k===a||k===b)c+=' on';
      var st='',tg='';
      if(sel.mod===0&&a&&!b&&k>a){var dd=Math.round((new Date(k+'T12:00:00')-new Date(a+'T12:00:00'))/864e5)+1;
        if(dd<=7){c+=' gw';st=' style="--g:'+(0.52-(dd-2)*0.04).toFixed(3)+'"';if(dd===7)tg=' data-tag="'+(EN()?'1 wk':'1 sem')+'"';}
        else if(dd<=15){c+=' gq';st=' style="--g:'+(0.42-(dd-8)*0.028).toFixed(3)+'"';if(dd===15)tg=' data-tag="'+(EN()?'15 d':'15 d')+'"';}}
      h+='<button type="button" class="'+c+'"'+st+tg+' data-k="'+k+'" aria-label="'+lab(k)+'">'+d+'</button>';}
    h+='</div></div>';});
  document.getElementById('vc-meses').innerHTML=h;form();}
function calc(){var L=t(),r=rango(),n=r.length,pp=sel.pp==='12+'?null:+sel.pp,occ=r.some(function(k){return OC[k];});
  if(sel.mod===0){
    if(!a)return {html:'<div class="vr-h">'+L.pick1+'</div><div class="vr-n">'+L.hs+'</div>'+ref(pp),n:0};
    if(!pp)return {html:'<div class="vr-h">'+n+' '+(n===1?L.d:L.ds)+' · '+n+' '+(n===1?L.j:L.js)+'</div><div class="vr-s">'+L.mx+'</div>',n:n};
    var ds=Math.floor(n/7),jn=n-ds,pj=P[pp].j,tot=pj*jn;
    return {n:jn,tot:tot,html:'<div class="vr-h">'+(b?lab(a,{day:'numeric',month:'long'})+' → '+lab(b,{day:'numeric',month:'long'}):lab(a))+'</div><div class="vr-s">'+n+' '+(n===1?L.d:L.ds)+' = <b>'+jn+' '+(jn===1?L.j:L.js)+'</b>'+(ds?' + '+ds+' '+(ds===1?L.desc:L.descs):'')+' · '+L.hs+'</div>'+
      (!b?'<div class="vr-tip">'+L.tip+'</div>':'')+'<div class="vr-rows"><div><span>'+L.pj+' ('+pp+' '+(EN()?'guests':'personas')+')</span><span>'+$(pj)+'</span></div><div><span>'+jn+' × '+$(pj)+'</span><span>'+$(tot)+'</span></div>'+
      '<div class="tt"><span>'+L.tot+'</span><b>'+$(tot)+'</b></div></div>'+
      (occ?'<div class="vr-w">'+L.warn+'</div>':'')+ref(pp)+'<div class="vr-n">'+L.extra+'</div>'};}
  if(sel.mod===1){
    if(!a)return {html:'<div class="vr-h">'+L.pick2+'</div><div class="vr-n">'+L.noche+'</div>',n:0};
    var fin=esFin(a);
    return {n:1,html:'<div class="vr-h">'+lab(a,{weekday:'long',day:'numeric',month:'long'})+'</div><div class="vr-s">'+(fin?L.fin:L.sem)+'</div>'+
      (pp?'<div class="vr-rows"><div><span>'+L.n3+' · '+pp+'</span><span>'+$(P[pp].n3[fin?1:0])+'</span></div><div><span>'+L.n7+' · '+pp+'</span><span>'+$(P[pp].n7[fin?1:0])+'</span></div></div>':'<div class="vr-s">'+L.mx+'</div>')+
      (occ?'<div class="vr-w">'+L.warn+'</div>':'')+'<div class="vr-n">'+L.noche+'</div>'};}
  return {n:n,html:'<div class="vr-h">'+(a?lab(a,{weekday:'long',day:'numeric',month:'long'}):L.pick2)+'</div><div class="vr-rows"><div class="tt"><span>'+(EN()?'Price':'Precio')+'</span><b>'+L.amed+'</b></div></div><div class="vr-n">'+L.enc+'</div>'};}
function ref(pp){if(!pp)return '';var L=t(),pj=P[pp].j;
  return '<div class="vr-ref"><div>'+L.rd+'<b>'+$(pj)+'</b></div><div>'+L.rs+'<b>'+$(pj*6)+'</b></div><div>'+L.rq+'<b>'+$(pj*13)+'</b></div></div>';}
function form(){var L=t();
  ['mod','pp','dest'].forEach(function(k){document.getElementById('vc-l-'+k).textContent=L[k];});
  var ch=function(k,arr){document.querySelector('.vc-ch[data-k="'+k+'"]').innerHTML=arr.map(function(x,i){var v=k==='pp'?x:i;return '<button type="button" data-v="'+v+'"'+(String(sel[k])===String(v)?' class="on"':'')+'>'+x+'</button>';}).join('');};
  ch('mod',L.M);ch('pp',[2,3,4,5,6,7,8,9,10,11,12,'12+']);ch('dest',L.D);
  var o=document.getElementById('vc-otro');o.placeholder=L.otro;o.hidden=sel.dest!==2;
  L.lg.forEach(function(x,i){document.getElementById('vc-lg'+(i+1)).textContent=x;});
  document.querySelector('.vcc-leg').classList.toggle('guia',sel.mod===0&&!!a&&!b);
  document.getElementById('vc-res').innerHTML=calc().html;document.getElementById('vc-go-t').textContent=L.go;document.getElementById('vc-n').textContent=L.n;}
document.addEventListener('click',function(e){
  if(e.target.closest&&e.target.closest('[data-cel-lang]')){setTimeout(pintar,60);return;}
  var d=e.target.closest&&e.target.closest('.vc-d[data-k]');if(d){if(d.classList.contains('pa'))return;var k=d.getAttribute('data-k');
    if(sel.mod!==0){a=k;b=null;}else if(!a||b||k<a){a=k;b=null;}else if(k===a){b=null;}else{b=k;}pintar();return;}
  var c=e.target.closest&&e.target.closest('.vc-ch button');if(c){var k2=c.parentNode.getAttribute('data-k'),v=c.getAttribute('data-v');sel[k2]=k2==='pp'?(v==='12+'?'12+':+v):+v;if(k2==='mod'&&sel.mod!==0&&b){b=null;}pintar();if(k2==='dest'&&sel.dest===2)document.getElementById('vc-otro').focus();return;}
  if(e.target.closest&&e.target.closest('#vc-go')){var L=T[EN()?'en':'es'],r=rango(),cc=calc(),dest=sel.dest===2?(document.getElementById('vc-otro').value.trim()||L.D[2]):L.D[sel.dest];
    var cuando=a?(b?lab(a,{day:'numeric',month:'long'})+(EN()?' to ':' al ')+lab(b,{day:'numeric',month:'long'})+' ('+r.length+' '+L.ds+')':lab(a,{weekday:'long',day:'numeric',month:'long'})):(EN()?'to be defined':'a definir');
    var est=cc.tot?(EN()?'\n*Estimate:* ':'\n*Estimado:* ')+cc.n+' '+(cc.n===1?L.j:L.js)+(r.length>=7?' + '+Math.floor(r.length/7)+' '+(Math.floor(r.length/7)===1?L.desc:L.descs):'')+' · '+$(cc.tot)+(EN()?' + travel':' + viáticos'):'';
    var m=(EN()?'Hi Daro! I would like a private chef on my holiday.\n*What:* ':'Hola Daro! Quiero un chef privado en mis vacaciones.\n*Qué buscamos:* ')+L.M[sel.mod]+(EN()?'\n*Where:* ':'\n*Destino:* ')+dest+(EN()?'\n*When:* ':'\n*Fechas:* ')+cuando+(EN()?'\n*Guests:* ':'\n*Personas:* ')+sel.pp+est+(EN()?'\nCan you check availability, travel and lodging?':'\n¿Me confirmás disponibilidad, traslado y alojamiento?');
    try{if(window.celTrack)celTrack('wa_click',{servicio:'vacaciones',origen:'calendario_verano'});}catch(x){}
    window.open('https://wa.me/'+WA+'?text='+encodeURIComponent(m),'_blank','noopener');}
});
var hd={apikey:SK,Authorization:'Bearer '+SK};
Promise.all([fetch(SU+'/rest/v1/reservas?select=fecha,estado&estado=in.(reservada,confirmada,ofrecida,aceptada)&fecha=gte.'+anio+'-01-01&fecha=lte.'+anio+'-02-28',{headers:hd}).then(function(r){return r.ok?r.json():[];}),
             fetch(SU+'/rest/v1/bloqueos?select=fecha&fecha=gte.'+anio+'-01-01&fecha=lte.'+anio+'-02-28',{headers:hd}).then(function(r){return r.ok?r.json():[];})])
 .then(function(x){x[0].concat(x[1]).forEach(function(r){var k=(r.fecha||'').slice(0,10);if(k)OC[k]=1;});pintar();}).catch(function(){pintar();});
pintar();
})();</script>
'''

PAGES = [
 dict(slug='cena-romantica-en-casa', img='/img/svc-3pasos.webp', menu=1,
  title='Cena romántica en casa con chef privado en Buenos Aires | Celestia', title_en='Romantic dinner at home with a private chef in Buenos Aires | Celestia',
  desc='Cena romántica en tu casa con chef privado en CABA y GBA: menú de 3 o 7 pasos de Daro Castello, preparado en su cocina y terminado en la tuya. Desde ' + f(total(1,2)) + ' para 2, todo incluido.',
  k=('Cena romántica · CABA y GBA', 'Romantic dinner · Buenos Aires'),
  h1=('Una cena romántica en casa, <em>de restaurante, para los dos.</em>', 'A romantic dinner at home, <em>restaurant-style, for the two of you.</em>'),
  sub=('Aniversarios, propuestas, cumpleaños o simplemente porque sí. Diseño el menú con ustedes, preparo todo en mi cocina y termino cada paso en la suya mientras disfrutan.',
       'Anniversaries, proposals, birthdays or just because. I design the menu with you, prep everything in my kitchen and finish each course in yours while you enjoy.'),
  precio=(f(total(1,2)), 'para 2 personas · todo incluido', 'for 2 · all included'),
  cta=('/?reservar=3', 'Reservar mi cena →', 'Book my dinner →'),
  wa='Hola Daro, quiero organizar una cena romántica en casa.',
  inc=[('🍽️','Menú de 3 o 7 pasos','3 or 7-course menu','Entrada, principal y postre, o una degustación completa de siete momentos.','Starter, main and dessert, or a full seven-moment tasting.'),
       ('🛒','Compras e ingredientes','Shopping and ingredients','Elijo y compro todo; el precio ya incluye los ingredientes.','I choose and buy everything; ingredients are included in the price.'),
       ('🔥','Terminado al momento','Finished on the spot','Llego con la preproducción hecha y termino cada paso en tu cocina; lo que va al momento, como las pastas, se cocina ahí.','I arrive with the prep done and finish each course in your kitchen; what is made à la minute, like fresh pasta, is cooked there.'),
       ('🥂','Maridaje sugerido','Suggested pairing','Las bebidas corren por tu cuenta; te recomiendo vinos según el menú.','Drinks are on you; I recommend wines to match the menu.'),
       ('🎂','Detalles para la ocasión','Details for the occasion','Contame qué celebran y lo integramos al menú.','Tell me what you are celebrating and we weave it into the menu.'),
       ('✨','Ustedes solo disfrutan','You just enjoy','Me ocupo del servicio completo, del primer paso al cierre.','I take care of the full service, from the first course to the end.')],
  pasos=[('Elegís fecha','Pick a date','Menú de 3 o 7 pasos, día y horario.','3 or 7 courses, day and time.'),('Armamos el menú','We design the menu','Por WhatsApp, con sus gustos y restricciones.','On WhatsApp, with your tastes and restrictions.'),
         ('Termino en tu casa','I finish at your home','Llego con todo preparado, regenero, termino y sirvo cada paso.','I arrive with everything prepped, reheat, finish and serve each course.'),('Ustedes disfrutan','You enjoy','Sin compras, sin cocina, sin platos.','No shopping, no cooking, no dishes.')],
  precios_h=('Cuánto cuesta','How much it costs'), tabla=lambda: tabla_exp(1),
  nota=('Menú de 3 pasos, todo incluido (servicio, asistentes e ingredientes). El de 7 pasos arranca en ' + f(total(2,2)) + ' para 2. El importe final se confirma con el menú, antes de la seña.',
        '3-course menu, all included (service, assistants and ingredients). The 7-course starts at ' + f(total(2,2)) + ' for 2. The final amount is confirmed with the menu, before the deposit.'),
  ejemplo=('Ejemplo · Bistró de París', 'Sample · Paris bistro', ['Sopa de cebolla gratinada', 'Bife con salsa de pimienta y papas fritas', 'Crème brûlée']),
  faq=[('¿Puedo elegir el menú?','Can I choose the menu?','Sí. Te paso propuestas según lo que les gusta y lo cerramos juntos por WhatsApp antes de la fecha.','Yes. I send you proposals based on what you like and we finalize it together on WhatsApp before the date.'),
       ('¿Necesito algo especial en mi cocina?','Do I need anything special in my kitchen?','Con una cocina hogareña alcanza: hornallas, horno y algo de mesada. Si falta algún utensilio, lo llevo.','A regular home kitchen is enough: burners, an oven and some counter space. If a tool is missing, I bring it.'),
       ('¿Con cuánta anticipación reservo?','How far ahead should I book?','Con un mínimo de 48 horas. Para fines de semana y fechas especiales conviene reservar antes.','At least 48 hours. For weekends and special dates it is best to book earlier.'),
       ('¿Cómo se paga?','How do I pay?','Una seña por transferencia reserva la fecha y el resto se abona el día del servicio.','A deposit by bank transfer secures the date and the rest is paid on the day.')]),
 dict(slug='menu-degustacion-7-pasos', img='/img/svc-7pasos.webp', menu=2,
  title='Menú degustación de 7 pasos con chef privado | Celestia Buenos Aires', title_en='Private 7-course tasting menu with a chef | Celestia Buenos Aires',
  desc='Menú degustación privado de 7 pasos en tu casa, en CABA y GBA, preparado por Daro Castello y terminado en tu mesa. De 2 a 12 personas, desde ' + f(total(2,2)) + ' todo incluido.',
  k=('Degustación 7 pasos · CABA y GBA', '7-course tasting · Buenos Aires'),
  h1=('Un menú degustación de 7 pasos, <em>en el comedor de tu casa.</em>', 'A 7-course tasting menu, <em>in your own dining room.</em>'),
  sub=('Una experiencia de restaurante de autor para 2 a 12 personas: siete momentos, del bocado de bienvenida al postre, terminados y servidos en tu mesa.',
       'A chef’s-table experience for 2 to 12 guests: seven moments, from the welcome bite to dessert, finished and served at your table.'),
  precio=(f(total(2,2)), 'para 2 personas · todo incluido', 'for 2 · all included'),
  cta=('/?reservar=7', 'Reservar la degustación →', 'Book the tasting →'),
  wa='Hola Daro, quiero consultar por un menú degustación de 7 pasos.',
  inc=[('✨','Siete pasos de autor','Seven signature courses','Bienvenida, entradas, intermedio, principal, pre-postre y postre.','Welcome bite, starters, intermediate, main, pre-dessert and dessert.'),
       ('🛒','Ingredientes incluidos','Ingredients included','Selecciono y compro los productos; el precio es con todo incluido.','I select and buy the produce; the price is all-inclusive.'),
       ('👨‍🍳','Asistentes de servicio','Service assistants','Desde 3 personas sumo un asistente; desde 9, dos.','From 3 guests I add an assistant; from 9, two.'),
       ('🔥','Terminado al momento','Finished on the spot','Preproducido en mi cocina; cada paso se termina y emplata en la tuya, frente a tus invitados.','Prepped in my kitchen; each course is finished and plated in yours, in front of your guests.'),
       ('🍷','Maridaje sugerido','Suggested pairing','Te recomiendo vinos para cada momento del menú.','I recommend wines for each moment of the menu.'),
       ('🥗','Restricciones','Dietary needs','Vegetarianos, celíacos o alergias: adaptamos el menú.','Vegetarian, gluten-free or allergies: we adapt the menu.')],
  pasos=[('Elegís fecha','Pick a date','Comensales, día y horario.','Guests, day and time.'),('Diseñamos el menú','We design the menu','Un estilo de cocina y siete pasos a medida.','A cooking style and seven tailored courses.'),
         ('Termino en tu casa','I finish at your home','Llego con la preproducción hecha y termino cada paso.','I arrive with the prep done and finish each course.'),('La mesa es tuya','The table is yours','Vos e invitados solo disfrutan.','You and your guests just enjoy.')],
  precios_h=('Valores todo incluido','All-inclusive prices'), tabla=lambda: tabla_exp(2),
  nota=('Incluye servicio, asistentes e ingredientes. Fin de semana: +10% sobre el servicio. El importe final se confirma con el menú, antes de la seña. Más de 12 personas: evento a medida.',
        'Includes service, assistants and ingredients. Weekends: +10% on the service. The final amount is confirmed with the menu, before the deposit. More than 12 guests: custom event.'),
  ejemplo=('Ejemplo · Recorrido argentino', 'Sample · Argentine journey', ['Chipá de queso de cabra y miel de caña', 'Vitel toné de autor', 'Empanada salteña cortada a cuchillo', 'Humita en chala gratinada', 'Cordero patagónico al malbec', 'Quesos de campo con dulce de membrillo', 'Volcán de dulce de leche con helado de crema']),
  faq=[('¿Para cuántas personas es?','How many guests?','De 2 a 12 personas con reserva online. Para más, armamos un evento a medida.','From 2 to 12 guests online. For more, we plan a custom event.'),
       ('¿Cuánto dura la experiencia?','How long does it last?','El servicio dura alrededor de 3 horas y media (almuerzo 12:00–15:30, cena 20:00–23:30). Llego antes para el mise en place.','The service lasts about 3.5 hours (lunch 12:00–15:30, dinner 20:00–23:30). I arrive earlier to prep.'),
       ('¿Puedo elegir el estilo de cocina?','Can I choose the cooking style?','Sí: italiana, argentina de autor, francesa, peruana, mediterránea, del mar, vegetariana y más.','Yes: Italian, Argentine, French, Peruvian, Mediterranean, seafood, vegetarian and more.'),
       ('¿Cómo se paga?','How do I pay?','Una seña por transferencia reserva la fecha y el resto se abona el día del servicio.','A deposit by bank transfer secures the date and the rest is paid on the day.')]),
 dict(slug='chef-semanal', img='/img/svc-viandas.webp', menu=None,
  title='Chef semanal a domicilio en Buenos Aires · comidas de la semana | Celestia', title_en='Weekly private chef in Buenos Aires · your week of meals | Celestia',
  desc='Chef semanal a domicilio en CABA y GBA: cocino en tu casa entre 10 y 12 preparaciones por jornada y te dejo comida para unos 4 días, refrigerada y congelada. Desde ' + f(mpp('1-2','1')) + ' por jornada.',
  k=('Chef semanal · CABA y GBA', 'Weekly chef · Buenos Aires'),
  h1=('Tu semana resuelta: <em>comida casera de chef, lista en tu heladera.</em>', 'Your week sorted: <em>chef-made home food, ready in your fridge.</em>'),
  sub=('Cocino en tu casa una o dos veces por semana: en cada jornada preparo entre 10 y 12 platos y te dejo comida para unos 4 días, refrigerada y congelada, con un menú pensado para vos.',
       'I cook at your home once or twice a week: each session I make 10 to 12 dishes and leave food for about 4 days, refrigerated and frozen, with a menu designed for you.'),
  precio=(f(mpp('1-2','1')), 'por jornada · desde', 'per session · from'),
  cta=('/?reservar=semanal', 'Armar mi semana →', 'Plan my week →'),
  wa='Hola Daro, quiero consultar por el servicio de chef semanal.',
  inc=[('📋','Menú a medida','A tailored menu','Gustos, restricciones y cantidad de comensales. Para deportistas, coordinado con su nutricionista (sus honorarios no están incluidos).','Tastes, restrictions and number of people. For athletes, coordinated with their nutritionist (their fees are not included).'),
       ('⏱','Jornadas de 6–7 horas','6–7 hour sessions','En tu cocina, una o dos veces por semana.','In your kitchen, once or twice a week.'),
       ('🍲','10 a 12 preparaciones','10 to 12 dishes','Principales, guarniciones y opciones dulces en cada jornada.','Mains, sides and sweet options every session.'),
       ('❄️','Para unos 4 días','For about 4 days','Parte refrigerado y parte congelado, fraccionado y etiquetado.','Part refrigerated and part frozen, portioned and labeled.'),
       ('🧽','Cocina ordenada','Kitchen left tidy','Organizo y limpio antes de irme.','I tidy up and clean before leaving.'),
       ('🛒','Compras','Shopping','Si las hago yo, + ' + f(COMPRAS) + ' por jornada (mi tiempo). Ingredientes al costo, con ticket: estimado desde ' + f(110000) + ' por jornada.','If I do it, + ' + f(COMPRAS) + ' per session (my time). Ingredients at cost, with receipt: estimated from ' + f(110000) + ' per session.')],
  pasos_h=('Así funciona', 'How it works'),
  pasos=[('Planificación y menú','Planning and menu','Consulto gustos, restricciones y cantidad de comensales. Si trabajo para deportistas, coordino los menús con sus nutricionistas (sus honorarios no están incluidos).','I ask about tastes, restrictions and how many people eat. For athletes, I coordinate the menus with their nutritionists (their fees are not included).'),
         ('Producción en domicilio','Cooking at your home','Trabajo unas 6–7 horas por jornada y elaboro entre 10 y 12 preparaciones: principales, guarniciones y opciones dulces.','I work about 6–7 hours per session and make 10 to 12 dishes: mains, sides and sweet options.'),
         ('Entrega y conservación','Delivery and storage','Dejo comidas para unos cuatro días, algunas refrigeradas y otras congeladas. Organizo la cocina y limpio antes de irme.','I leave food for about four days, some refrigerated and some frozen. I tidy the kitchen and clean up before leaving.')],
  precios_h=('Valores por jornada','Prices per session'), tabla=tabla_mp,
  nota=('Honorario del servicio. Compras: + ' + f(COMPRAS) + ' por jornada si las hago yo. Ingredientes aparte, al costo. Viáticos según la ubicación: se definen después, al confirmar la dirección.',
        'Service fee. Shopping: + ' + f(COMPRAS) + ' per session if I do it. Ingredients at cost. Travel depends on the location and is set afterwards, once the address is confirmed.'),
  ejemplo=None,
  faq=[('¿Para cuántos días me alcanza una jornada?','How many days does one session cover?','Una jornada deja comida para unos 4 días. Con 2 jornadas por semana cubrís la semana completa.','One session leaves food for about 4 days. With 2 sessions a week you cover the whole week.'),
       ('¿Cómo se conserva la comida?','How is the food stored?','Parte va a la heladera y parte al freezer, fraccionado y etiquetado, con indicaciones de cómo regenerar cada plato.','Part goes in the fridge and part in the freezer, portioned and labeled, with reheating instructions for each dish.'),
       ('¿Trabajás con deportistas o dietas especiales?','Do you work with athletes or special diets?','Sí. Puedo coordinar los menús con tu nutricionista y respetar restricciones y alergias. Los honorarios del nutricionista no están incluidos.','Yes. I can coordinate the menus with your nutritionist and respect restrictions and allergies. The nutritionist\'s fees are not included.'),
       ('¿Cuánto cuestan los viáticos?','How much is travel?','Dependen de la ubicación. Los definimos después, cuando confirmamos la dirección.','It depends on the location. We set it afterwards, once the address is confirmed.'),
       ('¿Necesito estar en casa?','Do I need to be home?','No necesariamente: alcanza con coordinar el acceso a la cocina.','Not necessarily: we just need to coordinate access to the kitchen.')]),
 dict(slug='eventos-corporativos', img='/img/svc-corporativos.webp', menu=None,
  title='Chef para eventos corporativos y celebraciones en Buenos Aires | Celestia', title_en='Private chef for corporate events and celebrations in Buenos Aires | Celestia',
  desc='Chef privado para eventos corporativos, cenas con clientes, cierres de año y celebraciones de más de 12 personas en CABA y GBA. Propuesta a medida con reunión previa.',
  k=('Empresas y eventos · CABA y GBA', 'Companies & events · Buenos Aires'),
  h1=('Eventos y cenas corporativas, <em>diseñados a medida.</em>', 'Events and corporate dinners, <em>tailor-made.</em>'),
  sub=('Cenas con clientes, directorios, lanzamientos, cierres de año y celebraciones de más de 12 personas. Nos reunimos, conocemos el espacio y armamos la propuesta.',
       'Client dinners, board meetings, launches, year-end parties and celebrations for more than 12 guests. We meet, see the space and build the proposal.'),
  precio=('A medida', 'según invitados, menú y staff', 'based on guests, menu and staff'),
  cta=('/?consulta=eventos', 'Consultar mi evento →', 'Ask about my event →'),
  wa='Hola Daro, quiero consultar por un evento corporativo / celebración.',
  inc=[('🤝','Reunión previa sin cargo','Free initial meeting','Conocemos la idea, el espacio y los tiempos.','We learn the idea, the space and the timing.'),
       ('🍽️','Menú a medida','Custom menu','Cena de pasos, estaciones o finger food según el formato.','Plated courses, stations or finger food depending on the format.'),
       ('👥','Staff de servicio','Service staff','Asistentes y mozos según la cantidad de invitados.','Assistants and waiters according to the guest count.'),
       ('🏢','En tu oficina o casa','At your office or home','Cocinamos donde sea el evento, en CABA, GBA y el interior.','We cook wherever the event is, in Buenos Aires and beyond.'),
       ('📅','Un solo contacto','One point of contact','Coordinamos todo por WhatsApp, de la propuesta al día del evento.','We coordinate everything on WhatsApp, from proposal to event day.'),
       ('🥗','Restricciones','Dietary needs','Opciones vegetarianas, sin TACC y alergias contempladas.','Vegetarian, gluten-free and allergy options covered.')],
  pasos=[('Nos escribís','You reach out','Fecha, invitados y tipo de evento.','Date, guests and type of event.'),('Reunión previa','Initial meeting','Conocemos el espacio y la idea.','We see the space and the idea.'),
         ('Propuesta','Proposal','Menú, staff, tiempos y presupuesto cerrado.','Menu, staff, timing and a fixed quote.'),('El evento','The event','Cocinamos y servimos; vos atendés a tus invitados.','We cook and serve; you host your guests.')],
  precios_h=None, tabla=None, nota=None, ejemplo=None,
  faq=[('¿Desde cuántas personas?','From how many guests?','Hacemos eventos a medida desde 12 personas. Para grupos más chicos, reservá una experiencia de 3 o 7 pasos.','We do custom events from 12 guests. For smaller groups, book a 3 or 7-course experience.'),
       ('¿Con cuánta anticipación conviene consultar?','How far ahead should we ask?','Idealmente con 2 a 3 semanas, para coordinar la reunión previa y el staff.','Ideally 2 to 3 weeks ahead, to plan the meeting and staff.'),
       ('¿Trabajan fuera de CABA y GBA?','Do you work outside Buenos Aires?','Sí: cotizamos el traslado y lo confirmamos antes de la seña.','Yes: we quote travel and confirm it before the deposit.'),
       ('¿Qué formatos hacen?','What formats do you do?','Cena de pasos servida, estaciones o finger food: lo definimos según el espacio y la cantidad de invitados.','Plated courses, stations or finger food: we decide based on the space and guest count.')]),

 dict(slug='chef-privado-en-vacaciones', img='https://images.unsplash.com/photo-1681657687044-9bde75edb38e?w=1800&h=1000&fit=crop&q=72&auto=format', menu=None, og='cena-romantica', extra=lambda: VCAL(), zona=('Costa, sierras y quintas', 'Coast, hills and country houses'),
  area=['Costa Atlántica', 'Sierras', 'Provincia de Buenos Aires', 'Argentina'],
  title='Chef privado en vacaciones: costa, sierras y casas de veraneo | Celestia', title_en='Private chef on holiday: coast, hills and summer houses | Celestia',
  desc='Chef privado en tus vacaciones: Daro Castello cocina en la casa que alquilaste en la costa, las sierras o una quinta. Una noche especial o varios días de comida resuelta, con producto del lugar. Mismos valores que en Buenos Aires + traslado.',
  k=('Chef privado en vacaciones · costa y sierras', 'Private chef on holiday · coast & hills'),
  h1=('Un chef en tus vacaciones, <em>en la casa que alquilaste.</em>', 'A chef on your holiday, <em>at the house you rented.</em>'),
  sub=('En la costa, en las sierras o en una quinta con amigos: una noche especial que se recuerda o varios días de comida resuelta, para que nadie tenga que pensar en el menú.',
       'At the coast, in the hills or at a country house with friends: one special night to remember or several days of meals sorted, so nobody has to think about the menu.'),
  precio=(f(total(1,2)), 'para 2 · base Buenos Aires + traslado', 'for 2 · Buenos Aires base + travel'),
  cta=('#calendario', 'Ver fechas de verano →', 'See summer dates →'),
  wa='Hola Daro! Quiero un chef privado en mis vacaciones. Lugar: … Fechas: … Somos: …',
  inc=[('🌙','Una noche especial','One special night','Menú de 3 o 7 pasos para un cumpleaños, un aniversario o la última cena del viaje.','A 3 or 7-course menu for a birthday, an anniversary or the last dinner of the trip.'),
       ('🍲','Varios días resueltos','Several days sorted','Jornadas de cocina con las comidas listas para varios días, ideal para familias o grupos.','Cooking sessions with meals ready for several days, ideal for families or groups.'),
       ('🎉','Encuentros grandes','Bigger gatherings','Una fiesta, una reunión de amigos o de equipo, con propuesta a medida.','A party, a gathering of friends or a team get-together, tailor-made.'),
       ('🐟','Producto del lugar','Local produce','Pescados y mariscos en la costa; cordero y cocina de montaña en las sierras.','Fish and seafood at the coast; lamb and mountain cooking in the hills.'),
       ('📸','Cocina revisada antes','Kitchen checked beforehand','Con fotos de hornallas, horno, heladera y vajilla adapto el menú a lo que hay.','With photos of the burners, oven, fridge and tableware I adapt the menu to what there is.'),
       ('🚗','Traslado cotizado','Travel quoted upfront','Se suma según el destino y los días; te paso el total antes de la seña.','Added depending on the destination and days; you get the total before the deposit.')],
  pasos_h=('Cómo se organiza', 'How it works'),
  pasos=[('Me escribís','You message me','Lugar, fechas, cuántos son y qué tienen ganas de comer.','Place, dates, how many you are and what you feel like eating.'),
         ('Fotos de la cocina','Kitchen photos','Hornallas, horno, heladera y vajilla de la casa.','Burners, oven, fridge and tableware of the house.'),
         ('Armamos el menú','We plan the menu','Con producto del lugar y sus gustos y restricciones.','With local produce and your tastes and restrictions.'),
         ('Presupuesto y seña','Quote and deposit','Todo incluido más el traslado; con la seña queda la fecha.','All included plus travel; the deposit secures the date.')],
  precios_h=None, tabla=None, nota=None,
  ejemplo=('Ejemplo · Noche de mar en la costa', 'Sample · Seaside night', ['Langostinos con mayonesa de lima y palta', 'Pesca del día con manteca de limón y papas rotas', 'Pavlova de frutos rojos y crema de mascarpone']),
  faq=[('¿A qué destinos vas?','Where do you travel?','A casas de veraneo en la costa atlántica, las sierras o quintas, y a otros destinos a consultar. Decime el lugar y te confirmo.','To summer houses at the Atlantic coast, in the hills or country houses, and other places on request. Tell me where and I will confirm.'),
       ('¿Cuánto cuesta?','How much is it?','Se toma el mismo valor que en Buenos Aires (una experiencia de 3 pasos arranca en ' + f(total(1,2)) + ' para dos, el chef semanal en ' + f(mpp('1-2','1')) + ' por jornada) y se suma el traslado según el destino y los días.','The same price as in Buenos Aires (a 3-course experience starts at ' + f(total(1,2)) + ' for two, the weekly chef at ' + f(mpp('1-2','1')) + ' per session) plus travel depending on the destination and days.'),
       ('¿Con cuánta anticipación reservo?','How far ahead should I book?','En temporada alta (diciembre, enero y fines de semana largos) las fechas se ocupan rápido: reservá apenas sepas dónde y cuándo vas a estar.','In high season (December, January and long weekends) dates fill up fast: book as soon as you know where and when.'),
       ('¿Qué tiene que tener la casa?','What does the house need?','Un horno que funcione bien, espacio en la heladera, vajilla para todos y una mesa (con plan B si llueve). Si falta algo, lo resolvemos antes.','A working oven, fridge space, tableware for everyone and a table (with a plan B if it rains). If something is missing, we sort it out beforehand.'),
       ('¿Pueden mandarme una caja a la costa?','Can you send me a box to the coast?','No: las cajas se entregan solo en CABA y GBA, porque no podemos garantizar la cadena de frío en un envío. En vacaciones, la opción es que cocine yo allá.','No: boxes are delivered only in Buenos Aires city and suburbs, since we cannot guarantee the cold chain in a shipment. On holiday, the option is for me to cook there.')]),
]

def pagina(P):
    url = f'{SITE}/{P["slug"]}'
    ld = [{"@context": "https://schema.org", "@type": "Service", "name": re.sub('<[^>]+>', '', P['h1'][0]), "serviceType": P['k'][0].split(' · ')[0],
           "description": P['desc'], "url": url, "areaServed": P.get("area", ["Ciudad Autónoma de Buenos Aires", "Gran Buenos Aires"]),
           "provider": {"@type": "LocalBusiness", "name": "Celestia · Chef Privado", "url": SITE + "/", "telephone": "+5491160410607",
                        "founder": {"@type": "Person", "name": "Daro Castello"}}},
          {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, _, a, _ in P['faq']]},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Celestia", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": P['k'][0].split(' · ')[0], "item": url}]}]
    if P['menu']:
        ld[0]["offers"] = {"@type": "Offer", "priceCurrency": "ARS", "price": str(total(P['menu'], 2)), "description": "Desde, para 2 personas, todo incluido"}
    head = HEAD.format(alt='', title=P['title'], title_en=P['title_en'], desc=P['desc'], url=url, ogtype='website', ogimg=SITE + '/img/og/' + P.get('og') + '.jpg' if P.get('og') else SITE + '/img/og/' + {'cena-romantica-en-casa':'cena-romantica','menu-degustacion-7-pasos':'degustacion','chef-semanal':'chef-semanal','eventos-corporativos':'eventos'}[P['slug']] + '.jpg',
                       css=CSS + EXTRA_CSS, ld=''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld),
                       nav_caps=bi('Blog', 'Blog'), nav_home=bi('Inicio', 'Home'), nav_book=bi('Reservar →', 'Book →'))
    wa = WA + quote(P['wa'])
    h = head
    h += (f'<section class="sv-hero" style="background-image:url(\'{P["img"]}\')"><div class="sv-hero-in"><span class="cp-k">✦ {bi(*P["k"])}</span>'
          f'<h1>{bi(*P["h1"])}</h1><p class="sv-sub">{bi(*P["sub"])}</p>'
          f'<div class="sv-price"><b>{P["precio"][0]}</b><span>{bi(P["precio"][1], P["precio"][2])}</span></div>'
          f'<div class="sv-btns"><a class="cp-btn" href="{P["cta"][0]}" data-ev="cta_servicio">{bi(P["cta"][1], P["cta"][2])}</a><a class="sv-ghost" href="{wa}" target="_blank" rel="noopener">{bi("Consultar por WhatsApp", "Ask on WhatsApp")}</a></div>'
          f'<div class="sv-trust"><span>★★★★★ <a href="{GOOGLE}" target="_blank" rel="noopener">5.0 · {bi("reseñas en Google", "Google reviews")}</a></span><span>✓ {bi("Cocina Daro Castello", "Cooked by Daro Castello")}</span><span>✓ {bi(*P.get("zona", ("CABA y GBA", "Buenos Aires area")))}</span></div></div></section>')
    h += '<main class="sv-wrap">'
    h += ('<section class="sv-sec"><span class="cp-k">✦ ' + bi('Qué incluye', "What's included") + '</span><h2>' + bi('Todo resuelto, de principio a fin', 'Everything handled, start to finish') + '</h2><div class="sv-inc">' +
          ''.join(f'<div><i>{ic}</i><b>{bi(t, te)}</b><span>{bi(d, de)}</span></div>' for ic, t, te, d, de in P['inc']) + '</div></section>')
    if P.get('extra'): h += P['extra']()
    h += ('<section class="sv-sec"><span class="cp-k">✦ ' + bi('Cómo funciona', 'How it works') + '</span><h2>' + bi(*P.get('pasos_h', ('Cuatro pasos y listo', 'Four steps and done'))) + '</h2><div class="sv-steps">' +
          ''.join(f'<div><b>{bi(t, te)}</b>{bi(d, de)}</div>' for t, te, d, de in P['pasos']) + '</div></section>')
    if P['tabla']:
        h += f'<section class="sv-sec"><span class="cp-k">✦ {bi("Valores", "Pricing")}</span><h2>{bi(*P["precios_h"])}</h2>' + P['tabla']() + f'<p class="sv-note">{bi(*P["nota"])}</p></section>'
    if P['ejemplo']:
        t, te, platos = P['ejemplo']
        h += (f'<section class="sv-sec"><span class="cp-k">✦ {bi("Un menú de ejemplo", "A sample menu")}</span><h2>{bi("Así puede ser tu mesa", "This is what your table could look like")}</h2>'
              f'<div class="sv-menu"><h3>{bi(t, te)}</h3><ol>' + ''.join(f'<li>{p}</li>' for p in platos) +
              f'</ol><small>{bi("Es solo una idea: cada menú se arma a medida.", "Just an idea: every menu is tailor-made.")} <a href="/?menus=1">{bi("Ver 100 menús de ejemplo →", "See 100 sample menus →")}</a></small></div></section>')
    h += ('<section class="sv-sec sv-faq"><span class="cp-k">✦ ' + bi('Preguntas frecuentes', 'FAQ') + '</span><h2>' + bi('Lo que suelen preguntarme', 'What people usually ask') + '</h2>' +
          ''.join(f'<details><summary>{bi(q, qe)}</summary><p>{bi(a, ae)}</p></details>' for q, qe, a, ae in P['faq']) + '</section>')
    otros = [x for x in PAGES if x['slug'] != P['slug']]
    h += ('<section class="sv-sec"><span class="cp-k">✦ ' + bi('Otras experiencias', 'Other experiences') + '</span><h2>' + bi('También te puede interesar', 'You may also like') + '</h2><div class="sv-more">' +
          ''.join(f'<a href="/{o["slug"]}"><b>{bi(o["k"][0].split(" · ")[0], o["k"][1].split(" · ")[0])}</b><span>{bi(re.sub("<[^>]+>","",o["h1"][0]), re.sub("<[^>]+>","",o["h1"][1]))}</span></a>' for o in otros) + '</div></section>')
    h += '</main>'
    h += (f'<section class="cp-ctab" style="margin-bottom:60px"><div><h3>{bi("¿Lo hacemos en tu casa?", "Shall we do it at your place?")}</h3><p>{bi("Elegí la fecha y reservá en minutos, sin crear cuenta.", "Pick the date and book in minutes, no account needed.")}</p>'
          f'<a class="cp-btn" href="{P["cta"][0]}">{bi(P["cta"][1], P["cta"][2])}</a></div></section>')
    h += FOOT.format(caps=bi('Blog', 'Blog'))
    escribir(f'{P["slug"]}/index.html', h)

if __name__ == '__main__':
    for P in PAGES: pagina(P)
    sys.path.insert(0, os.path.join(ROOT, 'tools')); import sitemap; sitemap.generar()
    print('ok', len(PAGES), 'páginas de servicio')
