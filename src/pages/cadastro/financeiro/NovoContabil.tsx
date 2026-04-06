import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Calculator } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  createLancamentoContabil, lancamentosContabeisQueryKey,
  fetchPlanoContas, planoContasQueryKey,
} from "@/services/financeiro";
import { fetchUnidades, unidadesQueryKey } from "@/services/estoque";

const NovoContabil = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [data, setData] = useState(() => new Date().toISOString().split("T")[0]);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");
  const [tipo, setTipo] = useState<"debito" | "credito" | "">("");
  const [planoContas, setPlanoContas] = useState("");
  const [unidade, setUnidade] = useState("");

  const { data: planosRaw = [] } = useQuery({
    queryKey: [...planoContasQueryKey],
    queryFn: fetchPlanoContas,
  });
  const planos = Array.isArray(planosRaw) ? planosRaw : (planosRaw as any)?.results ?? [];

  const { data: unidadesRaw = [] } = useQuery({
    queryKey: [...unidadesQueryKey],
    queryFn: fetchUnidades,
  });
  const unidades = Array.isArray(unidadesRaw) ? unidadesRaw : (unidadesRaw as any)?.results ?? [];

  const mutation = useMutation({
    mutationFn: createLancamentoContabil,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: lancamentosContabeisQueryKey });
      toast({ title: "Lançamento salvo!", description: "O registro foi salvo com sucesso." });
      navigate("/cadastro/financeiro/contabil");
    },
    onError: (error: any) => {
      const d = error?.response?.data;
      const msg = d
        ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" | ")
        : "Erro ao salvar lançamento.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!data) { toast({ title: "Informe a data.", variant: "destructive" }); return; }
    if (!descricao.trim()) { toast({ title: "Informe a descrição.", variant: "destructive" }); return; }
    if (!valor || Number(valor) <= 0) { toast({ title: "Informe um valor válido.", variant: "destructive" }); return; }
    if (!tipo) { toast({ title: "Selecione o tipo.", variant: "destructive" }); return; }
    if (!planoContas) { toast({ title: "Selecione o plano de contas.", variant: "destructive" }); return; }
    if (!unidade) { toast({ title: "Selecione a unidade.", variant: "destructive" }); return; }

    mutation.mutate({
      data,
      descricao,
      valor: Number(valor),
      tipo: tipo as "debito" | "credito",
      plano_de_contas: Number(planoContas),
      unidade: Number(unidade),
    });
  };

  return (
    <SimpleFormWizard title="Novo Lançamento Contábil">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Lançamento Contábil</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo <span className="text-destructive">*</span></Label>
                <Select value={tipo} onValueChange={v => setTipo(v as "debito" | "credito")}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="debito">Débito</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Descrição <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Descrição do lançamento"
                  className="form-input"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor (R$) <span className="text-destructive">*</span></Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Plano de Contas <span className="text-destructive">*</span></Label>
                <Select value={planoContas} onValueChange={setPlanoContas}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar plano" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {planos.map((p: any) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.id_plano}{p.categoria_nome ? ` — ${p.categoria_nome}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Unidade <span className="text-destructive">*</span></Label>
                <Select value={unidade} onValueChange={setUnidade}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar unidade" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {unidades.map((u: any) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/financeiro/contabil")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovoContabil;
