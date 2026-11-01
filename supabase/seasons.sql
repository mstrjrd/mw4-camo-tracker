-- MW4 Camo Tracker — saison d'arrivée des armes
-- À exécuter UNE fois dans Supabase : SQL Editor > New query > coller > Run.
-- 0 = arme de base (disponible au lancement), 1 à 6 = arrivée en Saison 1 à 6
alter table public.weapons
  add column if not exists season integer not null default 0 check (season >= 0);
