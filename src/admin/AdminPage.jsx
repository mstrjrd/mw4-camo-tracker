import { useState } from 'react';
import { motion } from 'motion/react';
import { AlertTriangle, ArrowLeft, Pencil, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/lib/supabase';
import { useCatalog, weaponImage } from '../catalog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WeaponEditor, { dbErrorMessage } from './WeaponEditor';
import CamoNamesPanel from './CamoNamesPanel';
import SeasonBadge from '../components/SeasonBadge';

const filled = arr => arr.filter(s => s?.trim()).length;

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

export default function AdminPage({ onBack }) {
  const catalog = useCatalog();
  const [search, setSearch] = useState('');
  const [editor, setEditor] = useState({ open: false, weapon: null });
  // weapons | camos
  const [section, setSection] = useState('weapons');
  const q = search.trim().toLowerCase();
  const readOnly = catalog.source !== 'remote';

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Retour au tracker"><ArrowLeft /></Button>
            <ShieldCheck className="size-5 text-primary" />
            <h1 className="font-bold tracking-wider uppercase">Administration</h1>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={section} onValueChange={setSection}>
              <TabsList>
                <TabsTrigger value="weapons">Armes</TabsTrigger>
                <TabsTrigger value="camos">Camouflages</TabsTrigger>
              </TabsList>
            </Tabs>
            {section === 'weapons' && (
              <Button onClick={() => setEditor({ open: true, weapon: null })} disabled={readOnly}>
                <Plus /><span className="hidden sm:inline">Ajouter une arme</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
        {section === 'camos' ? <CamoNamesPanel /> : (<>
        {readOnly && (
          <Card size="sm" className="bg-amber-500/10 ring-amber-500/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-400"><AlertTriangle className="size-4" />Catalogue non relié à Supabase</CardTitle>
              <CardDescription>
                La table <code>weapons</code> est introuvable. Exécute <code>supabase/admin.sql</code> dans le SQL Editor de Supabase,
                puis recharge la page. En attendant, la liste ci-dessous est celle intégrée au site (lecture seule).
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input type="search" placeholder="Rechercher une arme…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>

        {catalog.categories.map(cat => {
          const list = cat.weapons.filter(w => !q || w.name.toLowerCase().includes(q));
          if (!list.length) return null;
          return (
            <section key={cat.name} className="space-y-2">
              <div className="flex items-center justify-between border-b pb-2">
                <h2 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase">{cat.name}</h2>
                <Badge variant="outline">{cat.weapons.length}</Badge>
              </div>
              <div className="divide-y rounded-xl ring-1 ring-foreground/10">
                {list.map(w => {
                  const counts = [['Multi', filled(w.multi)], ['DMZ', filled(w.dmz)], ['WZ', filled(w.warzone)]];
                  return (
                    <motion.div key={w.id} layout className="flex items-center gap-3 px-3 py-2">
                      <div className="weapon-img flex h-10 w-20 shrink-0 items-center justify-center">
                        <img src={weaponImage(w)} alt="" loading="lazy" className="max-h-full max-w-full object-contain"
                          onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold">{w.name}</p>
                        <p className="flex items-center gap-2 text-xs text-muted-foreground">Niveau {w.level} <SeasonBadge season={w.season} /></p>
                      </div>
                      <div className="hidden gap-1 sm:flex">
                        {counts.map(([label, n]) => (
                          <Badge key={label} variant={n === 7 ? 'secondary' : n === 0 ? 'outline' : 'destructive'}>{label} {n}/7</Badge>
                        ))}
                      </div>
                      <Button variant="ghost" size="icon-sm" disabled={readOnly} onClick={() => setEditor({ open: true, weapon: w })} aria-label={`Modifier ${w.name}`}>
                        <Pencil />
                      </Button>
                      {!readOnly && <DeleteButton weapon={w} onDeleted={catalog.reload} />}
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
        </>)}
      </main>

      <WeaponEditor
        open={editor.open}
        weapon={editor.weapon}
        onOpenChange={open => setEditor(e => ({ ...e, open }))}
      />
    </div>
  );
}
