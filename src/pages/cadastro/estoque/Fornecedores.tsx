import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchFornecedores } from "@/services/estoque";

const FornecedoresEstoque = () => {
  const navigate = useNavigate();
  const [searchNome, setSearchNome] = useState("");
  const [searchCnpj, setSearchCnpj] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => { setCurrentPage(1); }, [searchNome, searchCnpj]);
  const search = searchNome || searchCnpj || undefined;
  const { data: response, isLoading } = useQuery({
    queryKey: ['fornecedores', currentPage, search],
    queryFn: () => fetchFornecedores(currentPage, search),
  });
  const fornecedoresApi = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editData, setEditData] = useState({ fornecedor: "", cnpj: "", razaoSocial: "", vendedor: "", email: "", telefone: "" });

  const items = fornecedoresApi.map(f => ({
    id: f.id,
    fornecedor: f.nome,
    cnpj: f.cnpj || "-",
    razaoSocial: "-",
    vendedor: "-",
    email: "-",
    telefone: "-"
  }));

  const filterFields = [
    { type: "text" as const, label: "Nome do Fornecedor", placeholder: "Buscar fornecedor...", value: searchNome, onChange: setSearchNome, width: "flex-1 min-w-[200px]" },
    { type: "text" as const, label: "CNPJ", placeholder: "Buscar por CNPJ...", value: searchCnpj, onChange: setSearchCnpj, width: "min-w-[180px]" }
  ];
  const filtered = items;
  const getExportData = () => filtered.map(f => ({ Fornecedor: f.fornecedor, CNPJ: f.cnpj, "Razão Social": f.razaoSocial, Vendedor: f.vendedor, Email: f.email, Telefone: f.telefone }));
  const handleDelete = () => { if (deleteId !== null) { toast({ title: "Esta funcionalidade ainda não foi ligada à API" }); setDeleteId(null); } };
  const deleteItem = items.find(i => i.id === deleteId);
  const openEdit = (f: any) => { setEditItem(f); setEditData({ fornecedor: f.fornecedor, cnpj: f.cnpj, razaoSocial: f.razaoSocial, vendedor: f.vendedor, email: f.email, telefone: f.telefone }); };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/estoque/fornecedores/novo")} className="gap-2"><Plus className="w-4 h-4" />Novo Fornecedor</Button>
          <ExportButton getData={getExportData} fileName="fornecedores-estoque" />
        </div>
        <FilterSection fields={filterFields} resultsCount={totalCount} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="font-semibold">Fornecedor</TableHead>
              <TableHead className="font-semibold">CNPJ/CPF</TableHead>
              <TableHead className="font-semibold">Razão Social</TableHead>
              <TableHead className="font-semibold">Vendedor</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Telefone</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground"><Loader2 className="animate-spin h-5 w-5 mx-auto" /></TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum fornecedor encontrado.</TableCell></TableRow>
              ) : (
                filtered.map((f) => (
                  <TableRow key={f.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="font-medium">{f.fornecedor}</TableCell>
                    <TableCell >{f.cnpj}</TableCell>
                    <TableCell >{f.razaoSocial}</TableCell>
                    <TableCell >{f.vendedor}</TableCell>
                    <TableCell >{f.email}</TableCell>
                    <TableCell >{f.telefone}</TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(f)} onEdit={() => openEdit(f)} onDelete={() => setDeleteId(f.id)} /></TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.fornecedor}</DialogTitle></DialogHeader>{viewItem && <div className="space-y-2 py-2"><InfoRow label="CNPJ" value={viewItem.cnpj} /><InfoRow label="Razão Social" value={viewItem.razaoSocial} /><InfoRow label="Vendedor" value={viewItem.vendedor} /><InfoRow label="Email" value={viewItem.email} /><InfoRow label="Telefone" value={viewItem.telefone} /></div>}</DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Fornecedor</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2"><Label>Fornecedor</Label><Input value={editData.fornecedor} onChange={e => setEditData(p => ({ ...p, fornecedor: e.target.value }))} /></div>
            <div className="space-y-2"><Label>CNPJ</Label><Input value={editData.cnpj} onChange={e => setEditData(p => ({ ...p, cnpj: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Razão Social</Label><Input value={editData.razaoSocial} onChange={e => setEditData(p => ({ ...p, razaoSocial: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Vendedor</Label><Input value={editData.vendedor} onChange={e => setEditData(p => ({ ...p, vendedor: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={editData.email} onChange={e => setEditData(p => ({ ...p, email: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={editData.telefone} onChange={e => setEditData(p => ({ ...p, telefone: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { if (editItem) { toast({ title: "Funcionalidade de edição requer API Backend completa", description: "Fornecedor atualizado mock." }); setEditItem(null); } }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.fornecedor}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

export default FornecedoresEstoque;
