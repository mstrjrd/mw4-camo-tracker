import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, AtSign, Download, ExternalLink, Globe, KeyRound, Link2, Loader2, LogOut, RotateCcw, Save, Trash2, Upload, UserRound, HardDrive } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, redirectUrl } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { CHALLENGE_MODES, MODES, progressKey } from '../constants';
import { navigate, profileUrl } from '@/lib/router';
import { HANDLE_RE, fetchMyProfile, profileErrorMessage, saveMyProfile, suggestHandle, syncDisplayName } from '../community/api';
import { shareProfile } from '../community/PublicProfilePage';
import { authErrorMessage, displayName, useAuth } from '@/auth/AuthProvider';
import { riseItem } from '@/lib/motion';
import { reserveUsername } from '@/auth/usernames';

const item = riseItem;

function Section({ icon: Icon, title, description, children, onSubmit, footer }) {
  const Wrapper = onSubmit ? 'form' : 'div';
  return (
    <motion.div variants={item}>
      <Card>
        <Wrapper onSubmit={onSubmit} className="flex flex-col gap-(--card-spacing)">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Icon className="size-4 text-primary" />{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="space-y-4">{children}</CardContent>
          {footer && <CardFooter className="justify-end gap-2">{footer}</CardFooter>}
        </Wrapper>
      </Card>
    </motion.div>
  );
}

function UsernameSection({ user }) {
  const current = user.user_metadata?.username || '';
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);

  const submit = async e => {
    e.preventDefault();
    const username = value.trim();
    if (!username) return toast.error('Le pseudo ne peut pas être vide.');
    setBusy(true);
    // Reserve first: fails if another player already has this pseudo
    const taken = await reserveUsername(username);
    if (taken) { setBusy(false); return toast.error(taken); }
    const { error } = await supabase.auth.updateUser({ data: { username } });
    setBusy(false);
    if (error) return toast.error(authErrorMessage(error));
    await syncDisplayName(user.id, username);
    toast.success('Pseudo mis à jour');
  };

  return (
    <Section
      icon={UserRound}
      title="Pseudo"
      description="Le nom affiché dans le menu du compte. Chaque pseudo est unique (« Ghost » et « ghost » comptent comme le même)."
      onSubmit={submit}
      footer={
        <Button type="submit" disabled={busy || value.trim() === current || !value.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}Enregistrer
        </Button>
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="p-username">Pseudo</Label>
        <Input id="p-username" value={value} maxLength={32} autoComplete="nickname" onChange={e => setValue(e.target.value)} />
      </div>
    </Section>
  );
}

function EmailSection({ user }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState(user.new_email || '');

  const submit = async e => {
    e.preventDefault();
    const email = value.trim();
    if (!email || email.toLowerCase() === user.email?.toLowerCase()) return toast.error('Saisis une nouvelle adresse email.');
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ email }, { emailRedirectTo: redirectUrl() });
    setBusy(false);
    if (error) return toast.error(authErrorMessage(error));
    setSentTo(email);
    setValue('');
    toast.success('Email de confirmation envoyé');
  };

  return (
    <Section
      icon={AtSign}
      title="Adresse email"
      description={<>Adresse actuelle : <span className="text-foreground">{user.email}</span></>}
      onSubmit={submit}
      footer={
        <Button type="submit" disabled={busy || !value.trim()}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}Changer l'email
        </Button>
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="p-email">Nouvelle adresse email</Label>
        <Input id="p-email" type="email" autoComplete="email" placeholder="nouvelle@exemple.com" value={value} onChange={e => setValue(e.target.value)} />
      </div>
      {sentTo && (
        <p className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-muted-foreground">
          Changement en attente vers <span className="text-foreground">{sentTo}</span> : clique sur le lien de confirmation
          reçu par email (selon la configuration Supabase, l'ancienne adresse doit aussi confirmer). L'adresse ne change qu'après confirmation.
        </p>
      )}
    </Section>
  );
}

function PasswordSection({ user }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const current = String(f.get('current'));
    const password = String(f.get('password'));
    if (password.length < 6) return setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
    if (password !== String(f.get('confirm'))) return setError('Les deux nouveaux mots de passe ne correspondent pas.');
    setBusy(true); setError('');
    // Check the current password first so someone using an unlocked session can't change it
    const check = await supabase.auth.signInWithPassword({ email: user.email, password: current });
    if (check.error) {
      setBusy(false);
      return setError(/invalid login/i.test(check.error.message) ? 'Mot de passe actuel incorrect.' : authErrorMessage(check.error));
    }
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    form.reset();
    toast.success('Mot de passe modifié');
  };

  return (
    <Section
      icon={KeyRound}
      title="Mot de passe"
      onSubmit={submit}
      footer={
        <Button type="submit" disabled={busy}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}Changer le mot de passe
        </Button>
      }
    >
      <div className="space-y-1.5">
        <Label htmlFor="p-current">Mot de passe actuel</Label>
        <Input id="p-current" name="current" type="password" autoComplete="current-password" required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="p-new">Nouveau mot de passe</Label>
          <Input id="p-new" name="password" type="password" autoComplete="new-password" minLength={6} required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-confirm">Confirmer</Label>
          <Input id="p-confirm" name="confirm" type="password" autoComplete="new-password" minLength={6} required />
        </div>
      </div>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
    </Section>
  );
}

function ShareSection({ user }) {
  const name = displayName(user);
  // undefined = loading, null = no profile row yet
  const [profile, setProfile] = useState(undefined);
  const [handle, setHandle] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMyProfile(user.id).then(({ data, error }) => {
      if (error) { setError(profileErrorMessage(error)); setProfile(null); return; }
      setProfile(data);
      setHandle(data?.handle || suggestHandle(name));
      setIsPublic(!!data?.is_public);
    });
  }, [user.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cleanHandle = handle.trim().toLowerCase();
  const validHandle = HANDLE_RE.test(cleanHandle);
  const dirty = !profile || profile.handle !== cleanHandle || profile.is_public !== isPublic;

  const submit = async e => {
    e.preventDefault();
    if (!validHandle) return setError('Identifiant invalide : 3 à 30 caractères, lettres minuscules, chiffres et tirets (sans tiret au début).');
    setBusy(true); setError('');
    const { data, error } = await saveMyProfile(user.id, { handle: cleanHandle, display_name: name, is_public: isPublic });
    setBusy(false);
    if (error) return setError(profileErrorMessage(error));
    setProfile(data);
    toast.success(isPublic ? 'Profil public : tout le monde peut voir ta progression' : 'Profil privé');
  };

  const live = profile?.is_public;

  return (
    <Section
      icon={Globe}
      title="Partager mon profil"
      description="Rends ton profil public pour que les autres joueurs voient ta progression (lecture seule). Tu peux le repasser en privé à tout moment."
      onSubmit={submit}
      footer={
        <Button type="submit" disabled={busy || profile === undefined || !dirty}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}Enregistrer
        </Button>
      }
    >
      {profile === undefined ? (
        <Loader2 className="size-5 animate-spin text-primary" />
      ) : (
        <>
          <div className="flex items-center justify-between gap-4 rounded-lg border p-3">
            <div>
              <Label htmlFor="p-public">Profil public</Label>
              <p className="text-xs text-muted-foreground">
                {isPublic ? 'Visible dans la liste des joueurs et via ton lien.' : 'Seul toi peux voir ta progression.'}
              </p>
            </div>
            <Switch id="p-public" checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="p-handle">Identifiant du lien</Label>
            <div className="flex items-center rounded-md border bg-input/30 focus-within:ring-[3px] focus-within:ring-ring/50">
              <span className="truncate pl-3 text-sm text-muted-foreground">{window.location.host}/joueur/</span>
              <Input
                id="p-handle"
                value={handle}
                maxLength={30}
                onChange={e => setHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                className="border-0 bg-transparent pl-0.5 shadow-none focus-visible:ring-0 dark:bg-transparent"
              />
            </div>
            <p className="text-xs text-muted-foreground">3 à 30 caractères : lettres minuscules, chiffres et tirets.</p>
          </div>
          {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          {live && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 p-3">
              <code className="min-w-0 flex-1 truncate text-sm">{profileUrl(profile.handle)}</code>
              <Button type="button" variant="outline" size="sm" onClick={() => shareProfile(profile.handle, name)}><Link2 />Copier / partager</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => navigate(`/joueur/${profile.handle}`)}><ExternalLink />Voir</Button>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

const RESET_TARGETS = [...MODES.map(m => ({ id: m.id, label: m.label })), { id: 'all', label: 'Tout (tous les modes)' }];

function ProgressSection({ progress, onImport, onReset, currentMode }) {
  const [pending, setPending] = useState(null); // parsed file waiting for confirmation
  const [resetTarget, setResetTarget] = useState(currentMode || 'multi');
  const [confirmReset, setConfirmReset] = useState(false);
  const targetLabel = RESET_TARGETS.find(t => t.id === resetTarget)?.label;
  // Modes sharing the Multi progress: resetting one of them resets them all
  const linked = CHALLENGE_MODES.filter(m => progressKey(m, progress) === 'multi');
  const linkedNames = linked.map(id => MODES.find(m => m.id === id).short || MODES.find(m => m.id === id).label);
  const linkedNote = linked.length > 1 && linked.includes(resetTarget)
    ? ` ${linkedNames.slice(0, -1).join(', ')} et ${linkedNames.at(-1)} sont liés : ${linked.length > 2 ? 'les trois' : 'les deux'} seront remis à zéro.`
    : '';

  const exportFile = () => {
    const blob = new Blob([JSON.stringify(progress, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mw4-camos-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast.success('Progression exportée');
  };

  const pickFile = async e => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!data || typeof data !== 'object' || !['multi', 'dmz', 'warzone', 'prestige'].some(k => data[k])) throw new Error();
      setPending(data);
    } catch {
      toast.error('Fichier invalide : choisis un fichier exporté depuis ce site.');
    }
  };

  return (
    <Section
      icon={HardDrive}
      title="Ma progression"
      description="Sauvegarde ta progression dans un fichier, restaure-la depuis un fichier exporté, ou remets un mode à zéro."
    >
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportFile}><Download />Exporter</Button>
        <Button variant="outline" asChild>
          <label className="cursor-pointer">
            <Upload />Importer
            <input type="file" accept=".json,application/json" hidden onChange={pickFile} />
          </label>
        </Button>
      </div>

      <div className="space-y-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
        <p className="text-sm font-medium">Réinitialiser la progression</p>
        <p className="text-xs text-muted-foreground">Décoche tous les camos du mode choisi. Pense à exporter avant pour pouvoir revenir en arrière.</p>
        <div className="flex flex-wrap gap-2">
          <Select value={resetTarget} onValueChange={setResetTarget}>
            <SelectTrigger className="w-56" aria-label="Mode à réinitialiser"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RESET_TARGETS.map(t => <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="destructive" onClick={() => setConfirmReset(true)}><RotateCcw />Réinitialiser</Button>
        </div>
      </div>

      <AlertDialog open={confirmReset} onOpenChange={setConfirmReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser « {targetLabel} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Tous les camos {resetTarget === 'all' ? 'de tous les modes' : 'de ce mode'} seront décochés.{linkedNote}
              {' '}Cette action est définitive, sauf si tu as exporté ta progression avant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => { onReset(resetTarget); toast(`« ${targetLabel} » réinitialisé`); }}
            >
              Réinitialiser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!pending} onOpenChange={o => { if (!o) setPending(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Importer cette progression ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle remplacera toute ta progression actuelle (Multi, DMZ, Warzone et Prestige).
              Exporte d'abord la progression actuelle si tu veux pouvoir revenir en arrière.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { onImport(pending); setPending(null); toast.success('Progression importée'); }}>
              Importer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}

const DELETE_WORD = 'SUPPRIMER';

function DeleteAccountSection({ onDeleted }) {
  const { isAdmin } = useAuth();
  const [open, setOpen] = useState(false);
  const [word, setWord] = useState('');
  const [busy, setBusy] = useState(false);

  const deleteAccount = async () => {
    setBusy(true);
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      setBusy(false);
      return toast.error(error.code === 'PGRST202'
        ? "La fonction de suppression n'existe pas : exécute supabase/delete_account.sql."
        : 'Suppression impossible. Vérifie ta connexion et réessaie.');
    }
    onDeleted?.();
    await supabase.auth.signOut({ scope: 'local' });
    toast.success('Ton compte a été supprimé');
  };

  return (
    <Section
      icon={Trash2}
      title="Supprimer mon compte"
      description="Supprime définitivement ton compte, ta progression et ton profil public. Ton pseudo et ton email redeviennent disponibles."
    >
      <Button variant="destructive" onClick={() => setOpen(true)}><Trash2 />Supprimer mon compte</Button>

      <AlertDialog open={open} onOpenChange={o => { if (!busy) { setOpen(o); setWord(''); } }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement ton compte ?</AlertDialogTitle>
            <AlertDialogDescription>
              Ta progression et ton profil public seront effacés, sans retour possible.
              Exporte d'abord ta progression si tu veux en garder une copie.
              {isAdmin && ' Tu perdras aussi ton accès administrateur.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="delete-word">Écris {DELETE_WORD} pour confirmer</Label>
            <Input id="delete-word" value={word} autoComplete="off" onChange={e => setWord(e.target.value)} />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel>
            {/* Plain button: the dialog must stay open while deleting and if it fails */}
            <Button variant="destructive" disabled={busy || word.trim().toUpperCase() !== DELETE_WORD} onClick={deleteAccount}>
              {busy ? <Loader2 className="animate-spin" /> : <Trash2 />}Supprimer
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Section>
  );
}

/** Account page: username, email, password, progress export/import, account deletion. */
export default function ProfilePage({ user, progress, onImport, onReset, currentMode, onBack, beforeSignOut, onAccountDeleted }) {
  const signOut = async () => {
    await beforeSignOut?.();
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) toast.error('Déconnexion impossible');
  };

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Retour au tracker"><ArrowLeft /></Button>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
              {displayName(user).slice(0, 2)}
            </span>
            <div className="min-w-0">
              <h1 className="font-medium">Mon profil</h1>
              <p className="truncate text-xs text-muted-foreground">{displayName(user)}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={signOut} className="text-destructive hover:text-destructive">
            <LogOut /><span className="hidden sm:inline">Se déconnecter</span>
          </Button>
        </div>
      </header>

      <motion.main
        className="mx-auto max-w-3xl space-y-4 px-4 py-6 sm:px-6"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.06 } } }}
      >
        <UsernameSection user={user} />
        <EmailSection user={user} />
        <PasswordSection user={user} />
        <ShareSection user={user} />
        <ProgressSection progress={progress} onImport={onImport} onReset={onReset} currentMode={currentMode} />
        <DeleteAccountSection onDeleted={onAccountDeleted} />
      </motion.main>
    </div>
  );
}
