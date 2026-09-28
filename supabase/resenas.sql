-- Reseñas reales para la landing de Celestia.
-- Correr una vez en Supabase → SQL Editor.
-- Si entrás al admin con otro mail, reemplazalo en las políticas de abajo.

create table if not exists public.resenas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  zona text,
  texto text not null,
  estrellas smallint not null default 5 check (estrellas between 1 and 5),
  orden integer not null default 0,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.resenas enable row level security;

-- Cualquiera puede leer las reseñas visibles (la web)
drop policy if exists "resenas_lectura_publica" on public.resenas;
create policy "resenas_lectura_publica" on public.resenas
  for select using (activo = true);

-- Solo el admin lee todas y las edita
drop policy if exists "resenas_admin" on public.resenas;
create policy "resenas_admin" on public.resenas
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar')
  with check ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar');
