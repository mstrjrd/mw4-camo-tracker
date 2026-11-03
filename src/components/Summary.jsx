import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import AnimatedNumber from './AnimatedNumber';
import { pct } from '../constants';
import { useCatalog } from '../catalog';

function Stat({ label, n, tot, dot, total }) {
  const p = pct(n, tot);
  return (
    <Card size="sm" className={cn('h-full', total && 'col-span-2 sm:col-span-4 2xl:col-span-2')}>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {dot && <span className={'dot ' + dot} />}
          {label}
        </div>
        <div className={cn('font-medium tabular-nums', total ? 'text-4xl' : 'text-2xl')}>
          <AnimatedNumber value={n} />{' '}
          <span className="text-sm font-normal text-muted-foreground">
            / {tot} · <AnimatedNumber value={p} decimals={1} />&nbsp;%
          </span>
        </div>
        {/* The accent is kept for the overall figure; each camo's bar stays neutral */}
        <Progress
          value={p}
          className={cn('[&>[data-slot=progress-indicator]]:duration-700', !total && '[&>[data-slot=progress-indicator]]:bg-foreground/40')}
        />
      </CardContent>
    </Card>
  );
}

export default function Summary({ mode, prog }) {
  const catalog = useCatalog();
  const WEAPONS = catalog.weapons;
  const TOTAL_W = WEAPONS.length;
  const cols = catalog.cols(mode);
  let stats;
  if (mode === 'prestige') {
    const rows = cols.map((c, i) => {
      const avail = WEAPONS.filter(w => prog[w.id][i] !== null);
      return { c, n: avail.filter(w => prog[w.id][i]).length, tot: avail.length };
    });
    stats = [
      <Stat key="total" label="Total" n={rows.reduce((a, r) => a + r.n, 0)} tot={rows.reduce((a, r) => a + r.tot, 0)} total />,
      ...rows.map(r => <Stat key={r.c.name} label={r.c.name} n={r.n} tot={r.tot} dot={'k-' + r.c.k} />),
    ];
  } else {
    const done = WEAPONS.reduce((a, w) => a + prog[w.id].filter(Boolean).length, 0);
    stats = [
      <Stat key="total" label="Total camos" n={done} tot={TOTAL_W * cols.length} total />,
      ...[3, 4, 5, 6].map(i => (
        <Stat key={i} label={cols[i].name} n={WEAPONS.filter(w => prog[w.id][i]).length} tot={TOTAL_W} dot={'k-' + cols[i].k} />
      )),
    ];
  }
  return (
    <motion.section
      key={mode}
      className="grid grid-cols-2 gap-3 sm:grid-cols-4 2xl:grid-cols-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {stats}
    </motion.section>
  );
}
