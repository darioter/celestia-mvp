-- Cajas Celestia (chefprivado.ar/cajas): pedidos, carritos y seguimiento. Se puede correr entero las veces que haga falta.
-- Correr una vez en Supabase → SQL Editor.
-- Si entrás al admin con otro mail, reemplazalo en la política de abajo.

create table if not exists public.pedidos_cajas (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  ocasion text not null,                -- navidad | anio_nuevo | romantica | cumple | amigos
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

alter table public.pedidos_cajas enable row level security;

-- Cualquiera puede crear un pedido (solo como pendiente)
drop policy if exists "cajas_insert_publico" on public.pedidos_cajas;
create policy "cajas_insert_publico" on public.pedidos_cajas
  for insert to anon, authenticated
  with check (estado = 'pendiente');

-- Solo el admin lee y edita
drop policy if exists "cajas_admin" on public.pedidos_cajas;
create policy "cajas_admin" on public.pedidos_cajas
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar')
  with check ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar');

grant insert on public.pedidos_cajas to anon;
grant select, insert, update, delete on public.pedidos_cajas to authenticated;

-- ═════════ Tienda: cupón en el pedido, carritos y seguimiento (v2) ═════════
alter table public.pedidos_cajas add column if not exists cupon text;
alter table public.pedidos_cajas add column if not exists descuento integer not null default 0;
alter table public.pedidos_cajas add column if not exists carrito_id uuid;

-- Carritos: se guardan mientras la persona arma el pedido (para ver abandonos y recuperarlos)
create table if not exists public.carritos_cajas (
  id uuid primary key,
  items jsonb not null default '[]',
  n_items integer not null default 0,
  subtotal integer not null default 0,
  ocasion text,
  entrega_fecha date,
  entrega_franja text,
  cp text,
  nombre text,
  tel text,
  email text,
  etapa text not null default 'carrito',      -- carrito | datos (dejó nombre/WhatsApp/email)
  estado text not null default 'abierto',     -- abierto | contactado | convertido | descartado
  ref_pedido text,
  recordatorios integer not null default 0,
  ultimo_recordatorio timestamptz,
  origen text,
  recuperado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.carritos_cajas enable row level security;
drop policy if exists "carritos_admin" on public.carritos_cajas;
create policy "carritos_admin" on public.carritos_cajas
  for all to authenticated
  using ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar')
  with check ((auth.jwt() ->> 'email') = 'dario@dali-arquitectura.com.ar');
grant select, insert, update, delete on public.carritos_cajas to authenticated;
create index if not exists carritos_cajas_upd on public.carritos_cajas (updated_at desc);

-- La web guarda el carrito (sin poder leer los de otros)
create or replace function public.guardar_carrito_cajas(
  p_id uuid, p_items jsonb, p_subtotal integer, p_ocasion text, p_fecha date, p_franja text,
  p_cp text, p_nombre text, p_tel text, p_email text, p_origen text
) returns void language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if p_id is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 60 then return; end if;
  select coalesce(sum(coalesce((x->>'cant')::int, 1)), 0) into n from jsonb_array_elements(p_items) x;
  insert into carritos_cajas as c (id, items, n_items, subtotal, ocasion, entrega_fecha, entrega_franja, cp, nombre, tel, email, etapa, origen)
  values (p_id, p_items, n, greatest(coalesce(p_subtotal, 0), 0), left(p_ocasion, 30), p_fecha, left(p_franja, 40), left(p_cp, 10),
          nullif(left(trim(p_nombre), 120), ''), nullif(left(trim(p_tel), 40), ''), nullif(left(trim(p_email), 160), ''),
          case when coalesce(nullif(trim(p_tel), ''), nullif(trim(p_email), '')) is not null then 'datos' else 'carrito' end, left(p_origen, 120))
  on conflict (id) do update set
    items = excluded.items, n_items = excluded.n_items, subtotal = excluded.subtotal,
    ocasion = excluded.ocasion, entrega_fecha = excluded.entrega_fecha, entrega_franja = excluded.entrega_franja,
    cp = coalesce(excluded.cp, c.cp), nombre = coalesce(excluded.nombre, c.nombre),
    tel = coalesce(excluded.tel, c.tel), email = coalesce(excluded.email, c.email),
    etapa = case when c.etapa = 'datos' or excluded.etapa = 'datos' then 'datos' else 'carrito' end,
    updated_at = now()
  where c.estado in ('abierto', 'contactado');
end $$;

create or replace function public.convertir_carrito_cajas(p_id uuid, p_ref text)
returns void language sql security definer set search_path = public as $$
  update carritos_cajas set estado = 'convertido', ref_pedido = left(p_ref, 40), updated_at = now()
  where id = p_id and estado in ('abierto', 'contactado');
$$;

create or replace function public.marcar_recuperado_cajas(p_id uuid)
returns void language sql security definer set search_path = public as $$
  update carritos_cajas set recuperado = true where id = p_id;
$$;

-- Link de recuperación: chefprivado.ar/cajas/?c=<id> (el id es secreto, va solo en el mensaje)
create or replace function public.leer_carrito_cajas(p_id uuid)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('items', items, 'ocasion', ocasion, 'entrega_fecha', entrega_fecha, 'entrega_franja', entrega_franja,
                            'cp', cp, 'nombre', nombre, 'tel', tel, 'email', email, 'estado', estado)
  from carritos_cajas where id = p_id;
$$;

-- Seguimiento del pedido: código + últimos 4 números del WhatsApp
create or replace function public.seguimiento_pedido_cajas(p_ref text, p_tel text)
returns jsonb language sql security definer set search_path = public as $$
  select jsonb_build_object('ref', ref, 'ocasion', ocasion, 'entrega_fecha', entrega_fecha, 'entrega_franja', entrega_franja,
    'estado', estado, 'items', items, 'subtotal', subtotal, 'descuento', descuento, 'envio', envio, 'total', total,
    'senia_monto', senia_monto, 'nombre', split_part(nombre, ' ', 1), 'zona', zona, 'created_at', created_at)
  from pedidos_cajas
  where upper(ref) = upper(trim(p_ref))
    and length(regexp_replace(coalesce(p_tel, ''), '\D', '', 'g')) >= 4
    and right(regexp_replace(tel, '\D', '', 'g'), 4) = right(regexp_replace(p_tel, '\D', '', 'g'), 4)
  limit 1;
$$;

revoke all on function public.guardar_carrito_cajas(uuid, jsonb, integer, text, date, text, text, text, text, text, text) from public;
grant execute on function public.guardar_carrito_cajas(uuid, jsonb, integer, text, date, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.convertir_carrito_cajas(uuid, text) to anon, authenticated;
grant execute on function public.marcar_recuperado_cajas(uuid) to anon, authenticated;
grant execute on function public.leer_carrito_cajas(uuid) to anon, authenticated;
grant execute on function public.seguimiento_pedido_cajas(text, text) to anon, authenticated;
