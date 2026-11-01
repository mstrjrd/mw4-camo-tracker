import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, AtSign, Download, KeyRound, Loader2, LogOut, RotateCcw, Save, Upload, UserRound, HardDrive } from 'lucide-react';
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
import { MODES } from '../constants';
import { authErrorMessage, displayName } from '@/auth/AuthProvider';

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

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
    const { error } = await supabase.auth.updateUser({ data: { username } });
    setBusy(false);
    if (error) return toast.error(authErrorMessage(error));
    toast.success('Pseudo mis à jour');
  };

  return (
    <Section
      icon={UserRound}
      title="Pseudo"
      description="Le nom affiché dans le menu du compte."
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

const RESET_TARGETS = [...MODES.map(m => ({ id: m.id, label: m.label })), { id: 'all', label: 'Tout (tous les modes)' }];

function ProgressSection({ progress, onImport, onReset, currentMode, linkDmz }) {
  const [pending, setPending] = useState(null); // parsed file waiting for confirmation
  const [resetTarget, setResetTarget] = useState(currentMode || 'multi');
  const [confirmReset, setConfirmReset] = useState(false);
  const targetLabel = RESET_TARGETS.find(t => t.id === resetTarget)?.label;
  const linkedNote = linkDmz && (resetTarget === 'multi' || resetTarget === 'dmz')
    ? ' Multi et DMZ sont liés : les deux seront remis à zéro.'
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

/** Account page: username, email, password, progress export/import. */
export default function ProfilePage({ user, progress, onImport, onReset, currentMode, linkDmz, onBack, beforeSignOut }) {
  const signOut = async () => {
    await beforeSignOut?.();
    const { error } = await supabase.auth.signOut();
    if (error) toast.error('Déconnexion impossible');
  };

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Retour au tracker"><ArrowLeft /></Button>
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary uppercase">
              {displayName(user).slice(0, 2)}
            </span>
            <div className="min-w-0">
              <h1 className="font-bold tracking-wider uppercase">Mon profil</h1>
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
        <ProgressSection progress={progress} onImport={onImport} onReset={onReset} currentMode={currentMode} linkDmz={linkDmz} />
      </motion.main>
    </div>
  );
}
