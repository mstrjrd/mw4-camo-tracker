import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import AuthPage, { NewPasswordPage } from '@/auth/AuthPage';
import AdminPage from '@/admin/AdminPage';
import { usePath } from '@/lib/router';
import CommunityPage from '@/community/CommunityPage';
import PublicProfilePage from '@/community/PublicProfilePage';
import App from './App';

/**
 * Picks the screen. URL routes: /joueurs (public player list), /joueur/<handle> (public profile).
 * Otherwise: the tracker (signed in or guest), the auth forms, the admin page or the password reset.
 */
export default function Root() {
  const { session, user, isAdmin, recovery } = useAuth();
  // null = tracker; 'login' | 'signup' = auth forms; 'admin' = administration
  const [view, setView] = useState(null);
  const path = usePath();

  // Back to the tracker whenever the signed-in account changes
  useEffect(() => { setView(null); }, [user?.id]);

  if (supabase && session === undefined) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }
  if (recovery) return <NewPasswordPage />;

  // Public community pages (shareable URLs, no account needed)
  if (path === '/joueurs' || path === '/joueurs/') return <CommunityPage />;
  const m = path.match(/^\/joueur\/([^/]+)\/?$/);
  if (m) return <PublicProfilePage handle={decodeURIComponent(m[1])} />;

  if (view === 'admin' && isAdmin) return <AdminPage onBack={() => setView(null)} />;
  if (!user && (view === 'login' || view === 'signup')) {
    return <AuthPage initialTab={view} onBack={() => setView(null)} />;
  }

  // key: remount everything (filters, state) when switching account / guest
  return (
    <App
      key={user?.id ?? 'guest'}
      user={user}
      onAuth={supabase ? setView : null}
      onAdmin={isAdmin ? () => setView('admin') : null}
    />
  );
}
