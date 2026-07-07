import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Users, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { createCliente, clientesQueryKey } from "@/services/financeiro";
import { useCnpjLookup, formatCnpj } from "@/hooks/useCnpjLookup";

const NovoCliente = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tipo, setTipo] = useState<"convenio" | "procedencia" | "">("");
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");

  const mutation = useMutation({
    mutationFn: createCliente,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clientesQueryKey });
      toast({ title: "Cliente salvo!", description: "O registro foi salvo com sucesso." });
      navigate("/cadastro/financeiro/clientes");
    },
    onError: (error: any) => {
      const data = error?.response?.data;
      if (data) {
        const msgs = Object.entries(data)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
        toast({ title: "Erro ao salvar", description: msgs, variant: "destructive" });
      } else {
        toast({ title: "Erro ao salvar cliente.", variant: "destructive" });
      }
    },
  });

  const setFieldValue = (field: string, value: string) => {
    if (field === "nome") setNome(value);
    else if (field === "endereco") setEndereco(value);
    else if (field === "email") setEmail(value);
    else if (field === "telefone") setTelefone(value);
  };

  const { consultarCnpj, isSearching } = useCnpjLookup(setFieldValue);

  const handleSalvar = () => {
    if (!tipo) { toast({ title: "Selecione o tipo.", variant: "destructive" }); return; }
    if (!nome.trim()) { toast({ title: "Informe o nome.", variant: "destructive" }); return; }
    if (!cnpj.trim()) { toast({ title: "Informe o CNPJ.", variant: "destructive" }); return; }
    if (!endereco.trim()) { toast({ title: "Informe o endereço.", variant: "destructive" }); return; }
    if (!email.trim()) { toast({ title: "Informe o e-mail.", variant: "destructive" }); return; }
    if (!telefone.trim()) { toast({ title: "Informe o telefone.", variant: "destructive" }); return; }

    mutation.mutate({ tipo, nome, cnpj, endereco, email, telefone });
  };

  return (
    <SimpleFormWizard title="Novo Cliente">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Cliente</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tipo <span className="text-destructive">*</span></Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as "convenio" | "procedencia")}>
                  <SelectTrigger className="form-input">
                    <SelectValue placeholder="Selecionar tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    <SelectItem value="convenio">Convênio</SelectItem>
                    <SelectItem value="procedencia">Procedência</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Nome do cliente"
                  className="form-input"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">CNPJ <span className="text-destructive">*</span></Label>
                <div className="flex gap-3 items-center">
                  <Input
                    placeholder="00.000.000/0000-00"
                    className="form-input"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    maxLength={18}
                  />
                  <Button
                    className="btn-action px-6"
                    onClick={() => consultarCnpj(cnpj)}
                    disabled={isSearching}
                    type="button"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Consultar"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">E-mail <span className="text-destructive">*</span></Label>
                <Input
                  type="email"
                  placeholder="email@exemplo.com"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Telefone <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="(99) 9999-9999"
                  className="form-input"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Endereço <span className="text-destructive">*</span></Label>
              <Textarea
                placeholder="Endereço completo"
                className="form-input"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                rows={3}
              />
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/financeiro/clientes")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovoCliente;
