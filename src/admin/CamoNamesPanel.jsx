import { useEffect, useState } from 'react';
import { Loader2, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { CAMO_MODES, colsFor } from '../constants';
import { useCatalog } from '../catalog';
import { dbErrorMessage } from './WeaponEditor';

const SECTIONS = {
  multi: { title: 'Multijoueur', desc: 'Camos des défis Multijoueur.' },
  dmz: { title: 'DMZ', desc: 'Camos des défis DMZ.' },
  warzone: { title: 'Warzone', desc: 'Camos des défis Warzone.' },
  prestige: { title: 'Prestige armes', desc: 'Paliers de prestige des armes.' },
};

const SHORT_MAX = 6;

// Editable copy: { mode: [{ name, short }, …] } with the current names (overrides or defaults)
const toDraft = camos =>
  Object.fromEntries(CAMO_MODES.map(m => [m, camos[m].map(c => ({ name: c.name, short: c.short }))]));

export default function CamoNamesPanel() {
  const catalog = useCatalog();
  const [draft, setDraft] = useState(() => toDraft(catalog.camos));
  const [busy, setBusy] = useState(false);

  // Refresh the form when the saved names change (after a save or a reload)
  useEffect(() => { setDraft(toDraft(catalog.camos)); }, [catalog.camos]);

  const setField = (mode, i, key, value) =>
    setDraft(d => ({ ...d, [mode]: d[mode].map((c, j) => (j === i ? { ...c, [key]: value } : c)) }));

  const resetMode = mode =>
    setDraft(d => ({ ...d, [mode]: colsFor(mode).map(c => ({ name: c.name, short: c.short })) }));

  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(catalog.camos));

  const save = async e => {
    e.preventDefault();
    for (const mode of CAMO_MODES) {
      for (const c of draft[mode]) {
        if (!c.name.trim() || !c.short.trim()) {
          return toast.error(`${SECTIONS[mode].title} : chaque camo doit avoir un nom et une abréviation.`);
        }
      }
    }
    setBusy(true);
    const value = Object.fromEntries(
      CAMO_MODES.map(m => [m, draft[m].map(c => ({ name: c.name.trim(), short: c.short.trim() }))]),
    );
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'camo_names', value, updated_at: new Date().toISOString() });
    setBusy(false);
    if (error) {
      const msg = /app_settings/i.test(error.message || '')
        ? "La table 'app_settings' n'existe pas : exécute supabase/camos.sql."
        : dbErrorMessage(error);
      return toast.error(msg);
    }
    await catalog.reload();
    toast.success('Noms des camouflages enregistrés');
  };

  return (
    <form onSubmit={save} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Renomme les camouflages affichés sur le tracker. L'abréviation est le texte des boutons sur les cartes d'armes
          ({SHORT_MAX} caractères max). Les couleurs restent liées à la position du camo.
        </p>
        <Button type="submit" disabled={busy || !dirty}>
          {busy ? <Loader2 className="animate-spin" /> : <Save />}Enregistrer
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {CAMO_MODES.map(mode => (
          <Card key={mode}>
            <CardHeader>
              <CardTitle>{SECTIONS[mode].title}</CardTitle>
              <CardDescription>{SECTIONS[mode].desc}</CardDescription>
              <CardAction>
                <Button type="button" variant="ghost" size="sm" onClick={() => resetMode(mode)}>
                  <RotateCcw />Par défaut
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-[3rem_1fr_5.5rem] gap-2 px-1 text-xs text-muted-foreground">
                <span>Aperçu</span><span>Nom</span><span>Abrév.</span>
              </div>
              {draft[mode].map((c, i) => {
                const k = catalog.camos[mode][i].k;
                const def = colsFor(mode)[i];
                return (
                  <div key={i} className="grid grid-cols-[3rem_1fr_5.5rem] items-center gap-2">
                    <span
                      className={`camo k-${k} flex h-7 items-center justify-center rounded-md text-[10px] font-extrabold tracking-wide`}
                      data-state="on"
                      aria-hidden
                    >
                      {c.short || '?'}
                    </span>
                    <div>
                      <Label htmlFor={`${mode}-n-${i}`} className="sr-only">Nom du camo {i + 1}</Label>
                      <Input id={`${mode}-n-${i}`} value={c.name} placeholder={def.name} onChange={e => setField(mode, i, 'name', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor={`${mode}-s-${i}`} className="sr-only">Abréviation du camo {i + 1}</Label>
                      <Input id={`${mode}-s-${i}`} value={c.short} placeholder={def.short} maxLength={SHORT_MAX} onChange={e => setField(mode, i, 'short', e.target.value)} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    </form>
  );
}
