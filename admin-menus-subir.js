/* Celestia · Admin · Subir un menú de presupuesto al sitio y a ingredientes.
   1) Detecta los ingredientes de cada plato (IA vía /api/chat) y cuáles ya tienen seguimiento de precio.
   2) Los nuevos se buscan en Jumbo y Carrefour (/api/canasta-buscar) para elegir el producto y ver su precio.
   3) Al guardar: el menú va a la tabla menus_sitio (publicado = aparece en «Menús de ejemplo» del sitio)
      y los ingredientes elegidos se suman a canasta_productos (el cron de los lunes toma su precio). */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var money = function (n) { return '$' + Math.round(Number(n) || 0).toLocaleString('es-AR'); };
  var norm = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim(); };
  var slug = function (s) { return norm(s).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 40); };
  var ESTILOS = window.CELESTIA_ESTILOS || [];
  var PASOS = window.CELESTIA_PASOS || { 3: ['Entrada', 'Principal', 'Postre'], 7: ['Bienvenida', 'Entrada fría', 'Entrada caliente', 'Intermedio', 'Principal', 'Pre-postre', 'Postre'] };
  var SUBIDOS = 'cel_menus_subidos';
  var SUPN = { jumbo: 'Jumbo', carrefour: 'Carrefour' };
  function db() { return typeof supa !== 'undefined' ? supa : null; }

  var css = document.createElement('style');
  css.textContent = [
    '.mu-ov{position:fixed;inset:0;z-index:99990;background:rgba(5,10,16,.72);display:flex;align-items:flex-start;justify-content:center;padding:24px 14px;overflow:auto;font-family:"DM Sans",sans-serif}',
    '.mu-d{width:min(1040px,100%);background:linear-gradient(180deg,#13263a,#0f1f30);border:1px solid rgba(232,201,107,.4);border-radius:18px;color:#FAF6EF;box-shadow:0 30px 80px rgba(0,0,0,.5);color-scheme:dark}',
    '.mu-hd{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px 12px;border-bottom:1px solid rgba(232,201,107,.18)}',
    '.mu-hd h3{margin:0;font:400 22px "DM Serif Display",serif;color:#E8C96B}.mu-hd p{margin:3px 0 0;font-size:12.5px;color:rgba(250,246,239,.7)}',
    '.mu-x{width:38px;height:38px;border-radius:50%;border:1px solid rgba(250,246,239,.25);background:transparent;color:#FAF6EF;font-size:15px;cursor:pointer;flex:none}',
    '.mu-bd{padding:16px 22px}',
    '.mu-h{font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#E8C96B;margin:6px 0 10px}',
    '.mu-ops{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin-bottom:18px}',
    '.mu-op{border:1px solid rgba(232,201,107,.3);border-radius:14px;padding:12px;background:rgba(10,22,34,.6)}',
    '.mu-op label.ck{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;margin-bottom:8px;cursor:pointer}',
    '.mu-op input[type=checkbox],.mu-t input[type=checkbox]{width:17px;height:17px;accent-color:#E8C96B}',
    '.mu-in,.mu-sel{width:100%;box-sizing:border-box;background:#0a1622;border:1px solid rgba(232,201,107,.3);border-radius:9px;color:#FAF6EF;font:inherit;font-size:13px;padding:8px 10px;margin-bottom:6px}',
    '.mu-sel option{background:#0D1B2A}',
    '.mu-op ol{margin:6px 0 0;padding-left:18px;font-size:12.5px;line-height:1.5;color:rgba(250,246,239,.85)}.mu-op ol span{color:#a08a5c;font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;margin-right:6px}',
    '.mu-st{font-size:12.5px;color:rgba(250,246,239,.8);margin-bottom:10px}',
    '.mu-tw{overflow:auto;border:1px solid rgba(232,201,107,.2);border-radius:12px}',
    '.mu-t{width:100%;border-collapse:collapse;font-size:12.5px;min-width:760px}',
    '.mu-t th{text-align:left;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#E8C96B;padding:9px 10px;background:rgba(232,201,107,.08);position:sticky;top:0}',
    '.mu-t td{padding:8px 10px;border-top:1px solid rgba(250,246,239,.07);vertical-align:top}',
    '.mu-t td b{font-weight:600}.mu-t .mut{color:rgba(250,246,239,.55);font-size:11.5px}',
    '.mu-t .mu-sel{margin:0;font-size:12px;padding:6px 8px;max-width:270px}',
    '.mu-tag{display:inline-block;font-size:10.5px;font-weight:700;border-radius:999px;padding:2px 8px;margin-left:6px;white-space:nowrap}',
    '.mu-tag.ok{background:rgba(120,200,140,.16);color:#9fe0b0}.mu-tag.nv{background:rgba(232,201,107,.16);color:#E8C96B}',
    '.mu-q{display:flex;gap:6px;margin-top:5px}.mu-q input{flex:1;min-width:0;margin:0;font-size:11.5px;padding:5px 8px}.mu-q button{font-size:11.5px;padding:5px 9px;border-radius:8px;border:1px solid rgba(232,201,107,.4);background:transparent;color:#FAF6EF;cursor:pointer}',
    '.mu-ft{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:14px 22px 18px;border-top:1px solid rgba(232,201,107,.18)}',
    '.mu-ft .mu-tot{font-size:12.5px;color:rgba(250,246,239,.8)}.mu-ft .mu-tot b{color:#E8C96B;font-size:15px}',
    '.mu-bt{border-radius:999px;padding:11px 18px;font:600 13px "DM Sans",sans-serif;cursor:pointer;border:1px solid rgba(232,201,107,.6);background:transparent;color:#FAF6EF}',
    '.mu-bt.pri{background:linear-gradient(135deg,#C9A84C,#E8C96B);color:#0D1B2A;border:0}.mu-bt:disabled{opacity:.5;cursor:default}',
    '.mu-load{display:flex;align-items:center;gap:10px;padding:18px 4px;font-size:13px;color:rgba(250,246,239,.8)}',
    '.mu-load i{width:16px;height:16px;border-radius:50%;border:2px solid rgba(232,201,107,.3);border-top-color:#E8C96B;animation:muR .8s linear infinite}',
    '@keyframes muR{to{transform:rotate(360deg)}}',
    '.mu-msg{font-size:13px;line-height:1.5;padding:12px 14px;border-radius:12px;margin-top:12px}.mu-msg.ok{background:rgba(120,200,140,.12);color:#c8f0d2}.mu-msg.err{background:rgba(255,120,100,.12);color:#ffc4b8}',
    '.mu-bt:focus-visible,.mu-x:focus-visible{outline:3px solid #E8C96B;outline-offset:2px}'
  ].join('\n');
  document.head.appendChild(css);

  var st = null; // estado del modal

  function huella(d) { return norm(d.opciones.map(function (o) { return o.platos.join('|'); }).join('||')); }
  function subidos() { try { return JSON.parse(localStorage.getItem(SUBIDOS) || '{}') || {}; } catch (e) { return {}; } }
  function marcarSubido(h) { var s = subidos(); s[h] = Date.now(); try { localStorage.setItem(SUBIDOS, JSON.stringify(s)); } catch (e) {} }

  function etiquetas(d, n) { return (d.etiquetas && d.etiquetas.length) ? d.etiquetas : (PASOS[d.pasos] || []).slice(0, n); }

  // ── Datos de la canasta (productos con seguimiento y su último precio)
  function cargarCanasta() {
    var s = db(); if (!s) return Promise.resolve({ prods: [], precios: {} });
    return Promise.all([
      s.from('canasta_productos').select('clave,nombre,super,sku,activo'),
      s.from('canasta_precios').select('clave,super,precio,fecha,nombre').order('fecha', { ascending: false }).limit(1500)
    ]).then(function (r) {
      var prods = (r[0].data || []).filter(function (p) { return p.activo !== false; }), precios = {};
      (r[1].data || []).forEach(function (x) { var k = x.clave + ':' + x.super; if (!precios[k]) precios[k] = x; });
      return { prods: prods, precios: precios };
    });
  }

  // ── IA: ingredientes por plato
  function analizar(d, prods) {
    var claves = {}; prods.forEach(function (p) { claves[p.clave] = p.nombre; });
    var lista = Object.keys(claves).map(function (k) { return k + ': ' + claves[k]; }).join('\n');
    var menu = d.opciones.map(function (o) {
      var L = etiquetas(d, o.platos.length);
      return 'Opción ' + o.letra + (o.nombre ? ' «' + o.nombre + '»' : '') + '\n' + o.platos.map(function (p, i) { return o.letra + (i + 1) + '. ' + (L[i] ? L[i] + ': ' : '') + p; }).join('\n');
    }).join('\n\n');
    var prompt = 'Sos chef profesional en Buenos Aires. Para el menú de abajo, listá los ingredientes que hay que comprar en el supermercado para cocinarlo (sin agua; sal, pimienta y aceite solo si son protagonistas del plato). No repitas ingredientes.\n\n' +
      'Para cada ingrediente devolvé:\n- "nombre": nombre comercial simple (ej. "Queso brie", "Langostinos", "Crema de leche")\n' +
      '- "clave": la clave de la lista de ingredientes con seguimiento cuando sea el mismo producto, si no null\n' +
      '- "buscar": 1 a 3 palabras para buscarlo en Jumbo o Carrefour\n- "platos": códigos de los platos donde se usa (ej. ["A1","B2"])\n\n' +
      'Además, "estilos": para cada opción, el id que mejor la describe entre: ' + ESTILOS.map(function (e) { return e.id; }).join(', ') + '.\n\n' +
      'Ingredientes con seguimiento (clave: nombre):\n' + lista + '\n\nMenú:\n' + menu + '\n\n' +
      'Respondé SOLO con JSON válido, sin markdown: {"estilos":{"A":"italiana"},"ingredientes":[{"nombre":"","clave":null,"buscar":"","platos":["A1"]}]}';
    return fetch('/api/chat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'claude-sonnet-5-5', max_tokens: 3000, messages: [{ role: 'user', content: prompt }] })
    }).then(function (r) { if (!r.ok) throw new Error('IA ' + r.status); return r.json(); }).then(function (data) {
      var t = (data.content && data.content[0] && data.content[0].text) || '';
      t = t.replace(/```json\s*/g, '').replace(/```/g, '').replace(/[“”]/g, '"');
      var m = t.match(/\{[\s\S]*\}/); if (!m) throw new Error('Sin JSON');
      var j = JSON.parse(m[0]);
      var vistos = {};
      j.ingredientes = (j.ingredientes || []).filter(function (x) {
        var k = norm(x.nombre); if (!k || vistos[k]) return false; vistos[k] = 1;
        if (x.clave && !claves[x.clave]) x.clave = null;
        x.platos = Array.isArray(x.platos) ? x.platos : []; return true;
      });
      return j;
    });
  }

  function buscarSuper(q) {
    return fetch('/api/canasta-buscar?q=' + encodeURIComponent(q)).then(function (r) { return r.ok ? r.json() : { jumbo: [], carrefour: [] }; }).catch(function () { return { jumbo: [], carrefour: [] }; });
  }
  function enCola(tareas, n) {
    var i = 0; function sig() { if (i >= tareas.length) return Promise.resolve(); var t = tareas[i++]; return t().then(sig, sig); }
    var hilos = []; for (var k = 0; k < n; k++) hilos.push(sig()); return Promise.all(hilos);
  }

  // ── Modal
  function abrirModal(d) {
    cerrar();
    var ov = document.createElement('div'); ov.className = 'mu-ov'; ov.id = 'mu-ov';
    ov.innerHTML = '<div class="mu-d" role="dialog" aria-modal="true" aria-labelledby="mu-t"><div class="mu-hd"><div><h3 id="mu-t">Subir menú al sitio e ingredientes</h3>' +
      '<p>' + esc([d.cliente, d.ocasion].filter(Boolean).join(' · ') || 'Menú del presupuesto') + ' · ' + d.pasos + ' pasos' + (subidos()[huella(d)] ? ' · <b style="color:#E8C96B">ya lo subiste antes</b>' : '') + '</p></div>' +
      '<button type="button" class="mu-x" aria-label="Cerrar">✕</button></div><div class="mu-bd" id="mu-bd"></div><div class="mu-ft" id="mu-ft"></div></div>';
    document.body.appendChild(ov);
    ov.querySelector('.mu-x').addEventListener('click', cerrar);
    ov.addEventListener('click', function (e) { if (e.target === ov) cerrar(); });
    document.addEventListener('keydown', esc_);
    ov.querySelector('.mu-x').focus();
  }
  function esc_(e) { if (e.key === 'Escape') cerrar(); }
  function cerrar() { var o = $('#mu-ov'); if (o) o.remove(); document.removeEventListener('keydown', esc_); }

  function renderMenus() {
    var d = st.d;
    return '<div class="mu-h">Menús para el sitio</div><div class="mu-ops">' + d.opciones.map(function (o, k) {
      var L = etiquetas(d, o.platos.length), est = st.estilos[o.letra] || '';
      return '<div class="mu-op"><label class="ck"><input type="checkbox" data-pub="' + k + '"' + (o.publicar !== false ? ' checked' : '') + '> Publicar en «Menús de ejemplo» · opción ' + o.letra + '</label>' +
        '<input class="mu-in" data-nom="' + k + '" value="' + esc(o.nombre) + '" placeholder="Nombre del menú (se ve en el sitio)">' +
        '<select class="mu-sel" data-est="' + k + '">' + ESTILOS.map(function (e) { return '<option value="' + esc(e.id) + '"' + (e.id === est ? ' selected' : '') + '>' + esc(e.emoji + ' ' + e.nombre) + '</option>'; }).join('') + '</select>' +
        '<ol>' + o.platos.map(function (p, i) { return '<li><span>' + esc(L[i] || '') + '</span>' + esc(p) + '</li>'; }).join('') + '</ol></div>';
    }).join('') + '</div>';
  }
  function opcionesSuper(it, sup) {
    var r = (it.res && it.res[sup]) || [], sel = it.pick ? it.pick[sup] : '';
    if (!it.res) return '<span class="mut">Buscando…</span>';
    if (!r.length) return '<span class="mut">Sin resultados</span>';
    return '<select class="mu-sel" data-pick="' + it.i + ':' + sup + '"><option value="">— No seguir en ' + SUPN[sup] + ' —</option>' + r.map(function (x) {
      return '<option value="' + esc(x.sku) + '"' + (x.sku === sel ? ' selected' : '') + '>' + esc(x.nombre.slice(0, 48) + ' — ' + money(x.precio)) + '</option>';
    }).join('') + '</select>';
  }
  function precioCanasta(clave) {
    var out = [];
    ['jumbo', 'carrefour'].forEach(function (s) { var p = st.precios[clave + ':' + s]; if (p) out.push(SUPN[s] + ' <b>' + money(p.precio) + '</b>'); });
    return out.length ? out.join(' · ') : '<span class="mut">Sin precio todavía</span>';
  }
  function renderIngs() {
    var ings = st.ings, nOk = ings.filter(function (x) { return x.clave; }).length;
    return '<div class="mu-h">Ingredientes</div><div class="mu-st">' + ings.length + ' ingredientes · ' + nOk + ' ya tienen seguimiento de precio · ' + (ings.length - nOk) + ' nuevos. ' +
      'Para los nuevos elegí el producto de cada súper: se suma al relevamiento de precios de los lunes.</div>' +
      '<div class="mu-tw"><table class="mu-t"><thead><tr><th>Ingrediente</th><th>Platos</th><th>Jumbo</th><th>Carrefour</th><th>Seguir precio</th></tr></thead><tbody>' +
      ings.map(function (it) {
        if (it.clave) return '<tr><td><b>' + esc(it.nombre) + '</b><span class="mu-tag ok">📈 con seguimiento</span><div class="mut">' + esc(st.nomClave[it.clave] || it.clave) + '</div></td><td class="mut">' + esc(it.platos.join(' · ')) + '</td><td colspan="2">' + precioCanasta(it.clave) + '</td><td class="mut">✓ ya está</td></tr>';
        return '<tr><td><b>' + esc(it.nombre) + '</b><span class="mu-tag nv">✦ nuevo</span><div class="mu-q"><input class="mu-in" data-q="' + it.i + '" value="' + esc(it.buscar || it.nombre) + '" aria-label="Buscar en el súper"><button type="button" data-bq="' + it.i + '">Buscar</button></div></td>' +
          '<td class="mut">' + esc(it.platos.join(' · ')) + '</td><td>' + opcionesSuper(it, 'jumbo') + '</td><td>' + opcionesSuper(it, 'carrefour') + '</td>' +
          '<td><input type="checkbox" data-seg="' + it.i + '"' + (it.seguir ? ' checked' : '') + ' aria-label="Seguir precio de ' + esc(it.nombre) + '"></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  function costoRef() {
    var t = 0, n = 0;
    st.ings.forEach(function (it) {
      var ps = [];
      if (it.clave) ['jumbo', 'carrefour'].forEach(function (s) { var p = st.precios[it.clave + ':' + s]; if (p) ps.push(+p.precio); });
      else ['jumbo', 'carrefour'].forEach(function (s) { var sku = it.pick && it.pick[s], x = sku && (it.res[s] || []).filter(function (y) { return y.sku === sku; })[0]; if (x) ps.push(x.precio); });
      if (ps.length) { t += Math.min.apply(null, ps); n++; }
    });
    return { total: t, n: n };
  }
  function render() {
    var bd = $('#mu-bd'), ft = $('#mu-ft'); if (!bd) return;
    if (st.cargando) { bd.innerHTML = renderMenus() + '<div class="mu-load"><i></i>' + esc(st.cargando) + '</div>'; ft.innerHTML = ''; wire(); return; }
    bd.innerHTML = renderMenus() + (st.error ? '<div class="mu-msg err">' + esc(st.error) + '</div>' : renderIngs()) + (st.msg ? '<div class="mu-msg ' + st.msg[0] + '">' + st.msg[1] + '</div>' : '');
    var c = costoRef();
    ft.innerHTML = '<div class="mu-tot">' + (c.n ? 'Referencia: 1 envase de cada uno de ' + c.n + ' ingredientes, al precio más bajo · <b>' + money(c.total) + '</b>' : '') + '</div>' +
      '<div style="display:flex;gap:8px"><button type="button" class="mu-bt" id="mu-can">' + (st.hecho ? 'Cerrar' : 'Cancelar') + '</button>' +
      (st.hecho ? '' : '<button type="button" class="mu-bt pri" id="mu-ok"' + (st.guardando ? ' disabled' : '') + '>' + (st.guardando ? 'Guardando…' : '⬆ Guardar y subir') + '</button>') + '</div>';
    wire();
  }
  function wire() {
    var bd = $('#mu-bd'); if (!bd) return;
    bd.querySelectorAll('[data-pub]').forEach(function (el) { el.onchange = function () { st.d.opciones[+el.dataset.pub].publicar = el.checked; }; });
    bd.querySelectorAll('[data-nom]').forEach(function (el) { el.oninput = function () { st.d.opciones[+el.dataset.nom].nombre = el.value; }; });
    bd.querySelectorAll('[data-est]').forEach(function (el) { el.onchange = function () { st.estilos[st.d.opciones[+el.dataset.est].letra] = el.value; }; });
    bd.querySelectorAll('[data-pick]').forEach(function (el) { el.onchange = function () { var a = el.dataset.pick.split(':'), it = st.ings[+a[0]]; it.pick[a[1]] = el.value; it.seguir = !!(it.pick.jumbo || it.pick.carrefour); render(); }; });
    bd.querySelectorAll('[data-seg]').forEach(function (el) { el.onchange = function () { st.ings[+el.dataset.seg].seguir = el.checked; }; });
    bd.querySelectorAll('[data-bq]').forEach(function (el) {
      el.onclick = function () {
        var it = st.ings[+el.dataset.bq], q = bd.querySelector('[data-q="' + it.i + '"]').value.trim(); if (q.length < 2) return;
        it.buscar = q; it.res = null; render(); buscarIng(it).then(render);
      };
    });
    var can = $('#mu-can'); if (can) can.onclick = cerrar;
    var ok = $('#mu-ok'); if (ok) ok.onclick = guardar;
  }
  function buscarIng(it) {
    return buscarSuper(it.buscar || it.nombre).then(function (r) {
      it.res = { jumbo: (r.jumbo || []).slice(0, 5), carrefour: (r.carrefour || []).slice(0, 5) };
      it.pick = { jumbo: (it.res.jumbo[0] || {}).sku || '', carrefour: (it.res.carrefour[0] || {}).sku || '' };
      it.seguir = !!(it.pick.jumbo || it.pick.carrefour);
    });
  }

  function guardar() {
    var s = db(); if (!s) { st.msg = ['err', 'No hay conexión con la base.']; render(); return; }
    st.guardando = true; st.msg = null; render();
    var existentes = {}; st.prods.forEach(function (p) { existentes[p.clave] = 1; });
    var filas = [];
    st.ings.forEach(function (it) {
      if (it.clave || it.agregado || !it.seguir || !it.pick) return;
      var base = slug(it.nombre) || 'ing', k = base, n = 2; while (existentes[k]) k = base + '_' + (n++);
      var usado = false;
      ['jumbo', 'carrefour'].forEach(function (sup) {
        var sku = it.pick[sup]; if (!sku) return;
        filas.push({ clave: k, nombre: it.nombre, super: sup, sku: sku, activo: true }); usado = true;
      });
      if (usado) { existentes[k] = 1; it.claveNueva = k; }
    });
    var paso1 = filas.length ? s.from('canasta_productos').insert(filas) : Promise.resolve({});
    paso1.then(function (r) {
      if (r && r.error) throw r.error;
      st.ings.forEach(function (it) { if (it.claveNueva) it.agregado = true; });
      var d = st.d;
      var menus = d.opciones.map(function (o) {
        var ings = st.ings.filter(function (it) { return it.platos.some(function (p) { return String(p).charAt(0) === o.letra; }); }).map(function (it) {
          var x = { nombre: it.nombre, clave: it.clave || it.claveNueva || null, platos: it.platos, nuevo: !it.clave };
          if (!it.clave && it.res) ['jumbo', 'carrefour'].forEach(function (sup) {
            var sku = it.pick && it.pick[sup], p = sku && (it.res[sup] || []).filter(function (y) { return y.sku === sku; })[0];
            if (p) x[sup] = { sku: p.sku, nombre: p.nombre, precio: p.precio, fecha: new Date().toISOString().slice(0, 10) };
          });
          return x;
        });
        return {
          estilo: st.estilos[o.letra] || (ESTILOS[0] || {}).id || 'italiana', pasos: d.pasos,
          nombre: (o.nombre || '').trim() || ('Menú ' + (d.ocasion || d.cliente || 'de temporada')),
          platos: o.platos, etiquetas: (d.etiquetas && d.etiquetas.length) ? d.etiquetas : null, ingredientes: ings,
          origen: 'presupuesto', reserva_ref: [d.cliente, d.ocasion].filter(Boolean).join(' · ') || null, publicado: o.publicar !== false
        };
      });
      return s.from('menus_sitio').insert(menus);
    }).then(function (r) {
      if (r && r.error) throw r.error;
      marcarSubido(huella(st.d));
      var pub = st.d.opciones.filter(function (o) { return o.publicar !== false; }).length, nIng = st.ings.filter(function (it) { return it.claveNueva; }).length;
      st.guardando = false; st.hecho = true;
      st.msg = ['ok', '✓ Listo. ' + (pub ? pub + ' menú' + (pub > 1 ? 's' : '') + ' publicado' + (pub > 1 ? 's' : '') + ' en «Menús de ejemplo» del sitio. ' : 'Menú guardado sin publicar. ') +
        (nIng ? nIng + ' ingrediente' + (nIng > 1 ? 's' : '') + ' nuevo' + (nIng > 1 ? 's' : '') + ' con seguimiento: el lunes se toma su primer precio y aparece en Ingredientes.' : 'No había ingredientes nuevos para seguir.')];
      render();
    }).catch(function (e) {
      st.guardando = false; st.msg = ['err', 'No se pudo guardar: ' + esc(e.message || e) + '. Revisá que estés logueado como admin.']; render();
    });
  }

  window.pzSubirMenu = function (d) {
    st = { d: JSON.parse(JSON.stringify(d)), estilos: {}, ings: [], prods: [], precios: {}, nomClave: {}, cargando: 'Leyendo la canasta de ingredientes…' };
    st.d.opciones.forEach(function (o) { o.publicar = true; });
    abrirModal(d); render();
    cargarCanasta().then(function (c) {
      st.prods = c.prods; st.precios = c.precios; c.prods.forEach(function (p) { st.nomClave[p.clave] = p.nombre; });
      st.cargando = 'Detectando los ingredientes de cada plato…'; render();
      return analizar(st.d, c.prods);
    }).then(function (j) {
      st.estilos = j.estilos || {};
      st.d.opciones.forEach(function (o) { if (!st.estilos[o.letra] || !ESTILOS.some(function (e) { return e.id === st.estilos[o.letra]; })) st.estilos[o.letra] = (ESTILOS[0] || {}).id; });
      st.ings = j.ingredientes.map(function (x, i) { return { i: i, nombre: x.nombre, clave: x.clave, buscar: x.buscar, platos: x.platos, pick: {}, seguir: false }; })
        .sort(function (a, b) { return (!!a.clave - !!b.clave) || a.nombre.localeCompare(b.nombre); });
      st.ings.forEach(function (x, i) { x.i = i; });
      st.cargando = null; render();
      return enCola(st.ings.filter(function (x) { return !x.clave; }).map(function (it) { return function () { return buscarIng(it).then(render); }; }), 3);
    }).catch(function (e) {
      st.cargando = null; st.error = 'No pude analizar los ingredientes (' + (e.message || e) + '). Podés intentar de nuevo en un momento.'; render();
    });
  };
})();
