import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Building2 } from "lucide-react";
import { TableActions } from "@/components/TableActions";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchSetores, updateSetor, deleteSetor, setoresQueryKey, type Setor,
} from "@/services/pessoas";
import api from "@/lib/api";

export default function SetoresAreas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const handleSearchChange = (v: string) => { setSearchTerm(v); setCurrentPage(1); };

  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<Setor | null>(null);
  const [editNome, setEditNome] = useState("");
  const [editCodigo, setEditCodigo] = useState("");
  const [editResponsavelId, setEditResponsavelId] = useState<string>("");

  const { data: response, isLoading, isError } = useQuery({
    queryKey: [...setoresQueryKey, currentPage],
    queryFn: () => fetchSetores(currentPage, 20),
  });
  const setores: Setor[] = Array.isArray(response) ? response : ((response as any)?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : ((response as any)?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 20);

  const { data: funcionariosRaw = [] } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: () => api.get("/api/funcionarios/").then(r => Array.isArray(r.data) ? r.data : (r.data?.results ?? [])),
  });
  const responsaveisOptions = (funcionariosRaw as any[]).map((f: any) => ({
    value: String(f.id),
    label: f.nome_completo || f.user?.user?.first_name || String(f.id),
  }));

  const filteredSetores = useMemo(() =>
    setores.filter((s) => s.nome.toLowerCase().includes(searchTerm.toLowerCase())),
    [setores, searchTerm],
  );

  const getExportData = () => filteredSetores.map(s => ({
    Código: s.codigo || "",
    Nome: s.nome,
    Responsável: s.responsavel_nome || "",
  }));
  const deleteItem = setores.find(s => s.id === deleteId);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteSetor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setoresQueryKey });
      toast({ title: "Setor excluído com sucesso." });
      setDeleteId(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.detail || "Não é possível excluir: setor em uso.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
      setDeleteId(null);
    },
  });

  const editMutation = useMutation({
    mutationFn: () => updateSetor(editItem!.id, {
      nome: editNome.trim(),
      codigo: editCodigo.trim() || null,
      responsavel_id: editResponsavelId ? Number(editResponsavelId) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setoresQueryKey });
      toast({ title: "Setor atualizado com sucesso." });
      setEditItem(null);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.nome?.[0] || "Erro ao atualizar setor.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const openEdit = (setor: Setor) => {
    setEditItem(setor);
    setEditNome(setor.nome);
    setEditCodigo(setor.codigo || "");
    setEditResponsavelId(setor.responsavel_id ? String(setor.responsavel_id) : "");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => navigate("/cadastro/pessoas/setores/novo")} className="gap-2">
            <Plus className="h-4 w-4" /> Novo Setor
          </Button>
          <ExportButton getData={getExportData} fileName="cadastro-setores-areas" />
        </div>
      </div>

      <div className="filter-card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome do setor..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="rounded border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-[hsl(var(--sidebar-bg))] hover:bg-[hsl(var(--sidebar-bg))]">
              <TableHead className="text-foreground font-semibold">Código</TableHead>
              <TableHead className="text-foreground font-semibold">Nome</TableHead>
              <TableHead className="text-foreground font-semibold">Responsável</TableHead>
              <TableHead className="text-center text-foreground font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 mx-auto" /></TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-destructive">
                  Erro ao carregar setores.
                </TableCell>
              </TableRow>
            ) : filteredSetores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Building2 className="h-8 w-8" />
                    <p className="font-medium">Nenhum setor cadastrado</p>
                    <p className="text-sm">Crie um setor para organizar a estrutura da empresa.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSetores.map((setor) => (
                <TableRow key={setor.id} className="hover:bg-muted/50">
                  <TableCell className="text-muted-foreground text-sm">{setor.codigo || "—"}</TableCell>
                  <TableCell className="font-medium">{setor.nome}</TableCell>
                  <TableCell className="text-sm">{setor.responsavel_nome || "—"}</TableCell>
                  <TableCell className="text-center">
                    <TableActions
                      onEdit={() => openEdit(setor)}
                      onDelete={() => setDeleteId(setor.id)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages} ({totalCount} registros)
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Setor</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Setor/Área <span className="text-destructive">*</span></Label>
              <Input
                value={editNome}
                onChange={(e) => setEditNome(e.target.value)}
                placeholder="Ex: Tecnologia, RH, Financeiro..."
              />
            </div>
            <div className="space-y-2">
              <Label>Código</Label>
              <Input
                value={editCodigo}
                onChange={(e) => setEditCodigo(e.target.value)}
                placeholder="Ex: TI-01, RH, FIN..."
              />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Select value={editResponsavelId} onValueChange={setEditResponsavelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sem responsável</SelectItem>
                  {responsaveisOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)} disabled={editMutation.isPending}>
              Cancelar
            </Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending || !editNome.trim()}>
              {editMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente excluir <strong>{deleteItem?.nome}</strong>?
              Setores vinculados a pessoas ou itens não podem ser excluídos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
