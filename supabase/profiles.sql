-- MW4 Camo Tracker — profils publics partageables
-- À exécuter UNE fois dans Supabase : SQL Editor > New query > coller > Run.
-- (Nécessite d'avoir déjà exécuté schema.sql.)

-- Un profil par joueur : identifiant de lien (/joueur/<handle>), pseudo affiché, visibilité.
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  handle       text not null unique check (handle ~ '^[a-z0-9][a-z0-9-]{2,29}$'),
  display_name text not null default '',
  is_public    boolean not null default false,
  updated_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Lisible par tous s'il est public, toujours lisible par son propriétaire
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to anon, authenticated
  using (is_public or (select auth.uid()) = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "profiles_delete_own" on public.profiles;
create policy "profiles_delete_own" on public.profiles
  for delete to authenticated
  using ((select auth.uid()) = user_id);

-- La progression d'un joueur devient lisible (lecture seule) par tous UNIQUEMENT si son profil est public.
-- S'ajoute à la règle existante "progress_select_own" (chacun lit toujours la sienne).
drop policy if exists "progress_select_public" on public.progress;
create policy "progress_select_public" on public.progress
  for select to anon, authenticated
  using (exists (
    select 1 from public.profiles pr
    where pr.user_id = progress.user_id and pr.is_public
  ));
