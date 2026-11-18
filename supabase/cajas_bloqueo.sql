-- Celestia · un pedido de caja bloquea ese día para experiencias (aunque el admin no esté abierto).
-- Correr una vez en Supabase → SQL Editor. Se puede volver a correr sin problema.
create or replace function public.cajas_bloquear_dia() returns trigger
language plpgsql security definer set search_path = public as $$
declare d date;
begin
  -- liberar días que ya no tienen cajas activas (por cancelación o cambio de fecha)
  foreach d in array array[case when tg_op = 'UPDATE' then old.entrega_fecha end, new.entrega_fecha] loop
    if d is not null then
      delete from bloqueos b where b.fecha = d and b.motivo like '📦 Caja%'
        and not exists (select 1 from pedidos_cajas p where p.entrega_fecha = d and p.estado <> 'cancelado');
    end if;
  end loop;
  -- bloquear el día del pedido
  if new.estado <> 'cancelado' and not exists (select 1 from bloqueos where fecha = new.entrega_fecha) then
    insert into bloqueos (fecha, motivo) values (new.entrega_fecha, '📦 Caja ' || new.ref);
  end if;
  return new;
end $$;

drop trigger if exists tg_cajas_bloquear_dia on public.pedidos_cajas;
create trigger tg_cajas_bloquear_dia after insert or update of estado, entrega_fecha on public.pedidos_cajas
  for each row execute function public.cajas_bloquear_dia();

-- Bloquear ya los días de los pedidos activos que existan
insert into bloqueos (fecha, motivo)
select p.entrega_fecha, '📦 Caja ' || string_agg(p.ref, ', ')
from pedidos_cajas p
where p.estado <> 'cancelado' and p.entrega_fecha >= current_date
  and not exists (select 1 from bloqueos b where b.fecha = p.entrega_fecha)
group by p.entrega_fecha;
