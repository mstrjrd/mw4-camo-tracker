import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/auth/AuthProvider';
import AuthPage, { NewPasswordPage } from '@/auth/AuthPage';
import AdminPage from '@/admin/AdminPage';
import App from './App';

/** Picks the screen: the tracker (signed in or guest), the auth forms, the admin page or the password reset. */
export default function Root() {
  const { session, user, isAdmin, recovery } = useAuth();
  // null = tracker; 'login' | 'signup' = auth forms; 'admin' = administration
  const [view, setView] = useState(null);

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
