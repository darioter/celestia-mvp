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

  try {
    const body = await req.json();
    // Modelos retirados por Anthropic → el vigente (así no se rompe ninguna página que todavía pida el viejo).
    const VIGENTE = 'claude-sonnet-5-5';
    if (!body.model || /^claude-(3|sonnet-4-2|opus-4-2|sonnet-4-0|opus-4-0)/.test(body.model)) body.model = VIGENTE;

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    // Los modelos nuevos pueden devolver bloques de razonamiento antes del texto: las páginas leen content[0].text.
    if (Array.isArray(data.content)) data.content = data.content.filter(c => c && c.type === 'text');

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      }
    });
  }
}
