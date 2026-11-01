import { supabase } from '@/lib/supabase';
import { slugify } from '../catalog';

export const HANDLE_RE = /^[a-z0-9][a-z0-9-]{2,29}$/;

/** Suggested link handle from a pseudo: "Jean Rémi" → "jean-remi" (3–30 chars). */
export const suggestHandle = name => {
  let h = slugify(name || '').slice(0, 30).replace(/-+$/, '');
  if (h.length < 3) h = (h + '-joueur').replace(/^-/, '').slice(0, 30);
  return h;
};

export function profileErrorMessage(error) {
  const msg = error?.message || '';
  if (/profiles/i.test(msg) && /(does not exist|could not find)/i.test(msg)) {
    return "La table 'profiles' n'existe pas : exécute supabase/profiles.sql.";
  }
  if (/duplicate key|unique/i.test(msg)) return 'Cet identifiant est déjà pris, choisis-en un autre.';
  if (/check constraint/i.test(msg)) return 'Identifiant invalide : 3 à 30 caractères, lettres minuscules, chiffres et tirets.';
  return msg || 'Une erreur est survenue.';
}

export async function fetchMyProfile(userId) {
  return supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
}

export async function saveMyProfile(userId, { handle, display_name, is_public }) {
  return supabase
    .from('profiles')
    .upsert({ user_id: userId, handle, display_name, is_public, updated_at: new Date().toISOString() })
    .select()
    .single();
}

/** Keeps the public pseudo in sync when it's changed in the profile page (no-op if no profile row). */
export async function syncDisplayName(userId, display_name) {
  return supabase.from('profiles').update({ display_name }).eq('user_id', userId);
}

/** All public profiles with their progress. */
export async function fetchPublicPlayers() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('user_id, handle, display_name, updated_at')
    .eq('is_public', true)
    .limit(500);
  if (error) return { error };
  if (!profiles.length) return { data: [] };
  const { data: rows, error: e2 } = await supabase
    .from('progress')
    .select('user_id, data, updated_at')
    .in('user_id', profiles.map(p => p.user_id));
  if (e2) return { error: e2 };
  const byUser = new Map(rows.map(r => [r.user_id, r]));
  return {
    data: profiles.map(p => ({
      ...p,
      progress: byUser.get(p.user_id)?.data || {},
      progressUpdatedAt: byUser.get(p.user_id)?.updated_at || null,
    })),
  };
}

/** One public profile (by link handle) with its progress; data = null if not found / private. */
export async function fetchPublicPlayer(handle) {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('user_id, handle, display_name, is_public')
    .eq('handle', handle.toLowerCase())
    .maybeSingle();
  if (error) return { error };
  if (!profile || !profile.is_public) return { data: null };
  const { data: row, error: e2 } = await supabase
    .from('progress')
    .select('data, updated_at')
    .eq('user_id', profile.user_id)
    .maybeSingle();
  if (e2) return { error: e2 };
  return { data: { ...profile, progress: row?.data || {}, progressUpdatedAt: row?.updated_at || null } };
}
