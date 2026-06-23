import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchItensEstoque, updateItemEstoque, deleteItemEstoque, itensEstoqueQueryKey } from "@/services/estoque";
import { UNIDADES_MEDIDA, unidadeMedidaLabel } from "@/lib/unidadesMedida";
import { Loader2 } from "lucide-react";

const Itens = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: ['itensEstoque', currentPage],
    queryFn: () => fetchItensEstoque(currentPage),
  });
  const itensApi = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const [searchNome, setSearchNome] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editData, setEditData] = useState({ item: "", unidadeMedida: "" });

  const items = (itensApi || []).map(apiItem => ({
    id: apiItem.id,
    codigo: `EST${String(apiItem.id).padStart(3, '0')}`,
    item: apiItem.itens_do_estoque,
    unidadeMedida: apiItem.unidade_medida || ""
  }));

  const filterFields = [
    { type: "text" as const, label: "Nome", placeholder: "Buscar por nome...", value: searchNome, onChange: setSearchNome, width: "flex-1 min-w-[200px]" }
  ];
  const filtered = items.filter(item => item.item.toLowerCase().includes(searchNome.toLowerCase()));
  const getExportData = () => filtered.map(i => ({ Código: i.codigo, Item: i.item, "Unidade de Medida": unidadeMedidaLabel(i.unidadeMedida) }));
  const deleteItem = items.find(i => i.id === deleteId);
  const openEdit = (i: any) => { setEditItem(i); setEditData({ item: i.item, unidadeMedida: i.unidadeMedida }); };

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { itens_do_estoque: string; unidade_medida: string } }) =>
      updateItemEstoque(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itensEstoqueQueryKey });
      toast({ title: "Item atualizado com sucesso!" });
      setEditItem(null);
    },
    onError: (error: any) => {
      const data = error.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ")
        : "Verifique os dados e tente novamente.";
      toast({ title: "Erro ao atualizar item", description: msg, variant: "destructive" });
    },
  });

  const handleSaveEdit = () => {
    if (!editItem) return;
    if (!editData.item.trim()) {
      toast({ title: "O nome do item é obrigatório", variant: "destructive" });
      return;
    }
    updateMutation.mutate({
      id: editItem.id,
      data: { itens_do_estoque: editData.item, unidade_medida: editData.unidadeMedida },
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteItemEstoque(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: itensEstoqueQueryKey });
      toast({ title: "Item excluído com sucesso!" });
      setDeleteId(null);
    },
    onError: (error: any) => {
      const status = error.response?.status;
      const msg = status === 400 || status === 409 || status === 500
        ? "Este item não pode ser excluído porque está vinculado a registros (estoque, entradas, requisições, etc.)."
        : "Não foi possível excluir o item. Tente novamente.";
      toast({ title: "Erro ao excluir item", description: msg, variant: "destructive" });
      setDeleteId(null);
    },
  });

  const handleDelete = () => { if (deleteId !== null) deleteMutation.mutate(deleteId); };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/estoque/itens/novo")} className="gap-2"><Plus className="w-4 h-4" />Novo Item</Button>
          <ExportButton getData={getExportData} fileName="itens-estoque" />
        </div>
        <FilterSection fields={filterFields} resultsCount={totalCount} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="font-semibold">Código</TableHead>
              <TableHead className="font-semibold">Item</TableHead>
              <TableHead className="font-semibold">Unidade de Medida</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum item encontrado.</TableCell></TableRow>) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="font-medium">{item.codigo}</TableCell>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell >{unidadeMedidaLabel(item.unidadeMedida)}</TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(item)} onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item.id)} /></TableCell>
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
      </div>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.item}</DialogTitle></DialogHeader>{viewItem && <div className="space-y-2 py-2"><InfoRow label="Unidade de Medida" value={unidadeMedidaLabel(viewItem.unidadeMedida)} /></div>}</DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Item</Label><Input value={editData.item} onChange={e => setEditData(p => ({ ...p, item: e.target.value }))} /></div>
            <div className="space-y-2">
              <Label>Unidade de Medida</Label>
              <Select value={editData.unidadeMedida} onValueChange={v => setEditData(p => ({ ...p, unidadeMedida: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {editData.unidadeMedida && !UNIDADES_MEDIDA.some(u => u.value === editData.unidadeMedida) && (
                    <SelectItem value={editData.unidadeMedida}>{editData.unidadeMedida} (atual)</SelectItem>
                  )}
                  {UNIDADES_MEDIDA.map(u => <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)} disabled={updateMutation.isPending}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.item}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

export default Itens;
