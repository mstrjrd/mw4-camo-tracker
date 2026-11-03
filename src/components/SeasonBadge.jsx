import { CalendarPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export const seasonLabel = season => (season > 0 ? `Saison ${season}` : 'Arme de base');

// One color per season (full class strings so Tailwind keeps them). Beyond 6, colors loop.
const SEASON_COLORS = [
  'border-sky-500/40 bg-sky-500/15 text-sky-300', // Saison 1
  'border-violet-500/40 bg-violet-500/15 text-violet-300', // Saison 2
  'border-orange-500/40 bg-orange-500/15 text-orange-300', // Saison 3
  'border-rose-500/40 bg-rose-500/15 text-rose-300', // Saison 4
  'border-emerald-500/40 bg-emerald-500/15 text-emerald-300', // Saison 5
  'border-fuchsia-500/40 bg-fuchsia-500/15 text-fuchsia-300', // Saison 6
];

export const seasonColor = season => SEASON_COLORS[(season - 1) % SEASON_COLORS.length];

/** "Arme de base" (season 0) or "Saison N" for weapons added during the game's life, each season with its color. */
export default function SeasonBadge({ season = 0, className }) {
  if (season > 0) {
    return (
      <Badge variant="outline" className={cn(seasonColor(season), className)}>
        <CalendarPlus />{seasonLabel(season)}
      </Badge>
    );
  }
  return <span className={className}>{seasonLabel(season)}</span>;
}
