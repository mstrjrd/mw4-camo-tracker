import { AnimatePresence, motion } from 'motion/react';
import { CloudCheck, CloudOff, Loader2, LogOut, ChevronDown, ShieldCheck, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';
import { displayName } from '@/auth/AuthProvider';

const STATUS = {
  saved: { icon: CloudCheck, text: 'Sauvegardé', cls: 'text-muted-foreground' },
  saving: { icon: Loader2, text: 'Enregistrement…', cls: 'text-muted-foreground', spin: true },
  // Only the error keeps its text: it's the one state that asks for an action
  error: { icon: CloudOff, text: 'Erreur — réessayer', cls: 'text-destructive', showText: true },
};

export function SyncStatus({ status, onRetry }) {
  const s = STATUS[status];
  if (!s) return null;
  const Icon = s.icon;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.button
        key={status}
        type="button"
        disabled={status !== 'error'}
        onClick={onRetry}
        title={s.text}
        aria-label={s.text}
        className={'flex items-center gap-1.5 text-xs ' + s.cls}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.15 }}
      >
        <Icon className={'size-5' + (s.spin ? ' animate-spin' : '')} />
        {s.showText && <span className="hidden sm:inline">{s.text}</span>}
      </motion.button>
    </AnimatePresence>
  );
}

export default function UserMenu({ user, beforeSignOut, onAdmin, onProfile }) {
  const name = displayName(user);

  const signOut = async () => {
    await beforeSignOut?.();
    const { error } = await supabase.auth.signOut();
    if (error) toast.error('Déconnexion impossible');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 px-2">
          <span className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
            {name.slice(0, 2)}
          </span>
          <span className="hidden max-w-32 truncate sm:inline">{name}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-medium">{name}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {onProfile && (
          <DropdownMenuItem onSelect={onProfile}>
            <UserRound />Mon profil
          </DropdownMenuItem>
        )}
        {onAdmin && (
          <>
            <DropdownMenuItem onSelect={onAdmin}>
              <ShieldCheck />Administration
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={signOut}>
          <LogOut />Se déconnecter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
