/* Celestia · botón flotante de WhatsApp para las páginas internas (la home tiene el suyo, #bl-wa-float).
   El mensaje cambia según la página y cada clic se registra en GA4 (wa_click, origen: flotante). */
(function () {
  if (document.getElementById('bl-wa-float') || document.getElementById('cel-wa-f')) return;
  var WA = '5491160410607';
  var en = (document.documentElement.lang || '').indexOf('en') === 0 || document.documentElement.classList.contains('lang-en') || /^\/en(\/|$)/.test(location.pathname);
  var p = location.pathname.replace(/^\/en(?=\/)/, '');
  var R = [
    [/^\/cajas\/pedido/, 'cajas', 'Hola Daro! Tengo una consulta sobre mi pedido de cajas.', 'Hi Daro! I have a question about my box order.'],
    [/^\/cajas/, 'cajas', 'Hola Daro! Quiero consultar por las cajas.', 'Hi Daro! I would like to ask about the boxes.'],
    [/^\/(extras|e)\//, 'extras', 'Hola Daro! Quiero sumar algo a mi pedido.', 'Hi Daro! I would like to add something to my order.'],
    [/^\/chef-semanal/, 'semanal', 'Hola Daro! Me interesa el chef semanal. ¿Me contás cómo funciona y qué días tenés?', 'Hi Daro! I am interested in the weekly chef. How does it work and which days do you have?'],
    [/^\/menu-degustacion-7-pasos/, 'exp7', 'Hola Daro! Me interesa la degustación de 7 pasos en casa. ¿Qué fechas tenés disponibles?', 'Hi Daro! I am interested in the 7-course tasting at home. Which dates are available?'],
    [/^\/cena-romantica-en-casa/, 'romantica', 'Hola Daro! Quiero una cena romántica en casa. ¿Qué fechas tenés disponibles?', 'Hi Daro! I would like a romantic dinner at home. Which dates are available?'],
    [/^\/chef-privado-en-vacaciones/, 'vacaciones', 'Hola Daro! Quiero un chef privado en mis vacaciones. Lugar: … Fechas: … Somos: …', 'Hi Daro! I would like a private chef on my holiday. Place: … Dates: … We are: …'],
    [/^\/eventos-corporativos/, 'corp', 'Hola Daro! Quiero consultar por un evento para mi empresa.', 'Hi Daro! I would like to ask about a corporate event.'],
    [/^\/aprende/, 'clases', 'Hola Daro! Me interesan las clases de cocina. ¿Me contás cómo funcionan?', 'Hi Daro! I am interested in the cooking classes. How do they work?'],
    [/^\/management/, 'management', 'Hola Daro! Quiero consultar por la consultoría para mi negocio gastronómico.', 'Hi Daro! I would like to ask about consulting for my food business.'],
    [/^\/blog/, 'blog', 'Hola Daro! Leí el blog y tengo una consulta.', 'Hi Daro! I read the blog and have a question.'],
    [/^\/que-comemos-hoy/, 'general', 'Hola Daro! Tengo una consulta sobre Celestia.', 'Hi Daro! I have a question about Celestia.']
  ];
  var k = 'general', t = en ? 'Hi Daro! I have a question about Celestia.' : 'Hola Daro! Tengo una consulta sobre Celestia.';
  for (var i = 0; i < R.length; i++) if (R[i][0].test(p)) { k = R[i][1]; t = en ? R[i][3] : R[i][2]; break; }
  var css = '#cel-wa-f{position:fixed;right:20px;bottom:20px;z-index:950;display:flex;align-items:center;gap:8px;background:#25D366;color:#fff;font:600 14px "DM Sans",sans-serif;text-decoration:none;padding:12px 18px;border-radius:999px;box-shadow:0 10px 26px rgba(37,211,102,.35);transition:transform .2s}' +
    '#cel-wa-f:hover{transform:translateY(-2px)}#cel-wa-f svg{flex:none}' +
    '@media(max-width:600px){#cel-wa-f span{display:none}#cel-wa-f{padding:13px;right:16px;bottom:16px}body.cel-wa-alto #cel-wa-f{bottom:84px}}' +
    '@media print{#cel-wa-f{display:none}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  var a = document.createElement('a'); a.id = 'cel-wa-f'; a.target = '_blank'; a.rel = 'noopener'; a.setAttribute('data-no-tr', '');
  a.href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(t);
  a.setAttribute('aria-label', en ? 'Message on WhatsApp' : 'Escribir por WhatsApp');
  a.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21c5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.8 14.06c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.13.09-1.82-.11-.42-.13-.96-.31-1.65-.61-2.9-1.25-4.8-4.18-4.94-4.37-.15-.2-1.18-1.57-1.18-3s.75-2.13 1.01-2.42c.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.58.82 2 .89 2.15.07.15.12.32.02.51-.1.2-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.76 1.25 1.63 2.03 1.12 1 2.07 1.31 2.36 1.46.29.15.46.12.63-.07.17-.2.73-.85.93-1.14.2-.29.39-.24.66-.15.27.1 1.7.8 1.99.95.29.15.49.22.56.34.07.12.07.7-.17 1.38Z"/></svg><span>' + (en ? 'Questions? Message me' : '¿Dudas? Escribime') + '</span>';
  a.addEventListener('click', function () { try { if (typeof celTrack === 'function') celTrack('wa_click', { servicio: k, origen: 'flotante' }); } catch (e) {} });
  function poner() { document.body.appendChild(a); if (document.getElementById('flot')) document.body.classList.add('cel-wa-alto'); }
  if (document.body) poner(); else document.addEventListener('DOMContentLoaded', poner);
})();
