import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { StatusBadge } from "@/components/StatusBadge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import {
  fetchOrdensServico, deleteOrdemServico, ordensServicoQueryKey, type OrdemServico,
} from "@/services/estoque";

const OrdemServicoPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<OrdemServico | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: [...ordensServicoQueryKey, currentPage],
    queryFn: () => fetchOrdensServico(currentPage),
  });
  const items = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const deleteMutation = useMutation({
    mutationFn: deleteOrdemServico,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ordensServicoQueryKey }); setDeleteId(null); toast({ title: "Removida", description: "Ordem de serviço excluída." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" }),
  });

  const filtered = items.filter(o =>
    o.descricao?.toLowerCase().includes(search.toLowerCase()) ||
    o.tipo_de_ordem?.toLowerCase().includes(search.toLowerCase()) ||
    o.usuario_nome?.toLowerCase().includes(search.toLowerCase())
  );
  const getExportData = () => filtered.map(o => ({ Nº: o.numero, Tipo: o.tipo_de_ordem, Descrição: o.descricao, Status: o.status, Solicitante: o.usuario_nome }));
  const deleteItemObj = items.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/ordens-de-servico/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Ordem de Serviço</Button>
          <ExportButton getData={getExportData} fileName="ordens-servico" />
        </div>
        <p className="text-sm text-muted-foreground">
          Utilize para registrar e acompanhar serviços de manutenção ou terceirizados.
        </p>
        <FilterSection fields={[{ type: "text" as const, label: "Buscar", placeholder: "Buscar por tipo ou descrição...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }]} resultsCount={filtered.length} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="text-center font-semibold">Nº</TableHead>
              <TableHead className="text-center font-semibold">Tipo</TableHead>
              <TableHead className="text-center font-semibold">Descrição</TableHead>
              <TableHead className="text-center font-semibold">Solicitante</TableHead>
              <TableHead className="text-center font-semibold">Status</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow> :
                filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhuma ordem de serviço encontrada.</TableCell></TableRow> :
                  filtered.map(o => (
                    <TableRow key={o.id} className="hover:bg-table-hover transition-colors">
                      <TableCell className="text-center font-mono">{o.numero}</TableCell>
                      <TableCell className="text-center">{o.tipo_de_ordem?.replace('_', ' ')}</TableCell>
                      <TableCell className="text-center font-medium">{o.descricao}</TableCell>
                      <TableCell className="text-center">{o.usuario_nome}</TableCell>
                      <TableCell className="text-center"><StatusBadge status={o.status || ''} /></TableCell>
                      <TableCell className="text-center"><TableActions onView={() => setViewItem(o)} onEdit={() => navigate(`/ordens-de-servico/${o.id}`)} onDelete={() => setDeleteId(o.id)} /></TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>OS #{viewItem?.numero} — {viewItem?.tipo_de_ordem}</DialogTitle></DialogHeader>{viewItem && <div className="space-y-2 py-2">
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Descrição</span><span className="text-sm font-medium">{viewItem.descricao}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Solicitante</span><span className="text-sm font-medium">{viewItem.usuario_nome}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Fornecedor</span><span className="text-sm font-medium">{viewItem.fornecedor_nome || "—"}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Data Solicitação</span><span className="text-sm font-medium">{viewItem.data_solicitacao}</span></div>
          <div className="flex justify-between"><span className="text-sm text-muted-foreground">Status</span><span className="text-sm font-medium">{viewItem.status}</span></div>
        </div>}</DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir a OS <strong>#{deleteItemObj?.numero}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
export default OrdemServicoPage;
