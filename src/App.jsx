import { useState } from 'react';
import { CloudOff, HardDriveDownload, Loader2, LogIn, Search, UserPlus, Users, X } from 'lucide-react';
import { navigate } from '@/lib/router';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MODES } from './constants';
import { useCatalog } from './catalog';
import { useTracker } from './useTracker';
import Summary from './components/Summary';
import WeaponRow from './components/WeaponRow';
import UserMenu, { SyncStatus } from './components/UserMenu';
import ProfilePage from './profile/ProfilePage';
import BottomNav from './components/BottomNav';
import Logo from './components/Logo';

const ALL = 'all';
const layoutSpring = { type: 'spring', stiffness: 380, damping: 34 };

/** user = null → guest mode (progress kept only in this browser). onAuth(tab) opens the login/signup forms. */
export default function App({ user, onAuth, onAdmin }) {
  const {
    ui, mode, progress, prog, linkDmz, status, isLocked, lockReason, legacyAvailable,
    toggle, setLinkDmz, setUiValue, toggleOpen, resetMode, importProgress, importLegacy, dismissLegacy, retry, flush,
  } = useTracker(user?.id ?? null);
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState(ALL);
  // tracker | profile — the profile lives here so it shares the tracker's progress & saving
  const [page, setPage] = useState('tracker');
  const catalog = useCatalog();

  if (status === 'loading' || status === 'load-error') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
        {status === 'loading' ? (
          <>
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Chargement de ta progression…</p>
          </>
        ) : (
          <>
            <p className="font-medium">Impossible de charger ta progression.</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Vérifie ta connexion, et que la table <code>progress</code> existe bien dans Supabase (fichier <code>supabase/schema.sql</code>).
            </p>
            <Button onClick={retry}>Réessayer</Button>
          </>
        )}
      </div>
    );
  }

  if (page === 'profile' && user) {
    return (
      <ProfilePage
        user={user}
        progress={progress}
        onImport={importProgress}
        onReset={resetMode}
        currentMode={mode}
        linkDmz={linkDmz}
        onBack={() => setPage('tracker')}
        beforeSignOut={flush}
      />
    );
  }

  const { hideDone, open } = ui;
  const cols = catalog.cols(mode);
  const q = search.trim().toLowerCase();
  const isDone = id => prog[id].every(v => v === null || v === 1);

  const sections = catalog.categories
    .filter(c => cat === ALL || c.name === cat)
    .map(c => ({
      ...c,
      doneCount: c.weapons.filter(w => isDone(w.id)).length,
      shown: c.weapons.filter(w => (!q || w.name.toLowerCase().includes(q)) && !(hideDone && isDone(w.id))),
    }))
    .filter(c => c.shown.length);

  // Visible position of each card, used to stagger the entrance animation
  const order = new Map(sections.flatMap(c => c.shown).map((w, i) => [w.id, i]));

  return (
    <Tabs value={mode} onValueChange={v => setUiValue('mode', v)} className="min-h-svh gap-0">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size={40} />
            <div>
              <h1 className="text-base font-bold uppercase tracking-wider">MW4 Camo Tracker</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop tabs; on phones the modes are in the bottom bar (BottomNav) */}
            <TabsList className="hidden sm:inline-flex">
              {MODES.map(m => (
                <TabsTrigger key={m.id} value={m.id} className="px-3">{m.label}</TabsTrigger>
              ))}
            </TabsList>
            {onAuth && (
              <Button variant="ghost" size="sm" onClick={() => navigate('/joueurs')} aria-label="Joueurs">
                <Users /><span className="hidden md:inline">Joueurs</span>
              </Button>
            )}
            {user ? (
              <>
                <SyncStatus status={status} onRetry={flush} />
                <UserMenu user={user} beforeSignOut={flush} onAdmin={onAdmin} onProfile={() => setPage('profile')} />
              </>
            ) : onAuth && (
              <Button size="sm" onClick={() => onAuth('login')} aria-label="Se connecter">
                <LogIn /><span className="hidden sm:inline">Se connecter</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <AnimatePresence>
          {!user && (
            <motion.div key="guest" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <Card size="sm" className="bg-amber-500/10 ring-amber-500/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-400">
                    <CloudOff className="size-4 shrink-0" />Tu n'es pas connecté : ta progression n'est pas sauvegardée
                  </CardTitle>
                  <CardDescription>
                    Elle reste seulement sur ce navigateur et peut être perdue (cache vidé, autre appareil, navigation privée).
                    {onAuth && ' Connecte-toi ou crée un compte pour la garder et la retrouver partout : tes camos déjà cochés pourront être importés.'}
                  </CardDescription>
                </CardHeader>
                {onAuth && (
                  <CardContent className="flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => onAuth('signup')}><UserPlus />Créer un compte</Button>
                    <Button size="sm" variant="outline" onClick={() => onAuth('login')}><LogIn />Se connecter</Button>
                  </CardContent>
                )}
              </Card>
            </motion.div>
          )}
          {legacyAvailable && (
            <motion.div key="legacy" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <Card size="sm" className="ring-primary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><HardDriveDownload className="size-4 text-primary" />Progression trouvée sur ce navigateur</CardTitle>
                  <CardDescription>Tu avais coché des camos sans être connecté. Tu veux les ajouter à ton compte ?</CardDescription>
                  <CardAction className="flex gap-2">
                    <Button size="sm" onClick={() => { importLegacy(); toast.success('Progression importée dans ton compte'); }}>Importer</Button>
                    <Button size="sm" variant="ghost" onClick={dismissLegacy} aria-label="Ignorer"><X /></Button>
                  </CardAction>
                </CardHeader>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Summary mode={mode} prog={prog} />

        <section className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-[1_1_220px]">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Rechercher une arme…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes les catégories</SelectItem>
              {catalog.categories.map(c => <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Switch id="hide-done" checked={hideDone} onCheckedChange={v => setUiValue('hideDone', v)} />
            <Label htmlFor="hide-done">Masquer les terminées</Label>
          </div>
          {mode === 'dmz' && (
            <div className="flex items-center gap-2">
              <Switch id="link-dmz" checked={linkDmz} onCheckedChange={setLinkDmz} />
              <Label htmlFor="link-dmz">DMZ lié au Multi</Label>
            </div>
          )}
        </section>

        {/* Keyed by mode: switching tab fades the old list out and staggers the new one in */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="space-y-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              {sections.map(c => (
                <motion.section
                  key={c.name}
                  layout
                  className="space-y-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ layout: layoutSpring }}
                >
                  <motion.div layout="position" className="flex items-center justify-between border-b pb-2">
                    <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{c.name}</h2>
                    <Badge variant="outline" className="tabular-nums">{c.doneCount} / {c.weapons.length}</Badge>
                  </motion.div>
                  <div className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {c.shown.map(w => (
                        <motion.div
                          key={w.id}
                          layout="position"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0, transition: { delay: Math.min(order.get(w.id), 20) * 0.025, type: 'spring', stiffness: 280, damping: 28 } }}
                          exit={{ opacity: 0, transition: { duration: 0.12 } }}
                          transition={{ layout: layoutSpring }}
                        >
                          <WeaponRow
                            weapon={w}
                            arr={prog[w.id]}
                            cols={cols}
                            texts={mode === 'prestige' ? null : w[mode]}
                            open={!!open[mode + ':' + w.id]}
                            isLocked={isLocked}
                            lockReason={lockReason}
                            onToggle={toggle}
                            onOpen={toggleOpen}
                          />
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.section>
              ))}
            </AnimatePresence>
            {!sections.length && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-16 text-center text-muted-foreground">
                Aucune arme ne correspond.
              </motion.p>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* extra bottom padding on phones so the bottom bar never hides the footer */}
      <footer className="mx-auto w-full max-w-7xl space-y-3 px-4 pb-28 sm:px-6 sm:pb-10">
        <p className="text-sm text-muted-foreground">
          {user
            ? 'Progression enregistrée dans ton compte et synchronisée sur tous tes appareils.'
            : 'Mode invité : progression non sauvegardée dans un compte.'}{' '}
          Données issues du Google Sheet « MW4 Camo Tracker », images d'armes : codmunity.gg.
        </p>
      </footer>
      <BottomNav mode={mode} onChange={v => setUiValue('mode', v)} />
    </Tabs>
  );
}
