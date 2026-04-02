import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNavigate } from "react-router-dom"
import { useState, useMemo, useEffect } from "react"
import { FilterSection } from "@/components/FilterSection"
import { SortableHead } from "@/components/SortableHead"
import { Plus, FileText, ArrowUpRight, Wallet } from "lucide-react"
import { TableActions } from "@/components/TableActions"
import { GradientCard } from "@/components/financeiro/GradientCard"
import { StatusBadge } from "@/components/StatusBadge"
import { ExportButton } from "@/components/ExportButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { fetchContasReceber, updateContaReceber, deleteContaReceber, type ContaReceber as Conta, fetchEstatisticasFinanceiras, contasReceberQueryKey } from "@/services/financeiro"
import { useSortable } from "@/hooks/useSortable"
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates"

const ContasReceber = () => {
  const formatBRL = (value?: number | null) =>
    value != null
      ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
      : '—';
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filterCliente, setFilterCliente] = useState("")
  const [filterDocumento, setFilterDocumento] = useState("")
  const [filterDataInicio, setFilterDataInicio] = useState("")
  const [filterDataFim, setFilterDataFim] = useState("")
  const [viewItem, setViewItem] = useState<Conta | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<Conta | null>(null)
  const [editData, setEditData] = useState<Partial<Conta>>({})

  useRealtimeUpdates([[...contasReceberQueryKey]]);

  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [filterCliente, filterDocumento, filterDataInicio, filterDataFim]);

  const { data: response, isLoading } = useQuery({
    queryKey: [...contasReceberQueryKey, page],
    queryFn: () => fetchContasReceber(page),
  });
  const items = response?.results ?? [];
  const serverTotal = response?.count ?? 0;

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Conta> }) => updateContaReceber(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasReceberQueryKey });
      setEditItem(null);
      toast({ title: "Salvo", description: "Conta a receber atualizada." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContaReceber,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasReceberQueryKey });
      setDeleteId(null);
      toast({ title: "Removida", description: "Conta a receber excluída." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return items.filter((conta: Conta) => {
      const matchCliente = (conta.cliente_nome || "").toLowerCase().includes(filterCliente.toLowerCase())
      const matchDocumento = (conta.documento || "").toLowerCase().includes(filterDocumento.toLowerCase())
      const matchDataInicio = filterDataInicio ? (conta.data_de_faturamento || "") >= filterDataInicio : true
      const matchDataFim = filterDataFim ? (conta.data_de_faturamento || "") <= filterDataFim : true
      return matchCliente && matchDocumento && matchDataInicio && matchDataFim
    })
  }, [items, filterCliente, filterDocumento, filterDataInicio, filterDataFim])

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered)
  const paginatedItems = sorted;
  const total = serverTotal;
  const totalPages = Math.max(1, Math.ceil(serverTotal / 20));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const getExportData = () => filtered.map((c: Conta) => ({ Lançamento: c.data_de_lancamento, Faturamento: c.data_de_faturamento, Cliente: c.cliente_nome, Documento: c.documento, Título: c.valor_do_titulo, Total: c.valor_total, Vencimento: c.data_de_vencimento, Status: c.status }));
  const handleDelete = () => { if (deleteId !== null) { deleteMutation.mutate(deleteId); } };
  const openEdit = (c: Conta) => { setEditItem(c); setEditData({ ...c }); };
  const handleSaveEdit = () => { if (editItem) { updateMutation.mutate({ id: editItem.id, payload: editData }); } };
  const deleteItemData = items.find((i: Conta) => i.id === deleteId);

  const { data: stats } = useQuery({
    queryKey: ["financeiro_estatisticas"],
    queryFn: fetchEstatisticasFinanceiras,
  });

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GradientCard title="Total Recebido" value={formatBRL(stats?.entradas)} icon={ArrowUpRight} variant="success" />
          <GradientCard title="Total a Receber" value={formatBRL(stats?.saidas)} icon={ArrowUpRight} variant="info" />
          <GradientCard title="Saldo Projetado" value={formatBRL(stats?.saldo)} icon={Wallet} variant="orange" />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/financeiro/contas-receber/nova")} className="gap-2"><Plus className="w-4 h-4" />Adicionar Conta</Button>
          <Button onClick={() => navigate("/financeiro/contas-receber/relatorio")} variant="outline" className="gap-2 border-border"><FileText className="w-4 h-4" />Relatório</Button>
          <ExportButton getData={getExportData} fileName="contas-receber" />
        </div>

        <FilterSection
          fields={[
            { type: "text", label: "Cliente", placeholder: "Buscar cliente...", value: filterCliente, onChange: setFilterCliente, width: "flex-1 min-w-[180px]" },
            { type: "text", label: "Documento", placeholder: "Número do documento...", value: filterDocumento, onChange: setFilterDocumento, width: "min-w-[160px]" },
            { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
            { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
          ]}
          resultsCount={filtered.length}
        />

        <div className="rounded border border-border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-table-header">
              <SortableHead label="Lançamento" field="data_de_lancamento" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Faturamento" field="data_de_faturamento" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Cliente" field="cliente_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Documento" field="documento" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Título" field="valor_do_titulo" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Recebido" field="valor_total" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Vencimento" field="data_de_vencimento" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Status" field="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada.</TableCell></TableRow>
              ) : (
                paginatedItems.map((conta: Conta) => (
                  <TableRow key={conta.id} className="hover:bg-table-hover transition-colors">
                    <TableCell className="text-center">{conta.data_de_lancamento || "—"}</TableCell>
                    <TableCell className="text-center">{conta.data_de_faturamento || "—"}</TableCell>
                    <TableCell className="text-center">{conta.cliente_nome || "—"}</TableCell>
                    <TableCell className="text-center">{conta.documento || "—"}</TableCell>
                    <TableCell className="text-center">{formatBRL(conta.valor_do_titulo)}</TableCell>
                    <TableCell className="text-center">{formatBRL(conta.valor_total)}</TableCell>
                    <TableCell className="text-center">{conta.data_de_vencimento || "—"}</TableCell>
                    <TableCell className="text-center"><StatusBadge status={conta.status || "Em Aberto"} /></TableCell>
                    <TableCell className="text-center"><TableActions onView={() => setViewItem(conta)} onEdit={() => openEdit(conta)} onDelete={() => setDeleteId(conta.id)} /></TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">{(page-1)*20+1}–{Math.min(page*20,total)} de {total} registros</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => goToPage(page-1)} disabled={!hasPrev}>Anterior</Button>
                <Button variant="outline" size="sm" onClick={() => goToPage(page+1)} disabled={!hasNext}>Próxima</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes - Conta a Receber</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2">{Object.entries({ Lançamento: viewItem.data_de_lancamento, Faturamento: viewItem.data_de_faturamento, Cliente: viewItem.cliente_nome, Documento: viewItem.documento, "Valor Título": viewItem.valor_do_titulo, "Valor Total": viewItem.valor_total, "Próx. Vencimento": viewItem.data_de_vencimento, Status: viewItem.status }).map(([k, v]) => (<div key={k} className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{k}</span><span className="text-sm font-medium">{String(v || "—")}</span></div>))}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Conta a Receber</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Cliente (ID)</Label><Input type="number" value={editData.cliente || ""} onChange={e => setEditData({ ...editData, cliente: parseInt(e.target.value) })} /></div>
            <div><Label>Documento</Label><Input value={editData.documento || ""} onChange={e => setEditData({ ...editData, documento: e.target.value })} /></div>
            <div><Label>Valor Título</Label><Input type="number" step="0.01" value={editData.valor_do_titulo || ""} onChange={e => setEditData({ ...editData, valor_do_titulo: parseFloat(e.target.value) })} /></div>
            <div><Label>Valor Total</Label><Input type="number" step="0.01" value={editData.valor_total || ""} onChange={e => setEditData({ ...editData, valor_total: parseFloat(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir conta?</AlertDialogTitle><AlertDialogDescription>Deseja excluir a conta de "{deleteItemData?.cliente}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Excluindo..." : "Excluir"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ContasReceber
