import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import {
  fetchOrdensCompra, deleteOrdemCompra, ordensCompraQueryKey, type OrdemCompra,
} from "@/services/estoque";

const OrdemCompraPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<OrdemCompra | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: [...ordensCompraQueryKey, currentPage],
    queryFn: () => fetchOrdensCompra(currentPage),
  });
  const items = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const deleteMutation = useMutation({
    mutationFn: deleteOrdemCompra,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ordensCompraQueryKey }); setDeleteId(null); toast({ title: "Removido", description: "Ordem de compra excluída." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" }),
  });

  const filtered = items.filter(o =>
    o.descricao_material?.toLowerCase().includes(search.toLowerCase()) ||
    o.setor_nome?.toLowerCase().includes(search.toLowerCase())
  );
  const getExportData = () => filtered.map(o => ({ Setor: o.setor_nome, Status: o.status, "Status Compra": o.status_da_compra, Descrição: o.descricao_material }));
  const deleteItemObj = items.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/ordens-de-compra/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Ordem de Compra</Button>
          <ExportButton getData={getExportData} fileName="ordens-compra" />
        </div>
        <p className="text-sm text-muted-foreground">
          Utilize para abrir solicitações de compra de novos itens para o estoque.
        </p>
        <FilterSection fields={[{ type: "text" as const, label: "Buscar", placeholder: "Buscar por setor ou material...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }]} resultsCount={filtered.length} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="text-center font-semibold">Setor</TableHead>
              <TableHead className="text-center font-semibold">Unidade</TableHead>
              <TableHead className="text-center font-semibold">Material</TableHead>
              <TableHead className="text-center font-semibold">Status</TableHead>
              <TableHead className="text-center font-semibold">Status Compra</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ordem de compra encontrada.</TableCell></TableRow> :
                  filtered.map(o => (
                    <TableRow key={o.id} className="hover:bg-table-hover transition-colors">
                      <TableCell className="text-center">{o.setor_nome}</TableCell>
                      <TableCell className="text-center">{o.unidade_nome}</TableCell>
                      <TableCell className="text-center font-medium">{o.descricao_material}</TableCell>
                      <TableCell className="text-center">{o.status}</TableCell>
                      <TableCell className="text-center">{o.status_da_compra}</TableCell>
                      <TableCell className="text-center"><TableActions onView={() => setViewItem(o)} onEdit={() => navigate(`/ordens-de-compra/${o.id}`)} onDelete={() => setDeleteId(o.id)} /></TableCell>
                    </TableRow>
                  ))
              }
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
      </div>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Ordem de Compra #{viewItem?.id}</DialogTitle></DialogHeader>{viewItem && <div className="space-y-2 py-2">
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Setor</span><span className="text-sm font-medium">{viewItem.setor_nome}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span><span className="text-sm font-medium">{viewItem.status}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Material</span><span className="text-sm font-medium">{viewItem.descricao_material}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Justificativa</span><span className="text-sm font-medium">{viewItem.justificativa}</span></div>
        </div>}</DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir a ordem de compra <strong>#{deleteItemObj?.id}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default OrdemCompraPage;
