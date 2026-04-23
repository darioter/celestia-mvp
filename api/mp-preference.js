export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!MP_ACCESS_TOKEN) {
    return new Response(JSON.stringify({ error: 'MP_ACCESS_TOKEN no configurado' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const { reservaId, tipo, monto, description, payerName, ref } = await req.json();

    const preference = {
      items: [{
        id: `${reservaId}-${tipo}`,
        title: description || `Celestia Chef Privado — ${tipo === 'senia' ? 'Seña' : 'Saldo'} ${ref}`,
        quantity: 1,
        unit_price: Math.round(monto),
        currency_id: 'ARS',
      }],
      payer: {
        name: payerName || 'Cliente Celestia',
      },
      back_urls: {
        success: `${process.env.BASE_URL || 'https://chefprivado.ar'}/clientes?pago=ok&ref=${ref}&tipo=${tipo}`,
        failure: `${process.env.BASE_URL || 'https://chefprivado.ar'}/clientes?pago=error&ref=${ref}`,
        pending: `${process.env.BASE_URL || 'https://chefprivado.ar'}/clientes?pago=pendiente&ref=${ref}`,
      },
      auto_return: 'approved',
      external_reference: `${reservaId}|${tipo}`,
      statement_descriptor: 'CELESTIA CHEF',
      metadata: { reserva_id: reservaId, tipo },
    };

    const res = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
      },
      body: JSON.stringify(preference),
    });

    const data = await res.json();

    // En sandbox usar sandbox_init_point, en producción usar init_point
    const isSandbox = MP_ACCESS_TOKEN.startsWith('TEST-');
    const init_point = isSandbox
      ? (data.sandbox_init_point || data.init_point)
      : (data.init_point || data.sandbox_init_point);

    return new Response(JSON.stringify({ ...data, init_point, is_sandbox: isSandbox }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
