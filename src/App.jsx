import { useState } from 'react';
import { CloudOff, HardDriveDownload, Loader2, LogIn, UserPlus, Users, X } from 'lucide-react';
import { navigate } from '@/lib/router';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ease } from '@/lib/motion';
import { MODES } from './constants';
import { useCatalog } from './catalog';
import { useTracker } from './useTracker';
import Summary from './components/Summary';
import WeaponRow from './components/WeaponRow';
import UserMenu, { SyncStatus } from './components/UserMenu';
import ProfilePage from './profile/ProfilePage';
import BottomNav, { MODE_ITEMS } from './components/BottomNav';
import IconRail from './components/IconRail';
import SearchField from './components/SearchField';
import WeaponHero from './components/WeaponHero';
import SidePanel from './components/SidePanel';
import Logo from './components/Logo';

const ALL = 'all';
const layoutMove = { duration: 0.3, ease };

/** user = null → guest mode (progress kept only in this browser). onAuth(tab) opens the login/signup forms. */
export default function App({ user, onAuth, onAdmin }) {
  const {
    ui, mode, progress, prog, linkDmz, linkWarzone, status, isLocked, lockReason, legacyAvailable,
    toggle, setLinkDmz, setLinkWarzone, setUiValue, toggleOpen, resetMode, importProgress, importLegacy, dismissLegacy, retry, flush, discardPending,
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
        onBack={() => setPage('tracker')}
        beforeSignOut={flush}
        onAccountDeleted={discardPending}
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

  // Used by the hero and the side panel: shows the weapon's row with its challenges open
  const focusWeapon = id => {
    setSearch('');
    setCat(ALL);
    if (!open[mode + ':' + id]) toggleOpen(id);
    setTimeout(() => document.getElementById('w-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  return (
    <div className="min-h-svh lg:pl-20">
      <IconRail label="Modes de jeu" items={MODE_ITEMS} value={mode} onChange={v => setUiValue('mode', v)} onHome={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Logo size={32} className="lg:hidden" />
            {/* On desktop the rail carries the logo and the header carries the search */}
            <h1 className="truncate text-base font-medium lg:sr-only">MW4 Camo Tracker</h1>
            <SearchField value={search} onChange={setSearch} className="hidden w-full max-w-md lg:block" />
          </div>
          <div className="flex items-center gap-3">
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

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:pt-14 xl:grid xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-6">
        <div className="min-w-0 space-y-6">
        <AnimatePresence>
          {!user && (
            <motion.div key="guest" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <Card size="sm">
                <CardContent className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                  <div className="min-w-0 flex-[1_1_320px] space-y-1">
                    <p className="flex items-center gap-2 text-sm font-medium">
                      <CloudOff className="size-4 shrink-0 text-amber-400" />Progression non sauvegardée
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Elle sera effacée dès que tu fermeras cet onglet ou ton navigateur.
                      {onAuth && ' Crée un compte pour la retrouver partout : tes camos déjà cochés pourront être importés.'}
                    </p>
                  </div>
                  {onAuth && (
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" onClick={() => onAuth('signup')}><UserPlus />Créer un compte</Button>
                      <Button size="sm" variant="outline" onClick={() => onAuth('login')}><LogIn />Se connecter</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
          {legacyAvailable && (
            <motion.div key="legacy" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }}>
              <Card size="sm" className="ring-primary/40">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><HardDriveDownload className="size-4 text-primary" />Progression trouvée dans cet onglet</CardTitle>
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

        <WeaponHero
          modeLabel={MODES.find(m => m.id === mode)?.label}
          mode={mode}
          weapons={catalog.weapons}
          prog={prog}
          cols={cols}
          isLocked={isLocked}
          lockReason={lockReason}
          onOpen={focusWeapon}
        />

        <Summary mode={mode} prog={prog} />

        <section className="flex flex-wrap items-center gap-3">
          <SearchField value={search} onChange={setSearch} className="flex-[1_1_220px] lg:hidden" />
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
          {mode === 'warzone' && (
            <div className="flex items-center gap-2">
              <Switch id="link-warzone" checked={linkWarzone} onCheckedChange={setLinkWarzone} />
              <Label htmlFor="link-warzone">Warzone lié au Multi</Label>
            </div>
          )}
        </section>

        {/* Keyed by mode: switching tab fades the old list out and staggers the new one in */}
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            className="space-y-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
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
                  transition={{ layout: layoutMove }}
                >
                  <motion.div layout="position" className="flex items-center justify-between pb-1">
                    <h2 className="text-sm font-medium">{c.name}</h2>
                    <span className="text-xs text-muted-foreground tabular-nums">{c.doneCount} / {c.weapons.length}</span>
                  </motion.div>
                  <div className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {c.shown.map(w => (
                        <motion.div
                          key={w.id}
                          id={'w-' + w.id}
                          layout="position"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0, transition: { duration: 0.12 } }}
                          transition={{ layout: layoutMove }}
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
        </div>
        <SidePanel categories={catalog.categories} weapons={catalog.weapons} prog={prog} onOpen={focusWeapon} />
      </main>

      {/* extra bottom padding below lg so the bottom bar never hides the footer */}
      <footer className="mx-auto w-full max-w-[1600px] space-y-3 px-4 pb-28 sm:px-6 lg:pb-10">
        <p className="text-sm text-muted-foreground">
          {user
            ? 'Progression enregistrée dans ton compte et synchronisée sur tous tes appareils.'
            : 'Mode invité : progression non sauvegardée dans un compte.'}{' '}
          Données issues du Google Sheet « MW4 Camo Tracker », images d'armes et de camouflages : codmunity.gg.
        </p>
      </footer>
      <BottomNav label="Modes de jeu" items={MODE_ITEMS} value={mode} onChange={v => setUiValue('mode', v)} />
    </div>
  );
}
