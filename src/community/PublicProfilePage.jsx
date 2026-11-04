import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link2, Loader2, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { navigate, profileUrl } from '@/lib/router';
import { ease } from '@/lib/motion';
import { MODES } from '../constants';
import { useCatalog } from '../catalog';
import SearchField from '../components/SearchField';
import SidePanel from '../components/SidePanel';
import Summary from '../components/Summary';
import WeaponRow from '../components/WeaponRow';
import CommunityFrame from './CommunityFrame';
import PlayerHero from './PlayerHero';
import { fetchPublicPlayer, profileErrorMessage } from './api';
import { highlightCamos, modeProgress, playerName, playerStats } from './stats';

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

/** Read-only view of another player's progress, in the tracker's frame: /joueur/<handle> */
export default function PublicProfilePage({ handle }) {
  const catalog = useCatalog();
  const [player, setPlayer] = useState(undefined); // undefined = loading, null = not found / private
  const [error, setError] = useState('');
  const [mode, setMode] = useState('multi');
  const [open, setOpen] = useState({});
  const [search, setSearch] = useState('');

  useEffect(() => {
    setPlayer(undefined);
    if (!supabase) return setError('Le site n’est pas relié à Supabase.');
    fetchPublicPlayer(handle).then(({ data, error }) => {
      if (error) setError(profileErrorMessage(error));
      else setPlayer(data);
    });
  }, [handle]);

  const ranked = useMemo(
    () => (player ? { ...player, stats: playerStats(player.progress, catalog.weapons) } : null),
    [player, catalog.weapons],
  );

  const playersButton = (
    <Button variant="ghost" size="sm" onClick={() => navigate('/joueurs')} aria-label="Joueurs">
      <Users /><span className="hidden md:inline">Joueurs</span>
    </Button>
  );

  if (!ranked) {
    return (
      <CommunityFrame title="Profil joueur" mode={mode} onMode={setMode} actions={playersButton}>
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          {error ? <p className="text-sm text-destructive">{error}</p>
            : player === undefined ? <Loader2 className="size-8 animate-spin text-primary" />
            : (
              <>
                <p className="font-medium">Ce profil n'existe pas ou n'est pas public.</p>
                <Button variant="outline" onClick={() => navigate('/joueurs')}><Users />Voir les joueurs</Button>
              </>
            )}
        </div>
      </CommunityFrame>
    );
  }

  const name = playerName(ranked);
  const prog = modeProgress(ranked.stats.full, mode);
  const cols = catalog.cols(mode);
  const modeLabel = MODES.find(m => m.id === mode)?.label;
  const updated = player.progressUpdatedAt
    ? new Date(player.progressUpdatedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  const q = search.trim().toLowerCase();
  const isDone = id => prog[id].every(v => v === null || v === 1);
  const sections = catalog.categories
    .map(c => ({ ...c, shown: c.weapons.filter(w => !q || w.name.toLowerCase().includes(q)) }))
    .filter(c => c.shown.length);

  const toggleOpen = id => setOpen(o => ({ ...o, [mode + ':' + id]: !o[mode + ':' + id] }));

  // Used by the side panel: shows the weapon's row with its challenges open
  const focusWeapon = id => {
    setSearch('');
    setOpen(o => ({ ...o, [mode + ':' + id]: true }));
    setTimeout(() => document.getElementById('w-' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60);
  };

  const searchProps = { value: search, onChange: setSearch };

  return (
    <CommunityFrame
      title={name}
      mode={mode}
      onMode={setMode}
      search={searchProps}
      actions={playersButton}
      aside={<SidePanel categories={catalog.categories} weapons={catalog.weapons} prog={prog} onOpen={focusWeapon} />}
      footer="Profil public, en lecture seule. Images d'armes : codmunity.gg."
    >
      <PlayerHero
        player={ranked}
        label={`${modeLabel}${updated ? ` · Mis à jour le ${updated}` : ''}`}
        mode={mode}
        weapons={catalog.weapons}
        cols={cols}
        highlight={highlightCamos(mode)}
      >
        <Button onClick={() => shareProfile(player.handle, name)}>
          {navigator.share ? <Share2 /> : <Link2 />}Partager
        </Button>
      </PlayerHero>

      <Summary mode={mode} prog={prog} />

      <SearchField {...searchProps} className="lg:hidden" />

      <motion.div
        key={mode}
        className="space-y-6"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease }}
      >
        {sections.map(c => (
          <section key={c.name} className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-medium">{c.name}</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {c.weapons.filter(w => isDone(w.id)).length} / {c.weapons.length}
              </span>
            </div>
            <div className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              {c.shown.map(w => (
                <div key={w.id} id={'w-' + w.id}>
                  <WeaponRow
                    weapon={w}
                    arr={prog[w.id]}
                    cols={cols}
                    texts={mode === 'prestige' ? null : w[mode]}
                    open={!!open[mode + ':' + w.id]}
                    isLocked={noLock}
                    lockReason={noReason}
                    onToggle={noop}
                    onOpen={toggleOpen}
                    readOnly
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
        {!sections.length && <p className="py-16 text-center text-muted-foreground">Aucune arme ne correspond.</p>}
      </motion.div>
    </CommunityFrame>
  );
}
