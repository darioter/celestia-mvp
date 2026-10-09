# -*- coding: utf-8 -*-
"""Genera /aprende/index.html (curso "Te enseño cocina nivel chef") y la franja de la landing.
Uso: python3 tools/aprende/build.py  (desde la raíz del repo)"""
import os, re, sys, json, html
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'blog'))
from build import CSS, HEAD, bi, ROOT, SITE, escribir
import re

WA = 'https://wa.me/5491160410607?text='
def wa(msg): return WA + __import__('urllib.parse').parse.quote(msg)

# ── Contenido ────────────────────────────────────────────────────────────────
ETAPAS = [
  ("👨‍🍳", "Yo cocino, vos observás", "I cook, you observe", "Clases 1 y 2", "Classes 1 & 2",
   "Cocino frente a vos y te explico el porqué de cada gesto: cómo se agarra el cuchillo, cuándo está caliente la sartén, cómo se ve un punto justo.",
   "I cook in front of you and explain the why of every move: how to hold the knife, when the pan is hot enough, what the right doneness looks like."),
  ("🤝", "Cocinamos juntos", "We cook together", "Clases 3 y 4", "Classes 3 & 4",
   "Codo a codo en tu cocina. Vos tomás el cuchillo y la sartén; yo te acompaño, te corrijo y te paso los trucos en el momento.",
   "Side by side in your kitchen. You take the knife and the pan; I guide you, correct you and share the tricks in the moment."),
  ("🔪", "Vos cocinás, yo observo", "You cook, I observe", "Clases 5 y 6", "Classes 5 & 6",
   "Llevás el plato de principio a fin. Yo observo, intervengo solo si hace falta y te doy la devolución final.",
   "You take the dish from start to finish. I observe, step in only if needed and give you the final feedback."),
  ("🏠", "Vos cocinás", "You cook", "Después de la clase 6", "After class 6",
   "Ya cocinás solo, con criterio propio. Me seguís teniendo por WhatsApp y, cuando quieras ir por más, están las clases Pro.",
   "You now cook on your own, with your own judgment. You still have me on WhatsApp and, whenever you want more, there are Pro classes."),
]

CLASES = [
  ("1", "🧭", "Primeros pasos seguros", "Safe first steps",
   "La cocina como taller: organización, higiene y seguridad. El cuchillo, la tabla y el mise en place, la base de todo.",
   "The kitchen as a workshop: organization, hygiene and safety. The knife, the board and mise en place, the foundation of everything.",
   ["Mise en place y orden de trabajo", "Agarre del cuchillo y la “garra”", "Higiene y temperaturas seguras", "Vinagretas y emulsiones simples"],
   ["Mise en place and workflow", "Knife grip and the “claw”", "Hygiene and safe temperatures", "Vinaigrettes and simple emulsions"]),
  ("2", "🔪", "Cortes y vegetales", "Knife cuts and vegetables",
   "Los cortes clásicos y cómo cada uno cambia la cocción. Blanquear, saltear, asar y glasear vegetales.",
   "The classic cuts and how each one changes the cooking. Blanching, sautéing, roasting and glazing vegetables.",
   ["Brunoise, juliana, paysanne y mirepoix", "Cocción pareja: el tamaño manda", "Blanquear y cortar la cocción", "Vegetales glaseados"],
   ["Brunoise, julienne, paysanne and mirepoix", "Even cooking: size rules", "Blanching and shocking", "Glazed vegetables"]),
  ("3", "🔥", "Fuego y proteínas", "Heat and proteins",
   "Sellar, dar el punto y dejar reposar. Carne, pollo y pescado, con termómetro y sin miedo.",
   "Searing, cooking to doneness and resting. Beef, chicken and fish, with a thermometer and without fear.",
   ["Sartén caliente y reacción de Maillard", "Puntos de cocción y reposo", "Arroser con manteca y hierbas", "Desglasar y armar una salsa rápida"],
   ["Hot pan and the Maillard reaction", "Doneness and resting", "Butter basting with herbs", "Deglazing into a quick sauce"]),
  ("4", "🥄", "Fondos y salsas", "Stocks and sauces",
   "Del fondo a la salsa: roux, salsas madre, emulsiones calientes y reducciones con brillo de restaurante.",
   "From stock to sauce: roux, mother sauces, warm emulsions and reductions with restaurant shine.",
   ["Un fondo casero", "Roux y bechamel sin grumos", "Holandesa y cómo salvarla", "Reducir y montar con manteca"],
   ["A homemade stock", "Lump-free roux and béchamel", "Hollandaise and how to rescue it", "Reducing and mounting with butter"]),
  ("5", "🍝", "Guarniciones y masas", "Sides and doughs",
   "Las guarniciones que levantan cualquier plato y una masa base para animarte a la pasta fresca.",
   "The sides that lift any plate and a basic dough to get you making fresh pasta.",
   ["Puré de restaurante", "Risotto: tiempos y mantecado", "Pasta fresca al huevo", "Cómo coordinar los tiempos de un plato"],
   ["Restaurant-style mash", "Risotto: timing and mantecatura", "Fresh egg pasta", "Coordinating the timing of a dish"]),
  ("6", "🍽️", "Tu primer menú de 3 pasos", "Your first 3-course menu",
   "La clase final: planificás y cocinás un menú completo (entrada, principal y postre) y lo emplatás como en Celestia.",
   "The final class: you plan and cook a full menu (starter, main and dessert) and plate it the Celestia way.",
   ["Planificar compras y tiempos", "Cocinar los tres pasos en orden", "Emplatado y terminación", "Devolución final y próximos pasos"],
   ["Planning shopping and timing", "Cooking the three courses in order", "Plating and finishing", "Final feedback and next steps"]),
]

INCLUYE = [
  ("🏠", "En tu cocina", "In your kitchen", "Aprendés con tus utensilios y tu horno: lo que practicás, lo repetís igual al día siguiente.", "You learn with your own tools and oven: what you practice, you can repeat the next day."),
  ("📋", "Fichas de cada clase", "Notes for every class", "Te quedan las recetas y los trucos de cada encuentro para repasar.", "You keep the recipes and tricks from every session to review."),
  ("💬", "Acompañamiento", "Ongoing support", "Entre clase y clase me escribís por WhatsApp: dudas, fotos de lo que cocinaste, ajustes.", "Between classes you can message me on WhatsApp: questions, photos of what you cooked, tweaks."),
  ("🎯", "A tu ritmo", "At your pace", "Coordinamos días y horarios. Ideal para hacer solo, en pareja o con alguien de la familia.", "We schedule days and times together. Great on your own, as a couple or with family."),
]

# ── Valores (propuesta, ARS) ─────────────────────────────────────────────────
PRECIOS = {
  'horas': 3,
  'honorario': {1: 120000, 2: 150000, 3: 180000, 4: 210000},   # por clase de 3 hs, según alumnos
  'pack_desc': 0.10,                                             # 10% off pagando el pack de 6 clases
  'viaticos': {'caba': 15000, 'gba': 25000},                     # por clase
  'ing_pp': [15000, 18000, 35000, 25000, 20000, 40000],          # ingredientes estimados por alumno, clase 1..6
  'ing_min_porciones': 2,                                        # siempre se cocina al menos para 2
  'pro': {'honorario': 180000, 'nota_ing': 'ingredientes según el plato'},
}


SUPA = {}
_idx = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
SUPA['url'] = re.search(r"const SUPA_URL = '([^']+)'", _idx).group(1)
SUPA['key'] = re.search(r"const SUPA_KEY = '([^']+)'", _idx).group(1)

BOOK_HTML = ('<div class="ap-book" id="ap-book" hidden><div class="ap-book-hd"><span class="cp-k">✦ ' + bi('Reserva', 'Booking') + '</span>'
  '<h3>' + bi('Elegí tus fechas', 'Pick your dates') + '</h3><p>' + bi('La agenda es la misma de las experiencias y del chef semanal: solo ves los días libres. Cada clase ocupa el día completo.',
  'The calendar is shared with the dining experiences and the weekly chef: you only see free days. Each class takes the whole day.') + '</p></div>'
  '<div class="ap-book-g"><div class="ap-left"><div class="ap-plan" id="ap-plan">'
  '<div class="ap-bk-q">' + bi('¿Qué día de la semana te queda cómodo?', 'Which weekday suits you?') + '</div>'
  '<p class="ap-mini" style="margin-top:-2px">' + bi('Las 6 clases van ese mismo día, una por semana. Nosotros armamos el calendario.', 'All 6 classes go on that weekday, once a week. We build the calendar for you.') + '</p>'
  '<div class="ap-wd" id="ap-wd"></div>'
  '<div class="ap-bk-q">' + bi('¿Cuándo arrancás?', 'When do you start?') + '</div><div class="ap-st" id="ap-st"></div>'
  '<button type="button" class="ap-manual" id="ap-manual">' + bi('Prefiero elegir las fechas a mano', "I'd rather pick dates myself") + '</button></div>'
  '<div class="ap-cal" id="ap-calw"><div class="ap-cal-hd"><button type="button" id="ap-prev" aria-label="Mes anterior">‹</button><b id="ap-mes"></b><button type="button" id="ap-next" aria-label="Mes siguiente">›</button></div>'
  '<div class="ap-cal-dn" id="ap-dn"></div><div class="ap-cal-g" id="ap-cal"></div>'
  '<div class="ap-cal-leg"><span><i class="l-ok"></i>' + bi('Disponible', 'Available') + '</span><span><i class="l-sel"></i>' + bi('Elegido', 'Selected') + '</span><span><i class="l-off"></i>' + bi('Ocupado', 'Booked') + '</span></div>'
  '<button type="button" class="ap-manual" id="ap-back">' + bi('← Volver a la elección automática', '← Back to automatic dates') + '</button></div></div>'
  '<div class="ap-bk-r"><div class="ap-bk-q">' + bi('Horario', 'Time') + '</div><div class="ap-opts ap-o2">'
  '<button type="button" class="ap-o ap-tu on" data-tu="almuerzo"><b>☀️ ' + bi('Mañana', 'Morning') + '</b><small>10:00 – 13:00</small></button>'
  '<button type="button" class="ap-o ap-tu" data-tu="cena"><b>🌙 ' + bi('Tarde', 'Afternoon') + '</b><small>15:00 – 18:00</small></button></div>'
  '<div class="ap-bk-q" id="ap-cual-q">' + bi('¿Qué clase?', 'Which class?') + '</div><select id="ap-cual" class="ap-in"></select>'
  '<div class="ap-bk-q">' + bi('Tus fechas', 'Your dates') + ' <small id="ap-cnt"></small></div><ol class="ap-sel" id="ap-sel"></ol>'
  '<div class="ap-bk-q">' + bi('Tus datos', 'Your details') + '</div><div class="ap-me" id="ap-me" hidden></div>'
  '<a class="ap-login" id="ap-login" href="/clientes?volver=%2Faprende%23reservar">' + bi('¿Ya tenés cuenta? <b>Ingresá</b> y tus datos se completan solos', 'Have an account? <b>Log in</b> and your details fill in automatically') + '</a>'
  '<input class="ap-in" id="ap-nom" autocomplete="name"><input class="ap-in" id="ap-tel" type="tel" autocomplete="tel"><input class="ap-in" id="ap-mail" type="email" autocomplete="email">'
  '<input class="ap-in" id="ap-dir" autocomplete="street-address"><textarea class="ap-in" id="ap-not" rows="2"></textarea>'
  '<p class="ap-err" id="ap-err" hidden></p>'
  '<button type="button" class="cp-btn ap-btn-full" id="ap-conf" disabled>' + bi('Confirmar reserva →', 'Confirm booking →') + '</button>'
  '<p class="ap-mini">' + bi('Te confirmamos por WhatsApp y te pasamos los datos para la seña (50% del honorario). La fecha queda reservada al acreditarse.',
                             'We confirm on WhatsApp and send you the deposit details (50% of the fee). Dates are secured once it is received.') + '</p></div></div></div>'
  '<div class="ap-ok" id="ap-ok" hidden></div>')

def build():
    url = f'{SITE}/aprende'
    css_extra = r'''
.ap-hero{position:relative;min-height:520px;display:flex;align-items:center;background:#0D1B2A url('/img/hero-desktop-poster.webp') 70% center/cover no-repeat;color:var(--cr)}
.ap-hero::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,rgba(13,27,42,.97) 0%,rgba(13,27,42,.85) 45%,rgba(13,27,42,.25) 100%)}
.ap-hero-in{position:relative;z-index:1;max-width:1140px;margin:0 auto;padding:60px 24px;width:100%}
.ap-hero h1{font-family:'DM Serif Display',serif;font-weight:400;font-size:50px;line-height:1.08;margin:12px 0 16px;max-width:620px}
.ap-hero h1 em{color:var(--gdl)}
.ap-hero p{max-width:520px;color:rgba(250,246,239,.78);font-size:17px}
.ap-hero .cp-btn{margin-top:26px}
.ap-pills{display:flex;flex-wrap:wrap;gap:8px;margin-top:22px}
.ap-pills>span{border:1px solid rgba(201,168,76,.4);color:var(--gdl);border-radius:999px;padding:6px 13px;font-size:12px;background:rgba(13,27,42,.4)}
.ap-sec{max-width:1140px;margin:0 auto;padding:56px 22px 0}
.ap-sec>.cp-k{display:block;text-align:center}
.ap-h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:36px;line-height:1.15;color:var(--nv);text-align:center;margin:8px 0 10px}
.ap-sub{text-align:center;max-width:620px;margin:0 auto 28px;color:#6B5F4F}
.ap-et{display:grid;grid-template-columns:repeat(4,1fr);gap:0;position:relative}
.ap-et::before{content:'';position:absolute;left:12.5%;right:12.5%;top:40px;height:2px;background:linear-gradient(90deg,var(--gd),var(--gdl))}
.ap-e{text-align:center;padding:0 14px;position:relative}.ap-e:last-child .ap-e-ic{background:linear-gradient(135deg,var(--gd),var(--gdl))}
.ap-e-ic{width:80px;height:80px;border-radius:50%;margin:0 auto 16px;background:var(--nv);border:2px solid var(--gd);display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 0 0 8px var(--cr),0 12px 28px rgba(13,27,42,.18);position:relative}
.ap-e small{display:block;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--gd);margin-bottom:6px}
.ap-e h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:21px;color:var(--nv);margin-bottom:8px}
.ap-e p{font-size:14.5px;color:#6B5F4F}
.ap-cls{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.ap-c{background:#fff;border:1px solid var(--crd);border-radius:18px;padding:24px 22px 20px;box-shadow:0 4px 18px rgba(13,27,42,.05);position:relative;overflow:hidden}
.ap-c::before{content:attr(data-n);position:absolute;right:14px;top:-6px;font-family:'DM Serif Display',serif;font-size:96px;line-height:1;color:rgba(201,168,76,.12)}
.ap-c-tag{display:inline-block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;border-radius:999px;padding:4px 10px;margin-bottom:12px}
.ap-c-tag.e1{background:#F5EDD4;color:#8a6d1f}.ap-c-tag.e2{background:#0D1B2A;color:#E8C96B}.ap-c-tag.e3{background:linear-gradient(135deg,#C9A84C,#E8C96B);color:#0D1B2A}
.ap-c h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--nv);margin-bottom:8px;position:relative}
.ap-c h3 i{font-style:normal;margin-right:6px}
.ap-c p{font-size:14px;color:#6B5F4F;margin-bottom:12px;position:relative}
.ap-c ul{list-style:none;padding:0;margin:0;border-top:1px dashed var(--crd);padding-top:10px}
.ap-c li{font-size:13px;padding:4px 0 4px 18px;position:relative;color:#4f463b}
.ap-c li::before{content:'✦';position:absolute;left:0;color:var(--gd);font-size:10px;top:6px}
.ap-inc{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.ap-i{background:#fff;border:1px solid var(--crd);border-radius:16px;padding:22px 18px;text-align:center}
.ap-i i{font-style:normal;font-size:28px;display:block;margin-bottom:8px}
.ap-i h4{font-family:'DM Serif Display',serif;font-weight:400;font-size:19px;color:var(--nv);margin-bottom:6px}
.ap-i p{font-size:13.5px;color:#6B5F4F}
.ap-pro{max-width:1140px;margin:60px auto 0;padding:0 22px}
.ap-pro-in{background:linear-gradient(135deg,#0D1B2A 0%,#13263a 60%,#1d3348 100%);border-radius:24px;color:var(--cr);padding:46px 44px;display:grid;grid-template-columns:1.2fr 1fr;gap:40px;align-items:center;border:1px solid rgba(201,168,76,.35);position:relative;overflow:hidden}
.ap-pro-in::before{content:'PRO';position:absolute;right:-10px;bottom:-40px;font-family:'DM Serif Display',serif;font-size:200px;color:rgba(201,168,76,.07);line-height:1}
.ap-pro h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:34px;line-height:1.15;margin:8px 0 12px}
.ap-pro h2 em{color:var(--gdl)}
.ap-pro p{color:rgba(250,246,239,.75)}
.ap-pro ul{list-style:none;padding:0;margin:0;position:relative}
.ap-pro li{padding:12px 0 12px 36px;border-bottom:1px solid rgba(250,246,239,.1);position:relative;font-size:14.5px;color:rgba(250,246,239,.85)}
.ap-pro li b{color:#fff;font-weight:500}
.ap-pro li::before{content:'✓';position:absolute;left:0;top:12px;width:24px;height:24px;border-radius:50%;background:rgba(201,168,76,.18);color:var(--gdl);display:flex;align-items:center;justify-content:center;font-size:12px}
.ap-fin{max-width:760px;margin:60px auto 0;padding:0 22px 70px;text-align:center}
.ap-fin h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:34px;color:var(--nv);margin-bottom:10px}
.ap-fin p{color:#6B5F4F;margin-bottom:22px}
.ap-wa{display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#fff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:999px;box-shadow:0 8px 22px rgba(37,211,102,.3)}
.ap-calc{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:32px;align-items:start}
.ap-q{font-family:'DM Serif Display',serif;font-size:21px;color:var(--nv);margin:22px 0 12px}.ap-q:first-child{margin-top:0}
.ap-opts{display:grid;gap:12px}.ap-o4{grid-template-columns:repeat(4,1fr)}.ap-o2{grid-template-columns:1fr 1fr}
.ap-o{position:relative;background:#fff;border:1.5px solid var(--crd);border-radius:16px;padding:16px 10px;cursor:pointer;font-family:inherit;display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--nv);transition:all .2s}
.ap-o:hover{border-color:#E2C97E;transform:translateY(-2px)}
.ap-o.on{border-color:var(--gd);background:#FFFBF0;box-shadow:0 0 0 4px rgba(201,168,76,.15)}
.ap-o b{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px}.ap-o small{font-size:12px;color:#8a7a62}
.ap-badge{position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--nv);color:var(--gdl);font-size:10px;letter-spacing:.1em;text-transform:uppercase;padding:3px 10px;border-radius:999px;white-space:nowrap}
.ap-mini{font-size:12.5px;color:#8a7a62;margin-top:10px}
.ap-sum{position:sticky;top:84px;background:var(--nv);color:var(--cr);border-radius:20px;padding:24px;border:1px solid rgba(201,168,76,.3);box-shadow:0 18px 40px rgba(13,27,42,.18)}
.ap-rows{margin:12px 0}.ap-rows div{display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid rgba(250,246,239,.08);font-size:13.5px}
.ap-rows div span:first-child{color:rgba(250,246,239,.6)}.ap-rows div span:last-child{text-align:right}
.ap-rows small{display:block;font-size:11px;color:rgba(250,246,239,.45)}
.ap-rows .ap-desc span:last-child{color:#7fd1a3}
.ap-tot{display:flex;justify-content:space-between;align-items:baseline;border-top:1px solid rgba(201,168,76,.35);padding-top:14px}
.ap-tot span{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(250,246,239,.6)}.ap-tot b{font-family:'DM Serif Display',serif;font-weight:400;font-size:32px;color:var(--gdl)}
.ap-pp{font-size:12.5px;color:rgba(250,246,239,.6);text-align:right;margin-top:2px}
.ap-note{font-size:11.5px;color:rgba(250,246,239,.5);line-height:1.6;margin:14px 0 16px}
.ap-tbl{margin-top:26px;overflow-x:auto}.ap-tbl table{width:100%;border-collapse:collapse;background:#fff;border:1px solid var(--crd);border-radius:14px;overflow:hidden;font-size:13.5px}
.ap-tbl th{background:var(--nv);color:var(--gdl);text-align:left;font-weight:500;font-size:11px;letter-spacing:.1em;text-transform:uppercase;padding:11px 14px}
.ap-tbl td{padding:10px 14px;border-top:1px solid #F0E8D6}.ap-tbl td:first-child{color:var(--nv)}
.ap-pro-price{border-bottom:0!important;color:var(--gdl)!important}
.ap-hero-btns{display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin-top:26px}.ap-hero-btns .cp-btn{margin-top:0}
.ap-ghost{color:var(--cr);text-decoration:none;border:1px solid rgba(250,246,239,.35);border-radius:999px;padding:12px 22px;font-size:14px}.ap-ghost:hover{border-color:var(--gdl);color:var(--gdl)}
.ap-btn-full{width:100%;text-align:center;border:0;cursor:pointer;font-family:inherit;font-size:15px}
.ap-wa-link{display:block;text-align:center;margin-top:10px;font-size:12.5px;color:rgba(250,246,239,.6)}
.ap-det{margin-top:22px}.ap-det summary{cursor:pointer;color:var(--nv);font-weight:500;font-size:14px;list-style:none;text-align:center;padding:10px;border:1px dashed var(--crd);border-radius:12px}
.ap-det summary::-webkit-details-marker{display:none}.ap-det[open] summary{margin-bottom:14px}
.ap-book{margin-top:28px;background:#fff;border:1px solid var(--crd);border-radius:22px;padding:28px;box-shadow:0 14px 36px rgba(13,27,42,.08);animation:apIn .5s ease}
.ap-book-hd{text-align:center;margin-bottom:22px}.ap-book-hd h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:28px;color:var(--nv);margin:6px 0}.ap-book-hd p{font-size:14px;color:#6B5F4F;max-width:560px;margin:0 auto}
.ap-book-g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:30px;align-items:start}.ap-book-g>*,.ap-left,.ap-plan,.ap-st,.ap-sc{min-width:0}
.ap-cal-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}.ap-cal-hd b{font-family:'DM Serif Display',serif;font-weight:400;font-size:22px;color:var(--nv)}
.ap-cal-hd button{width:38px;height:38px;border-radius:50%;border:1px solid var(--crd);background:#fff;cursor:pointer;font-size:18px;color:var(--nv)}.ap-cal-hd button:disabled{opacity:.3;cursor:default}
.ap-cal-dn,.ap-cal-g{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;text-align:center}.ap-cal-dn span{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;color:#a08a5c;padding:4px 0}
.ap-d{position:relative;aspect-ratio:1/1;border-radius:50%;border:1px solid transparent;background:#FAF6EF;color:var(--nv);font:500 14px 'DM Sans',sans-serif;cursor:pointer;transition:all .15s}
.ap-d:hover:not([disabled]){border-color:var(--gd);transform:scale(1.06)}.ap-d.sel{background:var(--nv);color:var(--gdl);box-shadow:0 0 0 3px rgba(201,168,76,.45)}
.ap-d i{position:absolute;top:-4px;right:-4px;width:17px;height:17px;border-radius:50%;background:var(--gd);color:var(--nv);font-size:10px;font-style:normal;display:flex;align-items:center;justify-content:center}
.ap-d.off{background:none;color:#cfc6b8;cursor:default}.ap-d.busy{background:repeating-linear-gradient(45deg,#f3eee6,#f3eee6 4px,#ebe4d8 4px,#ebe4d8 8px);color:#b6ab99;cursor:not-allowed;text-decoration:line-through}
.ap-cal-leg{display:flex;gap:14px;justify-content:center;margin-top:12px;font-size:11.5px;color:#8a7a62}.ap-cal-leg i{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:5px;vertical-align:-1px}
.l-ok{background:#FAF6EF;border:1px solid var(--crd)}.l-sel{background:var(--nv)}.l-off{background:#e3dbcc}
#ap-book [hidden]{display:none!important}
.ap-me{display:flex;gap:12px;align-items:center;border:1px solid rgba(201,168,76,.45);background:#FFFBF0;border-radius:14px;padding:12px 14px;margin-bottom:10px}
.ap-me .av{flex:none;width:40px;height:40px;border-radius:50%;background:var(--nv);color:var(--gdl);display:flex;align-items:center;justify-content:center;font:400 18px 'DM Serif Display',serif}
.ap-me .tx{flex:1;min-width:0;font-size:13px;color:#8a7a62;line-height:1.45}.ap-me .tx b{display:block;color:var(--nv);font-size:15px;font-weight:600}
.ap-me .tx span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ap-me button{flex:none;background:none;border:none;color:#8a7a62;text-decoration:underline;text-underline-offset:3px;font:500 12.5px 'DM Sans',sans-serif;cursor:pointer}
.ap-login{display:block;font-size:13px;color:#8a7a62;text-decoration:none;margin:-2px 0 10px}.ap-login b{color:var(--nv);text-decoration:underline;text-underline-offset:3px}
.ap-me-hint{font-size:12.5px;color:#a08a5c;margin:-2px 0 8px}
.ap-wd{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:8px}.ap-wd button small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.ap-wd button{border:1px solid #E3D9C8;background:#FCFAF6;border-radius:14px;padding:12px 4px 10px;cursor:pointer;font:600 14px 'DM Sans',sans-serif;color:var(--nv);transition:all .15s;display:flex;flex-direction:column;align-items:center;gap:3px}
.ap-wd button small{font:400 10.5px 'DM Sans',sans-serif;color:#a08a5c}.ap-wd button:hover:not([disabled]){border-color:var(--gd);transform:translateY(-2px)}
.ap-wd button.on{background:var(--nv);color:var(--gdl);border-color:var(--nv);box-shadow:0 8px 20px rgba(13,27,42,.18)}.ap-wd button.on small{color:rgba(232,201,122,.8)}
.ap-wd button[disabled]{opacity:.4;cursor:not-allowed}
.ap-st{display:grid;gap:10px}
.ap-sc{position:relative;text-align:left;border:1px solid #E3D9C8;background:#fff;border-radius:16px;padding:14px 16px;cursor:pointer;font:14px 'DM Sans',sans-serif;color:var(--nv);transition:all .18s;display:grid;grid-template-columns:auto 1fr;gap:4px 14px;align-items:center}
.ap-sc:hover{border-color:var(--gd);transform:translateY(-2px);box-shadow:0 10px 24px rgba(13,27,42,.08)}
.ap-sc.on{border-color:var(--gd);background:#FFFBF0;box-shadow:0 0 0 3px rgba(201,168,76,.3)}
.ap-sc .d{grid-row:span 2;width:54px;height:58px;border-radius:12px;background:var(--nv);color:var(--gdl);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1}
.ap-sc .d b{font:400 24px 'DM Serif Display',serif}.ap-sc .d small{font-size:10px;text-transform:uppercase;letter-spacing:.08em;margin-top:3px}
.ap-sc strong{font-weight:600;font-size:15px}.ap-sc span{font-size:12.5px;color:#8a7a62}
.ap-sc em{position:absolute;top:-9px;right:14px;background:var(--gd);color:var(--nv);font:600 10px 'DM Sans',sans-serif;font-style:normal;padding:3px 9px;border-radius:999px;letter-spacing:.04em;text-transform:uppercase}
.ap-sc .dots{grid-column:2;display:flex;gap:4px;margin-top:4px}.ap-sc .dots i{width:8px;height:8px;border-radius:50%;background:var(--gd)}.ap-sc .dots i.sk{background:none;border:1px dashed #c9b88f}
.ap-manual{display:block;margin:14px auto 0;background:none;border:none;color:#8a7a62;font:500 12.5px 'DM Sans',sans-serif;text-decoration:underline;text-underline-offset:3px;cursor:pointer}.ap-manual:hover{color:var(--nv)}
.ap-none{padding:14px;border-radius:12px;background:#FAF6EF;color:#8a7a62;font-size:13px}
@media(max-width:560px){.ap-wd{grid-template-columns:repeat(3,minmax(0,1fr))}.ap-sc{padding:14px 12px;gap:4px 12px}.ap-sc strong{font-size:14px}}
.ap-bk-q{font-family:'DM Serif Display',serif;font-size:18px;color:var(--nv);margin:16px 0 8px}.ap-bk-q:first-child{margin-top:0}.ap-bk-q small{font-family:'DM Sans',sans-serif;font-size:12px;color:#a08a5c}
.ap-in{display:block;width:100%;border:1px solid #E3D9C8;background:#FCFAF6;border-radius:12px;padding:12px 14px;font:15px 'DM Sans',sans-serif;color:var(--nv);margin-bottom:8px;outline:none}.ap-in:focus{border-color:var(--gd);background:#fff;box-shadow:0 0 0 4px rgba(201,168,76,.15)}
.ap-sel{list-style:none;padding:0;margin:0 0 6px}.ap-sel li{display:flex;justify-content:space-between;gap:10px;padding:8px 12px;border-radius:10px;font-size:13px;margin-bottom:5px;background:#FAF6EF;color:#8a7a62}
.ap-sel li.ok{background:#FFFBF0;color:var(--nv);border:1px solid rgba(201,168,76,.35)}.ap-sel li b{font-weight:500;text-align:right}
.ap-err{color:#b23b3b;font-size:13px;margin:4px 0 8px}
.ap-ok{margin-top:28px}.ap-ok-in{background:var(--nv);color:var(--cr);border-radius:22px;padding:34px 30px;text-align:center;border:1px solid rgba(201,168,76,.4);animation:apIn .5s ease}
.ap-ok-ic{width:64px;height:64px;border-radius:50%;margin:0 auto 12px;background:linear-gradient(135deg,var(--gd),var(--gdl));color:var(--nv);font-size:30px;display:flex;align-items:center;justify-content:center}
.ap-ok-in h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:30px;margin:8px 0 16px}.ap-ok-in .ap-sel{max-width:520px;margin:0 auto 16px;text-align:left}.ap-ok-in p{color:rgba(250,246,239,.78);max-width:560px;margin:0 auto 18px}.ap-ok-in p b{color:var(--gdl)}.ap-ok-in .ap-sel li b{color:var(--nv);font-weight:600}
@keyframes apIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.rv{opacity:0;transform:translateY(26px);transition:opacity .7s ease,transform .7s cubic-bezier(.16,.84,.44,1)}.rv.in{opacity:1;transform:none}
.ap-et::before{transform:scaleX(0);transform-origin:left;transition:transform 1.4s cubic-bezier(.65,0,.35,1) .3s}.ap-et.draw::before{transform:scaleX(1)}
.ap-hero-in>*{animation:apIn .8s ease both}.ap-hero-in>*:nth-child(2){animation-delay:.1s}.ap-hero-in>*:nth-child(3){animation-delay:.2s}.ap-hero-in>*:nth-child(4){animation-delay:.3s}.ap-hero-in>*:nth-child(5){animation-delay:.4s}
.ap-c,.ap-i{transition:opacity .7s ease,transform .7s cubic-bezier(.16,.84,.44,1),box-shadow .25s}.ap-c:hover,.ap-i:hover{box-shadow:0 18px 36px rgba(13,27,42,.12)}
@media(prefers-reduced-motion:reduce){.rv{opacity:1;transform:none;transition:none}.ap-et::before{transform:none}.ap-hero-in>*{animation:none}}
@media(max-width:900px){.ap-book-g{grid-template-columns:minmax(0,1fr)}.ap-book{padding:20px 16px}}
@media(max-width:900px){.ap-calc{grid-template-columns:1fr}.ap-sum{position:relative;top:0}.ap-o4{grid-template-columns:repeat(4,1fr)}}
@media(max-width:900px){.ap-et,.ap-cls{grid-template-columns:1fr}.ap-et::before{display:none}.ap-e{margin-bottom:28px}.ap-inc{grid-template-columns:1fr 1fr}.ap-pro-in{grid-template-columns:1fr;padding:34px 24px}.ap-hero h1{font-size:36px}.ap-hero{min-height:560px;background-position:70% center}.ap-hero::after{background:linear-gradient(180deg,rgba(13,27,42,.55) 0%,rgba(13,27,42,.95) 55%)}.ap-hero-in{align-self:flex-end}.ap-h2{font-size:28px}}
@media(max-width:520px){.ap-inc{grid-template-columns:1fr}}
'''
    msg_es = 'Hola Daro, quiero sumarme al curso "Te enseño cocina nivel chef" (6 clases). ¿Cómo seguimos?'
    msg_pro = 'Hola Daro, terminé el curso y quiero una clase Pro de un plato técnico. ¿Coordinamos?'
    ld = '<script type="application/ld+json">' + json.dumps({
        "@context": "https://schema.org", "@type": "Course", "name": "Te enseño cocina nivel chef · curso con Daro Castello",
        "description": "Curso práctico de 6 clases en tu casa: yo cocino y vos observás, cocinamos juntos, vos cocinás y yo observo; después, cocinás vos.",
        "provider": {"@type": "Organization", "name": "Celestia Chef Privado", "sameAs": SITE},
        "inLanguage": "es-AR", "hasCourseInstance": {"@type": "CourseInstance", "courseMode": "onsite", "location": "Buenos Aires"}}, ensure_ascii=False) + '</script>'
    nav = dict(nav_caps=bi('Blog', 'Blog'), nav_home=bi('Inicio', 'Home'), nav_book=bi('Quiero aprender →', 'I want to learn →'))
    h = HEAD.format(title='Te enseño cocina nivel chef · 6 clases prácticas con Daro Castello | Celestia', title_en='I teach you chef-level cooking · 6 hands-on classes with Daro Castello | Celestia',
                    desc='Curso práctico de 6 clases en tu casa: yo cocino y vos observás, cocinamos juntos, vos cocinás y yo observo; después, cocinás vos. Cortes, fuego, salsas y tu primer menú de 3 pasos.',
                    url=url, ogtype='website', ogimg=SITE + '/img/hero-desktop-poster.webp', css=CSS + css_extra, ld=ld, **nav)
    h = h.replace('<a href="/" class="cp-cta">', f'<a href="{wa(msg_es)}" target="_blank" rel="noopener" class="cp-cta">')
    # Hero
    h += ('<section class="ap-hero"><div class="ap-hero-in"><span class="cp-k">✦ ' + bi('Te enseño cocina nivel chef', 'I teach you chef-level cooking') + '</span>'
          '<h1>' + bi('Aprendé a cocinar <em>como chef</em>, en tu propia cocina.', 'Learn to cook <em>like a chef</em>, in your own kitchen.') + '</h1>'
          '<p>' + bi('Un curso práctico de 6 clases conmigo: yo cocino y vos observás, cocinamos juntos, vos cocinás y yo observo. Y después de la clase 6, cocinás vos.',
                      'A hands-on 6-class course with me: I cook and you observe, we cook together, you cook and I observe. And after class 6, you cook.') + '</p>'
          '<div class="ap-pills"><span>' + bi('6 clases prácticas', '6 hands-on classes') + '</span><span>' + bi('En tu casa', 'At your home') + '</span><span>' +
          bi('Acompañamiento por WhatsApp', 'WhatsApp support') + '</span><span>' + bi('Clases Pro después', 'Pro classes afterwards') + '</span></div>'
          '<div class="ap-hero-btns"><a class="cp-btn" href="#valores">' + bi('Ver valores y fechas ↓', 'See prices and dates ↓') + '</a>'
          f'<a class="ap-ghost" href="{wa(msg_es)}" target="_blank" rel="noopener">' + bi('Consultar por WhatsApp', 'Ask on WhatsApp') + '</a></div></div></section>')
    # Método
    h += ('<section class="ap-sec"><span class="cp-k">✦ ' + bi('El método', 'The method') + '</span><h2 class="ap-h2">' + bi('De observar a cocinar solo, en cuatro etapas', 'From observing to cooking on your own, in four stages') +
          '</h2><p class="ap-sub">' + bi('Así se aprende en una cocina profesional: observando, haciendo con alguien al lado, haciendo mientras te observan y, por último, haciendo solo.',
                                       'This is how people learn in a professional kitchen: observing, doing with someone beside you, doing while someone observes and, finally, doing it alone.') + '</p><div class="ap-et">')
    for ic, tes, ten, ces, cen, des, den in ETAPAS:
        h += f'<div class="ap-e"><div class="ap-e-ic">{ic}</div><small>{bi(ces, cen)}</small><h3>{bi(tes, ten)}</h3><p>{bi(des, den)}</p></div>'
    h += '</div></section>'
    # Valores
    P = PRECIOS
    h += ('<section class="ap-sec" id="valores"><span class="cp-k">✦ ' + bi('Valores', 'Pricing') + '</span><h2 class="ap-h2">' + bi('Armá tu curso', 'Build your course') +
          '</h2><p class="ap-sub">' + bi('Cada clase dura como mínimo 3 horas. Al honorario se suman los viáticos y los ingredientes de cada clase, que se estiman según la cantidad de alumnos.',
                                       'Each class lasts at least 3 hours. Travel and the ingredients for each class are added to the fee, estimated by the number of students.') + '</p>'
          '<div class="ap-calc"><div class="ap-cfg">'
          '<div class="ap-q">' + bi('¿Cuántos alumnos?', 'How many students?') + '</div><div class="ap-opts ap-o4">' +
          ''.join(f'<button type="button" class="ap-o{" on" if n==2 else ""}" data-k="al" data-v="{n}"><b>{n}</b><small>{bi("alumno" if n==1 else "alumnos", "student" if n==1 else "students")}</small></button>' for n in (1,2,3,4)) + '</div>'
          '<div class="ap-q">' + bi('¿Cómo lo querés hacer?', 'How do you want to do it?') + '</div><div class="ap-opts ap-o2">'
          '<button type="button" class="ap-o on" data-k="mod" data-v="pack"><span class="ap-badge">' + bi('10% off', '10% off') + '</span><b>' + bi('Curso completo', 'Full course') + '</b><small>' + bi('Las 6 clases', 'All 6 classes') + '</small></button>'
          '<button type="button" class="ap-o" data-k="mod" data-v="suelta"><b>' + bi('Clase suelta', 'Single class') + '</b><small>' + bi('Para probar o repasar', 'To try it or review') + '</small></button></div>'
          '<div class="ap-q">' + bi('¿Dónde es la clase?', 'Where is the class?') + '</div><div class="ap-opts ap-o2">'
          '<button type="button" class="ap-o on" data-k="zona" data-v="caba"><b>CABA</b><small>' + bi('Ciudad de Buenos Aires', 'Buenos Aires City') + '</small></button>'
          '<button type="button" class="ap-o" data-k="zona" data-v="gba"><b>GBA</b><small>' + bi('Gran Buenos Aires', 'Greater Buenos Aires') + '</small></button></div>'
          '<p class="ap-mini">' + bi('Fuera de CABA/GBA, el traslado se cotiza aparte.', 'Outside Buenos Aires City/Greater BA, travel is quoted separately.') + '</p>'
          '</div><aside class="ap-sum"><span class="cp-k">✦ ' + bi('Tu curso', 'Your course') + '</span><div class="ap-rows" id="ap-rows"></div>'
          '<div class="ap-tot"><span>' + bi('Total · todo incluido', 'Total · all included') + '</span><b id="ap-total">—</b></div><p class="ap-pp" id="ap-pp"></p>'
          '<p class="ap-note">' + bi('Incluye clases, traslado e ingredientes. El importe puede variar según los platos y detalles que definamos: lo confirmamos antes de la seña.',
                                     'Includes classes, travel and ingredients. The amount may vary with the dishes and details we agree on: we confirm it before the deposit.') + '</p>'
          '<button type="button" class="cp-btn ap-btn-full" id="ap-elegir">' + bi('Elegir fechas y reservar →', 'Pick dates and book →') + '</button>'
          f'<a class="ap-wa-link" id="ap-cta" href="{wa(msg_es)}" target="_blank" rel="noopener">' + bi('o consultame por WhatsApp', 'or ask me on WhatsApp') + '</a></aside></div>'
          + BOOK_HTML +
          '<div id="ap-tbl" hidden></div></section>')
    h += '<script>window.AP_PRECIOS=' + json.dumps(P) + ';window.AP_CLASES=' + json.dumps([[c[0], c[1], c[2], c[3]] for c in CLASES], ensure_ascii=False) + ';</script>'
    h += r"""<script>(function(){
var P=window.AP_PRECIOS,C=window.AP_CLASES,st={al:2,mod:'pack',zona:'caba'};window.AP_ST=st;window.apCalc=function(){calc();};
window.AP_IDX=1;function apIdxLoad(){var S=window.AP_SUPA;if(!S)return;fetch(S.url+'/rest/v1/canasta_indice?select=indice&order=fecha.desc&limit=1',{headers:{apikey:S.key,Authorization:'Bearer '+S.key}}).then(function(r){return r.ok?r.json():[];}).then(function(j){var x=j&&j[0]&&+j[0].indice;if(x>0.5&&x<3){window.AP_IDX=x;calc();}}).catch(function(){});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apIdxLoad);else setTimeout(apIdxLoad,0);
window.apIng=function(v){return Math.round(v*(window.AP_IDX||1)/1000)*1000;};
function f(n){return '$'+Math.round(n).toLocaleString('es-AR');}
function en(){return document.documentElement.classList.contains('lang-en');}
function L(es,e){return en()?e:es;}
function calc(){
  var hon=P.honorario[st.al],porc=Math.max(st.al,P.ing_min_porciones),via=P.viaticos[st.zona];
  var clases=st.mod==='pack'?C.map(function(c,i){return i;}):[0];
  var honT=hon*clases.length, desc=st.mod==='pack'?Math.round(honT*P.pack_desc/1000)*1000:0;
  var ing=clases.reduce(function(a,i){return a+apIng(P.ing_pp[i]*porc);},0), viaT=via*clases.length;
  var tot=honT-desc+viaT+ing;
  window.AP_RES={hon:hon,honClase:st.mod==='pack'?Math.round(hon*(1-P.pack_desc)):hon,via:via,porc:porc,n:clases.length,honT:honT-desc,viaT:viaT,ing:ing,tot:tot};
  if(window.apBookSync)window.apBookSync();
  var rows='<div><span>✓ '+(clases.length>1?L(clases.length+' clases de '+P.horas+' horas',clases.length+' classes of '+P.horas+' hours'):L('1 clase de '+P.horas+' horas','1 class of '+P.horas+' hours'))+'</span><span></span></div>';
  rows+='<div><span>✓ '+L('Ingredientes de cada clase','Ingredients for every class')+'</span><span></span></div>';
  rows+='<div><span>✓ '+L('Traslado a tu casa','Travel to your home')+' ('+st.zona.toUpperCase()+')</span><span></span></div>';
  if(desc)rows+='<div class="ap-desc"><span>✦ '+L('Curso completo: 10% off ya aplicado','Full course: 10% off already applied')+'</span><span></span></div>';
  document.getElementById('ap-rows').innerHTML=rows;
  document.getElementById('ap-total').textContent=f(tot);
  document.getElementById('ap-pp').textContent=(st.al>1?f(tot/st.al)+' '+L('por alumno','per student')+' · ':'')+(st.mod==='pack'?f(tot/6)+' '+L('por clase','per class'):L('clase de '+P.horas+' horas','class of '+P.horas+' hours'));
  var t='<table><thead><tr><th>'+L('Clase','Class')+'</th><th>'+L('Honorario','Fee')+'</th><th>'+L('Viáticos','Travel')+'</th><th>'+L('Ingredientes','Ingredients')+'</th></tr></thead><tbody>';
  C.forEach(function(c,i){var hc=st.mod==='pack'?hon*(1-P.pack_desc):hon;t+='<tr><td>'+c[1]+' '+L(c[2],c[3])+'</td><td>'+f(hc)+'</td><td>'+f(via)+'</td><td>'+f(P.ing_pp[i]*porc)+'</td></tr>';});
  t+='</tbody></table><p class="ap-mini">'+L('Valores por clase para '+st.al+(st.al>1?' alumnos':' alumno')+'. Los ingredientes se calculan para al menos 2 porciones.','Per-class values for '+st.al+(st.al>1?' students':' student')+'. Ingredients are calculated for at least 2 portions.')+'</p>';
  document.getElementById('ap-tbl').innerHTML=t;
  var msg=L('Hola Daro, quiero reservar el curso "Te enseño cocina nivel chef": ','Hi Daro, I want to book the "I teach you chef-level cooking" course: ')+(st.mod==='pack'?L('curso completo (6 clases)','full course (6 classes)'):L('una clase suelta','a single class'))+', '+st.al+' '+L(st.al>1?'alumnos':'alumno',st.al>1?'students':'student')+', '+st.zona.toUpperCase()+'. '+L('Total (todo incluido)','Total (all included)')+': '+f(tot)+'.';
  document.getElementById('ap-cta').href='https://wa.me/5491160410607?text='+encodeURIComponent(msg);
}
document.querySelectorAll('.ap-o').forEach(function(b){b.addEventListener('click',function(){var k=b.getAttribute('data-k'),v=b.getAttribute('data-v');st[k]=k==='al'?parseInt(v,10):v;document.querySelectorAll('.ap-o[data-k="'+k+'"]').forEach(function(x){x.classList.toggle('on',x===b);});calc();});});
document.querySelectorAll('[data-cel-lang]').forEach(function(b){b.addEventListener('click',function(){setTimeout(calc,30);});});
calc();
})();</script>"""
    # Programa
    etapa = {'1': 'e1', '2': 'e1', '3': 'e2', '4': 'e2', '5': 'e3', '6': 'e3'}
    etq = {'e1': ('Yo cocino, vos observás', 'I cook, you observe'), 'e2': ('Cocinamos juntos', 'We cook together'), 'e3': ('Vos cocinás, yo observo', 'You cook, I observe')}
    h += ('<section class="ap-sec"><span class="cp-k">✦ ' + bi('El programa', 'The program') + '</span><h2 class="ap-h2">' + bi('6 clases, de lo básico a tu primer menú', '6 classes, from the basics to your first menu') +
          '</h2><p class="ap-sub">' + bi('Cada clase suma una técnica y un plato. Al final, cocinás un menú de 3 pasos completo.', 'Each class adds a technique and a dish. By the end, you cook a full 3-course menu.') + '</p><div class="ap-cls">')
    for n, ic, tes, ten, des, den, les, len_ in CLASES:
        e = etapa[n]
        h += (f'<article class="ap-c" data-n="{n}"><span class="ap-c-tag {e}">{bi("Clase "+n, "Class "+n)} · {bi(*etq[e])}</span><h3><i>{ic}</i>{bi(tes, ten)}</h3><p>{bi(des, den)}</p>'
              '<ul>' + ''.join(f'<li>{bi(a, b)}</li>' for a, b in zip(les, len_)) + '</ul></article>')
    h += '</div></section>'
    # Incluye
    h += '<section class="ap-sec"><span class="cp-k">✦ ' + bi('Qué incluye', "What's included") + '</span><h2 class="ap-h2">' + bi('Pensado para que lo sigas haciendo', 'Designed so you keep doing it') + '</h2><p class="ap-sub"></p><div class="ap-inc">'
    for ic, tes, ten, des, den in INCLUYE:
        h += f'<div class="ap-i"><i>{ic}</i><h4>{bi(tes, ten)}</h4><p>{bi(des, den)}</p></div>'
    h += '</div></section>'


    h += '<script>window.AP_SUPA=' + json.dumps(SUPA) + ';</script>'
    h += r"""<script>(function(){
var S=window.AP_SUPA,P=window.AP_PRECIOS,C=window.AP_CLASES;
var book=document.getElementById('ap-book'),okBox=document.getElementById('ap-ok');
var ocupados={},bloq={},sel=[],turno='almuerzo',mes=null;
function en(){return document.documentElement.classList.contains('lang-en');}
function L(a,b){return en()?b:a;}
function f(n){return '$'+Math.round(n).toLocaleString('es-AR');}
function pad(n){return n<10?'0'+n:''+n;}
function iso(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());}
function need(){return (window.AP_ST&&window.AP_ST.mod==='pack')?6:1;}
var MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
var minD=new Date();minD.setHours(0,0,0,0);minD.setDate(minD.getDate()+2);
async function cargar(){
  var h={apikey:S.key,Authorization:'Bearer '+S.key};
  try{
    var r=await Promise.all([fetch(S.url+'/rest/v1/reservas?select=fecha,turno,estado&estado=in.(reservada,confirmada,ofrecida,aceptada)',{headers:h}).then(function(x){return x.json();}),
      fetch(S.url+'/rest/v1/bloqueos?select=fecha',{headers:h}).then(function(x){return x.json();})]);
    ocupados={};bloq={};
    (Array.isArray(r[0])?r[0]:[]).forEach(function(x){if(x.fecha)ocupados[x.fecha.slice(0,10)]=1;});
    (Array.isArray(r[1])?r[1]:[]).forEach(function(x){if(x.fecha)bloq[x.fecha.slice(0,10)]=1;});
  }catch(e){console.warn('agenda',e);}
}
function libre(k,d){return d>=minD&&d.getDay()!==0&&!ocupados[k]&&!bloq[k];}
function render(){
  var y=mes.getFullYear(),m=mes.getMonth();
  document.getElementById('ap-mes').textContent=(en()?MON[m]:MES[m].charAt(0).toUpperCase()+MES[m].slice(1))+' '+y;
  var dn=en()?['Mo','Tu','We','Th','Fr','Sa','Su']:['Lu','Ma','Mi','Ju','Vi','Sá','Do'];
  document.getElementById('ap-dn').innerHTML=dn.map(function(x){return '<span>'+x+'</span>';}).join('');
  var first=new Date(y,m,1),off=(first.getDay()+6)%7,dias=new Date(y,m+1,0).getDate(),hh='';
  for(var i=0;i<off;i++)hh+='<span></span>';
  for(var d=1;d<=dias;d++){var dt=new Date(y,m,d),k=iso(dt),cls='ap-d';
    if(sel.indexOf(k)>=0)cls+=' sel';else if(!libre(k,dt))cls+=(dt>=minD&&(ocupados[k]||bloq[k]))?' busy':' off';
    var n=sel.indexOf(k);hh+='<button type="button" class="'+cls+'" data-k="'+k+'"'+(cls.indexOf('off')>0||cls.indexOf('busy')>0?' disabled':'')+'>'+d+(n>=0&&need()>1?'<i>'+(n+1)+'</i>':'')+'</button>';}
  var g=document.getElementById('ap-cal');g.innerHTML=hh;
  g.querySelectorAll('.ap-d:not([disabled])').forEach(function(b){b.addEventListener('click',function(){toggle(b.getAttribute('data-k'));});});
  var hoy=new Date();document.getElementById('ap-prev').disabled=(y===hoy.getFullYear()&&m<=hoy.getMonth());
  lista();
}
function toggle(k){var i=sel.indexOf(k);if(i>=0)sel.splice(i,1);else{if(sel.length>=need()){if(need()===1)sel=[];else return;}sel.push(k);}sel.sort();render();}
function fecha(k){var d=new Date(k+'T12:00:00');var t=d.toLocaleDateString(en()?'en-US':'es-AR',{weekday:'long',day:'numeric',month:'long'});return t.charAt(0).toUpperCase()+t.slice(1);}
function lista(){
  var n=need(),ol=document.getElementById('ap-sel');document.getElementById('ap-cnt').textContent='('+sel.length+'/'+n+')';
  var html='';for(var i=0;i<n;i++){var c=n===6?C[i]:C[parseInt(document.getElementById('ap-cual').value||'0',10)];
    html+='<li class="'+(sel[i]?'ok':'')+'"><span>'+c[1]+' '+(n===6?L('Clase ','Class ')+(i+1)+' · ':'')+L(c[2],c[3])+'</span><b>'+(sel[i]?fecha(sel[i]):L('elegí un día','pick a day'))+'</b></li>';}
  ol.innerHTML=html;document.getElementById('ap-cual-q').hidden=document.getElementById('ap-cual').hidden=(n===6);
  valida();
}
function valida(){var ok=sel.length===need()&&['ap-nom','ap-tel','ap-mail','ap-dir'].every(function(id){return document.getElementById(id).value.trim().length>2;})&&/@/.test(document.getElementById('ap-mail').value);
  document.getElementById('ap-conf').disabled=!ok;}
var wd=null,stK=null,manual=false;
var WD=[1,2,3,4,5,6],WDN=['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'],WDE=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
var MC=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'],MCE=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function primero(w){var d=new Date(minD);d.setHours(12);while(d.getDay()!==w)d.setDate(d.getDate()+1);return d;}
function plan(start){var out=[],sk=0,d=new Date(start);for(var g=0;g<12&&out.length<6;g++){var k=iso(d);if(libre(k,d))out.push(k);else if(out.length)sk++;d.setDate(d.getDate()+7);}
  return out.length===6?{f:out,sk:sk}:null;}
function opciones(w){var res=[],d=primero(w);for(var g=0;g<10&&res.length<3;g++){var k=iso(d);if(libre(k,d)){var p=plan(d);if(p&&(p.sk===0||res.length<2))res.push(p);}d.setDate(d.getDate()+7);}
  if(!res.length){d=primero(w);for(g=0;g<10&&res.length<3;g++){if(libre(iso(d),d)){p=plan(d);if(p)res.push(p);}d.setDate(d.getDate()+7);}}
  return res;}
function corto(k){var d=new Date(k+'T12:00:00');return d.getDate()+' '+(en()?MCE:MC)[d.getMonth()];}
function planner(){
  var n=need(),pl=document.getElementById('ap-plan'),cw=document.getElementById('ap-calw');
  pl.hidden=(n===1||manual);cw.hidden=!(n===1||manual);document.getElementById('ap-back').hidden=(n===1);
  if(pl.hidden)return;
  var best=null,bestD=null;
  document.getElementById('ap-wd').innerHTML=WD.map(function(w){var o=opciones(w),f0=o.length?o[0].f[0]:null;
    if(f0&&(!bestD||f0<bestD)){bestD=f0;best=w;}
    return '<button type="button" data-w="'+w+'"'+(f0?'':' disabled')+'>'+(en()?WDE:WDN)[w]+'<small>'+(f0?L('desde ','from ')+corto(f0):L('sin lugar','full'))+'</small></button>';}).join('');
  if(wd===null)wd=best;
  document.querySelectorAll('#ap-wd button').forEach(function(b){var w=+b.getAttribute('data-w');b.classList.toggle('on',w===wd);
    b.addEventListener('click',function(){wd=w;stK=null;planner();});});
  var o=wd===null?[]:opciones(wd),st=document.getElementById('ap-st');
  if(!o.length){st.innerHTML='<div class="ap-none">'+L('No hay lugar ese día en las próximas semanas. Probá otro día o escribime por WhatsApp.','No room on that day in the coming weeks. Try another day or message me on WhatsApp.')+'</div>';sel=[];lista();return;}
  if(!stK||!o.some(function(p){return p.f[0]===stK;}))stK=o[0].f[0];
  st.innerHTML=o.map(function(p,i){var d0=new Date(p.f[0]+'T12:00:00');
    var dots='';var a=new Date(p.f[0]+'T12:00:00'),z=p.f[5];while(iso(a)<=z){dots+='<i'+(p.f.indexOf(iso(a))<0?' class="sk"':'')+'></i>';a.setDate(a.getDate()+7);}
    return '<button type="button" class="ap-sc'+(p.f[0]===stK?' on':'')+'" data-k="'+p.f[0]+'">'+(i===0?'<em>'+L('Lo antes posible','Soonest')+'</em>':'')+
      '<div class="d"><b>'+d0.getDate()+'</b><small>'+(en()?MCE:MC)[d0.getMonth()]+'</small></div>'+
      '<strong>'+L('Empezás el ','Start on ')+fecha(p.f[0]).toLowerCase()+'</strong>'+
      '<span>'+L('Terminás el ','Finish on ')+corto(p.f[5])+' · '+(p.sk?L('salta '+p.sk+' semana'+(p.sk>1?'s':'')+' por agenda','skips '+p.sk+' week'+(p.sk>1?'s':'')+' (calendar)'):L('6 semanas seguidas','6 weeks in a row'))+'</span>'+
      '<div class="dots">'+dots+'</div></button>';}).join('');
  st.querySelectorAll('.ap-sc').forEach(function(b){b.addEventListener('click',function(){stK=b.getAttribute('data-k');planner();});});
  var p=o.filter(function(p){return p.f[0]===stK;})[0];sel=p.f.slice();
  mes=new Date(new Date(sel[0]+'T12:00:00').getFullYear(),new Date(sel[0]+'T12:00:00').getMonth(),1);lista();
}
function err(m){var e=document.getElementById('ap-err');e.textContent=m||'';e.hidden=!m;}
var yo=null;
function sesionLocal(){try{var raw=null;for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('sb-')===0&&/-auth-token$/.test(k)){raw=localStorage.getItem(k);break;}}
  if(!raw)return null;var p=JSON.parse(raw);if(p&&p.currentSession)p=p.currentSession;if(!p||!p.access_token||!p.user)return null;if(p.expires_at&&Date.now()/1000>p.expires_at)return null;return p;}catch(e){return null;}}
async function cargarYo(){var s=sesionLocal();if(!s)return;var u=s.user,perf={};
  try{var r=await fetch(S.url+'/rest/v1/clientes?id=eq.'+u.id+'&select=*&limit=1',{headers:{apikey:S.key,Authorization:'Bearer '+s.access_token}});var j=await r.json();if(Array.isArray(j)&&j[0])perf=j[0];}catch(e){}
  yo={nom:perf.nombre||(u.user_metadata&&(u.user_metadata.full_name||u.user_metadata.name))||'',mail:u.email||perf.email||'',tel:perf.telefono||perf.tel||'',dir:perf.direccion||perf.dir||''};
  pintarYo(false);}
function pintarYo(editar){if(!yo)return;var me=document.getElementById('ap-me');
  ['nom','tel','mail','dir'].forEach(function(f){var el=document.getElementById('ap-'+f);if(yo[f]&&!el.value)el.value=yo[f];});
  var falta=['nom','tel','dir'].filter(function(f){return document.getElementById('ap-'+f).value.trim().length<3;});
  document.getElementById('ap-mail').hidden=!editar;
  ['nom','tel','dir'].forEach(function(f){document.getElementById('ap-'+f).hidden=!editar&&falta.indexOf(f)<0;});
  var v=function(f){return document.getElementById('ap-'+f).value.trim();};
  me.innerHTML='<div class="av">'+((v('nom')||v('mail')||'?').charAt(0).toUpperCase())+'</div><div class="tx"><b>'+(v('nom')?L('Reservás como ','Booking as ')+v('nom').split(' ')[0]:L('Tu cuenta','Your account'))+'</b>'+
    '<span>'+v('mail')+(v('tel')?' · '+v('tel'):'')+'</span>'+(v('dir')?'<span>📍 '+v('dir')+'</span>':'')+'</div>'+
    (editar?'':'<button type="button" id="ap-me-ed">'+L('Editar','Edit')+'</button>')+
    (falta.length&&!editar?'':'');
  me.hidden=false;document.getElementById('ap-login').hidden=true;
  var h=document.getElementById('ap-me-hint');if(!h){h=document.createElement('p');h.id='ap-me-hint';h.className='ap-me-hint';me.after(h);}
  h.textContent=falta.length&&!editar?L('Completá solo lo que falta:','Just fill in what is missing:'):'';h.hidden=!h.textContent;
  var b=document.getElementById('ap-me-ed');if(b)b.addEventListener('click',function(){pintarYo(true);});
  valida();}
function placeholders(){var ph={'ap-nom':L('Nombre y apellido *','Full name *'),'ap-tel':L('Teléfono / WhatsApp *','Phone / WhatsApp *'),'ap-mail':L('Email *','Email *'),'ap-dir':L('Dirección de la clase (calle, número, barrio) *','Class address (street, number, area) *'),'ap-not':L('Restricciones, nivel, algo que quieras contarme...','Restrictions, level, anything you want to tell me...')};
  Object.keys(ph).forEach(function(id){document.getElementById(id).placeholder=ph[id];});
  var cu=document.getElementById('ap-cual'),v=cu.value;cu.innerHTML=C.map(function(c,i){return '<option value="'+i+'">'+c[1]+' '+L('Clase ','Class ')+(i+1)+' · '+L(c[2],c[3])+'</option>';}).join('');cu.value=v||'0';}
async function confirmar(){
  err('');var btn=document.getElementById('ap-conf');btn.disabled=true;var txt=btn.innerHTML;btn.textContent=L('Reservando...','Booking...');
  await cargar();
  var choque=sel.filter(function(k){return ocupados[k]||bloq[k];});
  if(choque.length){sel=sel.filter(function(k){return choque.indexOf(k)<0;});render();if(!manual&&need()===6){stK=null;planner();}err(L('Alguien acaba de reservar '+choque.map(fecha).join(', ')+'. Elegí otro día.','Someone just booked '+choque.map(fecha).join(', ')+'. Please pick another day.'));btn.innerHTML=txt;return;}
  var st=window.AP_ST,R=window.AP_RES,grp='AC-'+Date.now().toString(36).toUpperCase(),n=need();
  var nom=document.getElementById('ap-nom').value.trim(),tel=document.getElementById('ap-tel').value.trim(),mail=document.getElementById('ap-mail').value.trim(),dir=document.getElementById('ap-dir').value.trim(),nota=document.getElementById('ap-not').value.trim();
  var cual=parseInt(document.getElementById('ap-cual').value||'0',10);
  var rows=sel.map(function(k,i){var ci=n===6?i:cual,c=C[ci],ing=apIng(P.ing_pp[ci]*R.porc);
    return {ref:grp+'-'+(i+1),tipo:'clase',fecha:k,turno:turno,estado:'reservada',
      menu:'Te enseño cocina nivel chef · '+(n===6?'Clase '+(i+1)+'/6':'Clase suelta')+' · '+c[2],personas:st.al,nombre:nom,tel:tel,email:mail,dir:dir,
      ocasion:'Curso Te enseño cocina nivel chef · '+(n===6?'curso completo':'clase suelta')+' · '+st.zona.toUpperCase(),
      notas:'['+grp+'] '+(turno==='almuerzo'?'Mañana 10-13':'Tarde 15-18')+(nota?' · '+nota:''),
      honorario:R.honClase,ingredientes:ing,total:R.honClase+R.via+ing,senia_monto:Math.round(R.honClase*0.5)};});
  try{
    var res=await fetch(S.url+'/rest/v1/reservas',{method:'POST',headers:{apikey:S.key,Authorization:'Bearer '+S.key,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify(rows)});
    if(!res.ok)throw new Error('HTTP '+res.status);
  }catch(e){btn.innerHTML=txt;btn.disabled=false;err(L('No pudimos guardar la reserva. Probá de nuevo o escribime por WhatsApp.','We could not save the booking. Try again or message me on WhatsApp.'));return;}
  var senia=Math.round(R.honT*0.5);
  try{fetch('/api/notify',{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({ref:grp,tipo:'clase',menu:'Te enseño cocina nivel chef · '+(n===6?'curso completo (6 clases)':'clase suelta: '+C[cual][2]),
    fecha:sel[0],turno:turno==='almuerzo'?'Mañana 10-13':'Tarde 15-18',personas:st.al,dir:dir,zona:st.zona.toUpperCase(),nombre:nom,tel:tel,email:mail,
    notas:'Fechas: '+sel.join(', ')+(nota?' · '+nota:''),honorario:R.honT,ingredientes:R.ing,total:R.tot})});}catch(e){}
  var msg=L('Hola Daro, reservé '+(n===6?'el curso "Te enseño cocina nivel chef"':'una clase de "Te enseño cocina nivel chef"')+' ('+grp+'). Fechas: '+sel.map(fecha).join(', ')+'. Te paso el comprobante de la seña.',
            'Hi Daro, I booked '+(n===6?'the "I teach you chef-level cooking" course':'a "I teach you chef-level cooking" class')+' ('+grp+'). Dates: '+sel.map(fecha).join(', ')+'. Here is the deposit receipt.');
  okBox.innerHTML='<div class="ap-ok-in"><div class="ap-ok-ic">✓</div><span class="cp-k">✦ '+L('Reserva recibida','Booking received')+' · '+grp+'</span><h3>'+L('¡Nos vemos en tu cocina!','See you in your kitchen!')+'</h3>'+
    '<ol class="ap-sel">'+sel.map(function(k,i){var c=C[n===6?i:cual];return '<li class="ok"><span>'+c[1]+' '+(n===6?L('Clase ','Class ')+(i+1)+' · ':'')+L(c[2],c[3])+'</span><b>'+fecha(k)+' · '+(turno==='almuerzo'?'10:00':'15:00')+'</b></li>';}).join('')+'</ol>'+
    '<p>'+L('Para confirmar, transferí la seña de <b>'+f(senia)+'</b> (50% del honorario) al alias <b>daro.chef</b> y mandame el comprobante por WhatsApp. Las fechas quedan reservadas al acreditarse.',
             'To confirm, transfer the <b>'+f(senia)+'</b> deposit (50% of the fee) to alias <b>daro.chef</b> and send me the receipt on WhatsApp. Dates are secured once it is received.')+'</p>'+
    '<a class="ap-wa" target="_blank" rel="noopener" href="https://wa.me/5491160410607?text='+encodeURIComponent(msg)+'">'+L('Enviar comprobante por WhatsApp','Send receipt on WhatsApp')+'</a></div>';
  try{window.celTrack&&celTrack('reserva_completada',{servicio:'clases',modalidad:n===6?'curso':'suelta',value:R.tot,currency:'ARS'});window.celTrack&&celTrack('generate_lead',{value:R.tot,currency:'ARS'});}catch(e){}book.hidden=true;okBox.hidden=false;okBox.scrollIntoView({behavior:'smooth',block:'center'});
}
window.apBookSync=function(){if(!mes)return;if(sel.length>need())sel=sel.slice(0,need());render();planner();};
document.getElementById('ap-elegir').addEventListener('click',async function(){
  try{window.celTrack&&celTrack('reserva_inicio',{servicio:'clases',origen:'aprende'});}catch(e){}book.hidden=false;okBox.hidden=true;if(!mes){mes=new Date(minD.getFullYear(),minD.getMonth(),1);placeholders();await Promise.all([cargar(),cargarYo()]);}render();planner();
  setTimeout(function(){book.scrollIntoView({behavior:'smooth',block:'start'});},60);});
document.getElementById('ap-prev').addEventListener('click',function(){mes=new Date(mes.getFullYear(),mes.getMonth()-1,1);render();});
document.getElementById('ap-next').addEventListener('click',function(){mes=new Date(mes.getFullYear(),mes.getMonth()+1,1);render();});
document.getElementById('ap-manual').addEventListener('click',function(){manual=true;planner();render();});
document.getElementById('ap-back').addEventListener('click',function(){manual=false;planner();});
document.getElementById('ap-cual').addEventListener('change',lista);
document.querySelectorAll('.ap-tu').forEach(function(b){b.addEventListener('click',function(){turno=b.getAttribute('data-tu');document.querySelectorAll('.ap-tu').forEach(function(x){x.classList.toggle('on',x===b);});});});
['ap-nom','ap-tel','ap-mail','ap-dir'].forEach(function(id){document.getElementById(id).addEventListener('input',valida);});
document.getElementById('ap-conf').addEventListener('click',confirmar);
if(location.hash==='#reservar')setTimeout(function(){document.getElementById('ap-elegir').click();},300);
document.querySelectorAll('[data-cel-lang]').forEach(function(b){b.addEventListener('click',function(){setTimeout(function(){if(mes){placeholders();render();}},40);});});
})();</script>"""
    # Animaciones de entrada
    h += r"""<script>(function(){
var els=document.querySelectorAll('.ap-sec .cp-k,.ap-h2,.ap-sub,.ap-e,.ap-c,.ap-i,.ap-calc,.ap-pro-in,.ap-fin>*,.ap-det');
els.forEach(function(e){e.classList.add('rv');});
document.querySelectorAll('.ap-et,.ap-cls,.ap-inc').forEach(function(g){[].forEach.call(g.children,function(c,i){c.style.transitionDelay=(i%6*90)+'ms';});});
if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in');});return;}
var io=new IntersectionObserver(function(es){es.forEach(function(x){if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}});},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
els.forEach(function(e){io.observe(e);});
var et=document.querySelector('.ap-et');if(et)new IntersectionObserver(function(es,o){if(es[0].isIntersecting){et.classList.add('draw');o.disconnect();}},{threshold:.4}).observe(et);
})();</script>"""
    # Pro
    h += ('<section class="ap-pro"><div class="ap-pro-in"><div><span class="cp-k">✦ ' + bi('Después del curso', 'After the course') + '</span><h2>' +
          bi('Clases <em>Pro</em>: el vínculo queda abierto', '<em>Pro</em> classes: the door stays open') + '</h2><p>' +
          bi('Quienes terminan las 6 clases pueden sumar clases Pro sueltas, cada una dedicada a un plato técnico. Por ejemplo, aprender a cocinar uno de los menús de 3 pasos de Celestia.',
             'Everyone who finishes the 6 classes can add one-off Pro classes, each focused on a technical dish. For example, learning to cook one of Celestia\'s 3-course menus.') +
          f'</p><a class="cp-btn" style="margin-top:22px" href="{wa(msg_pro)}" target="_blank" rel="noopener">' + bi('Consultar una clase Pro →', 'Ask about a Pro class →') + '</a></div><ul>' +
          '<li>' + bi('<b>Un plato técnico por clase:</b> lo elegimos juntos según lo que quieras dominar.', '<b>One technical dish per class:</b> we choose it together based on what you want to master.') + '</li>' +
          '<li>' + bi('<b>Menús de Celestia:</b> aprendé a cocinar un menú de 3 pasos de nuestra carta.', '<b>Celestia menus:</b> learn to cook a 3-course menu from our offering.') + '</li>' +
          '<li>' + bi('<b>Sin volver a empezar:</b> partimos de todo lo que ya aprendiste en el curso.', '<b>No starting over:</b> we build on everything you already learned in the course.') + '</li>' +
          '<li>' + bi('<b>Cuando quieras:</b> clases sueltas, coordinadas por WhatsApp.', '<b>Whenever you want:</b> one-off classes, scheduled on WhatsApp.') + '</li>' +
          '<li class="ap-pro-price">' + bi('Clase Pro de 3 hs: <b>$' + format(PRECIOS['pro']['honorario'],',').replace(',','.') + '</b> + viáticos + ingredientes según el plato', '3-hour Pro class: <b>$' + format(PRECIOS['pro']['honorario'],',').replace(',','.') + '</b> + travel + ingredients for the dish') + '</li></ul></div></section>')
    # Cierre
    h += ('<section class="ap-fin"><h2>' + bi('¿Arrancamos?', 'Shall we start?') + '</h2><p>' +
          bi('Escribime y coordinamos días, horarios y valores del curso. Si querés, la primera charla es para ver qué te gustaría aprender.',
             "Message me and we'll arrange days, times and course fees. If you like, our first chat is just to see what you'd like to learn.") +
          f'</p><a class="ap-wa" href="{wa(msg_es)}" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>' +
          bi('Escribime por WhatsApp', 'Message me on WhatsApp') + '</a></section>')
    h += ('<footer class="cp-ftr"><a href="/">chefprivado.ar</a>·<a href="/blog">' + bi('Blog', 'Blog') + '</a>·<a href="https://www.instagram.com/celestiachefprivado/" target="_blank" rel="noopener">Instagram</a>'
          '<div style="margin-top:8px">Celestia · Chef Privado · Buenos Aires © 2026</div></footer><script src="/js/analytics.js"></script><script src="/js/i18n.js"></script></body></html>')
    escribir('aprende/index.html', h)

def franja_landing():
    p = os.path.join(ROOT, 'index.html'); t = open(p, encoding='utf-8').read()
    ini, fin = '<!--APRENDE-START-->', '<!--APRENDE-END-->'
    bloque = (ini + '<div id="bl-aprende" data-no-tr><a class="bl-ap" href="/aprende"><span class="bl-ap-img"></span><span class="bl-ap-tx">'
              '<span class="bl-stag">✦ ' + bi('NUEVO · TE ENSEÑO COCINA NIVEL CHEF', 'NEW · CHEF-LEVEL COOKING CLASSES') + '</span>'
              '<span class="bl-ap-h">' + bi('Aprendé a cocinar <em>como chef</em> en 6 clases', 'Learn to cook <em>like a chef</em> in 6 classes') + '</span>'
              '<span class="bl-ap-p">' + bi('Yo cocino y vos observás, cocinamos juntos, vos cocinás y yo observo. Después de la clase 6, cocinás vos. En tu cocina, con acompañamiento y clases Pro para después.',
                                          'I cook and you observe, we cook together, you cook and I observe. After class 6, you cook. In your kitchen, with ongoing support and Pro classes afterwards.') + '</span>'
              '<span class="bl-ap-steps"><i>👨‍🍳 ' + bi('Observás', 'Observe') + '</i><b>→</b><i>🤝 ' + bi('Cocinamos', 'Cook together') + '</i><b>→</b><i>🔪 ' + bi('Te observo', 'I observe') + '</i><b>→</b><i>🏠 ' + bi('Cocinás vos', 'You cook') + '</i></span>'
              '<span class="bl-ap-btn">' + bi('Ver el programa →', 'See the program →') + '</span></span></a></div>' + fin)
    if ini in t:
        t = re.sub(re.escape(ini) + '.*?' + re.escape(fin), lambda m: bloque, t, flags=re.S)
    else:
        ancla = '<!--CAPSULAS-START-->'
        assert t.count(ancla) == 1
        t = t.replace(ancla, bloque + ancla)
    open(p, 'w', encoding='utf-8').write(t)

def sitemap():
    p = os.path.join(ROOT, 'sitemap.xml'); t = open(p, encoding='utf-8').read()
    if 'chefprivado.ar/aprende' not in t:
        t = t.replace('</urlset>', '  <url>\n    <loc>https://chefprivado.ar/aprende</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>')
        open(p, 'w', encoding='utf-8').write(t)

if __name__ == '__main__':
    build(); franja_landing(); sitemap(); print('ok aprende')
