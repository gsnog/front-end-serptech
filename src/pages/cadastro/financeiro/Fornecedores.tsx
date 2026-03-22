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
import { fetchFornecedores as fetchFornecedoresService, updateFornecedor as updateFornecedorService, deleteFornecedor as deleteFornecedorService } from "@/services/estoque";

interface Fornecedor {
  id: number;
  nome?: string;
  cnpj?: string;
  razao_social?: string;
  email?: string;
  telefone?: string;
}

const FornecedoresFinanceiro = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchNome, setSearchNome] = useState("");
  const [searchCnpj, setSearchCnpj] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Fornecedor | null>(null);
  const [editItem, setEditItem] = useState<Fornecedor | null>(null);
  const [editData, setEditData] = useState<Partial<Fornecedor>>({});

  const { data: response, isLoading } = useQuery({
    queryKey: ["fornecedores_fin", currentPage],
    queryFn: () => fetchFornecedoresService(currentPage),
  });
  const items: Fornecedor[] = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const updateMut = useMutation({
    mutationFn: (d: { id: number; payload: Partial<Fornecedor> }) => updateFornecedorService(d.id, d.payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fornecedores_fin"] }); setEditItem(null); toast({ title: "Salvo", description: "Fornecedor atualizado." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteFornecedorService,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["fornecedores_fin"] }); setDeleteId(null); toast({ title: "Removido", description: "Fornecedor excluído." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = items.filter(f =>
    (f.nome || "").toLowerCase().includes(searchNome.toLowerCase()) &&
    (f.cnpj || "").includes(searchCnpj)
  );
  const getExportData = () => filtered.map(f => ({ Fornecedor: f.nome, CNPJ: f.cnpj, "Razão Social": f.razao_social, Email: f.email, Telefone: f.telefone }));
  const deleteItem = items.find(i => i.id === deleteId);
  const openEdit = (f: Fornecedor) => { setEditItem(f); setEditData({ nome: f.nome, cnpj: f.cnpj, razao_social: f.razao_social, email: f.email, telefone: f.telefone }); };

  return (
    <div className="flex flex-col h-full bg-background"><div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => navigate("/cadastro/financeiro/fornecedores/novo")} className="gap-2"><Plus className="w-4 h-4" />Novo Fornecedor</Button>
        <ExportButton getData={getExportData} fileName="fornecedores-financeiro" />
      </div>
      <FilterSection fields={[
        { type: "text" as const, label: "Nome do Fornecedor", placeholder: "Buscar fornecedor...", value: searchNome, onChange: setSearchNome, width: "flex-1 min-w-[200px]" },
        { type: "text" as const, label: "CNPJ", placeholder: "Buscar por CNPJ...", value: searchCnpj, onChange: setSearchCnpj, width: "min-w-[180px]" }
      ]} resultsCount={totalCount} />
      <div className="rounded border border-border overflow-hidden"><Table><TableHeader><TableRow className="bg-table-header">
        <TableHead className="text-center font-semibold">Fornecedor</TableHead><TableHead className="text-center font-semibold">CNPJ/CPF</TableHead><TableHead className="text-center font-semibold">Razão Social</TableHead><TableHead className="text-center font-semibold">Email</TableHead><TableHead className="text-center font-semibold">Telefone</TableHead><TableHead className="text-center font-semibold">Ações</TableHead>
      </TableRow></TableHeader><TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : filtered.length === 0 ? (
            <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado.</TableCell></TableRow>
          ) : filtered.map(f => (
            <TableRow key={f.id} className="hover:bg-table-hover transition-colors">
              <TableCell className="text-center font-medium">{f.nome || "—"}</TableCell>
              <TableCell className="text-center">{f.cnpj || "—"}</TableCell>
              <TableCell className="text-center">{f.razao_social || "—"}</TableCell>
              <TableCell className="text-center">{f.email || "—"}</TableCell>
              <TableCell className="text-center">{f.telefone || "—"}</TableCell>
              <TableCell className="text-center"><TableActions onView={() => setViewItem(f)} onEdit={() => openEdit(f)} onDelete={() => setDeleteId(f.id)} /></TableCell>
            </TableRow>
          ))}
        </TableBody></Table>
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

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}><DialogContent><DialogHeader><DialogTitle>{viewItem?.nome}</DialogTitle></DialogHeader>
        {viewItem && <div className="space-y-2 py-2">
          <InfoRow label="CNPJ" value={viewItem.cnpj || "—"} />
          <InfoRow label="Razão Social" value={viewItem.razao_social || "—"} />
          <InfoRow label="Email" value={viewItem.email || "—"} />
          <InfoRow label="Telefone" value={viewItem.telefone || "—"} />
        </div>}
      </DialogContent></Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Fornecedor</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Nome</Label><Input value={editData.nome || ""} onChange={e => setEditData(p => ({ ...p, nome: e.target.value }))} /></div>
            <div className="space-y-2"><Label>CNPJ</Label><Input value={editData.cnpj || ""} onChange={e => setEditData(p => ({ ...p, cnpj: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Razão Social</Label><Input value={editData.razao_social || ""} onChange={e => setEditData(p => ({ ...p, razao_social: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editData.email || ""} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={editData.telefone || ""} onChange={e => setEditData(p => ({ ...p, telefone: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { if (editItem) updateMut.mutate({ id: editItem.id, payload: editData }); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.nome}</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

export default FornecedoresFinanceiro;
