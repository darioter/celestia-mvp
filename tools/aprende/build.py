# -*- coding: utf-8 -*-
"""Genera /aprende/index.html (curso "Aprendé a cocinar en casa") y la franja de la landing.
Uso: python3 tools/aprende/build.py  (desde la raíz del repo)"""
import os, re, sys, json, html
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'blog'))
from build import CSS, HEAD, bi, ROOT, SITE, escribir

WA = 'https://wa.me/5491160410607?text='
def wa(msg): return WA + __import__('urllib.parse').parse.quote(msg)

# ── Contenido ────────────────────────────────────────────────────────────────
ETAPAS = [
  ("👀", "Yo cocino, vos mirás", "I cook, you watch", "Clases 1 y 2", "Classes 1 & 2",
   "Te muestro cada gesto de cerca y te explico el porqué: cómo se agarra el cuchillo, cuándo está caliente la sartén, cómo se ve un punto justo.",
   "I show you every move up close and explain the why: how to hold the knife, when the pan is hot enough, what the right doneness looks like."),
  ("🤝", "Cocinamos juntos", "We cook together", "Clases 3 y 4", "Classes 3 & 4",
   "Codo a codo en tu cocina. Vos tomás el cuchillo y la sartén; yo te acompaño, te corrijo y te paso los trucos en el momento.",
   "Side by side in your kitchen. You take the knife and the pan; I guide you, correct you and share the tricks in the moment."),
  ("👨‍🍳", "Vos cocinás, yo miro", "You cook, I watch", "Clases 5 y 6", "Classes 5 & 6",
   "Llevás el plato de principio a fin. Yo solo observo y te doy la devolución final: ya cocinás con criterio propio.",
   "You take the dish from start to finish. I just observe and give you the final feedback: you now cook with your own judgment."),
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
.ap-pills span{border:1px solid rgba(201,168,76,.4);color:var(--gdl);border-radius:999px;padding:6px 13px;font-size:12px;background:rgba(13,27,42,.4)}
.ap-sec{max-width:1140px;margin:0 auto;padding:72px 22px 0}
.ap-sec>.cp-k{display:block;text-align:center}
.ap-h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:36px;line-height:1.15;color:var(--nv);text-align:center;margin:8px 0 10px}
.ap-sub{text-align:center;max-width:620px;margin:0 auto 36px;color:#6B5F4F}
.ap-et{display:grid;grid-template-columns:repeat(3,1fr);gap:0;position:relative}
.ap-et::before{content:'';position:absolute;left:16.6%;right:16.6%;top:40px;height:2px;background:linear-gradient(90deg,var(--gd),var(--gdl))}
.ap-e{text-align:center;padding:0 20px;position:relative}
.ap-e-ic{width:80px;height:80px;border-radius:50%;margin:0 auto 16px;background:var(--nv);border:2px solid var(--gd);display:flex;align-items:center;justify-content:center;font-size:32px;box-shadow:0 0 0 8px var(--cr),0 12px 28px rgba(13,27,42,.18);position:relative}
.ap-e small{display:block;font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--gd);margin-bottom:6px}
.ap-e h3{font-family:'DM Serif Display',serif;font-weight:400;font-size:24px;color:var(--nv);margin-bottom:8px}
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
.ap-pro{max-width:1140px;margin:80px auto 0;padding:0 22px}
.ap-pro-in{background:linear-gradient(135deg,#0D1B2A 0%,#13263a 60%,#1d3348 100%);border-radius:24px;color:var(--cr);padding:46px 44px;display:grid;grid-template-columns:1.2fr 1fr;gap:40px;align-items:center;border:1px solid rgba(201,168,76,.35);position:relative;overflow:hidden}
.ap-pro-in::before{content:'PRO';position:absolute;right:-10px;bottom:-40px;font-family:'DM Serif Display',serif;font-size:200px;color:rgba(201,168,76,.07);line-height:1}
.ap-pro h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:34px;line-height:1.15;margin:8px 0 12px}
.ap-pro h2 em{color:var(--gdl)}
.ap-pro p{color:rgba(250,246,239,.75)}
.ap-pro ul{list-style:none;padding:0;margin:0;position:relative}
.ap-pro li{padding:12px 0 12px 36px;border-bottom:1px solid rgba(250,246,239,.1);position:relative;font-size:14.5px;color:rgba(250,246,239,.85)}
.ap-pro li b{color:#fff;font-weight:500}
.ap-pro li::before{content:'✓';position:absolute;left:0;top:12px;width:24px;height:24px;border-radius:50%;background:rgba(201,168,76,.18);color:var(--gdl);display:flex;align-items:center;justify-content:center;font-size:12px}
.ap-fin{max-width:760px;margin:80px auto 0;padding:0 22px 80px;text-align:center}
.ap-fin h2{font-family:'DM Serif Display',serif;font-weight:400;font-size:34px;color:var(--nv);margin-bottom:10px}
.ap-fin p{color:#6B5F4F;margin-bottom:22px}
.ap-wa{display:inline-flex;align-items:center;gap:10px;background:#25D366;color:#fff;text-decoration:none;font-weight:600;padding:14px 26px;border-radius:999px;box-shadow:0 8px 22px rgba(37,211,102,.3)}
@media(max-width:900px){.ap-et,.ap-cls{grid-template-columns:1fr}.ap-et::before{display:none}.ap-e{margin-bottom:28px}.ap-inc{grid-template-columns:1fr 1fr}.ap-pro-in{grid-template-columns:1fr;padding:34px 24px}.ap-hero h1{font-size:36px}.ap-hero{min-height:560px;background-position:70% center}.ap-hero::after{background:linear-gradient(180deg,rgba(13,27,42,.55) 0%,rgba(13,27,42,.95) 55%)}.ap-hero-in{align-self:flex-end}.ap-h2{font-size:28px}}
@media(max-width:520px){.ap-inc{grid-template-columns:1fr}}
'''
    msg_es = 'Hola Daro, quiero sumarme al curso "Aprendé a cocinar en casa" (6 clases). ¿Cómo seguimos?'
    msg_pro = 'Hola Daro, terminé el curso y quiero una clase Pro de un plato técnico. ¿Coordinamos?'
    ld = '<script type="application/ld+json">' + json.dumps({
        "@context": "https://schema.org", "@type": "Course", "name": "Aprendé a cocinar en casa con Daro Castello",
        "description": "Curso práctico de 6 clases en tu casa: yo cocino y vos mirás, cocinamos juntos, vos cocinás y yo miro.",
        "provider": {"@type": "Organization", "name": "Celestia Chef Privado", "sameAs": SITE},
        "inLanguage": "es-AR", "hasCourseInstance": {"@type": "CourseInstance", "courseMode": "onsite", "location": "Buenos Aires"}}, ensure_ascii=False) + '</script>'
    nav = dict(nav_caps=bi('Cápsulas', 'Kitchen notes'), nav_home=bi('Inicio', 'Home'), nav_book=bi('Quiero aprender →', 'I want to learn →'))
    h = HEAD.format(title='Aprendé a cocinar en casa · 6 clases prácticas con Daro Castello | Celestia', title_en='Learn to cook at home · 6 hands-on classes with Daro Castello | Celestia',
                    desc='Curso práctico de 6 clases en tu casa: yo cocino y vos mirás, cocinamos juntos y vos cocinás mientras yo miro. Cortes, fuego, salsas y tu primer menú de 3 pasos.',
                    url=url, ogtype='website', ogimg=SITE + '/img/hero-desktop-poster.webp', css=CSS + css_extra, ld=ld, **nav)
    h = h.replace('<a href="/" class="cp-cta">', f'<a href="{wa(msg_es)}" target="_blank" rel="noopener" class="cp-cta">')
    # Hero
    h += ('<section class="ap-hero"><div class="ap-hero-in"><span class="cp-k">✦ ' + bi('Aprendé en casa', 'Learn at home') + '</span>'
          '<h1>' + bi('Aprendé a cocinar <em>como chef</em>, en tu propia cocina.', 'Learn to cook <em>like a chef</em>, in your own kitchen.') + '</h1>'
          '<p>' + bi('Un curso práctico de 6 clases conmigo: primero cocino yo y vos mirás, después cocinamos juntos y al final cocinás vos mientras yo te miro.',
                      'A hands-on 6-class course with me: first I cook and you watch, then we cook together, and in the end you cook while I watch.') + '</p>'
          '<div class="ap-pills"><span>' + bi('6 clases prácticas', '6 hands-on classes') + '</span><span>' + bi('En tu casa', 'At your home') + '</span><span>' +
          bi('Acompañamiento por WhatsApp', 'WhatsApp support') + '</span><span>' + bi('Clases Pro después', 'Pro classes afterwards') + '</span></div>'
          f'<a class="cp-btn" href="{wa(msg_es)}" target="_blank" rel="noopener">' + bi('Quiero sumarme →', 'I want to join →') + '</a></div></section>')
    # Método
    h += ('<section class="ap-sec"><span class="cp-k">✦ ' + bi('El método', 'The method') + '</span><h2 class="ap-h2">' + bi('De mirar a cocinar solo, en tres etapas', 'From watching to cooking on your own, in three stages') +
          '</h2><p class="ap-sub">' + bi('Así se aprende en una cocina profesional: viendo, haciendo con alguien al lado y, por último, haciendo solo.',
                                       'This is how people learn in a professional kitchen: watching, doing with someone beside you and, finally, doing it alone.') + '</p><div class="ap-et">')
    for ic, tes, ten, ces, cen, des, den in ETAPAS:
        h += f'<div class="ap-e"><div class="ap-e-ic">{ic}</div><small>{bi(ces, cen)}</small><h3>{bi(tes, ten)}</h3><p>{bi(des, den)}</p></div>'
    h += '</div></section>'
    # Programa
    etapa = {'1': 'e1', '2': 'e1', '3': 'e2', '4': 'e2', '5': 'e3', '6': 'e3'}
    etq = {'e1': ('Yo cocino, vos mirás', 'I cook, you watch'), 'e2': ('Cocinamos juntos', 'We cook together'), 'e3': ('Vos cocinás, yo miro', 'You cook, I watch')}
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
    # Pro
    h += ('<section class="ap-pro"><div class="ap-pro-in"><div><span class="cp-k">✦ ' + bi('Después del curso', 'After the course') + '</span><h2>' +
          bi('Clases <em>Pro</em>: el vínculo queda abierto', '<em>Pro</em> classes: the door stays open') + '</h2><p>' +
          bi('Quienes terminan las 6 clases pueden sumar clases Pro sueltas, cada una dedicada a un plato técnico. Por ejemplo, aprender a cocinar uno de los menús de 3 pasos de Celestia.',
             'Everyone who finishes the 6 classes can add one-off Pro classes, each focused on a technical dish. For example, learning to cook one of Celestia\'s 3-course menus.') +
          f'</p><a class="cp-btn" style="margin-top:22px" href="{wa(msg_pro)}" target="_blank" rel="noopener">' + bi('Consultar una clase Pro →', 'Ask about a Pro class →') + '</a></div><ul>' +
          '<li>' + bi('<b>Un plato técnico por clase:</b> lo elegimos juntos según lo que quieras dominar.', '<b>One technical dish per class:</b> we choose it together based on what you want to master.') + '</li>' +
          '<li>' + bi('<b>Menús de Celestia:</b> aprendé a cocinar un menú de 3 pasos de nuestra carta.', '<b>Celestia menus:</b> learn to cook a 3-course menu from our offering.') + '</li>' +
          '<li>' + bi('<b>Sin volver a empezar:</b> partimos de todo lo que ya aprendiste en el curso.', '<b>No starting over:</b> we build on everything you already learned in the course.') + '</li>' +
          '<li>' + bi('<b>Cuando quieras:</b> clases sueltas, coordinadas por WhatsApp.', '<b>Whenever you want:</b> one-off classes, scheduled on WhatsApp.') + '</li></ul></div></section>')
    # Cierre
    h += ('<section class="ap-fin"><h2>' + bi('¿Arrancamos?', 'Shall we start?') + '</h2><p>' +
          bi('Escribime y coordinamos días, horarios y valores del curso. Si querés, la primera charla es para ver qué te gustaría aprender.',
             "Message me and we'll arrange days, times and course fees. If you like, our first chat is just to see what you'd like to learn.") +
          f'</p><a class="ap-wa" href="{wa(msg_es)}" target="_blank" rel="noopener"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.2 13.8c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2.1 1-2.4c.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.3.5-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.4 2.5 1.5.3.1.5.1.7-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>' +
          bi('Escribime por WhatsApp', 'Message me on WhatsApp') + '</a></section>')
    h += ('<footer class="cp-ftr"><a href="/">chefprivado.ar</a>·<a href="/blog">' + bi('Cápsulas', 'Kitchen notes') + '</a>·<a href="https://www.instagram.com/celestiachefprivado/" target="_blank" rel="noopener">Instagram</a>'
          '<div style="margin-top:8px">Celestia · Chef Privado · Buenos Aires © 2026</div></footer><script src="/js/i18n.js"></script></body></html>')
    escribir('aprende/index.html', h)

def franja_landing():
    p = os.path.join(ROOT, 'index.html'); t = open(p, encoding='utf-8').read()
    ini, fin = '<!--APRENDE-START-->', '<!--APRENDE-END-->'
    bloque = (ini + '<div id="bl-aprende" data-no-tr><a class="bl-ap" href="/aprende"><span class="bl-ap-img"></span><span class="bl-ap-tx">'
              '<span class="bl-stag">✦ ' + bi('NUEVO · APRENDÉ EN CASA', 'NEW · LEARN AT HOME') + '</span>'
              '<span class="bl-ap-h">' + bi('Aprendé a cocinar <em>como chef</em> en 6 clases', 'Learn to cook <em>like a chef</em> in 6 classes') + '</span>'
              '<span class="bl-ap-p">' + bi('Primero cocino yo y vos mirás, después cocinamos juntos y al final cocinás vos. En tu cocina, con acompañamiento y clases Pro para después.',
                                          'First I cook and you watch, then we cook together, and finally you cook. In your kitchen, with ongoing support and Pro classes afterwards.') + '</span>'
              '<span class="bl-ap-steps"><i>👀 ' + bi('Mirás', 'Watch') + '</i><b>→</b><i>🤝 ' + bi('Cocinamos', 'Cook together') + '</i><b>→</b><i>👨‍🍳 ' + bi('Cocinás', 'You cook') + '</i></span>'
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
