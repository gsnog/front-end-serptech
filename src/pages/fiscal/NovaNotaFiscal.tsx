import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Plus, Trash2, Save, CheckCircle, Send, ChevronRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
// Fiscal-mock removed — stubs until /api/fiscal/ endpoints exist
const mockClientes: { id: string; nome: string; cpfCnpj: string; endereco: string; municipio: string; uf: string }[] = [];
const mockItensCadastro: { id: string; descricao: string; tipo: string; valorRef: number }[] = [];
import SimpleFormWizard from "@/components/SimpleFormWizard";
import FormActionBar from "@/components/FormActionBar";

interface ItemLinha {
  id: string;
  itemCadastroId: string;
  descricao: string;
  quantidade: number;
  valorUnitario: number;
  desconto: number;
  total: number;
}

interface TributoLinha {
  imposto: string;
  baseCalculo: number;
  aliquota: number;
  valorCalculado: number;
  valorFinal: number;
  justificativa: string;
}

const steps = ["Tipo e Operação", "Cliente", "Itens / Serviços", "Totais", "Tributos"];

export default function NovaNotaFiscal() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Step 1
  const [tipo, setTipo] = useState<string>("NF-e");
  const [dataEmissao, setDataEmissao] = useState("2026-02-19");
  const [serie, setSerie] = useState("1");
  const [numero, setNumero] = useState("153");
  const [natureza, setNatureza] = useState("");

  // Step 2
  const [clienteId, setClienteId] = useState("");
  const clienteSelecionado = mockClientes.find(c => c.id === clienteId);

  // Step 3
  const [itens, setItens] = useState<ItemLinha[]>([]);
  const [itemSelecionado, setItemSelecionado] = useState("");

  // Step 5
  const [observacoesFiscais, setObservacoesFiscais] = useState("");
  const [revisadoContador, setRevisadoContador] = useState(false);

  const subtotal = itens.reduce((s, i) => s + i.total, 0);
  const [descontoGeral, setDescontoGeral] = useState(0);
  const [outrasDespesas, setOutrasDespesas] = useState(0);
  const totalFinal = subtotal - descontoGeral + outrasDespesas;

  // Auto-generate tributos based on tipo
  const defaultTributos: TributoLinha[] = tipo === "NF-e"
    ? [
      { imposto: "ICMS", baseCalculo: totalFinal, aliquota: 18, valorCalculado: +(totalFinal * 0.18).toFixed(2), valorFinal: +(totalFinal * 0.18).toFixed(2), justificativa: "" },
      { imposto: "IPI", baseCalculo: totalFinal, aliquota: 5, valorCalculado: +(totalFinal * 0.05).toFixed(2), valorFinal: +(totalFinal * 0.05).toFixed(2), justificativa: "" },
      { imposto: "PIS", baseCalculo: totalFinal, aliquota: 1.65, valorCalculado: +(totalFinal * 0.0165).toFixed(2), valorFinal: +(totalFinal * 0.0165).toFixed(2), justificativa: "" },
      { imposto: "COFINS", baseCalculo: totalFinal, aliquota: 7.6, valorCalculado: +(totalFinal * 0.076).toFixed(2), valorFinal: +(totalFinal * 0.076).toFixed(2), justificativa: "" },
    ]
    : [
      { imposto: "ISS", baseCalculo: totalFinal, aliquota: 5, valorCalculado: +(totalFinal * 0.05).toFixed(2), valorFinal: +(totalFinal * 0.05).toFixed(2), justificativa: "" },
      { imposto: "PIS", baseCalculo: totalFinal, aliquota: 0.65, valorCalculado: +(totalFinal * 0.0065).toFixed(2), valorFinal: +(totalFinal * 0.0065).toFixed(2), justificativa: "" },
      { imposto: "COFINS", baseCalculo: totalFinal, aliquota: 3, valorCalculado: +(totalFinal * 0.03).toFixed(2), valorFinal: +(totalFinal * 0.03).toFixed(2), justificativa: "" },
      { imposto: "IRRF", baseCalculo: totalFinal, aliquota: 1.5, valorCalculado: +(totalFinal * 0.015).toFixed(2), valorFinal: +(totalFinal * 0.015).toFixed(2), justificativa: "" },
    ];

  const [tributos, setTributos] = useState<TributoLinha[]>(defaultTributos);

  // Recalc tributos when total changes
  const recalcTributos = () => {
    setTributos(prev => prev.map(t => ({
      ...t,
      baseCalculo: totalFinal,
      valorCalculado: +(totalFinal * (t.aliquota / 100)).toFixed(2),
      valorFinal: t.justificativa ? t.valorFinal : +(totalFinal * (t.aliquota / 100)).toFixed(2),
    })));
  };

  const addItem = () => {
    const item = mockItensCadastro.find(i => i.id === itemSelecionado);
    if (!item) return;
    const newItem: ItemLinha = {
      id: `new-${Date.now()}`,
      itemCadastroId: item.id,
      descricao: item.descricao,
      quantidade: 1,
      valorUnitario: item.valorRef,
      desconto: 0,
      total: item.valorRef,
    };
    setItens(prev => [...prev, newItem]);
    setItemSelecionado("");
  };

  const updateItem = (id: string, field: keyof ItemLinha, value: number) => {
    setItens(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.total = updated.quantidade * updated.valorUnitario - updated.desconto;
      return updated;
    }));
  };

  const removeItem = (id: string) => setItens(prev => prev.filter(i => i.id !== id));

  const updateTributo = (idx: number, field: "valorFinal" | "justificativa", value: string | number) => {
    setTributos(prev => prev.map((t, i) => i === idx ? { ...t, [field]: value } : t));
  };

  const validateCnpj = (cpfCnpj: string) => {
    const digits = cpfCnpj.replace(/\D/g, "");
    return digits.length === 11 || digits.length === 14;
  };

  const handleSave = (action: "rascunho" | "validar" | "emitir") => {
    // Validate items
    if (itens.length === 0) {
      toast({ title: "Erro de validação", description: "Adicione pelo menos um item antes de salvar.", variant: "destructive" });
      setCurrentStep(2);
      return;
    }

    // Validate client CNPJ
    if (clienteSelecionado && !validateCnpj(clienteSelecionado.cpfCnpj)) {
      toast({ title: "Erro de validação", description: "CPF/CNPJ do cliente é inválido.", variant: "destructive" });
      setCurrentStep(1);
      return;
    }

    // Validate justification for adjusted taxes
    const adjustedWithoutJustification = tributos.filter(
      t => t.valorFinal !== t.valorCalculado && !t.justificativa.trim()
    );
    if (adjustedWithoutJustification.length > 0) {
      toast({
        title: "Justificativa obrigatória",
        description: `Informe a justificativa para os tributos ajustados: ${adjustedWithoutJustification.map(t => t.imposto).join(", ")}`,
        variant: "destructive"
      });
      setCurrentStep(4);
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      const msgs = { rascunho: "Rascunho salvo", validar: "Nota em validação", emitir: "Nota enviada para emissão" };
      toast({ title: msgs[action], description: `Nota #${numero} - ${clienteSelecionado?.nome || ""}` });
      navigate("/fiscal/notas");
    }, 1200);
  };

  const canNext = () => {
    if (currentStep === 0) return tipo && natureza;
    if (currentStep === 1) return !!clienteId;
    if (currentStep === 2) return itens.length > 0;
    return true;
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <SimpleFormWizard>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/fiscal/notas")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nova Nota Fiscal</h1>
            <p className="text-sm text-muted-foreground">Preencha as seções para criar a nota fiscal</p>
          </div>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                onClick={() => setCurrentStep(i)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${i === currentStep
                    ? "bg-primary text-primary-foreground"
                    : i < currentStep
                      ? "bg-primary/20 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
              >
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-background/30 text-xs font-bold">{i + 1}</span>
                {step}
              </button>
              {i < steps.length - 1 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        {/* Step 1: Tipo e Operação */}
        {currentStep === 0 && (
          <Card>
            <CardHeader><CardTitle>Tipo e Operação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Documento</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger className="form-input"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="NF-e">NF-e (Produto)</SelectItem>
                      <SelectItem value="NFS-e">NFS-e (Serviço)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Emissão</Label>
                  <Input type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)} className="form-input" />
                </div>
                <div className="space-y-2">
                  <Label>Série</Label>
                  <Input value={serie} readOnly className="form-input opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label>Número (auto)</Label>
                  <Input value={numero} readOnly className="form-input opacity-60" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Natureza da Operação / Descrição</Label>
                <Input value={natureza} onChange={e => setNatureza(e.target.value)} placeholder="Ex: Venda de mercadoria, Prestação de serviço..." className="form-input" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Cliente */}
        {currentStep === 1 && (
          <Card>
            <CardHeader><CardTitle>Cliente (Destinatário / Tomador)</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Selecionar Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger className="form-input"><SelectValue placeholder="Escolha um cliente..." /></SelectTrigger>
                  <SelectContent className="bg-popover">
                    {mockClientes.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nome} — {c.cpfCnpj}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {clienteSelecionado && (
                <div className="bg-muted/50 rounded-xl p-4 space-y-2 border border-border">
                  <p className="text-sm"><span className="font-semibold">Razão Social:</span> {clienteSelecionado.nome}</p>
                  <p className="text-sm"><span className="font-semibold">CPF/CNPJ:</span> {clienteSelecionado.cpfCnpj}</p>
                  <p className="text-sm"><span className="font-semibold">Endereço:</span> {clienteSelecionado.endereco}</p>
                  <p className="text-sm"><span className="font-semibold">Município/UF:</span> {clienteSelecionado.municipio} / {clienteSelecionado.uf}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 3: Itens / Serviços */}
        {currentStep === 2 && (
          <Card>
            <CardHeader><CardTitle>Itens / Serviços</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-3">
                <div className="flex-1 space-y-2">
                  <Label>Adicionar Item/Serviço</Label>
                  <Select value={itemSelecionado} onValueChange={setItemSelecionado}>
                    <SelectTrigger className="form-input"><SelectValue placeholder="Selecione um item do cadastro..." /></SelectTrigger>
                    <SelectContent className="bg-popover">
                      {mockItensCadastro.map(it => (
                        <SelectItem key={it.id} value={it.id}>{it.id} — {it.descricao} ({it.tipo})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addItem} disabled={!itemSelecionado} className="gap-2"><Plus className="h-4 w-4" />Adicionar</Button>
              </div>

              {itens.length > 0 && (
                <div className="rounded border border-border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="bg-table-header">
                      <TableHead className="font-semibold">Descrição</TableHead>
                      <TableHead className="text-right font-semibold w-24">Qtd</TableHead>
                      <TableHead className="font-semibold w-32">Vlr Unit.</TableHead>
                      <TableHead className="text-right font-semibold w-28">Desconto</TableHead>
                      <TableHead className="text-right font-semibold w-32">Total</TableHead>
                      <TableHead className="w-12" />
                    </TableRow></TableHeader>
                    <TableBody>
                      {itens.map(item => (
                        <TableRow key={item.id} className="hover:bg-table-hover">
                          <TableCell className="font-medium text-sm">{item.descricao}</TableCell>
                          <TableCell>
                            <Input type="number" min={1} value={item.quantidade} onChange={e => updateItem(item.id, "quantidade", +e.target.value)} className="form-input h-8 text-center w-20" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min={0} step={0.01} value={item.valorUnitario} onChange={e => updateItem(item.id, "valorUnitario", +e.target.value)} className="form-input h-8 text-center w-28" />
                          </TableCell>
                          <TableCell>
                            <Input type="number" min={0} step={0.01} value={item.desconto} onChange={e => updateItem(item.id, "desconto", +e.target.value)} className="form-input h-8 text-center w-24" />
                          </TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.total)}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-destructive h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {itens.length === 0 && (
                <p className="text-center text-muted-foreground py-8">Nenhum item adicionado. Selecione um item acima e clique em Adicionar.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Step 4: Totais */}
        {currentStep === 3 && (
          <Card>
            <CardHeader><CardTitle>Totais</CardTitle></CardHeader>
            <CardContent>
              <div className="max-w-md space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-muted-foreground">Subtotal ({itens.length} itens)</Label>
                  <span className="text-lg font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label>Descontos</Label>
                  <Input type="number" min={0} step={0.01} value={descontoGeral} onChange={e => setDescontoGeral(+e.target.value)} className="form-input w-40 text-right" />
                </div>
                <div className="flex items-center justify-between gap-4">
                  <Label>Outras despesas</Label>
                  <Input type="number" min={0} step={0.01} value={outrasDespesas} onChange={e => setOutrasDespesas(+e.target.value)} className="form-input w-40 text-right" />
                </div>
                <div className="border-t border-border pt-4 flex items-center justify-between">
                  <span className="text-lg font-bold">Total Final</span>
                  <span className="text-2xl font-bold text-primary">{formatCurrency(totalFinal)}</span>
                </div>
                <Button variant="outline" size="sm" onClick={recalcTributos} className="mt-2">Recalcular tributos com novo total</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 5: Tributos */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Tributos — Calculado vs Ajustado</CardTitle></CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-4">Valores calculados pelo sistema. O Contador pode ajustar o "Valor Final" com justificativa obrigatória.</p>
                <div className="rounded border border-border overflow-hidden">
                  <Table>
                    <TableHeader><TableRow className="bg-table-header">
                      <TableHead className="font-semibold">Imposto</TableHead>
                      <TableHead className="font-semibold">Base Cálculo</TableHead>
                      <TableHead className="font-semibold">Alíquota %</TableHead>
                      <TableHead className="font-semibold">Calculado</TableHead>
                      <TableHead className="text-right font-semibold">Valor Final</TableHead>
                      <TableHead className="font-semibold">Justificativa</TableHead>
                    </TableRow></TableHeader>
                    <TableBody>
                      {tributos.map((t, idx) => (
                        <TableRow key={t.imposto} className="hover:bg-table-hover">
                          <TableCell className="font-semibold">{t.imposto}</TableCell>
                          <TableCell className="text-right">{formatCurrency(t.baseCalculo)}</TableCell>
                          <TableCell >{t.aliquota}%</TableCell>
                          <TableCell className="text-right text-muted-foreground">{formatCurrency(t.valorCalculado)}</TableCell>
                          <TableCell>
                            <Input type="number" step={0.01} value={t.valorFinal} onChange={e => updateTributo(idx, "valorFinal", +e.target.value)} className="form-input h-8 text-right w-28" />
                          </TableCell>
                          <TableCell>
                            <Input placeholder="Justificativa do ajuste..." value={t.justificativa} onChange={e => updateTributo(idx, "justificativa", e.target.value)} className="form-input h-8 text-xs" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>Observações Fiscais</Label>
                  <Textarea value={observacoesFiscais} onChange={e => setObservacoesFiscais(e.target.value)} placeholder="Informações complementares para a nota..." className="form-input min-h-[80px]" />
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="revisado" checked={revisadoContador} onCheckedChange={v => setRevisadoContador(v === true)} />
                  <Label htmlFor="revisado" className="text-sm cursor-pointer">Revisado pelo Contador</Label>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Navigation + Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={() => setCurrentStep(s => s - 1)}>Voltar</Button>
            )}
          </div>
          <div className="flex gap-2">
            {currentStep < steps.length - 1 ? (
              <Button onClick={() => setCurrentStep(s => s + 1)} disabled={!canNext()} className="gap-2">
                Próximo <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => handleSave("rascunho")} disabled={isSaving} className="gap-2">
                  <Save className="h-4 w-4" />Salvar Rascunho
                </Button>
                <Button variant="secondary" onClick={() => handleSave("validar")} disabled={isSaving} className="gap-2">
                  <CheckCircle className="h-4 w-4" />Validar
                </Button>
                <Button onClick={() => handleSave("emitir")} disabled={isSaving} className="gap-2">
                  <Send className="h-4 w-4" />Emitir / Enviar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </SimpleFormWizard>
  );
}
