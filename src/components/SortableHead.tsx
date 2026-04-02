import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDir } from "@/hooks/useSortable";

interface SortableHeadProps {
  label: string;
  field: string;
  sortKey: string | null;
  sortDir: SortDir;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHead({
  label,
  field,
  sortKey,
  sortDir,
  onSort,
  className,
}: SortableHeadProps) {
  const isActive = sortKey === field;
  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none hover:bg-muted/50 transition-colors",
        className
      )}
      onClick={() => onSort(field)}
    >
      <div className="flex items-center justify-center gap-1">
        <span>{label}</span>
        {isActive && sortDir === "asc" ? (
          <ArrowUp className="h-3 w-3 text-primary" />
        ) : isActive && sortDir === "desc" ? (
          <ArrowDown className="h-3 w-3 text-primary" />
        ) : (
          <ArrowUpDown className="h-3 w-3 text-muted-foreground/40" />
        )}
      </div>
    </TableHead>
  );
}
