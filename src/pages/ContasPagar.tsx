import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNavigate } from "react-router-dom"
import { FilterSection } from "@/components/FilterSection"
import { SortableHead } from "@/components/SortableHead"
import { Plus, FileText, CreditCard, Receipt, Wallet, ChevronDown, ChevronRight, DollarSign } from "lucide-react"
import { TableActions } from "@/components/TableActions"
import { GradientCard } from "@/components/financeiro/GradientCard"
import { StatusBadge } from "@/components/StatusBadge"
import { ExportButton } from "@/components/ExportButton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  fetchContasPagar, updateContaPagar, deleteContaPagar,
  type ContaPagar as Conta, type ParcelaReceber,
  fetchContasPagarEstatisticas, contasPagarQueryKey,
  fetchContasBancarias, contasBancariasQueryKey,
  updateParcelaReceber,
} from "@/services/financeiro"
import { useSortable } from "@/hooks/useSortable"
import { useRealtimeUpdates } from "@/hooks/useRealtimeUpdates"

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
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const [pagamentoModal, setPagamentoModal] = useState<{ parcela: ParcelaReceber; contaId: number } | null>(null)
  const [pagamentoForm, setPagamentoForm] = useState({ valor_pago: "", data_de_pagamento: "", forma_de_pagamento: "", conta_bancaria: "" })

  useRealtimeUpdates([[...contasPagarQueryKey]]);

  const [page, setPage] = useState(1);
  useEffect(() => { setPage(1); }, [filterBeneficiario, filterDocumento, filterDataInicio, filterDataFim]);

  const { data: response, isLoading } = useQuery({
    queryKey: [...contasPagarQueryKey, page],
    queryFn: () => fetchContasPagar(page),
  });
  const items = response?.results ?? [];
  const serverTotal = response?.count ?? 0;

  const { data: contasBancarias = [] } = useQuery({
    queryKey: [...contasBancariasQueryKey],
    queryFn: fetchContasBancarias,
  });

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Conta> }) => updateContaPagar(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasPagarQueryKey });
      setEditItem(null);
      toast({ title: "Salvo", description: "Conta atualizada com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContaPagar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasPagarQueryKey });
      setDeleteId(null);
      toast({ title: "Removida", description: "Conta excluída com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" }),
  });

  const pagamentoMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ParcelaReceber> }) => updateParcelaReceber(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasPagarQueryKey });
      queryClient.invalidateQueries({ queryKey: ["financeiro_estatisticas"] });
      queryClient.invalidateQueries({ queryKey: contasBancariasQueryKey });
      setPagamentoModal(null);
      toast({ title: "Pago", description: "Parcela marcada como paga." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao registrar pagamento.", variant: "destructive" }),
  });

  const filtered = useMemo(() => {
    return items.filter((conta: Conta) => {
      const matchBeneficiario = (conta.fornecedor_nome || "").toLowerCase().includes(filterBeneficiario.toLowerCase())
      const matchDocumento = (conta.numero_documento || conta.documento || "").toLowerCase().includes(filterDocumento.toLowerCase())
      const matchDataInicio = filterDataInicio ? (conta.data_de_faturamento || "") >= filterDataInicio : true
      const matchDataFim = filterDataFim ? (conta.data_de_faturamento || "") <= filterDataFim : true
      return matchBeneficiario && matchDocumento && matchDataInicio && matchDataFim
    })
  }, [items, filterBeneficiario, filterDocumento, filterDataInicio, filterDataFim])

  const { sorted, sortKey, sortDir, toggleSort } = useSortable(filtered)
  const paginatedItems = sorted;
  const total = serverTotal;
  const totalPages = Math.max(1, Math.ceil(serverTotal / 20));
  const hasNext = page < totalPages;
  const hasPrev = page > 1;
  const goToPage = (p: number) => setPage(Math.max(1, Math.min(p, totalPages)));

  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openPagamento = (parcela: ParcelaReceber, contaId: number) => {
    setPagamentoModal({ parcela, contaId });
    setPagamentoForm({
      valor_pago: String(parcela.valor ?? ""),
      data_de_pagamento: new Date().toISOString().slice(0, 10),
      forma_de_pagamento: "",
      conta_bancaria: "",
    });
  };

  const handlePagamento = () => {
    if (!pagamentoModal) return;
    if (!pagamentoForm.forma_de_pagamento) {
      toast({ title: "Atenção", description: "Selecione a forma de pagamento.", variant: "destructive" }); return;
    }
    if (!pagamentoForm.conta_bancaria) {
      toast({ title: "Atenção", description: "Selecione a conta bancária.", variant: "destructive" }); return;
    }
    pagamentoMutation.mutate({
      id: pagamentoModal.parcela.id,
      data: {
        status: "Pago",
        valor_pago: parseFloat(pagamentoForm.valor_pago) || pagamentoModal.parcela.valor,
        data_de_pagamento: pagamentoForm.data_de_pagamento,
        forma_de_pagamento: pagamentoForm.forma_de_pagamento,
        conta_bancaria: parseInt(pagamentoForm.conta_bancaria),
      },
    });
  };

  const getExportData = () => filtered.map((c: Conta) => ({ Lançamento: c.data_de_lancamento, Faturamento: c.data_de_faturamento, Beneficiário: c.fornecedor_nome, Documento: c.numero_documento || c.documento, Título: c.valor_do_titulo, Total: c.valor_total, Vencimento: c.data_de_vencimento, Status: c.status }));
  const handleDelete = () => { if (deleteId !== null) { deleteMutation.mutate(deleteId); } };
  const openEdit = (c: Conta) => { setEditItem(c); setEditData({ ...c }); };
  const handleSaveEdit = () => { if (editItem) { updateMutation.mutate({ id: editItem.id, payload: editData }); } };
  const deleteItemData = items.find((i: Conta) => i.id === deleteId);

  const { data: stats } = useQuery({
    queryKey: ["contas_pagar_estatisticas"],
    queryFn: fetchContasPagarEstatisticas,
  });

  const ParcelasTable = ({ conta }: { conta: Conta }) => (
    <div className="rounded border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs h-8 w-10">Nº</TableHead>
            <TableHead className="text-center text-xs h-8">Vencimento</TableHead>
            <TableHead className="text-right text-xs h-8">Valor</TableHead>
            <TableHead className="text-xs h-8">Pago</TableHead>
            <TableHead className="text-center text-xs h-8">Status</TableHead>
            {conta.status !== 'Pago' && <TableHead className="w-16 h-8" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {(conta.parcelas || []).map(p => (
            <TableRow key={p.id} className="text-xs hover:bg-muted/30">
              <TableCell className="py-2 font-medium">{p.numero}</TableCell>
              <TableCell className="text-center py-2">{p.data_de_vencimento || "—"}</TableCell>
              <TableCell className="py-2">{formatBRL(p.valor)}</TableCell>
              <TableCell className="py-2">{p.valor_pago != null ? formatBRL(p.valor_pago) : "—"}</TableCell>
              <TableCell className="text-center py-2"><StatusBadge status={p.status} /></TableCell>
              {conta.status !== 'Pago' && (
                <TableCell className="py-2">
                  {p.status !== 'Pago' ? (
                    <button onClick={() => openPagamento(p, conta.id)} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      <DollarSign className="w-3 h-3" />Pagar
                    </button>
                  ) : null}
                </TableCell>
              )}
            </TableRow>
          ))}
          {(conta.parcelas || []).length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-xs py-3 text-muted-foreground">Nenhuma parcela.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GradientCard title="Total Pago" value={formatBRL(stats?.total_pago)} icon={CreditCard} variant="danger" />
          <GradientCard title="Total a Pagar" value={formatBRL(stats?.total_a_pagar)} icon={Receipt} variant="warning" />
          <GradientCard title="Total a Pagar Projetado" value={formatBRL(stats?.total_projetado)} icon={Wallet} variant="orange" />
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
          resultsCount={filtered.length}
        />

        <div className="rounded border border-border overflow-hidden">
          <Table className="table-fixed w-full">
            <colgroup>
              <col className="w-8" />
              <col className="w-[90px]" />
              <col className="w-[90px]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
              <col className="w-[100px]" />
              <col className="w-[100px]" />
              <col className="w-[90px]" />
              <col className="w-[110px]" />
              <col className="w-[72px]" />
            </colgroup>
            <TableHeader><TableRow className="bg-table-header">
              <TableHead />
              <SortableHead label="Lançamento" field="data_de_lancamento" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Faturamento" field="data_de_faturamento" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Beneficiário" field="fornecedor_nome" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Documento" field="numero_documento" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Título" field="valor_do_titulo" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Total" field="valor_total" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Vencimento" field="data_de_vencimento" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <SortableHead label="Status" field="status" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
              <TableHead className="text-center font-semibold">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : paginatedItems.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Nenhuma conta encontrada.</TableCell></TableRow>
              ) : (
                paginatedItems.map((conta: Conta) => (
                  <React.Fragment key={conta.id}>
                    <TableRow className="hover:bg-table-hover transition-colors">
                      <TableCell className="p-0 pl-2">
                        <button onClick={() => toggleExpand(conta.id)} className="p-1 rounded hover:bg-muted transition-colors">
                          {expandedIds.has(conta.id)
                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">{conta.data_de_lancamento || "—"}</TableCell>
                      <TableCell className="text-center">{conta.data_de_faturamento || "—"}</TableCell>
                      <TableCell >{conta.fornecedor_nome || "—"}</TableCell>
                      <TableCell >
                        <span className="block truncate max-w-full" title={conta.numero_documento || ""}>
                          {conta.numero_documento || conta.documento || "—"}
                        </span>
                      </TableCell>
                      <TableCell >{formatBRL(conta.valor_do_titulo)}</TableCell>
                      <TableCell >{formatBRL(conta.valor_total)}</TableCell>
                      <TableCell className="text-center">{conta.data_de_vencimento || "—"}</TableCell>
                      <TableCell className="text-center"><StatusBadge status={conta.status || "Em Aberto"} /></TableCell>
                      <TableCell className="text-center"><TableActions onView={() => setViewItem(conta)} onEdit={() => openEdit(conta)} onDelete={() => setDeleteId(conta.id)} /></TableCell>
                    </TableRow>
                    {expandedIds.has(conta.id) && (
                      <TableRow className="bg-muted/30">
                        <TableCell colSpan={10} className="px-6 py-3">
                          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            Parcelas — {(conta.parcelas || []).filter(p => p.status === 'Pago').length}/{(conta.parcelas || []).length} pagas
                          </p>
                          <ParcelasTable conta={conta} />
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
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

      {/* View Modal */}
      <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0">
          {viewItem && (
            <>
              <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                <div className="min-w-0">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold truncate">{viewItem.fornecedor_nome || "—"}</DialogTitle>
                  </DialogHeader>
                  <p className="text-xs text-muted-foreground mt-1">Nº Documento: {viewItem.numero_documento || viewItem.documento || "—"}</p>
                </div>
                <StatusBadge status={viewItem.status || "Em Aberto"} />
              </div>

              <Separator />

              <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
                <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Datas</p>
                    {[["Lançamento", viewItem.data_de_lancamento], ["Faturamento", viewItem.data_de_faturamento], ["Vencimento", viewItem.data_de_vencimento]].map(([l, v]) => (
                      <div key={l} className="flex justify-between items-baseline py-1.5 border-b border-border/50 last:border-0">
                        <span className="text-xs text-muted-foreground">{l}</span>
                        <span className="text-xs font-medium">{v || "—"}</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Valores</p>
                    <div className="flex justify-between items-baseline py-1.5 border-b border-border/50">
                      <span className="text-xs text-muted-foreground">Valor Título</span>
                      <span className="text-xs font-medium">{formatBRL(viewItem.valor_do_titulo)}</span>
                    </div>
                    <div className="flex justify-between items-baseline py-1.5">
                      <span className="text-xs text-muted-foreground">Valor Total</span>
                      <span className="text-sm font-semibold text-primary">{formatBRL(viewItem.valor_total)}</span>
                    </div>
                  </div>
                </div>

                {(viewItem.parcelas ?? []).length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Parcelas</p>
                        <span className="text-xs text-muted-foreground">
                          {(viewItem.parcelas ?? []).filter(p => p.status === 'Pago').length} / {viewItem.parcelas?.length} pagas
                        </span>
                      </div>
                      <ParcelasTable conta={viewItem} />
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent><DialogHeader><DialogTitle>Editar Conta a Pagar</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Beneficiário (ID)</Label><Input type="number" value={editData.beneficiario || ""} onChange={e => setEditData({ ...editData, beneficiario: parseInt(e.target.value) })} /></div>
            <div><Label>Documento</Label><Input value={editData.numero_documento || ""} onChange={e => setEditData({ ...editData, numero_documento: e.target.value })} /></div>
            <div><Label>Valor Título</Label><Input type="number" step="0.01" value={editData.valor_do_titulo || ""} onChange={e => setEditData({ ...editData, valor_do_titulo: parseFloat(e.target.value) })} /></div>
            <div><Label>Valor Total</Label><Input type="number" step="0.01" value={editData.valor_total || ""} onChange={e => setEditData({ ...editData, valor_total: parseFloat(e.target.value) })} /></div>
          </div>
          <DialogFooter><Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Salvando..." : "Salvar"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Excluir conta?</AlertDialogTitle><AlertDialogDescription>Deseja excluir a conta de "{deleteItemData?.beneficiario}"? Esta ação não pode ser desfeita.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={deleteMutation.isPending}>{deleteMutation.isPending ? "Excluindo..." : "Excluir"}</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Modal */}
      <Dialog open={!!pagamentoModal} onOpenChange={() => setPagamentoModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Pagamento — Parcela {pagamentoModal?.parcela.numero}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Valor Pago</Label>
              <Input type="number" step="0.01" value={pagamentoForm.valor_pago} onChange={e => setPagamentoForm(f => ({ ...f, valor_pago: e.target.value }))} />
            </div>
            <div>
              <Label>Data de Pagamento</Label>
              <Input type="date" value={pagamentoForm.data_de_pagamento} onChange={e => setPagamentoForm(f => ({ ...f, data_de_pagamento: e.target.value }))} />
            </div>
            <div>
              <Label>Forma de Pagamento <span className="text-destructive">*</span></Label>
              <Select value={pagamentoForm.forma_de_pagamento} onValueChange={v => setPagamentoForm(f => ({ ...f, forma_de_pagamento: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                <SelectContent>
                  {["Dinheiro", "Débito", "Cartão de Crédito", "Cartão de Débito", "Boleto", "PIX", "TED", "DOC", "Cheque"].map(op => (
                    <SelectItem key={op} value={op}>{op}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conta Bancária <span className="text-destructive">*</span></Label>
              <Select value={pagamentoForm.conta_bancaria} onValueChange={v => setPagamentoForm(f => ({ ...f, conta_bancaria: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecionar conta..." /></SelectTrigger>
                <SelectContent>
                  {(Array.isArray(contasBancarias) ? contasBancarias : (contasBancarias as any).results || []).map((cb: any) => (
                    <SelectItem key={cb.id} value={String(cb.id)}>{cb.banco} — {cb.agencia}/{cb.conta}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPagamentoModal(null)}>Cancelar</Button>
            <Button onClick={handlePagamento} disabled={pagamentoMutation.isPending}>
              {pagamentoMutation.isPending ? "Salvando..." : "Confirmar Pagamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default ContasPagar
