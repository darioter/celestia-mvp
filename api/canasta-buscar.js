// Busca un ingrediente en Jumbo y Carrefour (catálogo público VTEX) y devuelve SKU, nombre y precio.
// Lo usa el admin para sumar ingredientes nuevos al seguimiento semanal de precios.
export const config = { runtime: 'edge' };

const SUPERS = { jumbo: 'https://www.jumbo.com.ar', carrefour: 'https://www.carrefour.com.ar' };
const H = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 's-maxage=3600' };

async function buscar(sup, q) {
  const url = SUPERS[sup] + '/api/catalog_system/pub/products/search?ft=' + encodeURIComponent(q) + '&_from=0&_to=5';
  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (CelestiaCanasta)' } });
    if (!r.ok) return [];
    const d = await r.json();
    return (Array.isArray(d) ? d : []).map(p => {
      const it = (p.items || [])[0] || {};
      const of = (((it.sellers || [])[0] || {}).commertialOffer) || {};
      return { super: sup, sku: String(it.itemId || ''), nombre: p.productName || '', marca: p.brand || '', precio: of.Price || 0, stock: (of.AvailableQuantity || 0) > 0 };
    }).filter(x => x.sku && x.precio > 0);
  } catch (e) { return []; }
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { ...H, 'Access-Control-Allow-Methods': 'GET, OPTIONS' } });
  const q = (new URL(req.url).searchParams.get('q') || '').trim().slice(0, 80);
  if (q.length < 2) return new Response(JSON.stringify({ error: 'q' }), { status: 400, headers: H });
  const [j, c] = await Promise.all([buscar('jumbo', q), buscar('carrefour', q)]);
  return new Response(JSON.stringify({ q, jumbo: j, carrefour: c }), { headers: H });
}
