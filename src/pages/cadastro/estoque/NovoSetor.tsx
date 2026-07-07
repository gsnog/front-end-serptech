import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { SimpleFormWizard } from "@/components/SimpleFormWizard";
import { FormActionBar } from "@/components/FormActionBar";
import { Layers } from "lucide-react";
import { useFormValidation } from "@/hooks/useFormValidation";
import { ValidatedInput } from "@/components/ui/validated-input";
import { ValidatedSelect } from "@/components/ui/validated-select";
import { toast } from "@/hooks/use-toast";
import { createSetor, fetchFuncionarios, setoresQueryKey } from "@/services/pessoas";

const validationFields = [
  { name: "nome", label: "Nome do Setor", required: true, minLength: 2, maxLength: 100 },
];

const NovoSetor = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [responsavelId, setResponsavelId] = useState<string>("");

  const { formData, setFieldValue, setFieldTouched, validateAll, getFieldError, touched } =
    useFormValidation({ nome: "" }, validationFields);

  const { data: funcionarios = [] } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: fetchFuncionarios,
  });

  const responsavelOptions = funcionarios.map(f => ({ value: String(f.id), label: f.nome }));

  const mutation = useMutation({
    mutationFn: () => createSetor({
      nome: formData.nome.trim(),
      responsavel_id: responsavelId ? Number(responsavelId) : null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: setoresQueryKey });
      toast({ title: "Setor salvo com sucesso!" });
      navigate("/cadastro/estoque/setores");
    },
    onError: (error: any) => {
      const data = error.response?.data;
      const msg = data ? Object.values(data).flat().join(" | ") : "Verifique os dados e tente novamente.";
      toast({ title: "Erro ao salvar", description: msg, variant: "destructive" });
    },
  });

  const handleSalvar = () => {
    if (!validateAll()) return;
    mutation.mutate();
  };

  return (
    <SimpleFormWizard title="Novo Setor">
      <Card className="border-border shadow-lg">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center">
                <Layers className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-foreground">Dados do Setor</h2>
                <p className="text-sm text-muted-foreground">Preencha as informações abaixo</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ValidatedInput
                label="Nome do Setor"
                required
                value={formData.nome}
                onChange={(e) => setFieldValue("nome", e.target.value)}
                onBlur={() => setFieldTouched("nome")}
                error={getFieldError("nome")}
                touched={touched.nome}
              />
              <ValidatedSelect
                label="Responsável"
                value={responsavelId}
                onValueChange={setResponsavelId}
                placeholder="Selecionar responsável"
                options={responsavelOptions}
              />
            </div>

            <FormActionBar
              onSave={handleSalvar}
              onCancel={() => navigate("/cadastro/estoque/setores")}
              isSaving={mutation.isPending}
            />
          </div>
        </CardContent>
      </Card>
    </SimpleFormWizard>
  );
};

export default NovoSetor;
