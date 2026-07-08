import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FilterSection } from "@/components/FilterSection";
import { TableActions } from "@/components/TableActions";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ExportButton } from "@/components/ExportButton";
import { toast } from "@/hooks/use-toast";
import { fetchContasBancarias, updateContaBancaria, deleteContaBancaria, type ContaBancaria as CB } from "@/services/financeiro";

const ContaBancaria = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchBanco, setSearchBanco] = useState("");
  const [searchConta, setSearchConta] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<CB | null>(null);
  const [editItem, setEditItem] = useState<CB | null>(null);
  const [editData, setEditData] = useState<Partial<CB>>({});

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({ queryKey: ["contas_bancarias", currentPage], queryFn: () => fetchContasBancarias(currentPage) });
  const items: CB[] = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const updateMut = useMutation({
    mutationFn: (d: { id: number; payload: Partial<CB> }) => updateContaBancaria(d.id, d.payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contas_bancarias"] }); setEditItem(null); toast({ title: "Salvo", description: "Conta atualizada." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: deleteContaBancaria,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["contas_bancarias"] }); setDeleteId(null); toast({ title: "Removida", description: "Conta excluída." }); },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = items.filter(c =>
    (c.banco || "").toLowerCase().includes(searchBanco.toLowerCase()) &&
    (c.numero_conta || "").includes(searchConta)
  );
  const getExportData = () => filtered.map(c => ({ Apelido: c.apelido || "", "Código Banco": c.codigo_banco, Banco: c.banco, Agência: c.agencia, Conta: c.numero_conta, Tipo: c.tipo, Saldo: c.saldo }));
  const openEdit = (c: CB) => { setEditItem(c); setEditData({ apelido: c.apelido, codigo_banco: c.codigo_banco, banco: c.banco, agencia: c.agencia, numero_conta: c.numero_conta, tipo: c.tipo }); };
  const deleteItem = items.find(i => i.id === deleteId);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/cadastro/financeiro/conta-bancaria/nova")} className="gap-2"><Plus className="w-4 h-4" />Nova Conta</Button>
          <ExportButton getData={getExportData} fileName="contas-bancarias" />
        </div>
        <FilterSection fields={[
          { type: "text" as const, label: "Nome do Banco", placeholder: "Buscar banco...", value: searchBanco, onChange: setSearchBanco, width: "flex-1 min-w-[200px]" },
          { type: "text" as const, label: "Número da Conta", placeholder: "Buscar por conta...", value: searchConta, onChange: setSearchConta, width: "min-w-[180px]" }
        ]} resultsCount={totalCount} />
        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead className="font-semibold">Apelido</TableHead>
              <TableHead className="font-semibold">Código do Banco</TableHead>
              <TableHead className="font-semibold">Banco</TableHead>
              <TableHead className="font-semibold">Agência</TableHead>
              <TableHead className="font-semibold">Número da Conta</TableHead>
              <TableHead className="text-center font-semibold">Tipo</TableHead>
              <TableHead className="text-right font-semibold">Saldo</TableHead>
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada.</TableCell></TableRow>
              ) : filtered.map((c) => (
                <TableRow key={c.id} className="hover:bg-table-hover transition-colors">
                  <TableCell className="font-medium">{c.apelido || "—"}</TableCell>
                  <TableCell >{c.codigo_banco || "—"}</TableCell>
                  <TableCell className="font-medium">{c.banco || "—"}</TableCell>
                  <TableCell >{c.agencia || "—"}</TableCell>
                  <TableCell >{c.numero_conta || "—"}</TableCell>
                  <TableCell >{c.tipo || "—"}</TableCell>
                  <TableCell className="text-right font-semibold">{c.saldo !== undefined ? `R$ ${Number(c.saldo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}</TableCell>
                  <TableCell className="text-center"><TableActions onView={() => setViewItem(c)} onEdit={() => openEdit(c)} onDelete={() => setDeleteId(c.id)} /></TableCell>
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

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>{viewItem?.banco}</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2 py-2">
            <InfoRow label="Apelido" value={viewItem.apelido || "—"} />
            <InfoRow label="Código" value={viewItem.codigo_banco || "—"} />
            <InfoRow label="Agência" value={viewItem.agencia || "—"} />
            <InfoRow label="Conta" value={viewItem.numero_conta || "—"} />
            <InfoRow label="Tipo" value={viewItem.tipo || "—"} />
            <InfoRow label="Saldo" value={viewItem.saldo !== undefined ? `R$ ${Number(viewItem.saldo).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"} />
          </div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Conta Bancária</DialogTitle></DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2 md:col-span-2">
              <Label>Apelido da Conta</Label>
              <Input placeholder="Ex.: Santander Matriz" value={editData.apelido || ""} onChange={e => setEditData(p => ({ ...p, apelido: e.target.value }))} />
              <p className="text-xs text-muted-foreground">Nome exibido nas telas de transferência e conciliação, para diferenciar contas do mesmo banco.</p>
            </div>
            <div className="space-y-2"><Label>Código do Banco</Label><Input value={editData.codigo_banco || ""} onChange={e => setEditData(p => ({ ...p, codigo_banco: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Banco</Label><Input value={editData.banco || ""} onChange={e => setEditData(p => ({ ...p, banco: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Agência</Label><Input value={editData.agencia || ""} onChange={e => setEditData(p => ({ ...p, agencia: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Número da Conta</Label><Input value={editData.numero_conta || ""} onChange={e => setEditData(p => ({ ...p, numero_conta: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Tipo</Label><Input value={editData.tipo || ""} onChange={e => setEditData(p => ({ ...p, tipo: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => { if (editItem) updateMut.mutate({ id: editItem.id, payload: editData }); }}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir <strong>{deleteItem?.banco}</strong>?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (deleteId) deleteMut.mutate(deleteId); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

export default ContaBancaria;
