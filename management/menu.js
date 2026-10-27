/* Menú móvil de Celestia Management: vuelve a Chef Privado y lleva a cada sección.
   Se inyecta en el header de cada página (header.hdr, .cm-barra, .nav-inner o el del wordmark). */
(function(){
  if (window.__cmMenu) return; window.__cmMenu = 1;
  var hdr = document.querySelector('header.hdr') || document.querySelector('.cm-barra') || document.querySelector('nav .nav-inner') ||
            (document.querySelector('.mf-wordmark') || {}).parentElement;
  if (!hdr) return;

  var host = location.hostname;
  var CHEF = (/chefprivado\.ar$/.test(host) || /^(localhost|127\.0\.0\.1)$/.test(host)) ? '/' : 'https://www.chefprivado.ar/';
  var path = location.pathname.replace(/\/(index\.html)?$/, '');
  var enMgmt = path === '/management';
  var sec = function (id) { return (enMgmt ? '' : '/management') + '#' + id; };

  var LINKS = [
    ['Inicio', '/management', '◎', !location.hash && enMgmt],
    ['El diagnóstico', sec('diagnostico'), '◇'],
    ['Cursos', sec('cursos'), '▤'],
    ['Guía de costeo', '/management/guia', '$', path === '/management/guia'],
    ['Quién soy', sec('quien'), '☺'],
    ['Contacto', sec('contacto'), '✉'],
    ['Notas de gestión en el blog', '/blog#trastienda', '✎'],
    ['Acceso alumnos', '/management/login', '⚿', path === '/management/login']
  ];

  var css = document.createElement('style');
  css.textContent =
    '.cmm-btn{display:none;flex-direction:column;justify-content:center;gap:4px;flex:none;width:38px;height:38px;margin-left:8px;padding:0 9px;border-radius:10px;border:1px solid rgba(201,168,76,.35);background:none;cursor:pointer}' +
    '.cmm-btn i{display:block;height:1.5px;background:#E8C97A;border-radius:2px;transition:transform .25s,opacity .2s}' +
    '.cmm-btn[aria-expanded=true] i:nth-child(1){transform:translateY(5.5px) rotate(45deg)}.cmm-btn[aria-expanded=true] i:nth-child(2){opacity:0}.cmm-btn[aria-expanded=true] i:nth-child(3){transform:translateY(-5.5px) rotate(-45deg)}' +
    '@media(max-width:960px){.cmm-btn{display:flex}}' +
    '@media(max-width:600px){header.hdr{gap:8px}header.hdr .lg img{height:38px}header.hdr nav a.cta{font-size:12.5px;padding:8px 13px;white-space:nowrap}.cm-barra nav a.cta{font-size:12.5px;padding:8px 12px;white-space:nowrap}nav:has(>.nav-inner){padding:0 14px}.nav-inner{gap:8px}.nav-inner .nav-logo img{height:38px;width:auto}}' +
    '.cmm-ov{position:fixed;inset:0;z-index:100000;background:rgba(5,10,16,.55);opacity:0;pointer-events:none;transition:opacity .25s}' +
    '.cmm-ov.on{opacity:1;pointer-events:auto}' +
    '.cmm-p{position:fixed;top:0;right:0;bottom:0;z-index:100001;width:min(340px,88vw);background:#0D1B2A;color:#FAF6EF;border-left:1px solid rgba(201,168,76,.25);box-shadow:-20px 0 50px rgba(0,0,0,.4);transform:translateX(102%);transition:transform .3s;display:flex;flex-direction:column;font-family:"DM Sans",system-ui,sans-serif;overflow-y:auto;-webkit-overflow-scrolling:touch}' +
    '.cmm-p.on{transform:none}' +
    '.cmm-top{display:flex;align-items:center;justify-content:space-between;padding:14px 16px 10px}' +
    '.cmm-top span{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#E8C96A}' +
    '.cmm-x{width:40px;height:40px;border-radius:50%;border:1px solid rgba(250,246,239,.2);background:transparent;color:#FAF6EF;font-size:16px;cursor:pointer}' +
    '.cmm-chef{display:flex;align-items:center;gap:12px;margin:4px 16px 14px;padding:14px;border-radius:16px;text-decoration:none;color:#0D1B2A;background:linear-gradient(135deg,#E8C96A,#C9A84C)}' +
    '.cmm-chef b{display:block;font:400 19px/1.15 "DM Serif Display",Georgia,serif}' +
    '.cmm-chef small{font-size:12px;opacity:.75}' +
    '.cmm-chef i{font-style:normal;font-size:20px;width:36px;height:36px;border-radius:50%;background:#0D1B2A;color:#E8C96A;display:flex;align-items:center;justify-content:center;flex:none}' +
    '.cmm-l{list-style:none;margin:0;padding:0 8px}' +
    '.cmm-l a{display:flex;align-items:center;gap:12px;padding:13px 10px;border-radius:12px;color:rgba(250,246,239,.9);text-decoration:none;font-size:15.5px;font-weight:500;border-bottom:1px solid rgba(250,246,239,.06)}' +
    '.cmm-l a i{font-style:normal;width:26px;text-align:center;color:#E8C96A;font-size:15px}' +
    '.cmm-l a:hover,.cmm-l a[aria-current=page]{background:rgba(232,201,106,.1);color:#fff}' +
    '.cmm-cta{display:block;margin:16px;padding:14px;border-radius:999px;text-align:center;text-decoration:none;font-weight:700;font-size:15px;color:#0D1B2A;background:linear-gradient(135deg,#E8C96A,#C9A84C)}' +
    '.cmm-pie{margin-top:auto;padding:14px 18px 22px;font-size:12px;color:rgba(250,246,239,.45)}' +
    '.cmm-btn:focus-visible,.cmm-x:focus-visible,.cmm-p a:focus-visible{outline:3px solid #C9A84C;outline-offset:2px}' +
    'html.cmm-lock,html.cmm-lock body{overflow:hidden}';
  document.head.appendChild(css);

  var btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'cmm-btn';
  btn.setAttribute('aria-label', 'Menú'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'cmm-p');
  btn.innerHTML = '<i></i><i></i><i></i>';
  hdr.appendChild(btn);

  var ov = document.createElement('div'); ov.className = 'cmm-ov';
  var p = document.createElement('div'); p.className = 'cmm-p'; p.id = 'cmm-p'; p.setAttribute('role', 'navigation'); p.setAttribute('aria-label', 'Menú de Celestia Management'); p.setAttribute('aria-hidden', 'true');
  p.innerHTML =
    '<div class="cmm-top"><span>✦ Celestia Management</span><button type="button" class="cmm-x" aria-label="Cerrar menú">✕</button></div>' +
    '<a class="cmm-chef" href="' + CHEF + '"><i aria-hidden="true">←</i><span><b>Celestia · Chef privado</b><small>Volver al sitio principal</small></span></a>' +
    '<ul class="cmm-l">' + LINKS.map(function (l) {
      return '<li><a href="' + l[1] + '"' + (l[3] ? ' aria-current="page"' : '') + '><i aria-hidden="true">' + l[2] + '</i>' + l[0] + '</a></li>';
    }).join('') + '</ul>' +
    '<a class="cmm-cta" href="' + sec('diagnostico') + '">Armar mi presupuesto →</a>' +
    '<div class="cmm-pie">Consultoría para restaurantes, cafés y emprendimientos gastronómicos.</div>';
  document.body.appendChild(ov); document.body.appendChild(p);

  function track(ev, data) { try { window.celTrack && celTrack(ev, data || {}); } catch (e) {} }
  function abrir() {
    ov.classList.add('on'); p.classList.add('on'); document.documentElement.classList.add('cmm-lock');
    btn.setAttribute('aria-expanded', 'true'); p.setAttribute('aria-hidden', 'false');
    setTimeout(function () { p.querySelector('.cmm-chef').focus(); }, 60); track('mgmt_menu_abrir');
  }
  function cerrar(foco) {
    ov.classList.remove('on'); p.classList.remove('on'); document.documentElement.classList.remove('cmm-lock');
    btn.setAttribute('aria-expanded', 'false'); p.setAttribute('aria-hidden', 'true'); if (foco) btn.focus();
  }
  btn.addEventListener('click', abrir);
  ov.addEventListener('click', function () { cerrar(true); });
  p.querySelector('.cmm-x').addEventListener('click', function () { cerrar(true); });
  p.addEventListener('click', function (e) {
    var a = e.target.closest('a'); if (!a) return;
    track('mgmt_menu_link', { destino: a.getAttribute('href') }); cerrar(false);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && p.classList.contains('on')) cerrar(true); });
  addEventListener('resize', function () { if (innerWidth > 960 && p.classList.contains('on')) cerrar(false); });
})();
