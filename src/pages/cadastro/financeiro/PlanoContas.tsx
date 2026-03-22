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
  fetchPlanoContas, createPlanoContas, updatePlanoContas, deletePlanoContas,
  fetchCategoriasFinanceiras, fetchClassificacoesFinanceiras,
  planoContasQueryKey, type PlanoContas,
} from "@/services/financeiro";

const PlanoContasPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<PlanoContas | null>(null);
  const [editItem, setEditItem] = useState<PlanoContas | null>(null);
  const [editForm, setEditForm] = useState({ id_plano: "", categoria: 0, classificacao: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({ queryKey: [...planoContasQueryKey, currentPage], queryFn: () => fetchPlanoContas(currentPage) });
  const items: PlanoContas[] = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);
  const { data: categorias = [] } = useQuery({ queryKey: ['categoriasFinanceiras'], queryFn: fetchCategoriasFinanceiras });
  const { data: classificacoes = [] } = useQuery({ queryKey: ['classificacoesFinanceiras'], queryFn: fetchClassificacoesFinanceiras });

  const deleteMutation = useMutation({
    mutationFn: deletePlanoContas,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: planoContasQueryKey }); setDeleteId(null); toast({ title: "Removido", description: "Plano excluído." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<PlanoContas> & { id?: number }) =>
      payload.id ? updatePlanoContas(payload.id, payload) : createPlanoContas(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: planoContasQueryKey }); setEditItem(null); toast({ title: "Salvo", description: "Plano de contas atualizado." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" }),
  });

  const filterFields = [{ type: "text" as const, label: "Plano", placeholder: "Buscar plano...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }];
  const filtered = items.filter(p => p.id_plano?.toLowerCase().includes(search.toLowerCase()) || p.categoria_nome?.toLowerCase().includes(search.toLowerCase()));
  const getExportData = () => filtered.map(p => ({ ID: p.id_plano, Categoria: p.categoria_nome, Classificação: p.classificacao_nome }));
  const deleteItemObj = items.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => { setEditItem({ id: 0, id_plano: "" }); setEditForm({ id_plano: "", categoria: 0, classificacao: 0 }); }} className="gap-2"><Plus className="w-4 h-4" />Novo Plano</Button>
          <ExportButton getData={getExportData} fileName="plano-contas" />
        </div>
        <FilterSection fields={filterFields} resultsCount={totalCount} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="text-center font-semibold">ID Plano</TableHead>
              <TableHead className="text-center font-semibold">Categoria</TableHead>
              <TableHead className="text-center font-semibold">Classificação</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>) :
                filtered.length === 0 ? (<TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum plano de contas encontrado.</TableCell></TableRow>) : (
                  filtered.map(p => (
                    <TableRow key={p.id} className="hover:bg-table-hover transition-colors">
                      <TableCell className="text-center font-mono font-medium">{p.id_plano}</TableCell>
                      <TableCell className="text-center">{p.categoria_nome}</TableCell>
                      <TableCell className="text-center">{p.classificacao_nome}</TableCell>
                      <TableCell className="text-center"><TableActions onView={() => setViewItem(p)} onEdit={() => { setEditItem(p); setEditForm({ id_plano: p.id_plano, categoria: p.categoria || 0, classificacao: p.classificacao || 0 }); }} onDelete={() => setDeleteId(p.id)} /></TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.id_plano}</DialogTitle></DialogHeader>{viewItem && <div className="space-y-2 py-2"><div className="flex justify-between"><span className="text-sm text-muted-foreground">Categoria</span><span className="text-sm font-medium">{viewItem.categoria_nome}</span></div><div className="flex justify-between"><span className="text-sm text-muted-foreground">Classificação</span><span className="text-sm font-medium">{viewItem.classificacao_nome}</span></div></div>}</DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem?.id ? "Editar Plano" : "Novo Plano de Contas"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>ID Plano</Label><Input value={editForm.id_plano} onChange={e => setEditForm(p => ({ ...p, id_plano: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Categoria</Label>
              <select className="w-full border rounded px-3 py-2 bg-background text-sm" value={editForm.categoria} onChange={e => setEditForm(p => ({ ...p, categoria: Number(e.target.value) }))}>
                <option value={0}>Selecione...</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Classificação</Label>
              <select className="w-full border rounded px-3 py-2 bg-background text-sm" value={editForm.classificacao} onChange={e => setEditForm(p => ({ ...p, classificacao: Number(e.target.value) }))}>
                <option value={0}>Selecione...</option>
                {classificacoes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate({ id: editItem?.id || undefined, ...editForm })} disabled={saveMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir o plano <strong>{deleteItemObj?.id_plano}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlanoContasPage;
