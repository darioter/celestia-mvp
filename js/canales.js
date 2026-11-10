/* Celestia · canales directos: WhatsApp con mensaje armado por servicio y registro de clics (GA4 vía celTrack).
   celWA('exp3')                  → abre WhatsApp con el mensaje base del servicio
   celWA('semanal', 'texto')      → con un mensaje propio (por ejemplo, lo elegido en un calculador)
   El botón flotante (#bl-wa-float) cambia su mensaje según la sección que se está mirando. */
(function () {
  var WA = '5491160410607';
  function en() { var h = document.documentElement; return h.classList.contains('lang-en') || h.lang === 'en'; }
  var M = {
    es: {
      general: 'Hola Daro! Tengo una consulta sobre Celestia.',
      reservar: 'Hola Daro! Quiero reservar una experiencia en casa. ¿Qué fechas tenés disponibles?',
      servicios: 'Hola Daro! Quiero consultar por tus servicios. ¿Me contás las opciones?',
      exp3: 'Hola Daro! Me interesa la experiencia de 3 pasos en casa. ¿Qué fechas tenés disponibles?',
      exp7: 'Hola Daro! Me interesa la degustación de 7 pasos en casa. ¿Qué fechas tenés disponibles?',
      semanal: 'Hola Daro! Me interesa el chef semanal. ¿Me contás cómo funciona y qué días tenés?',
      corp: 'Hola Daro! Quiero consultar por un evento para mi empresa.',
      menus: 'Hola Daro! Vi los menús de ejemplo y quiero armar uno para mi cena.',
      cajas: 'Hola Daro! Quiero pedir una caja o algo del mercadito.',
      faq: 'Hola Daro! Tengo una duda antes de reservar.'
    },
    en: {
      general: 'Hi Daro! I have a question about Celestia.',
      reservar: 'Hi Daro! I would like to book a dining experience at home. Which dates are available?',
      servicios: 'Hi Daro! I would like to know more about your services.',
      exp3: 'Hi Daro! I am interested in the 3-course experience at home. Which dates are available?',
      exp7: 'Hi Daro! I am interested in the 7-course tasting at home. Which dates are available?',
      semanal: 'Hi Daro! I am interested in the weekly chef. How does it work and which days do you have?',
      corp: 'Hi Daro! I would like to ask about a corporate event.',
      menus: 'Hi Daro! I saw the sample menus and would like to plan one for my dinner.',
      cajas: 'Hi Daro! I would like to order a box or something from the market.',
      faq: 'Hi Daro! I have a question before booking.'
    }
  };
  function msg(k) { var d = M[en() ? 'en' : 'es']; return d[k] || d.general; }
  function link(k, txt) { return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(txt || msg(k)); }
  function track(k, origen) { try { if (typeof celTrack === 'function') celTrack('wa_click', { servicio: k, origen: origen || 'boton' }); } catch (e) {} }
  window.celWAlink = link;
  window.celWA = function (k, txt, origen) { track(k, origen); window.open(link(k, txt), '_blank', 'noopener'); };

  /* Chef semanal / mise en place: manda lo que la persona eligió en el calculador */
  window.celWASemanal = function () {
    var rows = [].slice.call(document.querySelectorAll('#mp2-sum-rows > div')).map(function (r) {
      var s = r.querySelectorAll('span'); return s.length > 1 ? '*' + s[0].textContent.trim() + ':* ' + s[1].textContent.trim() : '';
    }).filter(Boolean);
    var hon = (document.getElementById('mpf-result') || {}).innerText || '', m = hon.match(/\$\s?[\d.]+/);
    var mise = typeof mpState !== 'undefined' && mpState.modo === 'mise';
    var t = en()
      ? 'Hi Daro! I am interested in the ' + (mise ? 'mise en place service' : 'weekly chef') + ':\n' + rows.join('\n') + (m ? '\n*Estimated fee:* ' + m[0] : '') + '\nWhich days do you have?'
      : 'Hola Daro! Me interesa ' + (mise ? 'el mise en place' : 'el chef semanal') + ':\n' + rows.join('\n') + (m ? '\n*Honorario estimado:* ' + m[0] : '') + '\n¿Qué días tenés?';
    window.celWA(mise ? 'mise' : 'semanal', t, 'calculador');
  };

  /* Experiencias de 3 y 7 pasos: arma el mensaje con lo elegido en el calculador del menú */
  window.celWAExp = function (menuId) {
    var sel = document.getElementById('calc-pp-' + menuId), res = document.getElementById('calc-result-' + menuId);
    var nombre = ''; try { var mb = MENUS.find(function (x) { return x.id === menuId; }); nombre = mb ? (typeof getMenuTraducido === 'function' ? getMenuTraducido(mb) : mb).nombre : ''; } catch (e) {}
    var pp = sel ? sel.value : '', tot = res ? ((res.querySelector('.calc-total-value') || {}).innerText || '') : '';
    var dia = res ? ((res.querySelector('.calc-pp') || {}).innerText || '').split('·').slice(1).join('·').trim() : '';
    var t = en()
      ? 'Hi Daro! I would like the ' + (nombre || 'dining experience') + ' at home.\n*Guests:* ' + pp + (dia ? '\n*When:* ' + dia : '') + (tot ? '\n*Estimated total:* ' + tot : '') + '\nWhich dates are available?'
      : 'Hola Daro! Me interesa ' + (nombre ? 'el ' + nombre.charAt(0).toLowerCase() + nombre.slice(1) : 'una experiencia') + ' en casa.\n*Personas:* ' + pp + (dia ? '\n*Cuándo:* ' + dia : '') + (tot ? '\n*Total estimado:* ' + tot : '') + '\n¿Qué fechas tenés disponibles?';
    window.celWA('exp' + menuId, t, 'calculador');
  };

  /* Botón flotante: el mensaje acompaña la sección que se está mirando */
  var SECC = [['bl-agenda', 'reservar'], ['bl-servicios', 'servicios'], ['bl-menus', 'menus'], ['bl-faq', 'faq']];
  var actual = 'general';
  function sec() {
    var f = document.getElementById('bl-wa-float'); if (!f) return;
    var y = innerHeight * 0.5, k = 'general';
    for (var i = 0; i < SECC.length; i++) {
      var el = document.getElementById(SECC[i][0]); if (!el || !el.offsetParent) continue;
      var r = el.getBoundingClientRect(); if (r.top <= y && r.bottom >= y) { k = SECC[i][1]; break; }
    }
    if (k !== actual) { actual = k; f.href = link(k); f.setAttribute('data-wa', k); }
  }
  var tk = 0;
  addEventListener('scroll', function () { if (!tk) { tk = 1; requestAnimationFrame(function () { tk = 0; sec(); }); } }, { passive: true });
  document.addEventListener('click', function (e) {
    var f = e.target.closest && e.target.closest('#bl-wa-float'); if (f) track(f.getAttribute('data-wa') || 'general', 'flotante');
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sec); else sec();

  /* Reserva corta: fecha del calendario + personas, experiencia y turno → WhatsApp con todo armado */
  var RC = null;
  function fechaLarga(k) {
    if (!k) return '';
    var d = new Date(k + 'T12:00:00');
    return d.toLocaleDateString(en() ? 'en-US' : 'es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  function rcArmar() {
    if (RC) return RC;
    var E = en();
    var T = E ? { t: 'Book on WhatsApp', s: 'Two quick choices and I will reply to plan the menu with you.', f: 'Date', fp: 'Any date (tell me which ones work)', p: 'Guests', x: 'Experience', x3: '3 courses', x7: '7 courses', xn: 'Not sure yet', h: 'Time', hc: 'Dinner', ha: 'Lunch', go: 'Send on WhatsApp', nota: 'Booking is free. The date is confirmed with the deposit.' }
              : { t: 'Reservá por WhatsApp', s: 'Dos elecciones rápidas y te respondo para armar el menú juntos.', f: 'Fecha', fp: 'Sin fecha fija (te cuento cuáles me sirven)', p: 'Personas', x: 'Experiencia', x3: '3 pasos', x7: '7 pasos', xn: 'Todavía no sé', h: 'Turno', hc: 'Cena', ha: 'Almuerzo', go: 'Enviar por WhatsApp', nota: 'Reservar no tiene costo. La fecha queda confirmada con la seña.' };
    var pp = ''; for (var i = 2; i <= 12; i++) pp += '<button type="button" data-v="' + i + '"' + (i === 4 ? ' class="on"' : '') + '>' + i + '</button>';
    var w = document.createElement('div'); w.id = 'cel-rc'; w.hidden = true; w.setAttribute('data-no-tr', '');
    w.innerHTML = '<div class="rc-bg" data-x></div><div class="rc-box" role="dialog" aria-modal="true" aria-labelledby="rc-t"><button type="button" class="rc-x" data-x aria-label="Cerrar">&times;</button>' +
      '<small class="rc-k">✦ ' + (E ? 'Two steps' : 'En 2 pasos') + '</small><h3 id="rc-t">' + T.t + '</h3><p class="rc-s">' + T.s + '</p>' +
      '<div class="rc-f"><span>' + T.f + '</span><b id="rc-fecha"></b></div>' +
      '<div class="rc-g"><span>' + T.p + '</span><div class="rc-ch rc-pp" data-k="pp">' + pp + '<button type="button" data-v="12+">12+</button></div></div>' +
      '<div class="rc-g"><span>' + T.x + '</span><div class="rc-ch" data-k="x"><button type="button" data-v="3" class="on">' + T.x3 + '</button><button type="button" data-v="7">' + T.x7 + '</button><button type="button" data-v="?">' + T.xn + '</button></div></div>' +
      '<div class="rc-g"><span>' + T.h + '</span><div class="rc-ch" data-k="h"><button type="button" data-v="c" class="on">' + T.hc + '</button><button type="button" data-v="a">' + T.ha + '</button></div></div>' +
      '<button type="button" class="rc-go">' + '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Z"/></svg>' + T.go + '</button>' +
      '<p class="rc-n">' + T.nota + '</p></div>';
    document.body.appendChild(w);
    w.addEventListener('click', function (e) {
      if (e.target.closest('[data-x]')) { rcCerrar(); return; }
      var b = e.target.closest('.rc-ch button'); if (b) { [].forEach.call(b.parentNode.children, function (x) { x.classList.toggle('on', x === b); }); return; }
      if (e.target.closest('.rc-go')) rcEnviar(T);
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !w.hidden) rcCerrar(); });
    RC = w; return w;
  }
  function val(k) { var b = RC.querySelector('.rc-ch[data-k="' + k + '"] .on'); return b ? b.getAttribute('data-v') : ''; }
  function rcEnviar(T) {
    var E = en(), f = RC.getAttribute('data-fecha'), pp = val('pp'), x = val('x'), h = val('h');
    var xs = E ? { '3': 'the 3-course experience', '7': 'the 7-course tasting', '?': 'an experience (not sure which yet)' } : { '3': 'la experiencia de 3 pasos', '7': 'la degustación de 7 pasos', '?': 'una experiencia (todavía no sé cuál)' };
    var t = E
      ? 'Hi Daro! I would like to book ' + xs[x] + ' at home.\n*Date:* ' + (f ? fechaLarga(f) : 'flexible') + '\n*Time:* ' + (h === 'a' ? 'lunch' : 'dinner') + '\n*Guests:* ' + pp + '\nCan we plan the menu?'
      : 'Hola Daro! Quiero reservar ' + xs[x] + ' en casa.\n*Fecha:* ' + (f ? fechaLarga(f) : 'a definir') + '\n*Turno:* ' + (h === 'a' ? 'almuerzo' : 'cena') + '\n*Personas:* ' + pp + '\n¿Armamos el menú?';
    window.celWA('reserva_corta', t, 'reserva_2_pasos'); rcCerrar();
  }
  function rcCerrar() { if (RC) { RC.hidden = true; document.documentElement.classList.remove('rc-abierto'); } }
  window.celReservaCorta = function (fecha) {
    var w = rcArmar(); w.setAttribute('data-fecha', fecha || '');
    var E = en(); w.querySelector('#rc-fecha').textContent = fecha ? fechaLarga(fecha) : (E ? 'Flexible — tell me which dates work' : 'A definir: contame qué fechas te sirven');
    w.hidden = false; document.documentElement.classList.add('rc-abierto');
    try { if (typeof celTrack === 'function') celTrack('reserva_corta_abrir', { fecha: fecha || '' }); } catch (e) {}
  };
  /* el link "o reservá por WhatsApp" debajo de cada calendario */
  function rcLinks() {
    [].forEach.call(document.querySelectorAll('.cc-ft'), function (ft) {
      if (ft.nextElementSibling && ft.nextElementSibling.classList.contains('cc-wa')) return;
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cc-wa'; b.setAttribute('data-no-tr', '');
      b.innerHTML = en() ? 'or book on <u>WhatsApp in 2 steps</u>' : 'o reservá por <u>WhatsApp en 2 pasos</u>';
      b.addEventListener('click', function (e) {
        e.stopPropagation(); var root = ft.parentNode, d = root.querySelector('.cc-d.on'), k = d && (d.getAttribute('data-k') || d.dataset.k);
        window.celReservaCorta(k || '');
      });
      ft.parentNode.insertBefore(b, ft.nextSibling);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { setTimeout(rcLinks, 300); }); else setTimeout(rcLinks, 300);
  setTimeout(rcLinks, 2500);
})();
