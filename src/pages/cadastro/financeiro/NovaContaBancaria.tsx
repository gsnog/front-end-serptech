import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Landmark } from "lucide-react";
import { useState } from "react";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { getNomeBanco, formatarCodigoBanco } from "@/data/bancos";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { createContaBancaria, contasBancariasQueryKey } from "@/services/financeiro";
import { fetchUnidades, unidadesQueryKey } from "@/services/estoque";

const NovaContaBancaria = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [unidade, setUnidade] = useState("");
  const { data: unidadesRaw = [] } = useQuery({ queryKey: [...unidadesQueryKey], queryFn: fetchUnidades });
  const unidades = Array.isArray(unidadesRaw) ? unidadesRaw : (unidadesRaw as any)?.results ?? [];

  const [tipo, setTipo] = useState("");
  // Os valores precisam casar EXATAMENTE com TIPOS_DE_CONTAS no model (inclui acentuação).
  const [tipoOptions, setTipoOptions] = useState([
    { value: "Corrente", label: "Corrente" },
    { value: "Poupança", label: "Poupança" },
    { value: "Investimento", label: "Investimento" },
    { value: "Caixa Pequeno", label: "Caixa Pequeno" },
  ]);
  const [codigoBanco, setCodigoBanco] = useState("");
  const [banco, setBanco] = useState("");
  const [bancoNaoEncontrado, setBancoNaoEncontrado] = useState(false);
  const [agencia, setAgencia] = useState("");
  const [numeroConta, setNumeroConta] = useState("");
  const [saldoInicial, setSaldoInicial] = useState("");

  const mutation = useMutation({
    mutationFn: createContaBancaria,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contasBancariasQueryKey });
      toast({ title: "Conta bancária salva!", description: "O registro foi salvo com sucesso." });
      navigate("/cadastro/financeiro/conta-bancaria");
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      const msg = data
        ? Object.values(data).flat().join(" ")
        : "Erro ao salvar conta bancária.";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    },
  });

  const handleCodigoBancoBlur = () => {
    if (!codigoBanco) return;
    const codigo = formatarCodigoBanco(codigoBanco);
    setCodigoBanco(codigo);
    const nome = getNomeBanco(codigo);
    if (nome) {
      setBanco(nome);
      setBancoNaoEncontrado(false);
    } else {
      setBancoNaoEncontrado(true);
    }
  };

  const handleCodigoBancoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, "").slice(0, 3);
    setCodigoBanco(valor);
    if (bancoNaoEncontrado) setBancoNaoEncontrado(false);
  };

  const handleSalvar = () => {
    if (!unidade) { toast({ title: "Selecione a unidade.", variant: "destructive" }); return; }
    if (!tipo) { toast({ title: "Informe o tipo da conta.", variant: "destructive" }); return; }
    if (!codigoBanco) { toast({ title: "Informe o código do banco.", variant: "destructive" }); return; }
    if (!banco.trim()) { toast({ title: "Informe o nome do banco.", variant: "destructive" }); return; }
    if (!agencia.trim()) { toast({ title: "Informe a agência.", variant: "destructive" }); return; }
    if (!numeroConta.trim()) { toast({ title: "Informe o número da conta.", variant: "destructive" }); return; }

    const saldo = saldoInicial
      ? parseFloat(saldoInicial.replace(/\./g, "").replace(",", "."))
      : 0;

    mutation.mutate({
      unidade: Number(unidade),
      tipo,
      codigo_banco: codigoBanco,
      banco: banco.trim(),
      agencia: agencia.trim(),
      numero_conta: numeroConta.trim(),
      saldo,
    });
  };

  const handleCancelar = () => {
    navigate("/cadastro/financeiro/conta-bancaria");
  };

  return (
    <SimpleFormWizard title="Nova Conta Bancária">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Landmark className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Conta Bancária</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
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
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={String(u.id)}>{u.unidade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DropdownWithAdd
                label="Tipo"
                required
                value={tipo}
                onChange={setTipo}
                options={tipoOptions}
                onAddNew={(name) => {
                  const newValue = name.toLowerCase().replace(/\s+/g, "-");
                  setTipoOptions(prev => [...prev, { value: newValue, label: name }]);
                  setTipo(newValue);
                }}
              />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Código do Banco <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ex: 341"
                  className="form-input"
                  value={codigoBanco}
                  onChange={handleCodigoBancoChange}
                  onBlur={handleCodigoBancoBlur}
                  maxLength={3}
                  inputMode="numeric"
                />
                {bancoNaoEncontrado && (
                  <p className="text-xs text-destructive">Código de banco não encontrado</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Banco <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Preenchido automaticamente"
                  className="form-input"
                  value={banco}
                  onChange={(e) => setBanco(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Agência <span className="text-destructive">*</span></Label>
                <Input
                  placeholder=""
                  className="form-input"
                  value={agencia}
                  onChange={(e) => setAgencia(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Número da Conta <span className="text-destructive">*</span></Label>
                <Input
                  placeholder=""
                  className="form-input"
                  value={numeroConta}
                  onChange={(e) => setNumeroConta(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Saldo Inicial</Label>
                <Input
                  placeholder="0,00"
                  className="form-input"
                  value={saldoInicial}
                  onChange={(e) => setSaldoInicial(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Após criação, o saldo só pode ser alterado pelo sistema</p>
              </div>
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={handleCancelar}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovaContaBancaria;
