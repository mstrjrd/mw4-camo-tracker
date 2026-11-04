import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, Trophy, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { ease } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { MODES } from '../constants';
import { useCatalog } from '../catalog';
import SearchField from '../components/SearchField';
import CommunityFrame from './CommunityFrame';
import PlayerHero, { CamoCount } from './PlayerHero';
import { fetchPublicPlayers, profileErrorMessage } from './api';
import { formatPct, highlightCamos, playerName, playerStats } from './stats';

const MEDALS = ['text-amber-300', 'text-slate-300', 'text-orange-400'];

const openPlayer = p => navigate(`/joueur/${p.handle}`);

function PlayerRow({ player, rank, mode, cols, highlight }) {
  const s = player.stats[mode];
  const name = playerName(player);
  const medal = rank < 3 && s.done > 0;
  return (
    <button
      type="button"
      onClick={() => openPlayer(player)}
      className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 text-left outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 sm:flex-nowrap"
    >
      <span className={cn('w-7 shrink-0 text-center text-sm font-medium tabular-nums', medal ? MEDALS[rank] : 'text-muted-foreground')}>
        {medal ? <Trophy className="mx-auto size-4" /> : `#${rank + 1}`}
      </span>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium uppercase">
        {name.slice(0, 2)}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium uppercase">{name}</span>
      <span className="flex items-center gap-3 text-sm">
        {highlight.map(i => <CamoCount key={i} c={cols[i]} n={s.counts[i]} />)}
      </span>
      <span className="block w-full space-y-1 sm:w-40 sm:shrink-0">
        <span className="flex justify-between text-xs text-muted-foreground tabular-nums">
          <span>{s.done} / {s.max}</span>
          <span>{formatPct(s.pct)}</span>
        </span>
        <Progress value={s.pct} />
      </span>
    </button>
  );
}

/** Right column on wide screens: the best player for each high camo, then community totals. */
function CommunityPanel({ ranked, mode, cols, highlight }) {
  const leaders = highlight.map(i => {
    const best = ranked.reduce((a, p) => (p.stats[mode].counts[i] > (a?.stats[mode].counts[i] ?? 0) ? p : a), null);
    return { c: cols[i], player: best, n: best?.stats[mode].counts[i] ?? 0 };
  });
  const total = ranked.reduce((a, p) => a + p.stats[mode].done, 0);

  return (
    <aside className="sticky top-20 hidden space-y-4 xl:block">
      <Card size="sm">
        <CardHeader><CardTitle>Meilleurs par camo</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {leaders.map(({ c, player, n }) => (
            <button
              key={c.name}
              type="button"
              disabled={!player}
              onClick={() => openPlayer(player)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg p-2 text-left transition-colors outline-none enabled:hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <span className={'dot k-' + c.k} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{player ? playerName(player) : 'Personne'}</span>
                <span className="block truncate text-xs text-muted-foreground">{c.name}</span>
              </span>
              {player && <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{n}</span>}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader><CardTitle>Communauté</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-2">
            <span>Joueurs publics</span>
            <span className="text-muted-foreground tabular-nums">{ranked.length}</span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Camos validés</span>
            <span className="text-muted-foreground tabular-nums">{total.toLocaleString('fr-FR')}</span>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}

/** List of players who made their profile public, ranked by progress in the chosen mode. */
export default function CommunityPage() {
  const catalog = useCatalog();
  const [players, setPlayers] = useState(null);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('multi');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!supabase) return setError('Le site n’est pas relié à Supabase.');
    fetchPublicPlayers().then(({ data, error }) => {
      if (error) setError(profileErrorMessage(error));
      else setPlayers(data);
    });
  }, []);

  const ranked = useMemo(() => {
    if (!players) return [];
    return players
      .map(p => ({ ...p, stats: playerStats(p.progress, catalog.weapons) }))
      .sort((a, b) => b.stats[mode].done - a.stats[mode].done || playerName(a).localeCompare(playerName(b), 'fr'));
  }, [players, catalog.weapons, mode]);

  const q = search.trim().toLowerCase();
  const shown = ranked.filter(p => !q || playerName(p).toLowerCase().includes(q) || p.handle.includes(q));
  const cols = catalog.cols(mode);
  const highlight = highlightCamos(mode);
  const modeLabel = MODES.find(m => m.id === mode)?.label;
  const leader = !q && ranked[0]?.stats[mode].done > 0 ? ranked[0] : null;
  const searchProps = { value: search, onChange: setSearch, placeholder: 'Rechercher un joueur…' };

  return (
    <CommunityFrame
      title="Joueurs"
      mode={mode}
      onMode={setMode}
      search={searchProps}
      aside={ranked.length > 0 && <CommunityPanel ranked={ranked} mode={mode} cols={cols} highlight={highlight} />}
      footer={<>Les joueurs qui ont rendu leur profil public. Rends le tien visible depuis <span className="text-foreground">Mon profil › Partager mon profil</span>.</>}
    >
      {leader && (
        <PlayerHero
          player={leader}
          label={`${modeLabel} · En tête du classement`}
          mode={mode}
          weapons={catalog.weapons}
          cols={cols}
          highlight={highlight}
        >
          <Button onClick={() => openPlayer(leader)}><UserRound />Voir le profil</Button>
        </PlayerHero>
      )}

      <SearchField {...searchProps} className="lg:hidden" />

      {error ? (
        <p className="py-16 text-center text-sm text-destructive">{error}</p>
      ) : !players ? (
        <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-primary" /></div>
      ) : !shown.length ? (
        <p className="py-16 text-center text-muted-foreground">
          {players.length ? 'Aucun joueur ne correspond.' : 'Aucun profil public pour le moment.'}
        </p>
      ) : (
        <AnimatePresence mode="wait">
          <motion.section
            key={mode}
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease }}
          >
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-sm font-medium">Classement</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {shown.length} {shown.length > 1 ? 'joueurs' : 'joueur'}
              </span>
            </div>
            <div className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
              {shown.map(p => (
                <PlayerRow key={p.user_id} player={p} rank={ranked.indexOf(p)} mode={mode} cols={cols} highlight={highlight} />
              ))}
            </div>
          </motion.section>
        </AnimatePresence>
      )}
    </CommunityFrame>
  );
}
