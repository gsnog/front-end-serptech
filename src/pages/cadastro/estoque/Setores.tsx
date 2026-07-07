import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { fetchSetores, updateSetor, deleteSetor, fetchFuncionarios, setoresQueryKey, type Setor } from "@/services/pessoas";
import { ValidatedSelect } from "@/components/ui/validated-select";

const SetoresCadastro = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchSetor, setSearchSetor] = useState("");
  const handleSearch = (v: string) => { setSearchSetor(v); setCurrentPage(1); };
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<Setor | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editResponsavelId, setEditResponsavelId] = useState<string>("");

  const PAGE_SIZE = 20;
  const [currentPage, setCurrentPage] = useState(1);

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: fetchFuncionarios,
  });
  const responsavelOptions = funcionarios.map(f => ({ value: String(f.id), label: f.nome }));

  const { data: response, isLoading } = useQuery({
    queryKey: [...setoresQueryKey, currentPage],
    queryFn: () => fetchSetores(currentPage, PAGE_SIZE),
  });
  const allItems: Setor[] = Array.isArray(response) ? response : ((response as any)?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : ((response as any)?.count ?? 0);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const updateMut = useMutation({
    mutationFn: () => updateSetor(editItem!.id, {
      nome: editNome.trim(),
      responsavel_id: editResponsavelId ? Number(editResponsavelId) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setoresQueryKey });
      setEditItem(null);
      toast({ title: "Setor atualizado com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteSetor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setoresQueryKey });
      setDeleteId(null);
      toast({ title: "Setor excluído com sucesso." });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Setor em uso — não pode ser excluído.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
      setDeleteId(null);
    },
  });

  const filtered = allItems.filter(s => s.nome.toLowerCase().includes(searchSetor.toLowerCase()));
  const items = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const getExportData = () => filtered.map(s => ({ Setor: s.nome, Responsável: s.responsavel_nome ?? "—" }));
  const deleteItem = allItems.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/estoque/setores/novo")} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Setor
          </Button>
          <ExportButton getData={getExportData} fileName="setores-estoque" />
        </div>

        <FilterSection
          fields={[{ type: "text" as const, label: "Setor", placeholder: "Buscar setor...", value: searchSetor, onChange: handleSearch, width: "flex-1 min-w-[200px]" }]}
          resultsCount={totalCount}
        />

        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="font-semibold">Setor</TableHead>
                <TableHead className="font-semibold">Responsável</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum setor encontrado.</TableCell></TableRow>
              ) : items.map((setor) => (
                <TableRow key={setor.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-medium">{setor.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{setor.responsavel_nome ?? "—"}</TableCell>
                  <TableCell className="text-center">
                    <TableActions
                      onEdit={() => { setEditItem(setor); setEditNome(setor.nome); setEditResponsavelId(setor.responsavel_id ? String(setor.responsavel_id) : ""); }}
                      onDelete={() => setDeleteId(setor.id)}
                    />
                  </TableCell>
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

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Setor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome do Setor</Label>
              <Input
                value={editNome}
                onChange={e => setEditNome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !updateMut.isPending && updateMut.mutate()}
              />
            </div>
            <ValidatedSelect
              label="Responsável"
              value={editResponsavelId}
              onValueChange={setEditResponsavelId}
              placeholder="Selecionar responsável"
              options={responsavelOptions}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)} disabled={updateMut.isPending}>Cancelar</Button>
            <Button onClick={() => updateMut.mutate()} disabled={updateMut.isPending || !editNome.trim()}>
              {updateMut.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir <strong>{deleteItem?.nome}</strong>?
              Setores vinculados a itens não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SetoresCadastro;
