import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search } from "lucide-react";
import { TableActions } from "@/components/TableActions";
import { fetchCargos } from "@/services/pessoas";
import { useQuery } from "@tanstack/react-query";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";

type Cargo = { id: number; nome: string };

export default function Cargos() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Cargo | null>(null);
  const [editItem, setEditItem] = useState<Cargo | null>(null);
  const [editNome, setEditNome] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const { data: cargosApi = [], isLoading } = useQuery({
    queryKey: ['cargos', currentPage],
    queryFn: fetchCargos,
  });
  const items: Cargo[] = cargosApi;
  const totalCount = items.length;
  const PAGE_SIZE = 5;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const filtered = items.filter(c => c.nome.toLowerCase().includes(searchTerm.toLowerCase()));
  const getExportData = () => filtered.map(c => ({ Cargo: c.nome }));

  const handleDelete = () => {
    toast({ title: "Informação", description: "Exclusão via API ainda não implementada." });
    setDeleteId(null);
  };

  const deleteItem = items.find(c => c.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/cadastro/pessoas/cargos/novo")} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Cargo
          </Button>
          <ExportButton getData={getExportData} fileName="cadastro-cargos" />
        </div>
      </div>

      <div className="filter-card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar cargo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>
      </div>

      <div className="rounded border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
              <TableHead className="text-foreground font-semibold">Cargo</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhum cargo encontrado.</TableCell></TableRow>
            ) : filtered.map(cargo => (
              <TableRow key={cargo.id} className="hover:bg-muted/50">
                <TableCell className="font-medium">{cargo.nome}</TableCell>
                <TableCell className="text-center">
                  <TableActions
                    onView={() => setViewItem(cargo)}
                    onEdit={() => { setEditItem(cargo); setEditNome(cargo.nome); }}
                    onDelete={() => setDeleteId(cargo.id)}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages} ({totalCount} registros)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-3 py-2">
              <InfoRow label="ID" value={String(viewItem.id)} />
              <InfoRow label="Cargo" value={viewItem.nome} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Cargo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Nome do Cargo</Label><Input value={editNome} onChange={e => setEditNome(e.target.value)} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { toast({ title: "Informação", description: "Edição via API ainda não implementada." }); setEditItem(null); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Deseja realmente excluir <strong>{deleteItem?.nome}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
