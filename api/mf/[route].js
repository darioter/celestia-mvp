// Proxy a la API de Celestia Management (ex Método Fermento), que sigue corriendo en su
// proyecto de Vercel con su Supabase (alumnos, compras, leads, precios) y MercadoPago.
// Así las páginas de chefprivado.ar/management llaman a /api/mf/<ruta> sin problemas de CORS.
export const config = { runtime: 'edge' };

const ORIGEN = 'https://metodofermento.vercel.app/api/';
const PERMITIDAS = new Set(['auth', 'crear-preferencia', 'leads', 'admin-celestia']);

export default async function handler(req) {
  const url = new URL(req.url);
  const ruta = url.pathname.split('/').filter(Boolean).pop();
  if (!PERMITIDAS.has(ruta)) return new Response(JSON.stringify({ error: 'Ruta no permitida' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204 });

  const headers = { 'Content-Type': req.headers.get('content-type') || 'application/json' };
  const auth = req.headers.get('authorization');
  if (auth) headers.Authorization = auth;
  const qs = new URLSearchParams(url.search); qs.delete('route');
  const destino = ORIGEN + ruta + (qs.toString() ? '?' + qs.toString() : '');
  try {
    const r = await fetch(destino, {
      method: req.method,
      headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.text(),
    });
    return new Response(await r.text(), { status: r.status, headers: { 'Content-Type': r.headers.get('content-type') || 'application/json', 'Cache-Control': 'no-store' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'No se pudo conectar con el servidor de cursos.' }), { status: 502, headers: { 'Content-Type': 'application/json' } });
  }
}
