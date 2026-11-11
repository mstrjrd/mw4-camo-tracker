import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ChartColumn } from 'lucide-react';
import Logo from './Logo';

/** External sites shown at the bottom of the rail (tracker and community pages). */
export const EXTERNAL_LINKS = [
  { href: 'https://wzstats.gg/fr', label: 'WZStats.gg (méta des armes)', icon: ChartColumn },
];

/** Desktop icon rail shared by the tracker and the admin. items: [{ id, label, icon }], links: [{ href, label, icon }]. Below `lg`, BottomNav takes over. */
export default function IconRail({ label, items, value, onChange, onHome, links = [] }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center border-r bg-background py-3 lg:flex">
      <button
        type="button"
        onClick={onHome}
        aria-label="Retour à l'accueil"
        title="Retour à l'accueil"
        className="rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Logo size={40} />
      </button>
      <nav aria-label={label} className="my-auto flex flex-col gap-3">
        {items.map(({ id, label: name, icon: Icon }) => {
          const active = value === id;
          return (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onChange(id)}
                  aria-label={name}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex size-12 items-center justify-center rounded-full transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <Icon className="size-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">{name}</TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
      {links.length > 0 && (
        <nav aria-label="Liens externes" className="flex flex-col gap-3">
          {links.map(({ href, label: name, icon: Icon }) => (
            <Tooltip key={href}>
              <TooltipTrigger asChild>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${name} (nouvel onglet)`}
                  className="flex size-12 items-center justify-center rounded-full text-muted-foreground transition-colors duration-200 outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Icon className="size-5" />
                </a>
              </TooltipTrigger>
              <TooltipContent side="right">{name}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
      )}
    </aside>
  );
}
