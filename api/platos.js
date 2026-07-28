export const config = { runtime: 'edge' };

// Mapeo de los filtros en español del front a los valores que entiende Spoonacular.
// Spoonacular no tiene "Argentina" ni "Perú" como cocina propia — se aproxima con "Latin American".
const CUISINE_MAP = {
  'todas': '',
  'italiana': 'italian',
  'japonesa': 'japanese',
  'argentina': 'latin american',
  'mexicana': 'mexican',
  'asiatica': 'chinese,japanese,korean,thai,vietnamese',
  'peruana': 'latin american',
  'saludable': '', // no es cocina real, se resuelve ordenando por healthiness
  'internacional': ''
};

// "Saludable" tampoco es una dieta real en Spoonacular — se resuelve ordenando por healthiness.
const DIET_MAP = {
  'todos': '',
  'vegetariano': 'vegetarian',
  'vegano': 'vegan',
  'sin gluten': 'gluten free',
  'saludable': ''
};

function norm(s) {
  return (s || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }

  if (req.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders() });
  }

  try {
    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const cocina = norm(url.searchParams.get('cocina') || 'todas');
    const dieta = norm(url.searchParams.get('dieta') || 'todos');
    const number = Math.min(Math.max(Number(url.searchParams.get('number')) || 12, 1), 20);
    const offset = Math.max(Number(url.searchParams.get('offset')) || 0, 0);

    if (!process.env.SPOONACULAR_API_KEY) {
      return new Response(JSON.stringify({ error: 'Falta configurar SPOONACULAR_API_KEY en el servidor' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    const params = new URLSearchParams();
    params.set('apiKey', process.env.SPOONACULAR_API_KEY);
    params.set('number', String(number));
    params.set('offset', String(offset));
    params.set('addRecipeInformation', 'true');
    params.set('instructionsRequired', 'false');
    if (q) params.set('query', q);

    let ordenarPorSalud = false;

    const cuisineVal = CUISINE_MAP[cocina];
    if (cuisineVal) params.set('cuisine', cuisineVal);
    if (cocina === 'saludable') ordenarPorSalud = true;

    const dietVal = DIET_MAP[dieta];
    if (dietVal) params.set('diet', dietVal);
    if (dieta === 'saludable') ordenarPorSalud = true;

    if (ordenarPorSalud) {
      params.set('sort', 'healthiness');
      params.set('sortDirection', 'desc');
    }

    const resp = await fetch(`https://api.spoonacular.com/recipes/complexSearch?${params.toString()}`);
    const data = await resp.json();

    if (!resp.ok) {
      return new Response(JSON.stringify({ error: data.message || 'Error consultando Spoonacular' }), {
        status: resp.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() }
      });
    }

    const platos = (data.results || []).map(r => ({
      id: r.id,
      titulo: r.title,
      imagen: r.image || null,
      tiempo: r.readyInMinutes ?? null,
      porciones: r.servings ?? null,
      // spoonacularScore viene de 0 a 100 — lo escalamos a 0-5 para mostrar como puntaje del plato
      puntaje: typeof r.spoonacularScore === 'number' ? Math.round((r.spoonacularScore / 20) * 10) / 10 : null,
      fuente: r.spoonacularSourceUrl || r.sourceUrl || null,
      vegetariano: !!r.vegetarian,
      vegano: !!r.vegan,
      sinGluten: !!r.glutenFree
    }));

    return new Response(JSON.stringify({ platos, total: data.totalResults || 0 }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() }
    });
  }
}
