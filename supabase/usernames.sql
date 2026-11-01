-- MW4 Camo Tracker — pseudos uniques
-- À exécuter UNE fois dans Supabase : SQL Editor > New query > coller > Run.
-- (Peut être relancé sans risque.)
--
-- Le pseudo reste stocké dans les métadonnées du compte (user_metadata.username) ;
-- cette table sert uniquement à le réserver : deux joueurs ne peuvent pas avoir le même,
-- sans tenir compte des majuscules ("Ghost" et "ghost" sont le même pseudo).

create table if not exists public.usernames (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  username   text not null check (char_length(username) between 1 and 32),
  updated_at timestamptz not null default now()
);
create unique index if not exists usernames_lower_key on public.usernames (lower(username));

-- Aucune règle d'accès direct : la table ne se lit / s'écrit que via les fonctions ci-dessous.
alter table public.usernames enable row level security;

-- Le pseudo est-il libre ? (utilisable sans être connecté, pour l'inscription ;
-- son propre pseudo actuel compte comme libre, pour pouvoir changer la casse)
create or replace function public.username_available(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select not exists (
    select 1 from public.usernames
    where lower(username) = lower(btrim(p_name))
      and user_id is distinct from auth.uid()
  );
$$;
revoke all on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- Réserve (ou change) le pseudo du joueur connecté. Échoue (duplicate key) s'il est déjà pris.
create or replace function public.set_username(p_name text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(p_name);
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.usernames (user_id, username, updated_at)
  values (auth.uid(), v_name, now())
  on conflict (user_id) do update set username = excluded.username, updated_at = now();
end;
$$;
revoke all on function public.set_username(text) from public;
grant execute on function public.set_username(text) to authenticated;

-- À l'inscription : réserve le pseudo choisi. S'il vient d'être pris entre-temps,
-- l'inscription échoue ("Database error saving new user"), le site affiche « pseudo déjà pris ».
create or replace function public.reserve_username_on_signup()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := btrim(coalesce(new.raw_user_meta_data ->> 'username', ''));
begin
  if v_name <> '' then
    insert into public.usernames (user_id, username) values (new.id, left(v_name, 32));
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created_username on auth.users;
create trigger on_auth_user_created_username
  after insert on auth.users
  for each row execute function public.reserve_username_on_signup();

-- Comptes existants : réserve leur pseudo actuel. En cas de doublon, le compte le plus ancien le garde ;
-- les autres gardent leur pseudo affiché mais devront en choisir un libre s'ils le changent.
insert into public.usernames (user_id, username)
select distinct on (lower(btrim(raw_user_meta_data ->> 'username')))
  id, left(btrim(raw_user_meta_data ->> 'username'), 32)
from auth.users
where btrim(coalesce(raw_user_meta_data ->> 'username', '')) <> ''
order by lower(btrim(raw_user_meta_data ->> 'username')), created_at
on conflict do nothing;

-- Pour voir les doublons existants (facultatif) :
-- select lower(btrim(raw_user_meta_data ->> 'username')) as pseudo, count(*), array_agg(email)
-- from auth.users group by 1 having count(*) > 1;
