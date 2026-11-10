-- Bot de WhatsApp: charlas y mensajes. Escribe el endpoint /api/wa-bot con la clave service_role (salta RLS).
-- El admin (Daro) lee y cambia el estado de cada charla desde /admin → Bot WhatsApp.
create table if not exists public.wa_conversaciones (
  tel text primary key,                       -- número del cliente (formato internacional sin +)
  nombre text,
  estado text not null default 'bot' check (estado in ('bot', 'daro')),   -- quién responde
  resumen text,                               -- lo que el bot le pasó a Daro
  no_leidos int not null default 0,
  ultimo timestamptz default now(),
  daro_ultimo timestamptz,                    -- último mensaje de Daro desde la app (coexistencia)
  derivado_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.wa_mensajes (
  id bigserial primary key,
  tel text not null,
  rol text not null check (rol in ('cliente', 'bot', 'daro')),
  texto text,
  wa_id text unique,                          -- id de Meta: evita responder dos veces si Meta reintenta
  created_at timestamptz not null default now()
);
create index if not exists wa_mensajes_tel on public.wa_mensajes (tel, created_at);
alter table public.wa_conversaciones enable row level security;
alter table public.wa_mensajes enable row level security;
drop policy if exists wa_conv_admin on public.wa_conversaciones;
create policy wa_conv_admin on public.wa_conversaciones for all to authenticated
  using ((auth.jwt() ->> 'email') in ('dario@dali-arquitectura.com.ar', 'celestiachefs@gmail.com'))
  with check ((auth.jwt() ->> 'email') in ('dario@dali-arquitectura.com.ar', 'celestiachefs@gmail.com'));
drop policy if exists wa_msj_admin on public.wa_mensajes;
create policy wa_msj_admin on public.wa_mensajes for all to authenticated
  using ((auth.jwt() ->> 'email') in ('dario@dali-arquitectura.com.ar', 'celestiachefs@gmail.com'))
  with check ((auth.jwt() ->> 'email') in ('dario@dali-arquitectura.com.ar', 'celestiachefs@gmail.com'));
