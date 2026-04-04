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
import { fetchSetores, type Setor } from "@/services/pessoas";
import api from "@/lib/api";

const updateSetorEstoque = (id: number, data: Partial<Setor>) =>
  api.put(`/api/setores-estoque/${id}/`, data).then(r => r.data);

const deleteSetorEstoque = (id: number) =>
  api.delete(`/api/setores-estoque/${id}/`);

const SetoresCadastro = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchSetor, setSearchSetor] = useState("");
  const handleSearch = (v: string) => { setSearchSetor(v); setCurrentPage(1); };
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Setor | null>(null);
  const [editItem, setEditItem] = useState<Setor | null>(null);
  const [editNome, setEditNome] = useState("");

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({ queryKey: ["setores"], queryFn: fetchSetores });
  const allItems: Setor[] = Array.isArray(response) ? response : (response?.results ?? []);

  const updateMut = useMutation({
    mutationFn: (d: { id: number; payload: Partial<Setor> }) => updateSetorEstoque(d.id, d.payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["setores"] }); setEditItem(null); toast({ title: "Salvo", description: "Setor atualizado." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSetorEstoque,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["setores"] }); setDeleteId(null); toast({ title: "Removido", description: "Setor excluído." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const getName = (s: Setor) => s.nome || s.setor || "—";
  const filtered = allItems.filter(s => getName(s).toLowerCase().includes(searchSetor.toLowerCase()));
  const totalCount = filtered.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const items = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const getExportData = () => filtered.map(s => ({ Setor: getName(s) }));
  const deleteItem = allItems.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/estoque/setores/novo")} className="gap-2"><Plus className="w-4 h-4" />Novo Setor</Button>
          <ExportButton getData={getExportData} fileName="setores-estoque" />
        </div>
        <FilterSection fields={[{ type: "text" as const, label: "Setor", placeholder: "Buscar setor...", value: searchSetor, onChange: handleSearch, width: "flex-1 min-w-[200px]" }]} resultsCount={totalCount} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header"><TableHead className="text-center font-semibold">Setor</TableHead><TableHead className="text-center font-semibold">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhum setor encontrado.</TableCell></TableRow>
              ) : filtered.map((setor) => (
                <TableRow key={setor.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="text-center font-medium">{getName(setor)}</TableCell>
                  <TableCell className="text-center"><TableActions onView={() => setViewItem(setor)} onEdit={() => { setEditItem(setor); setEditNome(getName(setor)); }} onDelete={() => setDeleteId(setor.id)} /></TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>{viewItem ? getName(viewItem) : ""}</DialogTitle></DialogHeader>
          {viewItem && <div className="py-2"><div className="flex justify-between py-1"><span className="text-sm text-muted-foreground">Setor</span><span className="text-sm font-medium">{getName(viewItem)}</span></div></div>}
        </DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Setor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4"><div className="space-y-2"><Label>Nome</Label><Input value={editNome} onChange={e => setEditNome(e.target.value)} /></div></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { if (editItem) updateMut.mutate({ id: editItem.id, payload: { setor: editNome, nome: editNome } }); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem ? getName(deleteItem) : ""}</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SetoresCadastro;
