/* Celestia Management en el creador de historias: plantillas navy + dorado con el logo de Management
   y una pestaña con módulos, tips, números, cursos y la guía. Se carga después del script principal. */
(function () {
  const MG = 'https://chefprivado.ar/management';
  const UTM = '?utm_source=instagram&utm_medium=historia&utm_campaign=management';
  let MLOGO = null; const MLOGO_P = cargarImg('/img/management/logo-pill.png').then(i => (MLOGO = i));
  const MEMB = cargarImg('/img/management/emblema.png'); let EMB = null; MEMB.then(i => (EMB = i));

  const MODS = [
    [1, 'Concepción & Diagnóstico', ['Concepto y público objetivo', 'Ubicación o zonas candidatas', 'Factibilidad: competencia y demografía'], 'Concepto validado antes de firmar contrato'],
    [2, 'Marketing & Marca', ['Nombre, identidad y lineamientos', 'Plan de lanzamiento + calendario', 'FODA propio vs competidores'], '1.200 clics y 4,6★ en 30 días'],
    [3, 'Oferta & Costeo', ['Diseño de carta', 'Recetas estándar con costo por ración', 'Precios y márgenes (food cost)'], 'Rentabilidad por ticket +18%'],
    [4, 'Diseño Operativo', ['Layout de cocina y salón con flujos', 'Equipos, vajilla y presupuestos', 'Circulación y tiempos'], '+32% tickets por hora sin ampliar el equipo'],
    [5, 'RR.HH. & Operación', ['Organigrama y puestos', 'Protocolos y capacitación', 'Turnos, francos y menú staff'], 'Rotación −40%'],
    [6, 'Legal & Finanzas', ['Habilitaciones y seguros', 'Proyección de ventas y gastos', 'Punto de equilibrio y recupero'], 'Punto de equilibrio en 9 semanas'],
    [7, 'Tecnología & Datos', ['Reservas online y delivery', 'CRM y fidelización', 'Inventario y tableros'], 'Reactivación de clientes +12%'],
    [8, 'Diseño & Arquitectura', ['Arquitectura e interiorismo', 'Planos, renders y dirección de obra', 'Coordinación de obra'], 'Un espacio pensado para vender'],
  ];
  const TIPS = [
    ['Costeá con la merma', 'El costo de un plato se calcula con el peso que usás, no con el que comprás. Si el lomo pierde 25% al limpiarlo, ese 25% también lo paga el plato.'],
    ['Tu carta tiene estrellas y perros', 'Cruzá ventas y margen de cada plato: los que venden mucho y dejan poco hay que reformularlos, no sacarlos.'],
    ['El precio no se copia', 'Mirar el precio del de al lado sirve para ubicarte, pero tu precio sale de tu costo, tu alquiler y tu equipo.'],
    ['Un plato estrella por sección', 'Destacalo arriba a la derecha de la carta, donde el ojo mira primero. Tiene que ser rico y rentable.'],
    ['Medí antes de crecer', 'Antes de abrir una sucursal, tu local actual tiene que funcionar sin vos un fin de semana entero.'],
    ['Las recetas se escriben', 'Si la receta está en la cabeza del cocinero, el costo y el sabor cambian cada vez que cambia el cocinero.'],
    ['Compras con planilla', 'Comprar sin stock mínimo y máximo es la forma más rápida de tirar plata en la cámara.'],
    ['El salón también vende', 'La circulación, la luz y el ruido cambian cuánto tiempo se queda la gente y cuánto consume.'],
  ];
  const NUMS = [
    ['30%', 'Food cost objetivo', 'Para la mayoría de los restaurantes, el costo de la materia prima no debería pasar el 28–32% del precio de venta.'],
    ['60%', 'Prime cost', 'Materia prima + sueldos. Si pasa del 60–65% de la venta, el negocio está trabajando para pagar costos.'],
    ['9 sem', 'Punto de equilibrio', 'El tiempo promedio que tardan nuestros proyectos en cubrir sus costos fijos después de abrir.'],
    ['−40%', 'Rotación de personal', 'Con puestos claros, capacitación y turnos ordenados, el equipo se queda.'],
    ['3 de 10', 'Platos que sostienen la carta', 'En casi toda carta, pocos platos explican la mayor parte de la ganancia. Hay que saber cuáles son.'],
  ];
  const CURSOS = [
    ['curso01', 'Marketing gastronómico y redes', '14 módulos · $69.000', '/management/assets/curso01.jpg'],
    ['curso02', 'Claves para armar tu emprendimiento', '14 módulos · $49.000', '/management/assets/curso02.jpg'],
    ['curso03', 'Administración de negocios gastronómicos', '12 módulos · $79.000', '/management/assets/curso03.jpg'],
  ];

  Object.assign(PLANTILLAS, { mg_tip: 'Management · Tip de negocio', mg_num: 'Management · Número clave', mg_mod: 'Management · Módulo', mg_cta: 'Management · Diagnóstico', mg_foto: 'Management · Foto + título' });

  const pieMg = (x, oscuro = true) => { cerrarTextos(x); x.font = '500 30px "DM Sans"'; x.textAlign = 'center'; x.fillStyle = oscuro ? 'rgba(250,246,239,.6)' : 'rgba(13,27,42,.6)'; if ('letterSpacing' in x) x.letterSpacing = '4px'; x.fillText('CHEFPRIVADO.AR/MANAGEMENT', W / 2, 1700 + offB()); if ('letterSpacing' in x) x.letterSpacing = '0px'; };
  function fondoMg(x, seed) {
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0B1726'); g.addColorStop(1, '#0D1B2A'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    const r = x.createRadialGradient(W * .85, 0, 10, W * .85, 0, 900); r.addColorStop(0, 'rgba(232,201,106,.18)'); r.addColorStop(1, 'rgba(232,201,106,0)'); x.fillStyle = r; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(232,201,106,.10)'; for (let yy = 40; yy < H; yy += 70) for (let xx = 40; xx < W; xx += 70) { x.beginPath(); x.arc(xx, yy, 1.6, 0, 7); x.fill(); }
    estrellas(x, 0, 0, 0, 50, seed);
  }
  function logoMg(x, y0 = 210) {   // logo píldora de Management (respeta el ajuste de posición del logo)
    const w = 420; if (MLOGO) { x.save(); x.shadowColor = 'rgba(0,0,0,.45)'; x.shadowBlur = 30; x.shadowOffsetY = 6; x.drawImage(MLOGO, (W - w) / 2, y0 + (OFF.activo ? OFF.l : 0), w, w * MLOGO.height / MLOGO.width); x.restore(); }
    if (OFF.activo && !OFF.abierto) { x.save(); x.translate(OFF.tx, OFF.t); OFF.abierto = true; }
  }
  function esfera(x, cx, cy, r, on) {
    const g = x.createRadialGradient(cx - r * .3, cy - r * .35, r * .1, cx, cy, r);
    if (on) { g.addColorStop(0, '#FFF1BF'); g.addColorStop(.45, '#E8C96A'); g.addColorStop(1, '#9C7A28'); } else { g.addColorStop(0, '#2E5277'); g.addColorStop(.55, '#173451'); g.addColorStop(1, '#0B1826'); }
    x.save(); x.shadowColor = on ? 'rgba(232,201,106,.5)' : 'rgba(0,0,0,.6)'; x.shadowBlur = on ? 40 : 18; x.shadowOffsetY = 8;
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.restore();
    x.strokeStyle = 'rgba(232,201,106,.75)'; x.lineWidth = 3; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
  }

  Object.assign(TPL, {
    mg_tip(x, h, img) {
      fondoMg(x, 5); logoMg(x);
      let y = 560;
      if (img) { x.save(); x.beginPath(); x.arc(W / 2, 600, 150, 0, 7); x.clip(); cover(x, img, W / 2 - 150, 450, 300, 300, h.foco, h.zoom, h.fx); x.restore(); x.strokeStyle = C.gold2; x.lineWidth = 8; x.beginPath(); x.arc(W / 2, 600, 154, 0, 7); x.stroke(); y = 800; }
      y = bloque(x, '✦ ' + (h.kicker || 'Tip de negocio'), { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 92, min: 56, maxW: W - 180, maxLines: 3, y: y + 40, color: C.cream, align: 'center' });
      x.fillStyle = C.gold; x.fillRect(W / 2 - 60, y + 46, 120, 4);
      bloque(x, h.texto, { font: '400 {s}px "DM Sans"', size: 46, min: 32, maxW: W - 200, maxLines: 9, y: y + 90, color: 'rgba(250,246,239,.88)', align: 'center', lh: 1.4 });
      pastilla(x, h.boton || 'Armá tu diagnóstico ↗', 1520); pieMg(x);
    },
    mg_num(x, h) {
      fondoMg(x, 9); logoMg(x);
      let y = 520;
      y = bloque(x, h.kicker || 'Número clave', { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      const g = x.createLinearGradient(0, y + 40, 0, y + 330); g.addColorStop(0, '#FFF1BF'); g.addColorStop(.5, '#E8C96A'); g.addColorStop(1, '#9C7A28');
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 300, min: 140, maxW: W - 140, maxLines: 1, y: y + 40, color: g, align: 'center' });
      x.fillStyle = C.gold; x.fillRect(W / 2 - 60, y + 50, 120, 4);
      bloque(x, h.texto, { font: '400 {s}px "DM Sans"', size: 48, min: 32, maxW: W - 200, maxLines: 8, y: y + 100, color: 'rgba(250,246,239,.9)', align: 'center', lh: 1.4 });
      pastilla(x, h.boton || 'Más en chefprivado.ar/management', 1520); pieMg(x);
    },
    mg_mod(x, h) {
      fondoMg(x, 13); logoMg(x);
      esfera(x, W / 2, 620, 150, true);
      x.fillStyle = C.navy; x.textAlign = 'center'; x.font = '400 150px "DM Serif Display"'; x.fillText(String(h.num || ''), W / 2, 672);
      let y = 820;
      y = bloque(x, h.kicker || 'Módulo', { font: '600 {s}px "DM Sans"', size: 30, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 88, min: 54, maxW: W - 180, maxLines: 2, y: y + 30, color: C.cream, align: 'center' });
      y += 50;
      String(h.texto || '').split('\n').filter(Boolean).slice(0, 4).forEach(l => {
        x.fillStyle = 'rgba(255,255,255,.05)'; x.strokeStyle = 'rgba(201,168,76,.35)'; x.lineWidth = 2; x.beginPath(); x.roundRect(140, y, W - 280, 96, 48); x.fill(); x.stroke();
        x.fillStyle = C.gold2; x.font = '400 40px "DM Sans"'; x.textAlign = 'left'; x.fillText('✦', 180, y + 62);
        bloque(x, l, { font: '400 {s}px "DM Sans"', size: 38, min: 28, maxW: W - 400, maxLines: 1, y: y + 18, color: C.cream, cx: 240 });
        y += 118;
      });
      if (h.resultado) { y += 10; bloque(x, '✓ ' + h.resultado, { font: '600 {s}px "DM Sans"', size: 36, min: 28, maxW: W - 220, maxLines: 2, y, color: '#7fd8a6', align: 'center', lh: 1.3 }); }
      pastilla(x, h.boton || 'Armá tu presupuesto ↗', 1540); pieMg(x);
    },
    mg_cta(x, h) {
      fondoMg(x, 17); logoMg(x);
      const cx = W / 2, cy = 700, R = 250;
      x.strokeStyle = 'rgba(201,168,76,.25)'; x.lineWidth = 14; x.beginPath(); x.arc(cx, cy, R, 0, 7); x.stroke();
      x.strokeStyle = C.gold2; x.lineWidth = 14; x.lineCap = 'round'; x.beginPath(); x.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.25); x.stroke(); x.lineCap = 'butt';
      for (let k = 0; k < 8; k++) { const a = -Math.PI / 2 + k * Math.PI / 4, px = cx + R * Math.cos(a), py = cy + R * Math.sin(a);
        x.strokeStyle = 'rgba(201,168,76,.25)'; x.lineWidth = 2; x.setLineDash([6, 10]); x.beginPath(); x.moveTo(cx, cy); x.lineTo(px, py); x.stroke(); x.setLineDash([]);
        esfera(x, px, py, 52, k < 3); x.fillStyle = k < 3 ? C.navy : C.gold2; x.font = '400 46px "DM Serif Display"'; x.textAlign = 'center'; x.fillText(String(k + 1), px, py + 16); }
      x.fillStyle = '#0B1826'; x.beginPath(); x.arc(cx, cy, 120, 0, 7); x.fill(); x.strokeStyle = 'rgba(232,201,106,.6)'; x.lineWidth = 3; x.stroke();
      if (EMB) x.drawImage(EMB, cx - 95, cy - 95, 190, 190);
      let y = 1030;
      y = bloque(x, h.kicker || 'Diagnóstico sin costo', { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 84, min: 54, maxW: W - 180, maxLines: 3, y: y + 30, color: C.cream, align: 'center' });
      bloque(x, h.texto, { font: '400 {s}px "DM Sans"', size: 40, min: 30, maxW: W - 220, maxLines: 4, y: y + 30, color: 'rgba(250,246,239,.82)', align: 'center', lh: 1.38 });
      pastilla(x, h.boton || 'Armalo en 2 minutos ↗', 1540); pieMg(x);
    },
    mg_foto(x, h, img) {
      if (img) cover(x, img, 0, 0, W, H, h.foco, h.zoom, h.fx); else fondoMg(x, 3);
      let g = x.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(13,27,42,.7)'); g.addColorStop(1, 'rgba(13,27,42,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 420);
      g = x.createLinearGradient(0, H * .45, 0, H); g.addColorStop(0, 'rgba(13,27,42,0)'); g.addColorStop(.45, 'rgba(13,27,42,.84)'); g.addColorStop(1, 'rgba(13,27,42,.98)'); x.fillStyle = g; x.fillRect(0, H * .45, W, H * .55);
      logoMg(x, 150);
      let y = 1080;
      y = bloque(x, '✦ ' + (h.kicker || ''), { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 5 });
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 88, maxW: W - 180, maxLines: 3, y: y + 30, color: C.cream, align: 'center' });
      bloque(x, h.texto, { font: '400 {s}px "DM Sans"', size: 40, maxW: W - 220, maxLines: 3, y: y + 30, color: 'rgba(250,246,239,.82)', align: 'center', lh: 1.35 });
      pieMg(x);
    },
  });

  const base = (o) => Object.assign({ foco: 50, zoom: 1, fx: 50 }, o);
  window.mgDesdeModulo = (i) => { const m = MODS[i]; marcarUsado('mg:mod:' + i); return base({ tpl: 'mg_mod', num: m[0], kicker: 'Módulo ' + m[0] + ' de 8', titulo: m[1], texto: m[2].join('\n'), resultado: m[3], link: MG + UTM + '#diagnostico', sticker: 'Armá tu presupuesto' }); };
  window.mgDesdeTip = (i) => { const t = TIPS[i]; marcarUsado('mg:tip:' + i); return base({ tpl: 'mg_tip', img: null, kicker: 'Tip de negocio', titulo: t[0], texto: t[1], link: MG + UTM + '#diagnostico', sticker: 'Diagnóstico sin costo' }); };
  window.mgDesdeNum = (i) => { const n = NUMS[i]; marcarUsado('mg:num:' + i); return base({ tpl: 'mg_num', kicker: n[1], titulo: n[0], texto: n[2], link: MG + UTM, sticker: 'Celestia Management' }); };
  window.mgDesdeCta = () => base({ tpl: 'mg_cta', kicker: 'Diagnóstico sin costo', titulo: '¿Tu negocio gastronómico gana lo que debería?', texto: 'Elegí los módulos en la rueda y te llega el presupuesto por mail.', link: MG + UTM + '#diagnostico', sticker: 'Armá tu diagnóstico' });
  window.mgDesdeCurso = (i) => { const c = CURSOS[i]; marcarUsado('mg:curso:' + c[0]); return base({ tpl: 'mg_foto', img: c[3], foco: 50, kicker: 'Curso online · ' + c[2], titulo: c[1], texto: 'Pagás una vez y accedés siempre.', link: MG + UTM + '#cursos', sticker: 'Ver el curso' }); };
  window.mgDesdeGuia = () => base({ tpl: 'mg_tip', img: '/management/assets/guia.jpg', foco: 40, kicker: 'Guía de costeo · $9.900', titulo: 'Costeá cada plato sin vueltas', texto: 'PDF de 9 capítulos + planillas de Excel para calcular tu food cost y fijar precios con criterio.', boton: 'Bajá la guía ↗', link: MG + '/guia' + UTM, sticker: 'Guía de costeo' });

  window.panelMG = () => {
    const sec = (t) => `<p class="hint" style="margin:16px 0 6px;color:var(--gold2)">${t}</p>`;
    return `<p class="hint">Historias de Celestia Management con su logo. El link va a chefprivado.ar/management.</p><div class="items">`
      + item('mg:cta', null, 'Diagnóstico sin costo', 'La rueda de 8 módulos', 'agregar(mgDesdeCta())', '◎')
      + item('mg:guia', '/management/assets/guia.jpg', 'Guía de costeo', '$9.900 · PDF + Excel', 'agregar(mgDesdeGuia())')
      + '</div>' + sec('Los 8 módulos') + '<div class="items">'
      + MODS.map((m, i) => item('mg:mod:' + i, null, 'M' + m[0] + ' · ' + m[1], m[3], `agregar(mgDesdeModulo(${i}))`, String(m[0]))).join('')
      + '</div>' + sec('Tips de negocio') + '<div class="items">'
      + TIPS.map((t, i) => item('mg:tip:' + i, null, t[0], t[1], `agregar(mgDesdeTip(${i}))`, '💼')).join('')
      + '</div>' + sec('Números clave') + '<div class="items">'
      + NUMS.map((n, i) => item('mg:num:' + i, null, n[0] + ' · ' + n[1], n[2], `agregar(mgDesdeNum(${i}))`, '📊')).join('')
      + '</div>' + sec('Cursos') + '<div class="items">'
      + CURSOS.map((c, i) => item('mg:curso:' + c[0], c[3], c[1], c[2], `agregar(mgDesdeCurso(${i}))`)).join('') + '</div>';
  };
  window.MLOGO_P = MLOGO_P;
})();
