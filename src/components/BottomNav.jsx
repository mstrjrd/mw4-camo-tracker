import { motion } from 'motion/react';
import { Medal, Radiation, Map as MapIcon, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/motion';
import { MODES } from '../constants';

const MODE_ICONS = { multi: Swords, dmz: Radiation, warzone: MapIcon, prestige: Medal };

/** Game modes as navigation items, for IconRail and BottomNav. */
export const MODE_ITEMS = MODES.map(m => ({ ...m, icon: MODE_ICONS[m.id] }));

/** Bottom tab bar, below lg (IconRail takes over on desktop). items: [{ id, label, short?, icon }]. */
export default function BottomNav({ label, items, value, onChange }) {
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
        {items.map(m => {
          const Icon = m.icon;
          const active = value === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(m.id)}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground active:text-foreground',
              )}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary"
                  transition={{ duration: 0.2, ease }}
                />
              )}
              <Icon className="size-5" />
              {m.short || m.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
