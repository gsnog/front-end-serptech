import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2 } from "lucide-react";
import { TableActions } from "@/components/TableActions";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchSetores, setoresQueryKey, type Setor } from "@/services/pessoas";

export default function SetoresAreas() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Setor | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading, isError } = useQuery({
    queryKey: [...setoresQueryKey, currentPage],
    queryFn: () => fetchSetores(currentPage),
  });
  const setores: Setor[] = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const filteredSetores = useMemo(() =>
    setores.filter((setor) =>
      (setor.nome || "").toLowerCase().includes(searchTerm.toLowerCase())
    ), [setores, searchTerm]);

  const getExportData = () => filteredSetores.map(s => ({ Nome: s.nome }));

  const deleteItem = setores.find(s => s.id === deleteId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/cadastro/pessoas/setores/novo")} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Setor
          </Button>
          <ExportButton getData={getExportData} fileName="cadastro-setores-areas" />
        </div>
      </div>

      <div className="filter-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome do setor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
        </div>
      </div>

      <div className="rounded border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
              <TableHead className="text-foreground font-semibold">Nome</TableHead>
              <TableHead className="text-foreground font-semibold text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-8 text-destructive">
                  Erro ao carregar setores da API.
                </TableCell>
              </TableRow>
            ) : filteredSetores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="h-8 w-8" />
                    <p className="font-medium">Nenhum setor cadastrado</p>
                    <p className="text-sm">Crie um setor para organizar a estrutura da empresa.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSetores.map((setor) => (
                <TableRow key={setor.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{setor.nome}</TableCell>
                  <TableCell className="text-center">
                    <TableActions
                      onView={() => setViewItem(setor)}
                      onEdit={() => navigate(`/cadastro/pessoas/setores/${setor.id}`)}
                      onDelete={() => setDeleteId(setor.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
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
              <InfoRow label="Nome" value={viewItem.nome} />
            </div>
          )}
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
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                toast({ title: "Em desenvolvimento", description: "Exclusão de setores disponível em breve." });
                setDeleteId(null);
              }}
            >
              Excluir
            </AlertDialogAction>
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
