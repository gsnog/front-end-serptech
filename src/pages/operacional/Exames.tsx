import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Search, FlaskConical, Loader2 } from "lucide-react";
import { TableActions } from "@/components/TableActions";
import { toast } from "@/hooks/use-toast";
import {
  fetchExames, createExame, updateExame, deleteExame,
  examesQueryKey, type Exame,
} from "@/services/operacional";

export default function Exames() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [novoNome, setNovoNome] = useState("");

  // Edit
  const [editExame, setEditExame] = useState<Exame | null>(null);
  const [editNome, setEditNome] = useState("");

  // Delete
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const { data: exames = [], isLoading } = useQuery({
    queryKey: examesQueryKey,
    queryFn: fetchExames,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: examesQueryKey });

  const createMutation = useMutation({
    mutationFn: (nome: string) => createExame(nome),
    onSuccess: () => {
      invalidate();
      toast({ title: "Exame criado com sucesso!" });
      setNovoNome("");
      setIsCreateOpen(false);
    },
    onError: () => toast({ title: "Erro ao criar exame.", variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, nome }: { id: number; nome: string }) => updateExame(id, nome),
    onSuccess: () => {
      invalidate();
      toast({ title: "Exame atualizado." });
      setEditExame(null);
    },
    onError: () => toast({ title: "Erro ao atualizar exame.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteExame(id),
    onSuccess: () => {
      invalidate();
      toast({ title: "Exame removido." });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Erro ao remover exame.", variant: "destructive" }),
  });

  const filtered = exames.filter(e =>
    e.nome.toLowerCase().includes(search.toLowerCase())
  );

  const deleteTarget = exames.find(e => e.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
            <FlaskConical className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Exames</h1>
            <p className="text-sm text-muted-foreground">Tipos de exames cadastrados</p>
          </div>
        </div>
        <Button onClick={() => { setNovoNome(""); setIsCreateOpen(true); }} className="gap-2">
          <Plus className="h-4 w-4" /> Novo Exame
        </Button>
      </div>

      {/* Search */}
      <div className="filter-card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar exame..."
            className="pl-9"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header">
              <TableHead>Nome</TableHead>
              <TableHead className="text-center w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-10">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="text-center py-10 text-muted-foreground">
                  Nenhum exame encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(exame => (
                <TableRow key={exame.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-medium">{exame.nome}</TableCell>
                  <TableCell className="text-center">
                    <TableActions
                      onEdit={() => { setEditExame(exame); setEditNome(exame.nome); }}
                      onDelete={() => setDeleteId(exame.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create dialog */}
      <Dialog open={isCreateOpen} onOpenChange={v => { if (!createMutation.isPending) setIsCreateOpen(v); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FlaskConical className="h-5 w-5" /> Novo Exame
            </DialogTitle>
          </DialogHeader>
          <div>
            <Label>Nome <span className="text-destructive">*</span></Label>
            <Input
              value={novoNome}
              onChange={e => setNovoNome(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && novoNome.trim()) createMutation.mutate(novoNome.trim()); }}
              placeholder="Nome do exame..."
              className="mt-1"
              autoFocus
              disabled={createMutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)} disabled={createMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate(novoNome.trim())}
              disabled={!novoNome.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editExame !== null} onOpenChange={v => { if (!editMutation.isPending && !v) setEditExame(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Exame</DialogTitle>
          </DialogHeader>
          <div>
            <Label>Nome <span className="text-destructive">*</span></Label>
            <Input
              value={editNome}
              onChange={e => setEditNome(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && editNome.trim() && editExame)
                  editMutation.mutate({ id: editExame.id, nome: editNome.trim() });
              }}
              placeholder="Nome do exame..."
              className="mt-1"
              autoFocus
              disabled={editMutation.isPending}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditExame(null)} disabled={editMutation.isPending}>
              Cancelar
            </Button>
            <Button
              onClick={() => editExame && editMutation.mutate({ id: editExame.id, nome: editNome.trim() })}
              disabled={!editNome.trim() || editMutation.isPending}
            >
              {editMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir exame?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja excluir o exame <strong>"{deleteTarget?.nome}"</strong>?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
