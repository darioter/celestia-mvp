-- Menús que salen de los presupuestos del admin.
-- publicado = true → se suman a "Menús de ejemplo" del sitio (por estilo de cocina).
-- ingredientes: lo que se detectó en cada plato, con la clave de la canasta si ya tiene seguimiento.
create table if not exists public.menus_sitio (
  id bigserial primary key,
  estilo text not null,
  pasos int not null check (pasos in (3, 7)),
  nombre text not null,
  platos jsonb not null,
  etiquetas jsonb,
  ingredientes jsonb,
  origen text default 'presupuesto',
  reserva_ref text,
  publicado boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.menus_sitio enable row level security;
drop policy if exists "menus_sitio_publico" on public.menus_sitio;
create policy "menus_sitio_publico" on public.menus_sitio for select using (publicado = true);
drop policy if exists "menus_sitio_admin" on public.menus_sitio;
create policy "menus_sitio_admin" on public.menus_sitio for all
  using ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar')
  with check ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar');

-- El admin puede sumar productos al seguimiento semanal de precios (cron canasta-pedir de los lunes).
drop policy if exists "canasta_productos_admin_ins" on public.canasta_productos;
create policy "canasta_productos_admin_ins" on public.canasta_productos for insert
  with check ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar');
drop policy if exists "canasta_productos_admin_upd" on public.canasta_productos;
create policy "canasta_productos_admin_upd" on public.canasta_productos for update
  using ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar')
  with check ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar');
