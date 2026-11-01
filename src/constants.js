export const CAMOS = [
  { name: 'Spéciale 1', short: 'S1', k: 's' },
  { name: 'Spéciale 2', short: 'S2', k: 's' },
  { name: 'Spéciale 3', short: 'S3', k: 's' },
  { name: 'Or', short: 'OR', k: 'or' },
  { name: 'Platine', short: 'PL', k: 'pl' },
  { name: 'Rupture harmonique', short: 'RH', k: 'rh' },
  { name: 'Divergence', short: 'DV', k: 'dv' },
];

// Warzone camo names, from the "API" tab of the Google Sheet
export const CAMOS_WZ = [
  { name: 'Spéciale 1', short: 'S1', k: 's' },
  { name: 'Spéciale 2', short: 'S2', k: 's' },
  { name: 'Spéciale 3', short: 'S3', k: 's' },
  { name: 'Golden Damascus', short: 'GD', k: 'or' },
  { name: 'Starglass', short: 'SG', k: 'sg' },
  { name: 'Absolute Zero', short: 'AZ', k: 'az' },
  { name: 'Apocalypse', short: 'AP', k: 'ap' },
];

export const PRESTIGE = [
  { name: 'Prestige 1', short: 'P1', k: 'p1' },
  { name: 'Prestige 1 max', short: 'P1 max', k: 'p2' },
  { name: 'Niveau 150', short: '150', k: 'p3' },
  { name: 'Niveau 250', short: '250', k: 'p4' },
];

export const MODES = [
  { id: 'multi', label: 'Multijoueur', short: 'Multi' },
  { id: 'dmz', label: 'DMZ' },
  { id: 'warzone', label: 'Warzone', short: 'Warzone' },
  { id: 'prestige', label: 'Prestige armes', short: 'Prestige' },
];

export const OR = 3;
export const PL = 4;
export const RH = 5;
export const DV = 6;

/**
 * Fixed number of weapons needed to unlock the last camos, whatever the number of weapons in the catalog:
 * Rupture harmonique needs Platine on 33 weapons, Divergence needs Rupture harmonique on 33 weapons
 * (same for Warzone: Absolute Zero / Apocalypse).
 */
export const UNLOCK_THRESHOLD = 33;

/** Divergence challenge: same for every weapon and mode, not editable in the admin. */
export const DV_TEXT = 'Se débloque après Rupture harmonique sur 33 armes';

/** Modes with the 7-camo challenge structure (everything except Prestige). */
export const CHALLENGE_MODES = ['multi', 'dmz', 'warzone'];

/** Default camo columns of a mode. The names shown on the site can be overridden by admins (see catalog.jsx). */
export const colsFor = mode => (mode === 'prestige' ? PRESTIGE : mode === 'warzone' ? CAMOS_WZ : CAMOS);

/** Every mode that has camo names, in the order shown in the admin. */
export const CAMO_MODES = ['multi', 'dmz', 'warzone', 'prestige'];

export const pct = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
