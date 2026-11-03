import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { pct } from '../constants';
import { weaponImage } from '../catalog';

const count = arr => ({
  n: arr.filter(v => v === 1).length,
  avail: arr.filter(v => v !== null).length,
});

/** Right column on wide screens: weapons closest to completion, then progress per category. */
export default function SidePanel({ categories, weapons, prog, onOpen }) {
  const nearly = weapons
    .map(w => ({ w, ...count(prog[w.id]) }))
    .filter(x => x.n > 0 && x.n < x.avail)
    .sort((a, b) => b.n / b.avail - a.n / a.avail)
    .slice(0, 5);

  return (
    <aside className="sticky top-20 hidden space-y-4 xl:block">
      <Card size="sm">
        <CardHeader><CardTitle>Presque terminées</CardTitle></CardHeader>
        <CardContent className="space-y-1">
          {nearly.length ? nearly.map(({ w, n, avail }) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onOpen(w.id)}
              className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-lg p-2 text-left transition-colors outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <img src={weaponImage(w)} alt="" loading="lazy" className="h-8 w-16 shrink-0 object-contain" />
              <span className="min-w-0 flex-1 truncate text-sm font-medium uppercase">{w.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{n} / {avail}</span>
            </button>
          )) : (
            <p className="text-sm text-muted-foreground">Aucune arme commencée</p>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader><CardTitle>Par catégorie</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {categories.map(c => {
            // Finished weapons out of the category's current weapons (from the live catalog, so new ones count)
            const total = c.weapons.length;
            const done = c.weapons.filter(w => prog[w.id].every(v => v === null || v === 1)).length;
            return (
              <div key={c.name} className="space-y-1">
                <div className="flex justify-between gap-2 text-sm">
                  <span className="truncate">{c.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{done} / {total}</span>
                </div>
                <Progress value={pct(done, total)} className="[&>[data-slot=progress-indicator]]:bg-foreground/40" />
              </div>
            );
          })}
        </CardContent>
      </Card>
    </aside>
  );
}
