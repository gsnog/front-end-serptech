import React, { useState, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useNavigate } from "react-router-dom"
import { FilterSection } from "@/components/FilterSection"
import { SortableHead } from "@/components/SortableHead"
import { Plus, FileText, CreditCard, Receipt, Wallet, ChevronDown, ChevronRight, DollarSign, Paperclip, ExternalLink, AlertTriangle, ClipboardEdit, AlertCircle } from "lucide-react"
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
  fetchContasPagar, updateContaPagar, deleteContaPagar, patchContaPagar,
  fetchContasPagarPendentes, fetchCentrosCusto, fetchPlanoContas,
  type ContaPagar as Conta, type ParcelaReceber,
  fetchContasPagarEstatisticas, contasPagarQueryKey,
  fetchContasBancarias, contasBancariasQueryKey,
  updateParcelaReceber, uploadComprovante,
  centrosCustoQueryKey, planoContasQueryKey,
  reparcelarContaPagar,
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
  const [comprovanteFile, setComprovanteFile] = useState<File | null>(null)

  const [pendentesExpanded, setPendentesExpanded] = useState(true)
  const [classificarItem, setClassificarItem] = useState<Conta | null>(null)
  const [classificarForm, setClassificarForm] = useState({ centro_de_custo: "", plano_de_contas: "", data_de_faturamento: "", data_de_vencimento: "" })

  interface ParcelaEditRow { numero: number; data_de_vencimento: string; valor: string; }
  const [parcelasEdit, setParcelasEdit] = useState<ParcelaEditRow[]>([])
  const [showReparcelar, setShowReparcelar] = useState(false)

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

  const { data: pendentesResponse } = useQuery({
    queryKey: [...contasPagarQueryKey, 'pendentes'],
    queryFn: fetchContasPagarPendentes,
  });
  const pendentes: Conta[] = pendentesResponse?.results ?? (Array.isArray(pendentesResponse) ? pendentesResponse as Conta[] : []);
  const pendentesCount = pendentesResponse?.count ?? pendentes.length;

  const { data: centrosCustoRaw } = useQuery({ queryKey: centrosCustoQueryKey, queryFn: fetchCentrosCusto });
  const centrosCusto = Array.isArray(centrosCustoRaw) ? centrosCustoRaw : (centrosCustoRaw as any)?.results ?? [];

  const { data: planoContasRaw } = useQuery({ queryKey: planoContasQueryKey, queryFn: fetchPlanoContas });
  const planoContas = Array.isArray(planoContasRaw) ? planoContasRaw : (planoContasRaw as any)?.results ?? [];

  const [classificarSaving, setClassificarSaving] = useState(false);

  const openClassificar = (c: Conta) => {
    setClassificarItem(c);
    setClassificarForm({
      centro_de_custo: c.centro_de_custo ? String(c.centro_de_custo) : "",
      plano_de_contas: c.plano_de_contas ? String(c.plano_de_contas) : "",
      data_de_faturamento: c.data_de_faturamento || "",
      data_de_vencimento: c.data_de_vencimento ? c.data_de_vencimento.slice(0, 10) : "",
    });
    setShowReparcelar(false);
    const existentes = (c.parcelas ?? [])
      .filter(p => p.status !== 'Pago' && p.status !== 'Adiantamento')
      .map(p => ({ numero: p.numero, data_de_vencimento: p.data_de_vencimento ?? "", valor: String(p.valor) }));
    setParcelasEdit(existentes.length > 0 ? existentes : [{ numero: 1, data_de_vencimento: c.data_de_vencimento?.slice(0, 10) ?? "", valor: String(c.valor_total ?? "") }]);
  };

  const handleClassificar = async () => {
    if (!classificarItem) return;
    if (!classificarForm.centro_de_custo || !classificarForm.plano_de_contas) {
      toast({ title: "Atenção", description: "Centro de custo e plano de contas são obrigatórios.", variant: "destructive" }); return;
    }
    if (showReparcelar) {
      const soma = parcelasEdit.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
      const total = parseFloat(String(classificarItem.valor_total || "0")) || 0;
      if (total > 0 && Math.abs(soma - total) > 0.01) {
        toast({ title: "A soma das parcelas deve ser igual ao valor total.", variant: "destructive" }); return;
      }
    }
    setClassificarSaving(true);
    try {
      await patchContaPagar(classificarItem.id, {
        centro_de_custo: parseInt(classificarForm.centro_de_custo),
        plano_de_contas: parseInt(classificarForm.plano_de_contas),
        ...(classificarForm.data_de_faturamento && { data_de_faturamento: classificarForm.data_de_faturamento }),
        ...(classificarForm.data_de_vencimento && { data_de_vencimento: classificarForm.data_de_vencimento }),
      });
      if (showReparcelar) {
        await reparcelarContaPagar(classificarItem.id, parcelasEdit.map(p => ({
          numero: p.numero,
          data_de_vencimento: p.data_de_vencimento || null,
          valor: parseFloat(p.valor) || 0,
        })));
      }
      queryClient.invalidateQueries({ queryKey: contasPagarQueryKey });
      setClassificarItem(null);
      setShowReparcelar(false);
      toast({ title: "Salvo", description: "Conta classificada com sucesso." });
    } catch {
      toast({ title: "Erro", description: "Falha ao salvar.", variant: "destructive" });
    } finally {
      setClassificarSaving(false);
    }
  };

  const addMonthsEdit = (dateStr: string, months: number): string => {
    if (!dateStr) return "";
    const d = new Date(dateStr + "T00:00:00");
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
  };

  const updateMutation = useMutation({
    mutationFn: (data: { id: number; payload: Partial<Conta> }) => updateContaPagar(data.id, data.payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasPagarQueryKey });
      setEditItem(null);
      toast({ title: "Salvo", description: "Conta atualizada com sucesso." });
    },
    onError: () => toast({ title: "Erro", description: "Falha ao atualizar.", variant: "destructive" }),
  });

  const reparcelarMutation = useMutation({
    mutationFn: (data: { id: number; parcelas: { numero: number; data_de_vencimento: string | null; valor: number }[] }) =>
      reparcelarContaPagar(data.id, data.parcelas),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasPagarQueryKey });
      setEditItem(null);
      setShowReparcelar(false);
      toast({ title: "Parcelas atualizadas com sucesso." });
    },
    onError: (err: any) => toast({ title: "Erro", description: err?.response?.data?.detail ?? "Falha ao reparcelar.", variant: "destructive" }),
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
    mutationFn: async ({ id, data, file }: { id: number; data: Partial<ParcelaReceber>; file: File | null }) => {
      await updateParcelaReceber(id, data);
      if (file) await uploadComprovante(id, file);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasPagarQueryKey });
      queryClient.invalidateQueries({ queryKey: ["financeiro_estatisticas"] });
      queryClient.invalidateQueries({ queryKey: contasBancariasQueryKey });
      setPagamentoModal(null);
      setComprovanteFile(null);
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
    setComprovanteFile(null);
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
      file: comprovanteFile,
    });
  };

  const getExportData = () => filtered.map((c: Conta) => ({ Lançamento: c.data_de_lancamento, Faturamento: c.data_de_faturamento, Beneficiário: c.fornecedor_nome, Documento: c.numero_documento || c.documento, Título: c.valor_do_titulo, Total: c.valor_total, Vencimento: c.data_de_vencimento, Status: c.status }));
  const handleDelete = () => { if (deleteId !== null) { deleteMutation.mutate(deleteId); } };
  const openEdit = (c: Conta) => {
    setEditItem(c);
    setEditData({ ...c });
    setShowReparcelar(false);
    const existentes = (c.parcelas ?? [])
      .filter(p => p.status !== 'Pago' && p.status !== 'Adiantamento')
      .map(p => ({ numero: p.numero, data_de_vencimento: p.data_de_vencimento ?? "", valor: String(p.valor) }));
    setParcelasEdit(existentes.length > 0 ? existentes : [{ numero: 1, data_de_vencimento: c.data_de_vencimento?.slice(0, 10) ?? "", valor: String(c.valor_total ?? "") }]);
  };
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
            <TableHead className="text-center text-xs h-8">Comprovante</TableHead>
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
              <TableCell className="text-center py-2">
                {p.comprovante ? (
                  <a href={p.comprovante} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                    <ExternalLink className="w-3 h-3" />Ver
                  </a>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </TableCell>
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
            <TableRow><TableCell colSpan={7} className="text-center text-xs py-3 text-muted-foreground">Nenhuma parcela.</TableCell></TableRow>
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

        {pendentesCount > 0 && (
          <div className="rounded-lg border border-warning/50 bg-warning/5">
            <button
              className="flex items-center justify-between w-full px-4 py-3 text-left"
              onClick={() => setPendentesExpanded(v => !v)}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                <span className="text-sm font-semibold text-warning">
                  {pendentesCount} {pendentesCount === 1 ? 'conta pendente' : 'contas pendentes'} de classificação
                </span>
                <span className="text-xs text-muted-foreground">— centro de custo ou plano de contas não preenchidos</span>
              </div>
              {pendentesExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
            {pendentesExpanded && (
              <div className="px-4 pb-4">
                <div className="rounded border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs h-8">Beneficiário</TableHead>
                        <TableHead className="text-xs h-8">Documento</TableHead>
                        <TableHead className="text-xs h-8">Lançamento</TableHead>
                        <TableHead className="text-right text-xs h-8">Valor Total</TableHead>
                        <TableHead className="text-center text-xs h-8">Centro Custo</TableHead>
                        <TableHead className="text-center text-xs h-8">Plano Contas</TableHead>
                        <TableHead className="w-24 h-8" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendentes.map((c: Conta) => (
                        <TableRow key={c.id} className="text-xs hover:bg-muted/30">
                          <TableCell className="py-2 font-medium">{c.fornecedor_nome || "—"}</TableCell>
                          <TableCell className="py-2">{c.numero_documento || c.documento || "—"}</TableCell>
                          <TableCell className="py-2">{c.data_de_lancamento || "—"}</TableCell>
                          <TableCell className="py-2 text-right">{formatBRL(c.valor_total)}</TableCell>
                          <TableCell className="py-2 text-center">
                            {c.centro_de_custo_detalhe ? (
                              <span className="text-xs">{c.centro_de_custo_detalhe.centro_id}</span>
                            ) : (
                              <span className="text-destructive text-xs">Faltando</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            {c.plano_de_contas_detalhe ? (
                              <span className="text-xs">{c.plano_de_contas_detalhe.id_plano}</span>
                            ) : (
                              <span className="text-destructive text-xs">Faltando</span>
                            )}
                          </TableCell>
                          <TableCell className="py-2 text-center">
                            <button
                              onClick={() => openClassificar(c)}
                              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-warning/10 text-warning hover:bg-warning/20 border border-warning/30 transition-colors"
                            >
                              <ClipboardEdit className="w-3 h-3" />Classificar
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
        )}

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

                {(viewItem.centro_de_custo_detalhe || viewItem.plano_de_contas_detalhe) && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Classificação</p>
                      {viewItem.centro_de_custo_detalhe && (
                        <div className="flex justify-between items-baseline py-1.5 border-b border-border/50">
                          <span className="text-xs text-muted-foreground">Centro de Custo</span>
                          <span className="text-xs font-medium text-right">
                            {viewItem.centro_de_custo_detalhe.centro_id}
                            {viewItem.centro_de_custo_detalhe.setor_nome ? ` — ${viewItem.centro_de_custo_detalhe.setor_nome}` : ""}
                          </span>
                        </div>
                      )}
                      {viewItem.plano_de_contas_detalhe && (
                        <div className="flex justify-between items-baseline py-1.5">
                          <span className="text-xs text-muted-foreground">Plano de Contas</span>
                          <span className="text-xs font-medium text-right">
                            {viewItem.plano_de_contas_detalhe.id_plano}
                            {viewItem.plano_de_contas_detalhe.classificacao_nome ? ` — ${viewItem.plano_de_contas_detalhe.classificacao_nome}` : ""}
                            {viewItem.plano_de_contas_detalhe.categoria_nome ? ` / ${viewItem.plano_de_contas_detalhe.categoria_nome}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}

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
      <Dialog open={!!editItem} onOpenChange={() => { setEditItem(null); setShowReparcelar(false); }}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader><DialogTitle>Editar Conta a Pagar</DialogTitle></DialogHeader>
          </div>
          <Separator />
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Documento</Label><Input value={editData.numero_documento || ""} onChange={e => setEditData({ ...editData, numero_documento: e.target.value })} /></div>
              <div><Label>Valor Título</Label><Input type="number" step="0.01" value={editData.valor_do_titulo || ""} onChange={e => setEditData({ ...editData, valor_do_titulo: parseFloat(e.target.value) })} /></div>
              <div><Label>Valor Total</Label><Input type="number" step="0.01" value={editData.valor_total || ""} onChange={e => setEditData({ ...editData, valor_total: parseFloat(e.target.value) })} /></div>
              <div><Label>Vencimento</Label><Input type="date" value={editData.data_de_vencimento?.slice(0, 10) || ""} onChange={e => setEditData({ ...editData, data_de_vencimento: e.target.value })} /></div>
            </div>

            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Parcelas</p>
                <button
                  className="text-xs text-primary underline"
                  onClick={() => setShowReparcelar(v => !v)}
                >
                  {showReparcelar ? "Cancelar edição de parcelas" : "Editar parcelas"}
                </button>
              </div>

              {!showReparcelar && editItem && (
                <div className="rounded border border-border overflow-hidden text-xs">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50">
                      <TableHead className="h-7 text-xs">Nº</TableHead>
                      <TableHead className="h-7 text-xs text-center">Vencimento</TableHead>
                      <TableHead className="h-7 text-xs text-right">Valor</TableHead>
                      <TableHead className="h-7 text-xs text-center">Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(editItem.parcelas ?? []).length === 0
                        ? <TableRow><TableCell colSpan={4} className="text-center py-3 text-muted-foreground">Sem parcelas.</TableCell></TableRow>
                        : (editItem.parcelas ?? []).map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="py-1.5">{p.numero}</TableCell>
                            <TableCell className="py-1.5 text-center">{p.data_de_vencimento || "—"}</TableCell>
                            <TableCell className="py-1.5 text-right">{formatBRL(p.valor)}</TableCell>
                            <TableCell className="py-1.5 text-center"><StatusBadge status={p.status} /></TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </div>
              )}

              {showReparcelar && (
                <div className="space-y-3 p-3 border border-border rounded bg-muted/20">
                  <p className="text-xs text-muted-foreground">Parcelas pagas são mantidas. Apenas as pendentes serão substituídas.</p>
                  <div className="flex gap-2 items-center">
                    <Label className="text-xs whitespace-nowrap">Nº de parcelas:</Label>
                    <Input
                      type="number" min="1" className="h-7 w-20 text-xs"
                      value={parcelasEdit.length}
                      onChange={e => {
                        const n = Math.max(1, parseInt(e.target.value) || 1);
                        const total = parseFloat(String(editData.valor_total || "0")) || 0;
                        const base = total > 0 ? Math.floor((total / n) * 100) / 100 : 0;
                        const remainder = total > 0 ? parseFloat((total - base * n).toFixed(2)) : 0;
                        const firstDate = parcelasEdit[0]?.data_de_vencimento || editData.data_de_vencimento?.slice(0, 10) || "";
                        setParcelasEdit(Array.from({ length: n }, (_, i) => ({
                          numero: i + 1,
                          data_de_vencimento: addMonthsEdit(firstDate, i),
                          valor: (i === n - 1 ? base + remainder : base).toFixed(2),
                        })));
                      }}
                    />
                  </div>
                  <div className="rounded border border-border overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                        <TableHead className="h-7 text-xs w-10">Nº</TableHead>
                        <TableHead className="h-7 text-xs text-center">Vencimento</TableHead>
                        <TableHead className="h-7 text-xs text-right">Valor (R$)</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {parcelasEdit.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="py-1 text-xs font-medium">{p.numero}</TableCell>
                            <TableCell className="py-1">
                              <Input type="date" value={p.data_de_vencimento} className="h-7 text-xs"
                                onChange={e => setParcelasEdit(prev => prev.map((r, j) => j === i ? { ...r, data_de_vencimento: e.target.value } : r))} />
                            </TableCell>
                            <TableCell className="py-1">
                              <Input type="number" step="0.01" value={p.valor} className="h-7 text-xs text-right"
                                onChange={e => setParcelasEdit(prev => prev.map((r, j) => j === i ? { ...r, valor: e.target.value } : r))} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {(() => {
                    const soma = parcelasEdit.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
                    const total = parseFloat(String(editData.valor_total || "0")) || 0;
                    const ok = total > 0 && Math.abs(soma - total) < 0.01;
                    return total > 0 ? (
                      <p className={`text-xs flex items-center gap-1 ${ok ? "text-green-600" : "text-destructive"}`}>
                        {!ok && <AlertCircle className="h-3 w-3" />}
                        Soma: R$ {soma.toFixed(2)} / Total: R$ {total.toFixed(2)}
                      </p>
                    ) : null;
                  })()}
                  <Button size="sm" className="mt-1"
                    disabled={reparcelarMutation.isPending}
                    onClick={() => {
                      if (!editItem) return;
                      const soma = parcelasEdit.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
                      const total = parseFloat(String(editData.valor_total || editItem.valor_total || "0")) || 0;
                      if (total > 0 && Math.abs(soma - total) > 0.01) {
                        toast({ title: "A soma das parcelas deve ser igual ao valor total.", variant: "destructive" }); return;
                      }
                      reparcelarMutation.mutate({
                        id: editItem.id,
                        parcelas: parcelasEdit.map(p => ({ numero: p.numero, data_de_vencimento: p.data_de_vencimento || null, valor: parseFloat(p.valor) || 0 })),
                      });
                    }}
                  >{reparcelarMutation.isPending ? "Salvando..." : "Salvar Parcelas"}</Button>
                </div>
              )}
            </div>
          </div>
          <Separator />
          <div className="px-6 py-4">
            <DialogFooter>
              <Button variant="outline" onClick={() => { setEditItem(null); setShowReparcelar(false); }}>Cancelar</Button>
              <Button onClick={handleSaveEdit} disabled={updateMutation.isPending}>{updateMutation.isPending ? "Salvando..." : "Salvar Dados"}</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Classificar Modal */}
      <Dialog open={!!classificarItem} onOpenChange={() => { setClassificarItem(null); setShowReparcelar(false); }}>
        <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col gap-0 p-0">
          <div className="px-6 pt-6 pb-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardEdit className="w-4 h-4" />Classificar Conta
              </DialogTitle>
            </DialogHeader>
          </div>
          <Separator />
          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {classificarItem && (
              <div className="space-y-1 p-3 rounded bg-muted/40 border border-border">
                <p className="text-sm font-medium">{classificarItem.fornecedor_nome || "—"}</p>
                <p className="text-xs text-muted-foreground">Doc: {classificarItem.numero_documento || classificarItem.documento || "—"} · {formatBRL(classificarItem.valor_total)}</p>
              </div>
            )}
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Centro de Custo <span className="text-destructive">*</span></Label>
                <Select value={classificarForm.centro_de_custo} onValueChange={v => setClassificarForm(f => ({ ...f, centro_de_custo: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {centrosCusto.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.centro_id}{c.setor_nome ? ` — ${c.setor_nome}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Plano de Contas <span className="text-destructive">*</span></Label>
                <Select value={classificarForm.plano_de_contas} onValueChange={v => setClassificarForm(f => ({ ...f, plano_de_contas: v }))}>
                  <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
                  <SelectContent>
                    {planoContas.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.id_plano}{p.classificacao_nome ? ` — ${p.classificacao_nome}` : ""}{p.categoria_nome ? ` / ${p.categoria_nome}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Data Faturamento</Label>
                  <Input type="date" value={classificarForm.data_de_faturamento} onChange={e => setClassificarForm(f => ({ ...f, data_de_faturamento: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Data Vencimento</Label>
                  <Input type="date" value={classificarForm.data_de_vencimento} onChange={e => setClassificarForm(f => ({ ...f, data_de_vencimento: e.target.value }))} />
                </div>
              </div>
            </div>

            <Separator />
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Parcelas</p>
                <button
                  className="text-xs text-primary underline"
                  onClick={() => setShowReparcelar(v => !v)}
                >
                  {showReparcelar ? "Cancelar edição de parcelas" : "Editar parcelas"}
                </button>
              </div>

              {!showReparcelar && classificarItem && (
                <div className="rounded border border-border overflow-hidden text-xs">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50">
                      <TableHead className="h-7 text-xs">Nº</TableHead>
                      <TableHead className="h-7 text-xs text-center">Vencimento</TableHead>
                      <TableHead className="h-7 text-xs text-right">Valor</TableHead>
                      <TableHead className="h-7 text-xs text-center">Status</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {(classificarItem.parcelas ?? []).length === 0
                        ? <TableRow><TableCell colSpan={4} className="text-center py-3 text-muted-foreground">Sem parcelas.</TableCell></TableRow>
                        : (classificarItem.parcelas ?? []).map(p => (
                          <TableRow key={p.id}>
                            <TableCell className="py-1.5">{p.numero}</TableCell>
                            <TableCell className="py-1.5 text-center">{p.data_de_vencimento || "—"}</TableCell>
                            <TableCell className="py-1.5 text-right">{formatBRL(p.valor)}</TableCell>
                            <TableCell className="py-1.5 text-center"><StatusBadge status={p.status} /></TableCell>
                          </TableRow>
                        ))
                      }
                    </TableBody>
                  </Table>
                </div>
              )}

              {showReparcelar && (
                <div className="space-y-3 p-3 border border-border rounded bg-muted/20">
                  <p className="text-xs text-muted-foreground">Parcelas pagas são mantidas. Apenas as pendentes serão substituídas.</p>
                  <div className="flex gap-2 items-center">
                    <Label className="text-xs whitespace-nowrap">Nº de parcelas:</Label>
                    <Input
                      type="number" min="1" className="h-7 w-20 text-xs"
                      value={parcelasEdit.length}
                      onChange={e => {
                        const n = Math.max(1, parseInt(e.target.value) || 1);
                        const total = parseFloat(String(classificarItem?.valor_total || "0")) || 0;
                        const base = total > 0 ? Math.floor((total / n) * 100) / 100 : 0;
                        const remainder = total > 0 ? parseFloat((total - base * n).toFixed(2)) : 0;
                        const firstDate = parcelasEdit[0]?.data_de_vencimento || classificarForm.data_de_vencimento || "";
                        setParcelasEdit(Array.from({ length: n }, (_, i) => ({
                          numero: i + 1,
                          data_de_vencimento: addMonthsEdit(firstDate, i),
                          valor: (i === n - 1 ? base + remainder : base).toFixed(2),
                        })));
                      }}
                    />
                  </div>
                  <div className="rounded border border-border overflow-hidden">
                    <Table>
                      <TableHeader><TableRow className="bg-muted/50">
                        <TableHead className="h-7 text-xs w-10">Nº</TableHead>
                        <TableHead className="h-7 text-xs text-center">Vencimento</TableHead>
                        <TableHead className="h-7 text-xs text-right">Valor (R$)</TableHead>
                      </TableRow></TableHeader>
                      <TableBody>
                        {parcelasEdit.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="py-1 text-xs font-medium">{p.numero}</TableCell>
                            <TableCell className="py-1">
                              <Input type="date" value={p.data_de_vencimento} className="h-7 text-xs"
                                onChange={e => setParcelasEdit(prev => prev.map((r, j) => j === i ? { ...r, data_de_vencimento: e.target.value } : r))} />
                            </TableCell>
                            <TableCell className="py-1">
                              <Input type="number" step="0.01" value={p.valor} className="h-7 text-xs text-right"
                                onChange={e => setParcelasEdit(prev => prev.map((r, j) => j === i ? { ...r, valor: e.target.value } : r))} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {(() => {
                    const soma = parcelasEdit.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
                    const total = parseFloat(String(classificarItem?.valor_total || "0")) || 0;
                    const ok = total > 0 && Math.abs(soma - total) < 0.01;
                    return total > 0 ? (
                      <p className={`text-xs flex items-center gap-1 ${ok ? "text-green-600" : "text-destructive"}`}>
                        {!ok && <AlertCircle className="h-3 w-3" />}
                        Soma: R$ {soma.toFixed(2)} / Total: R$ {total.toFixed(2)}
                      </p>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
          <Separator />
          <div className="px-6 py-4">
            <DialogFooter>
              <Button variant="outline" onClick={() => { setClassificarItem(null); setShowReparcelar(false); }}>Cancelar</Button>
              <Button onClick={handleClassificar} disabled={classificarSaving}>
                {classificarSaving ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </div>
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
                    <SelectItem key={cb.id} value={String(cb.id)}>
                      {cb.numero_conta || `${cb.agencia}/${cb.conta}`}
                      {cb.unidade_nome ? ` — ${cb.unidade_nome}` : ""}
                      {cb.tipo ? ` (${cb.tipo})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="flex items-center gap-1"><Paperclip className="w-3 h-3" />Comprovante (opcional)</Label>
              <Input
                type="file"
                accept="application/pdf,image/*"
                onChange={e => setComprovanteFile(e.target.files?.[0] ?? null)}
                className="cursor-pointer"
              />
              {comprovanteFile && <p className="text-xs text-muted-foreground mt-1">{comprovanteFile.name}</p>}
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
