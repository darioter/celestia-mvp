/* Admin · Bot de WhatsApp: simulador, estado de la conexión y charlas reales (tomar / devolver al bot) */
(function () {
  var esc = function (v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); };
  var wa = function (t) { return esc(t).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>'); };
  var SIM = [], simOcupado = false, convSel = null;

  async function token() { try { var s = await supa.auth.getSession(); return s.data.session && s.data.session.access_token; } catch (e) { return null; } }

  function pintarSim() {
    var el = document.getElementById('wb-sim-log'); if (!el) return;
    el.innerHTML = SIM.length ? SIM.map(function (m) {
      return '<div class="wb-m ' + m.rol + '"><div>' + wa(m.texto) + (m.resumen ? '<div class="wb-der">↪ Pasa a Daro: ' + esc(m.resumen) + '</div>' : '') + '</div></div>';
    }).join('') + (simOcupado ? '<div class="wb-m bot"><div class="wb-esc">escribiendo…</div></div>' : '')
      : '<div class="wb-vacio">Escribí como si fueras un cliente. Por ejemplo: <i>“Hola, ¿cuánto sale una cena de 3 pasos para 6 el sábado 21?”</i></div>';
    el.scrollTop = el.scrollHeight;
  }
  async function simEnviar() {
    var inp = document.getElementById('wb-sim-in'), t = inp.value.trim(); if (!t || simOcupado) return;
    SIM.push({ rol: 'cliente', texto: t }); inp.value = ''; simOcupado = true; pintarSim();
    try {
      var r = await fetch('/api/wa-bot', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-celestia-sim': '1', Authorization: 'Bearer ' + (await token()) }, body: JSON.stringify({ historial: SIM.map(function (m) { return { rol: m.rol, texto: m.texto }; }), nombre: document.getElementById('wb-sim-nom').value.trim() }) });
      var j = await r.json();
      SIM.push(j.error ? { rol: 'error', texto: 'Error: ' + j.error } : j.silencio ? { rol: 'daro', texto: j.texto } : { rol: 'bot', texto: j.texto, resumen: j.derivar ? j.resumen : '' });
    } catch (e) { SIM.push({ rol: 'error', texto: 'Error: ' + e.message }); }
    simOcupado = false; pintarSim();
  }

  async function estado() {
    var el = document.getElementById('wb-estado'); if (!el) return;
    try {
      var j = await (await fetch('/api/wa-bot?estado=1', { cache: 'no-store' })).json();
      var it = function (ok, t) { return '<span class="wb-st ' + (ok ? 'ok' : 'no') + '">' + (ok ? '✓' : '○') + ' ' + t + '</span>'; };
      var ae = document.getElementById('wb-alta-est'); if (ae) { ae.className = 'wb-st ' + (j.conectado ? 'ok' : 'no'); ae.textContent = j.conectado ? '✓ ' + j.conectado : '○ Sin conectar (usa el número de prueba)'; }
      el.innerHTML = it(j.claude, 'Claude (' + esc(j.modelo) + ')') + it(j.supabase, 'Base de charlas') + it(j.whatsapp, 'WhatsApp conectado') + it(j.verify, 'Webhook verificado') + it(j.firma, 'Firma de Meta');
    } catch (e) { el.innerHTML = '<span class="wb-st no">El endpoint todavía no responde</span>'; }
  }

  async function charlas() {
    var el = document.getElementById('wb-charlas'); if (!el) return;
    var r = await supa.from('wa_conversaciones').select('*').order('ultimo', { ascending: false }).limit(60);
    if (r.error) { el.innerHTML = '<div class="wb-vacio">' + (/relation|does not exist/i.test(r.error.message) ? 'Falta crear las tablas (supabase/wa_bot.sql).' : esc(r.error.message)) + '</div>'; return; }
    var D = (r.data || []).filter(function (c) { return c.tel === '0'; })[0];
    var L = (r.data || []).filter(function (c) { return c.tel !== '0'; });
    var dg = document.getElementById('wb-diag');
    if (!dg) { dg = document.createElement('div'); dg.id = 'wb-diag'; dg.style.cssText = 'font-size:12px;margin:0 0 10px;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.04)'; el.parentNode.insertBefore(dg, el); }
    dg.innerHTML = D ? '<b>Último aviso de Meta</b> · ' + new Date(D.ultimo).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '<br>' + esc(D.resumen) : '<b>Último aviso de Meta:</b> todavía no llegó ninguno.';
    el.innerHTML = L.length ? L.map(function (c) {
      return '<button type="button" class="wb-c' + (convSel === c.tel ? ' on' : '') + '" data-wb-tel="' + esc(c.tel) + '"><b>' + esc(c.nombre || '+' + c.tel) + '</b><span class="wb-badge ' + c.estado + '">' + (c.estado === 'bot' ? '🤖 Bot' : '👨‍🍳 Vos · bot en silencio') + '</span>' +
        (c.resumen ? '<small>' + esc(c.resumen) + '</small>' : '') + '<i>' + new Date(c.ultimo).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) + '</i></button>';
    }).join('') : '<div class="wb-vacio">Todavía no hay charlas reales. Aparecen acá cuando WhatsApp esté conectado.</div>';
  }
  async function verCharla(tel) {
    convSel = tel; charlas();
    var el = document.getElementById('wb-charla');
    var c = (await supa.from('wa_conversaciones').select('*').eq('tel', tel).single()).data || {};
    var m = (await supa.from('wa_mensajes').select('rol,texto,created_at').eq('tel', tel).order('created_at', { ascending: true }).limit(200)).data || [];
    await supa.from('wa_conversaciones').update({ no_leidos: 0 }).eq('tel', tel);
    el.innerHTML = '<div class="wb-ch-hd"><div><b>' + esc(c.nombre || '') + '</b> +' + esc(tel) + '</div><div>' +
      (c.estado === 'bot' ? '<button type="button" class="filter-btn" data-wb-estado="daro">👨‍🍳 La tomo yo · que el bot no responda</button>' : '<button type="button" class="filter-btn" data-wb-estado="bot">🤖 Devolver al bot</button>') +
      '<a class="filter-btn" style="text-decoration:none" target="_blank" rel="noopener" href="https://wa.me/' + esc(tel) + '">Abrir en WhatsApp</a></div></div>' +
      (c.resumen ? '<div class="wb-der">↪ ' + esc(c.resumen) + '</div>' : '') +
      '<div class="wb-log">' + m.map(function (x) { return '<div class="wb-m ' + x.rol + '"><div>' + wa(x.texto) + '<small>' + (x.rol === 'daro' ? 'Vos · ' : x.rol === 'bot' ? 'Bot · ' : '') + new Date(x.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) + '</small></div></div>'; }).join('') + '</div>';
    el.setAttribute('data-tel', tel);
  }
  document.addEventListener('click', async function (e) {
    var t = e.target.closest && e.target.closest('#wb-sim-go,#wb-sim-nueva,[data-wb-tel],[data-wb-estado],#wb-refrescar'); if (!t) return;
    if (t.id === 'wb-sim-go') simEnviar();
    else if (t.id === 'wb-sim-nueva') { SIM = []; pintarSim(); }
    else if (t.id === 'wb-refrescar') { estado(); charlas(); }
    else if (t.hasAttribute('data-wb-tel')) verCharla(t.getAttribute('data-wb-tel'));
    else if (t.hasAttribute('data-wb-estado')) {
      var tel = document.getElementById('wb-charla').getAttribute('data-tel'), est = t.getAttribute('data-wb-estado');
      await supa.from('wa_conversaciones').update(est === 'bot' ? { estado: 'bot', daro_ultimo: null } : { estado: 'daro', daro_ultimo: new Date().toISOString() }).eq('tel', tel);
      verCharla(tel);
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey && e.target && e.target.id === 'wb-sim-in') { e.preventDefault(); simEnviar(); } });
  /* ── Alta del número real por Embedded Signup (coexistencia con la app WhatsApp Business) ── */
  var APP_ID = '1894311805272831';
  var ES_CONFIG = ''; // ID de la configuración de "Inicio de sesión con Facebook para empresas" (no es secreto)
  var ALTA = {};
  function altaMsg(t, ok) { var m = document.getElementById('wb-alta-msg'); if (m) { m.textContent = t; m.style.color = ok === false ? '#ff9b9b' : ok ? '#7fd9a3' : ''; } }
  function cargarSDK() {
    return new Promise(function (res) {
      if (window.FB) return res();
      window.fbAsyncInit = function () { FB.init({ appId: APP_ID, autoLogAppEvents: true, xfbml: false, version: 'v27.0' }); res(); };
      var sc = document.createElement('script'); sc.async = true; sc.defer = true; sc.crossOrigin = 'anonymous'; sc.src = 'https://connect.facebook.net/es_LA/sdk.js'; document.head.appendChild(sc);
    });
  }
  window.addEventListener('message', function (ev) {
    if (!/(^|\.)facebook\.com$/.test(new URL(ev.origin).hostname)) return;
    try {
      var d = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
      if (!d || d.type !== 'WA_EMBEDDED_SIGNUP') return;
      if (/^FINISH/.test(d.event || '')) { ALTA.waba_id = d.data.waba_id; ALTA.phone_number_id = d.data.phone_number_id; altaEnviar(); }
      else if (d.event === 'CANCEL') altaMsg('Se cerró la ventana sin terminar' + (d.data && d.data.current_step ? ' (paso: ' + d.data.current_step + ')' : '') + '.', false);
      else if (d.event === 'ERROR') altaMsg('Meta devolvió un error: ' + ((d.data && d.data.error_message) || ''), false);
    } catch (e) {}
  });
  async function altaEnviar() {
    if (!ALTA.code || !ALTA.waba_id || ALTA.enviado) return;
    ALTA.enviado = true; altaMsg('Conectando…');
    try {
      var r = await fetch('/api/wa-bot', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-celestia-alta': '1', Authorization: 'Bearer ' + (await token()) }, body: JSON.stringify(ALTA) });
      var j = await r.json();
      if (j.ok) { altaMsg('✓ Conectado: ' + (j.numero || '') + (j.suscripto ? '' : ' (falta suscribir la app: avisale a Claude)'), true); estado(); }
      else { altaMsg(j.error || 'No se pudo conectar', false); ALTA.enviado = false; }
    } catch (e) { altaMsg(e.message, false); ALTA.enviado = false; }
  }
  document.addEventListener('click', async function (e) {
    if (!e.target.closest || !e.target.closest('#wb-alta-go')) return;
    if (!ES_CONFIG) { altaMsg('Falta el ID de configuración de Embedded Signup (lo cargamos cuando Meta apruebe la verificación).', false); return; }
    ALTA = {}; altaMsg('Abriendo la ventana de Meta…');
    await cargarSDK();
    FB.login(function (resp) {
      if (resp.authResponse && resp.authResponse.code) { ALTA.code = resp.authResponse.code; altaEnviar(); }
      else altaMsg('No se completó el inicio de sesión con Meta.', false);
    }, { config_id: ES_CONFIG, response_type: 'code', override_default_response_type: true, extras: { setup: {}, featureType: 'whatsapp_business_app_onboarding', sessionInfoVersion: '3' } });
  });

  window.cargarWaBot = function () { estado(); charlas(); pintarSim(); };
})();
