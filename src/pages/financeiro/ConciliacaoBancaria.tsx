import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConciliacoes,
  fetchConciliacaoParaConciliar,
  efetivarConciliacaoBancaria,
  importarOfxNovo,
  deleteConciliacao,
  fetchLixeiraConciliacoes,
  restaurarConciliacao,
  conciliacoesQueryKey,
  lixeiraConciliacoesQueryKey,
  Conciliacao,
  ConciliacaoParaConciliar,
  ConciliacaoEfetivarPayload,
  ParcelaConciliacao,
  TransacaoConciliacao,
} from "@/services/financeiro";
import { usePermissions } from "@/contexts/PermissionsContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileUp,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Loader2,
  Calendar,
  Building2,
  Check,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { fmtDate } from "@/lib/utils";

const isEntrada = (valor: number) => valor >= 0;

const ConciliacaoBancaria = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<ConciliacaoParaConciliar | null>(null);
  const [selectedItem, setSelectedItem] = useState<ConciliacaoEfetivarPayload | null>(null);
  const [confirmDescontoOpen, setConfirmDescontoOpen] = useState(false);
  const [descartarId, setDescartarId] = useState<number | null>(null);
  const [lixeiraOpen, setLixeiraOpen] = useState(false);

  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [importing, setImporting] = useState(false);

  const { toast } = useToast();
  const { hasPermission, currentUser } = usePermissions();
  // Espelho da permissão do backend (CanManageLixeiraConciliacao): ação granular
  // 'trash' concedida na tela de Acessos, ou papel admin/diretor.
  const podeGerenciarLixeira =
    hasPermission("cadastro_financeiro", "cad_fin_conciliacao", "trash") ||
    currentUser.roles.includes("diretor");

  const { data: conciliacoesRaw = [], isLoading: loadingLista } = useQuery({
    queryKey: [...conciliacoesQueryKey],
    queryFn: fetchConciliacoes,
  });
  // O backend já devolve só pendentes; o filtro é uma salvaguarda contra cache.
  const conciliacoes = conciliacoesRaw.filter(
    (c) => !["Pago", "Efetuado"].includes(c.conciliacao)
  );

  const handleSelecionar = async (id: number) => {
    if (selectedId === id) {
      setSelectedId(null);
      setDetalhes(null);
      setSelectedItem(null);
      return;
    }

    setSelectedId(id);
    setDetalhes(null);
    setSelectedItem(null);
    setLoadingDetalhes(true);

    try {
      const data = await fetchConciliacaoParaConciliar(id);
      setDetalhes(data);
    } catch {
      toast({
        title: "Erro ao buscar correspondências",
        description: "Não foi possível obter as sugestões para esta conciliação.",
        variant: "destructive",
      });
      setSelectedId(null);
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const importMutation = useMutation({
    mutationFn: (file: File) => importarOfxNovo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...conciliacoesQueryKey] });
      toast({ title: "OFX importado com sucesso." });
    },
    onError: () => toast({ title: "Erro na importação", description: "Verifique o arquivo OFX e tente novamente.", variant: "destructive" }),
  });

  const handleImportarOfx = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      await importMutation.mutateAsync(file);
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  // ── Lixeira ────────────────────────────────────────────────────────────────
  const { data: lixeira = [], isLoading: loadingLixeira } = useQuery({
    queryKey: [...lixeiraConciliacoesQueryKey],
    queryFn: fetchLixeiraConciliacoes,
    enabled: lixeiraOpen && podeGerenciarLixeira,
  });

  const descartarMutation = useMutation({
    mutationFn: (id: number) => deleteConciliacao(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<Conciliacao[]>([...conciliacoesQueryKey], (old) =>
        old ? old.filter((c) => c.id !== id) : old
      );
      queryClient.invalidateQueries({ queryKey: [...conciliacoesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [...lixeiraConciliacoesQueryKey] });
      if (selectedId === id) {
        setSelectedId(null);
        setDetalhes(null);
        setSelectedItem(null);
      }
      toast({ title: "Lançamento movido para a lixeira", description: "Você pode restaurá-lo em até 30 dias." });
    },
    onError: () => toast({ title: "Erro ao descartar o lançamento", variant: "destructive" }),
  });

  const restaurarMutation = useMutation({
    mutationFn: (id: number) => restaurarConciliacao(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...conciliacoesQueryKey] });
      queryClient.invalidateQueries({ queryKey: [...lixeiraConciliacoesQueryKey] });
      toast({ title: "Lançamento restaurado para a fila de pendentes." });
    },
    onError: () => toast({ title: "Erro ao restaurar o lançamento", variant: "destructive" }),
  });

  const efetivarMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ConciliacaoEfetivarPayload }) =>
      efetivarConciliacaoBancaria(id, payload),
    onSuccess: (_data, variables) => {
      // Remoção otimista: tira a conciliação efetivada da lista imediatamente,
      // sem depender do timing do refetch. Como a query key é estática
      // (['conciliacoes']), efetivações em sequência poderiam deixar a lista
      // uma atualização atrás; o setQueryData garante consistência na hora.
      queryClient.setQueryData<Conciliacao[]>([...conciliacoesQueryKey], (old) =>
        old ? old.filter((c) => c.id !== variables.id) : old
      );
      queryClient.invalidateQueries({ queryKey: [...conciliacoesQueryKey] });
      toast({ title: "Conciliação efetivada com sucesso!" });
      setSelectedId(null);
      setDetalhes(null);
      setSelectedItem(null);
    },
    onError: () => toast({ title: "Erro ao efetivar conciliação", variant: "destructive" }),
  });

  // Parcela selecionada com valor do extrato MENOR que o da parcela → o backend
  // exige confirmação explícita antes de baixar com desconto.
  const parcelaSelecionada =
    selectedItem?.tipo === "parcela" && detalhes
      ? [...detalhes.parcelas_a_receber, ...detalhes.parcelas_a_pagar].find(
          (p) => p.id === selectedItem.parcela_id
        )
      : undefined;
  const precisaConfirmarDesconto =
    parcelaSelecionada?.diferenca != null && parcelaSelecionada.diferenca < -0.005;

  const handleEfetivar = async () => {
    if (!selectedId || !selectedItem) return;
    if (precisaConfirmarDesconto) {
      setConfirmDescontoOpen(true);
      return;
    }
    efetivarMutation.mutate({ id: selectedId, payload: selectedItem });
  };

  const handleConfirmarDesconto = () => {
    if (!selectedId || !selectedItem || selectedItem.tipo !== "parcela") return;
    setConfirmDescontoOpen(false);
    efetivarMutation.mutate({
      id: selectedId,
      payload: { ...selectedItem, confirmar_diferenca: true },
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Math.abs(value)
    );

  // ── Item de parcela (a receber ou a pagar) ────────────────────────────────
  const renderParcelaItem = (p: ParcelaConciliacao) => {
    const entrada = p.tipo === "receber";
    const isSelected = selectedItem?.tipo === "parcela" && selectedItem.parcela_id === p.id;
    const label = p.favorecido || (entrada ? `Cliente #${p.conta_id}` : `Fornecedor #${p.conta_id}`);
    const comDiferenca = p.diferenca != null && !p.match_exato;
    const diferencaJuros = comDiferenca && (p.diferenca as number) > 0;

    return (
      <div
        key={`parcela-${p.id}`}
        onClick={() =>
          setSelectedItem(isSelected ? null : { tipo: "parcela", parcela_id: p.id })
        }
        className={`group p-4 rounded-lg border transition-all cursor-pointer bg-card ${
          isSelected
            ? entrada
              ? "border-green-500"
              : "border-red-500"
            : entrada
            ? "border-border hover:border-green-400"
            : "border-border hover:border-red-400"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
                isSelected
                  ? entrada
                    ? "bg-green-500 border-green-500 text-white"
                    : "bg-red-500 border-red-500 text-white"
                  : "bg-background border-border"
              }`}
            >
              <Check size={14} className={isSelected ? "opacity-100" : "opacity-0"} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className={`flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${
                    entrada ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}
                >
                  {entrada ? <ArrowUpRight size={11} /> : <ArrowDownLeft size={11} />}
                  Parcela {p.numero}
                </span>
                <span className="font-semibold text-sm">{label}</span>
              </div>

              {p.descricao && (
                <p className="text-xs text-muted-foreground truncate max-w-[260px] mb-0.5">
                  {p.descricao}
                </p>
              )}

              {comDiferenca && (
                <p className="flex items-center gap-1 text-xs font-medium text-amber-600 mb-0.5">
                  <AlertCircle size={11} />
                  {diferencaJuros
                    ? `Extrato maior: +${formatCurrency(p.diferenca as number)} (juros/multa)`
                    : `Extrato menor: -${formatCurrency(p.diferenca as number)} (desconto)`}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                {p.data_de_vencimento && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} /> Venc: {fmtDate(p.data_de_vencimento)}
                  </span>
                )}
                {p.data_de_pagamento && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Check size={11} /> Pago: {fmtDate(p.data_de_pagamento)}
                  </span>
                )}
                {p.numero_documento && (
                  <span className="italic">Doc: {p.numero_documento}</span>
                )}
              </div>
            </div>
          </div>

          <span
            className={`font-bold text-sm ml-2 flex-shrink-0 ${
              entrada ? "text-green-600" : "text-red-600"
            }`}
          >
            {entrada ? "+" : "-"} {formatCurrency(p.valor_exibido)}
          </span>
        </div>
      </div>
    );
  };

  // ── Item de transferência (perna origem = saída, destino = entrada) ────────
  const renderTransacaoItem = (t: TransacaoConciliacao) => {
    const entrada = t.perna === "destino";
    const isSelected = selectedItem?.tipo === "transacao" && selectedItem.transacao_id === t.id;

    return (
      <div
        key={`transacao-${t.id}`}
        onClick={() =>
          setSelectedItem(isSelected ? null : { tipo: "transacao", transacao_id: t.id })
        }
        className={`group p-4 rounded-lg border transition-all cursor-pointer bg-card ${
          isSelected ? "border-blue-500" : "border-border hover:border-blue-400"
        }`}
      >
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
                isSelected ? "bg-blue-500 border-blue-500 text-white" : "bg-background border-border"
              }`}
            >
              <Check size={14} className={isSelected ? "opacity-100" : "opacity-0"} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                  <ArrowRightLeft size={11} /> Transferência
                </span>
                <span className="font-semibold text-sm">
                  {t.conta_origem_nome} → {t.conta_destino_nome}
                </span>
              </div>

              {t.descricao && (
                <p className="text-xs text-muted-foreground truncate max-w-[260px] mb-0.5">
                  {t.descricao}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar size={11} /> {fmtDate(t.data_de_lancamento)}
                </span>
                <span className="italic">{entrada ? "Entrada (destino)" : "Saída (origem)"}</span>
              </div>
            </div>
          </div>

          <span
            className={`font-bold text-sm ml-2 flex-shrink-0 ${
              entrada ? "text-green-600" : "text-red-600"
            }`}
          >
            {entrada ? "+" : "-"} {formatCurrency(t.valor)}
          </span>
        </div>
      </div>
    );
  };

  const semCorrespondencia =
    detalhes &&
    detalhes.parcelas_a_receber.length === 0 &&
    detalhes.parcelas_a_pagar.length === 0 &&
    detalhes.transacoes.length === 0;

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden p-6 gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Search className="w-8 h-8 text-primary" />
            Conciliação Bancária
          </h1>
          <p className="text-muted-foreground mt-1">
            Importe um extrato OFX ou selecione uma conciliação para encontrar correspondências.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Input
            id="ofx-upload"
            type="file"
            accept=".ofx"
            className="hidden"
            onChange={handleImportarOfx}
            disabled={importing}
          />
          <Button
            onClick={() => document.getElementById("ofx-upload")?.click()}
            disabled={importing}
            variant="outline"
            className="gap-2"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            Importar OFX
          </Button>

          {podeGerenciarLixeira && (
            <Button variant="outline" className="gap-2" onClick={() => setLixeiraOpen(true)}>
              <Trash2 className="w-4 h-4" />
              Lixeira
            </Button>
          )}

          <Button
            onClick={handleEfetivar}
            disabled={!selectedId || !selectedItem || efetivarMutation.isPending}
            className="gap-2"
          >
            {efetivarMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            Efetivar Conciliação
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-grow overflow-hidden min-h-0">

        {/* Esquerda: lista de conciliações pendentes */}
        <Card className="flex flex-col min-h-0 shadow-sm border-border overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Conciliações Pendentes
                </CardTitle>
                <CardDescription>Selecione uma para buscar correspondências</CardDescription>
              </div>
              <Badge variant="secondary" className="font-medium text-xs">
                {conciliacoes.length} pendentes
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-3">
                {loadingLista ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : conciliacoes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic">
                    <CheckCircle2 className="h-8 w-8 mb-2 opacity-20" />
                    <p>Nenhuma conciliação pendente.</p>
                    <p className="text-xs mt-1">Importe um arquivo OFX para começar.</p>
                  </div>
                ) : (
                  conciliacoes.map((c) => {
                    const entrada = isEntrada(Number(c.valor_total));
                    const isSelected = selectedId === c.id;

                    return (
                      <div
                        key={c.id}
                        onClick={() => handleSelecionar(c.id)}
                        className={`group p-4 rounded-lg border transition-all cursor-pointer bg-card ${
                          isSelected
                            ? "border-primary"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ${
                                isSelected
                                  ? entrada
                                    ? "bg-green-500 border-green-500 text-white"
                                    : "bg-red-500 border-red-500 text-white"
                                  : "bg-background border-border group-hover:border-primary/50"
                              }`}
                            >
                              <Check
                                size={14}
                                className={isSelected ? "opacity-100 text-white" : "opacity-0"}
                              />
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <span
                                  className={`flex items-center gap-1 text-xs font-semibold px-1.5 py-0.5 rounded ${
                                    entrada
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {entrada ? (
                                    <ArrowUpRight size={11} />
                                  ) : (
                                    <ArrowDownLeft size={11} />
                                  )}
                                  {entrada ? "Entrada" : "Saída"}
                                </span>
                                <span className="font-semibold text-sm truncate max-w-[180px]">
                                  {c.descricao || c.conta_nome || `Conciliação #${c.id}`}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} />
                                  {fmtDate(c.data)}
                                </span>
                                {(c.conta_nome || c.numero_conta) && (
                                  <span className="italic">
                                    Conta: {c.conta_nome || c.numero_conta}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-1 ml-2 flex-shrink-0">
                            <span
                              className={`font-bold text-sm ${
                                entrada ? "text-green-600" : "text-red-600"
                              }`}
                            >
                              {entrada ? "+" : "-"} {formatCurrency(Number(c.valor_total))}
                            </span>
                            {podeGerenciarLixeira && (
                              <button
                                type="button"
                                title="Descartar para a lixeira"
                                className="p-1 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDescartarId(c.id);
                                }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Direita: correspondências */}
        <Card className="flex flex-col min-h-0 shadow-sm border-border overflow-hidden">
          <CardHeader className="border-b bg-muted/30 py-4 flex-shrink-0">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-primary" />
                Correspondências
              </CardTitle>
              <CardDescription>
                {detalhes
                  ? "Selecione a parcela ou transferência correspondente e clique em Efetivar"
                  : "Selecione uma conciliação ao lado para ver as sugestões"}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-grow overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-6">
                {loadingDetalhes ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : !detalhes ? (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground italic">
                    <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                    <p>Nenhuma conciliação selecionada.</p>
                  </div>
                ) : (
                  <>
                    {/* Parcelas a Receber */}
                    {detalhes.parcelas_a_receber.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <ArrowUpRight size={14} className="text-green-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-green-600">
                            Entradas — Parcelas a Receber
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 border-green-200 text-green-600"
                          >
                            {detalhes.parcelas_a_receber.length}
                          </Badge>
                        </div>
                        {detalhes.parcelas_a_receber.map(renderParcelaItem)}
                      </div>
                    )}

                    {/* Parcelas a Pagar */}
                    {detalhes.parcelas_a_pagar.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <ArrowDownLeft size={14} className="text-red-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-red-600">
                            Saídas — Parcelas a Pagar
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 border-red-200 text-red-600"
                          >
                            {detalhes.parcelas_a_pagar.length}
                          </Badge>
                        </div>
                        {detalhes.parcelas_a_pagar.map(renderParcelaItem)}
                      </div>
                    )}

                    {/* Transferências */}
                    {detalhes.transacoes.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <ArrowRightLeft size={14} className="text-blue-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-blue-600">
                            Transferências entre Contas
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 border-blue-200 text-blue-600"
                          >
                            {detalhes.transacoes.length}
                          </Badge>
                        </div>
                        {detalhes.transacoes.map(renderTransacaoItem)}
                      </div>
                    )}

                    {semCorrespondencia && (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground italic">
                        <AlertCircle className="h-6 w-6 mb-2 opacity-30" />
                        <p className="text-sm text-center">
                          Nenhuma parcela ou transferência sugerida para esta conciliação.
                          <br />
                          São sugeridas parcelas com valor próximo ao do extrato
                          (a diferença por juros/desconto é indicada). Verifique se há
                          lançamentos compatíveis no sistema.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Confirmação de descarte para a lixeira */}
      <AlertDialog open={descartarId !== null} onOpenChange={() => setDescartarId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar lançamento do extrato?</AlertDialogTitle>
            <AlertDialogDescription>
              O lançamento sai da fila de pendentes e vai para a lixeira, onde pode
              ser restaurado em até 30 dias. Reimportar o mesmo OFX não o recria.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (descartarId !== null) descartarMutation.mutate(descartarId);
                setDescartarId(null);
              }}
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lixeira: lançamentos descartados (retenção de 30 dias) */}
      <Dialog open={lixeiraOpen} onOpenChange={setLixeiraOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5" /> Lixeira da Conciliação
            </DialogTitle>
            <DialogDescription>
              Lançamentos descartados são mantidos por 30 dias e depois removidos
              definitivamente.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[50vh]">
            <div className="space-y-2 pr-2">
              {loadingLixeira ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : lixeira.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">
                  A lixeira está vazia.
                </p>
              ) : (
                lixeira.map((c) => {
                  const entrada = isEntrada(Number(c.valor_total));
                  return (
                    <div
                      key={c.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {c.descricao || c.conta_nome || `Conciliação #${c.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(c.data)}
                          {(c.conta_nome || c.numero_conta) &&
                            ` • ${c.conta_nome || c.numero_conta}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span
                          className={`font-semibold text-sm ${
                            entrada ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {entrada ? "+" : "-"} {formatCurrency(Number(c.valor_total))}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          disabled={restaurarMutation.isPending}
                          onClick={() => restaurarMutation.mutate(c.id)}
                        >
                          <RotateCcw size={13} /> Restaurar
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Confirmação: extrato menor que a parcela → baixa com desconto */}
      <AlertDialog open={confirmDescontoOpen} onOpenChange={setConfirmDescontoOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Valor do extrato menor que a parcela</AlertDialogTitle>
            <AlertDialogDescription>
              A parcela selecionada é de{" "}
              <strong>{parcelaSelecionada ? formatCurrency(parcelaSelecionada.valor) : ""}</strong>,
              mas a linha do extrato é de{" "}
              <strong>
                {parcelaSelecionada?.diferenca != null
                  ? formatCurrency(parcelaSelecionada.valor + parcelaSelecionada.diferenca)
                  : ""}
              </strong>
              . Ao confirmar, a parcela será baixada como paga e a diferença de{" "}
              <strong>
                {parcelaSelecionada?.diferenca != null
                  ? formatCurrency(parcelaSelecionada.diferenca)
                  : ""}
              </strong>{" "}
              será registrada como desconto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmarDesconto}>
              Confirmar baixa com desconto
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConciliacaoBancaria;
