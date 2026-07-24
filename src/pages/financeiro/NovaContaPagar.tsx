import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { CreditCard, AlertCircle } from "lucide-react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedTextarea } from "@/components/ui/validated-textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  fetchCentrosCusto, fetchPlanoContas, createContaPagar, createParcela, deleteContaPagar, anexarNotaFiscal, uploadBoletoParcela,
  centrosCustoQueryKey, planoContasQueryKey,
  type CentroCusto, type PlanoContas,
} from "@/services/financeiro";
import { fetchFornecedores, fetchUnidades, unidadesQueryKey, fornecedoresQueryKey } from "@/services/estoque";

interface ParcelaRow {
  numero: number;
  data_de_vencimento: string;
  valor: string;
  boleto: File | null;
}

const validationFields = [
  { name: "beneficiario", label: "Beneficiário", required: true },
  { name: "documento", label: "Número do Documento", required: true },
  { name: "valor", label: "Valor do Título", required: true },
  { name: "dataFaturamento", label: "Data de Faturamento", required: true },
  { name: "dataVencimento", label: "Data de Vencimento", required: true },
];

function addMonths(dateStr: string, months: number): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split("T")[0];
}

export default function NovaContaPagar() {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [parcelasData, setParcelasData] = useState<ParcelaRow[]>([]);
  const [nfPdfFile, setNfPdfFile] = useState<File | null>(null);
  const [nfXmlFile, setNfXmlFile] = useState<File | null>(null);

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { beneficiario: "", unidade: "", centroCusto: "", planoContas: "", documento: "", valor: "", multa: "0", encargos: "0", juros: "0", desconto: "0", valorTotal: "", dataFaturamento: "", dataVencimento: "", parcelas: "1", descricao: "" },
    validationFields
  );

  // Recalcula valor total automaticamente
  useEffect(() => {
    const valor = parseFloat(formData.valor) || 0;
    const multa = parseFloat(formData.multa) || 0;
    const encargos = parseFloat(formData.encargos) || 0;
    const juros = parseFloat(formData.juros) || 0;
    const desconto = parseFloat(formData.desconto) || 0;
    const total = valor + multa + encargos + juros - desconto;
    setFieldValue("valorTotal", total > 0 ? total.toFixed(2) : "");
  }, [formData.valor, formData.multa, formData.encargos, formData.juros, formData.desconto]);

  // Regenera parcelas apenas quando mudar quantidade ou data de vencimento
  useEffect(() => {
    const n = Math.max(1, parseInt(formData.parcelas) || 1);
    const total = parseFloat(formData.valorTotal) || 0;
    if (total <= 0 || !formData.dataVencimento) {
      setParcelasData(Array.from({ length: n }, (_, i) => ({
        numero: i + 1,
        data_de_vencimento: addMonths(formData.dataVencimento, i),
        valor: "",
        boleto: null,
      })));
      return;
    }
    const base = Math.floor((total / n) * 100) / 100;
    const remainder = parseFloat((total - base * n).toFixed(2));
    setParcelasData(Array.from({ length: n }, (_, i) => ({
      numero: i + 1,
      data_de_vencimento: addMonths(formData.dataVencimento, i),
      valor: (i === n - 1 ? base + remainder : base).toFixed(2),
      boleto: null,
    })));
  // valorTotal intencionalmente excluído: mudança de valor não deve sobrescrever edições manuais
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.parcelas, formData.dataVencimento]);

  const somaParcelас = parcelasData.reduce((acc, p) => acc + (parseFloat(p.valor) || 0), 0);
  const totalEsperado = parseFloat(formData.valorTotal) || 0;
  const somaOk = totalEsperado > 0 && Math.abs(somaParcelас - totalEsperado) < 0.01;

  const updateParcela = (index: number, field: "data_de_vencimento" | "valor", value: string) => {
    setParcelasData(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  };
  const setParcelaBoleto = (index: number, file: File | null) => {
    setParcelasData(prev => prev.map((p, i) => i === index ? { ...p, boleto: file } : p));
  };

  const { data: unidadesResponse } = useQuery({
    queryKey: [...unidadesQueryKey],
    queryFn: fetchUnidades,
  });
  const unidades = Array.isArray(unidadesResponse) ? unidadesResponse : (unidadesResponse as any)?.results ?? [];

  const { data: fornecedoresResponse } = useQuery({
    queryKey: [...fornecedoresQueryKey],
    queryFn: () => fetchFornecedores(),
  });
  const fornecedores: { id: number; nome: string }[] = Array.isArray(fornecedoresResponse)
    ? fornecedoresResponse
    : (fornecedoresResponse as any)?.results ?? [];

  const { data: centrosCustoResponse } = useQuery({
    queryKey: [...centrosCustoQueryKey],
    queryFn: () => fetchCentrosCusto(),
  });
  const centrosCusto: CentroCusto[] = Array.isArray(centrosCustoResponse)
    ? centrosCustoResponse
    : (centrosCustoResponse as any)?.results ?? [];

  const { data: planoContasResponse } = useQuery({
    queryKey: [...planoContasQueryKey],
    queryFn: () => fetchPlanoContas(),
  });
  const planoContasList: PlanoContas[] = Array.isArray(planoContasResponse)
    ? planoContasResponse
    : (planoContasResponse as any)?.results ?? [];

  const handleSalvar = async () => {
    if (!validateAll()) return;

    if (totalEsperado > 0 && !somaOk) {
      toast({
        title: "Parcelas inválidas",
        description: `A soma das parcelas (R$ ${somaParcelас.toFixed(2)}) deve ser igual ao valor total (R$ ${totalEsperado.toFixed(2)}).`,
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    let contaId: number | null = null;
    try {
      const payload: Record<string, any> = {
        beneficiario: Number(formData.beneficiario),
        ...(formData.unidade ? { unidade: Number(formData.unidade) } : {}),
        ...(formData.centroCusto ? { centro_de_custo: Number(formData.centroCusto) } : {}),
        ...(formData.planoContas ? { plano_de_contas: Number(formData.planoContas) } : {}),
        numero_documento: formData.documento,
        valor_do_titulo: Number(formData.valor),
        multa: Number(formData.multa),
        encargos: Number(formData.encargos),
        juros: Number(formData.juros),
        desconto: Number(formData.desconto),
        valor_total: Number(formData.valorTotal),
        data_de_faturamento: formData.dataFaturamento,
        descricao: formData.descricao,
      };

      const conta = await createContaPagar(payload as any);
      contaId = (conta as any).id;
      const criadas = await Promise.all(parcelasData.map(p =>
        createParcela({
          conta_pagar: contaId!,
          numero: p.numero,
          data_de_vencimento: p.data_de_vencimento || null,
          valor: parseFloat(p.valor) || 0,
        })
      ));
      // Anexa o boleto de cada parcela que tiver arquivo (após criadas, para ter os ids).
      await Promise.all(criadas.map((parc, i) =>
        parcelasData[i].boleto ? uploadBoletoParcela((parc as any).id, parcelasData[i].boleto as File) : Promise.resolve()
      ));
      // Conta + parcelas OK. A NF é complementar: uma falha aqui não deve
      // disparar o compensating delete da conta já criada.
      if (nfPdfFile) {
        try {
          await anexarNotaFiscal("pagar", contaId!, nfPdfFile, nfXmlFile);
        } catch {
          toast({ title: "Conta criada, mas falhou ao anexar a NF.", description: "Anexe a nota fiscal depois pela edição.", variant: "destructive" });
          navigate("/financeiro/contas-pagar");
          return;
        }
      }
      toast({ title: "Saída financeira salva com sucesso!" });
      navigate("/financeiro/contas-pagar");
    } catch {
      // Compensating delete: if parcela creation fails, remove the orphaned ContaPagar
      if (contaId !== null) {
        try { await deleteContaPagar(contaId); } catch { /* ignore cleanup error */ }
      }
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar a conta.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SimpleFormWizard title="Nova Saída Financeira">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Saída Financeira</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Beneficiário <span className="text-destructive">*</span></Label>
                <Select value={formData.beneficiario} onValueChange={(v) => setFieldValue("beneficiario", v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o beneficiário" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {fornecedores.map(f => <SelectItem key={f.id} value={String(f.id)}>{f.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unidade</Label>
                <Select value={formData.unidade} onValueChange={(v) => setFieldValue("unidade", v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione a unidade" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {unidades.map((u: any) => <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Centro de Custo</Label>
                <Select value={formData.centroCusto} onValueChange={(v) => setFieldValue("centroCusto", v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o centro de custo" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {centrosCusto.map(cc => (
                      <SelectItem key={cc.id} value={String(cc.id)}>
                        {(cc as any).centro_id ?? `Centro ${cc.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Plano de Contas</Label>
                <Select value={formData.planoContas} onValueChange={(v) => setFieldValue("planoContas", v)}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Selecione o plano de contas" /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {planoContasList.map(pc => (
                      <SelectItem key={pc.id} value={String(pc.id)}>
                        {[pc.id_plano, pc.classificacao_nome, pc.categoria_nome].filter(Boolean).join(" - ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Número do Documento" required value={formData.documento}
                onChange={(e) => setFieldValue("documento", e.target.value)} onBlur={() => setFieldTouched("documento")}
                error={getFieldError("documento")} touched={touched.documento} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ValidatedInput label="Valor do Título" required type="number" value={formData.valor}
                onChange={(e) => setFieldValue("valor", e.target.value)} onBlur={() => setFieldTouched("valor")}
                error={getFieldError("valor")} touched={touched.valor} />
              <ValidatedInput label="Multa" type="number" value={formData.multa}
                onChange={(e) => setFieldValue("multa", e.target.value)} onBlur={() => setFieldTouched("multa")}
                error={getFieldError("multa")} touched={touched.multa} />
              <ValidatedInput label="Encargos" type="number" value={formData.encargos}
                onChange={(e) => setFieldValue("encargos", e.target.value)} onBlur={() => setFieldTouched("encargos")}
                error={getFieldError("encargos")} touched={touched.encargos} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ValidatedInput label="Juros" type="number" value={formData.juros}
                onChange={(e) => setFieldValue("juros", e.target.value)} onBlur={() => setFieldTouched("juros")}
                error={getFieldError("juros")} touched={touched.juros} />
              <ValidatedInput label="Desconto" type="number" value={formData.desconto}
                onChange={(e) => setFieldValue("desconto", e.target.value)} onBlur={() => setFieldTouched("desconto")}
                error={getFieldError("desconto")} touched={touched.desconto} />
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor Total</Label>
                <Input value={formData.valorTotal} readOnly className="form-input bg-muted cursor-not-allowed font-semibold" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Data de Faturamento" required type="date" value={formData.dataFaturamento}
                onChange={(e) => setFieldValue("dataFaturamento", e.target.value)} onBlur={() => setFieldTouched("dataFaturamento")}
                error={getFieldError("dataFaturamento")} touched={touched.dataFaturamento} />
              <ValidatedInput label="Data de Vencimento (1ª parcela)" required type="date" value={formData.dataVencimento}
                onChange={(e) => setFieldValue("dataVencimento", e.target.value)} onBlur={() => setFieldTouched("dataVencimento")}
                error={getFieldError("dataVencimento")} touched={touched.dataVencimento} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nota Fiscal — PDF</Label>
                <Input type="file" accept=".pdf"
                  onChange={(e) => setNfPdfFile(e.target.files?.[0] ?? null)}
                  className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                {nfPdfFile && <p className="text-xs text-muted-foreground truncate">{nfPdfFile.name}</p>}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nota Fiscal — XML <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                <Input type="file" accept=".xml"
                  onChange={(e) => setNfXmlFile(e.target.files?.[0] ?? null)}
                  className="form-input file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90" />
                {nfXmlFile && <p className="text-xs text-muted-foreground truncate">{nfXmlFile.name}</p>}
              </div>
              <ValidatedInput label="Número de Parcelas" type="number" value={formData.parcelas}
                onChange={(e) => setFieldValue("parcelas", String(Math.max(1, parseInt(e.target.value) || 1)))}
                onBlur={() => setFieldTouched("parcelas")}
                error={getFieldError("parcelas")} touched={touched.parcelas} />
            </div>

            {/* Tabela de parcelas */}
            {parcelasData.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Parcelas</Label>
                  {totalEsperado > 0 && (
                    <span className={`text-xs flex items-center gap-1 ${somaOk ? "text-green-600" : "text-destructive"}`}>
                      {!somaOk && <AlertCircle className="h-3 w-3" />}
                      Soma: R$ {somaParcelас.toFixed(2)} / Total: R$ {totalEsperado.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="rounded border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-table-header">
                        <TableHead className="font-semibold w-16">Nº</TableHead>
                        <TableHead className="text-center font-semibold">Vencimento</TableHead>
                        <TableHead className="text-right font-semibold">Valor (R$)</TableHead>
                        <TableHead className="text-center font-semibold">Boleto (PDF)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parcelasData.map((p, i) => (
                        <TableRow key={p.numero} className="hover:bg-table-hover">
                          <TableCell className="text-muted-foreground font-medium">{p.numero}</TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="date"
                              value={p.data_de_vencimento}
                              onChange={e => updateParcela(i, "data_de_vencimento", e.target.value)}
                              className="h-8 text-sm text-center"
                            />
                          </TableCell>
                          <TableCell >
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={p.valor}
                              onChange={e => updateParcela(i, "valor", e.target.value)}
                              className={`h-8 text-sm text-center ${!somaOk && totalEsperado > 0 ? "border-destructive" : ""}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="file"
                              accept=".pdf,.png,.jpg,.jpeg"
                              onChange={e => setParcelaBoleto(i, e.target.files?.[0] ?? null)}
                              className="h-8 text-xs file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                            />
                            {p.boleto && <p className="text-[10px] text-muted-foreground truncate max-w-[140px] mx-auto">{p.boleto.name}</p>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {!somaOk && totalEsperado > 0 && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    A soma dos valores das parcelas deve ser igual ao valor total para salvar.
                  </p>
                )}
              </div>
            )}

            <ValidatedTextarea label="Descrição" value={formData.descricao} onChange={(e) => setFieldValue("descricao", e.target.value)}
              onBlur={() => setFieldTouched("descricao")} error={getFieldError("descricao")} touched={touched.descricao} />

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/financeiro/contas-pagar")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
}
