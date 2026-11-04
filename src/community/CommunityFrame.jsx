import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { navigate } from '@/lib/router';
import BottomNav, { MODE_ITEMS } from '../components/BottomNav';
import IconRail from '../components/IconRail';
import Logo from '../components/Logo';
import SearchField from '../components/SearchField';

const goHome = () => navigate('/');

/**
 * Tracker-like frame of the public pages: mode rail / bottom bar, header with the search, main column and side column.
 * `search` (optional): { value, onChange, placeholder }; the field sits in the header on desktop.
 * `actions`: extra header buttons, `aside`: right column, `footer`: footer text.
 */
export default function CommunityFrame({ title, mode, onMode, search, actions, aside, footer, children }) {
  return (
    <div className="min-h-svh lg:pl-20">
      <IconRail label="Modes de jeu" items={MODE_ITEMS} value={mode} onChange={onMode} onHome={goHome} />
      <header className="sticky top-0 z-20 bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Logo size={32} className="lg:hidden" />
            <h1 className="truncate text-base font-medium lg:sr-only">{title}</h1>
            {search && <SearchField {...search} className="hidden w-full max-w-md lg:block" />}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {actions}
            <Button variant="ghost" size="sm" onClick={goHome} aria-label="Retour au tracker">
              <ArrowLeft /><span className="hidden md:inline">Tracker</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 sm:pt-14 xl:grid xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start xl:gap-6">
        <div className="min-w-0 space-y-6">{children}</div>
        {aside}
      </main>

      {/* extra bottom padding below lg so the bottom bar never hides the footer */}
      <footer className="mx-auto w-full max-w-[1600px] px-4 pb-28 sm:px-6 lg:pb-10">
        {footer && <p className="text-sm text-muted-foreground">{footer}</p>}
      </footer>
      <BottomNav label="Modes de jeu" items={MODE_ITEMS} value={mode} onChange={onMode} />
    </div>
  );
}
