import { useState } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchCentrosCusto, updateCentroCusto, deleteCentroCusto,
  centrosCustoQueryKey, type CentroCusto as CC,
} from "@/services/financeiro";

const CentroCusto = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchCentro, setSearchCentro] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<CC | null>(null);
  const [editItem, setEditItem] = useState<CC | null>(null);
  const [editData, setEditData] = useState<Partial<CC>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: [...centrosCustoQueryKey, currentPage],
    queryFn: () => fetchCentrosCusto(currentPage),
  });
  const items: CC[] = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const updateMut = useMutation({
    mutationFn: (d: { id: number; payload: Partial<CC> }) => updateCentroCusto(d.id, d.payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: centrosCustoQueryKey }); setEditItem(null); toast({ title: "Salvo", description: "Centro de custo atualizado." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteCentroCusto,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: centrosCustoQueryKey }); setDeleteId(null); toast({ title: "Removido", description: "Centro de custo excluído." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = items.filter(c => (c.centro_id || "").toLowerCase().includes(searchCentro.toLowerCase()) || (c.setor_nome || "").toLowerCase().includes(searchCentro.toLowerCase()));
  const getExportData = () => filtered.map(c => ({ "ID Centro": c.centro_id, Setor: c.setor_nome, Área: c.area_nome }));
  const deleteItem = items.find(i => i.id === deleteId);
  const openEdit = (c: CC) => { setEditItem(c); setEditData({ centro_id: c.centro_id, setor: c.setor, area: c.area }); };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/financeiro/centro-custo/novo")} className="gap-2"><Plus className="w-4 h-4" />Novo Centro de Custo</Button>
          <ExportButton getData={getExportData} fileName="centros-custo" />
        </div>
        <FilterSection fields={[{ type: "text" as const, label: "Centro de Custo", placeholder: "Buscar por ID ou setor...", value: searchCentro, onChange: setSearchCentro, width: "flex-1 min-w-[200px]" }]} resultsCount={totalCount} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="font-semibold">ID Centro</TableHead>
              <TableHead className="font-semibold">Setor</TableHead>
              <TableHead className="font-semibold">Área</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum centro de custo encontrado.</TableCell></TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-medium">{c.centro_id || "—"}</TableCell>
                  <TableCell >{c.setor_nome || "—"}</TableCell>
                  <TableCell >{c.area_nome || "—"}</TableCell>
                  <TableCell className="text-center"><TableActions onView={() => setViewItem(c)} onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} /></TableCell>
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
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Centro de Custo {viewItem?.centro_id}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2 py-2">
            <InfoRow label="ID Centro" value={viewItem.centro_id || "—"} />
            <InfoRow label="Setor" value={viewItem.setor_nome || "—"} />
            <InfoRow label="Área" value={viewItem.area_nome || "—"} />
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Centro de Custo</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>ID Centro</Label><Input value={editData.centro_id || ""} onChange={e => setEditData(p => ({ ...p, centro_id: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { if (editItem) updateMut.mutate({ id: editItem.id, payload: editData }); }} disabled={updateMut.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir o centro <strong>{deleteItem?.centro_id}</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMut.isPending}>Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

export default CentroCusto;
