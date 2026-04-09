import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  fetchSubcategorias, updateSubcategoria, deleteSubcategoria,
  subcategoriasQueryKey, type SubcategoriaFinanceira,
  fetchCategoriasFinanceiras, categoriasFinanceirasQueryKey,
} from "@/services/financeiro";

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

const Subcategorias = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<SubcategoriaFinanceira | null>(null);
  const [editItem, setEditItem] = useState<SubcategoriaFinanceira | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCategoria, setEditCategoria] = useState("");

  const { data: raw = [], isLoading } = useQuery({
    queryKey: [...subcategoriasQueryKey],
    queryFn: fetchSubcategorias,
  });
  const items: SubcategoriaFinanceira[] = Array.isArray(raw) ? raw : (raw as any)?.results ?? [];

  const { data: catRaw = [] } = useQuery({
    queryKey: [...categoriasFinanceirasQueryKey],
    queryFn: () => fetchCategoriasFinanceiras(),
  });
  const categorias = Array.isArray(catRaw) ? catRaw : (catRaw as any)?.results ?? [];

  const updateMut = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<SubcategoriaFinanceira> }) =>
      updateSubcategoria(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subcategoriasQueryKey });
      setEditItem(null);
      toast({ title: "Salvo", description: "Subcategoria atualizada." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteSubcategoria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: subcategoriasQueryKey });
      setDeleteId(null);
      toast({ title: "Removido", description: "Subcategoria excluída." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = items.filter(s =>
    s.nome.toLowerCase().includes(search.toLowerCase()) ||
    (s.categoria_nome || "").toLowerCase().includes(search.toLowerCase())
  );
  const getExportData = () => filtered.map(s => ({ Subcategoria: s.nome, Categoria: s.categoria_nome || "" }));
  const deleteItem = items.find(i => i.id === deleteId);

  const openEdit = (s: SubcategoriaFinanceira) => {
    setEditItem(s);
    setEditNome(s.nome);
    setEditCategoria(String(s.categoria));
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/financeiro/subcategorias/nova")} className="gap-2">
            <Plus className="w-4 h-4" />Nova Subcategoria
          </Button>
          <ExportButton getData={getExportData} fileName="subcategorias" />
        </div>
        <FilterSection
          fields={[{ type: "text" as const, label: "Subcategoria", placeholder: "Buscar subcategoria ou categoria...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }]}
          resultsCount={filtered.length}
        />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="font-semibold">Subcategoria</TableHead>
                <TableHead className="font-semibold">Categoria</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhuma subcategoria encontrada.</TableCell></TableRow>
              ) : filtered.map(s => (
                <TableRow key={s.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-medium">{s.nome}</TableCell>
                  <TableCell >{s.categoria_nome || "—"}</TableCell>
                  <TableCell className="text-center">
                    <TableActions onView={() => setViewItem(s)} onEdit={() => openEdit(s)} onDelete={() => setDeleteId(s.id)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>
          {viewItem && (
            <div className="space-y-2 py-2">
              <InfoRow label="Subcategoria" value={viewItem.nome} />
              <InfoRow label="Categoria" value={viewItem.categoria_nome || String(viewItem.categoria)} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Subcategoria</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={editNome} onChange={e => setEditNome(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={editCategoria} onValueChange={setEditCategoria}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  {categorias.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (!editItem) return;
                if (!editNome.trim()) { toast({ title: "Informe o nome.", variant: "destructive" }); return; }
                if (!editCategoria) { toast({ title: "Selecione a categoria.", variant: "destructive" }); return; }
                updateMut.mutate({ id: editItem.id, payload: { nome: editNome, categoria: Number(editCategoria) } });
              }}
              disabled={updateMut.isPending}
            >Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>Deseja excluir <strong>{deleteItem?.nome}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMut.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMut.isPending}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Subcategorias;
