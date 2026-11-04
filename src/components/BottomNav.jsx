import { motion } from 'motion/react';
import { Medal, Radiation, Map as MapIcon, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ease } from '@/lib/motion';
import { MODES } from '../constants';

const MODE_ICONS = { multi: Swords, dmz: Radiation, warzone: MapIcon, prestige: Medal };

/** Game modes as navigation items, for IconRail and BottomNav. */
export const MODE_ITEMS = MODES.map(m => ({ ...m, icon: MODE_ICONS[m.id] }));

/** Floating pill tab bar, below lg (IconRail takes over on desktop). items: [{ id, label, short?, icon }]. */
export default function BottomNav({ label, items, value, onChange }) {
  return (
    <nav
      aria-label={label}
      className="fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] z-30 rounded-full bg-card px-4 shadow-[0_8px_24px_rgba(0,0,0,0.45)] ring-1 ring-foreground/10 lg:hidden"
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
              aria-label={m.label}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'relative flex h-[73px] min-w-0 flex-col items-center justify-center gap-1 text-xs outline-none transition-colors focus-visible:text-foreground',
                active ? 'text-primary' : 'text-muted-foreground active:text-foreground',
              )}
            >
              <Icon className={cn('size-6 shrink-0', active && 'fill-primary/25')} />
              {active && <span className="max-w-full truncate">{m.short || m.label}</span>}
              {active && (
                <motion.svg
                  layoutId="bottom-nav-indicator"
                  aria-hidden
                  viewBox="0 0 64 8"
                  className="absolute bottom-0 left-1/2 h-2 w-16 max-w-full -translate-x-1/2 fill-primary"
                  transition={{ duration: 0.2, ease }}
                >
                  <path d="M0 8C0 5.8 1.8 4 4 4H26C27.5 4 28.6 3.2 29.6 2L30.5 1C31.3 0 32.7 0 33.5 1L34.4 2C35.4 3.2 36.5 4 38 4H60C62.2 4 64 5.8 64 8Z" />
                </motion.svg>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
