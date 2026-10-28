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
    notas: '', bebidas: 'Bebidas a cargo del anfitrión; sugerimos maridaje para cada paso.'
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

  function numero() { var d = new Date(); var p = function (n) { return String(n).padStart(2, '0'); }; return 'CEL-' + String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()); }
  var nro = numero();
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
      '<h3>Presupuesto formal</h3><p class="pz-ay">Hoja A4 con la propuesta y la carta del menú. Se exporta a PDF desde «Imprimir».</p>' +
      '<div class="pz-f"><label>Cargar desde una reserva</label><select id="pz-res"><option value="">— Elegir reserva (opcional) —</option></select></div>' +
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
      '<div class="pz-f"><label>Notas (alergias, horarios, pedidos)</label><textarea data-k="notas" placeholder="Opcional">' + esc(f.notas) + '</textarea></div>' +
      '<div class="pz-acc"><button type="button" class="pri" id="pz-print">🖨️ Imprimir / Guardar PDF</button><button type="button" id="pz-nuevo">Nuevo</button></div>' +
      '<div class="pz-acc"><button type="button" id="pz-subir">⬆ Subir menú al sitio e ingredientes</button></div>';
    root.querySelectorAll('[data-k]').forEach(function (el) {
      el.addEventListener('input', function () {
        var k = el.getAttribute('data-k');
        f[k] = el.type === 'checkbox' ? el.checked : el.value;
        if (k === 'total') f.totalRes = false;
        if (k === 'pasos' || (f.totalRes && /^(personas|fecha|turno)$/.test(k))) { f.total = ''; f.totalRes = false; if (k !== 'pasos') { var ti = $('[data-k=total]'); if (ti) ti.value = ''; } }
        if (k === 'pasos') { f.platos =PASOS[f.pasos].map(function () { return ''; }); f.platosB = f.platos.slice(); f.etiquetas = null; f.estilo = ''; form(); }
        guardar(); render();
      });
      if (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'date') el.addEventListener('change', function () { el.dispatchEvent(new Event('input')); });
    });
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
    $('#pz-print').addEventListener('click', function () { render(); prepararImpresion(); setTimeout(function () { window.print(); }, 80); });
    $('#pz-nuevo').addEventListener('click', function () { if (!confirm('¿Empezar un presupuesto nuevo? Se borra el borrador actual.')) return; f = JSON.parse(JSON.stringify(DEF)); nro = numero(); guardar(); form(); render(); });
    cargarReservas();
  }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(f)); } catch (e) {} }

  function cargarReservas() {
    var sel = $('#pz-res'); if (!sel) return;
    var lista = (typeof todasReservas !== 'undefined' && todasReservas.length) ? Promise.resolve(todasReservas) :
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
    ajustar(doc);
    escalar();
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
    while (inn.getBoundingClientRect().height > bd.getBoundingClientRect().height - 1 && z > 0.7) { z = Math.round((z - 0.02) * 100) / 100; set(z); }
  }
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
