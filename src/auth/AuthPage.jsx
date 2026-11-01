import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, MailCheck, ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase, redirectUrl } from '@/lib/supabase';
import { authErrorMessage, useAuth } from './AuthProvider';

function Field({ id, label, ...props }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={id} required {...props} />
    </div>
  );
}

function ErrorText({ children }) {
  return (
    <AnimatePresence>
      {children && (
        <motion.p
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="text-sm text-destructive"
          role="alert"
        >
          {children}
        </motion.p>
      )}
    </AnimatePresence>
  );
}

/** Shared page shell: centered card with the logo. */
export function AuthShell({ title, description, children, footer }) {
  return (
    <div className="flex min-h-svh items-center justify-center px-4 py-10">
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <Logo size={72} />
          <div>
            <h1 className="text-lg font-bold tracking-wider uppercase">MW4 Camo Tracker</h1>
            <p className="text-sm text-muted-foreground">Suis ta progression de camos, sur tous tes appareils.</p>
          </div>
        </div>
        <Card>
          {(title || description) && (
            <CardHeader>
              {title && <CardTitle>{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </CardHeader>
          )}
          {children}
        </Card>
        {footer}
      </motion.div>
    </div>
  );
}

function LoginForm({ onForgot }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setError('');
    const { error } = await supabase.auth.signInWithPassword({
      email: String(f.get('email')).trim(),
      password: String(f.get('password')),
    });
    setBusy(false);
    if (error) setError(authErrorMessage(error));
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-(--card-spacing)">
      <CardContent className="space-y-4">
        <Field id="email" label="Email" type="email" autoComplete="email" placeholder="toi@exemple.com" />
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Mot de passe</Label>
            <button type="button" onClick={onForgot} className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
              Mot de passe oublié ?
            </button>
          </div>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
        <ErrorText>{error}</ErrorText>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}Se connecter
        </Button>
      </CardFooter>
    </form>
  );
}

function SignupForm() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  const submit = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const username = String(f.get('username')).trim();
    const email = String(f.get('email')).trim();
    const password = String(f.get('password'));
    if (password !== String(f.get('confirm'))) return setError('Les deux mots de passe ne correspondent pas.');
    if (password.length < 6) return setError('Le mot de passe doit contenir au moins 6 caractères.');

    setBusy(true); setError('');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username }, emailRedirectTo: redirectUrl() },
    });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    // No session = email confirmation is enabled on the project
    if (!data.session) setSentTo(email);
    else toast.success(`Bienvenue ${username} !`);
  };

  if (sentTo) {
    return (
      <CardContent className="flex flex-col items-center gap-3 py-4 text-center">
        <MailCheck className="size-10 text-primary" />
        <p className="font-medium">Vérifie ta boîte mail</p>
        <p className="text-sm text-muted-foreground">
          Un lien de confirmation a été envoyé à <span className="text-foreground">{sentTo}</span>. Clique dessus puis reviens te connecter.
        </p>
      </CardContent>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-(--card-spacing)">
      <CardContent className="space-y-4">
        <Field id="username" label="Pseudo" autoComplete="nickname" placeholder="Ton pseudo en jeu" maxLength={32} />
        <Field id="email" label="Email" type="email" autoComplete="email" placeholder="toi@exemple.com" />
        <Field id="password" label="Mot de passe" type="password" autoComplete="new-password" minLength={6} />
        <Field id="confirm" label="Confirmer le mot de passe" type="password" autoComplete="new-password" minLength={6} />
        <ErrorText>{error}</ErrorText>
      </CardContent>
      <CardFooter>
        <Button type="submit" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}Créer mon compte
        </Button>
      </CardFooter>
    </form>
  );
}

function ForgotForm({ onBack }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async e => {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email')).trim();
    setBusy(true); setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectUrl() });
    setBusy(false);
    if (error) setError(authErrorMessage(error));
    else setSent(true);
  };

  return (
    <>
      <CardHeader>
        <CardTitle>Mot de passe oublié</CardTitle>
        <CardDescription>On t’envoie un lien pour en choisir un nouveau.</CardDescription>
      </CardHeader>
      {sent ? (
        <CardContent className="flex flex-col items-center gap-3 py-2 text-center">
          <MailCheck className="size-10 text-primary" />
          <p className="text-sm text-muted-foreground">Si un compte existe avec cet email, un lien de réinitialisation vient d’être envoyé.</p>
        </CardContent>
      ) : (
        <form onSubmit={submit} id="forgot" className="pb-(--card-spacing)">
          <CardContent className="space-y-4">
            <Field id="email" label="Email" type="email" autoComplete="email" placeholder="toi@exemple.com" />
            <ErrorText>{error}</ErrorText>
          </CardContent>
        </form>
      )}
      <CardFooter className="flex-col gap-2">
        {!sent && (
          <Button type="submit" form="forgot" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}Envoyer le lien
          </Button>
        )}
        <Button variant="ghost" className="w-full" onClick={onBack}>
          <ArrowLeft />Retour à la connexion
        </Button>
      </CardFooter>
    </>
  );
}

export default function AuthPage({ initialTab = 'login', onBack }) {
  const [tab, setTab] = useState(initialTab);

  return (
    <AuthShell
      footer={onBack && (
        <Button variant="ghost" className="mt-4 w-full text-muted-foreground" onClick={onBack}>
          <ArrowLeft />Continuer sans compte
        </Button>
      )}
    >
      {tab === 'forgot' ? (
        <ForgotForm onBack={() => setTab('login')} />
      ) : (
        <Tabs value={tab} onValueChange={setTab} className="gap-0">
          <div className="px-4">
            <TabsList className="w-full">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="signup">Inscription</TabsTrigger>
            </TabsList>
          </div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              className="pt-4"
              initial={{ opacity: 0, x: tab === 'login' ? -12 : 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === 'login' ? 12 : -12 }}
              transition={{ duration: 0.16 }}
            >
              {tab === 'login' ? <LoginForm onForgot={() => setTab('forgot')} /> : <SignupForm />}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      )}
    </AuthShell>
  );
}

/** Shown after clicking the password-reset email link. */
export function NewPasswordPage() {
  const { endRecovery } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async e => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get('password'));
    if (password !== String(f.get('confirm'))) return setError('Les deux mots de passe ne correspondent pas.');
    setBusy(true); setError('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setError(authErrorMessage(error));
    toast.success('Mot de passe mis à jour');
    endRecovery();
  };

  return (
    <AuthShell title="Nouveau mot de passe" description="Choisis ton nouveau mot de passe.">
      <form onSubmit={submit} className="flex flex-col gap-(--card-spacing)">
        <CardContent className="space-y-4">
          <Field id="password" label="Nouveau mot de passe" type="password" autoComplete="new-password" minLength={6} />
          <Field id="confirm" label="Confirmer" type="password" autoComplete="new-password" minLength={6} />
          <ErrorText>{error}</ErrorText>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}Enregistrer
          </Button>
        </CardFooter>
      </form>
    </AuthShell>
  );
}
