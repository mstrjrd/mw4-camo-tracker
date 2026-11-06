-- MW4 Camo Tracker — suppression de son propre compte
-- À exécuter UNE fois dans Supabase : SQL Editor > New query > coller > Run.
-- (Peut être relancé sans risque. Nécessite d'avoir déjà exécuté schema.sql.)
--
-- Le site n'a pas de serveur : seule une fonction « security definer » peut supprimer une ligne
-- de auth.users avec la clé publique. Elle ne peut viser que le joueur connecté (auth.uid()).
-- Les tables progress, profiles, usernames et admins sont vidées par « on delete cascade ».
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
