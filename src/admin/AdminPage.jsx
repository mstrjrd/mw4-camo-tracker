import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowLeft, Crosshair, Palette, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { pct } from '../constants';
import { useCatalog, weaponImage } from '../catalog';
import WeaponEditor, { dbErrorMessage } from './WeaponEditor';
import CamoNamesPanel from './CamoNamesPanel';
import AdminSidePanel, { CHALLENGES_PER_WEAPON, challengeCounts } from './AdminSidePanel';
import SeasonBadge from '../components/SeasonBadge';
import IconRail from '../components/IconRail';
import BottomNav from '../components/BottomNav';
import SearchField from '../components/SearchField';
import Logo from '../components/Logo';

const SECTIONS = [
  { id: 'weapons', label: 'Armes', icon: Crosshair },
  { id: 'camos', label: 'Camouflages', icon: Palette },
];

function DeleteButton({ weapon, onDeleted }) {
  const remove = async () => {
    const { error } = await supabase.from('weapons').delete().eq('id', weapon.id);
    if (error) return toast.error(dbErrorMessage(error));
    toast.success(`${weapon.name} supprimée`);
    onDeleted();
  };
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Supprimer ${weapon.name}`}><Trash2 /></Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Supprimer {weapon.name} ?</AlertDialogTitle>
          <AlertDialogDescription>
            L'arme disparaîtra du tracker pour tous les joueurs. Leur progression sur cette arme n'est pas effacée :
            elle réapparaîtra si tu recrées une arme avec le même identifiant (<code>{weapon.id}</code>).
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={remove}>Supprimer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Same layout as the tracker's Summary: the overall figure on its own row, then one card per mode. */
function CatalogSummary({ weapons }) {
  const total = weapons.length;
  const perMode = weapons.length
    ? challengeCounts(weapons[0]).map((m, i) => ({
      name: m.name,
      done: weapons.filter(w => challengeCounts(w)[i].n === CHALLENGES_PER_WEAPON).length,
    }))
    : [];

  return (
    <section className="grid grid-cols-3 gap-3 2xl:grid-cols-4">
      <Card size="sm" className="col-span-3 2xl:col-span-1">
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">Armes au catalogue</p>
          <p className="text-4xl font-medium tabular-nums">{total}</p>
        </CardContent>
      </Card>
      {perMode.map(m => (
        <Card key={m.name} size="sm" className="h-full">
          <CardContent className="space-y-2">
            <p className="truncate text-xs text-muted-foreground"><span className="max-sm:hidden">Défis </span>{m.name}</p>
            <p className="text-2xl font-medium tabular-nums">
              {m.done} <span className="text-sm font-normal text-muted-foreground">/ {total}</span>
            </p>
            <Progress value={pct(m.done, total)} className="[&>[data-slot=progress-indicator]]:bg-foreground/40" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

function ChallengeCount({ label, n }) {
  const partial = n > 0 && n < CHALLENGES_PER_WEAPON;
  return (
    <span className={cn('tabular-nums', partial ? 'text-amber-400' : 'text-muted-foreground', n === 0 && 'opacity-60')}>
      {label} {n}/{CHALLENGES_PER_WEAPON}
    </span>
  );
}

export default function AdminPage({ onBack }) {
  const catalog = useCatalog();
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState({ open: false, weapon: null });
  // weapons | camos
  const [section, setSection] = useState('weapons');
  const q = search.trim().toLowerCase();
  const readOnly = catalog.source !== 'remote';
  const onWeapons = section === 'weapons';
  const openEditor = weapon => setEditor({ open: true, weapon });

  return (
    <div className="min-h-svh lg:pl-20">
      <IconRail label="Sections de l'administration" items={SECTIONS} value={section} onChange={setSection} onHome={onBack} />

      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Logo size={32} className="lg:hidden" />
            <h1 className={cn('truncate text-base font-medium', onWeapons && 'lg:sr-only')}>Administration</h1>
            {onWeapons && <SearchField value={search} onChange={setSearch} className="hidden w-full max-w-md lg:block" />}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} aria-label="Retour au tracker">
              <ArrowLeft /><span className="hidden md:inline">Tracker</span>
            </Button>
            {onWeapons && (
              <Button size="sm" onClick={() => openEditor(null)} disabled={readOnly} aria-label="Ajouter une arme">
                <Plus /><span className="hidden sm:inline">Ajouter une arme</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* extra bottom padding below lg so the bottom bar never hides the content */}
      <main className={cn(
        'mx-auto w-full max-w-[1600px] px-4 pt-6 pb-28 sm:px-6 lg:pb-10',
        onWeapons && 'xl:grid xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-6',
      )}>
        {!onWeapons ? <CamoNamesPanel /> : (<>
          <div className="min-w-0 space-y-6">
            {readOnly && (
              <Card size="sm">
                <CardContent className="space-y-1">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <AlertTriangle className="size-4 shrink-0 text-amber-400" />Catalogue non relié à Supabase
                  </p>
                  <p className="text-sm text-muted-foreground">
                    La table <code>weapons</code> est introuvable. Exécute <code>supabase/admin.sql</code> dans le SQL Editor de Supabase,
                    puis recharge la page. En attendant, la liste ci-dessous est celle intégrée au site (lecture seule).
                  </p>
                </CardContent>
              </Card>
            )}

            <CatalogSummary weapons={catalog.weapons} />

            <SearchField value={search} onChange={setSearch} className="lg:hidden" />

            {catalog.categories.map(cat => {
              const list = cat.weapons.filter(w => !q || w.name.toLowerCase().includes(q));
              if (!list.length) return null;
              return (
                <section key={cat.name} className="space-y-3">
                  <div className="flex items-center justify-between pb-1">
                    <h2 className="text-sm font-medium">{cat.name}</h2>
                    <span className="text-xs text-muted-foreground tabular-nums">{cat.weapons.length}</span>
                  </div>
                  <div className="divide-y overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10">
                    {list.map(w => (
                      <motion.div key={w.id} layout="position" className="flex items-center gap-4 px-3 py-2.5">
                        <div className="weapon-img flex h-12 w-24 shrink-0 items-center justify-center">
                          <img src={weaponImage(w)} alt="" loading="lazy" className="max-h-full max-w-full object-contain"
                            onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium uppercase">{w.name}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                            Niveau {w.level}
                            <span aria-hidden className="max-sm:hidden">·</span>
                            <SeasonBadge season={w.season} />
                          </div>
                        </div>
                        <div className="hidden gap-3 text-xs sm:flex">
                          {challengeCounts(w).map(c => <ChallengeCount key={c.label} label={c.label} n={c.n} />)}
                        </div>
                        <div className="flex shrink-0 items-center">
                          <Button variant="ghost" size="icon-sm" disabled={readOnly} onClick={() => openEditor(w)} aria-label={`Modifier ${w.name}`}>
                            <Pencil />
                          </Button>
                          {!readOnly && <DeleteButton weapon={w} onDeleted={catalog.reload} />}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>

          <AdminSidePanel categories={catalog.categories} />
        </>)}
      </main>

      <BottomNav label="Sections de l'administration" items={SECTIONS} value={section} onChange={setSection} />

      <WeaponEditor
        open={editor.open}
        weapon={editor.weapon}
        onOpenChange={open => setEditor(e => ({ ...e, open }))}
      />
    </div>
  );
}
