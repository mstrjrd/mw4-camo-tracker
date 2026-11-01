import { supabase } from '@/lib/supabase';

// Unique pseudos are reserved in the `usernames` table (see supabase/usernames.sql), case-insensitive.

const MISSING = /(username_available|set_username|usernames).*(does not exist|could not find)|could not find the function/i;

export function usernameErrorMessage(error) {
  const msg = error?.message || '';
  if (MISSING.test(msg)) return "La vérification des pseudos n'est pas installée : exécute supabase/usernames.sql.";
  if (/duplicate key|unique/i.test(msg)) return 'Ce pseudo est déjà pris, choisis-en un autre.';
  if (/check constraint/i.test(msg)) return 'Le pseudo doit contenir entre 1 et 32 caractères.';
  if (/failed to fetch|network/i.test(msg)) return 'Impossible de joindre le serveur. Vérifie ta connexion.';
  return msg || 'Une erreur est survenue.';
}

/** Returns an error message if the pseudo can't be used, null if it's free. */
export async function checkUsername(name) {
  const { data, error } = await supabase.rpc('username_available', { p_name: name });
  if (error) return usernameErrorMessage(error);
  return data ? null : 'Ce pseudo est déjà pris, choisis-en un autre.';
}

/** Reserves the pseudo for the signed-in user (fails if taken). */
export async function reserveUsername(name) {
  const { error } = await supabase.rpc('set_username', { p_name: name });
  return error ? usernameErrorMessage(error) : null;
}
