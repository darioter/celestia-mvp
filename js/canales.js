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
      var s = r.querySelectorAll('span'); return s.length > 1 ? '*' + s[0].innerText.trim() + ':* ' + s[1].innerText.trim() : '';
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
      : 'Hola Daro! Quiero la experiencia ' + (nombre || 'en casa') + '.\n*Personas:* ' + pp + (dia ? '\n*Cuándo:* ' + dia : '') + (tot ? '\n*Total estimado:* ' + tot : '') + '\n¿Qué fechas tenés disponibles?';
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
})();
