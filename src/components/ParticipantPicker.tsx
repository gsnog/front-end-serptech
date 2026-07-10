import { useState } from 'react';
import { Search, X, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Pessoa } from '@/services/pessoas';

interface ParticipantPickerProps {
  /** Full pool of people to pick from (typically from fetchLookup()). */
  allPeople: Pessoa[];
  /** Currently selected person ids. */
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Ids to hide entirely from the list, e.g. people who are already members. */
  excludeIds?: string[];
  placeholder?: string;
  className?: string;
}

/**
 * Reusable "add participants" picker: removable badges for the current
 * selection, a search box, and a scrollable toggleable list of people
 * (avatar + name + cargo/setor). Shared between Kanban board members and
 * Chat group members.
 */
export function ParticipantPicker({
  allPeople,
  selected,
  onChange,
  excludeIds = [],
  placeholder = 'Buscar pessoa...',
  className,
}: ParticipantPickerProps) {
  const [search, setSearch] = useState('');

  const excluded = new Set(excludeIds.map(String));
  const available = allPeople.filter((p) => !excluded.has(String(p.id)));
  const filtered = available.filter((p) =>
    search ? p.nome.toLowerCase().includes(search.toLowerCase()) : true
  );

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((m) => m !== id) : [...selected, id]);
  };

  return (
    <div className={cn('space-y-2', className)}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((id) => {
            const p = allPeople.find((pe) => String(pe.id) === id);
            return p ? (
              <Badge key={id} variant="secondary" className="gap-1 pr-1">
                {p.nome.split(' ')[0]}
                <button
                  type="button"
                  onClick={() => onChange(selected.filter((m) => m !== id))}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ) : null;
          })}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={placeholder}
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="relative">
        <ScrollArea className="h-52 border rounded">
          <div className="space-y-1 p-2">
            {filtered.map((pessoa) => {
              const strId = String(pessoa.id);
              const isSelected = selected.includes(strId);
              return (
                <button
                  type="button"
                  key={pessoa.id}
                  className={cn(
                    'flex items-center gap-3 w-full p-2 rounded transition-colors',
                    isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                  )}
                  onClick={() => toggle(strId)}
                >
                  <div
                    className={cn(
                      'h-5 w-5 rounded border flex items-center justify-center shrink-0',
                      isSelected ? 'bg-primary border-primary' : 'border-border'
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">{pessoa.iniciais}</AvatarFallback>
                  </Avatar>
                  <div className="text-left min-w-0">
                    <div className="text-sm font-medium truncate">{pessoa.nome}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {pessoa.cargo} {pessoa.cargo && pessoa.setor ? '-' : ''} {pessoa.setor}
                    </div>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">
                Nenhuma pessoa encontrada.
              </p>
            )}
          </div>
        </ScrollArea>
        {filtered.length > 0 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b bg-gradient-to-t from-background to-transparent" />
        )}
      </div>
    </div>
  );
}
