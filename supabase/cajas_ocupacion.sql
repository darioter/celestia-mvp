-- Celestia · cupo de cajas por día en las fiestas (la web lo consulta sin ver datos de los pedidos)
create or replace function public.cajas_ocupacion()
returns table (fecha date, n int)
language sql security definer set search_path = public as $$
  select entrega_fecha, count(*)::int
  from pedidos_cajas
  where estado <> 'cancelado' and coalesce(ocasion, '') <> 'extras' and entrega_fecha >= current_date
  group by entrega_fecha;
$$;
grant execute on function public.cajas_ocupacion() to anon, authenticated;
