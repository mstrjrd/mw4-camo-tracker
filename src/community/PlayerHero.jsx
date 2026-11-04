import { motion } from 'motion/react';
import { ease } from '@/lib/motion';
import { weaponImage } from '../catalog';
import { formatPct, modeProgress, playerName } from './stats';

/** Small colored pill: camo dot + count (e.g. ● 12). */
export function CamoCount({ c, n }) {
  return (
    <span className="inline-flex items-center gap-1 tabular-nums" title={c.name}>
      <span className={'dot k-' + c.k} />{n}
    </span>
  );
}

/** The player's most advanced weapon in this mode: gives the hero its picture. */
function topWeapon(player, mode, weapons) {
  const prog = modeProgress(player.stats.full, mode);
  let best = null;
  let bestCount = 0;
  for (const weapon of weapons) {
    const n = (prog[weapon.id] || []).filter(v => v === 1).length;
    if (n > bestCount) {
      best = weapon;
      bestCount = n;
    }
  }
  return best;
}

/**
 * Top card of the public pages, same shape as the tracker's WeaponHero.
 * `player` carries its playerStats() in `stats`; `children` is the main action.
 */
export default function PlayerHero({ player, label, mode, weapons, cols, highlight, children }) {
  const s = player.stats[mode];
  const weapon = topWeapon(player, mode, weapons);
  return (
    <section className="relative rounded-xl bg-card ring-1 ring-foreground/10 sm:not-first:mt-8">
      <div aria-hidden className="camo-pattern absolute inset-0 rounded-xl" />
      <div className="relative grid gap-4 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,46%)] sm:items-center sm:p-8">
        <div className="order-last min-w-0 space-y-4 sm:order-none">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{label}</p>
            <h2 className="text-3xl font-semibold break-words uppercase sm:text-4xl">{playerName(player)}</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{s.done} / {s.max} camos</span> · {formatPct(s.pct)}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            {children}
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              {highlight.map(i => <CamoCount key={i} c={cols[i]} n={s.counts[i]} />)}
            </div>
          </div>
        </div>
        {weapon && (
          <motion.img
            key={player.user_id + mode}
            src={weaponImage(weapon)}
            alt=""
            className="mx-auto max-h-40 w-full object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.6)] sm:-my-16 sm:max-h-64 sm:-rotate-6 sm:scale-110"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease }}
            onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
          />
        )}
      </div>
    </section>
  );
}
