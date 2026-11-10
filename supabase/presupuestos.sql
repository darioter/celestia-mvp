-- Presupuestos del admin: se guardan todos para poder reabrirlos y editarlos (aplicado 2026-11-10)
create table if not exists public.presupuestos (
  id uuid primary key default gen_random_uuid(),
  nro text unique not null,
  servicio text, cliente text, contacto text, fecha date, total numeric, reserva_id text,
  datos jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists presupuestos_updated_idx on public.presupuestos (updated_at desc);
alter table public.presupuestos enable row level security;
create policy presupuestos_admin on public.presupuestos for all
  using (lower(auth.jwt() ->> 'email') in ('dario@dali-arquitectura.com.ar', 'celestiachefs@gmail.com'))
  with check (lower(auth.jwt() ->> 'email') in ('dario@dali-arquitectura.com.ar', 'celestiachefs@gmail.com'));
