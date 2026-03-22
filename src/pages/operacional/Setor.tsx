import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { FilterSection } from "@/components/FilterSection";
import { ExportButton } from "@/components/ExportButton";
import { Plus } from "lucide-react";
import { TableActions } from "@/components/TableActions";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSetoresOperacional, createSetor, updateSetor, deleteSetor, type Setor as SetorType } from "@/services/pessoas";


const Setor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterNome, setFilterNome] = useState("");
  const [viewItem, setViewItem] = useState<SetorType | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<SetorType | null>(null);
  const [editData, setEditData] = useState({ nome: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: ['setores_operacional', currentPage],
    queryFn: () => fetchSetoresOperacional(currentPage),
  });
  const items: SetorType[] = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<SetorType> }) => updateSetor(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores_operacional'] });
      setEditItem(null);
      toast({ title: "Salvo", description: "Setor atualizado." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSetor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['setores_operacional'] });
      setDeleteId(null);
      toast({ title: "Removido", description: "Setor excluído." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = useMemo(() => items.filter((s: SetorType) => (String(s.nome || s.setor || "")).toLowerCase().includes(filterNome.toLowerCase())), [items, filterNome]);

  const getExportData = () => filtered.map((s: SetorType) => ({ Setor: String(s.nome || s.setor || "") }));
  const openEdit = (s: SetorType) => { setEditItem(s); setEditData({ nome: s.nome || s.setor || "" }) };
  const handleSaveEdit = () => { if (editItem) { updateMutation.mutate({ id: editItem.id, payload: { setor: editData.nome } }); } };
  const handleDelete = () => { if (deleteId !== null) { deleteMutation.mutate(deleteId); } };
  const deleteItemData = items.find((i: SetorType) => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button className="gap-2" onClick={() => navigate("/operacional/setor/novo")}><Plus className="w-4 h-4" />Novo Setor</Button>
          <ExportButton getData={getExportData} fileName="setores-operacional" />
        </div>

        <FilterSection fields={[{ type: "text", label: "Setor", placeholder: "Buscar setor...", value: filterNome, onChange: setFilterNome, width: "flex-1 min-w-[200px]" }]} resultsCount={totalCount} />

        <div className="rounded overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-center">Setor</TableHead><TableHead className="text-center">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhum setor encontrado.</TableCell></TableRow>
              ) : (
                filtered.map((setor: SetorType) => (
                  <TableRow key={setor.id}>
                    <TableCell className="text-center">{String(setor.nome || setor.setor || "")}</TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(setor)} onEdit={() => openEdit(setor)} onDelete={() => setDeleteId(setor.id)} /></TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>Detalhes do Setor</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2"><div className="flex justify-between py-1 border-b border-border"><span className="text-sm text-muted-foreground">Setor</span><span className="text-sm font-medium">{String(viewItem.nome || viewItem.setor || "")}</span></div></div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Setor</DialogTitle></DialogHeader>
          <div className="space-y-3"><div><Label>Nome</Label><Input value={editData.nome} onChange={e => setEditData({ nome: e.target.value })} /></div></div>
          <DialogFooter><Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir setor?</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{String(deleteItemData?.nome || deleteItemData?.setor || "")}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Excluindo..." : "Excluir"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Setor;
