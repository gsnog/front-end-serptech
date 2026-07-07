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
import {
  fetchTransferencias, createTransferencia, updateTransferencia, deleteTransferencia,
  fetchContasBancarias,
  transferenciasQueryKey, type Transacao,
} from "@/services/financeiro";

function InfoRow({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between items-center py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{label}</span><span className="text-sm font-medium text-foreground">{value}</span></div>;
}

const Transferencias = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchConta, setSearchConta] = useState("");
  const [searchData, setSearchData] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [viewItem, setViewItem] = useState<Transacao | null>(null);
  const [editItem, setEditItem] = useState<Transacao | null>(null);
  const [editForm, setEditForm] = useState({ valor: "", descricao: "", conta_origem: 0, conta_destino: 0, data_da_transacao: "" });

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({ queryKey: [...transferenciasQueryKey, currentPage], queryFn: () => fetchTransferencias(currentPage) });
  const items: Transacao[] = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);
  const { data: contasRaw } = useQuery({ queryKey: ['contasBancarias'], queryFn: fetchContasBancarias });
  const contas = Array.isArray(contasRaw) ? contasRaw : (contasRaw as any)?.results ?? [];
  const contaLabel = (c: any) => [c.banco, c.numero_conta ? `nº ${c.numero_conta}` : null, c.tipo ? `(${c.tipo})` : null].filter(Boolean).join(' — ');

  const deleteMutation = useMutation({
    mutationFn: deleteTransferencia,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: transferenciasQueryKey }); setDeleteId(null); toast({ title: "Removida", description: "Transferência excluída." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" }),
  });

  const saveMutation = useMutation({
    mutationFn: (payload: Partial<Transacao> & { id?: number }) =>
      payload.id ? updateTransferencia(payload.id, payload) : createTransferencia(payload),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: transferenciasQueryKey }); setEditItem(null); toast({ title: "Salvo", description: "Transferência salva." }); },
    onError: () => toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" }),
  });

  const filtered = items.filter(t => t.conta_origem_nome?.toLowerCase().includes(searchConta.toLowerCase()) || t.conta_destino_nome?.toLowerCase().includes(searchConta.toLowerCase()));
  const getExportData = () => filtered.map(t => ({ "Data da Transação": t.data_da_transacao || t.data_de_lancamento, "Conta Origem": t.conta_origem_nome, "Conta Destino": t.conta_destino_nome, Valor: t.valor }));
  const deleteItemObj = items.find(i => i.id === deleteId);

  const openEdit = (t: Transacao) => { setEditItem(t); setEditForm({ valor: String(t.valor ?? ""), descricao: t.descricao || "", conta_origem: t.conta_origem, conta_destino: t.conta_destino, data_da_transacao: t.data_da_transacao || "" }); };

  return (
    <div className="flex flex-col h-full bg-background"><div className="space-y-6">
      <div className="flex flex-wrap gap-3 items-center">
        <Button onClick={() => { setEditItem({ id: 0, data_de_lancamento: "", data_da_transacao: "", valor: 0, conta_origem: 0, conta_destino: 0 }); setEditForm({ valor: "", descricao: "", conta_origem: 0, conta_destino: 0, data_da_transacao: "" }); }} className="gap-2"><Plus className="w-4 h-4" />Nova Transferência</Button>
        <ExportButton getData={getExportData} fileName="transferencias" />
      </div>
      <FilterSection fields={[
        { type: "text" as const, label: "Conta", placeholder: "Buscar conta...", value: searchConta, onChange: setSearchConta, width: "flex-1 min-w-[200px]" },
        { type: "date" as const, label: "Data", value: searchData, onChange: setSearchData, width: "min-w-[160px]" }
      ]} resultsCount={totalCount} />
      <div className="rounded border border-border overflow-hidden"><Table><TableHeader><TableRow className="bg-table-header">
        <TableHead className="text-center font-semibold">Data da Transação</TableHead><TableHead className="font-semibold">Conta Origem</TableHead><TableHead className="font-semibold">Conta Destino</TableHead><TableHead className="text-right font-semibold">Valor</TableHead><TableHead className="text-center font-semibold">Ações</TableHead>
      </TableRow></TableHeader><TableBody>
          {isLoading ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow> :
            filtered.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma transferência encontrada.</TableCell></TableRow> :
              filtered.map(t => <TableRow key={t.id} className="hover:bg-table-hover transition-colors">
                <TableCell className="text-center">{t.data_da_transacao || t.data_de_lancamento}</TableCell>
                <TableCell className="font-medium">{t.conta_origem_nome}</TableCell>
                <TableCell >{t.conta_destino_nome}</TableCell>
                <TableCell className="text-right font-semibold">R$ {t.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                <TableCell className="text-center"><TableActions onView={() => setViewItem(t)} onEdit={() => openEdit(t)} onDelete={() => setDeleteId(t.id)} /></TableCell>
              </TableRow>)}
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
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}><DialogContent><DialogHeader><DialogTitle>Transferência</DialogTitle></DialogHeader>{viewItem && <div className="space-y-2 py-2"><InfoRow label="Data da Transação" value={viewItem.data_da_transacao || "-"} /><InfoRow label="Conta Origem" value={viewItem.conta_origem_nome || String(viewItem.conta_origem)} /><InfoRow label="Conta Destino" value={viewItem.conta_destino_nome || String(viewItem.conta_destino)} /><InfoRow label="Valor" value={`R$ ${viewItem.valor?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} /></div>}</DialogContent></Dialog>
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem?.id ? "Editar Transferência" : "Nova Transferência"}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Conta Origem</Label>
              <select className="w-full border rounded px-3 py-2 bg-background text-sm" value={editForm.conta_origem} onChange={e => setEditForm(p => ({ ...p, conta_origem: Number(e.target.value) }))}>
                <option value={0}>Selecione...</option>
                {contas.map((c: any) => <option key={c.id} value={c.id}>{contaLabel(c)}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Conta Destino</Label>
              <select className="w-full border rounded px-3 py-2 bg-background text-sm" value={editForm.conta_destino} onChange={e => setEditForm(p => ({ ...p, conta_destino: Number(e.target.value) }))}>
                <option value={0}>Selecione...</option>
                {contas.map((c: any) => <option key={c.id} value={c.id}>{contaLabel(c)}</option>)}
              </select>
            </div>
            <div className="space-y-2"><Label>Data da Transação <span className="text-destructive">*</span></Label><Input type="date" value={editForm.data_da_transacao} onChange={e => setEditForm(p => ({ ...p, data_da_transacao: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Valor (R$)</Label><Input type="text" inputMode="decimal" placeholder="0,00" value={editForm.valor} onChange={e => setEditForm(p => ({ ...p, valor: e.target.value }))} /></div>
            <div className="space-y-2"><Label>Descrição</Label><Input value={editForm.descricao} onChange={e => setEditForm(p => ({ ...p, descricao: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditItem(null)}>Cancelar</Button>
            <Button onClick={() => {
              const valorNum = Number(editForm.valor.replace(/\s/g, "").replace(",", "."));
              if (!editForm.data_da_transacao) {
                toast({ title: "Informe a data da transação.", variant: "destructive" }); return;
              }
              if (!editForm.valor || Number.isNaN(valorNum) || valorNum <= 0) {
                toast({ title: "Informe um valor válido.", variant: "destructive" }); return;
              }
              saveMutation.mutate({ id: editItem?.id || undefined, ...editForm, valor: valorNum });
            }} disabled={saveMutation.isPending}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir esta transferência de <strong>R$ {deleteItemObj?.valor}</strong>?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteId && deleteMutation.mutate(deleteId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};
export default Transferencias;
