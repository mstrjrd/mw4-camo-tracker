import { motion } from 'motion/react';
import { Medal, Radiation, Map as MapIcon, Swords } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MODES } from '../constants';

const ICONS = { multi: Swords, dmz: Radiation, warzone: MapIcon, prestige: Medal };

/** Mobile-only bottom tab bar to switch between Multijoueur / DMZ / Warzone / Prestige. */
export default function BottomNav({ mode, onChange }) {
  return (
    <nav
      aria-label="Modes de jeu"
      className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
    >
      <div className="grid grid-cols-4">
        {MODES.map(m => {
          const Icon = ICONS[m.id];
          const active = mode === m.id;
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
                  transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                />
              )}
              <motion.span animate={{ scale: active ? 1.12 : 1, y: active ? -1 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}>
                <Icon className="size-5" />
              </motion.span>
              {m.short || m.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
