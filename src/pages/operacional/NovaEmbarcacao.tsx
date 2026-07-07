import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { DropdownWithAdd } from "@/components/DropdownWithAdd";
import { Ship } from "lucide-react";
import { useSaveWithDelay } from "@/hooks/useSaveWithDelay";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { createEmbarcacao } from "@/services/operacional";
import { toast } from "@/hooks/use-toast";

const validationFields = [
  { name: "nome", label: "Nome", required: true, minLength: 2, maxLength: 100 },
  { name: "setores", label: "Setores", required: true },
  { name: "cliente", label: "Cliente", required: true },
  { name: "dimensoes", label: "Dimensões", required: true },
];

const NovaEmbarcacao = () => {
  const navigate = useNavigate();
  const { handleSave, isSaving } = useSaveWithDelay();

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } = useFormValidation(
    { nome: "", setores: "", cliente: "", dimensoes: "" },
    validationFields
  );

  const [setorOptions, setSetorOptions] = useState([
    { value: "setor1", label: "Setor 1" }, { value: "setor2", label: "Setor 2" }
  ]);
  const [clienteOptions, setClienteOptions] = useState([
    { value: "cliente1", label: "Cliente 1" }, { value: "cliente2", label: "Cliente 2" }
  ]);

  const handleSalvar = async () => {
    if (validateAll()) {
      try {
        await createEmbarcacao(formData);
        await handleSave("/operacional/embarcacoes", "Embarcação salva com sucesso!");
      } catch (err: any) {
        toast({
          title: "Erro",
          description: err.response?.data?.error || "Erro ao salvar embarcação.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <SimpleFormWizard title="Nova Embarcação">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Ship className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados da Embarcação</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput label="Nome" required value={formData.nome} onChange={(e) => setFieldValue("nome", e.target.value)}
                onBlur={() => setFieldTouched("nome")} error={getFieldError("nome")} touched={touched.nome} />
              <DropdownWithAdd label="Setores" required value={formData.setores} onChange={(v) => setFieldValue("setores", v)}
                options={setorOptions} onAddNew={(item) => setSetorOptions(prev => [...prev, { value: item.toLowerCase().replace(/\s+/g, '_'), label: item }])} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DropdownWithAdd label="Cliente" required value={formData.cliente} onChange={(v) => setFieldValue("cliente", v)}
                options={clienteOptions} onAddNew={(item) => setClienteOptions(prev => [...prev, { value: item.toLowerCase().replace(/\s+/g, '_'), label: item }])} />
              <ValidatedInput label="Dimensões" required value={formData.dimensoes} onChange={(e) => setFieldValue("dimensoes", e.target.value)}
                onBlur={() => setFieldTouched("dimensoes")} error={getFieldError("dimensoes")} touched={touched.dimensoes} />
            </div>

            <FormActionBar onSave={handleSalvar} onCancel={() => navigate("/operacional/embarcacoes")} isSaving={isSaving} />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovaEmbarcacao;
