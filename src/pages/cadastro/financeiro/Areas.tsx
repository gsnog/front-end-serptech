import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import {
  fetchAreas, createArea, updateArea, deleteArea,
  areasQueryKey,
  type Area,
} from "@/services/financeiro";

const Areas = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Area | null>(null);
  const [editItem, setEditItem] = useState<Area | null>(null);
  const [editNome, setEditNome] = useState("");

  const { data: response, isLoading } = useQuery({
    queryKey: [...areasQueryKey],
    queryFn: fetchAreas,
  });
  const items: Area[] = Array.isArray(response) ? response : ((response as any)?.results ?? []);
  const totalCount = items.length;

  const deleteMutation = useMutation({
    mutationFn: deleteArea,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areasQueryKey });
      setDeleteId(null);
      toast({ title: "Removido", description: "Área excluída." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { id?: number; nome: string }) =>
      payload.id ? updateArea(payload.id, { nome: payload.nome }) : createArea({ nome: payload.nome }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: areasQueryKey });
      setEditItem(null);
      toast({ title: "Salvo", description: "Área atualizada." });
    },
    onError: () => toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" }),
  });

  const filterFields = [{ type: "text" as const, label: "Área", placeholder: "Buscar área...", value: search, onChange: setSearch, width: "flex-1 min-w-[200px]" }];
  const filtered = items.filter(a => a.nome.toLowerCase().includes(search.toLowerCase()));
  const getExportData = () => filtered.map(a => ({ Área: a.nome }));
  const deleteItem = items.find(i => i.id === deleteId);

  const handleSave = () => {
    if (!editNome.trim()) { toast({ title: "Informe o nome da área.", variant: "destructive" }); return; }
    saveMutation.mutate({ id: editItem?.id || undefined, nome: editNome.trim() });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => { setEditItem({ id: 0, nome: "" }); setEditNome(""); }} className="gap-2"><Plus className="w-4 h-4" />Nova Área</Button>
          <ExportButton getData={getExportData} fileName="areas" />
        </div>
        <FilterSection fields={filterFields} resultsCount={totalCount} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header"><TableHead className="font-semibold">Área</TableHead><TableHead className="text-center font-semibold">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {isLoading ? (<TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>) :
                filtered.length === 0 ? (<TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground">Nenhuma área encontrada.</TableCell></TableRow>) : (
                  filtered.map((a) => (
                    <TableRow key={a.id} className="hover:bg-table-hover transition-colors">
                      <TableCell className="font-medium">{a.nome}</TableCell>
                      <TableCell className="text-center"><TableActions onView={() => setViewItem(a)} onEdit={() => { setEditItem(a); setEditNome(a.nome); }} onDelete={() => setDeleteId(a.id)} /></TableCell>
                    </TableRow>
                  ))
                )}
            </TableBody>
          </Table>
        </div>
      </div>
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>{viewItem && <div className="py-2"><div className="flex justify-between py-1"><span className="text-sm text-muted-foreground">Área</span><span className="text-sm font-medium">{viewItem.nome}</span></div></div>}</DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem?.id ? "Editar Área" : "Nova Área"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4"><div className="space-y-2"><Label>Nome</Label><Input value={editNome} onChange={e => setEditNome(e.target.value)} /></div></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.nome}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Areas;
