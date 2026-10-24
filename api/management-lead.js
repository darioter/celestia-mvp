// Celestia Management · Diagnóstico con la rueda de 8 módulos.
// Recibe la selección, recalcula el presupuesto en el servidor (no confía en el front),
// manda el presupuesto por mail al cliente y el aviso a Daro.
// Variables: RESEND_API_KEY, NOTIFY_FROM (dominio verificado en Resend para mandar a clientes), NOTIFY_TO.
export const config = { runtime: 'edge' };

import { MODULOS, PRECIOS, USD_ARS } from '../js/management-data.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });
const esc = (v) => String(v ?? '').slice(0, 400).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ars = (n) => '$' + Math.round(n).toLocaleString('es-AR');
const usd = (n) => 'USD ' + Math.round(n / USD_ARS).toLocaleString('es-AR');

async function mandar(key, payload) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return r.ok ? null : (await r.text()).slice(0, 300);
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const key = process.env.RESEND_API_KEY;
  if (!key) return json({ ok: false, error: 'RESEND_API_KEY no configurado' }, 500);

  let d;
  try { d = await req.json(); } catch { return json({ ok: false, error: 'JSON inválido' }, 400); }
  const nombre = String(d?.nombre || '').trim();
  const email = String(d?.email || '').trim();
  const tel = String(d?.tel || '').trim();
  const negocio = String(d?.negocio || '').trim();
  const etapa = String(d?.etapa || '').trim();
  if (nombre.length < 2 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ ok: false, error: 'Faltan nombre o email válido' }, 400);

  // sel: { "3": [0,2], "6": [1] }  (índice de módulo 1..8 → índices de temas)
  const items = [];
  for (const [mk, arr] of Object.entries(d?.sel || {})) {
    const m = MODULOS.find((x) => x.n === Number(mk));
    if (!m || !Array.isArray(arr)) continue;
    const temas = [...new Set(arr.map(Number))].filter((i) => m.c[i] !== undefined);
    if (!temas.length) continue;
    const sub = temas.reduce((s, i) => s + (PRECIOS[`${m.n}-${i}`] || 0), 0);
    items.push({ m, temas, sub });
  }
  if (!items.length) return json({ ok: false, error: 'No hay módulos seleccionados' }, 400);
  items.sort((a, b) => a.m.n - b.m.n);
  const total = items.reduce((s, x) => s + x.sub, 0);
  const ref = 'CM-' + Date.now().toString(36).toUpperCase();

  const filas = items.map(({ m, temas, sub }) => `
    <tr><td style="padding:14px 18px;border-bottom:1px solid #E7DFCF;vertical-align:top">
      <div style="font-size:12px;letter-spacing:.12em;color:#A08A5C;text-transform:uppercase">Módulo ${m.n}</div>
      <div style="font-family:Georgia,serif;font-size:19px;color:#0D1B2A;margin:2px 0 6px">${esc(m.t)}</div>
      ${temas.map((i) => `<div style="font-size:14px;color:#4a4a5a;padding:2px 0">✦ ${esc(m.c[i])} <span style="color:#A08A5C">· ${ars(PRECIOS[`${m.n}-${i}`])}</span></div>`).join('')}
      <div style="font-size:13px;color:#2F7A4F;margin-top:6px">${esc(m.r)}</div>
    </td><td style="padding:14px 18px;border-bottom:1px solid #E7DFCF;text-align:right;vertical-align:top;font-weight:bold;color:#0D1B2A;white-space:nowrap">${ars(sub)}</td></tr>`).join('');

  const telDig = tel.replace(/\D/g, '');
  const msgWA = encodeURIComponent(`Hola Daro! Soy ${nombre}. Recibí el presupuesto ${ref} de Celestia Management y quiero coordinar el diagnóstico.`);

  const cuerpo = (paraCliente) => `
  <div style="background:#FAF6EF;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">
  <div style="max-width:600px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #E7DFCF">
    <div style="background:#0D1B2A;padding:28px 26px;color:#FAF6EF">
      <img src="https://www.chefprivado.ar/img/management/logo-pill.png" width="250" alt="Celestia Management" style="display:block;height:auto;border:0">
      <div style="font-size:11px;letter-spacing:.2em;color:rgba(250,246,239,.6);margin-top:12px">COSTOS · CARTA · RENTABILIDAD GASTRONÓMICA</div>
    </div>
    <div style="padding:24px 26px 6px;color:#2a2a3a;font-size:15px;line-height:1.6">
      ${paraCliente
        ? `<p style="margin:0 0 12px">Hola ${esc(nombre.split(' ')[0])},</p><p style="margin:0 0 12px">Gracias por armar tu diagnóstico. Este es el presupuesto estimativo de los módulos que elegiste${negocio ? ` para <b>${esc(negocio)}</b>` : ''}:</p>`
        : `<p style="margin:0 0 6px"><b>Nuevo diagnóstico · ${esc(ref)}</b></p><p style="margin:0">${esc(nombre)} · ${esc(email)}${tel ? ' · ' + esc(tel) : ''}<br>${negocio ? 'Negocio: ' + esc(negocio) + '<br>' : ''}${etapa ? 'Etapa: ' + esc(etapa) : ''}</p>`}
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:8px">${filas}
      <tr><td style="padding:18px;font-family:Georgia,serif;font-size:20px;color:#0D1B2A">Total estimado</td>
      <td style="padding:18px;text-align:right"><div style="font-family:Georgia,serif;font-size:24px;color:#B5652B">${ars(total)}</div><div style="font-size:12px;color:#888">≈ ${usd(total)}</div></td></tr>
    </table>
    <div style="padding:6px 26px 26px;font-size:13px;color:#777;line-height:1.6">
      Valores referenciales: el presupuesto final depende del alcance y la complejidad del proyecto. La primera reunión de diagnóstico no tiene costo.
      <div style="margin-top:18px">
      ${paraCliente
        ? `<a href="https://wa.me/5491160410607?text=${msgWA}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;text-decoration:none;padding:12px 22px;border-radius:24px;font-weight:bold;font-size:14px">Coordinar la reunión sin costo →</a>`
        : (telDig ? `<a href="https://wa.me/${telDig.startsWith('54') ? telDig : '549' + telDig}" style="display:inline-block;background:#25D366;color:#fff;text-decoration:none;padding:12px 22px;border-radius:24px;font-weight:bold;font-size:14px">WhatsApp al cliente</a> ` : '') + `<a href="mailto:${esc(email)}" style="display:inline-block;background:#0D1B2A;color:#E8C96A;text-decoration:none;padding:12px 22px;border-radius:24px;font-weight:bold;font-size:14px">Responder por mail</a>`}
      </div>
    </div>
    <div style="background:#0D1B2A;color:rgba(250,246,239,.55);font-size:12px;padding:14px 26px">Daro Castello · Celestia Management · <a href="https://www.chefprivado.ar/management" style="color:#E8C96A">chefprivado.ar/management</a></div>
  </div></div>`;

  const from = process.env.NOTIFY_FROM || 'Celestia <onboarding@resend.dev>';
  const to = process.env.NOTIFY_TO || 'dario@dali-arquitectura.com.ar';
  const [errCli, errDaro] = await Promise.all([
    mandar(key, { from, to: [email], reply_to: to, subject: `Tu presupuesto de Celestia Management · ${ars(total)}`, html: cuerpo(true) }),
    (async () => {
      try {
        const g = await fetch('https://metodofermento.vercel.app/api/notificar', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-celestia': 'aviso' }, body: JSON.stringify({ asunto: `Diagnóstico Management · ${nombre} · ${ars(total)}`, html: cuerpo(false), replyTo: email }) });
        if (g.ok) return null;
      } catch (e) {}
      return mandar(key, { from, to: [to], reply_to: email, subject: `Diagnóstico Management · ${nombre} · ${ars(total)}`, html: cuerpo(false) });
    })(),
  ]);
  if (errCli && errDaro) return json({ ok: false, error: 'No se pudo enviar el mail', detalle: errDaro }, 502);
  return json({ ok: true, ref, total, mailCliente: !errCli });
}
