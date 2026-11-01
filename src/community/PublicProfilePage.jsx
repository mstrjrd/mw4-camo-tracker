import { useEffect, useMemo, useState } from 'react';
import { Check, Link2, Loader2, Share2, UserRound, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { navigate, profileUrl } from '@/lib/router';
import { MODES } from '../constants';
import { useCatalog } from '../catalog';
import Summary from '../components/Summary';
import WeaponRow from '../components/WeaponRow';
import { PageHeader } from './CommunityPage';
import { fetchPublicPlayer, profileErrorMessage } from './api';
import { modeProgress } from './stats';
import { normalizeProgress } from '../useTracker';

const noLock = () => false;
const noReason = () => null;
const noop = () => {};

/** Copies the link, or opens the native share sheet on phones. */
export async function shareProfile(handle, name) {
  const url = profileUrl(handle);
  if (navigator.share) {
    try { await navigator.share({ title: `${name} — MW4 Camo Tracker`, url }); return; } catch { /* cancelled */ }
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success('Lien copié');
  } catch {
    toast(url);
  }
}

/** Read-only view of another player's progress: /joueur/<handle> */
export default function PublicProfilePage({ handle }) {
  const catalog = useCatalog();
  const [player, setPlayer] = useState(undefined); // undefined = loading, null = not found / private
  const [error, setError] = useState('');
  const [mode, setMode] = useState('multi');
  const [open, setOpen] = useState({});

  useEffect(() => {
    setPlayer(undefined);
    if (!supabase) return setError('Le site n’est pas relié à Supabase.');
    fetchPublicPlayer(handle).then(({ data, error }) => {
      if (error) setError(profileErrorMessage(error));
      else setPlayer(data);
    });
  }, [handle]);

  const full = useMemo(() => (player ? normalizeProgress(player.progress, catalog.weapons) : null), [player, catalog.weapons]);
  const name = player?.display_name || player?.handle || handle;

  if (error || player === undefined || player === null) {
    return (
      <div className="min-h-svh">
        <PageHeader title="Profil joueur" icon={UserRound} onBack={() => navigate('/')} />
        <main className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-20 text-center">
          {error ? <p className="text-sm text-destructive">{error}</p>
            : player === undefined ? <Loader2 className="size-8 animate-spin text-primary" />
            : (
              <>
                <p className="font-medium">Ce profil n'existe pas ou n'est pas public.</p>
                <Button variant="outline" onClick={() => navigate('/joueurs')}><Users />Voir les joueurs</Button>
              </>
            )}
        </main>
      </div>
    );
  }

  const prog = modeProgress(full, mode);
  const cols = catalog.cols(mode);
  const updated = player.progressUpdatedAt
    ? new Date(player.progressUpdatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="min-h-svh">
      <PageHeader title={name} onBack={() => navigate('/')} wide>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/joueurs')}><Users /><span className="hidden sm:inline">Joueurs</span></Button>
          <Button variant="outline" size="sm" onClick={() => shareProfile(player.handle, name)}>
            {navigator.share ? <Share2 /> : <Link2 />}<span className="hidden sm:inline">Partager</span>
          </Button>
        </div>
      </PageHeader>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary uppercase">
              {name.slice(0, 2)}
            </span>
            <div>
              <p className="text-lg font-bold">{name}</p>
              <p className="text-xs text-muted-foreground">
                <Badge variant="outline" className="mr-2"><Check />Profil public</Badge>
                {updated && `Mis à jour le ${updated}`}
              </p>
            </div>
          </div>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              {MODES.map(m => (
                <TabsTrigger key={m.id} value={m.id} className="px-2 sm:px-3">
                  <span className="sm:hidden">{m.short || m.label}</span>
                  <span className="hidden sm:inline">{m.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <Summary mode={mode} prog={prog} />

        {catalog.categories.map(c => (
          <section key={c.name} className="space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{c.name}</h2>
              <Badge variant="outline" className="tabular-nums">
                {c.weapons.filter(w => prog[w.id].every(v => v === null || v === 1)).length} / {c.weapons.length}
              </Badge>
            </div>
            <div className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              {c.weapons.map(w => (
                <WeaponRow
                  key={w.id}
                  weapon={w}
                  arr={prog[w.id]}
                  cols={cols}
                  texts={mode === 'prestige' ? null : w[mode]}
                  open={!!open[mode + ':' + w.id]}
                  isLocked={noLock}
                  lockReason={noReason}
                  onToggle={noop}
                  onOpen={id => setOpen(o => ({ ...o, [mode + ':' + id]: !o[mode + ':' + id] }))}
                  readOnly
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
