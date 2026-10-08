// Aviso por mail a Daro cuando entra una solicitud nueva.
// Requiere en Vercel → Settings → Environment Variables:
//   RESEND_API_KEY  (https://resend.com → API Keys)
//   NOTIFY_TO       (opcional, por defecto dario@dali-arquitectura.com.ar)
//   NOTIFY_FROM     (opcional, por defecto "Celestia <onboarding@resend.dev>";
//                    ese remitente de prueba solo envía al mail de tu cuenta de Resend)
export const config = { runtime: 'edge' };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...CORS } });

const esc = (v) => String(v ?? '')
  .slice(0, 600)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const money = (n) => {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 ? '$' + v.toLocaleString('es-AR') : '—';
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ ok: false, error: 'RESEND_API_KEY no configurado' }, 500);

  let d;
  try { d = await req.json(); } catch { return json({ ok: false, error: 'JSON inválido' }, 400); }
  if (!d || !d.ref || !d.nombre) return json({ ok: false, error: 'Faltan datos' }, 400);

  const fuera = !!d.fuera_amba;
  const tipo = d.tipo === 'semanal' ? 'Chef semanal' : d.tipo === 'clase' ? 'Clase · Tu cocina, nivel chef' : 'Experiencia';
  const telDigits = String(d.tel || '').replace(/\D/g, '');
  const telWA = telDigits ? (telDigits.startsWith('54') ? telDigits : '54' + telDigits) : '';

  const filas = [
    ['Ref', d.ref],
    ['Tipo', tipo],
    ['Servicio', d.menu],
    ['Fecha', d.fecha ? String(d.fecha).slice(0, 10) : ''],
    ['Turno', d.turno],
    ['Personas', d.personas],
    ['Dirección', d.dir],
    ['Zona', d.zona || (fuera ? 'Fuera de AMBA' : '')],
    ['Cliente', d.nombre],
    ['Teléfono', d.tel],
    ['Email', d.email],
    ['Ocasión', d.ocasion],
    ['Notas', d.notas],
    ['Honorario', money(d.honorario)],
    ['Ingredientes est.', money(d.ingredientes)],
    ['Total est.', money(d.total)],
  ].filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== '');

  const html = `
  <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0D1B2A">
    <div style="background:#0D1B2A;color:#E8C96B;padding:18px 22px;border-radius:10px 10px 0 0">
      <div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;opacity:.7">Celestia · Nueva solicitud</div>
      <div style="font-size:20px;margin-top:4px">${esc(d.nombre)} · ${esc(d.ref)}</div>
    </div>
    ${fuera ? `<div style="background:#FFF4DC;border:1px solid #E2A33E;padding:12px 16px;font-size:14px">
      ⚠️ <b>Fuera de CABA/GBA — traslado a cotizar</b> (${esc(d.zona)}). No pedir seña hasta confirmar traslado.</div>` : ''}
    <table style="width:100%;border-collapse:collapse;font-size:14px;background:#FAF6EF">
      ${filas.map(([k, v]) => `<tr><td style="padding:8px 16px;color:#6B5F4F;width:140px;border-bottom:1px solid #eee">${esc(k)}</td><td style="padding:8px 16px;border-bottom:1px solid #eee">${esc(v)}</td></tr>`).join('')}
    </table>
    <div style="padding:16px;background:#FAF6EF;border-radius:0 0 10px 10px">
      <a href="https://www.chefprivado.ar/admin" style="display:inline-block;background:#C9A84C;color:#0D1B2A;text-decoration:none;padding:10px 18px;border-radius:24px;font-weight:bold;font-size:13px">Validar en admin →</a>
      ${telWA ? `&nbsp;<a href="https://wa.me/${telWA}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:10px 18px;border-radius:24px;font-weight:bold;font-size:13px">WhatsApp cliente</a>` : ''}
    </div>
  </div>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.NOTIFY_FROM || 'Celestia <onboarding@resend.dev>',
      to: [process.env.NOTIFY_TO || 'dario@dali-arquitectura.com.ar'],
      reply_to: d.email && /.+@.+\..+/.test(d.email) ? d.email : undefined,
      subject: `${fuera ? '⚠️ [Traslado a cotizar] ' : ''}Nueva solicitud ${tipo} · ${String(d.nombre).slice(0, 60)} · ${d.ref}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    return json({ ok: false, error: 'Resend: ' + res.status, detail: err.slice(0, 300) }, 502);
  }
  return json({ ok: true });
}
