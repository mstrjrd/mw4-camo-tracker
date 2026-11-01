import { motion } from 'motion/react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import AnimatedNumber from './AnimatedNumber';
import { pct } from '../constants';
import { useCatalog } from '../catalog';

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

function Stat({ label, n, tot, dot, total }) {
  const p = pct(n, tot);
  return (
    <motion.div variants={item}>
      <Card size="sm" className={cn('h-full', total && 'bg-primary/5 ring-primary/40')}>
        <CardContent className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {dot && <span className={'dot ' + dot} />}
            {label}
          </div>
          <div className="text-2xl font-bold tabular-nums">
            <AnimatedNumber value={n} />{' '}
            <span className="text-sm font-normal text-muted-foreground">
              / {tot} · <AnimatedNumber value={p} decimals={1} />%
            </span>
          </div>
          <Progress value={p} className="[&>[data-slot=progress-indicator]]:duration-700" />
        </CardContent>
      </Card>
    </motion.div>
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
    // keyed by mode so the stagger replays when switching tabs
    <motion.section
      key={mode}
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.05 } } }}
    >
      {stats}
    </motion.section>
  );
}
