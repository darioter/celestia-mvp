// Mail de recuperación de carrito abandonado (Cajas Celestia).
// Lo dispara Daro desde Admin → Cajas → Carritos. Solo funciona con la sesión del admin.
// Usa las mismas variables que /api/notify: RESEND_API_KEY, NOTIFY_FROM, NOTIFY_TO.
// Ojo: para mandar a clientes, NOTIFY_FROM tiene que ser de un dominio verificado en Resend
// (por ejemplo "Celestia <hola@chefprivado.ar>"); el remitente de prueba solo envía a tu propio mail.
export const config = { runtime: 'edge' };

const SUPA_URL = 'https://qolpnuscpmzqeacshfvu.supabase.co';
const ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFvbHBudXNjcG16cWVhY3NoZnZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NjQ3OTQsImV4cCI6MjA5MTM0MDc5NH0.BJOz5Gwkeb1NqID_gkGKD5YlymifMtOwaf8iQMaBCx8';
const ADMIN = 'dario@dali-arquitectura.com.ar';
const SITE = 'https://www.chefprivado.ar';

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const esc = (v) => String(v ?? '').slice(0, 300).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const money = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-AR');

export default async function handler(req) {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ ok: false, error: 'Falta RESEND_API_KEY en Vercel' }, 500);

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return json({ ok: false, error: 'Sin sesión' }, 401);
  const u = await fetch(SUPA_URL + '/auth/v1/user', { headers: { apikey: ANON, Authorization: 'Bearer ' + token } });
  const user = u.ok ? await u.json() : null;
  if (!user || String(user.email || '').toLowerCase() !== ADMIN) return json({ ok: false, error: 'No autorizado' }, 403);

  let d; try { d = await req.json(); } catch { return json({ ok: false, error: 'JSON inválido' }, 400); }
  const id = String(d?.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json({ ok: false, error: 'Carrito inválido' }, 400);
  const cupon = String(d?.cupon || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 30);

  const H = { apikey: ANON, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
  const r = await fetch(SUPA_URL + '/rest/v1/carritos_cajas?id=eq.' + id + '&select=*', { headers: H });
  const c = r.ok ? (await r.json())[0] : null;
  if (!c) return json({ ok: false, error: 'No encontré el carrito' }, 404);
  if (!c.email || !/.+@.+\..+/.test(c.email)) return json({ ok: false, error: 'El carrito no tiene email' }, 400);

  const link = SITE + '/cajas/?c=' + id + (cupon ? '&cupon=' + encodeURIComponent(cupon) : '') + '&utm_source=email&utm_medium=recupero&utm_campaign=carrito';
  const nombre = String(c.nombre || '').split(' ')[0];
  const items = (c.items || []).map((x) => `<tr><td style="padding:8px 0;border-bottom:1px solid #EDE6D8;font-size:15px;color:#0D1B2A">${x.cant > 1 ? x.cant + ' × ' : ''}${esc(x.nombre)}<br><span style="color:#8a8a8a;font-size:13px">${esc(x.variante)}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #EDE6D8;font-size:15px;color:#0D1B2A;white-space:nowrap">${money(x.precio * x.cant)}</td></tr>`).join('');
  const html = `<div style="background:#FAF6EF;padding:28px 12px;font-family:Helvetica,Arial,sans-serif">
  <div style="max-width:540px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;border:1px solid #EDE6D8">
    <div style="background:#0D1B2A;padding:22px 26px;color:#E8C96A;font-size:12px;letter-spacing:.2em;text-transform:uppercase">✦ Cajas Celestia</div>
    <div style="padding:26px">
      <h1 style="font-family:Georgia,serif;font-weight:400;color:#0D1B2A;font-size:28px;margin:0 0 10px">${nombre ? 'Hola ' + esc(nombre) + ', t' : 'T'}u caja te está esperando</h1>
      <p style="color:#555;font-size:15px;line-height:1.55;margin:0 0 18px">Armaste un pedido y quedó sin terminar. Te lo guardé tal cual, así lo completás en un minuto.${cupon ? ` Y para darte un empujoncito, te dejo el cupón <b style="color:#0D1B2A">${esc(cupon)}</b>, ya aplicado en el link.` : ''}</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items}
        <tr><td style="padding:12px 0 0;font-weight:bold;color:#0D1B2A">Subtotal</td><td align="right" style="padding:12px 0 0;font-family:Georgia,serif;font-size:22px;color:#0D1B2A">${money(c.subtotal)}</td></tr></table>
      <div style="text-align:center;margin:26px 0 8px"><a href="${link}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-weight:bold;text-decoration:none;padding:15px 30px;border-radius:999px;font-size:16px">Terminar mi pedido</a></div>
      <p style="color:#8a8a8a;font-size:13px;text-align:center;margin:14px 0 0">¿Dudas con la fecha, el menú o una alergia? Respondé este mail o escribime al WhatsApp +54 9 11 6041-0607.<br>Daro · Celestia Chef Privado</p>
    </div></div></div>`;

  const send = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM || 'Celestia <onboarding@resend.dev>',
      to: [c.email],
      reply_to: process.env.NOTIFY_TO || ADMIN,
      subject: (nombre ? nombre + ', t' : 'T') + 'u caja Celestia te está esperando',
      html,
    }),
  });
  if (!send.ok) {
    const t = await send.text();
    return json({ ok: false, error: 'Resend: ' + t.slice(0, 200) }, 502);
  }
  await fetch(SUPA_URL + '/rest/v1/carritos_cajas?id=eq.' + id, {
    method: 'PATCH', headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify({ estado: 'contactado', recordatorios: (c.recordatorios || 0) + 1, ultimo_recordatorio: new Date().toISOString() }),
  });
  return json({ ok: true });
}
