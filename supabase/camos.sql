-- MW4 Camo Tracker — noms des camouflages modifiables depuis l'administration
-- À exécuter UNE fois dans Supabase : SQL Editor > New query > coller > Run.
-- (Nécessite d'avoir déjà exécuté admin.sql.)

-- Réglages globaux du site (clé → valeur JSON). Clé utilisée : 'camo_names'.
create table if not exists public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;

drop policy if exists "app_settings_read_all" on public.app_settings;
create policy "app_settings_read_all" on public.app_settings
  for select to anon, authenticated
  using (true);

drop policy if exists "app_settings_admin_insert" on public.app_settings;
create policy "app_settings_admin_insert" on public.app_settings
  for insert to authenticated
  with check ((select public.is_admin()));

drop policy if exists "app_settings_admin_update" on public.app_settings;
create policy "app_settings_admin_update" on public.app_settings
  for update to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
