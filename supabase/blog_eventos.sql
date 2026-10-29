-- Interacciones del blog (sin datos personales): alimentan la nube de "lo más buscado".
-- Cualquiera puede registrar un evento; nadie puede leer las filas sueltas. Solo se expone el resumen agregado.
create table if not exists public.blog_eventos (
  id bigserial primary key,
  tipo text not null check (tipo in ('vista', 'like', 'guardar', 'compartir', 'escuchar', 'busqueda', 'voto')),
  slug text check (slug is null or slug ~ '^[a-z0-9-]{3,120}$'),
  termino text check (termino is null or char_length(termino) <= 40),
  lang text check (lang is null or lang in ('es', 'en')),
  created_at timestamptz not null default now()
);
create index if not exists blog_eventos_fecha on public.blog_eventos (created_at);
alter table public.blog_eventos enable row level security;
drop policy if exists "blog_eventos_insert" on public.blog_eventos;
create policy "blog_eventos_insert" on public.blog_eventos for insert to anon, authenticated with check (true);

-- Resumen público: interacciones por nota y búsquedas repetidas (3 o más veces, solo letras) de los últimos N días.
create or replace function public.blog_nube(dias int default 90)
returns json language sql stable security definer set search_path = public as $$
  select json_build_object(
    'notas', coalesce((
      select json_object_agg(slug, x) from (
        select slug, json_object_agg(tipo, n) x from (
          select slug, tipo, count(*) n from blog_eventos
          where slug is not null and created_at > now() - make_interval(days => least(greatest(dias, 1), 365))
          group by 1, 2) a
        group by slug) b), '{}'::json),
    'busquedas', coalesce((
      select json_agg(json_build_object('t', t, 'n', n) order by n desc) from (
        select lower(trim(termino)) t, count(*) n from blog_eventos
        where tipo = 'busqueda' and termino is not null
          and lower(trim(termino)) ~ '^[a-záéíóúñü ]{3,30}$'
          and created_at > now() - make_interval(days => least(greatest(dias, 1), 365))
        group by 1 having count(*) >= 3 order by 2 desc limit 30) c), '[]'::json));
$$;
grant execute on function public.blog_nube(int) to anon, authenticated;
select 'ok' as r;
