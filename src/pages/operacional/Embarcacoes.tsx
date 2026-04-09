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
import { fetchEmbarcacoes, createEmbarcacao, updateEmbarcacao, deleteEmbarcacao, type Embarcacao as Emb } from "@/services/operacional";

const Embarcacoes = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterNome, setFilterNome] = useState("");
  const [filterCliente, setFilterCliente] = useState("");
  const [viewItem, setViewItem] = useState<Emb | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<Emb | null>(null);
  const [editData, setEditData] = useState({ nome: "", cliente: "", dimensoes: "", setores: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: ['embarcacoes', currentPage],
    queryFn: () => fetchEmbarcacoes(currentPage),
  });
  const items = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Emb> }) => updateEmbarcacao(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embarcacoes'] });
      setEditItem(null);
      toast({ title: "Salvo", description: "Embarcação atualizada com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmbarcacao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['embarcacoes'] });
      setDeleteId(null);
      toast({ title: "Removida", description: "Embarcação excluída com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = useMemo(() => items.filter((emb: Emb) =>
    (emb.nome || "").toLowerCase().includes(filterNome.toLowerCase()) &&
    (emb.cliente || "").toLowerCase().includes(filterCliente.toLowerCase())
  ), [items, filterNome, filterCliente]);

  const getExportData = () => filtered.map((e: Emb) => ({ Nome: e.nome, Cliente: e.cliente, Dimensão: e.dimensoes, Setores: e.setores }));
  const openEdit = (e: Emb) => { setEditItem(e); setEditData({ nome: e.nome, cliente: e.cliente || "", dimensoes: e.dimensoes || "", setores: e.setores || "" }) };
  const handleSaveEdit = () => { if (editItem) { updateMutation.mutate({ id: editItem.id, payload: editData }); } };
  const handleDelete = () => { if (deleteId !== null) { deleteMutation.mutate(deleteId); } };
  const deleteItemData = items.find((i: Emb) => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button className="gap-2" onClick={() => navigate("/operacional/embarcacoes/nova")}><Plus className="w-4 h-4" />Nova Embarcação</Button>
          <ExportButton getData={getExportData} fileName="embarcacoes" />
        </div>

        <FilterSection fields={[
          { type: "text", label: "Nome da Embarcação", placeholder: "Buscar embarcação...", value: filterNome, onChange: setFilterNome, width: "flex-1 min-w-[200px]" },
          { type: "text", label: "Cliente", placeholder: "Buscar cliente...", value: filterCliente, onChange: setFilterCliente, width: "min-w-[200px]" }
        ]} resultsCount={filtered.length} />

        <div className="rounded overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead >Nome</TableHead><TableHead >Cliente</TableHead><TableHead >Dimensão</TableHead><TableHead >Setores</TableHead><TableHead className="text-center">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma embarcação encontrada.</TableCell></TableRow>
              ) : (
                filtered.map((emb: Emb) => (
                  <TableRow key={emb.id}>
                    <TableCell >{emb.nome}</TableCell><TableCell >{emb.cliente || "—"}</TableCell><TableCell >{emb.dimensoes || "—"}</TableCell><TableCell >{emb.setores || "—"}</TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(emb)} onEdit={() => openEdit(emb)} onDelete={() => setDeleteId(emb.id)} /></TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>Detalhes da Embarcação</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2">{Object.entries({ Nome: viewItem.nome, Cliente: viewItem.cliente, Dimensões: viewItem.dimensoes, Setores: viewItem.setores }).map(([k, v]) => (<div key={k} className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{k}</span><span className="text-sm font-medium">{v || "—"}</span></div>))}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Embarcação</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Nome</Label><Input value={editData.nome} onChange={e => setEditData({ ...editData, nome: e.target.value })} /></div>
            <div><Label>Cliente</Label><Input value={editData.cliente} onChange={e => setEditData({ ...editData, cliente: e.target.value })} /></div>
            <div><Label>Dimensões</Label><Input value={editData.dimensoes} onChange={e => setEditData({ ...editData, dimensoes: e.target.value })} /></div>
            <div><Label>Setores</Label><Input value={editData.setores} onChange={e => setEditData({ ...editData, setores: e.target.value })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir embarcação?</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{deleteItemData?.nome}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Excluindo..." : "Excluir"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Embarcacoes;
