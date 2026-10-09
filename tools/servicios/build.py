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
mp = re.search(r"const MP_PRECIOS = \{\s*'1': \{ basico: (\d+), completo: (\d+) \},\s*'2': \{ basico: (\d+), completo: (\d+) \}", IDX)
MP = {'1': {'basico': int(mp.group(1)), 'completo': int(mp.group(2))}, '2': {'basico': int(mp.group(3)), 'completo': int(mp.group(4))}}
MULT = {'1-2': .8, '3-4': 1.0, '5-6': 1.25}
def mpp(pp, j, c): return round(MP[j][c] * MULT[pp] / 1000) * 1000
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
        filas += f'<tr><td>{bi(lab, lab_en)}</td><td>{f(mpp(pp,"1","basico"))}</td><td>{f(mpp(pp,"1","completo"))}</td><td>{f(mpp(pp,"2","basico"))}</td><td>{f(mpp(pp,"2","completo"))}</td></tr>'
    return ('<div class="sv-tw"><table><thead><tr><th>' + bi('Personas', 'People') + '</th><th>' + bi('1 jornada · 2 comidas/día', '1 session · 2 meals/day') + '</th><th>' +
            bi('1 jornada · 5 comidas/día', '1 session · 5 meals/day') + '</th><th>' + bi('2 jornadas · 2 comidas/día', '2 sessions · 2 meals/day') + '</th><th>' +
            bi('2 jornadas · 5 comidas/día', '2 sessions · 5 meals/day') + '</th></tr></thead><tbody>' + filas + '</tbody></table></div>')

PAGES = [
 dict(slug='cena-romantica-en-casa', img='/img/svc-3pasos.webp', menu=1,
  title='Cena romántica en casa con chef privado en Buenos Aires | Celestia', title_en='Romantic dinner at home with a private chef in Buenos Aires | Celestia',
  desc='Cena romántica en tu casa con chef privado en CABA y GBA: menú de 3 o 7 pasos cocinado en vivo por Daro Castello. Desde ' + f(total(1,2)) + ' para 2, todo incluido.',
  k=('Cena romántica · CABA y GBA', 'Romantic dinner · Buenos Aires'),
  h1=('Una cena romántica en casa, <em>cocinada en vivo para los dos.</em>', 'A romantic dinner at home, <em>cooked live for the two of you.</em>'),
  sub=('Aniversarios, propuestas, cumpleaños o simplemente porque sí. Diseño el menú con ustedes, llego con todo y cocino en su cocina mientras disfrutan.',
       'Anniversaries, proposals, birthdays or just because. I design the menu with you, arrive with everything and cook in your kitchen while you enjoy.'),
  precio=(f(total(1,2)), 'para 2 personas · todo incluido', 'for 2 · all included'),
  cta=('/?reservar=3', 'Reservar mi cena →', 'Book my dinner →'),
  wa='Hola Daro, quiero organizar una cena romántica en casa.',
  inc=[('🍽️','Menú de 3 o 7 pasos','3 or 7-course menu','Entrada, principal y postre, o una degustación completa de siete momentos.','Starter, main and dessert, or a full seven-moment tasting.'),
       ('🛒','Compras e ingredientes','Shopping and ingredients','Elijo y compro todo; el precio ya incluye los ingredientes.','I choose and buy everything; ingredients are included in the price.'),
       ('🔥','Cocina en vivo','Live cooking','Cocino en tu casa y presento cada paso con su historia.','I cook at your home and present each course with its story.'),
       ('🥂','Maridaje sugerido','Suggested pairing','Las bebidas corren por tu cuenta; te recomiendo vinos según el menú.','Drinks are on you; I recommend wines to match the menu.'),
       ('🎂','Detalles para la ocasión','Details for the occasion','Contame qué celebran y lo integramos al menú.','Tell me what you are celebrating and we weave it into the menu.'),
       ('✨','Ustedes solo disfrutan','You just enjoy','Me ocupo del servicio completo, del primer paso al cierre.','I take care of the full service, from the first course to the end.')],
  pasos=[('Elegís fecha','Pick a date','Menú de 3 o 7 pasos, día y horario.','3 or 7 courses, day and time.'),('Armamos el menú','We design the menu','Por WhatsApp, con sus gustos y restricciones.','On WhatsApp, with your tastes and restrictions.'),
         ('Cocino en tu casa','I cook at your home','Llego antes para el mise en place y sirvo cada paso.','I arrive early to prep and serve each course.'),('Ustedes disfrutan','You enjoy','Sin compras, sin cocina, sin platos.','No shopping, no cooking, no dishes.')],
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
  desc='Menú degustación privado de 7 pasos en tu casa, en CABA y GBA, cocinado en vivo por Daro Castello. De 2 a 12 personas, desde ' + f(total(2,2)) + ' todo incluido.',
  k=('Degustación 7 pasos · CABA y GBA', '7-course tasting · Buenos Aires'),
  h1=('Un menú degustación de 7 pasos, <em>en el comedor de tu casa.</em>', 'A 7-course tasting menu, <em>in your own dining room.</em>'),
  sub=('Una experiencia de restaurante de autor para 2 a 12 personas: siete momentos, del bocado de bienvenida al postre, cocinados y servidos en vivo.',
       'A chef’s-table experience for 2 to 12 guests: seven moments, from the welcome bite to dessert, cooked and served live.'),
  precio=(f(total(2,2)), 'para 2 personas · todo incluido', 'for 2 · all included'),
  cta=('/?reservar=7', 'Reservar la degustación →', 'Book the tasting →'),
  wa='Hola Daro, quiero consultar por un menú degustación de 7 pasos.',
  inc=[('✨','Siete pasos de autor','Seven signature courses','Bienvenida, entradas, intermedio, principal, pre-postre y postre.','Welcome bite, starters, intermediate, main, pre-dessert and dessert.'),
       ('🛒','Ingredientes incluidos','Ingredients included','Selecciono y compro los productos; el precio es con todo incluido.','I select and buy the produce; the price is all-inclusive.'),
       ('👨‍🍳','Asistentes de servicio','Service assistants','Desde 3 personas sumo un asistente; desde 9, dos.','From 3 guests I add an assistant; from 9, two.'),
       ('🔥','Cocina en vivo','Live cooking','Cada paso se termina y emplata frente a tus invitados.','Each course is finished and plated in front of your guests.'),
       ('🍷','Maridaje sugerido','Suggested pairing','Te recomiendo vinos para cada momento del menú.','I recommend wines for each moment of the menu.'),
       ('🥗','Restricciones','Dietary needs','Vegetarianos, celíacos o alergias: adaptamos el menú.','Vegetarian, gluten-free or allergies: we adapt the menu.')],
  pasos=[('Elegís fecha','Pick a date','Comensales, día y horario.','Guests, day and time.'),('Diseñamos el menú','We design the menu','Un estilo de cocina y siete pasos a medida.','A cooking style and seven tailored courses.'),
         ('Cocino en tu casa','I cook at your home','Llego con todo y preparo el mise en place.','I arrive with everything and prep on site.'),('La mesa es tuya','The table is yours','Vos e invitados solo disfrutan.','You and your guests just enjoy.')],
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
  desc='Chef semanal a domicilio en CABA y GBA: cocino en tu casa y te dejo las comidas de la semana listas, fraccionadas y etiquetadas. 2 o 5 comidas por día. Desde ' + f(mpp('1-2','1','basico')) + ' por jornada.',
  k=('Chef semanal · CABA y GBA', 'Weekly chef · Buenos Aires'),
  h1=('Tu semana resuelta: <em>comida casera de chef, lista en tu heladera.</em>', 'Your week sorted: <em>chef-made home food, ready in your fridge.</em>'),
  sub=('Cocino en tu casa una o dos veces por semana y te dejo almuerzos, cenas o el día completo, fraccionado y etiquetado, con un menú pensado para tu familia.',
       'I cook at your home once or twice a week and leave lunches, dinners or the whole day ready, portioned and labeled, with a menu designed for your family.'),
  precio=(f(mpp('1-2','1','basico')), 'por jornada · desde', 'per session · from'),
  cta=('/?reservar=semanal', 'Armar mi semana →', 'Plan my week →'),
  wa='Hola Daro, quiero consultar por el servicio de chef semanal.',
  inc=[('📋','Menú semanal a medida','A tailored weekly menu','Lo armamos por WhatsApp con gustos, rutinas y restricciones.','We plan it on WhatsApp around tastes, routines and dietary needs.'),
       ('⏱','Jornadas de 8 o 12 horas','8 or 12-hour sessions','2 comidas por día (~8 hs) o 5 comidas por día (~12 hs).','2 meals a day (~8 hrs) or 5 meals a day (~12 hrs).'),
       ('📦','Fraccionado y etiquetado','Portioned and labeled','Todo listo para calentar y servir durante la semana.','Everything ready to heat and serve all week.'),
       ('🥗','Equilibrado y casero','Balanced and homemade','Cocina de verdad, sin ultraprocesados.','Real cooking, no ultra-processed food.'),
       ('👨‍👩‍👧','De 1 a 6 personas','For 1 to 6 people','Ideal para familias, parejas o personas con poco tiempo.','Ideal for families, couples or busy people.'),
       ('🛒','Ingredientes','Ingredients','Se coordinan junto al menú antes de la primera jornada.','They are coordinated with the menu before the first session.')],
  pasos=[('Configurás','You set it up','Personas, jornadas y comidas por día.','People, sessions and meals per day.'),('Armamos el menú','We plan the menu','Por WhatsApp, con tus gustos y rutinas.','On WhatsApp, around your tastes and routines.'),
         ('Cocino en tu casa','I cook at your home','El día acordado en el calendario.','On the day booked on the calendar.'),('Comés rico toda la semana','Eat well all week','Todo listo para calentar.','Everything ready to heat.')],
  precios_h=('Valores por jornada','Prices per session'), tabla=tabla_mp,
  nota=('Honorario del servicio. Los ingredientes se coordinan aparte junto al menú definitivo.', 'Service fee. Ingredients are coordinated separately with the final menu.'),
  ejemplo=None,
  faq=[('¿Qué diferencia hay entre 2 y 5 comidas por día?','What is the difference between 2 and 5 meals a day?','Con 2 comidas te dejo almuerzo y cena (~8 hs de jornada). Con 5 sumo desayuno, merienda y postre (~12 hs).','With 2 meals I leave lunch and dinner (~8-hr session). With 5 I add breakfast, afternoon snack and dessert (~12 hrs).'),
       ('¿Qué días cocinás?','Which days do you cook?','Elegís el día en el calendario. Con 2 jornadas, una a principio y otra a mitad de semana.','You pick the day on the calendar. With 2 sessions, one early and one mid-week.'),
       ('¿Cómo se conserva la comida?','How is the food stored?','Te la dejo fraccionada y etiquetada, con indicaciones de qué va a la heladera y qué conviene congelar para el final de la semana.','I leave it portioned and labeled, noting what goes in the fridge and what is best frozen for later in the week.'),
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
]

def pagina(P):
    url = f'{SITE}/{P["slug"]}'
    ld = [{"@context": "https://schema.org", "@type": "Service", "name": re.sub('<[^>]+>', '', P['h1'][0]), "serviceType": P['k'][0].split(' · ')[0],
           "description": P['desc'], "url": url, "areaServed": ["Ciudad Autónoma de Buenos Aires", "Gran Buenos Aires"],
           "provider": {"@type": "LocalBusiness", "name": "Celestia · Chef Privado", "url": SITE + "/", "telephone": "+5491160410607",
                        "founder": {"@type": "Person", "name": "Daro Castello"}}},
          {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, _, a, _ in P['faq']]},
          {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Celestia", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": P['k'][0].split(' · ')[0], "item": url}]}]
    if P['menu']:
        ld[0]["offers"] = {"@type": "Offer", "priceCurrency": "ARS", "price": str(total(P['menu'], 2)), "description": "Desde, para 2 personas, todo incluido"}
    head = HEAD.format(title=P['title'], title_en=P['title_en'], desc=P['desc'], url=url, ogtype='website', ogimg=SITE + P['img'],
                       css=CSS + EXTRA_CSS, ld=''.join(f'<script type="application/ld+json">{json.dumps(x, ensure_ascii=False)}</script>' for x in ld),
                       nav_caps=bi('Blog', 'Blog'), nav_home=bi('Inicio', 'Home'), nav_book=bi('Reservar →', 'Book →'))
    wa = WA + quote(P['wa'])
    h = head
    h += (f'<section class="sv-hero" style="background-image:url(\'{P["img"]}\')"><div class="sv-hero-in"><span class="cp-k">✦ {bi(*P["k"])}</span>'
          f'<h1>{bi(*P["h1"])}</h1><p class="sv-sub">{bi(*P["sub"])}</p>'
          f'<div class="sv-price"><b>{P["precio"][0]}</b><span>{bi(P["precio"][1], P["precio"][2])}</span></div>'
          f'<div class="sv-btns"><a class="cp-btn" href="{P["cta"][0]}" data-ev="cta_servicio">{bi(P["cta"][1], P["cta"][2])}</a><a class="sv-ghost" href="{wa}" target="_blank" rel="noopener">{bi("Consultar por WhatsApp", "Ask on WhatsApp")}</a></div>'
          f'<div class="sv-trust"><span>★★★★★ <a href="{GOOGLE}" target="_blank" rel="noopener">5.0 · {bi("reseñas en Google", "Google reviews")}</a></span><span>✓ {bi("Cocina Daro Castello", "Cooked by Daro Castello")}</span><span>✓ {bi("CABA y GBA", "Buenos Aires area")}</span></div></div></section>')
    h += '<main class="sv-wrap">'
    h += ('<section class="sv-sec"><span class="cp-k">✦ ' + bi('Qué incluye', "What's included") + '</span><h2>' + bi('Todo resuelto, de principio a fin', 'Everything handled, start to finish') + '</h2><div class="sv-inc">' +
          ''.join(f'<div><i>{ic}</i><b>{bi(t, te)}</b><span>{bi(d, de)}</span></div>' for ic, t, te, d, de in P['inc']) + '</div></section>')
    h += ('<section class="sv-sec"><span class="cp-k">✦ ' + bi('Cómo funciona', 'How it works') + '</span><h2>' + bi('Cuatro pasos y listo', 'Four steps and done') + '</h2><div class="sv-steps">' +
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
