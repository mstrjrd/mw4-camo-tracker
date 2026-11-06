import { useEffect, useMemo, useRef, useState } from 'react';
import { ImagePlus, Loader2, Lock, Trash2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SeasonBadge, { seasonLabel } from '../components/SeasonBadge';
import { supabase } from '@/lib/supabase';
import { DV, DV_TEXT } from '../constants';
import { slugify, toRow, useCatalog, weaponImage } from '../catalog';

const BUCKET = 'weapon-images';
// 0 = arme de base, then Saison 1 … 6
const MAX_SEASON = 6;
const SEASON_OPTIONS = Array.from({ length: MAX_SEASON + 1 }, (_, i) => i);
const MODE_LABEL = { multi: 'Multijoueur', dmz: 'DMZ', warzone: 'Warzone' };

export const emptyWeapon = () => ({
  id: '',
  name: '',
  category: '',
  level: 1,
  season: 1,
  image: null,
  multi: Array.from({ length: 7 }, (_, i) => (i === DV ? DV_TEXT : '')),
  dmz: Array.from({ length: 7 }, (_, i) => (i === DV ? DV_TEXT : '')),
  warzone: Array.from({ length: 7 }, (_, i) => (i === DV ? DV_TEXT : '')),
  prestige: [true, true, true, true],
  mastery: false,
  sortOrder: 0,
});

const mostCommon = list => {
  const counts = new Map();
  for (const x of list) if (x) counts.set(x, (counts.get(x) || 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
};

const filled = arr => arr.filter(s => s?.trim()).length;

export function dbErrorMessage(error) {
  const msg = error?.message || '';
  if (/row-level security|permission denied|not authorized/i.test(msg)) return "Action refusée : ton compte n'est pas administrateur.";
  if (/duplicate key/i.test(msg)) return 'Une arme avec cet identifiant existe déjà.';
  if (/season/i.test(msg) && /column/i.test(msg)) return "La colonne 'season' n'existe pas : exécute supabase/seasons.sql.";
  if (/relation .* does not exist|could not find the table/i.test(msg)) return "La table 'weapons' n'existe pas : exécute supabase/admin.sql.";
  if (/warzone/i.test(msg) && /column/i.test(msg)) return "La colonne 'warzone' n'existe pas : exécute supabase/warzone.sql.";
  if (/bucket not found/i.test(msg)) return "Le stockage 'weapon-images' n'existe pas : exécute supabase/admin.sql.";
  return msg || 'Une erreur est survenue.';
}

function ChallengeFields({ mode, cols, values, onChange }) {
  return (
    <div className="space-y-3">
      {cols.map((c, i) => {
        const fixed = i === DV;
        return (
          <div key={i} className="space-y-1.5">
            <Label htmlFor={`${mode}-${i}`} className="flex items-center gap-1.5">
              <span className={'dot k-' + c.k} />{c.name}
              {fixed && <Lock className="size-3 text-muted-foreground" />}
            </Label>
            <Textarea
              id={`${mode}-${i}`}
              rows={fixed ? 1 : 2}
              value={fixed ? DV_TEXT : values[i]}
              readOnly={fixed}
              disabled={fixed}
              placeholder={`Défi ${c.name} en ${MODE_LABEL[mode]}…`}
              onChange={e => onChange(i, e.target.value)}
            />
            {fixed && <p className="text-xs text-muted-foreground">Défi identique pour toutes les armes, non modifiable.</p>}
          </div>
        );
      })}
    </div>
  );
}

/** Side panel to create (weapon = null) or edit a weapon. */
export default function WeaponEditor({ open, weapon, onOpenChange }) {
  const catalog = useCatalog();
  const isNew = !weapon;
  const [draft, setDraft] = useState(emptyWeapon);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    if (weapon) return setDraft(structuredClone(weapon));
    // New weapon: default to the latest season already used (at least Saison 1)
    const latest = Math.min(MAX_SEASON, Math.max(1, ...catalog.weapons.map(w => w.season || 0)));
    setDraft({ ...emptyWeapon(), season: latest });
  }, [open, weapon]);

  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }));
  const setChallenge = (mode, i, value) =>
    setDraft(d => ({ ...d, [mode]: d[mode].map((s, j) => (j === i ? value : s)) }));

  const id = isNew ? slugify(draft.name) : draft.id;
  const categoryNames = catalog.categories.map(c => c.name);
  const sameCategory = useMemo(
    () => catalog.weapons.filter(w => w.category === draft.category.trim() && w.id !== draft.id),
    [catalog.weapons, draft.category, draft.id],
  );

  // Fill Or / Platine / Rupture harmonique with what most weapons of this category use (Divergence is fixed)
  const prefill = () => {
    if (!sameCategory.length) return toast.error('Choisis d’abord une catégorie existante.');
    let count = 0;
    const next = { ...draft };
    for (const mode of ['multi', 'dmz', 'warzone']) {
      next[mode] = draft[mode].map((s, i) => {
        if (i < 3 || i === DV || s.trim()) return s;
        const v = mostCommon(sameCategory.map(w => w[mode][i]));
        if (v) count++;
        return v || s;
      });
    }
    setDraft(next);
    toast.success(count ? `${count} défi(s) pré-rempli(s) depuis « ${draft.category} »` : 'Rien à pré-remplir');
  };

  const onPickCategory = value => {
    set('category', value);
    // New weapon: put it at the end of its category by default
    if (isNew) {
      const max = Math.max(0, ...catalog.weapons.filter(w => w.category === value.trim()).map(w => w.sortOrder));
      set('sortOrder', max + 10);
    }
  };

  const upload = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Choisis un fichier image.');
    if (file.size > 3 * 1024 * 1024) return toast.error('Image trop lourde (3 Mo max).');
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${id || 'arme'}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    setUploading(false);
    // The admin page is only reachable by admins, so an RLS refusal here points to the bucket policies.
    if (error) return toast.error(/row-level security/i.test(error.message) ? "Envoi refusé par le stockage : exécute supabase/admin.sql en entier (règles du bucket 'weapon-images')." : dbErrorMessage(error));
    set('image', supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
    toast.success('Image envoyée');
  };

  const save = async e => {
    e.preventDefault();
    if (!draft.name.trim()) return toast.error("Le nom de l'arme est obligatoire.");
    if (!draft.category.trim()) return toast.error('La catégorie est obligatoire.');
    if (!id) return toast.error("Le nom doit contenir au moins une lettre ou un chiffre.");
    if (isNew && catalog.weapons.some(w => w.id === id)) return toast.error(`L'identifiant « ${id} » existe déjà.`);

    setBusy(true);
    const row = toRow({ ...draft, id });
    const { error } = isNew
      ? await supabase.from('weapons').insert(row)
      : await supabase.from('weapons').update(row).eq('id', id);
    setBusy(false);
    if (error) return toast.error(dbErrorMessage(error));
    await catalog.reload();
    toast.success(isNew ? `${row.name} ajoutée` : `${row.name} mise à jour`);
    onOpenChange(false);
  };

  const preview = draft.image || (!isNew ? weaponImage(draft) : null);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 data-[side=right]:sm:max-w-2xl">
        <form onSubmit={save} className="flex h-full flex-col">
          <SheetHeader className="border-b">
            <SheetTitle>{isNew ? 'Ajouter une arme' : `Modifier ${weapon.name}`}</SheetTitle>
            <SheetDescription>
              {isNew ? 'Renseigne l’arme et ses défis. Elle apparaîtra immédiatement pour tous les joueurs.' : 'Les modifications sont visibles par tous les joueurs.'}
            </SheetDescription>
          </SheetHeader>

          <Tabs defaultValue="general" className="min-h-0 flex-1 gap-0">
            <div className="border-b px-4 py-2">
              <TabsList className="w-full">
                <TabsTrigger value="general">Général</TabsTrigger>
                <TabsTrigger value="multi">Multi <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{filled(draft.multi)}/7</Badge></TabsTrigger>
                <TabsTrigger value="dmz">DMZ <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{filled(draft.dmz)}/7</Badge></TabsTrigger>
                <TabsTrigger value="warzone">WZ <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px]">{filled(draft.warzone)}/7</Badge></TabsTrigger>
                <TabsTrigger value="prestige">Prestige</TabsTrigger>
              </TabsList>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <TabsContent value="general" className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="w-name">Nom de l'arme</Label>
                    <Input id="w-name" value={draft.name} onChange={e => set('name', e.target.value)} placeholder="ex. Cronen Osprey" required />
                    <p className="text-xs text-muted-foreground">
                      Identifiant : <code>{id || '—'}</code>{!isNew && ' (fixe : il relie la progression des joueurs à cette arme)'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="w-cat">Catégorie</Label>
                    <Input id="w-cat" list="w-cat-list" value={draft.category} onChange={e => onPickCategory(e.target.value)} placeholder="ex. Fusil d'assaut" required />
                    <datalist id="w-cat-list">{categoryNames.map(n => <option key={n} value={n} />)}</datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="w-level">Niveau</Label>
                      <Input id="w-level" type="number" min={1} value={draft.level} onChange={e => set('level', e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="w-order">Ordre</Label>
                      <Input id="w-order" type="number" step={10} value={draft.sortOrder} onChange={e => set('sortOrder', e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="w-season">Arrivée de l'arme</Label>
                    <div className="flex items-center gap-3">
                      <Select value={String(draft.season ?? 0)} onValueChange={v => set('season', Number(v))}>
                        <SelectTrigger id="w-season" className="w-48"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SEASON_OPTIONS.map(n => <SelectItem key={n} value={String(n)}>{seasonLabel(n)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <SeasonBadge season={draft.season} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Image</Label>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="weapon-img flex h-24 w-full shrink-0 items-center justify-center rounded-lg border sm:w-48">
                      {preview
                        ? <img src={preview} alt="" className="max-h-20 max-w-[90%] object-contain" />
                        : <span className="text-xs text-muted-foreground">Pas d'image</span>}
                    </div>
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="flex gap-2">
                        <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
                          {uploading ? <Loader2 className="animate-spin" /> : <ImagePlus />}Envoyer une image
                        </Button>
                        {draft.image && (
                          <Button type="button" variant="ghost" size="sm" onClick={() => set('image', null)}><Trash2 />Retirer</Button>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
                      </div>
                      <Input value={draft.image || ''} onChange={e => set('image', e.target.value || null)} placeholder="…ou colle l'URL d'une image" />
                      <p className="text-xs text-muted-foreground">PNG/WebP à fond transparent recommandé, 3 Mo max.</p>
                    </div>
                  </div>
                </div>

              </TabsContent>

              {['multi', 'dmz', 'warzone'].map(mode => (
                <TabsContent key={mode} value={mode} className="space-y-4">
                  <Button type="button" variant="secondary" size="sm" onClick={prefill}>
                    <Wand2 />Pré-remplir {catalog.cols(mode).slice(3, 6).map(c => c.name).join(', ')} depuis la catégorie
                  </Button>
                  <ChallengeFields mode={mode} cols={catalog.cols(mode)} values={draft[mode]} onChange={(i, v) => setChallenge(mode, i, v)} />
                </TabsContent>
              ))}

              <TabsContent value="prestige" className="space-y-3">
                <p className="text-sm text-muted-foreground">Choisis les paliers de prestige disponibles pour cette arme.</p>
                {catalog.cols('prestige').map((c, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border p-3">
                    <Label htmlFor={`p-${i}`} className="flex items-center gap-2"><span className={'dot k-' + c.k} />{c.name}</Label>
                    <Switch
                      id={`p-${i}`}
                      checked={draft.prestige[i]}
                      onCheckedChange={v => set('prestige', draft.prestige.map((x, j) => (j === i ? v : x)))}
                    />
                  </div>
                ))}
              </TabsContent>
            </div>
          </Tabs>

          <SheetFooter className="flex-row justify-end border-t">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
            <Button type="submit" disabled={busy || uploading}>
              {busy && <Loader2 className="animate-spin" />}{isNew ? "Ajouter l'arme" : 'Enregistrer'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
