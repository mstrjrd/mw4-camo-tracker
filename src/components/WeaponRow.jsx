import { memo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, CheckCircle2, Lock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { codmunityUrl, weaponImage } from '../catalog';
import SeasonBadge from './SeasonBadge';
import { DV, RH } from '../constants';

/** Explains why a camo is locked; null for Divergence blocked by RH, its description already says it. */
function lockText(reason, i, text, cols, short) {
  if (!reason || (i === DV && reason.need === RH && text)) return null;
  const { done, total, category, base } = reason;
  if (reason.specials) {
    return short ? ` (${done}/${total} Spéciales)` : `Nécessite les ${total} camos Spéciaux (${done}/${total})`;
  }
  const name = cols[reason.need].name;
  if (short) return ` (${done}/${total} ${name}${category ? ` en ${category}` : ''})`;
  return category
    ? `Nécessite ${name} sur ${total} armes « ${category} »${base ? ' (nombre d’armes de base)' : ''} — ${done}/${total}`
    : `Nécessite ${name} sur ${total} armes (${done}/${total})`;
}

const spring = { type: 'spring', stiffness: 500, damping: 30 };

function CamoButton({ c, v, locked, lockHint, text, onClick, readOnly }) {
  const na = v === null;
  const [burst, setBurst] = useState(0);
  const disabled = na || locked;
  const interactive = !disabled && !readOnly;

  const handleClick = () => {
    if (readOnly) return;
    if (!v) setBurst(b => b + 1);
    onClick();
  };

  return (
    <Tooltip>
      {/* span wrapper so the tooltip still shows on disabled buttons */}
      <TooltipTrigger asChild>
        <span className="flex flex-1 sm:w-11 sm:flex-none">
          <motion.button
            type="button"
            className={cn('camo k-' + c.k, 'relative h-7 flex-1 rounded-md text-[10px] font-extrabold tracking-wide', readOnly && 'cursor-default')}
            data-state={v ? 'on' : 'off'}
            data-locked={locked || undefined}
            aria-pressed={!!v}
            aria-label={c.name}
            disabled={disabled}
            aria-disabled={readOnly || undefined}
            onClick={handleClick}
            initial={false}
            animate={{ scale: v ? [1, 1.18, 1] : 1 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            whileHover={interactive ? { y: -2 } : undefined}
            whileTap={interactive ? { scale: 0.9 } : undefined}
          >
            {na ? '—' : c.short}
            {burst > 0 && (
              <motion.span
                key={burst}
                aria-hidden
                className="pointer-events-none absolute inset-0 rounded-md border-2"
                style={{ borderColor: 'var(--c)' }}
                initial={{ opacity: 0.9, scale: 1 }}
                animate={{ opacity: 0, scale: 1.7 }}
                transition={{ duration: 0.55, ease: 'easeOut' }}
              />
            )}
          </motion.button>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="font-semibold">{c.name}{locked && ' (verrouillé)'}</p>
        {/* tooltip background is light: use a dark amber for contrast */}
        {locked && lockHint && (
          <p className="flex items-center gap-1 font-medium text-amber-700">
            <Lock className="size-3 shrink-0" />{lockHint}
          </p>
        )}
        {na ? <p>Non disponible pour cette arme</p>
          : text ? <p className="opacity-80">{text}</p>
          : text === '' && <p className="italic opacity-60">Défi pas encore renseigné</p>}
      </TooltipContent>
    </Tooltip>
  );
}

/** Opens the weapon's multiplayer builds on codmunity.gg; renders nothing without a page. */
function BuildsButton({ weapon, className }) {
  const url = codmunityUrl(weapon);
  if (!url) return null;
  return (
    <Button asChild variant="outline" size="xs" className={cn('h-5 shrink-0 px-1.5 text-[11px] font-semibold text-primary', className)}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-no-toggle
        title={`Voir les classes ${weapon.name} sur codmunity.gg`}
        onKeyDown={e => e.stopPropagation()}
      >
        Classes
      </a>
    </Button>
  );
}

/** readOnly: used on public profiles — shows the state, nothing can be toggled. */
function WeaponRow({ weapon, arr, cols, texts, open, isLocked, lockReason, onToggle, onOpen, readOnly = false }) {
  const avail = arr.filter(v => v !== null).length;
  const n = arr.filter(v => v === 1).length;
  const done = n === avail;
  const nextIdx = arr.findIndex(v => v === 0);
  const nextText = texts && nextIdx >= 0 ? texts[nextIdx] : null;

  return (
    <div className={cn('group/row transition-colors', done && 'bg-primary/5', open && 'bg-muted/30')}>
      {/* The whole row opens/closes the challenge list, except the camo buttons (data-no-toggle) */}
      <div
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-label={`${open ? 'Masquer' : 'Afficher'} les défis ${weapon.name}`}
        className="flex cursor-pointer flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2.5 outline-none select-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring/50 sm:flex-nowrap"
        onClick={e => { if (!e.target.closest('[data-no-toggle]')) onOpen(weapon.id); }}
        onKeyDown={e => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen(weapon.id); }
        }}
      >
        {/* Thumbnail */}
        <div className="weapon-img flex h-12 w-24 shrink-0 items-center justify-center rounded-md">
          <motion.img
            src={weaponImage(weapon)}
            alt=""
            loading="lazy"
            decoding="async"
            className="max-h-full max-w-full object-contain"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 22 }}
            onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
          />
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1 sm:w-56 sm:flex-none">
          <div className="flex items-center gap-1.5">
            <p className="min-w-0 truncate font-semibold tracking-wide uppercase">{weapon.name}</p>
            <BuildsButton weapon={weapon} className="max-sm:hidden" />
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            Niveau {weapon.level}
            <SeasonBadge season={weapon.season} />
            <BuildsButton weapon={weapon} className="sm:hidden" />
          </div>
        </div>

        {/* Camo buttons + next challenge (full width on mobile, under the name) */}
        <div className="order-last w-full min-w-0 space-y-1 sm:order-none sm:w-auto sm:flex-1">
          <div className="flex w-fit max-w-full gap-1 max-sm:w-full" data-no-toggle>
            {cols.map((c, i) => (
              <CamoButton
                key={i}
                c={c}
                v={arr[i]}
                locked={isLocked(weapon.id, i)}
                lockHint={lockText(lockReason(weapon.id, i), i, texts?.[i], cols)}
                text={texts?.[i]}
                onClick={() => onToggle(weapon.id, i)}
                readOnly={readOnly}
              />
            ))}
          </div>
          <AnimatePresence mode="wait" initial={false}>
            {!done && texts && nextIdx >= 0 && (
              <motion.p
                key={nextIdx}
                className="truncate text-xs text-muted-foreground"
                title={nextText ? `${cols[nextIdx].name} — ${nextText}` : undefined}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.16 }}
              >
                Prochain : <span className="font-medium text-foreground">{cols[nextIdx].name}</span> — {nextText || <em>défi pas encore renseigné</em>}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Count + expand */}
        <div className="flex shrink-0 items-center gap-1">
          <motion.div key={done ? 'done' : 'todo'} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={spring}>
            <Badge variant={done ? 'default' : 'secondary'} className="tabular-nums">
              {done && <CheckCircle2 />}
              {n} / {avail}
            </Badge>
          </motion.div>
          <motion.span
            aria-hidden
            animate={{ rotate: open ? 180 : 0 }}
            transition={spring}
            className="inline-flex size-7 items-center justify-center text-muted-foreground"
          >
            <ChevronDown className="size-4" />
          </motion.span>
        </div>
      </div>

      {/* Challenge list */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="chal"
            className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="mx-3 mb-3 overflow-hidden rounded-lg border bg-background/40 sm:ml-[7.75rem]">
              {cols.map((c, i) => {
                const v = arr[i];
                const locked = isLocked(weapon.id, i);
                const disabled = v === null || locked;
                const inactive = disabled || readOnly;
                const id = `${weapon.id}-${c.k}-${i}`;
                return (
                  <motion.label
                    key={i}
                    htmlFor={id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: disabled ? 0.55 : 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={cn(
                      'flex cursor-pointer flex-wrap items-start gap-x-3 gap-y-1 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-muted/50 sm:flex-nowrap',
                      disabled && 'cursor-not-allowed',
                      readOnly && 'cursor-default hover:bg-transparent',
                    )}
                  >
                    <Checkbox
                      id={id}
                      checked={!!v}
                      disabled={inactive}
                      onCheckedChange={checked => onToggle(weapon.id, i, checked === true)}
                      className={cn('mt-0.5', readOnly && 'disabled:cursor-default disabled:opacity-100')}
                    />
                    <span className="flex min-w-36 items-center gap-1.5 font-semibold">
                      <span className={'dot k-' + c.k} />
                      {c.name}
                      {locked && <Lock className="size-3" />}
                    </span>
                    <span className={cn('text-muted-foreground transition-opacity', v === 1 && 'line-through opacity-70')}>
                      {v === null ? 'Non disponible pour cette arme' : texts?.[i] || (texts && <em>Défi pas encore renseigné</em>)}
                      {locked && lockText(lockReason(weapon.id, i), i, texts?.[i], cols, true)}
                    </span>
                  </motion.label>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(WeaponRow);
