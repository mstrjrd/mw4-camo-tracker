import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

/** Pill search field: in the header on desktop, above the list on smaller screens. */
export default function SearchField({ value, onChange, className, placeholder = 'Rechercher une arme…' }) {
  return (
    <div className={'relative min-w-0 ' + className}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input type="search" placeholder={placeholder} value={value} onChange={e => onChange(e.target.value)} className="h-10 rounded-full pl-10" />
    </div>
  );
}
