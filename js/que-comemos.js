/* ═════════ "¿Qué comemos hoy?" · saga de historias para Instagram ═════════
   Elegís lo que hay en la heladera y arma un plato estilo chef privado:
   principal + salsa + guarnición + toque de chef, y lo convierte en 6 placas.
   Se usa desde /admin-historias (pestaña 🧊). Sal, pimienta y aceite se dan por sentados. */
(function () {
  /* principales: req = todos necesarios · alt = alcanza con uno · tag = con qué salsas combina */
  const { PRINC, POSTRES, ING, INFO, SALSAS, GUARN, TOQUES, EMPLATADO, TOQUE_DULCE, recetaURL } = window.QCH_DATA;
  const BASICOS = new Set(['sal', 'pimienta', 'aceite']);
  const tiene = (sel, k) => sel.has(k) || BASICOS.has(k);
  const cumple = (x, sel) => {
    if (x.req && !x.req.every(k => tiene(sel, k))) return false;
    if (x.alt && x.alt.length && !x.alt.some(k => sel.has(k))) return false;
    if (x.min2 && x.min2.filter(k => sel.has(k)).length < 2) return false;
    return true;
  };
  const usados = (x, sel) => [...new Set([...(x.req || []), ...(x.alt || []).filter(k => sel.has(k)), ...(x.min2 || []).filter(k => sel.has(k))])].filter(k => sel.has(k));

  const LIVIANAS = ['ensalada-verde', 'ensalada-palta', 'pan-ajo', 'brocoli', 'hongos', 'espinaca-crema', 'asados', 'arroz-pilaf'];
  function opcionesDe(p, sel) {
    const out = [];
    const ss = p.c || p.ns ? [] : SALSAS.filter(s => s.va.includes(p.tag) && cumple(s, sel));
    const gs = GUARN.filter(g => cumple(g, sel) && (!p.c || LIVIANAS.includes(g.id)) && !(g.req || []).some(k => (p.req || []).includes(k) && k !== 'ajo' && k !== 'manteca'));
    const opS = ss.length ? ss : [null], opG = gs.length ? gs : [null];
    opS.forEach(s => opG.forEach(g => {
      const u = new Set([...usados(p, sel), ...(s ? usados(s, sel) : []), ...(g ? usados(g, sel) : [])]);
      out.push({ p, s, g, usa: [...u], score: u.size * 10 + (s ? 6 : 0) + (g ? 6 : 0) + (p.c ? 10 : p.ns ? 5 : 0) + (p.req.length > 1 ? 3 : 0) });
    }));
    return out.sort((a, b) => b.score - a.score);
  }
  function combinar(sel) {
    const out = [];
    PRINC.filter(p => cumple(p, sel)).forEach(p => out.push(...opcionesDe(p, sel)));
    out.sort((a, b) => b.score - a.score);
    // variedad: no repetir principal en las primeras opciones
    const top = [], uso = {};
    const pen = o => (uso['p' + o.p.id] || 0) * 14 + (o.s ? (uso['s' + o.s.id] || 0) * 9 : 0) + (o.g ? (uso['g' + o.g.id] || 0) * 9 : 0);
    while (top.length < 6 && out.length) {
      let bi = 0, bv = -1e9; out.forEach((o, k) => { const v = o.score - pen(o); if (v > bv) { bv = v; bi = k; } });
      const o = out.splice(bi, 1)[0]; top.push(o); uso['p' + o.p.id] = (uso['p' + o.p.id] || 0) + 1; if (o.s) uso['s' + o.s.id] = (uso['s' + o.s.id] || 0) + 1; if (o.g) uso['g' + o.g.id] = (uso['g' + o.g.id] || 0) + 1;
    }
    return top;
  }
  const nombrePlato = o => o.p.nombre + (o.s ? ', ' + o.s.nombre.charAt(0).toLowerCase() + o.s.nombre.slice(1) : '') + (o.g ? ' y ' + o.g.nombre.charAt(0).toLowerCase() + o.g.nombre.slice(1) : '');

  /* ───────── estado y panel ───────── */
  const QCH = window.QCH = { sel: new Set(), opciones: [], postres: [], n: 1, quien: '', preg: 'heladera', pregProt: 'pollo', postreSel: '' };
  
  try { const g = JSON.parse(localStorage.getItem('cel_qch') || '{}'); (g.sel || []).forEach(k => INFO[k] && QCH.sel.add(k)); ['n', 'quien', 'preg', 'pregProt'].forEach(k => { if (g[k] != null) QCH[k] = g[k]; }); } catch (e) {}
  const guardar = () => { try { localStorage.setItem('cel_qch', JSON.stringify({ sel: [...QCH.sel], n: QCH.n, quien: QCH.quien, preg: QCH.preg, pregProt: QCH.pregProt })); } catch (e) {} };
  const escQ = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const PROTS = ['pollo', 'carne', 'picada', 'cerdo', 'pescado', 'salmon', 'langostinos', 'huevos', 'atun', 'legumbres'];
  const nomProt = k => ({ carne: 'carne', picada: 'carne picada', cerdo: 'cerdo', pescado: 'pescado', salmon: 'salmón', huevos: 'huevos', atun: 'atún', legumbres: 'garbanzos o lentejas' })[k] || (INFO[k] ? INFO[k].n.toLowerCase() : k);
  const PREG = {
    heladera: { nom: '🧊 ¿Qué tenés en la heladera?', titulo: '¿Qué tenés en la heladera?', texto: 'Contame 3 o 4 ingredientes y te armo un plato de chef con lo que hay.', sticker: 'Tengo… 🧊' },
    postre: { nom: '🍫 ¿Y de postre?', titulo: '¿Y de postre?', texto: 'Contame qué dulce tenés a mano (chocolate, frutas, dulce de leche…) y te armo un postre de chef.', sticker: 'Para el postre tengo… 🍫' },
    antojo: { nom: '😋 ¿Qué tenés ganas de comer?', titulo: '¿Qué tenés ganas de comer hoy?', texto: 'Pollo, pasta, algo liviano o algo dulce… Contame y te paso la receta estilo chef.', sticker: 'Hoy tengo ganas de…' }
  };
  if (!PREG[QCH.preg]) QCH.preg = 'heladera';
  const pregTxt = (t) => t.replace(/\{p\}/g, nomProt(QCH.pregProt));
  const quienTxt = () => { const q = String(QCH.quien || '').trim(); return q ? (q.startsWith('@') ? q : '@' + q) : ''; };

  window.panelQCH = function () {
    const sel = QCH.sel, P_ = PREG[QCH.preg] || PREG.heladera;
    QCH.opciones = sel.size ? combinar(sel) : [];
    QCH.postres = POSTRES.filter(x => cumple(x, sel)).sort((a, b) => usados(b, sel).length - usados(a, sel).length);
    if (QCH.postreSel && !QCH.postres.some(x => x.id === QCH.postreSel)) QCH.postreSel = '';
    const protsSel = PROTS.filter(k => sel.has(k)).concat(['arroz', 'fideos', 'berenjena'].filter(k => sel.has(k)));
    return `<div class="qch-box">
        <div class="qch-g" style="margin-top:0">📮 Historia #1 · Caja de preguntas</div>
        <div class="qch-top" style="margin:6px 0 8px"><span>Número de esta saga (sale como “#” en las placas)</span><input class="inp" type="number" min="1" value="${QCH.n}" style="width:70px;margin:0;padding:6px 8px" onchange="QCH.n=Math.max(1,parseInt(this.value)||1);qchGuardar();renderPanel()"><button class="btn sec sm" onclick="QCH.n=1;qchGuardar();renderPanel()">↺ 1</button></div>
        <p class="hint" style="margin-bottom:8px">Es la primera de la saga: le preguntás a tus seguidores qué tienen. Deja el lugar para el sticker de preguntas. Con lo que te respondan, armás la historia 2 (“Tengo…”) y la receta.</p>
        <select class="inp" onchange="QCH.preg=this.value;qchGuardar();renderPanel()">${Object.entries(PREG).map(([k, v]) => `<option value="${k}" ${QCH.preg === k ? 'selected' : ''}>${v.nom}</option>`).join('')}</select>
        <div class="link" style="margin:2px 0 8px"><span>Sticker: “${escQ(pregTxt(P_.sticker))}”</span><button onclick="qchCopiarSticker()">Copiar</button></div>
        <button class="btn sm" style="width:100%" onclick="qchPregunta()">+ Sumar historia #1 con caja de preguntas</button>
      </div>
      <div class="qch-g" style="margin-top:18px">🧊 Lo que respondieron (o lo que hay)</div>
      <input class="inp" placeholder="¿Quién lo pidió? @usuario (opcional)" value="${escQ(QCH.quien)}" onchange="QCH.quien=this.value;qchGuardar()">
      <div class="qch-top"><span>${sel.size ? sel.size + ' elegidos' : 'Nada elegido'}</span><button class="btn sec sm" onclick="qchAzar()">🎲 Al azar</button>${sel.size ? '<button class="btn sec sm" onclick="qchLimpiar()">Vaciar</button>' : ''}</div>
      ${ING.map(([g, l]) => `<div class="qch-g">${g}</div><div class="qch-chips">${l.map(([k, e, n]) => `<button class="qch-c${sel.has(k) ? ' on' : ''}" onclick="qchToggle('${k}')">${e} ${escQ(n)}</button>`).join('')}</div>`).join('')}
      <div class="qch-g" style="margin-top:18px">🍽️ Platos posibles</div>
      ${!sel.size ? '<p class="hint">Elegí al menos algo principal: pollo, carne, pescado, huevos, legumbres, arroz o fideos.</p>' : !QCH.opciones.length ? '<p class="hint">Con esto no me sale un plato: sumá algo principal (pollo, carne, pescado), huevos, arroz o fideos.</p>' :
        `${QCH.postres.length ? `<label class="hint" style="display:flex;gap:8px;align-items:center;margin-bottom:8px">🍰 Sumar postre a la saga: <select class="inp" style="margin:0;flex:1;padding:6px 8px" onchange="QCH.postreSel=this.value"><option value="">Sin postre</option>${QCH.postres.map(x => `<option value="${x.id}" ${QCH.postreSel === x.id ? 'selected' : ''}>${escQ(x.nombre)}</option>`).join('')}</select></label>` : ''}
        <div class="items">${QCH.opciones.map((o, i) => `<button class="it" onclick="qchSaga(${i})"><span class="ic">${INFO[o.p.prot] ? INFO[o.p.prot].e : '🍽️'}</span><div><b>${escQ(o.p.nombre)}</b><span>${escQ([o.s && 'Salsa: ' + o.s.nombre, o.g && 'Guarnición: ' + o.g.nombre].filter(Boolean).join(' · ') || (o.p.c ? 'Plato completo' : 'Con lo elegido, sin salsa ni guarnición'))}</span></div></button>`).join('')}</div>`}
      ${protsSel.length ? `<div class="qch-g" style="margin-top:16px">📖 Recetario completo</div>${protsSel.map(k => { const l = PRINC.filter(p => p.prot === k); return `<details class="qch-rec"><summary>${INFO[k].e} ${escQ(INFO[k].n)} · ${l.length} recetas</summary>${l.map(p => `<button class="qch-r${cumple(p, sel) ? '' : ' falta'}" onclick="qchReceta('${p.id}')" title="${cumple(p, sel) ? '' : 'Falta: ' + escQ([...p.req.filter(r => !sel.has(r)), ...(p.alt.length && !p.alt.some(a => sel.has(a)) ? [p.alt.map(a => INFO[a] ? INFO[a].n : a).join(' o ')] : [])].map(r => INFO[r] ? INFO[r].n : r).join(', '))}">${escQ(p.nombre)}${cumple(p, sel) ? '' : ' <i>· falta algo</i>'}</button>`).join('')}</details>`; }).join('')}` : ''}
      <div class="qch-g" style="margin-top:16px">🍰 Postres posibles</div>
      ${QCH.postres.length ? `<div class="items">${QCH.postres.map((x, i) => `<button class="it" onclick="qchPostre(${i})"><span class="ic">🍰</span><div><b>${escQ(x.nombre)}</b><span>Saga dulce de 4 historias</span></div></button>`).join('')}</div>` : '<p class="hint">Marcá ingredientes de “Para el postre” (chocolate, dulce de leche, frutas, galletitas…).</p>'}
      <div class="qch-g" style="margin-top:16px">✨ Con IA</div>
      <button class="btn sec sm" id="qch-ia" onclick="qchIA()" style="width:100%" ${sel.size ? '' : 'disabled'}>✨ Que la IA invente un plato con lo elegido</button>`;
  };
  window.qchGuardar = guardar;
  window.qchToggle = k => { QCH.sel.has(k) ? QCH.sel.delete(k) : QCH.sel.add(k); guardar(); renderPanel(); };
  window.qchLimpiar = () => { QCH.sel.clear(); guardar(); renderPanel(); };
  window.qchAzar = () => {
    QCH.sel.clear(); const pick = (arr, n) => arr.slice().sort(() => Math.random() - .5).slice(0, n);
    const g = i => ING[i][1].map(x => x[0]);
    [...pick(g(0), 1), ...pick(g(1), 5), ...pick(g(2), 2), ...pick(g(3), 3), ...pick(g(4), 2)].forEach(k => QCH.sel.add(k)); guardar(); renderPanel();
  };
  window.qchCopiarSticker = () => { const t = pregTxt((PREG[QCH.preg] || PREG.heladera).sticker); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => toast('Texto del sticker copiado'), () => toast(t)); };

  /* ───────── la saga ───────── */
  const LINK = 'https://chefprivado.ar/que-comemos-hoy/?utm_source=instagram&utm_medium=historia&utm_campaign=que-comemos-hoy';
  /* historia 2: la respuesta del seguidor, "Tengo pollo, papa y crema. ¿Qué le hago?" */
  function tengo(ks, dulce) {
    const orden = dulce ? ks.slice() : ks.slice().sort((a, b) => (PROTS.includes(b) ? 1 : 0) - (PROTS.includes(a) ? 1 : 0));
    const nom = orden.map(k => INFO[k] ? INFO[k].n.toLowerCase().replace(/ \(.*\)$/, '') : k);
    const tres = nom.slice(0, 3), mas = nom.length > 3;
    const lista = mas ? tres.join(', ') + ' y algo más' : tres.length > 1 ? tres.slice(0, -1).join(', ') + ' y ' + tres[tres.length - 1] : (tres[0] || 'algo en la heladera');
    return 'Tengo ' + lista + '. ' + (dulce ? '¿Qué postre hago?' : '¿Qué le hago?');
  }
  const ingTxt = ks => ks.map(k => INFO[k] ? INFO[k].e + ' ' + INFO[k].n : k);
  window.qchPregunta = function () {
    const P_ = PREG[QCH.preg] || PREG.heladera;
    sumarSaga([{ tpl: 'qch_pregunta', kicker: '¿Qué comemos hoy? · #' + QCH.n, titulo: pregTxt(P_.titulo), texto: pregTxt(P_.texto), link: LINK }]);
    toast('Historia #1 sumada. Pegá el sticker de preguntas en la zona marcada');
  };
  function saga(plato) {
    const n = QCH.n++; guardar();
    const q = quienTxt();
    const etq = '¿Qué comemos hoy? · #' + n;
    const ingred = ingTxt(plato.ingredientes);
    const LINK = recetaURL(Object.assign({}, plato, { n, quien: q }));
    const out = [
      { tpl: 'qch_portada', kicker: q ? '#' + n + ' · me escribió ' + q : etq + ' · me escribieron', titulo: tengo(plato.ingredientes, !plato.principal), texto: ingred.join('\n'), link: LINK },
      { tpl: 'qch_lista', kicker: q ? 'Lo que tiene ' + q : 'Con lo que hay', titulo: plato.nombre, texto: ingred.join('\n'), link: LINK }
    ];
    let k = 1;
    if (plato.principal) out.push({ tpl: 'qch_paso', kicker: 'Paso ' + k++ + ' · ' + plato.principal.corto, titulo: plato.principal.nombre, texto: plato.principal.pasos.join('\n'), link: LINK });
    if (plato.salsa) out.push({ tpl: 'qch_paso', kicker: 'Paso ' + k++ + ' · La salsa', titulo: plato.salsa.nombre, texto: plato.salsa.pasos.join('\n'), link: LINK });
    if (plato.guarnicion) out.push({ tpl: 'qch_paso', kicker: 'Paso ' + k++ + ' · La guarnición', titulo: plato.guarnicion.nombre, texto: plato.guarnicion.pasos.join('\n'), link: LINK });
    if (plato.postre) out.push({ tpl: 'qch_paso', kicker: plato.principal ? 'Y de postre' : 'Paso ' + k++ + ' · El postre', titulo: plato.postre.nombre, texto: plato.postre.pasos.join('\n'), link: LINK });
    out.push({ tpl: 'qch_cierre', kicker: plato.principal ? 'El toque de chef' : 'El toque dulce', titulo: plato.nombre + (plato.principal && plato.postre ? ' + ' + plato.postre.nombre.toLowerCase() : ''), texto: plato.toque + '\n' + (plato.principal ? EMPLATADO : 'Frío de heladera hasta el momento de servir, y algo crocante o fresco arriba para el contraste.'), link: LINK });
    return out;
  }
  function desdeOpcion(o) {
    const sel = QCH.sel, postre = QCH.postreSel ? POSTRES.find(x => x.id === QCH.postreSel) : null;
    const ing = [...sel].filter(k => o.usa.includes(k) || (postre && usados(postre, sel).includes(k)));
    return { nombre: nombrePlato(o), principal: o.p, salsa: o.s, guarnicion: o.g, postre, toque: TOQUES[o.p.tag] || TOQUES.vegetal, ingredientes: ing.length ? ing : o.usa };
  }
  window.qchSaga = function (i) { const o = QCH.opciones[i]; if (o) sumarSaga(saga(desdeOpcion(o))); };
  window.qchReceta = function (id) {
    const p = PRINC.find(x => x.id === id); if (!p) return;
    const o = opcionesDe(p, QCH.sel)[0] || { p, s: null, g: null, usa: usados(p, QCH.sel) };
    const pl = desdeOpcion(o); if (!pl.ingredientes.length) pl.ingredientes = p.req.concat(p.alt.slice(0, 1));
    sumarSaga(saga(pl));
  };
  window.qchPostre = function (i) {
    const x = QCH.postres[i]; if (!x) return;
    sumarSaga(saga({ portada: '¿Y de postre?', nombre: x.nombre, postre: x, toque: TOQUE_DULCE, ingredientes: usados(x, QCH.sel) }));
  };
  function sumarSaga(placas) {
    const ini = historias.length;
    placas.forEach(h => historias.push(Object.assign({ foco: 50, zoom: 1, sticker: h.tpl === 'qch_pregunta' ? 'Todas las recetas 🧊' : h.tpl === 'qch_cierre' ? 'La receta completa acá 👉' : 'Ver la receta completa 👉' }, h)));
    renderGrid(); renderPanel(); if (placas.length > 1) toast('Saga sumada: ' + placas.length + ' historias');
    setTimeout(() => { const c = document.querySelectorAll('.card')[ini]; c && c.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
  }

  /* ───────── con IA ───────── */
  window.qchIA = async function () {
    const b = document.getElementById('qch-ia'); if (!QCH.sel.size) return; b.disabled = true; b.textContent = '✨ Cocinando la idea…';
    const lista = [...QCH.sel].map(k => INFO[k].n).join(', ');
    const pedido = `Sos Daro Castello, chef privado de Celestia en Buenos Aires (formado en escuela de cocina). Con estos ingredientes de una heladera común: ${lista}. Además hay sal, pimienta y aceite.
Armá UN plato casero pero con técnica y presentación de chef privado. Podés no usar todo. No agregues ingredientes que no estén, salvo especias secas comunes.
Respondé SOLO un JSON válido, sin texto extra, con esta forma:
{"nombre":"nombre del plato completo","usa":["ingredientes de la lista que usás"],"principal":{"nombre":"...","pasos":["3 o 4 pasos cortos, máx 110 caracteres cada uno"]},"salsa":{"nombre":"...","pasos":["3 pasos cortos"]},"guarnicion":{"nombre":"...","pasos":["3 pasos cortos"]},"toque":"un consejo de chef de una oración","emplatado":"cómo servirlo, una oración"}
Español rioplatense con voseo, pasos en imperativo (salteá, sumá, cociná), temperaturas y tiempos concretos.`;
    try {
      const r = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: pedido }] }) });
      const d = await r.json(); const t = d && d.content && d.content.map(c => c.text || '').join('').trim();
      if (!t) throw new Error((d && d.error && (d.error.message || d.error)) || 'sin respuesta');
      const j = JSON.parse(t.slice(t.indexOf('{'), t.lastIndexOf('}') + 1));
      const porNombre = Object.fromEntries(Object.entries(INFO).map(([k, v]) => [v.n.toLowerCase(), k]));
      const ingr = (j.usa || []).map(s => porNombre[String(s).toLowerCase()] || [...QCH.sel].find(k => String(s).toLowerCase().includes(INFO[k].n.toLowerCase().split(' ')[0]))).filter(Boolean);
      const mk = (x, corto) => x && x.nombre ? { nombre: x.nombre, corto, pasos: (x.pasos || []).slice(0, 4) } : null;
      sumarSaga(saga({ nombre: j.nombre || 'El plato de hoy', principal: mk(j.principal, 'El principal') || { nombre: j.nombre, corto: 'El plato', pasos: [] }, salsa: mk(j.salsa), guarnicion: mk(j.guarnicion),
        toque: j.toque || '', emplatado: j.emplatado || '', ingredientes: [...new Set(ingr.length ? ingr : [...QCH.sel])] }).map(h => h.tpl === 'qch_cierre' && j.emplatado ? Object.assign(h, { texto: (j.toque || '') + '\n' + j.emplatado }) : h));
    } catch (e) { toast('No se pudo usar la IA: ' + String(e.message || e).slice(0, 80)); }
    b.disabled = false; b.textContent = '✨ Que la IA invente un plato con lo elegido';
  };

  /* ───────── plantillas de canvas ───────── */
  Object.assign(PLANTILLAS, { qch_pregunta: '¿Qué comemos hoy? · #1 Caja de preguntas', qch_portada: '¿Qué comemos hoy? · Portada', qch_lista: '¿Qué comemos hoy? · Heladera', qch_paso: '¿Qué comemos hoy? · Paso', qch_cierre: '¿Qué comemos hoy? · Toque de chef' });
  const ls = (x, on) => { if ('letterSpacing' in x) x.letterSpacing = on; };
  function marca(x, oscuro) { x.font = '500 30px "DM Sans"'; x.textAlign = 'center'; x.fillStyle = oscuro ? 'rgba(250,246,239,.6)' : 'rgba(13,27,42,.6)'; ls(x, '4px'); x.fillText('CHEFPRIVADO.AR', W / 2, 1700); ls(x, '0px'); }
  function chips(x, items, y0, { bg, fg, borde, size = 38 }) {
    x.font = `500 ${size}px "DM Sans"`; const padX = 30, hh = size + 40, gap = 18, maxW = W - 160; let fila = [], filas = [], ancho = 0;
    items.forEach(t => { const w = x.measureText(t).width + padX * 2; if (ancho + w + (fila.length ? gap : 0) > maxW && fila.length) { filas.push(fila); fila = []; ancho = 0; } fila.push([t, w]); ancho += w + (fila.length > 1 ? gap : 0); });
    if (fila.length) filas.push(fila);
    let y = y0;
    filas.forEach(f => { const tot = f.reduce((a, [, w]) => a + w, 0) + gap * (f.length - 1); let px = (W - tot) / 2;
      f.forEach(([t, w]) => { x.fillStyle = bg; x.beginPath(); x.roundRect(px, y, w, hh, hh / 2); x.fill(); if (borde) { x.strokeStyle = borde; x.lineWidth = 2.5; x.stroke(); } x.fillStyle = fg; x.textAlign = 'center'; x.fillText(t, px + w / 2, y + hh / 2 + size * .35); px += w + gap; });
      y += hh + gap; });
    return y;
  }
  Object.assign(TPL, {
    qch_pregunta(x, h, img, logo) {
      fondoNavy(x, 103);
      if (img) { x.globalAlpha = .25; cover(x, img, 0, 0, W, H, h.foco, h.zoom, h.fx); x.globalAlpha = 1; }
      logoTop(x, logo, 190);
      let y = 420;
      y = bloque(x, h.kicker, { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 104, min: 60, maxW: W - 160, maxLines: 3, y: y + 34, color: C.cream, align: 'center', lh: 1.06 });
      y = bloque(x, h.texto, { font: '400 {s}px "DM Sans"', size: 40, min: 30, maxW: W - 220, maxLines: 3, y: y + 34, color: 'rgba(250,246,239,.8)', align: 'center', lh: 1.35 });
      const zy = Math.max(y + 110, 1010), zh = 380;
      x.fillStyle = C.gold2; x.font = '400 64px "DM Sans"'; x.textAlign = 'center'; x.fillText('👇', W / 2, zy - 22);
      if (h._pv) {
        x.save(); x.setLineDash([18, 14]); x.strokeStyle = 'rgba(232,201,106,.75)'; x.lineWidth = 4; x.beginPath(); x.roundRect(150, zy, W - 300, zh, 40); x.stroke(); x.restore();
        x.fillStyle = 'rgba(232,201,106,.85)'; x.font = '600 34px "DM Sans"'; x.fillText('Acá va la caja de preguntas', W / 2, zy + zh / 2 - 6);
        x.font = '400 26px "DM Sans"'; x.fillStyle = 'rgba(250,246,239,.55)'; x.fillText('(esta guía no sale en el PNG)', W / 2, zy + zh / 2 + 36);
      }
      x.font = 'italic 400 36px "DM Serif Display"'; x.fillStyle = 'rgba(232,201,106,.9)'; x.fillText('Las mejores respuestas se vuelven receta ✦', W / 2, zy + zh + 90);
      marca(x, true);
    },
    qch_portada(x, h, img, logo) {
      fondoNavy(x, 57);
      if (img) { x.globalAlpha = .28; cover(x, img, 0, 0, W, H, h.foco, h.zoom, h.fx); x.globalAlpha = 1; }
      logoTop(x, logo, 200);
      let y = 470;
      y = bloque(x, h.kicker, { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      const t = String(h.titulo || ''), qi = t.lastIndexOf('¿'), dicho = qi > 0 ? t.slice(0, qi).trim() : '', preg = qi >= 0 ? t.slice(qi) : t;
      if (dicho) {
        x.font = 'italic 400 120px "DM Serif Display"'; x.fillStyle = 'rgba(232,201,106,.35)'; x.textAlign = 'left'; x.fillText('“', 70, y + 150);
        y = bloque(x, dicho, { font: '400 {s}px "DM Serif Display"', size: 92, min: 56, maxW: W - 200, maxLines: 3, y: y + 40, color: C.cream, align: 'center', lh: 1.08 });
        y = bloque(x, preg, { font: 'italic 400 {s}px "DM Serif Display"', size: 96, min: 60, maxW: W - 180, maxLines: 2, y: y + 24, color: C.gold2, align: 'center', lh: 1.05 });
      } else y = bloque(x, preg, { font: 'italic 400 {s}px "DM Serif Display"', size: 130, min: 70, maxW: W - 160, maxLines: 2, y: y + 40, color: C.gold2, align: 'center', lh: 1.05 });
      y += 90;
      x.font = '400 38px "DM Sans"'; x.fillStyle = 'rgba(250,246,239,.78)'; x.textAlign = 'center'; x.fillText('Lo que hay en la heladera:', W / 2, y);
      const items = String(h.texto || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 12);
      chips(x, items, y + 50, { bg: 'rgba(250,246,239,.08)', fg: C.cream, borde: 'rgba(201,168,76,.55)', size: items.length > 8 ? 34 : 40 });
      pastilla(x, 'Deslizá y cocinamos →', 1540);
      marca(x, true);
    },
    qch_lista(x, h, img, logo, iso_) {
      x.fillStyle = C.cream; x.fillRect(0, 0, W, H);
      x.fillStyle = C.navy; x.fillRect(0, 0, W, 470); x.save(); x.beginPath(); x.rect(0, 0, W, 470); x.clip(); if (img) { cover(x, img, 0, 0, W, 470, h.foco, h.zoom, h.fx); x.fillStyle = 'rgba(13,27,42,.35)'; x.fillRect(0, 0, W, 470); } else estrellas(x, 0, 0, 0, 60, 13); x.restore();
      logoTop(x, logo, 150);
      let y = 520;
      y = bloque(x, '🧊 ' + (h.kicker || 'Con lo que hay'), { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: '#a08a5c', align: 'center', upper: true, spacing: 6 });
      const items = String(h.texto || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 10);
      const col2 = items.length > 5, cw = col2 ? (W - 200) / 2 : W - 200;
      x.font = '500 42px "DM Sans"';
      items.forEach((t, k) => { const c = col2 ? k % 2 : 0, r = col2 ? Math.floor(k / 2) : k; const px = 100 + c * cw, py = y + 80 + r * 84;
        x.fillStyle = C.gold; x.beginPath(); x.arc(px + 22, py - 14, 22, 0, 7); x.fill(); x.fillStyle = C.navy; x.font = '700 26px "DM Sans"'; x.textAlign = 'center'; x.fillText('✓', px + 22, py - 5);
        x.fillStyle = C.navy; x.font = '500 40px "DM Sans"'; x.textAlign = 'left'; x.fillText(lineas(x, t, cw - 70)[0] || '', px + 62, py); });
      y = y + 80 + Math.ceil(items.length / (col2 ? 2 : 1)) * 84;
      x.font = 'italic 400 34px "DM Serif Display"'; x.fillStyle = '#7a6a4a'; x.textAlign = 'center'; x.fillText('+ sal, pimienta y aceite', W / 2, y + 10);
      x.fillStyle = C.gold; x.fillRect(W / 2 - 50, y + 60, 100, 4);
      y = bloque(x, 'Hoy cocinamos', { font: '600 {s}px "DM Sans"', size: 30, maxW: W - 180, maxLines: 1, y: y + 100, color: '#a08a5c', align: 'center', upper: true, spacing: 5 });
      bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 74, min: 44, maxW: W - 180, maxLines: 4, y: y + 24, color: C.navy, align: 'center', lh: 1.12 });
      marca(x, false);
    },
    qch_paso(x, h, img, logo) {
      fondoNavy(x, 71);
      let y;
      if (img) {
        cover(x, img, 0, 0, W, 760, h.foco, h.zoom, h.fx);
        const g = x.createLinearGradient(0, 480, 0, 780); g.addColorStop(0, 'rgba(13,27,42,0)'); g.addColorStop(1, C.navy); x.fillStyle = g; x.fillRect(0, 480, W, 300);
        const g2 = x.createLinearGradient(0, 0, 0, 330); g2.addColorStop(0, 'rgba(13,27,42,.6)'); g2.addColorStop(1, 'rgba(13,27,42,0)'); x.fillStyle = g2; x.fillRect(0, 0, W, 330);
        logoTop(x, logo, 150); y = 740;
      } else { logoTop(x, logo, 200); y = 440; }
      y = bloque(x, h.kicker, { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: img ? 76 : 90, min: 52, maxW: W - 180, maxLines: 2, y: y + 26, color: C.cream, align: 'center', lh: 1.1 });
      x.fillStyle = C.gold; x.fillRect(W / 2 - 50, y + 44, 100, 4);
      const pasos = String(h.texto || '').split('\n').map(s => s.trim()).filter(Boolean).slice(0, 5);
      const disp = 1480 - (y + 90); let size = img ? 44 : 52, bloques;
      const medir = s => { x.font = `400 ${s}px "DM Sans"`; return pasos.map(p => lineas(x, p, W - 290)); };
      do { bloques = medir(size); const alto = bloques.reduce((a, l) => a + l.length * size * 1.32 + 42, 0); if (alto <= disp || size <= 28) break; size -= 2; } while (true);
      let py = y + 100;
      bloques.forEach((ls_, k) => {
        x.fillStyle = C.gold; x.beginPath(); x.arc(125, py + size * .5, 30, 0, 7); x.fill();
        x.fillStyle = C.navy; x.font = '700 30px "DM Sans"'; x.textAlign = 'center'; x.fillText(String(k + 1), 125, py + size * .5 + 11);
        x.fillStyle = 'rgba(250,246,239,.92)'; x.font = `400 ${size}px "DM Sans"`; x.textAlign = 'left';
        ls_.forEach((l, j) => x.fillText(l, 180, py + size * .85 + j * size * 1.32));
        py += ls_.length * size * 1.32 + 42;
      });
      marca(x, true);
    },
    qch_cierre(x, h, img, logo) {
      fondoNavy(x, 89);
      if (img) { x.globalAlpha = .3; cover(x, img, 0, 0, W, H, h.foco, h.zoom, h.fx); x.globalAlpha = 1; x.fillStyle = 'rgba(13,27,42,.35)'; x.fillRect(0, 0, W, H); }
      logoTop(x, logo, 200);
      let y = 470;
      y = bloque(x, '✦ ' + (h.kicker || 'El toque de chef'), { font: '600 {s}px "DM Sans"', size: 32, maxW: W - 180, maxLines: 1, y, color: C.gold2, align: 'center', upper: true, spacing: 6 });
      y = bloque(x, h.titulo, { font: '400 {s}px "DM Serif Display"', size: 70, min: 44, maxW: W - 180, maxLines: 4, y: y + 30, color: C.cream, align: 'center', lh: 1.12 });
      const [toque, ...resto] = String(h.texto || '').split('\n');
      x.fillStyle = C.gold; x.font = '400 170px "DM Serif Display"'; x.textAlign = 'center'; x.fillText('“', W / 2, y + 170);
      y = bloque(x, toque, { font: 'italic 400 {s}px "DM Serif Display"', size: 54, min: 36, maxW: W - 200, maxLines: 4, y: y + 150, color: C.gold2, align: 'center', lh: 1.25 });
      bloque(x, resto.join(' '), { font: '400 {s}px "DM Sans"', size: 36, min: 28, maxW: W - 220, maxLines: 4, y: y + 40, color: 'rgba(250,246,239,.78)', align: 'center', lh: 1.4 });
      pastilla(x, '¿Te lo cocino yo? Escribime', 1530);
      marca(x, true);
    }
  });
})();
