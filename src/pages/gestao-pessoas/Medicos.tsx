import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { ExportButton } from "@/components/ExportButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchMedicos, updateMedico, deleteMedico, medicosQueryKey, type Medico } from "@/services/pessoas";

const PAGE_SIZE = 20;

const Medicos = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<Medico | null>(null);
  const [editCrm, setEditCrm] = useState("");
  const [editTelefone, setEditTelefone] = useState("");

  const handleSearch = (v: string) => { setSearch(v); setCurrentPage(1); };

  const { data: response, isLoading } = useQuery({
    queryKey: [...medicosQueryKey, currentPage, search],
    queryFn: () => fetchMedicos(currentPage, search),
  });

  const items: Medico[] = (response as any)?.results ?? [];
  const totalCount: number = (response as any)?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const updateMut = useMutation({
    mutationFn: () => updateMedico(editItem!.id, { crm: editCrm.trim(), telefone: editTelefone.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicosQueryKey });
      setEditItem(null);
      toast({ title: "Médico atualizado com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMedico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicosQueryKey });
      setDeleteId(null);
      toast({ title: "Médico excluído com sucesso." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
      setDeleteId(null);
    },
  });

  const deleteItem = items.find(i => i.id === deleteId);
  const getExportData = () => items.map(m => ({
    Nome: m.nome,
    CRM: m.crm,
    Telefone: m.telefone,
    Email: m.email,
    Especialidades: m.especialidades.map(e => e.nome).join(", "),
  }));

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/pessoas/pessoas/nova")} className="gap-2">
            <Plus className="w-4 h-4" /> Novo Médico
          </Button>
          <ExportButton getData={getExportData} fileName="medicos" />
        </div>

        <FilterSection
          fields={[{ type: "text" as const, label: "Médico", placeholder: "Buscar por nome ou CRM...", value: search, onChange: handleSearch, width: "flex-1 min-w-[200px]" }]}
          resultsCount={totalCount}
        />

        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="font-semibold">Nome</TableHead>
                <TableHead className="font-semibold">CRM</TableHead>
                <TableHead className="font-semibold">Especialidades</TableHead>
                <TableHead className="font-semibold">Telefone</TableHead>
                <TableHead className="font-semibold">E-mail</TableHead>
                <TableHead className="text-center font-semibold">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : items.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum médico encontrado.</TableCell></TableRow>
              ) : items.map((medico) => (
                <TableRow key={medico.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-medium">{medico.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{medico.crm || "—"}</TableCell>
                  <TableCell>{medico.especialidades.map(e => e.nome).join(", ") || "—"}</TableCell>
                  <TableCell>{medico.telefone || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{medico.email || "—"}</TableCell>
                  <TableCell className="text-center">
                    <TableActions
                      onEdit={() => { setEditItem(medico); setEditCrm(medico.crm); setEditTelefone(medico.telefone); }}
                      onDelete={() => setDeleteId(medico.id)}
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
          <DialogHeader><DialogTitle>Editar Médico — {editItem?.nome}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>CRM</Label>
              <Input value={editCrm} onChange={e => setEditCrm(e.target.value)} placeholder="Ex: CRM/SP 123456" />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={editTelefone} onChange={e => setEditTelefone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)} disabled={updateMut.isPending}>Cancelar</Button>
            <Button onClick={() => updateMut.mutate()} disabled={updateMut.isPending || !editCrm.trim()}>
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
            <AlertDialogDescription>Deseja excluir o médico <strong>{deleteItem?.nome}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} disabled={deleteMut.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleteMut.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Medicos;
