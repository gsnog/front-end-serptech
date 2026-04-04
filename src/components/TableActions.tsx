import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, Trash2, ChevronDown, CheckCircle } from "lucide-react";

interface TableActionsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onFinalize?: () => void;
}

export function TableActions({ onView, onEdit, onDelete, onFinalize }: TableActionsProps) {
  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1 border-border">
            Ações
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
          {onView && (
            <DropdownMenuItem onClick={onView} className="gap-2 cursor-pointer">
              <Eye className="h-4 w-4" />
              Visualizar
            </DropdownMenuItem>
          )}
          {onEdit && (
            <DropdownMenuItem onClick={onEdit} className="gap-2 cursor-pointer">
              <Edit className="h-4 w-4" />
              Editar
            </DropdownMenuItem>
          )}
          {onFinalize && (
            <DropdownMenuItem onClick={onFinalize} className="gap-2 cursor-pointer text-green-600 focus:text-green-600">
              <CheckCircle className="h-4 w-4" />
              Finalizar
            </DropdownMenuItem>
          )}
          {onDelete && (
            <DropdownMenuItem
              onClick={onDelete}
              className="gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
    </DropdownMenu>
  );
}