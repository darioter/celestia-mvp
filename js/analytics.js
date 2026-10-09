/* Celestia · Google Analytics 4 + eventos del embudo de reservas */
(function(){
  var ID = 'G-578D98JM6M';
  var h = location.hostname;
  if (!/chefprivado\.ar$/.test(h)) return;            // solo producción (no previews ni local)
  var yaEsta = !!document.querySelector('script[src*="googletagmanager.com/gtag/js"]');
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function(){ dataLayer.push(arguments); };
  if (!yaEsta) {
    gtag('js', new Date());
    gtag('config', ID);
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(s);
  }

  // API simple para el resto del sitio
  window.celTrack = function(ev, params){ try { gtag('event', ev, params || {}); } catch(e){} };
  var pagina = location.pathname.indexOf('/aprende') === 0 ? 'clases' : location.pathname.indexOf('/blog') === 0 ? 'blog' : 'landing';

  // Clics a WhatsApp, Instagram y reseñas
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]'); if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/wa\.me|whatsapp/i.test(href)) celTrack('whatsapp_click', { pagina: pagina, texto: (a.textContent || '').trim().slice(0, 60) });
    else if (/instagram\.com/i.test(href)) celTrack('instagram_click', { pagina: pagina });
    else if (/g\.page|google\.com\/maps/i.test(href)) celTrack('resenas_click', { pagina: pagina });
  }, true);
  // window.open a WhatsApp (botones que no son links)
  var _open = window.open;
  window.open = function(u){ try { if (/wa\.me/.test(String(u))) celTrack('whatsapp_click', { pagina: pagina, origen: 'boton' }); } catch(e){} return _open.apply(window, arguments); };

  // Embudo de la landing / reserva (index.html)
  function envolver(nombre, fn){ var o = window[nombre]; if (typeof o !== 'function' || o._cel) return; var w = function(){ try { fn.apply(this, arguments); } catch(e){} return o.apply(this, arguments); }; w._cel = 1; window[nombre] = w; }
  function instrumentar(){
    envolver('exitBetaLanding', function(a){ celTrack('reserva_inicio', { servicio: a === 'semanal' ? 'chef_semanal' : a === 'reservar-7' ? '7_pasos' : a === 'reservar-3' ? '3_pasos' : 'experiencia', origen: 'landing' }); });
    envolver('blConfirmarDirecto', function(){ celTrack('reserva_inicio', { servicio: 'experiencia', origen: 'agenda_landing' }); });
    envolver('abrirConsultaCorporativa', function(){ celTrack('consulta_corporativa', {}); });
    envolver('blMenusAbrir', function(){ celTrack('menus_ejemplo_abrir', {}); });
    var nombresPaso = { 2: 'menu', 26: 'calculo', 25: 'detalle', 3: 'fecha', 4: 'datos', 5: 'confirmar' };
    envolver('goTo', function(n){ if (nombresPaso[n]) celTrack('reserva_paso', { servicio: 'experiencia', paso: nombresPaso[n] }); });
    var pasosMp = { 1: 'configurar', 2: 'fecha', 3: 'datos', 4: 'confirmar' };
    envolver('mpGoTo', function(n){ if (pasosMp[n]) celTrack('reserva_paso', { servicio: 'chef_semanal', paso: pasosMp[n] }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', instrumentar); else instrumentar();
  window.addEventListener('load', instrumentar);
})();
