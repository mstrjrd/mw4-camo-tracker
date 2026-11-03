import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const CHALLENGES_PER_WEAPON = 7;

const filled = arr => arr.filter(s => s?.trim()).length;

/** Number of challenge texts filled in, per mode that has challenges. */
export const challengeCounts = w => [
  { label: 'Multi', name: 'Multijoueur', n: filled(w.multi) },
  { label: 'DMZ', name: 'DMZ', n: filled(w.dmz) },
  { label: 'WZ', name: 'Warzone', n: filled(w.warzone) },
];

/** Right column on wide screens: weapons per category. */
export default function AdminSidePanel({ categories }) {
  return (
    <aside className="sticky top-20 hidden space-y-4 xl:block">
      <Card size="sm">
        <CardHeader><CardTitle>Par catégorie</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {categories.map(c => (
            <div key={c.name} className="flex justify-between gap-2 text-sm">
              <span className="truncate">{c.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{c.weapons.length}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </aside>
  );
}
