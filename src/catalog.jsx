import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import DATA from './data.json';
import { CAMO_MODES, DV, DV_TEXT, colsFor } from './constants';

/**
 * Weapon catalog.
 * Starts from the data bundled with the site (instant, works offline / without Supabase),
 * then switches to the `weapons` table in Supabase, which admins can edit.
 *
 * Weapon shape: { id, name, category, level, season (0 = base weapon), image, multi[7], dmz[7], warzone[7], prestige[4] (bool), mastery, sortOrder }
 */

// Category order from the original sheet; categories created later are appended alphabetically.
const BASE_CATEGORIES = DATA.categories.map(c => c.name);

export const weaponImage = w => w.image || `${import.meta.env.BASE_URL}weapons/${w.id}.webp`;

// codmunity.gg slugs that differ from our weapon id; null = no builds page (melee).
const CODMUNITY_SLUGS = {
  'mitrailleuse-finn': 'finn-lmg',
  'mar-09': 'mar-9',
  'oris-8-6': 'oris-86',
  'wz-55-striga': 'wz55-striga',
  'lame-en-carbone-fss-1095': null,
};

/** Link to the weapon's multiplayer builds on codmunity.gg, or null when there is none. */
export function codmunityUrl(w) {
  const slug = w.id in CODMUNITY_SLUGS ? CODMUNITY_SLUGS[w.id] : w.id;
  return slug ? `https://codmunity.gg/fr/weapon/mw4/${slug}#multiplayer-builds` : null;
}

export const slugify = s =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

function bundledWeapons() {
  let order = 0;
  return DATA.categories.flatMap(c =>
    c.weapons.map(w => ({
      id: w.id,
      name: w.name,
      category: c.name,
      level: w.level,
      season: 0,
      image: null,
      multi: w.multi,
      dmz: w.dmz,
      warzone: Array(7).fill(''),
      prestige: (DATA.seed.prestige[w.id] || [0, 0, 0, 0]).map(v => v !== null),
      mastery: true,
      sortOrder: (order += 10),
    })),
  );
}

// 7 challenges per mode. Multi/DMZ: the Divergence one (index DV) is always the fixed text.
const pad7 = (a, fixedDv = true) =>
  Array.from({ length: 7 }, (_, i) => (fixedDv && i === DV ? DV_TEXT : a?.[i] ?? ''));

export const fromRow = r => ({
  id: r.id,
  name: r.name,
  category: r.category,
  level: r.level,
  season: r.season ?? 0,
  image: r.image_url,
  multi: pad7(r.multi),
  dmz: pad7(r.dmz),
  warzone: pad7(r.warzone, false),
  prestige: Array.from({ length: 4 }, (_, i) => r.prestige_available?.[i] ?? true),
  mastery: r.mastery,
  sortOrder: r.sort_order,
});

export const toRow = w => ({
  id: w.id,
  name: w.name.trim(),
  category: w.category.trim(),
  level: Number(w.level) || 1,
  season: Math.max(0, Number(w.season) || 0),
  image_url: w.image || null,
  multi: pad7(w.multi).map(s => s.trim()),
  dmz: pad7(w.dmz).map(s => s.trim()),
  warzone: pad7(w.warzone, false).map(s => s.trim()),
  prestige_available: w.prestige,
  mastery: !!w.mastery,
  sort_order: Number(w.sortOrder) || 0,
  updated_at: new Date().toISOString(),
});

function buildCatalog(weapons) {
  const names = [...new Set(weapons.map(w => w.category))];
  const ordered = [
    ...BASE_CATEGORIES.filter(n => names.includes(n)),
    ...names.filter(n => !BASE_CATEGORIES.includes(n)).sort((a, b) => a.localeCompare(b, 'fr')),
  ];
  const categories = ordered.map(name => ({
    name,
    weapons: weapons
      .filter(w => w.category === name)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.level - b.level || a.name.localeCompare(b.name, 'fr')),
  }));
  const list = categories.flatMap(c => c.weapons);
  return { categories, weapons: list };
}

/**
 * Camo columns of a mode with the admin overrides applied.
 * overrides = { multi: [{ name, short }, …], dmz: …, warzone: …, prestige: … } (missing / empty → default).
 * The color (k) always stays the default one of that position.
 */
export function applyCamoNames(overrides) {
  const out = {};
  for (const mode of CAMO_MODES) {
    out[mode] = colsFor(mode).map((c, i) => {
      const o = overrides?.[mode]?.[i];
      return { ...c, name: o?.name?.trim() || c.name, short: o?.short?.trim() || c.short };
    });
  }
  return out;
}

const CatalogContext = createContext(null);

export function CatalogProvider({ children }) {
  const [weapons, setWeapons] = useState(bundledWeapons);
  // bundled | remote | error
  const [source, setSource] = useState('bundled');
  // Admin overrides for camo names (app_settings.camo_names)
  const [camoNames, setCamoNames] = useState(null);

  const reload = useCallback(async () => {
    if (!supabase) return;
    // Camo names: optional table (supabase/camos.sql), defaults are used if it's missing
    supabase.from('app_settings').select('value').eq('key', 'camo_names').maybeSingle()
      .then(({ data }) => { if (data?.value) setCamoNames(data.value); });

    const { data, error } = await supabase.from('weapons').select('*');
    if (error) {
      // Table not created yet, or network issue: keep what we have
      setSource(s => (s === 'remote' ? s : 'error'));
      return;
    }
    if (data.length) {
      setWeapons(data.map(fromRow));
      setSource('remote');
    }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  const value = useMemo(() => {
    const camos = applyCamoNames(camoNames);
    return { ...buildCatalog(weapons), source, reload, camoNames, camos, cols: mode => camos[mode] };
  }, [weapons, source, reload, camoNames]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export const useCatalog = () => useContext(CatalogContext);
