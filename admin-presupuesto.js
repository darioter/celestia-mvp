/* Celestia · Admin · Presupuesto formal A4 (propuesta + carta del menú).
   Todo se arma en el navegador: no escribe en la base. Los borradores quedan en este navegador. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var money = function (n) { return '$' + Math.round(Number(n) || 0).toLocaleString('es-AR'); };

  // ── Tarifas: misma tabla y fórmula que el sitio (index.html · TARIFAS / calcHonorario / calcIngredientes)
  var TARIFAS = {
    3: { servicio: {2:280000,3:280000,4:280000,5:315000,6:350000,7:385000,8:420000,9:455000,10:490000,11:525000,12:560000},
         ingredientes: {2:200000,3:200000,4:240000,5:300000,6:360000,7:420000,8:480000,9:540000,10:600000,11:660000,12:720000},
         sx: 35000, ix: 60000 },
    7: { servicio: {2:400000,3:400000,4:400000,5:450000,6:500000,7:550000,8:600000,9:650000,10:700000,11:750000,12:800000},
         ingredientes: {2:320000,3:320000,4:400000,5:500000,6:600000,7:700000,8:800000,9:900000,10:1000000,11:1100000,12:1200000},
         sx: 50000, ix: 100000 }
  };
  var VALOR_ASISTENTE = 100000, RECARGO_FINDE = 0.10, IDX = 1;
  function tabla(t, extra, p) { p = Math.max(2, p | 0); return t[p] != null ? t[p] : t[12] + (p - 12) * extra; }
  function asistentes(p) { return p >= 9 ? 2 : (p >= 3 ? 1 : 0); }
  function esFinde(fecha, turno) {
    if (!fecha) return false;
    var w = new Date(fecha + 'T12:00:00').getDay();
    return w === 0 || w === 6 || (w === 5 && turno === 'cena');
  }
  function calcular(f) {
    var tf = TARIFAS[f.pasos], p = Math.max(2, parseInt(f.personas, 10) || 2), fin = esFinde(f.fecha, f.turno);
    var servBase = tabla(tf.servicio, tf.sx, p), serv = Math.round(servBase * (fin ? 1 + RECARGO_FINDE : 1));
    var nA = asistentes(p), asist = nA * VALOR_ASISTENTE;
    var ing = Math.round(tabla(tf.ingredientes, tf.ix, p) * IDX / 1000) * 1000;
    return { servicio: serv, recargo: serv - servBase, asistentes: nA, asist: asist, ingredientes: ing, total: serv + asist + ing, finde: fin, personas: p };
  }

  var PASOS = (window.CELESTIA_PASOS) || { 3: ['Entrada', 'Principal', 'Postre'], 7: ['Bienvenida', 'Entrada fría', 'Entrada caliente', 'Intermedio', 'Principal', 'Pre-postre', 'Postre'] };
  var ESTILOS = window.CELESTIA_ESTILOS || [];
  var KEY = 'cel_presupuesto_borrador';

  var DEF = {
    cliente: '', contacto: '', ocasion: '', fecha: '', turno: 'cena', personas: 8, pasos: 3,
    estilo: '', menuNombre: '', platos: ['', '', ''], total: '', desglose: true, validez: 7,
    opciones: 1, modo: 'menus', menuNombreB: '', platosB: ['', '', ''], etiquetas: null, reservaId: '', pegado: '',
    intro: 'Gracias por pensar en Celestia para esta ocasión. Te comparto la propuesta: un menú diseñado para la fecha, cocinado y servido en tu casa.',
    notas: '', bebidas: 'Bebidas a cargo del anfitrión; sugerimos maridaje para cada paso.',
    servicio: 'exp', spp: '3-4', sjor: '2', compras: true, mjor: '1', mitems: ['verd', 'prot', 'fond', 'gran', 'env'],
    caja: '', cajaOp: 0, envio: 'z1', extras: [{ d: '', m: '' }, { d: '', m: '' }, { d: '', m: '' }], horario: '', dir: ''
  };
  var f = JSON.parse(JSON.stringify(DEF));
  try { var g = JSON.parse(localStorage.getItem(KEY) || 'null'); if (g) f = Object.assign(JSON.parse(JSON.stringify(DEF)), g); } catch (e) {}

  // ── Menús sugeridos: se pega el menú completo (1 o 2 opciones, 3 o 7 pasos) y se interpreta.
  //    Queda guardado en este navegador junto a la reserva elegida (no toca la base).
  var SUG_KEY = 'cel_menus_sugeridos';
  function sugLeer() { try { return JSON.parse(localStorage.getItem(SUG_KEY) || '{}') || {}; } catch (e) { return {}; } }
  function sugGuardar(id, texto) { if (!id) return; var s = sugLeer(); if (texto) s[id] = { texto: texto, t: Date.now() }; else delete s[id]; try { localStorage.setItem(SUG_KEY, JSON.stringify(s)); } catch (e) {} }
  function etq() { var n = Math.max((f.platos || []).length, PASOS[f.pasos].length); return (f.etiquetas && f.etiquetas.length) ? f.etiquetas : PASOS[f.pasos].slice(0, n); }
  function dos() { return +f.opciones === 2; }
  function norm(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  var PAL = /^(paso\s*\d+|entradas?( fria| caliente)?|principal(es)?|plato principal|plato fuerte|postres?|pre-? ?postre|bienvenida|snacks?|amuse|aperitivos?|intermedio|pastas?|fondo|sorbete|petit|primer|segundo|dulce|finger|canapes?|tapeo|antipasto|primo|secondo|dolce|ensalada|sopa|risotto|queso|quesos|cafe|pescado|carne|abrebocas|bocados?)\b/;
  function cap(s) { s = String(s).trim(); return s.charAt(0).toUpperCase() + s.slice(1); }
  function parsear(txt) {
    var opts = [], cur = null, hint = null, alt = false, nombre0 = '';
    var nueva = function (n) { cur = { nombre: n || '', items: [] }; opts.push(cur); };
    String(txt || '').split(/\r?\n/).forEach(function (raw) {
      var l = raw.replace(/[*_#`]+/g, '').replace(/^[\s>•·▪◦\-–—]+/, '').trim();
      if (!l) return;
      var n = norm(l), mp = n.match(/\b([37])\s*(pasos|tiempos|platos)\b/);
      var oh = l.match(/^(opci[oó]n|alternativa|men[uú]|propuesta)\s+([ABab12]|uno|dos)(?=$|[\s:.\-–—)(])\s*[:.\-–—)]?\s*(.*)$/i);
      if (oh) {
        if (mp) hint = +mp[1];
        nueva(oh[3].replace(/[(\[]?\b[37]\s*(pasos|tiempos)\b[)\]]?/ig, '').replace(/^[\s:·.\-–—|]+|[\s:·.\-–—|]+$/g, ''));
        return;
      }
      if (/^(men[uú]|propuesta)\b/i.test(l) && l.indexOf(':') < 0 || (mp && l.split(/\s+/).length <= 6 && l.indexOf(':') < 0)) {
        if (mp) hint = +mp[1];
        var nm = l.replace(/^(men[uú]|propuesta)\s*(de\s*)?/i, '').replace(/\b[37]\s*(pasos|tiempos|platos)\b/ig, '').replace(/^[\s:·.\-–—|]+|[\s:·.\-–—|]+$/g, '');
        if (nm && !cur) nombre0 = cap(nm);
        return;
      }
      if (/\$\s*\d|\b(precio|total|por persona|valor|condiciones|incluye|seña)\b/i.test(n)) return;
      if (!cur) nueva(nombre0);
      l = l.replace(/^(\d{1,2}|[ivx]{1,4})\s*[.)°º:\-–—]\s*/i, '');
      var last = cur.items[cur.items.length - 1];
      var am = l.match(/^([abAB])\s*[).:\-]\s+(.*)$/);
      if (am && last && last.solo) { if (!last.a) last.a = am[2]; else if (!last.b) { last.b = am[2]; alt = true; } return; }
      var label = '', dish = l, k = l.indexOf(':');
      if (k > 0) { var left = l.slice(0, k).trim(); if (left.length <= 32 && left.split(/\s+/).length <= 4) { label = left; dish = l.slice(k + 1).trim(); } }
      if (!label) { var dm = l.match(/^(.{2,30}?)\s+[—–-]\s+(.+)$/); if (dm && PAL.test(norm(dm[1]))) { label = dm[1].trim(); dish = dm[2].trim(); } }
      if (!label && PAL.test(n) && l.split(/\s+/).length <= 3) { label = l; dish = ''; }
      if (label && /^paso\s*\d+$/i.test(label)) label = '';
      if (!dish) { cur.items.push({ label: label, a: '', b: '', solo: true }); return; }
      if (!label && last && last.solo && !last.b) { if (!last.a) last.a = dish; else { last.b = dish; alt = true; } return; }
      var p = dish.split(/\s+(?:\/|\||ó|o bien)\s+/);
      if (p.length > 1) alt = true;
      cur.items.push({ label: label, a: p[0].trim(), b: (p[1] || '').trim() });
    });
    opts = opts.filter(function (o) { return o.items.some(function (i) { return i.a; }); });
    opts.forEach(function (o) { o.items = o.items.filter(function (i) { return i.a; }); });
    if (!opts.length) return null;
    var A = opts[0], B = opts[1], r = { modo: 'menus', opciones: 1 };
    if (B) { r.opciones = 2; } else if (alt) { r.opciones = 2; r.modo = 'pasos'; }
    var n = Math.max(A.items.length, B ? B.items.length : 0);
    r.pasos = hint || (n <= 3 ? 3 : 7);
    var base = PASOS[r.pasos], conLabel = A.items.some(function (i) { return i.label; });
    r.etiquetas = (!conLabel && n === base.length) ? null : Array.apply(null, Array(n)).map(function (_, i) {
      var it = A.items[i] || (B && B.items[i]) || {}; return it.label ? cap(it.label) : (n === base.length ? base[i] : (base[i] || 'Paso ' + (i + 1)));
    });
    r.platos = Array.apply(null, Array(n)).map(function (_, i) { return (A.items[i] || {}).a || ''; });
    r.platosB = Array.apply(null, Array(n)).map(function (_, i) { return B ? ((B.items[i] || {}).a || '') : ((A.items[i] || {}).b || ''); });
    r.menuNombre = A.nombre || (B ? '' : nombre0); r.menuNombreB = B ? B.nombre : '';
    return r;
  }
  function aplicar(r) {
    if (+r.pasos !== +f.pasos) { f.total = ''; f.totalRes = false; }
    f.opciones = r.opciones; f.modo = r.modo; f.pasos = r.pasos; f.etiquetas = r.etiquetas;
    f.platos = r.platos; f.platosB = r.platosB; f.estilo = '';
    if (r.menuNombre || r.opciones === 2) f.menuNombre = r.menuNombre; f.menuNombreB = r.menuNombreB;
  }
  function resumen(r) {
    if (!r) return 'No encontré platos. Probá con una línea por paso, por ejemplo «Entrada: Burrata con tomates».';
    var n = r.platos.length;
    return '✓ ' + (r.opciones === 2 ? (r.modo === 'pasos' ? '1 menú con 2 opciones por paso' : '2 opciones de menú') : '1 menú') + ' · ' + n + ' paso' + (n > 1 ? 's' : '') + ' · tarifa de ' + r.pasos + ' pasos';
  }

  // ── Otros servicios: chef semanal, mise en place, cajas y personalizado (mismas tarifas que el sitio)
  var SERVICIOS = { exp: 'Experiencia de 3 o 7 pasos', semanal: 'Chef semanal', mise: 'Mise en place', caja: 'Caja Celestia', libre: 'Personalizado' };
  var MP_PJ = 200000, MP_MULT = { '1-2': 0.8, '3-4': 1.0, '5-6': 1.25 }, MP_HORA = 25000, COMPRAS = 60000;
  // Ingredientes estimados por jornada de chef semanal (10–12 preparaciones, comida para ~4 días). Se ajusta con el índice de la canasta.
  var ING_SEM = { '1-2': 110000, '3-4': 180000, '5-6': 240000 };
  var PP_TXT = { '1-2': '1 a 2 personas', '3-4': '3 a 4 personas', '5-6': '5 a 6 personas' };
  var MISE = { verd: ['Verduras', 'Peladas, cortadas, blanqueadas y embolsadas'], prot: ['Proteínas', 'Despinadas, porcionadas y marinadas'],
    form: ['Hamburguesas y milanesas', 'Formadas o empanadas, separadas y listas para el freezer'], fond: ['Fondos y salsas base', 'Caldos, salsas y aderezos'],
    gran: ['Granos y legumbres', 'Arroz, quinoa, legumbres cocidas'], masa: ['Masas y panificados', 'Masas, tartas, pan, rebozados'], env: ['Envasado y etiquetado', 'Con fecha y uso, ordenado en heladera'] };
  var CAJAS = [], ENVIO = { z1: 12000, z2: 16000, z3: 22000 }, ENVIO_GRATIS = 250000, ENVIO_TXT = { z1: 'CABA', z2: 'GBA cercano', z3: 'GBA más lejos' };
  // Las cajas se leen de la página /cajas, así el presupuesto usa siempre los mismos precios y menús.
  fetch('/cajas/').then(function (r) { return r.text(); }).then(function (h) {
    var i = h.indexOf('const CAJAS = ['), j = h.indexOf('\n];', i);
    if (i > 0 && j > i) CAJAS = new Function('return ' + h.slice(i + 14, j + 2))() || [];
    var e = h.match(/const ENVIO = \{ z1: (\d+), z2: (\d+), z3: (\d+) \}/); if (e) ENVIO = { z1: +e[1], z2: +e[2], z3: +e[3] };
    var g = h.match(/const ENVIO_GRATIS_DESDE = (\d+)/); if (g) ENVIO_GRATIS = +g[1];
    if (f.servicio === 'caja' && $('#pz-form') && $('#pz-form').childElementCount) { form(); render(); }
  }).catch(function () {});
  function cajaSel() { return CAJAS.filter(function (c) { return c.id === f.caja; })[0] || null; }
  function cajaOps(c) { return !c ? [] : (c.tipo === 'pp' ? (c.personas || [4]).map(function (n) { return { label: 'Para ' + n, personas: n, precio: c.pp * n }; }) : (c.opciones || [])); }
  function extrasItems() { return (f.extras || []).filter(function (x) { return String(x.d).trim() && String(x.m).replace(/\D/g, ''); }).map(function (x) { return [x.d, +String(x.m).replace(/\D/g, '')]; }); }
  function calcAlt() {
    var r = { items: [], incluye: [], noIncluye: [], menu: [], menuTit: '', formato: '', personas: '', pago: 'seña del 50% para confirmar la fecha y saldo el día del servicio, por transferencia o MercadoPago.', cond: '' };
    if (f.servicio === 'semanal') {
      var j = parseInt(f.sjor, 10) || 1, hon = Math.round(MP_PJ * j * (MP_MULT[f.spp] || 1) / 1000) * 1000;
      r.titulo = 'Chef semanal'; r.formato = j + (j > 1 ? ' jornadas' : ' jornada') + ' · ' + PP_TXT[f.spp]; r.personas = PP_TXT[f.spp];
      r.items.push(['Servicio de chef · ' + j + (j > 1 ? ' jornadas' : ' jornada') + ' de ~6–7 hs · ' + (10 * j) + ' a ' + (12 * j) + ' preparaciones', hon]);
      if (f.compras) r.items.push(['Servicio de compras (tiempo de mercado y proveedores) · ' + j + ' × ' + money(COMPRAS), COMPRAS * j]);
      var ing = Math.round(ING_SEM[f.spp] * j * IDX / 1000) * 1000;
      if (f.ingEst !== false) r.items.push(['Ingredientes estimados · ' + (10 * j) + ' a ' + (12 * j) + ' preparaciones (al costo, con ticket)', ing]);
      r.menuTit = 'Así funciona';
      r.menu = [['Planificación y menú', 'Gustos, restricciones y cantidad de comensales. Para deportistas, coordino los menús con su nutricionista (sus honorarios no están incluidos).'],
        ['Producción en domicilio', '~6–7 horas por jornada y entre 10 y 12 preparaciones: principales, guarniciones y opciones dulces.'],
        ['Entrega y conservación', 'Comida para ' + (j > 1 ? 'toda la semana' : 'unos cuatro días') + ', parte refrigerada y parte congelada. Cocina ordenada y limpia al terminar.']];
      r.incluye = ['Diseño del menú semanal', 'Producción en tu cocina', 'Fraccionado y etiquetado', f.compras ? 'Compras de mercado y proveedores' : 'Lista de compras para que la hagas vos', 'Cocina limpia al terminar'];
      r.noIncluye = [f.ingEst !== false ? 'Diferencia de ingredientes: el estimado se ajusta al menú y se cobra al costo, con ticket' : 'Ingredientes (al costo, con ticket)', 'Honorarios de nutricionista', 'Viáticos: según la ubicación, se definen después', 'Envases y recipientes para freezer', 'IVA (los precios son sin IVA)'];
      r.cond = 'Las jornadas se coordinan con al menos 48 horas de anticipación. El menú se cierra antes de cada jornada; cambios de fecha con 24 horas de aviso.';
    } else if (f.servicio === 'mise') {
      var jm = parseFloat(f.mjor) || 1, hs = jm * 8, honm = Math.round(hs * MP_HORA);
      var items = (f.mitems || []).filter(function (k) { return MISE[k]; });
      r.titulo = 'Mise en place'; r.formato = (jm === 0.5 ? 'Media jornada' : jm + (jm > 1 ? ' jornadas' : ' jornada')) + ' · ~' + hs + ' hs'; r.personas = PP_TXT[f.spp];
      r.items.push(['Mise en place en tu cocina · ~' + hs + ' hs de trabajo', honm]);
      if (f.compras) r.items.push(['Compras de mercado y proveedores · ' + Math.ceil(jm) + ' × ' + money(COMPRAS), COMPRAS * Math.ceil(jm)]);
      r.menuTit = 'Qué te dejo preparado';
      r.menu = items.map(function (k) { return MISE[k]; });
      r.incluye = ['Organización de la jornada según tu menú', 'Cortes, porcionado y bases listas para cocinar', 'Envasado y etiquetado con fecha y uso', 'Cocina limpia al terminar'];
      r.noIncluye = ['Ingredientes e insumos de envasado (al costo, con ticket)', 'Viáticos: según la ubicación, se definen después', 'IVA (los precios son sin IVA)'];
      r.cond = 'Si la carne o el pollo vienen sin picar, se suman ~2 horas y hace falta picadora. Coordinamos la jornada con al menos 48 horas de anticipación.';
    } else if (f.servicio === 'caja') {
      var c = cajaSel(), ops = cajaOps(c), o = ops[+f.cajaOp] || ops[0];
      r.titulo = c ? c.nombre : 'Caja Celestia'; r.formato = o ? o.label : '—'; r.personas = o ? (o.personas + ' personas') : '';
      if (c && o) r.items.push([c.nombre + ' · ' + o.label, o.precio]);
      var sub = r.items.concat(extrasItems()).reduce(function (a, x) { return a + x[1]; }, 0);
      var env = sub >= ENVIO_GRATIS ? 0 : (ENVIO[f.envio] || 0);
      r.envio = ['Envío · ' + (ENVIO_TXT[f.envio] || 'CABA') + (env ? '' : ' (sin cargo)'), env];
      r.menuTit = 'El menú'; r.menu = c ? (c.menu || []) : [];
      if (c && c.lead) r.lead = String(c.lead).replace('{mesa}', (o && o.mesa) || ('para ' + ((o && o.personas) || '') + ' personas'));
      r.incluye = ['Elaboración artesanal el día anterior o el mismo día', 'Cada preparación en su envase, lista para regenerar', 'Guía impresa para regenerar y servir', 'Entrega refrigerada en la franja elegida'];
      r.noIncluye = ['Bebidas', 'Vajilla y servicio en mesa', 'IVA (los precios son sin IVA)'];
      r.pago = 'seña del 50% para confirmar el pedido y saldo antes de la entrega, por transferencia o MercadoPago.';
      r.cond = 'Pedidos con al menos 48 horas de anticipación (fechas especiales según su cierre). Para fechas especiales (Acción de Gracias, Navidad, Año Nuevo) la seña tiene que estar acreditada con al menos 72 horas de anticipación: hay productos que se encargan con tiempo, como el pavo. Si se confirma después, no se garantiza la totalidad de los ingredientes; si alguno no se consigue, te propongo un reemplazo equivalente antes de cocinar. Cambios de cantidades hasta 72 horas antes. Conservar refrigerado y consumir dentro de las 48 horas.';
    } else {
      r.titulo = f.ocasion || 'Propuesta a medida'; r.formato = f.personas ? f.personas + ' personas' : '—'; r.personas = f.personas ? f.personas + ' personas' : '';
      r.incluye = ['Diseño de la propuesta a medida', 'Producción y coordinación con Celestia'];
      r.noIncluye = ['IVA (los precios son sin IVA)', 'Lo que no figure en el detalle'];
      r.cond = 'Valores sujetos a confirmación de la fecha con la seña.';
    }
    r.items = r.items.concat(extrasItems());
    if (r.envio) r.items.push(r.envio);
    r.calc = r.items.reduce(function (a, x) { return a + x[1]; }, 0);
    var man = String(f.total).replace(/\D/g, '');
    r.total = man ? +man : r.calc; r.manual = !!man && r.total !== r.calc;
    return r;
  }
  function formAlt() {
    var sel = function (k, ops, v) { return '<select data-k="' + k + '">' + ops.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(v) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>'; };
    var h = '';
    if (f.servicio === 'semanal' || f.servicio === 'mise') {
      h += '<div class="pz-2"><div class="pz-f"><label>Personas</label>' + sel('spp', [['1-2', '1 a 2'], ['3-4', '3 a 4'], ['5-6', '5 a 6']], f.spp) + '</div>';
      h += f.servicio === 'semanal' ? '<div class="pz-f"><label>Jornadas</label>' + sel('sjor', [['1', '1 jornada'], ['2', '2 jornadas'], ['3', '3 jornadas'], ['4', '4 jornadas']], f.sjor) + '</div></div>'
        : '<div class="pz-f"><label>Duración</label>' + sel('mjor', [['0.5', 'Media jornada (4 hs)'], ['1', '1 jornada (8 hs)'], ['2', '2 jornadas'], ['3', '3 jornadas']], f.mjor) + '</div></div>';
      if (f.servicio === 'mise') h += '<div class="pz-f"><label>Qué preparo</label>' + Object.keys(MISE).map(function (k) { return '<label class="pz-chk" style="margin:0 0 4px"><input type="checkbox" data-mi="' + k + '"' + ((f.mitems || []).indexOf(k) >= 0 ? ' checked' : '') + '> ' + esc(MISE[k][0]) + '</label>'; }).join('') + '</div>';
      h += '<label class="pz-chk"><input type="checkbox" data-k="compras"' + (f.compras ? ' checked' : '') + '> Hago yo las compras (+ ' + money(COMPRAS) + ' por jornada, solo mi tiempo)</label>';
      if (f.servicio === 'semanal') h += '<label class="pz-chk"><input type="checkbox" data-k="ingEst"' + (f.ingEst !== false ? ' checked' : '') + '> Sumar ingredientes estimados (' + money(Math.round(ING_SEM[f.spp] * IDX / 1000) * 1000) + ' por jornada)</label>';
    }
    if (f.servicio === 'caja') {
      var c = cajaSel();
      h += '<div class="pz-f"><label>Caja</label><select data-k="caja"><option value="">' + (CAJAS.length ? '— Elegir caja —' : 'Cargando cajas…') + '</option>' + CAJAS.map(function (x) { return '<option value="' + esc(x.id) + '"' + (x.id === f.caja ? ' selected' : '') + '>' + esc(x.nombre + ' · ' + (x.grupo || '')) + '</option>'; }).join('') + '</select></div>';
      if (c) h += '<div class="pz-f"><label>Opción</label>' + sel('cajaOp', cajaOps(c).map(function (o, i) { return [i, o.label + ' · ' + money(o.precio)]; }), f.cajaOp) + '</div>';
      h += '<div class="pz-f"><label>Envío</label>' + sel('envio', [['z1', 'CABA · ' + money(ENVIO.z1)], ['z2', 'GBA cercano · ' + money(ENVIO.z2)], ['z3', 'GBA más lejos · ' + money(ENVIO.z3)]], f.envio) + '</div>';
    }
    if (f.servicio === 'libre') h += '<div class="pz-f"><label>Comensales</label><input type="number" min="1" max="200" data-k="personas" value="' + esc(f.personas) + '"></div>';
    h += '<div class="pz-f"><label>' + (f.servicio === 'libre' ? 'Ítems del presupuesto' : 'Adicionales (opcional)') + '</label>' + (f.extras || []).map(function (x, i) {
      return '<div style="display:grid;grid-template-columns:1fr 110px;gap:6px;margin-bottom:5px"><input data-xd="' + i + '" value="' + esc(x.d) + '" placeholder="Concepto"><input data-xm="' + i + '" inputmode="numeric" value="' + esc(x.m) + '" placeholder="$"></div>';
    }).join('') + '<button type="button" id="pz-xmas" style="background:none;border:0;color:#E8C96B;font:600 12px \'DM Sans\';cursor:pointer;padding:2px 0;text-align:left">+ Agregar ítem</button></div>';
    return h;
  }
  function renderAlt(doc) {
    var r = calcAlt(), calc = $('#pz-calc');
    if (calc) calc.innerHTML = r.items.map(function (x) { return esc(x[0]) + ' · ' + money(x[1]); }).join('<br>') + '<br><b>Total ' + money(r.calc) + '</b>' + (r.manual ? ' · se muestra ' + money(r.total) : '');
    var horario = f.horario || (f.servicio === 'caja' ? 'A coordinar' : (f.servicio === 'libre' ? (f.turno === 'cena' ? 'Cena' : 'Almuerzo') : 'Desde las 9 h'));
    var filas = (r.manual ? [] : r.items).map(function (x) { return '<div><span>' + esc(x[0]) + '</span><span>' + money(x[1]) + '</span></div>'; }).join('');
    var menu = r.menu.length ? '<div class="pz-h2">' + esc(r.menuTit) + '</div><div class="pz-menu">' + r.menu.map(function (m) { return '<div><span>' + esc(m[0]) + '</span><b>' + esc(m[1]) + '</b></div>'; }).join('') + '</div>' : '';
    doc.innerHTML = '<section class="pz-page' + (r.menu.length > 4 || r.items.length > 4 || f.notas ? ' cmp' : '') + '">' +
      '<header class="pz-hd"><div class="pz-brand"><div class="pz-logo"><b>CELESTIA</b><small>CHEF PRIVADO</small></div>' +
      '<div class="pz-nro">Presupuesto <b>' + esc(nro) + '</b><br>' + esc(hoyLargo()) + '<br>Válido hasta el ' + esc(vence()) + '</div></div>' +
      '<div class="pz-tit">Presupuesto<br><em>' + esc(r.titulo) + '</em></div></header>' +
      '<div class="pz-bd"><div class="pz-bd-in">' +
      '<div class="pz-meta"><div><span>Para</span><b>' + esc(f.cliente || '—') + '</b></div><div><span>Ocasión</span><b>' + esc(f.ocasion || '—') + '</b></div><div><span>Contacto</span><b>' + esc(f.contacto || '—') + '</b></div>' +
      '<div><span>Fecha</span><b>' + esc(fechaLarga(f.fecha)) + '</b></div><div><span>' + (f.servicio === 'caja' ? 'Entrega' : 'Horario') + '</span><b>' + esc(horario) + '</b></div><div><span>Formato</span><b>' + esc(r.formato) + '</b></div></div>' +
      '<p class="pz-intro">' + esc(f.intro) + (r.lead ? ' ' + esc(r.lead) : '') + '</p>' + menu +
      (f.notas ? '<p class="pz-fine" style="margin-top:3mm"><b>Notas:</b> ' + esc(f.notas) + '</p>' : '') +
      '<div class="pz-row"><div><div class="pz-h2">Detalle</div><div class="pz-inv">' + filas +
      '<div class="t"><span>Total' + (r.personas ? ' · ' + esc(r.personas) : '') + '<small>' + (f.servicio === 'semanal' ? (f.ingEst !== false ? 'Con ingredientes estimados · viáticos aparte' : 'Ingredientes y viáticos aparte') : f.servicio === 'mise' ? 'Ingredientes y viáticos aparte' : 'No incluye IVA') + '</small></span><b>' + money(r.total) + '</b></div></div>' +
      '<p class="pz-pago"><b>Forma de pago:</b> ' + esc(r.pago) + '</p></div>' +
      '<div><div class="pz-h2">Incluye</div><ul class="pz-lst">' + r.incluye.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>' +
      '<div class="pz-h2" style="margin-top:4mm">No incluye</div><ul class="pz-lst no">' + r.noIncluye.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div></div>' +
      '<div class="pz-h2">Condiciones</div><p class="pz-fine" style="margin:0">' + esc(r.cond) + ' La seña no es reembolsable y se toma a cuenta; por fuerza mayor se reprograma de común acuerdo. Alergias y restricciones: informarlas al confirmar. Términos completos en chefprivado.ar/terminos.</p>' +
      '</div></div>' +
      '<footer class="pz-ft"><div class="pz-firma"><b>Daro Castello</b>Chef · Celestia Chef Privado</div><div style="text-align:right">chefprivado.ar · +54 9 11 6041-0607<br>CABA y Gran Buenos Aires</div></footer></section>';
    ajustar(doc); escalar(); reajustar(doc); refrescarMensaje();
  }

  // ── Mensaje para mandar junto al PDF (se arma con los datos del presupuesto)
  var ALIAS_PAGO = 'daro.chef', LINK_BEBIDAS = 'https://www.chefprivado.ar/cajas#bebidas';
  function tituloMsg() {
    if (f.servicio === 'exp') return f.menuNombre || ('Menú de ' + f.pasos + ' pasos');
    try { return calcAlt().titulo; } catch (e) { return 'Propuesta'; }
  }
  function mensaje() {
    var pri = String(f.cliente || '').trim().split(/\s+/)[0] || '';
    var fecha = f.fecha ? new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    var L = [], total, pago;
    L.push('¡Hola' + (pri ? ' ' + pri : '') + '! Te paso el presupuesto de *' + tituloMsg() + '*' + (fecha ? ' para el ' + fecha : '') + (f.ocasion ? ' (' + f.ocasion + ')' : '') + '.');
    if (f.servicio === 'exp') {
      var c = calcular(f); total = String(f.total).replace(/\D/g, '') ? +String(f.total).replace(/\D/g, '') : c.total;
      L.push('Es una experiencia de ' + f.pasos + ' pasos para ' + c.personas + ' personas: diseño el menú, hago las compras, preparo todo en mi cocina y lo termino y sirvo en tu casa' + (c.asistentes ? ', con ' + c.asistentes + ' asistente' + (c.asistentes > 1 ? 's' : '') : '') + '. La cocina queda limpia al terminar.');
      pago = 'Para reservar la fecha pedimos una seña del 50%; el saldo se abona al inicio del servicio.';
    } else {
      var r = calcAlt(); total = r.total; pago = 'Para confirmar pedimos una seña del 50% ' + (f.servicio === 'caja' ? 'y el saldo antes de la entrega.' : 'y el saldo el día del servicio.');
      if (f.servicio === 'caja' && f.caja === 'thanksgiving') {
        var op = (cajaOps(cajaSel())[+f.cajaOp] || {});
        L.push('Respetamos la cena tradicional completa: el pavo entero, para presentarlo y trincharlo en la mesa, con el gravy, el stuffing, las guarniciones, los pancitos y las dos tartas (pumpkin pie y apple pie). Cada preparación llega en su envase, con una tarjeta y la guía para regenerarla.');
        L.push('Un detalle importante: al ser un pavo entero, la producción es abundante. Lo más probable es que, además de la cena' + (op.mesa ? ' ' + op.mesa : '') + ', les quede comida para el día siguiente, como en la tradición americana del turkey sandwich del viernes (va la tarjeta con la receta). Por eso el valor no se compara con una cena porcionada: es el banquete completo de Thanksgiving.');
        L.push('Hay ingredientes que se encargan con anticipación, como el pavo, así que la seña tiene que estar acreditada al menos 72 horas antes.');
      } else if (f.servicio === 'caja') {
        L.push((r.lead ? r.lead + ' ' : '') + 'Llega refrigerada, cada preparación en su envase y con la guía para regenerar y servir.');
      } else if (f.servicio === 'semanal') {
        var j = parseInt(f.sjor, 10) || 1;
        L.push('Cocino en tu casa ' + (j > 1 ? j + ' jornadas' : '1 jornada') + ' de unas 6–7 horas: entre ' + 10 * j + ' y ' + 12 * j + ' preparaciones (principales, guarniciones y opciones dulces) y te dejo comida para ' + (j > 1 ? 'toda la semana' : 'unos cuatro días') + ', parte refrigerada y parte congelada. Ordeno la cocina y limpio antes de irme.');
        L.push('Los ingredientes ' + (f.ingEst !== false ? 'figuran como estimado y ' : '') + 'se pagan al costo, con ticket. Los viáticos dependen de la ubicación y los definimos cuando confirmemos la dirección.');
      } else if (f.servicio === 'mise') {
        L.push('Preparo en tu cocina todo lo que necesitás para cocinar la semana: cortado, porcionado, envasado y etiquetado. Los ingredientes se pagan al costo, con ticket, y los viáticos los definimos según la ubicación.');
      }
    }
    L.push('*Total: ' + money(total) + '*' + (f.servicio === 'exp' ? ' (servicio, asistentes e ingredientes).' : '.'));
    L.push(pago + ' Te adjunto el PDF con el detalle; el presupuesto es válido por ' + (parseInt(f.validez, 10) || 7) + ' días.');
    L.push('*Seña (50%): ' + money(Math.round(total * 0.5)) + '*\nTransferencia al alias *' + ALIAS_PAGO + '*. Cuando la hagas, mandame el comprobante y la fecha queda confirmada.');
    if (f.servicio !== 'semanal' && f.servicio !== 'mise') L.push('Si querés sumar bebidas (vinos, espumantes, aperitivos, gaseosas y aguas), las ves acá y te las llevo frías junto con el pedido: ' + LINK_BEBIDAS);
    L.push('Cualquier ajuste lo vemos sin problema. ¡Gracias por pensar en Celestia!\nDaro · Celestia Chef Privado');
    return L.join('\n\n');
  }
  function refrescarMensaje() { var mt = $('#pz-msg'); if (mt && !f.msgManual) mt.value = mensaje(); }

  // ── Marcar la fecha: crea (o actualiza) una reserva desde el admin, sin que el cliente reserve en el sitio.
  function marcarFecha() {
    var msg = $('#pz-mf-msg'), say = function (t, ok) { if (msg) { msg.className = 'pz-msg ' + (ok ? 'ok' : 'err'); msg.textContent = t; } };
    if (typeof supa === 'undefined') return say('No hay sesión de admin.');
    if (!f.fecha) return say('Elegí la fecha primero.');
    var alt = f.servicio !== 'exp', r = alt ? calcAlt() : null, c = alt ? null : calcular(f);
    var total = alt ? r.total : (String(f.total).replace(/\D/g, '') ? +String(f.total).replace(/\D/g, '') : c.total);
    var turno = (f.servicio === 'exp' || f.servicio === 'libre') ? f.turno : 'almuerzo';
    var personas = alt ? (parseInt(String(r.personas).replace(/^\D*(\d+).*$/, '$1'), 10) || parseInt(f.personas, 10) || 0) : c.personas;
    if (alt && /a\s+(\d+)/.test(r.personas)) personas = +r.personas.match(/a\s+(\d+)/)[1];
    var menu = alt ? (SERVICIOS[f.servicio] + ' · ' + r.titulo + ' · ' + r.formato) : ('Menú de ' + f.pasos + ' pasos' + (f.menuNombre ? ' · ' + f.menuNombre : ''));
    var ct = String(f.contacto || ''), email = (ct.match(/[^\s,;]+@[^\s,;]+/) || [''])[0], tel = (ct.replace(email, '').match(/[+\d][\d\s\-()]{6,}/) || [''])[0].trim();
    var datos = { fecha: f.fecha, turno: turno, menu: menu, personas: personas, nombre: f.cliente || 'Cliente WhatsApp', ocasion: f.ocasion || '',
      total: total, honorario: alt ? total : c.servicio + c.asist, ingredientes: alt ? 0 : c.ingredientes };
    if (email) datos.email = email; if (tel) datos.tel = tel; if (f.dir) datos.dir = f.dir;
    if (f.servicio === 'semanal' || f.servicio === 'mise') datos.tipo = 'semanal';
    var hacer = function () {
      if (f.reservaId) {
        return supa.from('reservas').update(datos).eq('id', f.reservaId).then(function (x) {
          if (x.error) throw x.error; say('✓ Reserva actualizada: ' + fechaLarga(f.fecha) + ' · ' + turno + '.', true); cargarReservas(true);
        });
      }
      datos.ref = 'ADM-' + Date.now().toString(36).toUpperCase(); datos.estado = 'reservada';
      datos.notas = 'Cargada desde el admin (pedido por WhatsApp). Presupuesto ' + nro + (f.notas ? ' · ' + f.notas : '');
      return supa.from('reservas').insert(datos).select('id').single().then(function (x) {
        if (x.error) throw x.error; f.reservaId = String(x.data.id); guardar(); guardarBase(true);
        var ok = '✓ Fecha marcada: ' + fechaLarga(f.fecha) + ' · ' + turno + ' (' + datos.ref + '). Ya aparece en Reservas y queda ocupada en el calendario del sitio.';
        form(); render(); say(ok, true); msg = $('#pz-mf-msg'); if (msg) { msg.className = 'pz-msg ok'; msg.textContent = ok; }
      });
    };
    supa.from('reservas').select('id,nombre,turno,estado').eq('fecha', f.fecha).in('estado', ['reservada', 'confirmada', 'ofrecida', 'aceptada']).then(function (q) {
      var otras = (q.data || []).filter(function (x) { return String(x.id) !== String(f.reservaId) && x.turno === turno; });
      if (otras.length && !confirm('Ya hay ' + otras.length + ' reserva(s) ese día en ese turno (' + otras.map(function (x) { return x.nombre; }).join(', ') + '). ¿Marcar igual?')) return;
      if (!f.reservaId && !confirm('¿Marcar el ' + fechaLarga(f.fecha) + ' (' + turno + ') para ' + datos.nombre + ' por ' + money(total) + '? Queda como reserva sin seña.')) return;
      return hacer();
    }).catch(function (e) { say('No se pudo guardar: ' + (e && e.message || e)); });
  }

  function numero() { var d = new Date(); var p = function (n) { return String(n).padStart(2, '0'); }; return 'CEL-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds()); }
  var nro = f.nro || numero(); f.nro = nro;
  function fechaLarga(k) { if (!k) return 'A definir'; var t = new Date(k + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); return t.charAt(0).toUpperCase() + t.slice(1); }
  function hoyLargo() { return new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }); }
  function vence() { var d = new Date(); d.setDate(d.getDate() + (parseInt(f.validez, 10) || 7)); return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' }); }

  // ── Estilos (panel + hojas A4 + impresión)
  var css = document.createElement('style');
  css.textContent = [
    '#seccion-presupuestos .pz-wrap{display:grid;grid-template-columns:minmax(300px,380px) minmax(0,1fr);gap:22px;align-items:start}',
    '#seccion-presupuestos .pz-form{background:linear-gradient(180deg,#13263a,#0f1f30);border:1px solid rgba(232,201,107,.35);border-radius:16px;padding:18px;position:sticky;top:12px;max-height:calc(100vh - 40px);overflow:auto;color:#FAF6EF;color-scheme:dark;box-shadow:0 18px 40px rgba(0,0,0,.25)}',
    '#seccion-presupuestos .pz-form h3{font-family:"DM Serif Display",serif;font-weight:400;font-size:20px;margin:0 0 4px;color:#E8C96B}',
    '#seccion-presupuestos .pz-form p.pz-ay{font-size:12.5px;color:rgba(250,246,239,.78);margin:0 0 14px;line-height:1.45}',
    '#seccion-presupuestos .pz-f{display:flex;flex-direction:column;gap:4px;margin-bottom:10px}',
    '#seccion-presupuestos .pz-f label{font-size:10.5px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#E8C96B}',
    '#seccion-presupuestos .pz-f input,#seccion-presupuestos .pz-f select,#seccion-presupuestos .pz-f textarea{width:100%;box-sizing:border-box;background:#0a1622;border:1px solid rgba(232,201,107,.28);border-radius:10px;color:#FAF6EF;font:inherit;font-size:13.5px;padding:10px 11px;outline:none;transition:border-color .15s,box-shadow .15s}',
    '#seccion-presupuestos .pz-f input::placeholder,#seccion-presupuestos .pz-f textarea::placeholder{color:rgba(250,246,239,.42)}',
    '#seccion-presupuestos .pz-f input:hover,#seccion-presupuestos .pz-f select:hover,#seccion-presupuestos .pz-f textarea:hover{border-color:rgba(232,201,107,.5)}',
    '#seccion-presupuestos .pz-f input:focus,#seccion-presupuestos .pz-f select:focus,#seccion-presupuestos .pz-f textarea:focus{border-color:#E8C96B;box-shadow:0 0 0 3px rgba(232,201,107,.22)}',
    '#seccion-presupuestos .pz-f input:disabled{background:rgba(250,246,239,.06);color:#E8C96B;border-style:dashed;font-weight:600}',
    '#seccion-presupuestos .pz-f input[type=date]::-webkit-calendar-picker-indicator{filter:invert(.85) sepia(.6) saturate(4) hue-rotate(5deg);cursor:pointer}',
    '#seccion-presupuestos .pz-f textarea{resize:vertical;min-height:54px}',
    '#seccion-presupuestos .pz-f select option,#seccion-presupuestos .pz-f select optgroup{background:#0D1B2A;color:#FAF6EF}',
    '#seccion-presupuestos .pz-f select optgroup{color:#E8C96B}',
    '#seccion-presupuestos .pz-2{display:grid;grid-template-columns:1fr 1fr;gap:8px}',
    '#seccion-presupuestos .pz-chk{display:flex;align-items:center;gap:9px;font-size:13px;color:#FAF6EF;margin-bottom:12px;cursor:pointer}',
    '#seccion-presupuestos .pz-chk input{width:17px;height:17px;accent-color:#E8C96B}',
    '#seccion-presupuestos .pz-calc{font-size:12.5px;line-height:1.55;padding:11px 13px;border-radius:12px;background:rgba(232,201,107,.12);border:1px solid rgba(232,201,107,.45);color:rgba(250,246,239,.88);margin-bottom:12px}',
    '#seccion-presupuestos .pz-calc b{color:#E8C96B;font-size:14px}',
    '#seccion-presupuestos .pz-acc{display:flex;flex-wrap:wrap;gap:8px;margin-top:6px}',
    '#seccion-presupuestos .pz-acc button{flex:1 1 auto;border-radius:999px;padding:11px 14px;font:600 13px "DM Sans",sans-serif;cursor:pointer;border:1px solid rgba(232,201,107,.6);background:transparent;color:#FAF6EF}',
    '#seccion-presupuestos .pz-acc button:hover{background:rgba(232,201,107,.12)}',
    '#seccion-presupuestos .pz-acc button:focus-visible{outline:3px solid #E8C96B;outline-offset:2px}',
    '#seccion-presupuestos .pz-acc .pri{background:linear-gradient(135deg,#C9A84C,#E8C96B);color:#0D1B2A;border:0}',
    '#seccion-presupuestos .pz-sug{border:1px solid rgba(232,201,107,.55);background:rgba(232,201,107,.07);border-radius:14px;padding:12px 12px 10px;margin:4px 0 14px}',
    '#seccion-presupuestos .pz-sug .pz-f{margin-bottom:8px}',
    '#seccion-presupuestos .pz-sug textarea{min-height:150px;font:12.5px/1.5 ui-monospace,Menlo,Consolas,monospace}',
    '#seccion-presupuestos .pz-sug .pz-acc{margin-top:0}',
    '#seccion-presupuestos .pz-msg{font-size:12px;line-height:1.45;margin-top:8px;color:rgba(250,246,239,.85)}',
    '#seccion-presupuestos .pz-msg.ok{color:#9fe0b0}#seccion-presupuestos .pz-msg.err{color:#ffb4a8}',
    '#seccion-presupuestos .pz-mf{border:1px solid rgba(232,201,107,.6);background:rgba(232,201,107,.1);border-radius:14px;padding:12px;margin:0 0 14px;display:flex;flex-direction:column;gap:8px}',
    '#seccion-presupuestos .pz-mf b{color:#E8C96B;font-size:13.5px}#seccion-presupuestos .pz-mf span{font-size:12px;line-height:1.45;color:rgba(250,246,239,.8)}',
    '#seccion-presupuestos .pz-mf button{border-radius:999px;padding:11px 14px;font:600 13px "DM Sans",sans-serif;cursor:pointer;border:0;background:linear-gradient(135deg,#C9A84C,#E8C96B);color:#0D1B2A}',
    '#seccion-presupuestos .pz-mf .pz-msg{margin-top:0}',
    '#seccion-presupuestos .pz-sep{font-size:10.5px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#0D1B2A;background:#E8C96B;border-radius:6px;padding:4px 8px;margin:12px 0 8px;display:inline-block}',
    '#seccion-presupuestos .pz-prev{display:flex;flex-direction:column;align-items:center;gap:18px;overflow:hidden}',
    '#seccion-presupuestos .pz-scale{transform-origin:top center}',
    '@media(max-width:980px){#seccion-presupuestos .pz-wrap{grid-template-columns:1fr}#seccion-presupuestos .pz-form{position:relative;max-height:none}}',
    /* hojas */
    '.pz-page{display:flex;flex-direction:column;width:210mm;height:297mm;box-sizing:border-box;background:#FFFDF8;color:#2b2620;font-family:"DM Sans",sans-serif;position:relative;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.35)}',
    '.pz-page+.pz-page{margin-top:18px}',
    '.pz-hd{background:#0D1B2A;color:#FAF6EF;padding:11mm 16mm 8mm;position:relative;flex:none}',
    '.pz-hd::after{content:"";position:absolute;left:16mm;right:16mm;bottom:0;height:1.2mm;background:linear-gradient(90deg,#C9A84C,#E8C96B,#C9A84C)}',
    '.pz-brand{display:flex;justify-content:space-between;align-items:flex-start}',
    '.pz-logo b{display:block;font:400 24pt/1 "DM Serif Display",serif;letter-spacing:.14em}',
    '.pz-logo small{display:block;font-size:7pt;letter-spacing:.42em;color:#E8C96B;margin-top:2mm}',
    '.pz-nro{text-align:right;font-size:8pt;line-height:1.6;color:rgba(250,246,239,.7)}.pz-nro b{color:#E8C96B;font-weight:600}',
    '.pz-tit{margin-top:6mm;font:400 23pt/1.05 "DM Serif Display",serif}.pz-tit em{color:#E8C96B}',
    '.pz-bd{padding:7mm 16mm 0;flex:1;min-height:0;overflow:hidden}','.pz-bd-in{transform-origin:top left}',
    '.pz-meta{display:grid;grid-template-columns:repeat(3,1fr);gap:0;border:0.3mm solid #E3D7BF;border-radius:3mm;overflow:hidden}',
    '.pz-meta div{padding:2.4mm 4mm;border-right:0.3mm solid #EFE6D3;border-bottom:0.3mm solid #EFE6D3}',
    '.pz-meta div:nth-child(3n){border-right:0}.pz-meta div:nth-last-child(-n+3){border-bottom:0}',
    '.pz-meta span{display:block;font-size:6.6pt;letter-spacing:.16em;text-transform:uppercase;color:#a08a5c}',
    '.pz-meta b{display:block;font-size:9.2pt;font-weight:600;color:#0D1B2A;margin-top:.6mm}',
    '.pz-intro{font-size:9pt;line-height:1.5;color:#4f463b;margin:4.5mm 0 0}',
    '.pz-h2{display:flex;align-items:center;gap:3mm;font:400 13pt "DM Serif Display",serif;color:#0D1B2A;margin:5mm 0 2.5mm}',
    '.pz-h2::after{content:"";flex:1;height:.3mm;background:linear-gradient(90deg,#C9A84C,transparent)}',
    '.pz-menu{display:grid;gap:2mm}',
    '.pz-menu div{display:grid;grid-template-columns:30mm 1fr;gap:4mm;align-items:baseline;padding-bottom:1.6mm;border-bottom:.2mm dashed #E6DBC5}',
    '.pz-menu span{font-size:7pt;letter-spacing:.16em;text-transform:uppercase;color:#a08a5c}',
    '.pz-menu b{font:400 10.5pt/1.35 "DM Serif Display",serif;color:#0D1B2A}',
    '.pz-menu b i.o,.pz-cur b i.o{font:italic 400 .8em "DM Serif Display",serif;color:#a08a5c;margin:0 1.6mm}',
    '.pz-ops{display:grid;grid-template-columns:1fr 1fr;gap:5mm}',
    '.pz-op{border:.3mm solid #E3D7BF;border-radius:3mm;padding:3mm 4mm 2mm;background:#fffaf0}',
    '.pz-op h4{margin:0 0 2mm;font:400 11pt/1.2 "DM Serif Display",serif;color:#0D1B2A}.pz-op h4 small{display:block;font:600 6.6pt "DM Sans",sans-serif;letter-spacing:.18em;text-transform:uppercase;color:#a08a5c;margin-bottom:.8mm}',
    '.pz-op .pz-menu div{grid-template-columns:1fr;gap:.3mm}',
    '.pz-page.cmp .pz-op .pz-menu b{font-size:9.2pt}',
    '.pz-in .opn{font-size:7.6pt;letter-spacing:.3em;text-transform:uppercase;color:#a08a5c;margin-top:2.5mm}',
    '.pz-row{display:grid;grid-template-columns:1.15fr 1fr;gap:6mm}',
    '.pz-inv{border:0.3mm solid #E3D7BF;border-radius:3mm;overflow:hidden;font-size:9pt}',
    '.pz-inv div{display:flex;justify-content:space-between;gap:4mm;padding:2.2mm 4mm;border-bottom:.2mm solid #EFE6D3}',
    '.pz-inv div.t{background:#0D1B2A;color:#FAF6EF;border:0;padding:3.4mm 4mm;align-items:center}',
    '.pz-inv div.t b{font:400 17pt "DM Serif Display",serif;color:#E8C96B}',
    '.pz-inv div.t span small{display:block;font-size:6.8pt;opacity:.7}',
    '.pz-pago{font-size:8.4pt;line-height:1.5;color:#4f463b;margin-top:2.5mm}',
    '.pz-lst{margin:0;padding:0;list-style:none;font-size:8.6pt;line-height:1.45;color:#4f463b}',
    '.pz-lst li{position:relative;padding-left:4mm;margin-bottom:1.2mm}.pz-lst li::before{content:"✦";position:absolute;left:0;color:#C9A84C;font-size:6pt;top:.6mm}',
    '.pz-lst.no li::before{content:"–";font-size:8pt;top:0}',
    '.pz-can{width:100%;border-collapse:collapse;font-size:8.2pt;margin-top:1mm}',
    '.pz-can td{padding:1.4mm 2mm;border-bottom:.2mm solid #EFE6D3}.pz-can td:last-child{text-align:right;font-weight:600;color:#0D1B2A}',
    '.pz-fine{font-size:7.6pt;line-height:1.45;color:#6b6155;margin-top:2mm}',
    '.pz-page.cmp .pz-hd{padding:9mm 16mm 6mm}.pz-page.cmp .pz-tit{margin-top:4mm;font-size:20pt}.pz-page.cmp .pz-bd{padding-top:5mm}',
    '.pz-page.cmp .pz-meta div{padding:1.8mm 3.5mm}.pz-page.cmp .pz-intro{font-size:8.5pt;margin-top:3.5mm}',
    '.pz-page.cmp .pz-h2{font-size:12pt;margin:4mm 0 2mm}.pz-page.cmp .pz-menu{gap:1.2mm}.pz-page.cmp .pz-menu div{padding-bottom:1.1mm}.pz-page.cmp .pz-menu b{font-size:9.6pt;line-height:1.28}',
    '.pz-page.cmp .pz-inv div{padding:1.6mm 4mm}.pz-page.cmp .pz-inv div.t{padding:2.6mm 4mm}.pz-page.cmp .pz-inv div.t b{font-size:15pt}.pz-page.cmp .pz-pago{font-size:8pt;margin-top:2mm}',
    '.pz-page.cmp .pz-lst{font-size:8.2pt}.pz-page.cmp .pz-lst li{margin-bottom:.8mm}.pz-page.cmp .pz-can{font-size:7.8pt}.pz-page.cmp .pz-can td{padding:1.1mm 2mm}.pz-page.cmp .pz-fine{font-size:7.3pt}.pz-page.cmp .pz-ft{margin:3mm 16mm 8mm}',
    '.pz-ft{flex:none;margin:4mm 16mm 9mm;display:flex;justify-content:space-between;align-items:flex-end;gap:6mm;border-top:.3mm solid #E3D7BF;padding-top:4mm;font-size:8pt;color:#6b6155}',
    '.pz-firma b{display:block;font:400 13pt "DM Serif Display",serif;color:#0D1B2A}',
    '.pz-ft a{color:#8a6418;text-decoration:none}',
    /* carta */
    '.pz-carta{background:radial-gradient(circle at 50% 0,rgba(201,168,76,.10),transparent 55%),#FBF6EC;display:flex;align-items:stretch;justify-content:center;padding:14mm}',
    '.pz-marco{flex:1;border:.5mm solid #C9A84C;border-radius:2mm;position:relative;padding:3mm}',
    '.pz-marco::before{content:"";position:absolute;inset:2.2mm;border:.25mm solid rgba(201,168,76,.7);border-radius:1.2mm;pointer-events:none}',
    '.pz-in{height:100%;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;text-align:center;padding:16mm 16mm 12mm}',
    '.pz-in .ks{font-size:7.6pt;letter-spacing:.5em;color:#a08a5c;text-transform:uppercase}',
    '.pz-in .wm{font:400 30pt/1 "DM Serif Display",serif;letter-spacing:.18em;color:#0D1B2A;margin-top:4mm}',
    '.pz-in .oc{font:italic 400 18pt/1.2 "DM Serif Display",serif;color:#8a6418;margin-top:9mm}',
    '.pz-in .fe{font-size:8.6pt;letter-spacing:.2em;text-transform:uppercase;color:#6b6155;margin-top:3mm}',
    '.pz-orn{color:#C9A84C;font-size:11pt;letter-spacing:4mm;margin:8mm 0 4mm}',
    '.pz-cur{flex:1;display:flex;flex-direction:column;justify-content:center;gap:var(--gap,7mm);width:100%}',
    '.pz-cur div span{display:block;font-size:7pt;letter-spacing:.32em;text-transform:uppercase;color:#a08a5c;margin-bottom:1.6mm}',
    '.pz-cur div b{display:block;font:400 var(--fs,14pt)/1.3 "DM Serif Display",serif;color:#0D1B2A;max-width:130mm;margin:0 auto}',
    '.pz-in .pie{font-size:7.6pt;letter-spacing:.24em;text-transform:uppercase;color:#a08a5c;margin-top:6mm}',
    '.pz-in .pie b{display:block;font:italic 400 12pt "DM Serif Display",serif;letter-spacing:0;text-transform:none;color:#0D1B2A;margin-bottom:1.5mm}',
    /* impresión */
    '#pz-print-root{display:none}','@media print{@page{size:A4;margin:0}html,body{background:#fff!important;margin:0!important;padding:0!important}html.pz-printing body>*{display:none!important}html.pz-printing body>#pz-print-root{display:block!important}.pz-page{box-shadow:none!important;margin:0!important;break-after:page;page-break-after:always}.pz-page:last-child{break-after:auto;page-break-after:auto}*{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}'
  ].join('\n');
  document.head.appendChild(css);

  // ── Formulario
  function opcionesEstilos() {
    return '<option value="">— Escribir los platos a mano —</option>' + ESTILOS.map(function (e) {
      var m = e['m' + f.pasos] || [];
      return '<optgroup label="' + esc(e.emoji + ' ' + e.nombre) + '">' + m.map(function (x, i) {
        return '<option value="' + esc(e.id + ':' + i) + '"' + (f.estilo === e.id + ':' + i ? ' selected' : '') + '>' + esc(x.n) + '</option>';
      }).join('') + '</optgroup>';
    }).join('');
  }
  function camposPlatos() {
    var L = etq(), d = dos(), pp = f.modo === 'pasos';
    var col = function (arr, attr) { return L.map(function (paso, i) {
      return '<div class="pz-f"><label>' + esc(paso) + (d && pp ? (attr === 'data-plato' ? ' · opción A' : ' · opción B') : '') + '</label><input ' + attr + '="' + i + '" value="' + esc(arr[i] || '') + '" placeholder="Plato"></div>';
    }).join(''); };
    if (!d) return col(f.platos, 'data-plato');
    if (pp) return L.map(function (paso, i) {
      return '<div class="pz-f"><label>' + esc(paso) + '</label><input data-plato="' + i + '" value="' + esc(f.platos[i] || '') + '" placeholder="Opción A"><input data-platob="' + i + '" value="' + esc((f.platosB || [])[i] || '') + '" placeholder="Opción B" style="margin-top:4px"></div>';
    }).join('');
    return '<span class="pz-sep">Opción A</span>' + col(f.platos, 'data-plato') +
      '<span class="pz-sep">Opción B</span><div class="pz-f"><label>Nombre de la opción B</label><input data-k="menuNombreB" value="' + esc(f.menuNombreB) + '" placeholder="Ej.: Clásico de pastas"></div>' + col(f.platosB || [], 'data-platob');
  }
  function selOpciones() {
    var v = dos() ? (f.modo === 'pasos' ? '2p' : '2m') : '1';
    return '<div class="pz-f"><label>Opciones para el cliente</label><select id="pz-opc">' +
      '<option value="1"' + (v === '1' ? ' selected' : '') + '>Un menú</option>' +
      '<option value="2m"' + (v === '2m' ? ' selected' : '') + '>Dos menús completos (elige uno)</option>' +
      '<option value="2p"' + (v === '2p' ? ' selected' : '') + '>Un menú con 2 opciones en cada paso</option></select></div>';
  }
  function form() {
    var root = $('#pz-form'); if (!root) return;
    root.innerHTML =
      '<h3>Presupuesto formal</h3><p class="pz-ay">Hoja A4 lista para mandar por WhatsApp o mail. Se exporta a PDF desde «Imprimir». Con «Marcar la fecha» queda reservada sin que el cliente tenga que reservar en el sitio.</p>' +
      '<div class="pz-f"><label>Presupuestos guardados</label><select id="pz-gs"><option value="">Cargando…</option></select></div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin:-4px 0 12px;font-size:11.5px"><span id="pz-gd" style="color:rgba(250,246,239,.6)">N.º ' + esc(nro) + ' · se guarda solo al escribir</span><button type="button" id="pz-dup" style="background:none;border:0;color:#E8C96B;font:600 11.5px \'DM Sans\';cursor:pointer;padding:0">Duplicar como nuevo</button></div>' +
      '<div class="pz-f"><label>Servicio</label><select data-k="servicio">' + Object.keys(SERVICIOS).map(function (k) { return '<option value="' + k + '"' + (f.servicio === k ? ' selected' : '') + '>' + esc(SERVICIOS[k]) + '</option>'; }).join('') + '</select></div>' +
      '<div class="pz-f"><label>Cargar desde una reserva</label><select id="pz-res"><option value="">— Elegir reserva (opcional) —</option></select></div>' +
      '<div class="pz-mf"><b>📌 Pedido por WhatsApp</b><span>Completá cliente y fecha, y marcala: queda reservada sin que el cliente reserve en el sitio.</span><button type="button" id="pz-marcar">Marcar la fecha (sin reserva del cliente)</button>' + (f.reservaId ? '<button type="button" id="pz-actualizar" style="background:transparent;border:1px solid rgba(232,201,107,.6);color:#FAF6EF">Actualizar la reserva elegida</button>' : '') + '<div class="pz-msg" id="pz-mf-msg"></div></div>' +
      (f.servicio !== 'exp' ? formComun() : formExp()) +
      '<div class="pz-acc"><button type="button" class="pri" id="pz-print">🖨️ Imprimir / Guardar PDF</button><button type="button" id="pz-nuevo">Nuevo</button></div>' +
      (f.servicio === 'exp' ? '<div class="pz-acc"><button type="button" id="pz-subir">⬆ Subir menú al sitio e ingredientes</button></div>' : '') +
      '<div class="pz-sug" style="margin-top:16px"><div class="pz-f"><label for="pz-msg">Mensaje para mandar (WhatsApp o mail)</label><textarea id="pz-msg" style="min-height:220px;font:13px/1.5 \'DM Sans\',sans-serif"></textarea></div>' +
      '<div class="pz-acc" style="margin-top:0"><button type="button" class="pri" id="pz-copiar">📋 Copiar</button><button type="button" id="pz-wa">WhatsApp</button><button type="button" id="pz-mail">Mail</button><button type="button" id="pz-regen" title="Volver a armar el texto con los datos actuales">↺</button></div>' +
      '<div class="pz-msg" id="pz-msg-st">Se arma solo con los datos del presupuesto; podés editarlo antes de copiar.</div></div>';
    function formExp() { return '' +
      '<div class="pz-sug"><div class="pz-f"><label for="pz-pega">Menú sugerido · pegalo completo</label>' +
      '<textarea id="pz-pega" spellcheck="false" placeholder="' + esc('Opción A — Mediterráneo\nEntrada: Burrata con tomates asados\nPrincipal: Sorrentinos de calabaza\nPostre: Tiramisú\n\nOpción B — Clásico\nEntrada: …\nPrincipal: …\nPostre: …') + '">' + esc(f.pegado) + '</textarea></div>' +
      '<div class="pz-acc"><button type="button" class="pri" id="pz-leer">✦ Rellenar el presupuesto</button></div>' +
      '<div class="pz-msg" id="pz-sug-msg">Una línea por paso. Sirve para 3 o 7 pasos, con una o dos opciones («Opción A / Opción B», o «Entrada: X / Y»). Si elegiste una reserva, queda guardado con ella.</div></div>' +
      '<div class="pz-f"><label>Para (cliente o empresa)</label><input data-k="cliente" value="' + esc(f.cliente) + '" placeholder="Ej.: Quintessentially Concierge"></div>' +
      '<div class="pz-f"><label>Contacto</label><input data-k="contacto" value="' + esc(f.contacto) + '" placeholder="Nombre, mail o teléfono"></div>' +
      '<div class="pz-f"><label>Ocasión (título de la carta)</label><input data-k="ocasion" value="' + esc(f.ocasion) + '" placeholder="Ej.: Cumpleaños de Ana"></div>' +
      '<div class="pz-2"><div class="pz-f"><label>Fecha</label><input type="date" data-k="fecha" value="' + esc(f.fecha) + '"></div>' +
      '<div class="pz-f"><label>Turno</label><select data-k="turno"><option value="almuerzo"' + (f.turno === 'almuerzo' ? ' selected' : '') + '>Almuerzo</option><option value="cena"' + (f.turno === 'cena' ? ' selected' : '') + '>Cena</option></select></div></div>' +
      '<div class="pz-2"><div class="pz-f"><label>Comensales</label><input type="number" min="2" max="40" data-k="personas" value="' + esc(f.personas) + '"></div>' +
      '<div class="pz-f"><label>Formato</label><select data-k="pasos"><option value="3"' + (+f.pasos === 3 ? ' selected' : '') + '>3 pasos</option><option value="7"' + (+f.pasos === 7 ? ' selected' : '') + '>7 pasos</option></select></div></div>' +
      '<div class="pz-f"><label>Menú de ejemplo (opcional)</label><select id="pz-est">' + opcionesEstilos() + '</select></div>' +
      selOpciones() +
      '<div class="pz-f"><label>' + (dos() && f.modo !== 'pasos' ? 'Nombre de la opción A' : 'Nombre del menú') + '</label><input data-k="menuNombre" value="' + esc(f.menuNombre) + '" placeholder="Ej.: Mediterráneo de celebración"></div>' +
      camposPlatos() +
      '<div class="pz-calc" id="pz-calc"></div>' +
      '<div class="pz-f"><label>Total a mostrar (vacío = tarifa del sitio)</label><input data-k="total" inputmode="numeric" value="' + esc(f.total) + '" placeholder="Ej.: 1054000"></div>' +
      '<label class="pz-chk"><input type="checkbox" data-k="desglose"' + (f.desglose ? ' checked' : '') + '> Mostrar desglose (servicio, asistentes, ingredientes)</label>' +
      '<div class="pz-2"><div class="pz-f"><label>Validez (días)</label><input type="number" min="1" max="60" data-k="validez" value="' + esc(f.validez) + '"></div><div class="pz-f"><label>N.º</label><input value="' + esc(nro) + '" disabled></div></div>' +
      '<div class="pz-f"><label>Texto de presentación</label><textarea data-k="intro">' + esc(f.intro) + '</textarea></div>' +
      '<div class="pz-f"><label>Bebidas</label><input data-k="bebidas" value="' + esc(f.bebidas) + '"></div>' +
      '<div class="pz-f"><label>Notas (alergias, horarios, pedidos)</label><textarea data-k="notas" placeholder="Opcional">' + esc(f.notas) + '</textarea></div>'; }
    function formComun() { return '' +
      '<div class="pz-f"><label>Para (cliente o empresa)</label><input data-k="cliente" value="' + esc(f.cliente) + '" placeholder="Nombre"></div>' +
      '<div class="pz-f"><label>Contacto</label><input data-k="contacto" value="' + esc(f.contacto) + '" placeholder="Teléfono o mail"></div>' +
      '<div class="pz-f"><label>Ocasión</label><input data-k="ocasion" value="' + esc(f.ocasion) + '" placeholder="Ej.: Thanksgiving en familia"></div>' +
      '<div class="pz-2"><div class="pz-f"><label>Fecha</label><input type="date" data-k="fecha" value="' + esc(f.fecha) + '"></div>' +
      (f.servicio === 'libre' ? '<div class="pz-f"><label>Turno</label><select data-k="turno"><option value="almuerzo"' + (f.turno === 'almuerzo' ? ' selected' : '') + '>Almuerzo</option><option value="cena"' + (f.turno === 'cena' ? ' selected' : '') + '>Cena</option></select></div></div>'
        : '<div class="pz-f"><label>' + (f.servicio === 'caja' ? 'Franja de entrega' : 'Horario') + '</label><input data-k="horario" value="' + esc(f.horario) + '" placeholder="' + (f.servicio === 'caja' ? '15 a 17 h' : 'Desde las 9 h') + '"></div></div>') +
      '<div class="pz-f"><label>Dirección (opcional)</label><input data-k="dir" value="' + esc(f.dir) + '" placeholder="Barrio o dirección"></div>' +
      formAlt() +
      '<div class="pz-calc" id="pz-calc"></div>' +
      '<div class="pz-2"><div class="pz-f"><label>Total a mostrar (vacío = calculado)</label><input data-k="total" inputmode="numeric" value="' + esc(f.total) + '" placeholder="Ej.: 860000"></div>' +
      '<div class="pz-f"><label>Validez (días)</label><input type="number" min="1" max="60" data-k="validez" value="' + esc(f.validez) + '"></div></div>' +
      '<div class="pz-f"><label>Texto de presentación</label><textarea data-k="intro">' + esc(f.intro) + '</textarea></div>' +
      '<div class="pz-f"><label>Notas (alergias, horarios, pedidos)</label><textarea data-k="notas" placeholder="Opcional">' + esc(f.notas) + '</textarea></div>'; }
    root.querySelectorAll('[data-k]').forEach(function (el) {
      el.addEventListener('input', function () {
        var k = el.getAttribute('data-k');
        f[k] = el.type === 'checkbox' ? el.checked : el.value;
        if (k === 'total') f.totalRes = false;
        if (k === 'servicio') { f.total = ''; f.intro = INTRO[f.servicio] || f.intro; guardar(); form(); render(); return; }
        if (f.servicio !== 'exp' && /^(caja|cajaOp|spp|sjor|mjor|compras|envio|ingEst)$/.test(k)) { if (k === 'caja') f.cajaOp = 0; guardar(); form(); render(); return; }
        if (k === 'pasos' || (f.totalRes && /^(personas|fecha|turno)$/.test(k))) { f.total = ''; f.totalRes = false; if (k !== 'pasos') { var ti = $('[data-k=total]'); if (ti) ti.value = ''; } }
        if (k === 'pasos') { f.platos =PASOS[f.pasos].map(function () { return ''; }); f.platosB = f.platos.slice(); f.etiquetas = null; f.estilo = ''; form(); }
        guardar(); render();
      });
      if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date') el.addEventListener('change', function () { el.dispatchEvent(new Event('input')); });
    });
    root.querySelectorAll('[data-mi]').forEach(function (el) {
      el.addEventListener('change', function () { var k = el.getAttribute('data-mi'), a = (f.mitems || []).filter(function (x) { return x !== k; }); if (el.checked) a.push(k); f.mitems = a; guardar(); render(); });
    });
    root.querySelectorAll('[data-xd],[data-xm]').forEach(function (el) {
      el.addEventListener('input', function () { var i = +(el.getAttribute('data-xd') || el.getAttribute('data-xm')); f.extras[i][el.hasAttribute('data-xd') ? 'd' : 'm'] = el.value; guardar(); render(); });
    });
    if ($('#pz-xmas')) $('#pz-xmas').addEventListener('click', function () { f.extras.push({ d: '', m: '' }); guardar(); form(); render(); });
    listaGuardados();
    var mt = $('#pz-msg');
    mt.value = f.msgManual && f.msgTexto ? f.msgTexto : mensaje();
    mt.addEventListener('input', function () { f.msgManual = true; f.msgTexto = mt.value; guardar(); });
    $('#pz-regen').addEventListener('click', function () { f.msgManual = false; f.msgTexto = ''; mt.value = mensaje(); guardar(); });
    $('#pz-copiar').addEventListener('click', function () {
      var st = $('#pz-msg-st'), ok = function () { st.className = 'pz-msg ok'; st.textContent = '✓ Copiado. Pegalo en WhatsApp o en el mail, y adjuntá el PDF.'; };
      try { navigator.clipboard.writeText(mt.value).then(ok, function () { mt.select(); document.execCommand('copy'); ok(); }); } catch (e) { mt.select(); document.execCommand('copy'); ok(); }
    });
    $('#pz-wa').addEventListener('click', function () {
      var d = String(f.contacto || '').replace(/[^\d]/g, ''); if (d.startsWith('0')) d = d.slice(1); if (d && !d.startsWith('54')) d = '549' + d.replace(/^15/, '');
      window.open('https://wa.me/' + (d.length >= 10 ? d : '') + '?text=' + encodeURIComponent(mt.value), '_blank');
    });
    $('#pz-mail').addEventListener('click', function () {
      var em = (String(f.contacto || '').match(/[^\s,;]+@[^\s,;]+/) || [''])[0];
      location.href = 'mailto:' + em + '?subject=' + encodeURIComponent('Presupuesto Celestia · ' + tituloMsg() + ' · ' + nro) + '&body=' + encodeURIComponent(mt.value);
    });
    $('#pz-dup').addEventListener('click', function () { nro = numero(); f.nro = nro; f.reservaId = ''; guardar(); form(); render(); estadoGuardado('Copia nueva ' + nro + ' (sin reserva vinculada).', true); });
    $('#pz-marcar').addEventListener('click', function () { f.reservaId = ''; guardar(); marcarFecha(); });
    if ($('#pz-actualizar')) $('#pz-actualizar').addEventListener('click', marcarFecha);
    $('#pz-print').addEventListener('click', function () { render(); prepararImpresion(); setTimeout(function () { window.print(); }, 80); });
    $('#pz-nuevo').addEventListener('click', function () { if (!confirm('¿Empezar un presupuesto nuevo? Se borra el borrador actual.')) return; var sv = f.servicio; f = JSON.parse(JSON.stringify(DEF)); f.servicio = sv; f.intro = INTRO[sv] || f.intro; nro = numero(); f.nro = nro; try { localStorage.setItem(KEY, JSON.stringify(f)); } catch (e) {} form(); render(); });
    cargarReservas();
    if (f.servicio !== 'exp') return;
    root.querySelectorAll('[data-plato]').forEach(function (el) {
      el.addEventListener('input', function () { f.platos[+el.getAttribute('data-plato')] = el.value; guardar(); render(); });
    });
    root.querySelectorAll('[data-platob]').forEach(function (el) {
      el.addEventListener('input', function () { if (!f.platosB) f.platosB = []; f.platosB[+el.getAttribute('data-platob')] = el.value; guardar(); render(); });
    });
    $('#pz-opc').addEventListener('change', function () {
      f.opciones = this.value === '1' ? 1 : 2; f.modo = this.value === '2p' ? 'pasos' : 'menus';
      if (!f.platosB || f.platosB.length !== f.platos.length) f.platosB = f.platos.map(function (_, i) { return (f.platosB || [])[i] || ''; });
      guardar(); form(); render();
    });
    $('#pz-pega').addEventListener('input', function () { f.pegado = this.value; guardar(); });
    $('#pz-leer').addEventListener('click', function () {
      var msg = $('#pz-sug-msg'), r = parsear(f.pegado);
      msg.className = 'pz-msg ' + (r ? 'ok' : 'err');
      if (!r) { msg.textContent = resumen(r); return; }
      aplicar(r);
      if (f.reservaId) sugGuardar(f.reservaId, f.pegado);
      guardar(); form(); render();
      var m2 = $('#pz-sug-msg'); m2.className = 'pz-msg ok';
      m2.textContent = resumen(r) + (f.reservaId ? ' · guardado con la reserva' : '') + '. Podés retocar cada plato abajo.';
    });
    $('#pz-est').addEventListener('change', function () {
      var v = this.value; f.estilo = v; if (!v) { guardar(); return; }
      var a = v.split(':'), e = ESTILOS.filter(function (x) { return x.id === a[0]; })[0], m = e && e['m' + f.pasos][+a[1]];
      if (m) { f.platos = m.p.slice(); f.menuNombre = m.n; f.etiquetas = null; if (!f.platosB || f.platosB.length !== f.platos.length) f.platosB = f.platos.map(function () { return ''; }); }
      guardar(); form(); render();
    });
    $('#pz-subir').addEventListener('click', function () {
      if (!window.pzSubirMenu) { alert('No se pudo cargar el módulo de subida. Recargá la página.'); return; }
      var L = etq(), n = L.length, A = f.platos.slice(0, n), B = (f.platosB || []).slice(0, n);
      var ops = [{ letra: 'A', nombre: f.menuNombre || '', platos: A }];
      if (dos()) ops.push({ letra: 'B', nombre: f.modo === 'pasos' ? ((f.menuNombre || 'Menú') + ' · variante') : (f.menuNombreB || ''), platos: B.map(function (x, i) { return x || A[i] || ''; }) });
      ops = ops.filter(function (o) { return o.platos.some(function (x) { return String(x).trim(); }); });
      if (!ops.length) { alert('Primero cargá los platos del menú.'); return; }
      window.pzSubirMenu({ pasos: +f.pasos, etiquetas: f.etiquetas && f.etiquetas.length ? f.etiquetas.slice() : null, opciones: ops, ocasion: f.ocasion, cliente: f.cliente, reservaId: f.reservaId });
    });
  }
  var INTRO = {
    exp: DEF.intro,
    semanal: 'Gracias por pensar en Celestia. Te comparto la propuesta de chef semanal: cocino en tu casa y te dejo comida casera para varios días, refrigerada y congelada, con un menú pensado para vos.',
    mise: 'Gracias por pensar en Celestia. Te comparto la propuesta de mise en place: preparo en tu cocina todo lo que necesitás para cocinar la semana, cortado, porcionado y etiquetado.',
    caja: 'Gracias por pensar en Celestia. Te comparto la propuesta: una caja de chef elaborada artesanalmente, que llega lista para regenerar y servir.',
    libre: 'Gracias por pensar en Celestia. Te comparto la propuesta armada a medida para tu pedido.'
  };
  function guardar() { f.nro = nro; try { localStorage.setItem(KEY, JSON.stringify(f)); } catch (e) {} guardarBase(); }
  // ── Guardado en la base (tabla presupuestos): se guardan todos, para reabrirlos y editarlos desde cualquier dispositivo.
  var _gb = null;
  function totalActual() { try { if (f.servicio !== 'exp') return calcAlt().total; var c = calcular(f), m = String(f.total).replace(/\D/g, ''); return m ? +m : c.total; } catch (e) { return null; } }
  function estadoGuardado(t, ok) { var el = $('#pz-gd'); if (el) { el.textContent = t; el.style.color = ok === false ? '#ffb4a8' : (ok ? '#9fe0b0' : 'rgba(250,246,239,.6)'); } }
  function guardarBase(ya) {
    if (typeof supa === 'undefined') return;
    if (!(String(f.cliente || '').trim() || f.fecha || String(f.contacto || '').trim())) return;
    clearTimeout(_gb);
    var go = function () {
      estadoGuardado('Guardando…');
      var fila = { nro: nro, servicio: f.servicio || 'exp', cliente: f.cliente || null, contacto: f.contacto || null, fecha: f.fecha || null,
        total: totalActual(), reserva_id: f.reservaId || null, datos: f, updated_at: new Date().toISOString() };
      return supa.from('presupuestos').upsert(fila, { onConflict: 'nro' }).then(function (r) {
        if (r.error) { estadoGuardado('No se pudo guardar: ' + r.error.message, false); return; }
        estadoGuardado('✓ Guardado · ' + new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }), true);
      });
    };
    if (ya) return go();
    _gb = setTimeout(go, 1500);
  }
  function listaGuardados() {
    var sel = $('#pz-gs'); if (!sel || typeof supa === 'undefined') return;
    supa.from('presupuestos').select('id,nro,servicio,cliente,fecha,total,reserva_id,updated_at').order('updated_at', { ascending: false }).limit(80).then(function (r) {
      var rs = r.data || [];
      sel.innerHTML = '<option value="">— ' + (rs.length ? rs.length + ' guardados · elegir para abrir' : 'Todavía no hay presupuestos guardados') + ' —</option>' + rs.map(function (x) {
        return '<option value="' + esc(x.nro) + '"' + (x.nro === nro ? ' selected' : '') + '>' + esc((x.fecha ? x.fecha.slice(8, 10) + '/' + x.fecha.slice(5, 7) : 'sin fecha') + ' · ' + (x.cliente || 'Sin nombre') + ' · ' + (SERVICIOS[x.servicio] || x.servicio || '') + (x.total ? ' · ' + money(x.total) : '') + (x.reserva_id ? ' · 📌' : '')) + '</option>';
      }).join('');
      sel.onchange = function () {
        var v = this.value; if (!v) return;
        supa.from('presupuestos').select('nro,datos').eq('nro', v).single().then(function (q) {
          if (q.error || !q.data) { estadoGuardado('No se pudo abrir.', false); return; }
          f = Object.assign(JSON.parse(JSON.stringify(DEF)), q.data.datos || {}); nro = q.data.nro; f.nro = nro;
          try { localStorage.setItem(KEY, JSON.stringify(f)); } catch (e) {}
          form(); render(); estadoGuardado('Abierto ' + nro + '. Los cambios se guardan solos.', true);
        });
      };
    }).catch(function () {});
  }

  function cargarReservas(forzar) {
    var sel = $('#pz-res'); if (!sel) return;
    var lista = (!forzar && typeof todasReservas !== 'undefined' && todasReservas.length) ? Promise.resolve(todasReservas) :
      (typeof supa !== 'undefined' ? supa.from('reservas').select('id,ref,fecha,turno,personas,nombre,menu,total,estado').order('fecha', { ascending: true }).then(function (r) { return r.data || []; }) : Promise.resolve([]));
    lista.then(function (rs) {
      var hoy = new Date().toISOString().slice(0, 10);
      rs = rs.filter(function (r) { return r.fecha && r.fecha.slice(0, 10) >= hoy; }).sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
      var sug = sugLeer();
      sel.innerHTML = '<option value="">— Elegir reserva (opcional) —</option>' + rs.map(function (r) {
        return '<option value="' + esc(r.id) + '"' + (String(r.id) === String(f.reservaId) ? ' selected' : '') + '>' + esc((sug[r.id] ? '✦ ' : '') + r.fecha.slice(0, 10) + ' · ' + (r.turno || '') + ' · ' + (r.nombre || 'Sin nombre') + ' · ' + (r.personas || '?') + ' pers.' + (sug[r.id] ? ' · menú cargado' : '')) + '</option>';
      }).join('');
      sel.onchange = function () {
        var r = rs.filter(function (x) { return String(x.id) === this.value; }, this)[0];
        f.reservaId = r ? String(r.id) : '';
        if (!r) { guardar(); return; }
        f.cliente = r.nombre || f.cliente; f.fecha = r.fecha.slice(0, 10); f.turno = r.turno || f.turno; f.personas = r.personas || f.personas;
        if (f.servicio !== 'exp') { f.total = r.total ? String(r.total) : ''; guardar(); form(); render(); return; }
        var m = String(r.menu || '').toLowerCase(), np = m.indexOf('7') >= 0 ? 7 : (m.indexOf('3') >= 0 ? 3 : 0);
        if (np && +f.pasos !== np) { f.pasos = np; f.platos = PASOS[np].map(function () { return ''; }); f.platosB = f.platos.slice(); f.etiquetas = null; }
        f.total = r.total ? String(r.total) : ''; f.totalRes = !!r.total;
        var s = sugLeer()[r.id], aviso = '';
        if (s && s.texto) { var pr = parsear(s.texto); if (pr) { f.pegado = s.texto; var t0 = f.total, tr0 = f.totalRes; aplicar(pr); if (np) { f.pasos = np; f.total = t0; f.totalRes = tr0; } aviso = '✓ Menú sugerido de esta reserva cargado · ' + resumen(pr).replace(/^✓ /, ''); } }
        guardar(); form(); render();
        if (aviso) { var mm = $('#pz-sug-msg'); if (mm) { mm.className = 'pz-msg ok'; mm.textContent = aviso; } }
      };
    }).catch(function () {});
  }

  // ── Hojas
  function render() {
    var doc = $('#pz-doc'); if (!doc) return;
    if (f.servicio !== 'exp') return renderAlt(doc);
    var c = calcular(f), total = (String(f.total).replace(/\D/g, '') ? +String(f.total).replace(/\D/g, '') : c.total);
    var pasos = PASOS[f.pasos], fmt = f.pasos + ' pasos', turnoTxt = f.turno === 'cena' ? 'Cena · 20:00 a 23:30' : 'Almuerzo · 12:00 a 15:30';
    var calc = $('#pz-calc');
    if (calc) calc.innerHTML = 'Tarifa del sitio · ' + c.personas + ' pers. · ' + (c.finde ? 'finde (+10% servicio)' : 'semana') +
      '<br>Servicio ' + money(c.servicio) + ' · Asistentes ' + money(c.asist) + ' · Ingredientes ' + money(c.ingredientes) + '<br><b>Total ' + money(c.total) + '</b>' +
      (String(f.total).replace(/\D/g, '') ? ' · se muestra ' + money(total) : '');
    var L = etq(), D = dos(), PP = D && f.modo === 'pasos', B = f.platosB || [];
    var nomA = f.menuNombre || 'Opción A', nomB = f.menuNombreB || 'Opción B';
    var lista = function (arr) { return L.map(function (p, i) { return '<div><span>' + esc(p) + '</span><b>' + esc(arr[i] || '—') + '</b></div>'; }).join(''); };
    var platosHTML = PP ? L.map(function (p, i) {
      return '<div><span>' + esc(p) + '</span><b>' + esc(f.platos[i] || '—') + (B[i] ? '<i class="o">o</i>' + esc(B[i]) : '') + '</b></div>';
    }).join('') : lista(f.platos);
    var menuHTML = (D && !PP) ?
      '<div class="pz-ops"><div class="pz-op"><h4><small>Opción A</small>' + esc(nomA) + '</h4><div class="pz-menu">' + lista(f.platos) + '</div></div>' +
      '<div class="pz-op"><h4><small>Opción B</small>' + esc(nomB) + '</h4><div class="pz-menu">' + lista(B) + '</div></div></div>' :
      '<div class="pz-menu">' + platosHTML + '</div>';
    var tituloMenu = (D && !PP) ? 'Dos opciones de ' + fmt : (f.menuNombre || ('Menú de ' + fmt));
    var manual = !!String(f.total).replace(/\D/g, '') && total !== c.total;
    var inv = (f.desglose && !manual ?
      '<div><span>Servicio del chef' + (c.finde ? ' (incluye 10% fin de semana)' : '') + '</span><span>' + money(c.servicio) + '</span></div>' +
      '<div><span>' + (c.asistentes ? c.asistentes + ' asistente' + (c.asistentes > 1 ? 's' : '') + ' de servicio' : 'Asistentes de servicio') + '</span><span>' + money(c.asist) + '</span></div>' +
      '<div><span>Ingredientes (estimado)</span><span>' + money(c.ingredientes) + '</span></div>' : '') +
      '<div class="t"><span>Total · ' + c.personas + ' personas<small>Servicio, asistentes e ingredientes · No incluye IVA</small></span><b>' + money(total) + '</b></div>';
    var p1 =
      '<section class="pz-page' + ((L.length > 3 || f.notas || D) ? ' cmp' : '') + '">' +
      '<header class="pz-hd"><div class="pz-brand"><div class="pz-logo"><b>CELESTIA</b><small>CHEF PRIVADO</small></div>' +
      '<div class="pz-nro">Propuesta <b>' + esc(nro) + '</b><br>' + esc(hoyLargo()) + '<br>Válida hasta el ' + esc(vence()) + '</div></div>' +
      '<div class="pz-tit">Propuesta gastronómica<br><em>' + esc(tituloMenu) + '</em></div></header>' +
      '<div class="pz-bd"><div class="pz-bd-in">' +
      '<div class="pz-meta"><div><span>Para</span><b>' + esc(f.cliente || '—') + '</b></div><div><span>Ocasión</span><b>' + esc(f.ocasion || '—') + '</b></div><div><span>Contacto</span><b>' + esc(f.contacto || '—') + '</b></div>' +
      '<div><span>Fecha</span><b>' + esc(fechaLarga(f.fecha)) + '</b></div><div><span>Turno</span><b>' + esc(turnoTxt) + '</b></div><div><span>Formato</span><b>' + esc(fmt + ' · ' + c.personas + ' personas') + '</b></div></div>' +
      '<p class="pz-intro">' + esc(f.intro) + '</p>' +
      '<div class="pz-h2">' + (D ? (PP ? 'El menú · dos opciones en cada paso' : 'Los menús · elegí una opción') : 'El menú') + '</div>' + menuHTML +
      (D ? '<p class="pz-fine" style="margin-top:2mm">' + (PP ? 'Se elige una opción por paso, la misma para toda la mesa, hasta 15 días antes.' : 'Las dos opciones tienen el mismo valor. Se confirma una hasta 15 días antes del evento.') + '</p>' : '') +
      (f.notas ? '<p class="pz-fine" style="margin-top:3mm"><b>Notas:</b> ' + esc(f.notas) + '</p>' : '') +
      '<div class="pz-row"><div><div class="pz-h2">Inversión</div><div class="pz-inv">' + inv + '</div>' +
      '<p class="pz-pago"><b>Forma de pago:</b> seña del 50% para confirmar la fecha y saldo al inicio del servicio, por transferencia o MercadoPago. ' + esc(f.bebidas) + '</p></div>' +
      '<div><div class="pz-h2">Incluye</div><ul class="pz-lst"><li>Diseño del menú y compra de ingredientes</li><li>Preproducción y terminación en tu cocina</li><li>' + (c.asistentes ? c.asistentes + ' asistente' + (c.asistentes > 1 ? 's' : '') : 'Asistencia') + ' y servicio en mesa</li><li>Cocina limpia al terminar</li></ul>' +
      '<div class="pz-h2" style="margin-top:4mm">No incluye</div><ul class="pz-lst no"><li>IVA (los precios son sin IVA)</li><li>Bebidas</li><li>Vajilla, cristalería y mantelería (podemos cotizar alquiler)</li><li>Mobiliario y decoración</li></ul></div></div>' +
      '<div class="pz-h2">Condiciones</div>' +
      '<div class="pz-row"><table class="pz-can"><tr><td>Cancelación con más de 15 días</td><td>50%</td></tr><tr><td>Entre 15 y 10 días</td><td>60%</td></tr><tr><td>Entre 10 días y 72 horas</td><td>80%</td></tr><tr><td>Menos de 72 horas o el mismo día</td><td>100%</td></tr></table>' +
      '<p class="pz-fine" style="margin:0">La seña no es reembolsable y se toma a cuenta. La cantidad de invitados se confirma 10 días antes y el menú puede ajustarse hasta 15 días antes. Por fuerza mayor se reprograma de común acuerdo (valores actualizados por IPC). Alergias y restricciones: informarlas antes del evento. Si la cena es al aire libre, prever una alternativa techada. Términos completos en chefprivado.ar/terminos.</p></div>' +
      '</div></div>' +
      '<footer class="pz-ft"><div class="pz-firma"><b>Daro Castello</b>Chef · Celestia Chef Privado</div><div style="text-align:right">chefprivado.ar · +54 9 11 6041-0607<br>CABA y Gran Buenos Aires</div></footer>' +
      '</section>';
    var n = L.length, gap = n > 3 ? (PP ? '3.6mm' : '5mm') : (PP ? '8mm' : '11mm'), fs = n > 3 ? (PP ? '11pt' : '12.5pt') : (PP ? '13.5pt' : '16pt');
    var fechaC = f.fecha ? new Date(f.fecha + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    var carta = function (cuerpo, nombre, etiqueta) {
      return '<section class="pz-page pz-carta"><div class="pz-marco"><div class="pz-in">' +
        '<span class="ks">✦ Menú ✦</span><div class="wm">CELESTIA</div>' +
        '<div class="oc">' + esc(f.ocasion || nombre || 'Una noche especial') + '</div>' +
        '<div class="fe">' + esc(fechaC) + (nombre && f.ocasion ? ' · ' + esc(nombre) : '') + '</div>' +
        (etiqueta ? '<div class="opn">' + esc(etiqueta) + '</div>' : '') +
        '<div class="pz-orn">✦ ✦ ✦</div>' +
        '<div class="pz-cur" style="--gap:' + gap + ';--fs:' + fs + '">' + cuerpo + '</div>' +
        '<div class="pz-orn" style="margin:6mm 0 2mm">✦</div>' +
        '<div class="pie"><b>Daro Castello</b>Chef privado · Buenos Aires</div>' +
        '</div></div></section>';
    };
    var p2 = (D && !PP) ? carta(lista(f.platos), f.menuNombre, 'Opción A') + carta(lista(B), f.menuNombreB, 'Opción B') :
      carta(platosHTML, f.menuNombre, PP ? 'Una opción por paso' : '');
    doc.innerHTML = p1 + p2;
    refrescarMensaje();
    ajustar(doc);
    escalar();
    reajustar(doc);
  }
  function prepararImpresion() {
    var r = document.getElementById('pz-print-root');
    if (!r) { r = document.createElement('div'); r.id = 'pz-print-root'; document.body.appendChild(r); }
    r.innerHTML = $('#pz-doc').innerHTML;
    r.style.cssText = 'display:block;position:absolute;left:-20000px;top:0;width:210mm';
    ajustar(r);
    r.style.cssText = '';
    document.documentElement.classList.add('pz-printing');
    var t = (f.cliente || 'Celestia') + ' - Propuesta ' + nro;
    if (!prepararImpresion._t) prepararImpresion._t = document.title;
    document.title = t;
  }
  function limpiarImpresion() {
    document.documentElement.classList.remove('pz-printing');
    if (prepararImpresion._t) { document.title = prepararImpresion._t; prepararImpresion._t = null; }
  }
  addEventListener('beforeprint', function () { var sec = $('#seccion-presupuestos'); if (sec && sec.style.display !== 'none') prepararImpresion(); });
  addEventListener('afterprint', limpiarImpresion);
  try {
    var mqp = window.matchMedia('print');
    var alImprimir = function (e) { if (e.matches && document.documentElement.classList.contains('pz-printing')) { var r = document.getElementById('pz-print-root'); if (r) ajustar(r); } };
    if (mqp.addEventListener) mqp.addEventListener('change', alImprimir); else if (mqp.addListener) mqp.addListener(alImprimir);
  } catch (e) {}
  // Si la hoja 1 no entra en A4, achica el cuerpo de forma proporcional (hasta 70%).
  function ajustar(doc) {
    var bd = doc.querySelector('.pz-bd'), inn = doc.querySelector('.pz-bd-in'); if (!bd || !inn) return;
    var set = function (z) { inn.style.transform = z < 1 ? 'scale(' + z + ')' : ''; inn.style.width = z < 1 ? (100 / z) + '%' : ''; };
    var z = 1; set(1);
    while (inn.getBoundingClientRect().bottom > bd.getBoundingClientRect().bottom - 6 && z > 0.6) { z = Math.round((z - 0.02) * 100) / 100; set(z); }
  }
  // Las tipografías pueden terminar de cargar después del primer cálculo: se vuelve a ajustar para que no se corte el texto.
  function reajustar(doc) { setTimeout(function () { ajustar(doc); escalar(); }, 250); try { document.fonts.ready.then(function () { ajustar(doc); escalar(); }); } catch (e) {} }
  function escalar() {
    var prev = $('#pz-prev'), doc = $('#pz-doc'); if (!prev || !doc) return;
    var w = prev.clientWidth, a4 = 210 * 96 / 25.4, s = Math.min(1, (w - 8) / a4);
    doc.style.transform = 'scale(' + s + ')'; doc.style.transformOrigin = 'top center';
    prev.style.height = (doc.scrollHeight * s + 10) + 'px';
  }

  function iniciar() {
    if (!$('#seccion-presupuestos')) return;
    var L0 = (f.etiquetas && f.etiquetas.length) ? f.etiquetas : PASOS[f.pasos];
    if (!f.platos || f.platos.length !== L0.length) f.platos = L0.map(function (_, i) { return (f.platos || [])[i] || ''; });
    if (!f.platosB || f.platosB.length !== L0.length) f.platosB = L0.map(function (_, i) { return (f.platosB || [])[i] || ''; });
    form(); render();
    try {
      if (typeof supa !== 'undefined') supa.from('canasta_indice').select('indice').order('fecha', { ascending: false }).limit(1).then(function (r) {
        var x = r && r.data && r.data[0] && +r.data[0].indice; if (x > 0.5 && x < 3) { IDX = x; render(); }
      });
    } catch (e) {}
  }
  window.cargarPresupuestos = function () { if (!$('#pz-form').childElementCount) iniciar(); else { render(); } };
  addEventListener('resize', function () { if ($('#seccion-presupuestos') && $('#seccion-presupuestos').style.display !== 'none') escalar(); });
})();
