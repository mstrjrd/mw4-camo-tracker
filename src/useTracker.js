import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { OR, PL, RH, DV, UNLOCK_THRESHOLD } from './constants';
import { useCatalog } from './catalog';

const UI_KEY = 'mw4-ui-v1'; // per-browser UI prefs (current tab, filters, opened cards)
// Guest (not signed-in) progress, kept only in this browser. Offered for import after login.
const LOCAL_KEY = 'mw4-camo-tracker-v1';
const SAVE_DELAY = 700;
// Index of the first mastery camo (Or / Golden Damascus); the 3 before it are the Spéciales
const MASTERY_START = 3;

const fit = (arr, n, avail) =>
  Array.from({ length: n }, (_, i) => (avail && !avail[i] ? null : arr?.[i] ? 1 : 0));

/**
 * Normalises any saved shape (DB row, exported file, guest save) onto the current weapon catalog:
 * every weapon gets complete arrays, unavailable prestige cells are null.
 * Entries for weapons not in the catalog are kept untouched (never lose progress if a weapon is hidden/removed).
 */
export function normalizeProgress(saved, weapons) {
  const out = {
    multi: { ...(saved?.multi || {}) },
    dmz: { ...(saved?.dmz || {}) },
    warzone: { ...(saved?.warzone || {}) },
    prestige: { ...(saved?.prestige || {}) },
    linkDmz: true,
  };
  for (const w of weapons) {
    out.multi[w.id] = fit(saved?.multi?.[w.id], 7);
    out.dmz[w.id] = fit(saved?.dmz?.[w.id], 7);
    out.warzone[w.id] = fit(saved?.warzone?.[w.id], 7);
    out.prestige[w.id] = fit(saved?.prestige?.[w.id], 4, w.prestige);
  }
  const link = saved?.linkDmz ?? saved?.settings?.linkDmz;
  if (typeof link === 'boolean') out.linkDmz = link;
  return out;
}

function readJSON(key) {
  try { return JSON.parse(localStorage.getItem(key)); } catch { return null; }
}

function loadUi() {
  return { mode: 'multi', hideDone: false, open: {}, ...(readJSON(UI_KEY) || {}) };
}

function legacyProgress() {
  const saved = readJSON(LOCAL_KEY);
  if (!saved) return null;
  const any = ['multi', 'dmz', 'warzone', 'prestige'].some(k =>
    Object.values(saved[k] || {}).some(a => Array.isArray(a) && a.some(v => v === 1 || v === true)));
  return any ? saved : null;
}

/** userId = null → guest mode: progress lives in localStorage only. */
export function useTracker(userId) {
  const { weapons } = useCatalog();
  const [ui, setUi] = useState(loadUi);
  // raw saved progress; `full` below is the version normalised onto the current catalog
  const [progress, setProgress] = useState(null);
  // loading | saved | saving | error | load-error | local (guest)
  const [status, setStatus] = useState('loading');
  const [legacy, setLegacy] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  const full = useMemo(() => (progress ? normalizeProgress(progress, weapons) : null), [progress, weapons]);
  const weaponsRef = useRef(weapons);
  weaponsRef.current = weapons;

  const dirty = useRef(false);
  const latest = useRef(null);
  latest.current = full;

  // ---- UI prefs stay local to this browser ----
  useEffect(() => {
    try { localStorage.setItem(UI_KEY, JSON.stringify(ui)); } catch {}
  }, [ui]);

  // ---- load the user's progress ----
  useEffect(() => {
    let cancelled = false;
    dirty.current = false;
    if (!userId) {
      setProgress(readJSON(LOCAL_KEY) || {});
      setLegacy(null);
      setStatus('local');
      return;
    }
    setProgress(null);
    setStatus('loading');
    supabase
      .from('progress')
      .select('data')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        // Never fall back to an empty state on a failed load: the next save would wipe the account.
        if (error) return setStatus('load-error');
        setProgress(data ? data.data : {});
        setLegacy(data ? null : legacyProgress());
        setStatus('saved');
      });
    return () => { cancelled = true; };
  }, [userId, reloadKey]);

  // ---- save (debounced) ----
  const save = useCallback(async () => {
    if (!dirty.current || !latest.current) return;
    const snapshot = latest.current;
    dirty.current = false;
    if (!userId) {
      try { localStorage.setItem(LOCAL_KEY, JSON.stringify(snapshot)); } catch {}
      return;
    }
    setStatus('saving');
    const { error } = await supabase
      .from('progress')
      .upsert({ user_id: userId, data: snapshot, updated_at: new Date().toISOString() });
    if (error) {
      dirty.current = true;
      setStatus('error');
    } else if (!dirty.current) {
      setStatus('saved');
    }
  }, [userId]);

  useEffect(() => {
    if (!dirty.current) return;
    if (userId) setStatus('saving');
    const t = setTimeout(save, userId ? SAVE_DELAY : 150);
    return () => clearTimeout(t);
  }, [progress, save, userId]);

  // Flush immediately when the tab is hidden/closed
  useEffect(() => {
    const onHide = () => { if (document.visibilityState === 'hidden') save(); };
    document.addEventListener('visibilitychange', onHide);
    return () => document.removeEventListener('visibilitychange', onHide);
  }, [save]);

  const update = useCallback(fn => {
    dirty.current = true;
    setProgress(p => fn(normalizeProgress(p, weaponsRef.current)));
  }, []);

  // ---- derived ----
  const { mode } = ui;
  const linkDmz = full?.linkDmz ?? true;
  const progKey = mode === 'dmz' && linkDmz ? 'multi' : mode;
  const prog = full?.[progKey];

  // counts[i] = number of weapons with camo i validated (for the current mode)
  const counts = useMemo(
    () => Array.from({ length: 7 }, (_, i) => (prog ? weapons.filter(w => prog[w.id]?.[i]).length : 0)),
    [prog, weapons],
  );

  // Or per category: { [category]: { done, total } }
  // total = number of BASE weapons (season 0) of the category; done = Or on any weapon of the category
  // (seasonal weapons can help reach the threshold, but don't raise it).
  // A category made only of seasonal weapons falls back to all its weapons.
  const orByCategory = useMemo(() => {
    const m = {};
    for (const w of weapons) {
      const c = (m[w.category] ??= { done: 0, base: 0, all: 0 });
      c.all++;
      if (!w.season) c.base++;
      if (prog?.[w.id]?.[OR]) c.done++;
    }
    for (const c of Object.values(m)) c.total = c.base || c.all;
    return m;
  }, [prog, weapons]);

  const categoryOf = useMemo(() => new Map(weapons.map(w => [w.id, w.category])), [weapons]);

  /**
   * Unlock rules (Multi / DMZ / Warzone):
   * - Platine (PL): Or on as many weapons of the category as it has base weapons (e.g. 4 for the 4 base pistols);
   * - Rupture harmonique (RH): Platine on UNLOCK_THRESHOLD (33) weapons;
   * - Divergence (DV): Rupture harmonique on UNLOCK_THRESHOLD (33) weapons.
   * Returns null if camo i of weapon wid can be clicked, otherwise { need, done, total, category? }.
   */
  const ownLock = useCallback((wid, i) => {
    if (i === PL) {
      const category = categoryOf.get(wid);
      const c = orByCategory[category];
      if (c && c.done < c.total) return { need: OR, done: Math.min(c.done, c.total), total: c.total, category, base: c.base > 0 };
    }
    if ((i === RH || i === DV) && counts[i - 1] < UNLOCK_THRESHOLD) {
      return { need: i - 1, done: counts[i - 1], total: UNLOCK_THRESHOLD };
    }
    return null;
  }, [categoryOf, orByCategory, counts]);

  const lockReason = useCallback((wid, i) => {
    // Already validated camos are never re-locked; Prestige has no unlock rules
    if (mode === 'prestige' || !prog?.[wid] || prog[wid][i]) return null;
    const own = ownLock(wid, i);
    if (own) return own;
    // Validating a camo also validates the ones before it: blocked if one of those is itself blocked
    for (const j of [PL, RH]) {
      if (j < i && !prog[wid][j]) {
        const r = ownLock(wid, j);
        if (r) return r;
      }
    }
    return null;
  }, [mode, prog, ownLock]);

  const isLocked = useCallback((wid, i) => !!lockReason(wid, i), [lockReason]);

  // ---- actions ----
  const toggle = useCallback((wid, i, value) => {
    if (prog[wid][i] === null || isLocked(wid, i)) return;
    update(p => {
      const arr = p[progKey][wid].slice();
      const on = value === undefined ? !arr[i] : value;
      arr[i] = on ? 1 : 0;
      // Camos are unlocked in order (Prestige tiers are left independent):
      // - validating Or (or any later camo) also validates the 3 Spéciales and every camo before it;
      // - un-validating a camo also un-validates every camo that requires it
      //   (a Spéciale → Or and after; Or → Platine and after; …).
      if (progKey !== 'prestige') {
        if (on && i >= MASTERY_START) {
          for (let j = 0; j < i; j++) if (arr[j] !== null) arr[j] = 1;
        } else if (!on) {
          for (let j = Math.max(i + 1, MASTERY_START); j < arr.length; j++) if (arr[j] !== null) arr[j] = 0;
        }
      }
      return { ...p, [progKey]: { ...p[progKey], [wid]: arr } };
    });
  }, [prog, progKey, isLocked, update]);

  const setLinkDmz = useCallback(v => update(p => ({ ...p, linkDmz: v })), [update]);

  const setUiValue = useCallback((key, value) => setUi(u => ({ ...u, [key]: value })), []);

  const toggleOpen = useCallback(wid => {
    setUi(u => {
      const k = u.mode + ':' + wid;
      return { ...u, open: { ...u.open, [k]: !u.open[k] } };
    });
  }, []);

  /** Unchecks everything in one mode ('multi' | 'dmz' | 'warzone' | 'prestige') or in all of them ('all'). */
  const resetMode = useCallback(target => {
    update(p => {
      const keys = target === 'all'
        ? ['multi', 'dmz', 'warzone', 'prestige']
        : [target === 'dmz' && p.linkDmz ? 'multi' : target]; // linked DMZ shares the Multi progress
      const out = { ...p };
      for (const key of keys) {
        const next = {};
        for (const [id, arr] of Object.entries(p[key] || {})) next[id] = arr.map(v => (v === null ? null : 0));
        out[key] = next;
      }
      return out;
    });
  }, [update]);

  const importProgress = useCallback(obj => update(() => normalizeProgress(obj, weaponsRef.current)), [update]);

  const importLegacy = useCallback(() => {
    if (legacy) update(() => legacy);
    setLegacy(null);
  }, [legacy, update]);

  return {
    ui, mode, progress: full, prog, linkDmz, status, isLocked, lockReason,
    legacyAvailable: !!legacy,
    toggle, setLinkDmz, setUiValue, toggleOpen, resetMode, importProgress, importLegacy,
    dismissLegacy: () => setLegacy(null),
    retry: () => setReloadKey(k => k + 1),
    flush: save,
  };
}
