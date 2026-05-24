import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchConciliacoes,
  fetchConciliacaoParaConciliar,
  efetivarConciliacaoBancaria,
  importarOfxNovo,
  conciliacoesQueryKey,
  Conciliacao,
  ConciliacaoParaConciliar,
  ContaPagar,
  ContaReceber,
} from "@/services/financeiro";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
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
} from "lucide-react";
import { fmtDate } from "@/lib/utils";

const isEntrada = (valor: number) => valor >= 0;

const ConciliacaoBancaria = () => {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detalhes, setDetalhes] = useState<ConciliacaoParaConciliar | null>(null);
  const [selectedConta, setSelectedConta] = useState<{
    tipo: "receber" | "pagar";
    id: number;
  } | null>(null);

  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [importing, setImporting] = useState(false);

  const { toast } = useToast();

  const { data: conciliacoesRaw = [], isLoading: loadingLista } = useQuery({
    queryKey: [...conciliacoesQueryKey],
    queryFn: fetchConciliacoes,
  });
  const conciliacoes = conciliacoesRaw.filter((c) => c.conciliacao !== "Efetuado");

  const handleSelecionar = async (id: number) => {
    if (selectedId === id) {
      setSelectedId(null);
      setDetalhes(null);
      setSelectedConta(null);
      return;
    }

    setSelectedId(id);
    setDetalhes(null);
    setSelectedConta(null);
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

  const efetivarMutation = useMutation({
    mutationFn: ({ id, conta }: { id: number; conta: { tipo: "receber" | "pagar"; id: number } }) =>
      efetivarConciliacaoBancaria(id, { conta_tipo: conta.tipo, conta_id: conta.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...conciliacoesQueryKey] });
      toast({ title: "Conciliação efetivada com sucesso!" });
      setSelectedId(null);
      setDetalhes(null);
      setSelectedConta(null);
    },
    onError: () => toast({ title: "Erro ao efetivar conciliação", variant: "destructive" }),
  });

  const handleEfetivar = async () => {
    if (!selectedId || !selectedConta) return;
    efetivarMutation.mutate({ id: selectedId, conta: selectedConta });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
      Math.abs(value)
    );

  const renderContaItem = (
    acc: ContaReceber | ContaPagar,
    tipo: "receber" | "pagar",
    label: string
  ) => {
    const isSelected = selectedConta?.tipo === tipo && selectedConta?.id === acc.id;
    const entrada = tipo === "receber";
    const valor = Number((acc as any).valor_total ?? (acc as any).valor_do_titulo ?? 0);

    return (
      <div
        key={`${tipo}-${acc.id}`}
        onClick={() => setSelectedConta(isSelected ? null : { tipo, id: acc.id })}
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
            {/* Checkbox */}
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

            {/* Ícone de tipo + info */}
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
                <span className="font-semibold text-sm">{label}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {(acc as any).data_de_vencimento && (
                  <span className="flex items-center gap-1">
                    <Calendar size={11} />
                    Venc:{" "}
                    {fmtDate((acc as any).data_de_vencimento)}
                  </span>
                )}
                {(acc as any).documento && (
                  <span className="italic">Doc: {(acc as any).documento}</span>
                )}
              </div>
            </div>
          </div>

          <span
            className={`font-bold text-sm ml-2 ${
              entrada ? "text-green-600" : "text-red-600"
            }`}
          >
            {entrada ? "+" : "-"} {formatCurrency(valor)}
          </span>
        </div>
      </div>
    );
  };

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

          <Button
            onClick={handleEfetivar}
            disabled={!selectedId || !selectedConta || efetivarMutation.isPending}
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
                            {/* Checkbox */}
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
                              {/* Badge Entrada / Saída */}
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

                              {/* Meta info */}
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar size={11} />
                                  {fmtDate(c.data)}
                                </span>
                                {c.numero_conta && (
                                  <span className="italic">Conta: {c.numero_conta}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Valor colorido */}
                          <span
                            className={`font-bold text-sm ml-2 flex-shrink-0 ${
                              entrada ? "text-green-600" : "text-red-600"
                            }`}
                          >
                            {entrada ? "+" : "-"} {formatCurrency(Number(c.valor_total))}
                          </span>
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
                  ? "Selecione a conta correspondente e clique em Efetivar"
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
                    {/* Contas a Receber sugeridas */}
                    {detalhes.contas_a_receber.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <ArrowUpRight size={14} className="text-green-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-green-600">
                            Entradas — Contas a Receber
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 border-green-200 text-green-600"
                          >
                            {detalhes.contas_a_receber.length}
                          </Badge>
                        </div>
                        {detalhes.contas_a_receber.map((acc) =>
                          renderContaItem(
                            acc,
                            "receber",
                            (acc as any).cliente_nome || `Cliente #${(acc as any).cliente}`
                          )
                        )}
                      </div>
                    )}

                    {/* Contas a Pagar sugeridas */}
                    {detalhes.contas_a_pagar.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 border-b pb-2">
                          <ArrowDownLeft size={14} className="text-red-600" />
                          <h3 className="text-xs font-bold uppercase tracking-wider text-red-600">
                            Saídas — Contas a Pagar
                          </h3>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 border-red-200 text-red-600"
                          >
                            {detalhes.contas_a_pagar.length}
                          </Badge>
                        </div>
                        {detalhes.contas_a_pagar.map((acc) =>
                          renderContaItem(
                            acc,
                            "pagar",
                            (acc as any).fornecedor_nome ||
                              `Fornecedor #${(acc as any).beneficiario}`
                          )
                        )}
                      </div>
                    )}

                    {detalhes.contas_a_receber.length === 0 &&
                      detalhes.contas_a_pagar.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground italic">
                          <AlertCircle className="h-6 w-6 mb-2 opacity-30" />
                          <p className="text-sm text-center">
                            Nenhuma conta sugerida para esta conciliação.
                            <br />
                            Verifique se há lançamentos compatíveis no sistema.
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
    </div>
  );
};

export default ConciliacaoBancaria;
