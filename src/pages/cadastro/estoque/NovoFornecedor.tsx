import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Truck, Loader2 } from "lucide-react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedTextarea } from "@/components/ui/validated-textarea";
import { useCnpjLookup, formatCnpj } from "@/hooks/useCnpjLookup";
import { createFornecedor, fornecedoresQueryKey } from "@/services/estoque";
import { toast } from "@/hooks/use-toast";

const validationFields = [
  { name: "cnpj", label: "CNPJ", required: false },
  { name: "cpf", label: "CPF", required: false },
  { name: "nome", label: "Nome", required: true, minLength: 2, maxLength: 100 },
  { name: "razaoSocial", label: "Razão Social", required: false },
  { name: "endereco", label: "Endereço", required: false },
  { name: "vendedor", label: "Vendedor", required: false },
  {
    name: "email",
    label: "Email",
    required: false,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    patternMessage: "Email inválido"
  },
  { name: "telefone", label: "Telefone", required: false },
];

const NovoFornecedor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    formData,
    setFieldValue,
    setFieldTouched,
    validateAll,
    getFieldError,
    touched,
  } = useFormValidation(
    { cnpj: "", cpf: "", nome: "", razaoSocial: "", endereco: "", vendedor: "", email: "", telefone: "" },
    validationFields
  );

  const { consultarCnpj, isSearching } = useCnpjLookup(setFieldValue);

  const mutation = useMutation({
    mutationFn: createFornecedor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fornecedoresQueryKey });
      toast({ title: "Fornecedor salvo com sucesso!" });
      navigate("/cadastro/estoque/fornecedores");
    },
    onError: (error: any) => {
      const data = error.response?.data;
      const msg = data
        ? Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ")
        : "Verifique os dados e tente novamente.";
      toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!validateAll()) return;
    mutation.mutate({
      nome: formData.nome,
      cnpj: formData.cnpj || undefined,
      cpf: formData.cpf || undefined,
      razao_social: formData.razaoSocial || "",
      endereco: formData.endereco || "",
      vendedor: formData.vendedor || undefined,
      email: formData.email || undefined,
      telefone: formData.telefone || undefined,
    } as any);
  };

  return (
    <SimpleFormWizard title="Novo Fornecedor">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Fornecedor</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">CNPJ</Label>
                <div className="flex gap-3 items-center">
                  <Input
                    placeholder="00.000.000/0000-00"
                    className="form-input"
                    value={formData.cnpj}
                    onChange={(e) => setFieldValue("cnpj", formatCnpj(e.target.value))}
                    onBlur={() => setFieldTouched("cnpj")}
                    maxLength={18}
                  />
                  <Button
                    className="btn-action px-6"
                    onClick={() => consultarCnpj(formData.cnpj)}
                    disabled={isSearching}
                    type="button"
                  >
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Consultar"}
                  </Button>
                </div>
              </div>

              <ValidatedInput
                label="CPF"
                value={formData.cpf}
                onChange={(e) => setFieldValue("cpf", e.target.value)}
                onBlur={() => setFieldTouched("cpf")}
                error={getFieldError("cpf")}
                touched={touched.cpf}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput
                label="Nome"
                required
                value={formData.nome}
                onChange={(e) => setFieldValue("nome", e.target.value)}
                onBlur={() => setFieldTouched("nome")}
                error={getFieldError("nome")}
                touched={touched.nome}
              />

              <ValidatedInput
                label="Razão Social"
                value={formData.razaoSocial}
                onChange={(e) => setFieldValue("razaoSocial", e.target.value)}
                onBlur={() => setFieldTouched("razaoSocial")}
                error={getFieldError("razaoSocial")}
                touched={touched.razaoSocial}
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <ValidatedTextarea
                label="Endereço"
                value={formData.endereco}
                onChange={(e) => setFieldValue("endereco", e.target.value)}
                onBlur={() => setFieldTouched("endereco")}
                error={getFieldError("endereco")}
                touched={touched.endereco}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <ValidatedInput
                label="Vendedor"
                value={formData.vendedor}
                onChange={(e) => setFieldValue("vendedor", e.target.value)}
                onBlur={() => setFieldTouched("vendedor")}
                error={getFieldError("vendedor")}
                touched={touched.vendedor}
              />

              <ValidatedInput
                label="Email"
                type="email"
                placeholder="fornecedor@example.com"
                value={formData.email}
                onChange={(e) => setFieldValue("email", e.target.value)}
                onBlur={() => setFieldTouched("email")}
                error={getFieldError("email")}
                touched={touched.email}
              />

              <ValidatedInput
                label="Telefone"
                placeholder="(99) 9999-9999"
                value={formData.telefone}
                onChange={(e) => setFieldValue("telefone", e.target.value)}
                onBlur={() => setFieldTouched("telefone")}
                error={getFieldError("telefone")}
                touched={touched.telefone}
              />
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/estoque/fornecedores")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovoFornecedor;
