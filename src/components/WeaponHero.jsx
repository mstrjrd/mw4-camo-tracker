import { motion } from 'motion/react';
import { ListChecks, Lock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ease } from '@/lib/motion';
import { weaponImage } from '../catalog';
import { lockText } from './WeaponRow';

/** Weapon to work on next: one whose next camo is available if possible, then the most advanced one. */
function pickWeapon(weapons, prog, isLocked) {
  let best = null;
  let bestScore = -1;
  for (const weapon of weapons) {
    const arr = prog[weapon.id];
    const next = arr.indexOf(0);
    if (next < 0) continue;
    const avail = arr.filter(v => v !== null).length;
    const n = arr.filter(v => v === 1).length;
    const score = n / avail + (isLocked(weapon.id, next) ? 0 : 1);
    if (score > bestScore) {
      best = { weapon, arr, next, avail, n };
      bestScore = score;
    }
  }
  return best;
}

/** Top card of the tracker: the weapon in progress for the current mode, its picture breaking out of the card. */
export default function WeaponHero({ modeLabel, mode, weapons, prog, cols, isLocked, lockReason, onOpen }) {
  const pick = pickWeapon(weapons, prog, isLocked);

  if (!pick) {
    return (
      <section className="flex items-center gap-3 rounded-xl bg-card p-6 ring-1 ring-foreground/10">
        <Trophy className="size-5 shrink-0 text-primary" />
        <p className="font-medium">Toutes les armes sont terminées en {modeLabel}</p>
      </section>
    );
  }

  const { weapon, arr, next, avail, n } = pick;
  const texts = mode === 'prestige' ? null : weapon[mode];
  const hint = isLocked(weapon.id, next) ? lockText(lockReason(weapon.id, next), next, texts?.[next], cols) : null;

  return (
    <section className="relative rounded-xl bg-card ring-1 ring-foreground/10 sm:mt-8">
      <div aria-hidden className="camo-pattern absolute inset-0 rounded-xl" />
      <div className="relative grid gap-4 p-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,46%)] sm:items-center sm:p-8">
        <div className="order-last min-w-0 space-y-4 sm:order-none">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{modeLabel} · Arme en cours</p>
            <h2 className="text-3xl font-semibold uppercase sm:text-4xl">{weapon.name}</h2>
          </div>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Prochain : {cols[next].name}</span>
              {texts?.[next] && ` — ${texts[next]}`}
            </p>
            {hint && <p className="flex items-center gap-1.5"><Lock className="size-3.5 shrink-0" />{hint}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Button onClick={() => onOpen(weapon.id)}><ListChecks />Voir les défis</Button>
            <div className="flex items-center gap-1.5" title={`${n} camos validés sur ${avail}`}>
              {cols.map((c, i) => (
                <span key={i} className={'dot k-' + c.k + (arr[i] === 1 ? '' : ' opacity-25')} />
              ))}
              <span className="ml-1 text-sm text-muted-foreground tabular-nums">{n} / {avail}</span>
            </div>
          </div>
        </div>
        <motion.img
          key={weapon.id}
          src={weaponImage(weapon)}
          alt=""
          className="mx-auto max-h-40 w-full object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.6)] sm:-my-16 sm:max-h-64 sm:-rotate-6 sm:scale-110"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease }}
          onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
        />
      </div>
    </section>
  );
}
