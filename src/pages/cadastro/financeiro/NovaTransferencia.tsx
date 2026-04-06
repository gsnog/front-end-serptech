import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { ArrowLeftRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  fetchContasBancarias, createTransferencia,
  contasBancariasQueryKey, type ContaBancaria,
} from "@/services/financeiro";

const contaLabel = (c: ContaBancaria) => {
  const partes = [c.banco || `Banco ${c.codigo_banco || c.id}`];
  if (c.numero_conta) partes.push(`nº ${c.numero_conta}`);
  if (c.tipo) partes.push(`(${c.tipo})`);
  return partes.join(" — ");
};

const NovaTransferencia = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [contaOrigem, setContaOrigem] = useState("");
  const [contaDestino, setContaDestino] = useState("");
  const [valor, setValor] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().split("T")[0]);

  const { data: contasRaw = [] } = useQuery({
    queryKey: contasBancariasQueryKey,
    queryFn: fetchContasBancarias,
  });
  const contas: ContaBancaria[] = Array.isArray(contasRaw)
    ? contasRaw
    : (contasRaw as any)?.results ?? [];

  const mutation = useMutation({
    mutationFn: createTransferencia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasBancariasQueryKey });
      toast({ title: "Transferência salva!", description: "O registro foi salvo com sucesso." });
      navigate("/cadastro/financeiro/transferencias");
    },
    onError: (error: any) => {
      const msg = error?.response?.data?.detail || "Erro ao salvar transferência.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!contaOrigem) { toast({ title: "Selecione a conta de origem.", variant: "destructive" }); return; }
    if (!contaDestino) { toast({ title: "Selecione a conta de destino.", variant: "destructive" }); return; }
    if (contaOrigem === contaDestino) { toast({ title: "Origem e destino não podem ser iguais.", variant: "destructive" }); return; }
    if (!valor || Number(valor) <= 0) { toast({ title: "Informe um valor válido.", variant: "destructive" }); return; }
    if (!data) { toast({ title: "Informe a data.", variant: "destructive" }); return; }
    const origem = contas.find(c => String(c.id) === contaOrigem);
    if (origem && origem.saldo != null && Number(valor) > origem.saldo) {
      toast({ title: "Saldo insuficiente", description: `Saldo disponível: R$ ${Number(origem.saldo).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, variant: "destructive" });
      return;
    }

    mutation.mutate({
      conta_origem: Number(contaOrigem),
      conta_destino: Number(contaDestino),
      valor: Number(valor),
      data_de_lancamento: data,
    } as any);
  };

  return (
    <SimpleFormWizard title="Nova Transferência">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Transferência</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Conta Origem <span className="text-destructive">*</span></Label>
                <Select value={contaOrigem} onValueChange={setContaOrigem}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar conta" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {contas
                      .filter(c => String(c.id) !== contaDestino)
                      .map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {contaLabel(c)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Conta Destino <span className="text-destructive">*</span></Label>
                <Select value={contaDestino} onValueChange={setContaDestino}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar conta" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {contas
                      .filter(c => String(c.id) !== contaOrigem)
                      .map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {contaLabel(c)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Valor <span className="text-destructive">*</span></Label>
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
                <Label className="text-sm font-medium">Data <span className="text-destructive">*</span></Label>
                <Input
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/financeiro/transferencias")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovaTransferencia;
