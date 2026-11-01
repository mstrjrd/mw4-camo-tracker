-- MW4 Camo Tracker — ajout du mode Warzone
-- À exécuter UNE fois dans Supabase : SQL Editor > New query > coller > Run.
-- Ajoute les 7 défis Warzone (vides au départ) à chaque arme :
-- Spéciale 1, Spéciale 2, Spéciale 3, Golden Damascus, Starglass, Absolute Zero, Apocalypse.
alter table public.weapons
  add column if not exists warzone text[] not null default array[]::text[];
