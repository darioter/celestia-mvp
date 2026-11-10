/* Celestia · bot de WhatsApp (Cloud API de Meta + Claude)
   GET  /api/wa-bot   → verificación del webhook de Meta (hub.challenge)
   POST /api/wa-bot   → mensajes entrantes de WhatsApp; o, con el encabezado x-celestia-sim, el simulador del admin
   Variables en Vercel:
     WA_TOKEN, WA_PHONE_ID         token de acceso y ID del número (Meta → WhatsApp → Configuración de la API)
     WA_VERIFY_TOKEN               texto que inventás vos y pegás también en Meta al configurar el webhook
     WA_APP_SECRET                 (opcional) secreto de la app de Meta: valida que los avisos vengan de Meta
     SUPABASE_SERVICE_KEY          clave service_role de Supabase (guarda las charlas)
     ANTHROPIC_API_KEY             ya está cargada (la usa /api/chat)
     WA_MODEL                      (opcional) modelo; por defecto claude-sonnet-5
     RESEND_API_KEY, NOTIFY_FROM, NOTIFY_TO   ya están: aviso por mail cuando el bot te pasa una charla */
import crypto from 'node:crypto';

export const config = { maxDuration: 60 };

const SITE = 'https://www.chefprivado.ar';
const SUPA_URL = 'https://qolpnuscpmzqeacshfvu.supabase.co';
const SUPA_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbHBudXNjcG16cWVhY3NoZnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjQ3OTQsImV4cCI6MjA5MTM0MDc5NH0.BJOz5Gwkeb1NqID_gkGKD5YlymifMtOwaf8iQMaBCx8';
const ADMINS = ['dario@dali-arquitectura.com.ar', 'celestiachefs@gmail.com'];
const MODEL = () => process.env.WA_MODEL || 'claude-sonnet-5';
const fmt = n => '$' + Math.round(n).toLocaleString('es-AR');
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json' } });

/* ───────── conocimiento: lo fijo del negocio + precios y fechas en vivo del sitio ───────── */
let CACHE = { t: 0, txt: '' };
function arr(h, marca) { const i = h.indexOf(marca), j = h.indexOf('\n];', i); if (i < 0 || j < 0) return []; try { return new Function('return ' + h.slice(i + marca.length - 1, j + 2))() || []; } catch (e) { return []; } }
function obj(h, marca) { const i = h.indexOf(marca), j = h.indexOf('\n};', i); if (i < 0 || j < 0) return {}; try { return new Function('return ' + h.slice(i + marca.length - 1, j + 2))() || {}; } catch (e) { return {}; } }
const num = t => parseInt(String(t || '').replace(/[^\d]/g, ''), 10) || 0;

async function fechasLibres(anonKey) {
  try {
    const h = { apikey: anonKey, Authorization: 'Bearer ' + anonKey };
    const [res, blo] = await Promise.all([
      fetch(SUPA_URL + '/rest/v1/reservas?select=fecha,turno,estado&estado=in.(reservada,confirmada,ofrecida,aceptada)', { headers: h }).then(r => r.json()),
      fetch(SUPA_URL + '/rest/v1/bloqueos?select=fecha', { headers: h }).then(r => r.json())
    ]);
    const ocup = {}; (Array.isArray(res) ? res : []).forEach(r => { const k = (r.fecha || '').slice(0, 10); if (k) (ocup[k] = ocup[k] || []).push(r.turno || 'dia'); });
    const bloq = new Set((Array.isArray(blo) ? blo : []).map(b => (b.fecha || '').slice(0, 10)));
    const hoy = new Date(Date.now() - 3 * 3600e3), libres = [], parcial = [];
    for (let d = 2; d <= 45; d++) {
      const f = new Date(hoy); f.setUTCDate(f.getUTCDate() + d); const k = f.toISOString().slice(0, 10);
      if (bloq.has(k)) continue;
      const lab = f.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
      if (!ocup[k]) libres.push(lab); else if (ocup[k].length === 1 && ocup[k][0] !== 'dia') parcial.push(lab + ' (libre ' + (ocup[k][0] === 'almuerzo' ? 'cena' : 'almuerzo') + ')');
    }
    return 'Fechas libres los próximos 45 días (desde pasado mañana): ' + libres.join(' · ') + (parcial.length ? '. Con un turno libre: ' + parcial.join(' · ') : '') + '.';
  } catch (e) { return 'No pude leer la agenda: ofrecé consultar la fecha con Daro.'; }
}

async function conocimiento() {
  if (CACHE.txt && Date.now() - CACHE.t < 10 * 60e3) return CACHE.txt;
  const [home, cj, bj] = await Promise.all([fetch(SITE + '/').then(r => r.text()), fetch(SITE + '/cajas/').then(r => r.text()), fetch(SITE + '/js/bebidas.js').then(r => r.text())]);
  const anon = SUPA_ANON;
  const d3 = num((home.match(/cel-desde" data-m="1">([^<]+)</) || [])[1]) || 480000;
  const d7 = num((home.match(/cel-desde" data-m="2">([^<]+)</) || [])[1]) || 720000;
  /* tabla exacta de 3 y 7 pasos (misma cuenta que el calculador de la home: servicio + asistentes + ingredientes × índice) */
  let tablaExp = '';
  try {
    const TF = obj(home, 'const TARIFAS = {'), VA = num((home.match(/const VALOR_ASISTENTE = (\d+)/) || [])[1]) || 100000, RF = parseFloat((home.match(/const RECARGO_FINDE = ([\d.]+)/) || [])[1]) || 0.1;
    let idx = 1; try { const j = await (await fetch(SUPA_URL + '/rest/v1/canasta_indice?select=indice&order=fecha.desc&limit=1', { headers: { apikey: SUPA_ANON, Authorization: 'Bearer ' + SUPA_ANON } })).json(); const x = j && j[0] && +j[0].indice; if (x > 0.5 && x < 3) idx = x; } catch (e) {}
    const tot = (m, p, finde) => { const t = TF[m], sv = t.servicio[p] != null ? t.servicio[p] : t.servicio[12] + (p - 12) * t.servicioExtraPP, ig = t.ingredientes[p] != null ? t.ingredientes[p] : t.ingredientes[12] + (p - 12) * t.ingredientesExtraPP; const as = p >= 9 ? 2 : (p >= 3 ? 1 : 0); return Math.round(sv * (finde ? 1 + RF : 1)) + as * VA + Math.round(ig * idx / 1000) * 1000; };
    tablaExp = [1, 2].filter(m => TF[m]).map(m => '- ' + (m === 1 ? '3 pasos' : '7 pasos') + ' (total todo incluido · entre semana / fin de semana): ' + [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(p => p + ' pers. ' + fmt(tot(m, p, false)) + ' / ' + fmt(tot(m, p, true))).join('; ')).join('\n');
  } catch (e) {}
  const CAJAS = arr(cj, 'const CAJAS = ['), MERC = arr(cj, 'const MERCADITO = ['), OC = obj(cj, 'const OCASIONES = {');
  const hoyK = new Date(Date.now() - 3 * 3600e3).toISOString().slice(0, 10);
  const ocTxt = Object.keys(OC).map(k => { const o = OC[k]; if (o.fecha && o.fecha < hoyK) return ''; return '- ' + o.nombre + (o.fecha ? ' (entrega ' + o.fecha + ', pedidos hasta ' + o.cierre + ')' : '') + (o.franjas ? ', franjas ' + o.franjas.join(' / ') : ''); }).filter(Boolean).join('\n');
  const cajasTxt = CAJAS.map(c => {
    const opts = c.tipo === 'pp' ? (c.personas || []).map(p => p + ' personas ' + fmt(p * c.pp)) : (c.opciones || []).map(o => o.label + ' ' + fmt(o.precio));
    const menu = (c.menu || []).map(m => m[0] + ': ' + m[1]).join(' | ');
    return '- *' + c.nombre + '* (' + c.tag + '). ' + (c.tipo === 'pp' ? fmt(c.pp) + ' por persona. ' : '') + 'Opciones: ' + opts.join(' · ') + '. Ocasiones: ' + (c.ocasiones || []).map(k => OC[k] ? OC[k].nombre : k).join(', ') + '. Menú: ' + menu;
  }).join('\n');
  const mercTxt = MERC.filter(m => !m.cat).map(m => m.nombre + ' (' + m.det + ') ' + fmt(m.precio)).join('; ');
  let bebTxt = '';
  try { const B = new Function(bj + '\nreturn BEBIDAS;')(); const cats = {}; B.forEach(b => { (cats[b.cat] = cats[b.cat] || []).push(b.nombre + ' ' + fmt(b.precio)); }); bebTxt = Object.keys(cats).map(k => k + ': ' + cats[k].join(', ')).join('\n'); } catch (e) {}
  const agenda = await fechasLibres(anon);
  const txt = `
SERVICIOS (precios vigentes, no inventes otros):
- *Experiencia de 3 pasos en casa*: entrada, principal y postre. Desde ${fmt(d3)} para 2 personas, todo incluido (compras, cocina, servicio, asistentes, ingredientes y limpieza). De 2 a 12 personas. Fin de semana (vie noche, sáb, dom) cuesta algo más que entre semana (lun a vie mediodía). Calculador y menús de ejemplo: ${SITE}/?reservar=3
- *Degustación de 7 pasos*: menú completo del bocado de bienvenida al postre. Desde ${fmt(d7)} para 2 personas, todo incluido. ${SITE}/?reservar=7
- Precio exacto por cantidad de personas (incluye servicio, asistentes e ingredientes; entre semana = lunes a viernes mediodía; fin de semana = viernes noche, sábado y domingo). Usalo para dar el total que pidan; aclarando que puede variar algo según el menú final:
${tablaExp}
- Hay 11 estilos de cocina y 110 menús de ejemplo para inspirarse; el menú final se arma con el cliente según gustos y restricciones.
- *Chef semanal*: Daro cocina en la casa ~6–7 hs por jornada, 10 a 12 preparaciones y comida para ~4 días (refrigerada y congelada); ordena y limpia. Desde $160.000 por jornada (1 a 2 personas; sube con más personas). Compras: las puede hacer Daro ($60.000 por jornada) o el cliente. Ingredientes aparte; viáticos según ubicación. 3 jornadas o más por semana = "chef de cabecera", propuesta mensual a medida. No incluye nutricionista (si es deportista, Daro coordina con el suyo; honorarios aparte). ${SITE}/?reservar=semanal
- *Mise en place*: deja todo cortado, porcionado y listo para cocinar. $25.000 la hora: media jornada (4 hs) $100.000, jornada (8 hs) $200.000. ${SITE}/?reservar=semanal
- *Chef privado en vacaciones* (costa atlántica, sierras, quintas o casas de veraneo): Daro viaja y cocina en la casa de alquiler. Tres formas: una noche especial (menú de 3 o 7 pasos para un cumpleaños, aniversario o la última cena del viaje); varios días de comida resuelta (jornadas tipo chef semanal para familias o grupos que se quedan una semana o más); o un encuentro grande a medida. Se toma como base el mismo valor que en Buenos Aires y se suma el traslado (y el alojamiento si son varios días), que se cotiza según el destino y la cantidad de días; el total se pasa antes de la seña. Para organizarlo hacen falta: lugar, fechas, cuántos son, qué tienen ganas de comer y fotos de la cocina (hornallas, horno, heladera y vajilla). Menú con producto del lugar (pescados y mariscos en la costa, cordero o cocina de montaña en las sierras). En temporada alta (diciembre, enero y fines de semana largos) las fechas se ocupan rápido: conviene reservar con tiempo. Página: ${SITE}/chef-privado-en-vacaciones (y la nota ${SITE}/blog/chef-privado-en-vacaciones). Para cotizar el traslado, derivá a Daro con lugar, fechas y personas.
- *Eventos y empresas*: más de 12 personas, team buildings, cierres de año, cenas con clientes. Propuesta a medida con reunión previa. No des precio: derivá a Daro.
- *Clases de cocina en casa*: curso de 6 clases de 3 hs (yo cocino y vos observás → cocinamos juntos → vos cocinás y yo observo → cocinás solo). Por clase: 1 persona $120.000, 2 $150.000, 3 $180.000, 4 $210.000, + viáticos (CABA $15.000, GBA $25.000) + ingredientes. Pack de 6 con 10% de descuento. Clase Pro de 3 hs: $180.000 + viáticos + ingredientes. ${SITE}/aprende
- *Management gastronómico* (consultoría para restaurantes): diagnóstico a medida (${SITE}/management#diagnostico); cursos online de pago único: Claves para armar tu emprendimiento $49.000, Marketing gastronómico y redes $69.000, Administración de negocios gastronómicos $79.000; Guía de costeo y food cost $9.900 (${SITE}/management/guia).

CAJAS (cenas de chef que se entregan el día del evento, listas para regenerar). Pedido en ${SITE}/cajas. ENTREGA SOLO EN CABA Y GRAN BUENOS AIRES, con el reparto propio de Celestia. NO se envían a la costa, al interior, a otras provincias ni al exterior, y no se despachan por correo ni transporte: son comidas de chef refrigeradas y no podemos garantizar la cadena de frío en un envío. Si alguien pregunta por mandar una caja a la costa o fuera de GBA, decilo claro y con amabilidad, y ofrecé la alternativa: el *chef privado en vacaciones* (Daro cocina allá). Si el cliente propone retirarla o llevarla por su cuenta, no lo confirmes: derivá a Daro. Seña 50% para confirmar, resto al recibir. Compra mínima ${fmt(70000)}. Envío: CABA $12.000, GBA cercano $16.000, GBA lejano $22.000; gratis desde $250.000. Para fechas especiales (Acción de Gracias, Navidad, Año Nuevo) la seña tiene que estar acreditada 72 hs antes: hay productos que se encargan con tiempo (como el pavo); si se confirma después no se garantizan todos los ingredientes y se ofrece un reemplazo equivalente.
Ocasiones disponibles:
${ocTxt}
Cajas:
${cajasTxt}
Mercadito (platos sueltos, se piden solos o con una caja): ${mercTxt}. ${SITE}/cajas#mercadito
Bebidas (llegan frías con el pedido; alcohol solo a mayores de 18): ${SITE}/cajas#bebidas
${bebTxt}

CONDICIONES GENERALES:
- Cobertura: CABA y Gran Buenos Aires con traslado incluido; resto del país con traslado a cotizar antes de la seña.
- Reservar no tiene costo; la fecha se confirma con una seña del 50% por transferencia al alias *daro.chef*. El saldo se paga al final del servicio (propina sugerida 15%).
- Cancelación: la seña no es reembolsable. Si se cancela, se abona un % del total según la anticipación (más de 15 días 50%; 15 a 10 días 60%; 10 días a 72 hs 80%; menos de 72 hs 100%), con la seña a cuenta. Por fuerza mayor se reprograma de común acuerdo.
- Se adapta el menú a alergias, celiaquía (sin TACC), vegetariano, vegano, sin lactosa, etc.
- Reseñas en Google: https://g.page/r/CWYAy7Wn5FfhEBM

AGENDA (solo orientativa; la confirmación la da Daro):
${agenda}`;
  CACHE = { t: Date.now(), txt };
  return txt;
}

function sistema(con, nombre) {
  return `Sos el asistente virtual de *Celestia Chef Privado* (chefprivado.ar), el servicio de Daro Castello, chef privado en Buenos Aires. Respondés por WhatsApp a clientes y posibles clientes.
Hoy es ${new Date(Date.now() - 3 * 3600e3).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })}.${nombre ? ' El cliente se llama ' + nombre + '.' : ''}

CÓMO HABLÁS
- Español rioplatense, cálido y profesional, con voseo. Si el cliente escribe en otro idioma, respondé en su idioma.
- Mensajes cortos, como en WhatsApp: 1 a 4 oraciones o una lista breve. Negritas con *asteriscos* (formato de WhatsApp). Sin títulos ni markdown de otro tipo. Como mucho un emoji por mensaje.
- En el primer mensaje de la charla presentate como el asistente de Daro y aclarale que Daro lee todo y se suma cuando haga falta. Nunca digas que sos Daro.
- Hacé una pregunta por vez para avanzar: fecha, cantidad de personas, ocasión, zona y restricciones.

QUÉ PODÉS HACER
- Explicar servicios, qué incluyen, precios "desde" y condiciones, SOLO con la información de abajo. Si algo no está, decí que lo consultás con Daro; no inventes precios, menús ni disponibilidad.
- Mandar el link de la página que corresponda.
- Contar qué fechas figuran libres, siempre aclarando que Daro la confirma.
- Para cajas, guiar al pedido en la web o tomar los datos para que Daro lo cierre.

QUÉ NO PODÉS HACER (pasale la charla a Daro)
- Confirmar o reservar una fecha, recibir o confirmar una seña o un pago, dar descuentos, cotizar eventos de más de 12 personas o corporativos, resolver reclamos, o cualquier cosa que no sepas.
- Cuando el cliente ya dio fecha y cantidad de personas y quiere avanzar, cuando pide hablar con Daro, cuando manda un comprobante o cuando hay un reclamo: avisale que le pasás la consulta a Daro, que le escribe a la brevedad, y agregá AL FINAL, en una línea aparte, exactamente:
[[DERIVAR]] <resumen en una línea para Daro: servicio, fecha, personas, ocasión, zona, restricciones y lo que pidió>
Esa línea no la ve el cliente.

INFORMACIÓN DEL NEGOCIO
${con}`;
}

/* ¿el primer mensaje de una charla nueva es una consulta para Celestia? (los mensajes armados desde la web arrancan con "Hola Daro!") */
async function esConsultaCelestia(texto) {
  const t = String(texto || '');
  if (/celestia|chefprivado|chef privado|private chef|chef semanal|mise en place|thanksgiving|degustaci[oó]n de 7|experiencia de 3|^hola daro! (quiero|me interesa|tengo una (consulta|duda)|le[ií] el blog)/i.test(t)) return true;
  if (t.length < 3 || /^\[El cliente mandó/.test(t)) return false;
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 5, system: 'Daro usa el mismo WhatsApp para su negocio de chef privado (Celestia: experiencias gastronómicas en casa, chef semanal, cajas de comida, clases de cocina, eventos, consultoría gastronómica) y para su vida personal y otros trabajos (estudio de arquitectura, amigos, familia). Te paso el primer mensaje de una persona nueva. Respondé solo SI si es una consulta o interés de cliente para Celestia, o NO si es personal, de otro trabajo, spam o no se entiende.', messages: [{ role: 'user', content: t.slice(0, 600) }] }) });
    const j = await r.json(); return /^\s*S[IÍ]/i.test(((j.content || [])[0] || {}).text || '');
  } catch (e) { return false; }
}
async function claude(sys, msgs) {
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL(), max_tokens: 700, system: sys, messages: msgs })
  });
  const j = await r.json();
  if (!r.ok) throw new Error((j.error && j.error.message) || 'Error de Anthropic');
  const t = (j.content || []).filter(c => c.type === 'text').map(c => c.text).join('\n').trim();
  const m = t.match(/\[\[DERIVAR\]\]\s*(.*)$/m);
  return { texto: t.replace(/\n?\[\[DERIVAR\]\].*$/m, '').trim(), derivar: !!m, resumen: m ? m[1].trim() : '' };
}
/* historial → mensajes para Claude (alterna cliente/asistente; une seguidos del mismo rol) */
function aMensajes(hist) {
  const out = [];
  hist.forEach(h => {
    const role = h.rol === 'cliente' ? 'user' : 'assistant', txt = (h.rol === 'daro' ? '(Daro respondió personalmente) ' : '') + (h.texto || '');
    if (out.length && out[out.length - 1].role === role) out[out.length - 1].content += '\n' + txt; else out.push({ role, content: txt });
  });
  while (out.length && out[0].role !== 'user') out.shift();
  return out;
}

/* ───────── Supabase (service role) ───────── */
const sk = () => process.env.SUPABASE_SERVICE_KEY;
async function db(path, opts = {}) {
  const r = await fetch(SUPA_URL + '/rest/v1/' + path, { ...opts, headers: { apikey: sk(), Authorization: 'Bearer ' + sk(), 'Content-Type': 'application/json', Prefer: 'return=representation', ...(opts.headers || {}) } });
  const t = await r.text(); let d = null; try { d = t ? JSON.parse(t) : null; } catch (e) {}
  if (!r.ok) throw new Error('Supabase ' + r.status + ': ' + t.slice(0, 200));
  return d;
}

/* ───────── WhatsApp ───────── */
async function enviar(to, texto) {
  const r = await fetch(`https://graph.facebook.com/v21.0/${process.env.WA_PHONE_ID}/messages`, {
    method: 'POST', headers: { Authorization: 'Bearer ' + process.env.WA_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body: texto, preview_url: true } })
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error('WhatsApp ' + r.status + ': ' + JSON.stringify(j).slice(0, 200));
  return j.messages && j.messages[0] && j.messages[0].id;
}
async function avisarDaro(tel, nombre, resumen) {
  if (!process.env.RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.NOTIFY_FROM, to: process.env.NOTIFY_TO, subject: '💬 WhatsApp: te paso una charla · ' + (nombre || tel),
        html: `<p><b>${nombre || ''}</b> (+${tel})</p><p>${String(resumen || '').replace(/</g, '&lt;')}</p><p><a href="https://wa.me/${tel}">Abrir la charla en WhatsApp</a> · <a href="${SITE}/admin">Ver en el admin</a></p>` })
    });
  } catch (e) {}
}

function firmaOK(raw, sig) {
  const s = process.env.WA_APP_SECRET; if (!s) return true;
  if (!sig) return false;
  const h = 'sha256=' + crypto.createHmac('sha256', s).update(raw).digest('hex');
  try { return crypto.timingSafeEqual(Buffer.from(h), Buffer.from(sig)); } catch (e) { return false; }
}

async function atender(msg, contacto) {
  const tel = msg.from, nombre = contacto && contacto.profile && contacto.profile.name || '';
  let texto = '';
  if (msg.type === 'text') texto = msg.text.body;
  else if (msg.type === 'button') texto = msg.button.text;
  else if (msg.type === 'interactive') texto = (msg.interactive.button_reply || msg.interactive.list_reply || {}).title || '';
  else texto = '[El cliente mandó ' + ({ audio: 'un audio', image: 'una imagen', document: 'un documento', video: 'un video', sticker: 'un sticker', location: 'una ubicación' }[msg.type] || 'un mensaje que no es texto') + ']';
  // guardar (wa_id único: si Meta reintenta, no se responde dos veces)
  const ins = await db('wa_mensajes?on_conflict=wa_id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify({ tel, rol: 'cliente', texto, wa_id: msg.id }) });
  if (!ins || !ins.length) return;
  const conv = ((await db('wa_conversaciones?tel=eq.' + tel + '&select=*')) || [])[0];
  const ahora = new Date().toISOString();
  if (!conv) {
    // charla nueva: el bot solo responde si el primer mensaje es una consulta para Celestia (en tu número también te escriben amigos y clientes de otras cosas)
    const esCel = await esConsultaCelestia(texto);
    await db('wa_conversaciones', { method: 'POST', body: JSON.stringify(esCel ? { tel, nombre, estado: 'bot', ultimo: ahora }
      : { tel, nombre, estado: 'daro', ultimo: ahora, no_leidos: 1, resumen: 'No parece una consulta de Celestia: el bot no responde.' }) });
    if (!esCel) return;
  } else {
    await db('wa_conversaciones?tel=eq.' + tel, { method: 'PATCH', body: JSON.stringify({ nombre: nombre || conv.nombre, ultimo: ahora, no_leidos: (conv.no_leidos || 0) + 1 }) });
    // si la charla es tuya (la tomaste, le escribiste desde la app o no es de Celestia), el bot no se mete hasta que la devuelvas desde el admin
    if (conv.estado === 'daro') return;
  }
  const hist = (await db('wa_mensajes?tel=eq.' + tel + '&select=rol,texto&order=created_at.desc&limit=24')).reverse();
  const r = await claude(sistema(await conocimiento(), nombre), aMensajes(hist));
  const wid = await enviar(tel, r.texto);
  await db('wa_mensajes', { method: 'POST', body: JSON.stringify({ tel, rol: 'bot', texto: r.texto, wa_id: wid || null }) });
  if (r.derivar) {
    await db('wa_conversaciones?tel=eq.' + tel, { method: 'PATCH', body: JSON.stringify({ estado: 'daro', resumen: r.resumen, derivado_at: new Date().toISOString() }) });
    await avisarDaro(tel, nombre, r.resumen);
  }
}
/* coexistencia: lo que Daro escribe desde la app llega como "eco" → el bot se corre */
async function ecoDaro(e) {
  const tel = e.to; if (!tel) return;
  await db('wa_mensajes?on_conflict=wa_id', { method: 'POST', headers: { Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ tel, rol: 'daro', texto: e.text ? e.text.body : '[mensaje de Daro]', wa_id: e.id }) });
  const ahora = new Date().toISOString();
  const conv = ((await db('wa_conversaciones?tel=eq.' + tel + '&select=tel')) || [])[0];
  if (conv) await db('wa_conversaciones?tel=eq.' + tel, { method: 'PATCH', body: JSON.stringify({ estado: 'daro', daro_ultimo: ahora, ultimo: ahora }) });
  else await db('wa_conversaciones', { method: 'POST', body: JSON.stringify({ tel, estado: 'daro', daro_ultimo: ahora, ultimo: ahora }) });
}

async function esAdmin(req) {
  const tok = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''); if (!tok) return false;
  try { const r = await fetch(SUPA_URL + '/auth/v1/user', { headers: { apikey: SUPA_ANON, Authorization: 'Bearer ' + tok } }); if (!r.ok) return false; const u = await r.json(); return ADMINS.includes((u.email || '').toLowerCase()); } catch (e) { return false; }
}

export async function GET(req) {
  const u = new URL(req.url);
  if (u.searchParams.get('hub.mode') === 'subscribe' && u.searchParams.get('hub.verify_token') && u.searchParams.get('hub.verify_token') === process.env.WA_VERIFY_TOKEN)
    return new Response(u.searchParams.get('hub.challenge') || '', { status: 200 });
  if (u.searchParams.get('estado') === '1')
    return json({ ok: true, whatsapp: !!(process.env.WA_TOKEN && process.env.WA_PHONE_ID), verify: !!process.env.WA_VERIFY_TOKEN, firma: !!process.env.WA_APP_SECRET, supabase: !!process.env.SUPABASE_SERVICE_KEY, claude: !!process.env.ANTHROPIC_API_KEY, modelo: MODEL() });
  return new Response('Forbidden', { status: 403 });
}

export async function POST(req) {
  const raw = await req.text();
  /* simulador del admin: mismo cerebro, sin WhatsApp ni base */
  if (req.headers.get('x-celestia-sim')) {
    if (!(await esAdmin(req))) return json({ error: 'Solo el admin puede usar el simulador' }, 401);
    try {
      const b = JSON.parse(raw || '{}');
      const h = b.historial || [];
      if (h.length === 1 && !(await esConsultaCelestia(h[0].texto))) return json({ silencio: true, texto: '🤫 El bot no respondería: no parece una consulta de Celestia (queda para vos).' });
      const r = await claude(sistema(await conocimiento(), b.nombre || ''), aMensajes(h));
      return json(r);
    } catch (e) { return json({ error: e.message }, 500); }
  }
  if (!firmaOK(raw, req.headers.get('x-hub-signature-256'))) return new Response('Bad signature', { status: 401 });
  let body = {}; try { body = JSON.parse(raw); } catch (e) { return new Response('ok'); }
  const tareas = [];
  (body.entry || []).forEach(en => (en.changes || []).forEach(ch => {
    const v = ch.value || {};
    (v.messages || []).forEach(m => tareas.push(atender(m, (v.contacts || []).find(c => c.wa_id === m.from))));
    (v.message_echoes || []).forEach(e => tareas.push(ecoDaro(e)));
  }));
  const res = await Promise.allSettled(tareas);
  res.filter(x => x.status === 'rejected').forEach(x => console.error('wa-bot', x.reason && x.reason.message));
  return new Response('ok');
}
