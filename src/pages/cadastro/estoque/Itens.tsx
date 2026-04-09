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
import { Plus } from "lucide-react";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchItensEstoque } from "@/services/estoque";
import { Loader2 } from "lucide-react";

const Itens = () => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: ['itensEstoque', currentPage],
    queryFn: () => fetchItensEstoque(currentPage),
  });
  const itensApi = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const [searchNome, setSearchNome] = useState("");
  const [searchData, setSearchData] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [editData, setEditData] = useState({ item: "", formaApresentacao: "", setores: "" });

  const items = (itensApi || []).map(apiItem => ({
    id: apiItem.id,
    codigo: `EST${String(apiItem.id).padStart(3, '0')}`,
    dataCadastro: "-",
    item: apiItem.itens_do_estoque,
    formaApresentacao: "-",
    setores: "-"
  }));

  const filterFields = [
    { type: "text" as const, label: "Nome", placeholder: "Buscar por nome...", value: searchNome, onChange: setSearchNome, width: "flex-1 min-w-[200px]" },
    { type: "date" as const, label: "Data de Cadastro", value: searchData, onChange: setSearchData, width: "min-w-[160px]" }
  ];
  const filtered = items.filter(item => item.item.toLowerCase().includes(searchNome.toLowerCase()));
  const getExportData = () => filtered.map(i => ({ Código: i.codigo, "Data Cadastro": i.dataCadastro, Item: i.item, "Forma Apresentação": i.formaApresentacao, Setores: i.setores }));
  const handleDelete = () => { if (deleteId !== null) { toast({ title: "Esta funcionalidade ainda não foi ligada à API" }); setDeleteId(null); } };
  const deleteItem = items.find(i => i.id === deleteId);
  const openEdit = (i: any) => { setEditItem(i); setEditData({ item: i.item, formaApresentacao: i.formaApresentacao, setores: i.setores }); };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/estoque/itens/novo")} className="gap-2"><Plus className="w-4 h-4" />Novo Item</Button>
          <ExportButton getData={getExportData} fileName="itens-estoque" />
        </div>
        <FilterSection fields={filterFields} resultsCount={totalCount} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="font-semibold">Código</TableHead>
              <TableHead className="text-center font-semibold">Data de Cadastro</TableHead>
              <TableHead className="font-semibold">Item</TableHead>
              <TableHead className="font-semibold">Forma de Apresentação</TableHead>
              <TableHead className="font-semibold">Setores</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? (<TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum item encontrado.</TableCell></TableRow>) : (
                filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="font-medium">{item.codigo}</TableCell>
                    <TableCell >{item.dataCadastro}</TableCell>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell >{item.formaApresentacao}</TableCell>
                    <TableCell >{item.setores}</TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(item)} onEdit={() => openEdit(item)} onDelete={() => setDeleteId(item.id)} /></TableCell>
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
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.item}</DialogTitle></DialogHeader>{viewItem && <div className="space-y-2 py-2"><InfoRow label="Data Cadastro" value={viewItem.dataCadastro} /><InfoRow label="Forma Apresentação" value={viewItem.formaApresentacao} /><InfoRow label="Setores" value={viewItem.setores} /></div>}</DialogContent>
      </Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Item</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Item</Label><Input value={editData.item} onChange={e => setEditData(p => ({ ...p, item: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Forma de Apresentação</Label><Input value={editData.formaApresentacao} onChange={e => setEditData(p => ({ ...p, formaApresentacao: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Setores</Label><Input value={editData.setores} onChange={e => setEditData(p => ({ ...p, setores: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { if (editItem) { toast({ title: "Funcionalidade de edição requer API Backend completa", description: "Item atualizado mock." }); setEditItem(null); } }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.item}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

export default Itens;
