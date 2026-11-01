import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still restoring the session, null = signed out
  const [session, setSession] = useState(undefined);
  // true after the user clicked a "reset password" email link
  const [recovery, setRecovery] = useState(false);
  // Admin flag comes from the `admins` table (see supabase/admin.sql). The DB enforces it; this only shows/hides the UI.
  const [isAdmin, setIsAdmin] = useState(false);
  const userId = session?.user?.id;

  useEffect(() => {
    if (!supabase || !userId) { setIsAdmin(false); return; }
    let cancelled = false;
    supabase.rpc('is_admin').then(({ data, error }) => {
      if (!cancelled) setIsAdmin(!error && data === true);
    });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!supabase) return;
    // If the session can't be restored (storage blocked, network…), fall back to guest mode instead of spinning forever
    supabase.auth.getSession()
      .then(({ data }) => setSession(data.session))
      .catch(() => setSession(null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, isAdmin, recovery, endRecovery: () => setRecovery(false) }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

export const displayName = user =>
  user?.user_metadata?.username || user?.email?.split('@')[0] || 'Joueur';

/** Supabase error messages → French. */
export function authErrorMessage(error) {
  const msg = error?.message || '';
  const map = [
    [/invalid login credentials/i, 'Email ou mot de passe incorrect.'],
    [/user already registered/i, 'Un compte existe déjà avec cet email.'],
    [/email not confirmed/i, 'Confirme ton adresse email avant de te connecter (vérifie ta boîte mail).'],
    [/password should be at least/i, 'Le mot de passe doit contenir au moins 6 caractères.'],
    [/unable to validate email|invalid email/i, 'Adresse email invalide.'],
    [/rate limit|too many requests|security purposes/i, 'Trop de tentatives, réessaie dans quelques instants.'],
    [/same.*password|different from the old/i, 'Le nouveau mot de passe doit être différent de l’ancien.'],
    [/failed to fetch|network/i, 'Impossible de joindre le serveur. Vérifie ta connexion.'],
  ];
  for (const [re, fr] of map) if (re.test(msg)) return fr;
  return msg || 'Une erreur est survenue.';
}
