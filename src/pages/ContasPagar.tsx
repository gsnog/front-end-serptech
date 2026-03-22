import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNavigate } from "react-router-dom"
import { useState, useMemo } from "react"
import { FilterSection } from "@/components/FilterSection"
import { Plus, FileText, CreditCard, Receipt, Wallet } from "lucide-react"
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
import { fetchContasPagar, updateContaPagar, deleteContaPagar, type ContaPagar as Conta, fetchEstatisticasFinanceiras } from "@/services/financeiro"

const ContasPagar = () => {
  const formatBRL = (value?: number | null) =>
    value != null
      ? Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
      : '—';
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [filterBeneficiario, setFilterBeneficiario] = useState("")
  const [filterDocumento, setFilterDocumento] = useState("")
  const [filterDataInicio, setFilterDataInicio] = useState("")
  const [filterDataFim, setFilterDataFim] = useState("")

  const [viewItem, setViewItem] = useState<Conta | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [editItem, setEditItem] = useState<Conta | null>(null)
  const [editData, setEditData] = useState<Partial<Conta>>({})

  const [currentPage, setCurrentPage] = useState(1);
  const { data: response, isLoading } = useQuery({
    queryKey: ['contas_pagar', currentPage],
    queryFn: () => fetchContasPagar(currentPage),
  });
  const items = Array.isArray(response) ? response : (response?.results ?? []);
  const totalCount = Array.isArray(response) ? response.length : (response?.count ?? 0);
  const totalPages = Math.ceil(totalCount / 5);

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Conta> }) => updateContaPagar(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });
      setEditItem(null);
      toast({ title: "Salvo", description: "Conta atualizada com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContaPagar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });
      setDeleteId(null);
      toast({ title: "Removida", description: "Conta excluída com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return items.filter((conta: Conta) => {
      const matchBeneficiario = (conta.fornecedor_nome || "").toLowerCase().includes(filterBeneficiario.toLowerCase())
      const matchDocumento = (conta.documento || "").toLowerCase().includes(filterDocumento.toLowerCase())
      const matchDataInicio = filterDataInicio ? (conta.data_de_faturamento || "") >= filterDataInicio : true
      const matchDataFim = filterDataFim ? (conta.data_de_faturamento || "") <= filterDataFim : true
      return matchBeneficiario && matchDocumento && matchDataInicio && matchDataFim
    })
  }, [items, filterBeneficiario, filterDocumento, filterDataInicio, filterDataFim])

  const getExportData = () => filtered.map((c: Conta) => ({ Lançamento: c.data_de_lancamento, Faturamento: c.data_de_faturamento, Beneficiário: c.fornecedor_nome, Documento: c.documento, Título: c.valor_do_titulo, Total: c.valor_total, Vencimento: c.data_de_vencimento, Status: c.status }));
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
          <GradientCard title="Total Pago" value={formatBRL(stats?.saidas)} icon={CreditCard} variant="danger" />
          <GradientCard title="Total a Pagar" value={formatBRL(stats?.entradas)} icon={Receipt} variant="warning" />
          <GradientCard title="Saldo Atual" value={formatBRL(stats?.saldo)} icon={Wallet} variant="orange" />
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <Button onClick={() => navigate("/financeiro/contas-pagar/nova")} className="gap-2"><Plus className="w-4 h-4" />Adicionar Conta</Button>
          <Button onClick={() => navigate("/financeiro/contas-pagar/relatorio")} variant="outline" className="gap-2 border-border"><FileText className="w-4 h-4" />Relatório</Button>
          <ExportButton getData={getExportData} fileName="contas-pagar" />
        </div>

        <FilterSection
          fields={[
            { type: "text", label: "Beneficiário", placeholder: "Buscar beneficiário...", value: filterBeneficiario, onChange: setFilterBeneficiario, width: "flex-1 min-w-[180px]" },
            { type: "text", label: "Documento", placeholder: "Número do documento...", value: filterDocumento, onChange: setFilterDocumento, width: "min-w-[160px]" },
            { type: "date", label: "Data Início", value: filterDataInicio, onChange: setFilterDataInicio, width: "min-w-[160px]" },
            { type: "date", label: "Data Fim", value: filterDataFim, onChange: setFilterDataFim, width: "min-w-[160px]" }
          ]}
          resultsCount={totalCount}
        />

        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-center">Lançamento</TableHead><TableHead className="text-center">Faturamento</TableHead><TableHead className="text-center">Beneficiário</TableHead><TableHead className="text-center">Documento</TableHead><TableHead className="text-center">Título</TableHead><TableHead className="text-center">Total</TableHead><TableHead className="text-center">Vencimento</TableHead><TableHead className="text-center">Status</TableHead><TableHead className="text-center">Ações</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada.</TableCell></TableRow>
            ) : (
              filtered.map((conta: Conta) => (
                <TableRow key={conta.id}>
                  <TableCell className="text-center">{conta.data_de_lancamento || "—"}</TableCell>
                  <TableCell className="text-center">{conta.data_de_faturamento || "—"}</TableCell>
                  <TableCell className="text-center">{conta.fornecedor_nome || "—"}</TableCell>
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
            <span className="text-sm text-muted-foreground">Página {currentPage} de {totalPages} ({totalCount} registros)</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Anterior</Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Detalhes - Conta a Pagar</DialogTitle></DialogHeader>
          {viewItem && <div className="space-y-2">{Object.entries({ Lançamento: viewItem.data_de_lancamento, Faturamento: viewItem.data_de_faturamento, Beneficiário: viewItem.fornecedor_nome, Documento: viewItem.documento, "Valor Título": viewItem.valor_do_titulo, "Valor Total": viewItem.valor_total, "Próx. Vencimento": viewItem.data_de_vencimento, Status: viewItem.status }).map(([k, v]) => (<div key={k} className="flex justify-between py-1 border-b border-border last:border-0"><span className="text-sm text-muted-foreground">{k}</span><span className="text-sm font-medium">{String(v || "—")}</span></div>))}</div>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Conta a Pagar</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Beneficiário (ID)</Label><Input type="number" value={editData.beneficiario || ""} onChange={e => setEditData({ ...editData, beneficiario: parseInt(e.target.value) })} /></div>
            <div><Label>Documento</Label><Input value={editData.documento || ""} onChange={e => setEditData({ ...editData, documento: e.target.value })} /></div>
            <div><Label>Valor Título</Label><Input type="number" step="0.01" value={editData.valor_do_titulo || ""} onChange={e => setEditData({ ...editData, valor_do_titulo: parseFloat(e.target.value) })} /></div>
            <div><Label>Valor Total</Label><Input type="number" step="0.01" value={editData.valor_total || ""} onChange={e => setEditData({ ...editData, valor_total: parseFloat(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir conta?</AlertDialogTitle><AlertDialogDescription>Deseja excluir a conta de "{deleteItemData?.beneficiario}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Excluindo..." : "Excluir"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default ContasPagar
