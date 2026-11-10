/* Admin · Catálogo de WhatsApp Business
   Arma el catálogo con los precios ACTUALES del sitio (home, /cajas, bebidas), listo para cargar:
   · ítem por ítem en la app (copiar nombre, precio, descripción, link y bajar la foto 1080×1080), o
   · todo junto: CSV con el formato del Administrador de ventas (Commerce Manager) de Meta. */
(function () {
  var SITE = 'https://www.chefprivado.ar';
  var $f = function (n) { return '$' + Math.round(n).toLocaleString('es-AR'); };
  var U = function (img, w, h) { if (!img) return ''; if (img.charAt(0) === '/') return SITE + img; if (/^https?:/.test(img)) return img; return 'https://images.unsplash.com/' + img + '?w=' + w + '&h=' + h + '&fit=crop&q=80&auto=format'; };
  var esc = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var ITEMS = [], COLS = [], filtro = 'todas', cargando = false;

  function txtDe(html, re) { var m = html.match(re); return m ? m[1] : ''; }
  function num(t) { return parseInt(String(t || '').replace(/[^\d]/g, ''), 10) || 0; }
  function arr(h, marca) { var i = h.indexOf(marca), j = h.indexOf('\n];', i); if (i < 0 || j < 0) return []; try { return new Function('return ' + h.slice(i + marca.length - 1, j + 2))() || []; } catch (e) { return []; } }
  function obj(h, marca) { var i = h.indexOf(marca), j = h.indexOf('\n};', i); if (i < 0 || j < 0) return {}; try { return new Function('return ' + h.slice(i + marca.length - 1, j + 2))() || {}; } catch (e) { return {}; } }

  async function armar() {
    var res = await Promise.all([fetch('/').then(function (r) { return r.text(); }), fetch('/cajas/').then(function (r) { return r.text(); }), fetch('/js/bebidas.js').then(function (r) { return r.text(); })]);
    var home = res[0], cj = res[1], bj = res[2];
    var d3 = num(txtDe(home, /cel-desde" data-m="1">([^<]+)</)) || 480000, d7 = num(txtDe(home, /cel-desde" data-m="2">([^<]+)</)) || 720000;
    var L = [];
    function add(col, id, nombre, precio, desde, desc, link, img, fondo) { L.push({ col: col, id: id, nombre: nombre, precio: precio, desde: !!desde, desc: desc, link: SITE + link, img: img, fondo: fondo || '' }); }

    /* Experiencias en casa */
    add('Experiencias en casa', 'exp-3-pasos', 'Experiencia de 3 pasos en casa', d3, 1,
      'Desde ' + $f(d3) + ' para 2 personas, todo incluido.\nEntrada, principal y postre cocinados en tu casa con presentación de restaurante. Compras, cocina, servicio y limpieza incluidos. De 2 a 12 personas, en CABA y GBA.\nReservar no tiene costo: la fecha se confirma con la seña.', '/?reservar=3', U('/img/svc-3pasos.webp'));
    add('Experiencias en casa', 'exp-7-pasos', 'Degustación de 7 pasos en casa', d7, 1,
      'Desde ' + $f(d7) + ' para 2 personas, todo incluido.\nUn menú degustación completo, del bocado de bienvenida al postre: técnica, producto y emoción. Ideal para aniversarios y fechas especiales. CABA y GBA.', '/?reservar=7', U('/img/svc-7pasos.webp'));
    /* Chef semanal */
    add('Chef semanal', 'chef-semanal', 'Chef semanal', 160000, 1,
      'Desde $160.000 por jornada.\nCocino en tu casa unas 6–7 hs: entre 10 y 12 preparaciones y comida para unos 4 días, refrigerada y congelada. Ordeno y limpio antes de irme. Ingredientes y viáticos aparte.', '/?reservar=semanal', U('/img/svc-viandas.webp'));
    add('Chef semanal', 'mise-en-place', 'Mise en place en tu casa', 100000, 1,
      'Desde $100.000 la media jornada (4 hs).\nTe dejo todo cortado, porcionado y listo para cocinar en la semana: vos solo terminás la cocción.', '/?reservar=semanal', U('/img/hx-semanal.webp'));

    /* Cajas */
    var CAJAS = arr(cj, 'const CAJAS = ['), MERC = arr(cj, 'const MERCADITO = ['), OC = obj(cj, 'const OCASIONES = {');
    CAJAS.forEach(function (c) {
      var opts = c.tipo === 'pp' ? (c.personas || []).map(function (p) { return { label: p + ' personas', precio: p * c.pp }; }) : (c.opciones || []);
      if (!opts.length) return;
      var min = Math.min.apply(null, opts.map(function (o) { return o.precio; }));
      var lead = String(c.lead || '').replace('{mesa}', (opts[0] && opts[0].mesa) || 'para compartir');
      var oc = (c.ocasiones || []).map(function (k) { return OC[k] && OC[k].nombre; }).filter(Boolean);
      var menu = (c.menu || []).filter(function (m) { return m[0] !== 'Incluye'; }).map(function (m) { return m[0] + ': ' + m[1]; }).join('\n');
      var desde = c.tipo === 'pp' ? 'Desde ' + $f(c.pp) + ' por persona.' : (opts.length > 1 ? 'Desde ' + $f(min) + '.' : $f(min) + '.');
      add('Cajas para ocasiones', 'caja-' + c.id, c.nombre, c.tipo === 'pp' ? c.pp : min, opts.length > 1 || c.tipo === 'pp',
        desde + ' ' + lead + '\n\n' + menu + '\n\nOpciones: ' + opts.map(function (o) { return o.label + ' ' + $f(o.precio); }).join(' · ') + (oc.length ? '\nPara: ' + oc.join(', ') + '.' : '') + '\nSe reserva con el 50%; el resto al recibir.',
        '/cajas' + (c.ocasiones && c.ocasiones.length === 1 ? '?ocasion=' + c.ocasiones[0] : ''), U(c.img, 1080, 1080));
    });
    MERC.filter(function (m) { return !m.cat; }).forEach(function (m) {
      add('Mercadito', 'merc-' + m.id, m.nombre, m.precio, 0, $f(m.precio) + ' · ' + m.det + '.\nPlato del mercadito Celestia: llega listo para regenerar. Se pide solo o junto con una caja.', '/cajas#mercadito', U(m.img, 1080, 1080));
    });
    /* Bebidas */
    try {
      var B = new Function(bj + '\nreturn { BEBIDAS: BEBIDAS, BEB_CATS: BEB_CATS };')();
      B.BEBIDAS.forEach(function (b) {
        add('Bebidas', b.id, b.nombre + ' ' + b.det, b.precio, 0, $f(b.precio) + ' · ' + (B.BEB_CATS[b.cat] ? B.BEB_CATS[b.cat][1] : '') + '.\nLlega fría junto con tu pedido. Venta de alcohol solo a mayores de 18 años.', '/cajas#bebidas', b.img, 'contain');
      });
    } catch (e) { console.warn('bebidas', e); }

    /* Corporativos, Aprendé y Management */
    add('Corporativos', 'corporativos', 'Eventos y cenas corporativas', null, 0,
      'A consultar: propuesta a medida.\nTeam buildings, cierres de año, cenas con clientes y grupos de más de 12 personas. Nos juntamos, conocemos el espacio y armamos la propuesta con staff y tiempos.', '/?consulta=corporativo', U('/img/svc-corporativos.webp'));
    add('Aprendé', 'curso-6-clases', 'Curso de cocina: 6 clases en tu casa', 120000, 1,
      'Desde $120.000 por clase (3 hs) + viáticos e ingredientes. Pack de 6 clases con 10% de descuento.\nYo cocino y vos observás, cocinamos juntos, vos cocinás y yo observo. Después de la clase 6, cocinás vos.', '/aprende', U('photo-1492739159057-7d1896b3c63f', 1080, 1080));
    add('Aprendé', 'clase-pro', 'Clase Pro de 3 hs', 180000, 0,
      '$180.000 + viáticos e ingredientes según el plato.\nClases puntuales para seguir aprendiendo después del curso, coordinadas por WhatsApp.', '/aprende', U('photo-1492739159057-7d1896b3c63f', 1080, 1080));
    add('Management', 'mg-diagnostico', 'Diagnóstico para tu negocio gastronómico', null, 0,
      'A medida: armá tu presupuesto en la web.\nConsultoría para restaurantes, cafés y emprendimientos: concepto, carta, costos, espacio, equipo y lanzamiento. De la idea al crecimiento.', '/management#diagnostico', U('/img/management/hero.webp'));
    add('Management', 'mg-curso-emprendimiento', 'Curso: Claves para armar tu emprendimiento', 49000, 0,
      '$49.000 · pago único, acceso permanente.\nTodo lo que necesitás saber antes de abrir: local, equipamiento, proveedores, equipo y un plan de negocio concreto.', '/management#cursos', U('/img/management/hero.webp'));
    add('Management', 'mg-curso-marketing', 'Curso: Marketing gastronómico y redes', 69000, 0,
      '$69.000 · pago único, acceso permanente.\nPosicioná tu negocio, construí una marca con identidad y conseguí clientes reales con estrategias para el mercado argentino.', '/management#cursos', U('/img/management/hero.webp'));
    add('Management', 'mg-curso-administracion', 'Curso: Administración de negocios gastronómicos', 79000, 0,
      '$79.000 · pago único, acceso permanente.\nCostos, food cost, prime cost, auditoría interna, sistemas de gestión y rentabilidad por plato.', '/management#cursos', U('/img/management/hero.webp'));
    add('Management', 'mg-guia-costeo', 'Guía de costeo y food cost (PDF + Excel)', 9900, 0,
      '$9.900 · descarga inmediata.\nLa herramienta práctica para costear cada plato y fijar precios con criterio.', '/management/guia', U('/img/management/hero.webp'));
    ITEMS = L;
    COLS = []; L.forEach(function (x) { if (COLS.indexOf(x.col) < 0) COLS.push(x.col); });
  }

  function precioTxt(x) { return x.precio == null ? 'A consultar' : (x.desde ? 'Desde ' : '') + $f(x.precio); }
  function pintar() {
    var el = document.getElementById('cws-lista'); if (!el) return;
    var lista = ITEMS.filter(function (x) { return filtro === 'todas' || x.col === filtro; });
    document.getElementById('cws-chips').innerHTML = ['todas'].concat(COLS).map(function (c) {
      var n = c === 'todas' ? ITEMS.length : ITEMS.filter(function (x) { return x.col === c; }).length;
      return '<button type="button" class="cws-chip' + (c === filtro ? ' on' : '') + '" data-cws-col="' + esc(c) + '">' + (c === 'todas' ? 'Todas' : esc(c)) + ' <small>' + n + '</small></button>';
    }).join('');
    var g = {}; lista.forEach(function (x) { (g[x.col] = g[x.col] || []).push(x); });
    el.innerHTML = Object.keys(g).map(function (col) {
      return '<div class="cws-col"><h3>' + esc(col) + ' <small>colección · ' + g[col].length + ' artículos</small><button type="button" class="cws-mini" data-cws-copy="col" data-v="' + esc(col) + '">Copiar nombre</button></h3><div class="cws-g">' +
        g[col].map(function (x) {
          var i = ITEMS.indexOf(x);
          return '<div class="cws-it"><div class="cws-im' + (x.fondo ? ' ct' : '') + '" style="background-image:url(\'' + esc(x.img) + '\')"></div><div class="cws-b">' +
            '<b>' + esc(x.nombre) + '</b><span class="cws-p">' + precioTxt(x) + '</span><p>' + esc(x.desc).replace(/\n/g, '<br>') + '</p>' +
            '<div class="cws-acc"><button type="button" data-cws-copy="nombre" data-i="' + i + '">Nombre</button><button type="button" data-cws-copy="precio" data-i="' + i + '">Precio</button><button type="button" data-cws-copy="desc" data-i="' + i + '">Descripción</button><button type="button" data-cws-copy="link" data-i="' + i + '">Link</button><button type="button" class="cws-foto" data-cws-foto="' + i + '">⬇ Foto 1080</button></div></div></div>';
        }).join('') + '</div></div>';
    }).join('');
  }
  function toast(t) { var d = document.getElementById('cws-toast'); d.textContent = t; d.classList.add('on'); clearTimeout(d._t); d._t = setTimeout(function () { d.classList.remove('on'); }, 1600); }
  function copiar(t, msg) { (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(function () { toast(msg || 'Copiado'); }, function () { window.prompt('Copiá el texto:', t); }); }
  function slug(t) { return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function foto(x) {
    var img = new Image(); img.crossOrigin = 'anonymous';
    img.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = c.height = 1080; var g = c.getContext('2d');
        if (x.fondo === 'contain') {
          var gr = g.createRadialGradient(540, 420, 60, 540, 540, 760); gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#eadcbd'); g.fillStyle = gr; g.fillRect(0, 0, 1080, 1080);
          var s = Math.min(820 / img.width, 900 / img.height), w = img.width * s, h = img.height * s; g.globalCompositeOperation = 'multiply'; g.drawImage(img, (1080 - w) / 2, (1080 - h) / 2, w, h); g.globalCompositeOperation = 'source-over';
        } else {
          var s2 = Math.max(1080 / img.width, 1080 / img.height), w2 = img.width * s2, h2 = img.height * s2; g.drawImage(img, (1080 - w2) / 2, (1080 - h2) / 2, w2, h2);
        }
        c.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'celestia-' + slug(x.nombre) + '.jpg'; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800); toast('Foto descargada'); }, 'image/jpeg', 0.9);
      } catch (e) { window.open(x.img, '_blank'); toast('Abrí la foto en otra pestaña: guardala desde ahí'); }
    };
    img.onerror = function () { window.open(x.img, '_blank'); toast('Abrí la foto en otra pestaña: guardala desde ahí'); };
    img.src = x.img + (x.img.indexOf('?') > 0 ? '&' : '?') + 'cws=1';
  }
  function csv() {
    var q = function (v) { return '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"'; };
    var rows = [['id', 'title', 'description', 'availability', 'condition', 'price', 'link', 'image_link', 'brand', 'custom_label_0']];
    ITEMS.forEach(function (x) { rows.push([x.id, x.nombre, x.desc.replace(/\n+/g, ' '), 'in stock', 'new', x.precio == null ? '1 ARS' : x.precio + ' ARS', x.link, x.img, 'Celestia Chef Privado', x.col]); });
    var b = new Blob(['﻿' + rows.map(function (r) { return r.map(q).join(','); }).join('\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'catalogo-whatsapp-celestia.csv'; document.body.appendChild(a); a.click(); setTimeout(function () { a.remove(); }, 500);
    toast('CSV descargado: ' + ITEMS.length + ' artículos');
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cws-col],[data-cws-copy],[data-cws-foto],#cws-csv,#cws-recargar'); if (!t) return;
    if (t.id === 'cws-csv') { csv(); return; }
    if (t.id === 'cws-recargar') { window.cargarCatalogoWS(true); return; }
    if (t.hasAttribute('data-cws-col')) { filtro = t.getAttribute('data-cws-col'); pintar(); return; }
    if (t.hasAttribute('data-cws-foto')) { foto(ITEMS[+t.getAttribute('data-cws-foto')]); return; }
    var k = t.getAttribute('data-cws-copy');
    if (k === 'col') { copiar(t.getAttribute('data-v'), 'Nombre de la colección copiado'); return; }
    var x = ITEMS[+t.getAttribute('data-i')];
    if (k === 'nombre') copiar(x.nombre, 'Nombre copiado');
    else if (k === 'precio') copiar(x.precio == null ? '' : String(x.precio), x.precio == null ? 'Sin precio: dejalo vacío' : 'Precio copiado (solo el número)');
    else if (k === 'desc') copiar(x.desc, 'Descripción copiada');
    else if (k === 'link') copiar(x.link, 'Link copiado');
  });
  window.cargarCatalogoWS = async function (forzar) {
    var el = document.getElementById('cws-lista'); if (!el || cargando) return;
    if (ITEMS.length && !forzar) { pintar(); return; }
    cargando = true; el.innerHTML = '<div class="loading">Armando el catálogo con los precios de hoy…</div>';
    try { await armar(); pintar(); } catch (e) { el.innerHTML = '<div class="loading">No pude leer los precios del sitio: ' + esc(e.message) + '</div>'; }
    cargando = false;
  };
})();
