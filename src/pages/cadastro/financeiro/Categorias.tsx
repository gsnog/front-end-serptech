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
  fetchCategoriasFinanceiras, createCategoriaFinanceira,
  updateCategoriaFinanceira, deleteCategoriaFinanceira,
  categoriasFinanceirasQueryKey,
  type CategoriaFinanceira,
} from "@/services/financeiro";

const Categorias = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<CategoriaFinanceira | null>(null);
  const [editItem, setEditItem] = useState<CategoriaFinanceira | null>(null);
  const [editNome, setEditNome] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: [...categoriasFinanceirasQueryKey, currentPage],
    queryFn: () => fetchCategoriasFinanceiras(currentPage),
  });
  const items: CategoriaFinanceira[] = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const deleteMutation = useMutation({
    mutationFn: deleteCategoriaFinanceira,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasFinanceirasQueryKey });
      setDeleteId(null);
      toast({ title: "Removido", description: "Categoria excluída." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: number; nome: string }) =>
      payload.id ? updateCategoriaFinanceira(payload.id, { nome: payload.nome }) : createCategoriaFinanceira({ nome: payload.nome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriasFinanceirasQueryKey });
      setEditItem(null);
      toast({ title: "Salvo", description: "Categoria atualizada." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" }),
  });

  const filterFields = [{ type: "text" as const, label: "Categoria", placeholder: "Buscar categoria...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }];
  const filtered = items.filter(c => c.nome.toLowerCase().includes(search.toLowerCase()));
  const getExportData = () => filtered.map(c => ({ Categoria: c.nome }));
  const deleteItem = items.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => { setEditItem({ id: 0, nome: "" }); setEditNome(""); }} className="gap-2"><Plus className="w-4 h-4" />Nova Categoria</Button>
          <ExportButton getData={getExportData} fileName="categorias" />
        </div>
        <FilterSection fields={filterFields} resultsCount={totalCount} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header"><TableHead className="font-semibold">Categoria</TableHead><TableHead className="text-center font-semibold">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (<TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>) :
                filtered.length === 0 ? (<TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhuma categoria encontrada.</TableCell></TableRow>) : (
                  filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-table-hover transition-colors">
                      <TableCell className="font-medium">{c.nome}</TableCell>
                      <TableCell className="text-center"><TableActions onView={() => setViewItem(c)} onEdit={() => { setEditItem(c); setEditNome(c.nome); }} onDelete={() => setDeleteId(c.id)} /></TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>{viewItem && <div className="py-2"><div className="flex justify-between py-1"><span className="text-sm text-muted-foreground">Categoria</span><span className="text-sm font-medium">{viewItem.nome}</span></div></div>}</DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem?.id ? "Editar Categoria" : "Nova Categoria"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4"><div className="space-y-2"><Label>Nome</Label><Input value={editNome} onChange={e => setEditNome(e.target.value)} /></div></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => saveMutation.mutate({ id: editItem?.id || undefined, nome: editNome })} disabled={saveMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.nome}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Categorias;
