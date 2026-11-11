-- Celestia · número de WhatsApp conectado por Embedded Signup (coexistencia)
-- Guarda el token del negocio: solo lo lee la API del bot con service_role. Sin políticas = nadie más accede.
create table if not exists public.wa_config (
  id int primary key default 1 check (id = 1),
  phone_id text,
  waba_id text,
  token text,
  numero text,
  nombre text,
  updated_at timestamptz default now()
);
alter table public.wa_config enable row level security;
revoke all on public.wa_config from anon, authenticated;
