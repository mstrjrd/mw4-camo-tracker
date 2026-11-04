import { normalizeProgress } from '../useTracker';

export const playerName = p => p.display_name || p.handle;
export const formatPct = n => `${n.toLocaleString('fr-FR')} %`;

/** Camo indexes shown as counts on the public pages. */
export const highlightCamos = mode => (mode === 'prestige' ? [0, 1, 2, 3] : [3, 4, 5, 6]);

/** Progress of a mode for a saved progress object (handles the Multi/DMZ link). */
export function modeProgress(full, mode) {
  const key = mode === 'dmz' && full.linkDmz ? 'multi' : mode;
  return full[key];
}

/**
 * Stats of one mode: { done, max, pct, counts[i] } where counts[i] = weapons with camo i validated.
 * `prog` is the per-weapon map of a mode, `weapons` the catalog list.
 */
export function modeStats(prog, weapons, size) {
  const counts = Array(size).fill(0);
  let done = 0;
  let max = 0;
  for (const w of weapons) {
    const arr = prog?.[w.id] || [];
    for (let i = 0; i < size; i++) {
      if (arr[i] === null) continue;
      max++;
      if (arr[i] === 1) { done++; counts[i]++; }
    }
  }
  return { done, max, pct: max ? Math.round((done / max) * 1000) / 10 : 0, counts };
}

/** Normalised progress + stats for every mode of a player. */
export function playerStats(rawProgress, weapons) {
  const full = normalizeProgress(rawProgress, weapons);
  return {
    full,
    multi: modeStats(modeProgress(full, 'multi'), weapons, 7),
    dmz: modeStats(modeProgress(full, 'dmz'), weapons, 7),
    warzone: modeStats(modeProgress(full, 'warzone'), weapons, 7),
    prestige: modeStats(modeProgress(full, 'prestige'), weapons, 4),
  };
}
