import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import Logo from './Logo';

/** Desktop icon rail shared by the tracker and the admin. items: [{ id, label, icon }]. Below `lg`, BottomNav takes over. */
export default function IconRail({ label, items, value, onChange, onHome }) {
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
    </aside>
  );
}
