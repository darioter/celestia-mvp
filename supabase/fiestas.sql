-- Pedidos de cajas para las fiestas (chefprivado.ar/fiestas).
-- Correr una vez en Supabase → SQL Editor.
-- Si entrás al admin con otro mail, reemplazalo en la política de abajo.

create table if not exists public.pedidos_fiestas (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  fiesta text not null,                 -- 'navidad' | 'anio_nuevo'
  entrega_fecha date not null,
  entrega_franja text,
  items jsonb not null default '[]',    -- [{id, nombre, variante, personas, cant, precio, subtotal}]
  subtotal integer not null default 0,
  envio integer not null default 0,
  total integer not null default 0,
  senia_monto integer not null default 0,
  cp text,
  zona text,
  nombre text not null,
  tel text not null,
  email text,
  dir text,
  notas text,
  estado text not null default 'pendiente',   -- pendiente | sena_cobrada | en_produccion | entregado | cancelado
  created_at timestamptz not null default now()
);

alter table public.pedidos_fiestas enable row level security;

-- Cualquiera puede crear un pedido (solo como pendiente)
drop policy if exists "fiestas_insert_publico" on public.pedidos_fiestas;
create policy "fiestas_insert_publico" on public.pedidos_fiestas
  for insert to anon, authenticated
  with check (estado = 'pendiente');

-- Solo el admin lee y edita
drop policy if exists "fiestas_admin" on public.pedidos_fiestas;
create policy "fiestas_admin" on public.pedidos_fiestas
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar')
  with check ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar');

grant insert on public.pedidos_fiestas to anon;
grant select, insert, update, delete on public.pedidos_fiestas to authenticated;
