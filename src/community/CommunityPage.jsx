import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Loader2, Search, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { cn } from '@/lib/utils';
import { MODES } from '../constants';
import { useCatalog } from '../catalog';
import { fetchPublicPlayers, profileErrorMessage } from './api';
import { playerStats } from './stats';

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 26 } },
};

const MEDALS = ['text-amber-300', 'text-slate-300', 'text-orange-400'];

/** Small colored pill: camo dot + count (e.g. ● 12). */
function CamoCount({ c, n }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums" title={c.name}>
      <span className={'dot k-' + c.k} />{n}
    </span>
  );
}

export function PageHeader({ title, icon: Icon, onBack, children }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Button variant="ghost" size="icon" onClick={onBack} aria-label="Retour au tracker"><ArrowLeft /></Button>
          {Icon && <Icon className="size-5 shrink-0 text-primary" />}
          <h1 className="truncate font-bold tracking-wider uppercase">{title}</h1>
        </div>
        {children}
      </div>
    </header>
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
      .sort((a, b) => b.stats[mode].done - a.stats[mode].done || a.display_name.localeCompare(b.display_name, 'fr'));
  }, [players, catalog.weapons, mode]);

  const q = search.trim().toLowerCase();
  const shown = ranked.filter(p => !q || p.display_name.toLowerCase().includes(q) || p.handle.includes(q));
  const cols = catalog.cols(mode);
  const highlight = mode === 'prestige' ? [0, 1, 2, 3] : [3, 4, 5, 6];

  return (
    <div className="min-h-svh">
      <PageHeader title="Joueurs" icon={Users} onBack={() => navigate('/')} />

      <main className="mx-auto max-w-5xl space-y-5 px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Les joueurs qui ont rendu leur profil public. Rends le tien visible depuis <span className="text-foreground">Mon profil › Partager mon profil</span>.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-[1_1_220px]">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input type="search" placeholder="Rechercher un joueur…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
          </div>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList>
              {MODES.map(m => <TabsTrigger key={m.id} value={m.id} className="px-2 sm:px-3">{m.short || m.label}</TabsTrigger>)}
            </TabsList>
          </Tabs>
        </div>

        {error ? (
          <p className="py-16 text-center text-sm text-destructive">{error}</p>
        ) : !players ? (
          <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin text-primary" /></div>
        ) : !shown.length ? (
          <p className="py-16 text-center text-muted-foreground">
            {players.length ? 'Aucun joueur ne correspond.' : 'Aucun profil public pour le moment. Sois le premier !'}
          </p>
        ) : (
          <motion.div
            key={mode}
            className="space-y-2"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.04 } } }}
          >
            {shown.map(p => {
              const s = p.stats[mode];
              const rank = ranked.indexOf(p);
              return (
                <motion.div key={p.user_id} variants={item}>
                  <Card size="sm" className="cursor-pointer transition-colors hover:bg-muted/40" onClick={() => navigate(`/joueur/${p.handle}`)}>
                    <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span className={cn('w-7 text-center font-bold tabular-nums', MEDALS[rank] || 'text-muted-foreground')}>
                        {rank < 3 ? <Trophy className="mx-auto size-4" /> : `#${rank + 1}`}
                      </span>
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary uppercase">
                        {(p.display_name || p.handle).slice(0, 2)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{p.display_name || p.handle}</p>
                        <p className="truncate text-xs text-muted-foreground">/joueur/{p.handle}</p>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        {highlight.map(i => <CamoCount key={i} c={cols[i]} n={s.counts[i]} />)}
                      </div>
                      <div className="w-full space-y-1 sm:w-40">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{s.done} / {s.max}</span>
                          <Badge variant="secondary" className="h-4 px-1.5 text-[10px] tabular-nums">{s.pct}%</Badge>
                        </div>
                        <Progress value={s.pct} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
}
