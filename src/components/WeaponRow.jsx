import { memo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowUpRight, ChevronDown, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/motion';
import { codmunityUrl, weaponImage } from '../catalog';
import SeasonBadge from './SeasonBadge';
import { DV, RH } from '../constants';

/** Explains why a camo is locked; null for Divergence blocked by RH, its description already says it. */
export function lockText(reason, i, text, cols, short) {
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

function CamoButton({ c, v, locked, lockHint, text, onClick, readOnly }) {
  const na = v === null;
  const disabled = na || locked;

  return (
    <Tooltip>
      {/* span wrapper so the tooltip still shows on disabled buttons */}
      <TooltipTrigger asChild>
        <span className="flex flex-1 sm:w-11 sm:flex-none">
          <button
            type="button"
            className={cn('camo k-' + c.k, 'h-7 flex-1 text-[11px] font-medium', readOnly && 'cursor-default')}
            data-state={v ? 'on' : 'off'}
            data-locked={locked || undefined}
            aria-pressed={!!v}
            aria-label={c.name}
            disabled={disabled}
            aria-disabled={readOnly || undefined}
            onClick={readOnly ? undefined : onClick}
          >
            {na ? '—' : c.short}
          </button>
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-64">
        <p className="font-medium">{c.name}{locked && ' (verrouillé)'}</p>
        {/* tooltip background is light: use a dark amber for contrast */}
        {locked && lockHint && (
          <p className="flex items-center gap-1 font-medium text-amber-700">
            <Lock className="size-3 shrink-0" />{lockHint}
          </p>
        )}
        {na ? <p>Non disponible pour cette arme</p>
          : text ? <p className="opacity-80">{text}</p>
          : text === '' && <p className="opacity-60">Défi pas encore renseigné</p>}
      </TooltipContent>
    </Tooltip>
  );
}

/** Opens the weapon's multiplayer builds on codmunity.gg; renders nothing without a page. */
function BuildsLink({ weapon, label, className }) {
  const url = codmunityUrl(weapon);
  if (!url) return null;
  return (
    <Button asChild variant="outline" size="xs" className={cn('h-7 shrink-0 gap-1 px-2 text-foreground', className)}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        data-no-toggle
        title={`Voir les classes ${weapon.name} sur codmunity.gg`}
        aria-label={`Classes ${weapon.name} sur codmunity.gg`}
        onKeyDown={e => e.stopPropagation()}
      >
        <ArrowUpRight />
        <span className={label}>Classes</span>
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
    <div className={cn('transition-colors', open && 'bg-muted/30')}>
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
        <div className="weapon-img flex h-12 w-24 shrink-0 items-center justify-center">
          <img
            src={weaponImage(weapon)}
            alt=""
            loading="lazy"
            decoding="async"
            className="max-h-full max-w-full object-contain"
            onError={e => { e.currentTarget.style.visibility = 'hidden'; }}
          />
        </div>

        {/* Name + meta */}
        <div className="min-w-0 flex-1 sm:w-44 sm:flex-none">
          <p className="truncate font-medium uppercase">{weapon.name}</p>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            Niveau {weapon.level}
            {/* Hidden on phones, where the line wraps here and the dot would dangle */}
            <span aria-hidden className="max-sm:hidden">·</span>
            <SeasonBadge season={weapon.season} />
            {/* Phones: under the name, to leave it the room; wider screens: next to the count */}
            <BuildsLink weapon={weapon} className="sm:hidden" />
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
                Prochain : <span className="font-medium text-foreground">{cols[nextIdx].name}</span> — {nextText || 'défi pas encore renseigné'}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Count + expand */}
        <div className="flex shrink-0 items-center gap-1">
          {/* Icon only on tablets, where the row is too tight for the text */}
          <BuildsLink weapon={weapon} label="hidden lg:inline" className="mr-2 max-sm:hidden" />
          <span className={cn('flex items-center gap-1 text-xs tabular-nums', done ? 'font-medium text-primary' : 'text-muted-foreground')}>
            {done && <CheckCircle2 className="size-3.5" />}
            {n} / {avail}
          </span>
          <span aria-hidden className="inline-flex size-7 items-center justify-center text-muted-foreground">
            <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} />
          </span>
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
            transition={{ duration: 0.24, ease }}
          >
            <div className="mx-3 mb-3 overflow-hidden rounded-lg border bg-background/40 sm:ml-[7.75rem]">
              {cols.map((c, i) => {
                const v = arr[i];
                const locked = isLocked(weapon.id, i);
                const disabled = v === null || locked;
                const inactive = disabled || readOnly;
                const id = `${weapon.id}-${c.k}-${i}`;
                return (
                  <label
                    key={i}
                    htmlFor={id}
                    className={cn(
                      'flex cursor-pointer flex-wrap items-start gap-x-3 gap-y-1 border-b px-3 py-2 text-sm last:border-b-0 hover:bg-muted/50 sm:flex-nowrap',
                      disabled && 'cursor-not-allowed opacity-55',
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
                    <span className="flex min-w-36 items-center gap-2 font-medium">
                      <span className={'dot k-' + c.k} />
                      {c.name}
                      {locked && <Lock className="size-3" />}
                    </span>
                    <span className={cn('text-muted-foreground transition-opacity', v === 1 && 'line-through opacity-70')}>
                      {v === null ? 'Non disponible pour cette arme' : texts?.[i] || (texts && 'Défi pas encore renseigné')}
                      {locked && lockText(lockReason(weapon.id, i), i, texts?.[i], cols, true)}
                    </span>
                  </label>
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
